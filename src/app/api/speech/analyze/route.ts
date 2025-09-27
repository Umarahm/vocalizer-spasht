import { NextRequest, NextResponse } from 'next/server';

interface SpeechAnalysisRequest {
  audioBlob: string; // base64 encoded audio
  expectedText?: string;
  language?: string;
  duration: number;
}

interface SpeechAnalysisResponse {
  transcription: string;
  confidence: number;
  accuracy: number;
  fluency: number;
  speed: number;
  duration: number;
  wordCount: number;
  wordsPerMinute: number;
  disfluencies: number;
  completion: boolean;
  error?: string;
}

interface AssemblyAIUploadResponse {
  upload_url: string;
}

interface AssemblyAITranscriptRequest {
  audio_url: string;
  language_code?: string;
  punctuate?: boolean;
  format_text?: boolean;
}

interface AssemblyAITranscriptResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text?: string;
  error?: string;
  confidence?: number;
  words?: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

// AssemblyAI API configuration
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY!;
const ASSEMBLYAI_BASE_URL = 'https://api.assemblyai.com/v2';

function detectDisfluencies(text: string): number {
  const disfluencyPatterns = [
    /\b(uh|um|er|ah|like|you know)\b/gi, // Filler words
    /(\w+)\s+\1/gi, // Word repetitions
    /-{2,}/g, // Dashes indicating hesitations
    /\.{3,}/g, // Ellipses indicating pauses
  ];

  let totalDisfluencies = 0;

  disfluencyPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      totalDisfluencies += matches.length;
    }
  });

  return totalDisfluencies;
}

function calculateSpeedScore(wpm: number): number {
  // Optimal speaking rate for clear speech is 120-160 wpm
  const optimalMin = 120;
  const optimalMax = 160;

  if (wpm < optimalMin) {
    // Too slow - score decreases linearly to 0.3 at 60 wpm
    return Math.max(0.3, (wpm / optimalMin) * 0.7);
  } else if (wpm > optimalMax) {
    // Too fast - score decreases linearly to 0.5 at 200 wpm
    return Math.max(0.5, 1 - ((wpm - optimalMax) / (200 - optimalMax)) * 0.5);
  } else {
    // Within optimal range - full score
    return 1.0;
  }
}

function calculateAccuracy(transcription: string, expected: string): number {
  // Simple accuracy calculation based on word overlap
  const transcriptWords = transcription.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const expectedWords = expected.toLowerCase().split(/\s+/).filter(w => w.length > 0);

  if (expectedWords.length === 0) return 0;

  // Calculate word-level accuracy
  let correctWords = 0;
  transcriptWords.forEach(word => {
    if (expectedWords.includes(word)) {
      correctWords++;
    }
  });

  // Bonus for word order (sequence matching)
  let sequenceBonus = 0;
  const minLength = Math.min(transcriptWords.length, expectedWords.length);
  for (let i = 0; i < minLength; i++) {
    if (transcriptWords[i] === expectedWords[i]) {
      sequenceBonus += 0.1; // Small bonus for each word in correct position
    }
  }

  const baseAccuracy = correctWords / expectedWords.length;
  const finalAccuracy = Math.min(1, baseAccuracy + sequenceBonus);

  return finalAccuracy;
}

function analyzeSpeech(transcription: string, duration: number, expectedText?: string): Omit<SpeechAnalysisResponse, 'error'> {
  const words = transcription.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  const wordsPerMinute = duration > 0 ? (wordCount / duration) * 60 : 0;

  // Calculate fluency score based on disfluencies
  const disfluencies = detectDisfluencies(transcription);
  const fluency = Math.max(0, Math.min(1, 1 - (disfluencies / wordCount) * 2));

  // Calculate speed score
  const speedScore = calculateSpeedScore(wordsPerMinute);

  // Calculate accuracy if expected text is provided
  const accuracy = expectedText
    ? calculateAccuracy(transcription, expectedText)
    : 0.8; // Default accuracy if no expected text

  // Calculate completion
  const completion = wordCount > 0 && duration > 1;

  // Overall confidence is a weighted average
  const confidence = (accuracy * 0.4) + (fluency * 0.3) + (speedScore * 0.2) + (completion ? 0.1 : 0);

  return {
    transcription: transcription.trim(),
    confidence: Math.max(0, Math.min(1, confidence)),
    accuracy,
    fluency,
    speed: wordsPerMinute,
    duration,
    wordCount,
    wordsPerMinute,
    disfluencies,
    completion
  };
}

// Helper function to upload audio to AssemblyAI
async function uploadAudioToAssemblyAI(audioBuffer: ArrayBuffer): Promise<string> {
  const uploadResponse = await fetch(`${ASSEMBLYAI_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': ASSEMBLYAI_API_KEY,
    },
    body: audioBuffer,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: ${uploadResponse.statusText}`);
  }

  const uploadData: AssemblyAIUploadResponse = await uploadResponse.json();
  return uploadData.upload_url;
}

// Helper function to request transcription
async function requestTranscription(audioUrl: string, languageCode: string = 'en'): Promise<string> {
  const transcriptRequest: AssemblyAITranscriptRequest = {
    audio_url: audioUrl,
    language_code: languageCode,
    punctuate: true,
    format_text: true,
  };

  const response = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript`, {
    method: 'POST',
    headers: {
      'Authorization': ASSEMBLYAI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transcriptRequest),
  });

  if (!response.ok) {
    throw new Error(`Transcription request failed: ${response.statusText}`);
  }

  const data: AssemblyAITranscriptResponse = await response.json();
  return data.id;
}

// Helper function to poll for transcription completion
async function pollTranscription(transcriptId: string, maxAttempts: number = 30): Promise<AssemblyAITranscriptResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript/${transcriptId}`, {
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Polling failed: ${response.statusText}`);
    }

    const data: AssemblyAITranscriptResponse = await response.json();

    if (data.status === 'completed') {
      return data;
    } else if (data.status === 'error') {
      throw new Error(`Transcription error: ${data.error}`);
    }

    // Wait 1 second before polling again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Transcription timed out');
}

export async function POST(request: NextRequest) {
  try {
    // Check if AssemblyAI API key is configured
    if (!ASSEMBLYAI_API_KEY) {
      return NextResponse.json(
        { error: 'AssemblyAI API key not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const expectedText = formData.get('expectedText') as string;
    const language = formData.get('language') as string || 'en';
    const duration = parseFloat(formData.get('duration') as string) || 0;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Expected audio file.' },
        { status: 400 }
      );
    }

    // Convert File to ArrayBuffer for upload
    const audioBuffer = await audioFile.arrayBuffer();

    // Step 1: Upload audio to AssemblyAI
    const uploadUrl = await uploadAudioToAssemblyAI(audioBuffer);

    // Step 2: Request transcription
    const transcriptId = await requestTranscription(uploadUrl, language);

    // Step 3: Poll for completion
    const transcriptResult = await pollTranscription(transcriptId);

    if (!transcriptResult.text) {
      throw new Error('No transcription text received');
    }

    // Analyze the speech
    const analysis = analyzeSpeech(transcriptResult.text, duration, expectedText);

    // Include AssemblyAI confidence if available
    if (transcriptResult.confidence !== undefined) {
      // Blend AssemblyAI confidence with our analysis
      analysis.confidence = (analysis.confidence * 0.7) + (transcriptResult.confidence * 0.3);
    }

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Speech analysis error:', error);

    let errorMessage = 'Speech analysis failed';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

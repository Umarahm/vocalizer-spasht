export interface SpeechAnalysisResult {
  transcription: string;
  confidence: number; // 0-1 scale
  accuracy: number; // 0-1 scale - how well it matches expected text
  fluency: number; // 0-1 scale - smoothness of speech
  speed: number; // words per minute
  duration: number; // recording duration in seconds
  wordCount: number;
  wordsPerMinute: number;
  disfluencies: number; // count of hesitations/stammers
  completion: boolean; // whether the challenge was completed
}

export interface SpeechEngineConfig {
  assemblyAiApiKey?: string; // Not used client-side, but kept for compatibility
  expectedText?: string; // for accuracy comparison
  language?: string;
}

export class SpeechEngine {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private config: SpeechEngineConfig;

  constructor(config: SpeechEngineConfig = {}) {
    this.config = {
      language: 'en',
      ...config
    };
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });

      // Store stream for later use
      this.stream = stream;
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  async startRecording(): Promise<void> {
    if (!this.stream) {
      throw new Error('Microphone permission not granted. Call requestMicrophonePermission() first.');
    }

    this.audioChunks = [];

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  // Note: Transcription is now handled server-side by the API route using AssemblyAI

  analyzeSpeech(transcription: string, duration: number): SpeechAnalysisResult {
    const words = transcription.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const wordsPerMinute = duration > 0 ? (wordCount / duration) * 60 : 0;

    // Calculate fluency score based on disfluencies (hesitations, repetitions, etc.)
    const disfluencies = this.detectDisfluencies(transcription);
    const fluency = Math.max(0, Math.min(1, 1 - (disfluencies / wordCount) * 2));

    // Calculate speed score (optimal speaking rate is 120-160 wpm)
    const speedScore = this.calculateSpeedScore(wordsPerMinute);

    // Calculate accuracy if expected text is provided
    const accuracy = this.config.expectedText
      ? this.calculateAccuracy(transcription, this.config.expectedText)
      : 0.8; // Default accuracy if no expected text

    // Calculate completion (whether they attempted to speak)
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

  private detectDisfluencies(text: string): number {
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

  private calculateSpeedScore(wpm: number): number {
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

  private calculateAccuracy(transcription: string, expected: string): number {
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

  async cleanup(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.audioChunks = [];
  }

  // Note: Full speech analysis pipeline is handled server-side via the API route
}

// Factory function for creating speech engine instances
export function createSpeechEngine(): SpeechEngine {
  return new SpeechEngine();
}

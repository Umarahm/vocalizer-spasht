'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Image from 'next/image';
import { Level } from '@/data/levels';
import { SpeechEngine, SpeechAnalysisResult } from '@/lib/speech/speechEngine';
import { VapiClient } from '@/lib/vapi/vapiClient';
import RecordingControls from '@/components/recording/RecordingControls';
import WaveformVisualization from '@/components/recording/WaveformVisualization';
import InterviewInterface from '@/components/recording/InterviewInterface';
import LevelSetup from '@/components/recording/LevelSetup';
import DebateTopicModal from '@/components/recording/DebateTopicModal';

interface LevelPageProps {
    level: Level;
    onBack: () => void;
    onComplete: (success: boolean, score: number, analysisData?: {
        transcription?: string;
        accuracy?: number;
        fluency?: number;
        wordsPerMinute?: number;
        durationSeconds?: number;
    }) => void;
}

export default function LevelPage({ level, onBack, onComplete }: LevelPageProps) {
    const isBossLevel = level.isBossLevel;
    const primaryColor = isBossLevel ? 'red' : 'emerald';
    const primaryColorHex = isBossLevel ? '#dc2626' : '#10b981';

    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingProgress, setRecordingProgress] = useState(0);
    const [timeLeft, setTimeLeft] = useState(level.timeLimit || 60);
    const [showResults, setShowResults] = useState(false);
    const [feedback, setFeedback] = useState<{
        score: number;
        message: string;
        skillsImproved: string[];
        transcription?: string;
        analysis?: SpeechAnalysisResult;
    } | null>(null);
    const [waveformData, setWaveformData] = useState<number[]>(Array.from({ length: 30 }, () => 20));
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [microphoneGranted, setMicrophoneGranted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [interviewType, setInterviewType] = useState<string>('');
    const [jobRole, setJobRole] = useState<string>('');
    const [showInterviewSetup, setShowInterviewSetup] = useState(false);
    const [showChatInterface, setShowChatInterface] = useState(false);
    const [conversation, setConversation] = useState<Array<{ id: string, type: 'ai' | 'user', message: string, timestamp: Date }>>([]);
    const [currentTranscription, setCurrentTranscription] = useState<string>('');
    const [isInterviewActive, setIsInterviewActive] = useState(false);
    const [vapiClient, setVapiClient] = useState<VapiClient | null>(null);
    const [isVapiConnected, setIsVapiConnected] = useState(false);
    const [isVapiSpeaking, setIsVapiSpeaking] = useState(false);
    const [troubleshootingSteps, setTroubleshootingSteps] = useState<string[]>([]);

    // Debate state variables
    const [debateTopic, setDebateTopic] = useState<string>('');
    const [debatePosition, setDebatePosition] = useState<'pro' | 'con' | ''>('');
    const [showDebateSetup, setShowDebateSetup] = useState(false);
    const [isDebateActive, setIsDebateActive] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const recordingRef = useRef<NodeJS.Timeout | null>(null);
    const debateTimerRef = useRef<NodeJS.Timeout | null>(null);
    const speechEngineRef = useRef<SpeechEngine | null>(null);
    const recordingStartTimeRef = useRef<number>(0);
    const audioChunksRef = useRef<Blob[]>([]);

    // VAPI Interview functions
    const startInterview = async () => {
        try {
            const vapiApiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;

            if (!vapiApiKey) {
                setError('VAPI API key not configured. Please add NEXT_PUBLIC_VAPI_API_KEY to your .env.local file.');
                return;
            }

            // Initialize VAPI client
            const client = new VapiClient({
                apiKey: vapiApiKey,
                interviewType,
                jobRole,
                assistant: {
                    name: 'Interview Assistant',
                    model: {
                        provider: 'openai',
                        model: 'gpt-4',
                        temperature: 0.7,
                        systemMessage: `You are a professional interviewer conducting a ${interviewType} interview for a ${jobRole} position. Ask relevant questions, listen carefully, and provide thoughtful follow-up questions. Keep the conversation natural and engaging. Start with a greeting and introduction question. Be professional, encouraging, and provide constructive feedback when appropriate.`
                    },
                    voice: {
                        provider: '11labs',
                        voiceId: 'professional-female'
                    }
                }
            });

            setVapiClient(client);

            // Set up VAPI event listeners
            client.on('connected', () => {
                setIsVapiConnected(true);
                setShowChatInterface(true);
                setIsInterviewActive(true);
                setConversation([]);

                // Add initial connection message
                const initialMessage = {
                    id: 'system-1',
                    type: 'ai' as const,
                    message: `🎯 VAPI Interview Connected - ${interviewType.toUpperCase()} Interview for ${jobRole}`,
                    timestamp: new Date()
                };
                setConversation([initialMessage]);
            });

            client.on('disconnected', () => {
                setIsVapiConnected(false);
                setIsInterviewActive(false);
            });

            client.on('speech-start', () => {
                setIsVapiSpeaking(true);
            });

            client.on('speech-end', () => {
                setIsVapiSpeaking(false);
            });

            client.on('message', (message: any) => {
                if (message.type === 'transcript' && message.role === 'assistant') {
                    addMessage('ai', message.content);
                }
            });

            client.on('error', (error: any) => {
                console.error('VAPI Error:', error);

                let errorMessage = 'Interview connection error. Please try again.';
                let troubleshootingSteps: string[] = [];

                if (error?.message) {
                    errorMessage = error.message;
                }

                if (error?.troubleshooting) {
                    troubleshootingSteps = error.troubleshooting;
                }

                // Set the main error message
                setError(errorMessage);

                // Set troubleshooting steps for UI display
                if (error?.troubleshooting) {
                    setTroubleshootingSteps(error.troubleshooting);
                }

                // Also log troubleshooting steps
                if (error?.troubleshooting && error.troubleshooting.length > 0) {
                    console.log('🔧 Troubleshooting steps:');
                    error.troubleshooting.forEach((step: string, index: number) => {
                        console.log(`${index + 1}. ${step}`);
                    });
                }
            });

            // Start the conversation
            await client.start();

        } catch (error) {
            console.error('Failed to start VAPI interview:', error);
            setError('Failed to connect to interview service. Please try again.');
        }
    };

    const addMessage = (type: 'ai' | 'user', message: string) => {
        const newMessage = {
            id: `${type}-${Date.now()}-${Math.random()}`,
            type,
            message,
            timestamp: new Date()
        };
        setConversation(prev => [...prev, newMessage]);
    };

    // Check if level image exists and can be loaded
    useEffect(() => {
        if (level.image) {
            setImageLoaded(false);
            setImageError(false);

            const img = new window.Image();
            img.onload = () => setImageLoaded(true);
            img.onerror = () => setImageError(true);
            img.src = level.image;
        }
    }, [level.image]);

    // Check if this is the Interview Master level
    useEffect(() => {
        if (level.name === 'Interview Master') {
            setShowInterviewSetup(true);
        } else {
            setShowInterviewSetup(false);
            setInterviewType('');
            setJobRole('');
        }
    }, [level.name]);

    // Check if this is the Debate Champion level
    useEffect(() => {
        if (level.name === 'Debate Champion') {
            setShowDebateSetup(true);
        } else {
            setShowDebateSetup(false);
            setDebateTopic('');
            setDebatePosition('');
        }
    }, [level.name]);

    // Cleanup VAPI client on unmount
    useEffect(() => {
        return () => {
            if (vapiClient) {
                vapiClient.stop();
            }
        };
    }, [vapiClient]);

    // Stop interview function
    const stopInterview = async () => {
        if (vapiClient) {
            try {
                await vapiClient.stop();
            } catch (error) {
                console.error('Error stopping VAPI interview:', error);
            }
        }
        setIsInterviewActive(false);
        setShowChatInterface(false);

        // For boss levels, show results when manually ended
        if (isBossLevel) {
            // Boss level completed successfully - show results
            setTimeout(() => {
                setFeedback({
                    score: 95,
                    message: "Boss level completed! You successfully conducted a professional interview with an AI interviewer.",
                    skillsImproved: level.skills.slice(0, 2),
                    transcription: 'Interview session completed successfully',
                    analysis: {
                        transcription: 'Interview session completed successfully',
                        confidence: 0.95,
                        accuracy: 0.95,
                        fluency: 0.95,
                        speed: 150,
                        duration: 180,
                        wordCount: 150,
                        wordsPerMinute: 150,
                        disfluencies: 2,
                        completion: true
                    }
                });
                setShowResults(true);
            }, 500); // Small delay to allow UI to update
        }
    };

    // VAPI Debate functions
    const startDebate = async () => {
        try {
            const vapiApiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;

            if (!vapiApiKey) {
                setError('VAPI API key not configured. Please add NEXT_PUBLIC_VAPI_API_KEY to your .env.local file.');
                return;
            }

            // Get topic label for display
            const topicLabels: { [key: string]: string } = {
                'climate-change': 'Climate Change Action',
                'artificial-intelligence': 'AI Regulation',
                'universal-basic-income': 'Universal Basic Income',
                'social-media-regulation': 'Social Media Censorship',
                'space-exploration': 'Space Exploration Priority',
                'cryptocurrency': 'Cryptocurrency Adoption',
                'remote-work': 'Remote Work Future',
                'animal-testing': 'Animal Testing Ban'
            };

            const topicLabel = topicLabels[debateTopic] || debateTopic;
            const opponentPosition = debatePosition === 'pro' ? 'con' : 'pro';

            // Initialize VAPI client for debate (use VAPI dashboard configuration)
            const client = new VapiClient({
                apiKey: vapiApiKey,
                interviewType: 'debate', // Reuse interviewType field for debate
                jobRole: `${debatePosition}_${debateTopic}`, // Store position and topic
                assistant: {} as any // Let VAPI dashboard handle assistant configuration
            });

            // Use different assistant ID for debate
            const debateAssistantId = '69a19b0d-42e8-432f-9bdf-91d5b8cf9c1e';

            setVapiClient(client);

            // Set up VAPI event listeners for debate
            client.on('connected', () => {
                console.log('VAPI debate connected - showing chat interface');
                setIsVapiConnected(true);
                setShowChatInterface(true);
                setIsDebateActive(true);
                setConversation([]);

                // Add initial debate start message
                const initialMessage = {
                    id: 'debate-start',
                    type: 'ai' as const,
                    message: `⚔️ DEBATE BEGINS: ${topicLabel.toUpperCase()} - You are ${debatePosition.toUpperCase()}, I am ${opponentPosition.toUpperCase()}. 3-minute time limit starts now!`,
                    timestamp: new Date()
                };
                setConversation([initialMessage]);
            });

            client.on('disconnected', () => {
                setIsVapiConnected(false);
                setIsDebateActive(false);
            });

            client.on('speech-start', () => {
                setIsVapiSpeaking(true);
            });

            client.on('speech-end', () => {
                setIsVapiSpeaking(false);
            });

            client.on('message', (message: any) => {
                if (message.type === 'transcript' && message.role === 'assistant') {
                    addMessage('ai', message.content);
                }
            });

            client.on('error', (error: any) => {
                console.error('VAPI Debate Error:', error);
                console.error('Full error object:', JSON.stringify(error, null, 2));

                let errorMessage = 'Debate connection error. Please try again.';
                let troubleshootingSteps: string[] = [];

                if (error?.message) {
                    errorMessage = error.message;
                }

                if (error?.troubleshooting) {
                    troubleshootingSteps = error.troubleshooting;
                }

                setError(errorMessage);
                if (error?.troubleshooting) {
                    setTroubleshootingSteps(error.troubleshooting);
                }

                if (error?.troubleshooting && error.troubleshooting.length > 0) {
                    console.log('🔧 Troubleshooting steps:');
                    error.troubleshooting.forEach((step: string, index: number) => {
                        console.log(`${index + 1}. ${step}`);
                    });
                }
            });

            // Start the debate with debate-specific assistant
            console.log('Starting debate with assistant ID:', debateAssistantId);
            await client.start(debateAssistantId);

            // Set up 3-minute debate timer
            debateTimerRef.current = setTimeout(async () => {
                console.log('Debate time limit reached (3 minutes). Auto-stopping debate...');
                if (isDebateActive) {
                    await stopDebate();
                    // Don't show error - results modal will appear
                }
            }, 180000); // 3 minutes = 180,000 milliseconds

        } catch (error) {
            console.error('Failed to start VAPI debate:', error);
            setError('Failed to connect to debate service. Please try again.');
        }
    };

    const stopDebate = async () => {
        // Clear debate timer
        if (debateTimerRef.current) {
            clearTimeout(debateTimerRef.current);
            debateTimerRef.current = null;
        }

        if (vapiClient) {
            try {
                await vapiClient.stop();
            } catch (error) {
                console.error('Error stopping VAPI debate:', error);
            }
        }
        setIsDebateActive(false);
        setShowChatInterface(false);

        // For boss levels, show results when manually ended
        if (isBossLevel) {
            // Boss level completed successfully - show results
            setTimeout(() => {
                setFeedback({
                    score: 95,
                    message: "Boss level completed! You successfully engaged in an intellectual debate with an AI opponent.",
                    skillsImproved: level.skills.slice(0, 2),
                    transcription: 'Debate session completed successfully',
                    analysis: {
                        transcription: 'Debate session completed successfully',
                        confidence: 0.95,
                        accuracy: 0.95,
                        fluency: 0.95,
                        speed: 150,
                        duration: 180,
                        wordCount: 150,
                        wordsPerMinute: 150,
                        disfluencies: 2,
                        completion: true
                    }
                });
                setShowResults(true);
            }, 500); // Small delay to allow UI to update
        }
    };

    const handleStartRecording = async () => {
        if (!microphoneGranted) {
            setError('Microphone permission required. Please allow microphone access.');
            return;
        }

        // For Interview Master level, ensure interview type and job role are selected
        if (showInterviewSetup && (!interviewType || !jobRole)) {
            setError('Please select both an interview type and job role before starting.');
            return;
        }

        // For Interview Master level, start the interview if not already started
        if (showInterviewSetup && !showChatInterface) {
            startInterview();
            return;
        }

        // For Debate Champion level, ensure debate topic and position are selected
        if (showDebateSetup && (!debateTopic || !debatePosition)) {
            console.log('Debate validation failed - missing topic or position. showDebateSetup:', showDebateSetup, 'debateTopic:', debateTopic, 'debatePosition:', debatePosition);
            setError('Please select both a debate topic and your position before starting.');
            return;
        }

        // For Debate Champion level, start the debate if not already started
        if (showDebateSetup && !showChatInterface) {
            console.log('Starting debate - showDebateSetup:', showDebateSetup, 'showChatInterface:', showChatInterface, 'debateTopic:', debateTopic, 'debatePosition:', debatePosition);
            startDebate();
            return;
        }

        try {
            setError(null);
            setIsRecording(true);
            setIsPaused(false);
            setRecordingProgress(0);
            setShowResults(false);
            setCurrentTranscription('');
            recordingStartTimeRef.current = Date.now();
            audioChunksRef.current = [];

            if (!speechEngineRef.current) {
                // Initialize speech engine (transcription handled server-side)
                speechEngineRef.current = new SpeechEngine();
            }

            await speechEngineRef.current.startRecording();
        } catch (error) {
            console.error('Failed to start recording:', error);
            setError('Failed to start recording. Please check your microphone.');
            setIsRecording(false);
        }
    };

    const handlePauseRecording = () => {
        setIsPaused(true);
        // Note: Real MediaRecorder doesn't support pause/resume in all browsers
        // This is a simplified implementation
    };

    const handleResumeRecording = () => {
        setIsPaused(false);
        // Note: Real MediaRecorder doesn't support pause/resume in all browsers
        // This is a simplified implementation
    };

    const analyzeSpeech = async (audioBlob: Blob, duration: number) => {
        setIsAnalyzing(true);

        try {
            // Create FormData for API request
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            // For Interview Master level, include interview details in the prompt
            const promptText = showInterviewSetup
                ? `${level.prompt} Interview Type: ${interviewType}, Job Role: ${jobRole}`
                : level.prompt;

            formData.append('expectedText', promptText);
            formData.append('duration', duration.toString());

            // Add interview metadata for Interview Master level
            if (showInterviewSetup) {
                formData.append('interviewType', interviewType);
                formData.append('jobRole', jobRole);
            }

            // Add debate metadata for Debate Champion level
            if (showDebateSetup) {
                formData.append('debateTopic', debateTopic);
                formData.append('debatePosition', debatePosition);
            }

            const response = await fetch('/api/speech/analyze', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Analysis failed: ${response.statusText}`);
            }

            const analysis: SpeechAnalysisResult = await response.json();

            // Handle Interview Master level differently
            if (showInterviewSetup && showChatInterface) {
                // For VAPI interviews, send transcription to VAPI client
                if (analysis.transcription && vapiClient && vapiClient.isActive) {
                    addMessage('user', analysis.transcription);
                    vapiClient.sendMessage(analysis.transcription);
                } else if (analysis.transcription) {
                    // Fallback for when VAPI is not connected
                    addMessage('user', analysis.transcription);
                }
                setIsAnalyzing(false);
                return;
            }

            // Handle Debate Champion level differently
            if (showDebateSetup && showChatInterface) {
                // For VAPI debates, send transcription to VAPI client
                if (analysis.transcription && vapiClient && vapiClient.isActive) {
                    addMessage('user', analysis.transcription);
                    vapiClient.sendMessage(analysis.transcription);
                } else if (analysis.transcription) {
                    // Fallback for when VAPI is not connected
                    addMessage('user', analysis.transcription);
                }
                setIsAnalyzing(false);
                return;
            }

            // Generate feedback based on analysis for regular levels
            const score = Math.round(analysis.confidence * 100);
            const feedbackMessage = generateFeedbackMessage(analysis);

            const feedbackResult = {
                score,
                message: feedbackMessage,
                skillsImproved: level.skills.slice(0, 2),
                transcription: analysis.transcription,
                analysis
            };

            setFeedback(feedbackResult);
            setShowResults(true);

        } catch (error) {
            console.error('Speech analysis failed:', error);

            // For interview mode, simulate transcription even on error
            if (showInterviewSetup && showChatInterface) {
                const simulatedTranscription = "Thank you for your response. I'm processing your answer...";
                addMessage('user', simulatedTranscription);
                setIsAnalyzing(false);
                return;
            }

            // For debate mode, simulate transcription even on error
            if (showDebateSetup && showChatInterface) {
                const simulatedTranscription = "Thank you for your argument. I'm formulating my response...";
                addMessage('user', simulatedTranscription);
                setIsAnalyzing(false);
                return;
            }

            setError('Speech analysis failed. Please try again.');

            // Fallback to basic feedback
            const fallbackScore = 70;
            const fallbackFeedback = {
                score: fallbackScore,
                message: "Recording completed! Check your results.",
                skillsImproved: level.skills.slice(0, 2)
            };

            setFeedback(fallbackFeedback);
            setShowResults(true);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const generateFeedbackMessage = (analysis: SpeechAnalysisResult): string => {
        const score = Math.round(analysis.confidence * 100);

        if (score >= 90) {
            return `Excellent! Perfect articulation with ${analysis.fluency > 0.8 ? 'excellent fluency' : 'good delivery'}!`;
        } else if (score >= 80) {
            return `Great job! ${analysis.accuracy > 0.8 ? 'Clear pronunciation' : 'Good effort'} with confident delivery!`;
        } else if (score >= 70) {
            return `Good work! ${analysis.fluency > 0.6 ? 'Keep building fluency' : 'Focus on smoother delivery'} for even better results!`;
        } else {
            return `Nice effort! ${analysis.accuracy < 0.5 ? 'Work on pronunciation clarity' : 'Practice pacing and confidence'} for improvement.`;
        }
    };

    const handleStopRecording = async () => {
        if (!speechEngineRef.current) return;

        try {
            setIsRecording(false);
            setIsPaused(false);

            const audioBlob = await speechEngineRef.current.stopRecording();
            const duration = (Date.now() - recordingStartTimeRef.current) / 1000;

            // Analyze the speech
            await analyzeSpeech(audioBlob, duration);

        } catch (error) {
            console.error('Failed to stop recording:', error);
            setError('Failed to process recording. Please try again.');
            setIsRecording(false);
            setIsPaused(false);
        }
    };

    const handleSubmitResults = () => {
        if (feedback) {
            const analysisData = feedback.analysis ? {
                transcription: feedback.transcription,
                accuracy: feedback.analysis.accuracy,
                fluency: feedback.analysis.fluency,
                wordsPerMinute: feedback.analysis.wordsPerMinute,
                durationSeconds: feedback.analysis.duration
            } : undefined;

            onComplete(feedback.score >= 70, feedback.score, analysisData);
        }
    };

    const handleScrollToChallenge = () => {
        const challengeElement = document.querySelector('.challenge-content');
        if (challengeElement) {
            challengeElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    useEffect(() => {
        // Initialize microphone permissions
        const initializeMicrophone = async () => {
            try {
                if (!speechEngineRef.current) {
                    speechEngineRef.current = new SpeechEngine();
                }

                const granted = await speechEngineRef.current.requestMicrophonePermission();
                setMicrophoneGranted(granted);

                if (!granted) {
                    setError('Microphone access denied. Please allow microphone permissions to continue.');
                }
            } catch (error) {
                console.error('Microphone initialization failed:', error);
                setError('Failed to initialize microphone. Please check your browser settings.');
            }
        };

        initializeMicrophone();

        // Generate mock waveform data
        const generateWaveform = () => {
            const data = Array.from({ length: 30 }, () => Math.random() * 100);
            setWaveformData(data);
        };
        generateWaveform();

        // Skip GSAP animations for now to avoid loading issues
        // gsap.from('.challenge-header', { y: -20, opacity: 0, duration: 0.5, ease: 'power2.out' });
        // gsap.from('.challenge-content', { opacity: 0, duration: 0.3, delay: 0.1, ease: 'power2.out' });
    }, []);

    // Timer countdown
    useEffect(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        if (isRecording && !isPaused) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        // Stop recording when time runs out
                        handleStopRecording();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isRecording, isPaused]);

    // Recording progress and waveform updates
    useEffect(() => {
        if (recordingRef.current) {
            clearInterval(recordingRef.current);
        }

        if (isRecording && !isPaused) {
            recordingRef.current = setInterval(() => {
                setRecordingProgress(prev => Math.min(prev + 2, 100));

                // Update waveform data during recording for visual feedback
                setWaveformData(prev => {
                    const newData = [...prev];
                    // Simulate audio levels during recording
                    for (let i = 0; i < newData.length; i++) {
                        newData[i] = Math.random() * 80 + 20; // 20-100 range
                    }
                    return newData;
                });
            }, 200);
        }

        return () => {
            if (recordingRef.current) {
                clearInterval(recordingRef.current);
                recordingRef.current = null;
            }
        };
    }, [isRecording, isPaused]);

    return (
        <div className={`min-h-screen p-4 relative overflow-hidden ${isBossLevel ? 'bg-gradient-to-b from-red-50 to-red-100' : 'bg-gradient-to-b from-emerald-50 to-green-100'}`}>
            {/* Background Elements - Same as ChallengeTimeline */}
            <div className="absolute inset-0 opacity-15">
                {/* Scattered Kenny UI elements */}
                <div className="absolute top-20 left-10 w-12 h-12">
                    <Image src="/kenny-assets/ui/PNG/Green/Default/star.png" alt="" fill className="object-contain" />
                </div>
                <div className="absolute top-40 right-20 w-10 h-10">
                    <Image src="/kenny-assets/ui/PNG/Yellow/Default/star.png" alt="" fill className="object-contain" />
                </div>
                <div className="absolute bottom-32 left-1/4 w-14 h-14">
                    <Image src="/kenny-assets/ui/PNG/Blue/Default/icon_circle.png" alt="" fill className="object-contain" />
                </div>
                <div className="absolute top-1/3 right-10 w-8 h-8">
                    <Image src="/kenny-assets/ui/PNG/Red/Default/icon_square.png" alt="" fill className="object-contain" />
                </div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Challenge Header */}
                <div className={`challenge-header bg-black border-4 rounded-none shadow-[12px_12px_0px_0px_${primaryColorHex}] p-6 mb-8 ${isBossLevel ? 'border-red-400' : 'border-emerald-400'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                            <button
                                onClick={onBack}
                                className="bg-gray-600 hover:bg-gray-700 border-2 border-black px-4 py-2 rounded-none shadow-[4px_4px_0px_0px_#000000] transition-all hover:shadow-[6px_6px_0px_0px_#000000]"
                            >
                                <span className="text-white font-black text-sm" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    ← BACK
                                </span>
                            </button>

                            <button
                                onClick={handleScrollToChallenge}
                                className={`border-2 border-black px-4 py-2 rounded-none shadow-[4px_4px_0px_0px_#000000] transition-all hover:shadow-[6px_6px_0px_0px_#000000] ${isBossLevel ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                                title="Scroll to Challenge Info"
                            >
                                <span className="text-white font-black text-sm" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    ↓ CHALLENGE
                                </span>
                            </button>

                            <div className="bg-red-500 border-2 border-black px-4 py-2 rounded-none">
                                <span className="text-white font-black text-lg" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                                    LEVEL {level.level}: {level.name.toUpperCase()}
                                </span>
                            </div>

                            <div className={`bg-${level.difficulty === 'easy' ? 'green' : level.difficulty === 'medium' ? 'yellow' : 'red'}-400 border-2 border-black px-4 py-2 rounded-none`}>
                                <span className="text-black font-black text-lg" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    {level.difficulty.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* Timer */}
                        <div className="bg-white border-4 border-black rounded-none p-3 shadow-[4px_4px_0px_0px_#000000]">
                            <div className="flex items-center space-x-2">
                                <span className="font-black text-black text-lg" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>TIME</span>
                                <div className={`border-2 border-black px-3 py-1 rounded-none ${timeLeft <= 10 ? 'bg-red-400' : 'bg-emerald-400'}`}>
                                    <span className="font-black text-black font-mono">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Challenge Content */}
                <div className={`challenge-content border-4 rounded-none shadow-[12px_12px_0px_0px_#000000] p-8 mb-8 ${isBossLevel ? 'bg-red-50 border-red-400' : 'bg-white border-black'}`}>
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Left Side - Challenge Prompt */}
                        <div>
                            <h3 className="text-2xl font-black text-black mb-6" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                                {(showInterviewSetup || showDebateSetup) ? (
                                    showInterviewSetup ? 'INTERVIEW SETUP' : 'DEBATE SETUP'
                                ) : 'CHALLENGE PROMPT'}
                            </h3>

                            {/* Interview Setup for Interview Master Level */}
                            {showInterviewSetup && (
                                <LevelSetup
                                    showInterviewSetup={showInterviewSetup}
                                    interviewType={interviewType}
                                    jobRole={jobRole}
                                    error={error}
                                    troubleshootingSteps={troubleshootingSteps}
                                    onInterviewTypeChange={setInterviewType}
                                    onJobRoleChange={setJobRole}
                                    onStopInterview={stopInterview}
                                    showChatInterface={showChatInterface}
                                />
                            )}

                            {/* Debate Setup for Debate Champion Level */}
                            {showDebateSetup && (
                                <DebateTopicModal
                                    showDebateSetup={showDebateSetup}
                                    debateTopic={debateTopic}
                                    debatePosition={debatePosition}
                                    error={error}
                                    troubleshootingSteps={troubleshootingSteps}
                                    onDebateTopicChange={setDebateTopic}
                                    onDebatePositionChange={(position) => setDebatePosition(position)}
                                    onStopDebate={stopDebate}
                                    showChatInterface={showChatInterface}
                                />
                            )}

                            <InterviewInterface
                                interviewType={interviewType}
                                jobRole={jobRole}
                                debateTopic={debateTopic}
                                debatePosition={debatePosition}
                                isDebateMode={showDebateSetup}
                                isActive={showChatInterface}
                                vapiClient={vapiClient}
                                currentTranscription={currentTranscription}
                                isRecording={isRecording}
                                isAnalyzing={isAnalyzing}
                                conversation={conversation}
                                isVapiConnected={isVapiConnected}
                                isVapiSpeaking={isVapiSpeaking}
                                onAddMessage={addMessage}
                                onSendToVapi={(transcription) => vapiClient?.sendMessage(transcription)}
                            />

                            {/* Regular Challenge Prompt */}
                            {!showInterviewSetup && !showDebateSetup && (
                                <div className="bg-gray-100 border-2 border-black p-6 rounded-none mb-6">
                                    <p className="text-black font-medium text-lg italic leading-relaxed">
                                        "{level.prompt}"
                                    </p>
                                </div>
                            )}

                            {/* Image Display for Visual Challenges */}
                            {level.image && (
                                <div className="mb-6">
                                    <h4 className="text-lg font-black text-black mb-3" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                        VISUAL REFERENCE:
                                    </h4>
                                    <div className="bg-gray-100 border-2 border-black p-4 rounded-none">
                                        <div className="relative w-full h-64 border-2 border-black rounded-none overflow-hidden bg-gray-50">
                                            {imageLoaded && !imageError ? (
                                                <Image
                                                    src={level.image}
                                                    alt={`Visual reference for Level ${level.level}`}
                                                    fill
                                                    className="object-contain"
                                                    onError={() => setImageError(true)}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <div className="text-center">
                                                        <div className="text-gray-500 mb-2">
                                                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-gray-600 font-medium text-sm mb-1">
                                                            {imageError ? 'Image not found' : 'Loading image...'}
                                                        </p>
                                                        <p className="text-gray-500 text-xs">Path: {level.image}</p>
                                                        {imageError && (
                                                            <p className="text-red-500 text-xs mt-2">
                                                                ⚠️ Please check that the image file exists at this path
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-gray-600 text-sm mt-2 italic">
                                            * This level includes a visual element to help with your challenge
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="mb-6">
                                <h4 className="text-lg font-black text-black mb-3" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    SKILLS TO PRACTICE:
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {level.skills.map((skill, index) => (
                                        <span
                                            key={index}
                                            className={`border-2 border-black px-3 py-1 rounded-none text-black font-black text-sm ${isBossLevel ? 'bg-red-400' : 'bg-emerald-400'}`}
                                            style={{ fontFamily: 'Kenney Future Narrow, monospace' }}
                                        >
                                            {skill.toUpperCase()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Level Background Image */}
                            <div className="relative w-full h-48 border-2 border-black rounded-none overflow-hidden">
                                <Image
                                    src={level.backgroundImage}
                                    alt={`Level ${level.level} background`}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                    <span className="text-white font-black text-2xl" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                                        LEVEL {level.level}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Recording Interface */}
                        <div>
                            <h3 className="text-2xl font-black text-black mb-6" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                                RECORDING STUDIO
                            </h3>

                            <WaveformVisualization
                                waveformData={waveformData}
                                isRecording={isRecording}
                                isBossLevel={isBossLevel}
                            />

                            <RecordingControls
                                isRecording={isRecording}
                                isPaused={isPaused}
                                isAnalyzing={isAnalyzing}
                                recordingProgress={recordingProgress}
                                timeLeft={timeLeft}
                                microphoneGranted={microphoneGranted}
                                error={error}
                                isBossLevel={isBossLevel}
                                primaryColor={primaryColor}
                                onStartRecording={handleStartRecording}
                                onPauseRecording={handlePauseRecording}
                                onResumeRecording={handleResumeRecording}
                                onStopRecording={handleStopRecording}
                            />
                        </div>
                    </div>
                </div>

                {/* Results Panel */}
                {showResults && feedback && (
                    <div className={`results-panel border-4 rounded-none shadow-[12px_12px_0px_0px_#000000] p-8 ${isBossLevel ? 'bg-red-50 border-red-400' : 'bg-white border-black'}`}>
                        <div className="text-center mb-6">
                            <h3 className="text-3xl font-black text-black mb-4" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                                CHALLENGE COMPLETE!
                            </h3>

                            <div className={`inline-block border-4 rounded-none px-8 py-4 mb-4 ${isBossLevel ? 'border-red-400' : 'border-black'} ${feedback.score >= 90 ? (isBossLevel ? 'bg-red-500' : 'bg-emerald-400') : feedback.score >= 70 ? 'bg-yellow-400' : (isBossLevel ? 'bg-red-700' : 'bg-red-400')}`}>
                                <span className="text-black font-black text-4xl" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                                    SCORE: {feedback.score}/100
                                </span>
                            </div>

                            <p className="text-black font-medium text-lg mb-6">
                                {feedback.message}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h4 className="text-xl font-black text-black mb-3" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    SPEECH ANALYSIS:
                                </h4>
                                {feedback.analysis && (
                                    <div className="space-y-3 mb-4">
                                        <div className="bg-gray-100 border-2 border-black p-3 rounded-none">
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="font-black text-black">ACCURACY:</span>
                                                    <div className="w-full bg-gray-200 h-2 mt-1">
                                                        <div
                                                            className="bg-green-500 h-2"
                                                            style={{ width: `${feedback.analysis.accuracy * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs">{Math.round(feedback.analysis.accuracy * 100)}%</span>
                                                </div>
                                                <div>
                                                    <span className="font-black text-black">FLUENCY:</span>
                                                    <div className="w-full bg-gray-200 h-2 mt-1">
                                                        <div
                                                            className="bg-blue-500 h-2"
                                                            style={{ width: `${feedback.analysis.fluency * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs">{Math.round(feedback.analysis.fluency * 100)}%</span>
                                                </div>
                                                <div>
                                                    <span className="font-black text-black">SPEED:</span>
                                                    <span className="text-xs">{Math.round(feedback.analysis.wordsPerMinute)} WPM</span>
                                                </div>
                                                <div>
                                                    <span className="font-black text-black">WORDS:</span>
                                                    <span className="text-xs">{feedback.analysis.wordCount}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {feedback.transcription && (
                                            <div className="bg-yellow-100 border-2 border-black p-3 rounded-none">
                                                <h5 className="font-black text-black text-sm mb-2">YOUR TRANSCRIPTION:</h5>
                                                <p className="text-black text-sm italic">"{feedback.transcription}"</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <h4 className="text-xl font-black text-black mb-3" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    SKILLS IMPROVED:
                                </h4>
                                <div className="space-y-2">
                                    {feedback.skillsImproved.map((skill, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <span className={`font-black ${isBossLevel ? 'text-red-600' : 'text-emerald-600'}`}>✓</span>
                                            <span className="text-black font-medium">{skill}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xl font-black text-black mb-3" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    REWARDS EARNED:
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between bg-yellow-400 border-2 border-black p-2 rounded-none">
                                        <span className="font-black text-black">COINS:</span>
                                        <span className="font-black text-black">{level.rewardCoins}</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-blue-400 border-2 border-black p-2 rounded-none">
                                        <span className="font-black text-black">XP:</span>
                                        <span className="font-black text-black">{level.rewardXP}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={handleSubmitResults}
                                className={`border-2 border-black px-8 py-4 rounded-none shadow-[4px_4px_0px_0px_#000000] transition-all hover:shadow-[6px_6px_0px_0px_#000000] mr-4 ${isBossLevel ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                            >
                                <span className="text-white font-black text-xl" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                                    CONTINUE →
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

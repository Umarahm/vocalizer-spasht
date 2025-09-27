'use client';

import { useState } from 'react';
import { SpeechAnalysisResult } from '@/lib/speech/speechEngine';

interface RecordingControlsProps {
    isRecording: boolean;
    isPaused: boolean;
    isAnalyzing: boolean;
    recordingProgress: number;
    timeLeft: number;
    microphoneGranted: boolean;
    error: string | null;
    isBossLevel: boolean;
    primaryColor: string;
    onStartRecording: () => void;
    onPauseRecording: () => void;
    onResumeRecording: () => void;
    onStopRecording: () => void;
}

export default function RecordingControls({
    isRecording,
    isPaused,
    isAnalyzing,
    recordingProgress,
    timeLeft,
    microphoneGranted,
    error,
    isBossLevel,
    primaryColor,
    onStartRecording,
    onPauseRecording,
    onResumeRecording,
    onStopRecording
}: RecordingControlsProps) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="recording-controls space-y-4">
            {/* Progress Bar */}
            {isRecording && (
                <div className="mb-6">
                    <div className="bg-gray-200 border-2 border-black rounded-none h-4">
                        <div
                            className={`h-full transition-all duration-300 ${isBossLevel ? 'bg-red-400' : 'bg-emerald-400'}`}
                            style={{ width: `${recordingProgress}%` }}
                        />
                    </div>
                    <div className="text-center mt-2">
                        <span className="font-black text-black text-sm" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                            PROGRESS: {recordingProgress}%
                        </span>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-4 bg-red-100 border-2 border-red-400 rounded-none">
                    <p className="text-red-800 font-black text-sm" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                        ⚠️ {error}
                    </p>
                </div>
            )}

            {/* Recording Controls */}
            <div className="recording-controls space-y-4">
                {isAnalyzing ? (
                    <div className="w-full bg-blue-500 border-2 border-black py-4 rounded-none shadow-[4px_4px_0px_0px_#000000] transition-all">
                        <span className="text-white font-black text-xl" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                            🔍 ANALYZING SPEECH...
                        </span>
                    </div>
                ) : !isRecording ? (
                    <button
                        onClick={onStartRecording}
                        disabled={!microphoneGranted}
                        className={`w-full border-2 border-black py-4 rounded-none shadow-[4px_4px_0px_0px_#000000] transition-all hover:shadow-[6px_6px_0px_0px_#000000] ${microphoneGranted
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <span className="text-white font-black text-xl" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                            {microphoneGranted ? ' START RECORDING' : ' ENABLE MICROPHONE'}
                        </span>
                    </button>
                ) : (
                    <div className="space-y-3">
                        {isPaused ? (
                            <button
                                onClick={onResumeRecording}
                                className={`w-full border-2 border-black py-4 rounded-none shadow-[4px_4px_0px_0px_#000000] transition-all hover:shadow-[6px_6px_0px_0px_#000000] ${isBossLevel ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                            >
                                <span className="text-white font-black text-xl" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                                    ▶️ RESUME
                                </span>
                            </button>
                        ) : (
                            <button
                                onClick={onPauseRecording}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 border-2 border-black py-4 rounded-none shadow-[4px_4px_0px_0px_#000000] transition-all hover:shadow-[6px_6px_0px_0px_#000000]"
                            >
                                <span className="text-white font-black text-xl" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                                    ⏸️ PAUSE
                                </span>
                            </button>
                        )}

                        <button
                            onClick={onStopRecording}
                            className="w-full bg-gray-600 hover:bg-gray-700 border-2 border-black py-3 rounded-none shadow-[4px_4px_0px_0px_#000000] transition-all hover:shadow-[6px_6px_0px_0px_#000000]"
                        >
                            <span className="text-white font-black text-lg" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                🛑 STOP & SUBMIT
                            </span>
                        </button>
                    </div>
                )}

                <div className="bg-yellow-400 border-2 border-black p-4 rounded-none">
                    <p className="text-black font-black text-center text-sm" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                        💡 TIP: Speak clearly and at a natural pace. Focus on proper articulation!
                    </p>
                </div>
            </div>
        </div>
    );
}

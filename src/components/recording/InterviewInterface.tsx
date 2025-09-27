'use client';

import { useEffect, useRef, useState } from 'react';
import { VapiClient } from '@/lib/vapi/vapiClient';

interface InterviewInterfaceProps {
    interviewType?: string;
    jobRole?: string;
    debateTopic?: string;
    debatePosition?: string;
    isDebateMode?: boolean;
    isActive: boolean;
    vapiClient: VapiClient | null;
    currentTranscription: string;
    isRecording: boolean;
    isAnalyzing: boolean;
    conversation: Array<{ id: string, type: 'ai' | 'user', message: string, timestamp: Date }>;
    isVapiConnected: boolean;
    isVapiSpeaking: boolean;
    onAddMessage: (type: 'ai' | 'user', message: string) => void;
    onSendToVapi: (transcription: string) => void;
}

export default function InterviewInterface({
    interviewType,
    jobRole,
    debateTopic,
    debatePosition,
    isDebateMode = false,
    isActive,
    vapiClient,
    currentTranscription,
    isRecording,
    isAnalyzing,
    conversation,
    isVapiConnected,
    isVapiSpeaking,
    onAddMessage,
    onSendToVapi
}: InterviewInterfaceProps) {
    const conversationEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of conversation
    useEffect(() => {
        if (conversationEndRef.current) {
            conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [conversation]);

    if (!isActive) return null;

    return (
        <div className="mb-6">
            <h4 className="text-lg font-black text-black mb-3" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                {isDebateMode ? 'DEBATE CONVERSATION:' : 'INTERVIEW CONVERSATION:'}
            </h4>
            <div className="bg-white border-2 border-black rounded-none">
                {/* Chat Header */}
                <div className="bg-gray-100 border-b-2 border-black p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${isVapiConnected ? (isVapiSpeaking ? 'bg-red-500 animate-pulse' : 'bg-green-500') : 'bg-gray-400'
                                }`}></div>
                            <span className="text-black font-black text-sm" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                {isDebateMode
                                    ? `DEBATE CHAMPION: ${debateTopic?.replace('-', ' ').toUpperCase()} • ${debatePosition?.toUpperCase()}`
                                    : `VAPI INTERVIEW: ${interviewType?.toUpperCase()} • ${jobRole?.toUpperCase()}`
                                }
                            </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                            {isVapiConnected && (
                                <>
                                    <span className="text-green-600 font-bold">🟢 VAPI</span>
                                    {isVapiSpeaking && <span className="text-red-600 font-bold animate-pulse">🎤 SPEAKING</span>}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="h-96 overflow-y-auto p-4 space-y-4">
                    {conversation.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-none border-2 border-black ${message.type === 'user'
                                ? 'bg-blue-500 text-white border-blue-600'
                                : 'bg-gray-100 text-black border-gray-300'
                                }`}>
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className={`text-xs font-black ${message.type === 'user' ? 'text-blue-100' : 'text-gray-600'
                                        }`}>
                                        {message.type === 'ai' ? '🤖 INTERVIEWER' : '🎤 YOU'}
                                    </span>
                                    <span className={`text-xs ${message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                                        }`}>
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-sm leading-relaxed">{message.message}</p>
                            </div>
                        </div>
                    ))}

                    {/* Current Transcription */}
                    {(isRecording || isAnalyzing) && (
                        <div className="flex justify-end">
                            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-none border-2 border-blue-400 bg-blue-100 text-black">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-xs font-black text-blue-700">🎤 SPEAKING</span>
                                    <div className="flex space-x-1">
                                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                                <p className="text-sm italic text-blue-800">
                                    {currentTranscription || 'Listening...'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* AI Thinking/Speaking Indicator */}
                    {(isAnalyzing || isVapiSpeaking) && (
                        <div className="flex justify-start">
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-none border-2 ${isVapiSpeaking ? 'border-red-400 bg-red-50 text-black' : 'border-blue-400 bg-blue-50 text-black'
                                }`}>
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className={`text-xs font-black ${isVapiSpeaking ? 'text-red-600' : 'text-blue-600'
                                        }`}>
                                        {isVapiSpeaking ? '🎤 VAPI SPEAKING' : '🤖 VAPI THINKING'}
                                    </span>
                                    <div className="flex space-x-1">
                                        <div className={`w-1 h-1 rounded-full animate-pulse ${isVapiSpeaking ? 'bg-red-500' : 'bg-blue-500'
                                            }`}></div>
                                        <div className={`w-1 h-1 rounded-full animate-pulse ${isVapiSpeaking ? 'bg-red-500' : 'bg-blue-500'
                                            }`} style={{ animationDelay: '0.2s' }}></div>
                                        <div className={`w-1 h-1 rounded-full animate-pulse ${isVapiSpeaking ? 'bg-red-500' : 'bg-blue-500'
                                            }`} style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                                <p className={`text-sm italic ${isVapiSpeaking ? 'text-red-700' : 'text-blue-700'
                                    }`}>
                                    {isVapiSpeaking ? 'AI interviewer is speaking...' : 'AI is processing your response...'}
                                </p>
                            </div>
                        </div>
                    )}

                    <div ref={conversationEndRef} />
                </div>

                {/* Interview Status */}
                <div className="bg-gray-100 border-t-2 border-black p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-black font-medium text-sm">
                                    {isActive ? 'Interview Active' : 'Interview Ended'}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${isVapiConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                <span className="text-xs font-bold text-gray-700">
                                    VAPI {isVapiConnected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>
                        </div>
                        {conversation.length > 0 && (
                            <div className="text-right">
                                <span className="text-gray-600 text-xs block">
                                    {conversation.length} exchanges
                                </span>
                                <span className="text-gray-500 text-xs">
                                    Powered by VAPI AI
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { SpeechAnalysisResult } from '@/lib/speech/speechEngine';

interface SpeechAnalysisProps {
    analysis: SpeechAnalysisResult | null;
    transcription?: string;
    score: number;
    message: string;
    skillsImproved: string[];
    levelRewardCoins: number;
    levelRewardXP: number;
    isBossLevel: boolean;
    onContinue: () => void;
}

export default function SpeechAnalysis({
    analysis,
    transcription,
    score,
    message,
    skillsImproved,
    levelRewardCoins,
    levelRewardXP,
    isBossLevel,
    onContinue
}: SpeechAnalysisProps) {
    return (
        <div className="text-center mb-6">
            <h3 className="text-3xl font-black text-black mb-4" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                CHALLENGE COMPLETE!
            </h3>

            <div className={`inline-block border-4 rounded-none px-8 py-4 mb-4 ${isBossLevel ? 'border-red-400' : 'border-black'} ${score >= 90 ? (isBossLevel ? 'bg-red-500' : 'bg-emerald-400') : score >= 70 ? 'bg-yellow-400' : (isBossLevel ? 'bg-red-700' : 'bg-red-400')}`}>
                <span className="text-black font-black text-4xl" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                    SCORE: {score}/100
                </span>
            </div>

            <p className="text-black font-medium text-lg mb-6">
                {message}
            </p>
        </div>
    );
}




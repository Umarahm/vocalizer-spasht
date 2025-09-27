'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { levels, Level } from '@/data/levels';
import LevelPage from '@/components/LevelPage';
import { ClientAuth } from '@/lib/auth/auth';

export default function LevelRoute() {
    const params = useParams();
    const router = useRouter();
    const [level, setLevel] = useState<Level | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentSessionKey, setCurrentSessionKey] = useState<string | null>(null);

    useEffect(() => {
        const initializeLevel = async () => {
            const levelId = parseInt(params.id as string);
            const foundLevel = levels.find(l => l.id === levelId);

            if (foundLevel) {
                setLevel(foundLevel);

                // Start a new session when entering a level
                try {
                    const response = await fetch('/api/session', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...ClientAuth.getAuthHeaders(),
                        },
                        body: JSON.stringify({
                            action: 'start'
                        }),
                    });

                    if (response.ok) {
                        const result = await response.json();
                        setCurrentSessionKey(result.data.session_key);
                        console.log('Session started:', result.data.session_key);
                    } else {
                        console.error('Failed to start session');
                    }
                } catch (error) {
                    console.error('Error starting session:', error);
                }
            } else {
                // Level not found, redirect to home
                router.push('/');
            }

            setLoading(false);
        };

        initializeLevel();
    }, [params.id, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-green-100 flex items-center justify-center">
                <div className="text-black font-black text-xl">Loading Level...</div>
            </div>
        );
    }

    if (!level) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-green-100 flex items-center justify-center">
                <div className="text-black font-black text-xl">Level not found</div>
            </div>
        );
    }

    const handleBack = () => {
        router.push('/');
    };

    const handleComplete = async (success: boolean, score: number, analysisData?: {
        transcription?: string;
        accuracy?: number;
        fluency?: number;
        wordsPerMinute?: number;
        durationSeconds?: number;
    }) => {
        if (!currentSessionKey) {
            console.error('No active session found');
            return;
        }

        try {
            // Save progress to database with session key
            const response = await fetch('/api/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...ClientAuth.getAuthHeaders(),
                },
                body: JSON.stringify({
                    sessionKey: currentSessionKey,
                    levelId: level.id,
                    success,
                    score,
                    transcription: analysisData?.transcription,
                    accuracy: analysisData?.accuracy,
                    fluency: analysisData?.fluency,
                    wordsPerMinute: analysisData?.wordsPerMinute,
                    durationSeconds: analysisData?.durationSeconds,
                    coinsEarned: success ? level.rewardCoins : 0,
                    xpEarned: success ? level.rewardXP : 0
                }),
            });

            if (!response.ok) {
                console.error('Failed to save progress:', response.statusText);
                // Continue anyway - don't block the user experience
            }

            // End the session
            try {
                await fetch('/api/session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...ClientAuth.getAuthHeaders(),
                    },
                    body: JSON.stringify({
                        action: 'end',
                        sessionData: {
                            totalTimeSeconds: 0, // TODO: Track actual time spent
                            levelsAttempted: 1,
                            levelsCompleted: success ? 1 : 0,
                            totalCoinsEarned: success ? level.rewardCoins : 0,
                            totalXpEarned: success ? level.rewardXP : 0,
                            currentLevel: level.level
                        }
                    }),
                });
            } catch (error) {
                console.error('Error ending session:', error);
            }

        } catch (error) {
            console.error('Error saving progress:', error);
            // Continue anyway - don't block the user experience
        }

        // Redirect back to timeline
        router.push('/');
    };

    return (
        <LevelPage
            level={level}
            onBack={handleBack}
            onComplete={handleComplete}
        />
    );
}

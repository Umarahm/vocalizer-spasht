import { NextRequest, NextResponse } from 'next/server';
import { ServerAuthService } from '@/lib/auth/server-auth';
import { DatabaseService } from '@/lib/db/service';
import { User } from '@/lib/db/client';

export async function GET(request: NextRequest) {
    try {
        // First check if access_key is provided as a query parameter (for external scraping)
        const { searchParams } = new URL(request.url);
        const accessKeyParam = searchParams.get('access_key');

        let user: User;

        if (accessKeyParam) {
            // Authenticate using access key from query parameter
            const authResult = await ServerAuthService.validateAccessKey(accessKeyParam);
            if (!authResult.success) {
                return NextResponse.json(
                    { error: 'Invalid access key' },
                    { status: 401 }
                );
            }
            user = authResult.user!;
        } else {
            // Use traditional authentication (cookie or header)
            const authResult = await ServerAuthService.requireAuth(request);
            if ('error' in authResult) {
                return authResult.error;
            }
            user = authResult.user!;
        }

        // Parse query parameters for pagination
        const recentActivityLimit = parseInt(searchParams.get('recentActivityLimit') || '10');
        const sessionLimit = parseInt(searchParams.get('sessionLimit') || '5');
        const includeTrends = searchParams.get('includeTrends') !== 'false'; // Default true

        // Get user data with full analytics
        const userData = await DatabaseService.getUserData(user.access_key);

        if (!userData) {
            return NextResponse.json(
                { error: 'User data not found' },
                { status: 404 }
            );
        }

        // Get detailed progress history for analytics (all attempts, not just completed levels)
        const allProgress = await DatabaseService.getAllUserProgress(user.access_key);

        // Calculate real-time analytics from progress data
        const totalLevelsCompleted = userData.completedLevels.length;
        const totalCoins = userData.totalCoins;
        const totalXP = userData.totalXP;
        const currentStreak = userData.currentStreak;

        // Calculate performance metrics from all progress data
        const validProgress = allProgress.filter(p => p.score > 0);
        const averageScore = validProgress.length > 0
            ? validProgress.reduce((sum, p) => sum + p.score, 0) / validProgress.length
            : 0;

        const validAccuracy = allProgress.filter(p => p.accuracy !== null && p.accuracy !== undefined);
        const averageAccuracy = validAccuracy.length > 0
            ? validAccuracy.reduce((sum, p) => sum + p.accuracy!, 0) / validAccuracy.length
            : 0;

        const validFluency = allProgress.filter(p => p.fluency !== null && p.fluency !== undefined);
        const averageFluency = validFluency.length > 0
            ? validFluency.reduce((sum, p) => sum + p.fluency!, 0) / validFluency.length
            : 0;

        const validWPM = allProgress.filter(p => p.words_per_minute !== null && p.words_per_minute !== undefined);
        const averageWPM = validWPM.length > 0
            ? validWPM.reduce((sum, p) => sum + p.words_per_minute!, 0) / validWPM.length
            : 0;

        // Calculate session and time stats
        const uniqueSessions = new Set(allProgress.map(p => p.session_key)).size;
        const totalTimeSpent = allProgress.reduce((sum, p) => sum + (p.duration_seconds || 0), 0);

        // Calculate best streak from progress data
        let bestStreak = 0;
        let currentStreakCalc = 0;
        const sortedProgress = [...allProgress].sort((a, b) =>
            new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
        );

        for (const progress of sortedProgress) {
            if (progress.success) {
                currentStreakCalc++;
                bestStreak = Math.max(bestStreak, currentStreakCalc);
            } else {
                currentStreakCalc = 0;
            }
        }

        // Use cached stats if available and more accurate, otherwise use calculated values
        const finalAverageScore = (userData.stats?.average_score && userData.stats.average_score > 0)
            ? userData.stats.average_score : averageScore;
        const finalAverageAccuracy = (userData.stats?.average_accuracy && userData.stats.average_accuracy > 0)
            ? userData.stats.average_accuracy : averageAccuracy;
        const finalAverageFluency = (userData.stats?.average_fluency && userData.stats.average_fluency > 0)
            ? userData.stats.average_fluency : averageFluency;
        const finalAverageWPM = (userData.stats?.average_words_per_minute && userData.stats.average_words_per_minute > 0)
            ? userData.stats.average_words_per_minute : averageWPM;
        const finalTotalSessions = userData.stats?.total_sessions || uniqueSessions;
        const finalTotalTime = userData.stats?.total_time_seconds || totalTimeSpent;
        const finalBestStreak = Math.max(userData.stats?.best_streak || 0, bestStreak);

        // Calculate comprehensive analytics
        const analytics = {
            user: {
                id: userData.user.id,
                access_key: userData.user.access_key,
                created_at: userData.user.created_at,
                last_active: userData.user.last_active
            },
            overview: {
                total_levels_completed: totalLevelsCompleted,
                current_level: userData.currentLevel,
                total_coins: totalCoins,
                total_xp: totalXP,
                current_streak: currentStreak,
                total_sessions: finalTotalSessions,
                total_time_spent_seconds: finalTotalTime
            },
            performance: {
                average_score: finalAverageScore,
                average_accuracy: finalAverageAccuracy,
                average_fluency: finalAverageFluency,
                average_words_per_minute: finalAverageWPM,
                best_streak: finalBestStreak
            },
            recent_activity: allProgress
                .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
                .slice(0, recentActivityLimit)
                .map(progress => ({
                    session_key: progress.session_key,
                    level_id: progress.level_id,
                    completed_at: progress.completed_at,
                    success: progress.success,
                    score: progress.score,
                    accuracy: progress.accuracy,
                    fluency: progress.fluency,
                    words_per_minute: progress.words_per_minute,
                    duration_seconds: progress.duration_seconds,
                    transcription: progress.transcription
                })),
            level_breakdown: allProgress.reduce((acc: Record<number, {
                level_id: number;
                attempts: number;
                successful_attempts: number;
                best_score: number;
                average_score: number;
                average_accuracy: number;
                average_fluency: number;
                average_words_per_minute: number;
                last_attempt: Date | null;
            }>, progress) => {
                const levelId = progress.level_id;
                if (!acc[levelId]) {
                    acc[levelId] = {
                        level_id: levelId,
                        attempts: 0,
                        successful_attempts: 0,
                        best_score: 0,
                        average_score: 0,
                        average_accuracy: 0,
                        average_fluency: 0,
                        average_words_per_minute: 0,
                        last_attempt: null
                    };
                }

                acc[levelId].attempts++;
                if (progress.success) {
                    acc[levelId].successful_attempts++;
                    acc[levelId].best_score = Math.max(acc[levelId].best_score, progress.score);
                }

                // Calculate running averages
                const current = acc[levelId];
                const count = current.attempts;
                current.average_score = ((current.average_score * (count - 1)) + progress.score) / count;
                if (progress.accuracy) {
                    current.average_accuracy = ((current.average_accuracy * (count - 1)) + progress.accuracy) / count;
                }
                if (progress.fluency) {
                    current.average_fluency = ((current.average_fluency * (count - 1)) + progress.fluency) / count;
                }
                if (progress.words_per_minute) {
                    current.average_words_per_minute = ((current.average_words_per_minute * (count - 1)) + progress.words_per_minute) / count;
                }

                if (!current.last_attempt || new Date(progress.completed_at) > new Date(current.last_attempt)) {
                    current.last_attempt = progress.completed_at;
                }

                return acc;
            }, {}),
            sessions: {
                // Group activities by session (limit for performance)
                session_breakdown: Object.fromEntries(
                    Object.entries(allProgress.reduce((acc: Record<string, {
                        session_key: string;
                        start_time: Date;
                        levels_completed: number;
                        total_score: number;
                        average_accuracy: number;
                        average_fluency: number;
                        average_words_per_minute: number;
                        total_coins_earned: number;
                        total_xp_earned: number;
                        activities: any[];
                    }>, progress) => {
                        const sessionKey = progress.session_key;
                        if (!acc[sessionKey]) {
                            acc[sessionKey] = {
                                session_key: sessionKey,
                                start_time: progress.completed_at, // Approximate session start
                                levels_completed: 0,
                                total_score: 0,
                                average_accuracy: 0,
                                average_fluency: 0,
                                average_words_per_minute: 0,
                                total_coins_earned: 0,
                                total_xp_earned: 0,
                                activities: []
                            };
                        }

                        acc[sessionKey].levels_completed++;
                        acc[sessionKey].total_score += progress.score;
                        acc[sessionKey].total_coins_earned += progress.coins_earned;
                        acc[sessionKey].total_xp_earned += progress.xp_earned;

                        // Calculate running averages
                        const session = acc[sessionKey];
                        if (progress.accuracy) {
                            session.average_accuracy = ((session.average_accuracy * (session.levels_completed - 1)) + progress.accuracy) / session.levels_completed;
                        }
                        if (progress.fluency) {
                            session.average_fluency = ((session.average_fluency * (session.levels_completed - 1)) + progress.fluency) / session.levels_completed;
                        }
                        if (progress.words_per_minute) {
                            session.average_words_per_minute = ((session.average_words_per_minute * (session.levels_completed - 1)) + progress.words_per_minute) / session.levels_completed;
                        }

                        session.activities.push({
                            level_id: progress.level_id,
                            completed_at: progress.completed_at,
                            success: progress.success,
                            score: progress.score,
                            accuracy: progress.accuracy,
                            fluency: progress.fluency,
                            words_per_minute: progress.words_per_minute,
                            duration_seconds: progress.duration_seconds,
                            transcription: progress.transcription
                        });

                        return acc;
                    }, {})).slice(0, sessionLimit))
            },
            ...(includeTrends ? {
                trends: {
                    // Group by date for the last 30 days
                    daily_progress: allProgress.reduce((acc: Record<string, {
                        date: string;
                        levels_completed: number;
                        total_score: number;
                        average_accuracy: number;
                        average_fluency: number;
                        unique_sessions: number;
                    }>, progress) => {
                        const date = new Date(progress.completed_at).toISOString().split('T')[0];
                        if (!acc[date]) {
                            acc[date] = {
                                date,
                                levels_completed: 0,
                                total_score: 0,
                                average_accuracy: 0,
                                average_fluency: 0,
                                unique_sessions: 0
                            };
                        }
                        acc[date].levels_completed++;
                        acc[date].total_score += progress.score;
                        if (progress.accuracy) acc[date].average_accuracy += progress.accuracy;
                        if (progress.fluency) acc[date].average_fluency += progress.fluency;
                        return acc;
                    }, {}),

                    // Convert Sets to counts for JSON serialization
                    processed_daily_progress: Object.values(allProgress.reduce((acc: Record<string, {
                        date: string;
                        levels_completed: number;
                        total_score: number;
                        average_accuracy: number;
                        average_fluency: number;
                        sessions: Set<string>;
                    }>, progress) => {
                        const date = new Date(progress.completed_at).toISOString().split('T')[0];
                        if (!acc[date]) {
                            acc[date] = {
                                date,
                                levels_completed: 0,
                                total_score: 0,
                                average_accuracy: 0,
                                average_fluency: 0,
                                sessions: new Set()
                            };
                        }
                        acc[date].levels_completed++;
                        acc[date].total_score += progress.score;
                        acc[date].sessions.add(progress.session_key);
                        if (progress.accuracy) acc[date].average_accuracy += progress.accuracy;
                        if (progress.fluency) acc[date].average_fluency += progress.fluency;
                        return acc;
                    }, {})).map(day => ({
                        ...day,
                        unique_sessions: day.sessions.size
                    })),

                    // Calculate improvement over time
                    improvement: allProgress.length > 1 ? (() => {
                        const sorted = allProgress.sort((a, b) =>
                            new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
                        );
                        const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
                        const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

                        const avgFirst = firstHalf.reduce((sum, p) => sum + p.score, 0) / firstHalf.length;
                        const avgSecond = secondHalf.reduce((sum, p) => sum + p.score, 0) / secondHalf.length;

                        return {
                            score_improvement: avgSecond - avgFirst,
                            accuracy_improvement: (() => {
                                const accFirst = firstHalf.filter(p => p.accuracy).reduce((sum, p) => sum + p.accuracy!, 0) / firstHalf.filter(p => p.accuracy).length || 0;
                                const accSecond = secondHalf.filter(p => p.accuracy).reduce((sum, p) => sum + p.accuracy!, 0) / secondHalf.filter(p => p.accuracy).length || 0;
                                return accSecond - accFirst;
                            })(),
                            fluency_improvement: (() => {
                                const flFirst = firstHalf.filter(p => p.fluency).reduce((sum, p) => sum + p.fluency!, 0) / firstHalf.filter(p => p.fluency).length || 0;
                                const flSecond = secondHalf.filter(p => p.fluency).reduce((sum, p) => sum + p.fluency!, 0) / secondHalf.filter(p => p.fluency).length || 0;
                                return flSecond - flFirst;
                            })()
                        };
                    })() : null
                }
            } : {})
        };

        return NextResponse.json({
            success: true,
            analytics
        });

    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
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
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

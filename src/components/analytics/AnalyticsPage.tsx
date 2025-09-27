'use client';

import { useEffect, useState } from 'react';
import { ClientAuth } from '@/lib/auth/auth';
import Image from 'next/image';

interface AnalyticsData {
    user: {
        id: number;
        access_key: string;
        created_at: string;
        last_active: string;
    };
    overview: {
        total_levels_completed: number;
        current_level: number;
        total_coins: number;
        total_xp: number;
        current_streak: number;
        total_sessions: number;
        total_time_spent_seconds: number;
    };
    performance: {
        average_score: number;
        average_accuracy: number;
        average_fluency: number;
        average_words_per_minute: number;
        best_streak: number;
    };
    recent_activity: Array<{
        session_key: string;
        level_id: number;
        completed_at: string;
        success: boolean;
        score: number;
        accuracy: number | null;
        fluency: number | null;
        words_per_minute: number | null;
        duration_seconds: number | null;
        transcription: string | null;
    }>;
    sessions: {
        session_breakdown: Record<string, {
            session_key: string;
            start_time: string;
            levels_completed: number;
            total_score: number;
            average_accuracy: number;
            average_fluency: number;
            average_words_per_minute: number;
            total_coins_earned: number;
            total_xp_earned: number;
            activities: Array<any>;
        }>;
    };
    trends?: {
        daily_progress: Record<string, any>;
        processed_daily_progress?: Array<{
            date: string;
            levels_completed: number;
            total_score: number;
            average_accuracy: number;
            average_fluency: number;
            unique_sessions: number;
        }>;
        improvement: any;
    };
}

interface AnalyticsPageProps {
    onBack: () => void;
}

export default function AnalyticsPage({ onBack }: AnalyticsPageProps) {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // Use pagination to reduce data load
                const params = new URLSearchParams({
                    recentActivityLimit: '20', // Show more recent activities
                    sessionLimit: '10',       // Show more sessions
                    includeTrends: 'true'     // Include trend analysis
                });

                const response = await fetch(`/api/analytics?${params}`, {
                    headers: ClientAuth.getAuthHeaders(),
                });

                if (response.ok) {
                    const data = await response.json();
                    setAnalytics(data.analytics);
                } else {
                    setError('Failed to load analytics');
                }
            } catch (err) {
                setError('Network error loading analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-green-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent mb-4"></div>
                    <div className="text-black font-black text-xl" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                        LOADING ANALYTICS...
                    </div>
                </div>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-green-100 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-100 border-4 border-red-400 rounded-none p-8 text-center">
                        <h2 className="text-2xl font-black text-red-800 mb-4" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                            ANALYTICS ERROR
                        </h2>
                        <p className="text-red-700 mb-6">{error || 'Failed to load analytics data'}</p>
                        <button
                            onClick={onBack}
                            className="bg-red-500 hover:bg-red-600 border-2 border-black px-6 py-3 rounded-none shadow-[4px_4px_0px_0px_#000000] transition-all hover:shadow-[6px_6px_0px_0px_#000000] text-white font-black"
                            style={{ fontFamily: 'Kenney Future, sans-serif' }}
                        >
                            ← BACK TO GAME
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-green-100 p-4">
            {/* Background Elements */}
            <div className="absolute inset-0 opacity-15">
                <div className="absolute top-20 left-10 w-12 h-12">
                    <Image src="/kenny-assets/ui/PNG/Green/Default/star.png" alt="" fill className="object-contain" />
                </div>
                <div className="absolute top-40 right-20 w-10 h-10">
                    <Image src="/kenny-assets/ui/PNG/Yellow/Default/star.png" alt="" fill className="object-contain" />
                </div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="bg-black border-4 border-emerald-400 rounded-none shadow-[12px_12px_0px_0px_#10b981] p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                                SPEECH ANALYTICS
                            </h1>
                            <p className="text-emerald-400 font-black text-sm" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                TRACK YOUR PROGRESS • MASTER YOUR VOICE
                            </p>
                        </div>
                        <button
                            onClick={onBack}
                            className="bg-gray-600 hover:bg-gray-700 border-2 border-black px-4 py-2 rounded-none shadow-[4px_4px_0px_0px_#000000] transition-all hover:shadow-[6px_6px_0px_0px_#000000] text-white font-black"
                            style={{ fontFamily: 'Kenney Future Narrow, monospace' }}
                        >
                            ← BACK
                        </button>
                    </div>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white border-4 border-black rounded-none p-4 shadow-[8px_8px_0px_0px_#000000]">
                        <div className="text-center">
                            <div className="text-3xl font-black text-black" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                                {analytics.overview.total_levels_completed}
                            </div>
                            <div className="text-xs font-black text-gray-600 uppercase" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                Levels Completed
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-400 border-4 border-black rounded-none p-4 shadow-[8px_8px_0px_0px_#000000]">
                        <div className="text-center">
                            <div className="text-3xl font-black text-black" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                                {analytics.overview.total_coins}
                            </div>
                            <div className="text-xs font-black text-black uppercase" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                Total Coins
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-400 border-4 border-black rounded-none p-4 shadow-[8px_8px_0px_0px_#000000]">
                        <div className="text-center">
                            <div className="text-3xl font-black text-white" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                                {analytics.overview.total_xp}
                            </div>
                            <div className="text-xs font-black text-white uppercase" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                Total XP
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-400 border-4 border-black rounded-none p-4 shadow-[8px_8px_0px_0px_#000000]">
                        <div className="text-center">
                            <div className="text-3xl font-black text-black" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                                {analytics.overview.current_streak}
                            </div>
                            <div className="text-xs font-black text-black uppercase" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                Current Streak
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white border-4 border-black rounded-none p-6 shadow-[8px_8px_0px_0px_#000000]">
                        <h3 className="text-xl font-black text-black mb-4" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                            PERFORMANCE METRICS
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="font-black text-gray-700" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    Average Score:
                                </span>
                                <span className="font-black text-black text-lg">
                                    {Number(analytics.performance.average_score || 0).toFixed(1)}/100
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-black text-gray-700" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    Average Accuracy:
                                </span>
                                <span className="font-black text-black text-lg">
                                    {(Number(analytics.performance.average_accuracy || 0) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-black text-gray-700" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    Average Fluency:
                                </span>
                                <span className="font-black text-black text-lg">
                                    {(Number(analytics.performance.average_fluency || 0) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-black text-gray-700" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    Words/Minute:
                                </span>
                                <span className="font-black text-black text-lg">
                                    {Number(analytics.performance.average_words_per_minute || 0).toFixed(1)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-black text-gray-700" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    Best Streak:
                                </span>
                                <span className="font-black text-black text-lg">
                                    {analytics.performance.best_streak || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-100 border-4 border-black rounded-none p-6 shadow-[8px_8px_0px_0px_#000000]">
                        <h3 className="text-xl font-black text-black mb-4" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                            ACTIVITY SUMMARY
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="font-black text-gray-700" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    Total Sessions:
                                </span>
                                <span className="font-black text-black text-lg">
                                    {analytics.overview.total_sessions || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-black text-gray-700" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    Time Spent:
                                </span>
                                <span className="font-black text-black text-lg">
                                    {formatTime(analytics.overview.total_time_spent_seconds || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-black text-gray-700" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    Current Level:
                                </span>
                                <span className="font-black text-black text-lg">
                                    {analytics.overview.current_level}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-black text-gray-700" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    Member Since:
                                </span>
                                <span className="font-black text-black text-sm">
                                    {formatDate(analytics.user.created_at)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-black text-gray-700" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    Last Active:
                                </span>
                                <span className="font-black text-black text-sm">
                                    {formatDate(analytics.user.last_active)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white border-4 border-black rounded-none p-6 mb-8 shadow-[8px_8px_0px_0px_#000000]">
                    <h3 className="text-xl font-black text-black mb-4" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                        RECENT ACTIVITY
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {analytics.recent_activity.map((activity, index) => (
                            <div key={index} className="border-2 border-gray-200 rounded-none p-3">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center space-x-3">
                                        <span className={`font-black text-xs px-2 py-1 rounded-none ${activity.success
                                            ? 'bg-green-400 text-black'
                                            : 'bg-red-400 text-white'
                                            }`} style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                            {activity.success ? '✓ PASS' : '✗ FAIL'}
                                        </span>
                                        <span className="font-black text-black" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                            LEVEL {activity.level_id}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-black text-sm">
                                            {activity.score}/100
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            {formatDate(activity.completed_at)}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-xs">
                                    {activity.accuracy !== null && activity.accuracy !== undefined && (
                                        <div>
                                            <span className="text-gray-600">Accuracy:</span>
                                            <span className="font-black ml-1">{(Number(activity.accuracy) * 100).toFixed(0)}%</span>
                                        </div>
                                    )}
                                    {activity.fluency !== null && activity.fluency !== undefined && (
                                        <div>
                                            <span className="text-gray-600">Fluency:</span>
                                            <span className="font-black ml-1">{(Number(activity.fluency) * 100).toFixed(0)}%</span>
                                        </div>
                                    )}
                                    {activity.words_per_minute !== null && activity.words_per_minute !== undefined && (
                                        <div>
                                            <span className="text-gray-600">WPM:</span>
                                            <span className="font-black ml-1">{Number(activity.words_per_minute).toFixed(1)}</span>
                                        </div>
                                    )}
                                </div>
                                {activity.transcription && (
                                    <div className="mt-2 p-2 bg-gray-50 rounded-none text-xs italic text-gray-700">
                                        "{activity.transcription.length > 100
                                            ? activity.transcription.substring(0, 100) + '...'
                                            : activity.transcription}"
                                    </div>
                                )}
                            </div>
                        ))}
                        {analytics.recent_activity.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <div className="text-4xl mb-2">📊</div>
                                <div className="font-black" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    No recent activity found
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Session Breakdown */}
                {Object.keys(analytics.sessions.session_breakdown).length > 0 && (
                    <div className="bg-blue-50 border-4 border-blue-400 rounded-none p-6 shadow-[8px_8px_0px_0px_#3b82f6]">
                        <h3 className="text-xl font-black text-black mb-4" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                            SESSION ANALYSIS
                        </h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {Object.values(analytics.sessions.session_breakdown).map((session: any) => (
                                <div key={session.session_key} className="bg-white border-2 border-blue-300 rounded-none p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-black text-blue-800 text-sm" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                            Session: {session.session_key.substring(0, 20)}...
                                        </span>
                                        <span className="font-black text-black">
                                            {session.levels_completed} levels
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-xs">
                                        <div>
                                            <span className="text-gray-600">Avg Score:</span>
                                            <span className="font-black ml-1">{(session.total_score / session.levels_completed).toFixed(1)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Coins:</span>
                                            <span className="font-black ml-1 text-yellow-600">{session.total_coins_earned}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">XP:</span>
                                            <span className="font-black ml-1 text-blue-600">{session.total_xp_earned}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Date:</span>
                                            <span className="font-black ml-1">{formatDate(session.start_time)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Trends & Improvement */}
                {analytics.trends?.improvement && (
                    <div className="bg-green-50 border-4 border-green-400 rounded-none p-6 shadow-[8px_8px_0px_0px_#22c55e]">
                        <h3 className="text-xl font-black text-black mb-4" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                            PERFORMANCE TRENDS
                        </h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-white border-2 border-green-300 rounded-none p-4">
                                <h4 className="font-black text-green-800 mb-2" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    SCORE IMPROVEMENT
                                </h4>
                                <div className="text-2xl font-black text-black">
                                    {(analytics.trends.improvement.score_improvement || 0) >= 0 ? '+' : ''}
                                    {(analytics.trends.improvement.score_improvement || 0).toFixed(1)} pts
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    Comparing first vs second half of activities
                                </div>
                            </div>

                            <div className="bg-white border-2 border-green-300 rounded-none p-4">
                                <h4 className="font-black text-green-800 mb-2" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    ACCURACY IMPROVEMENT
                                </h4>
                                <div className="text-2xl font-black text-black">
                                    {(analytics.trends.improvement.accuracy_improvement || 0) >= 0 ? '+' : ''}
                                    {((analytics.trends.improvement.accuracy_improvement || 0) * 100).toFixed(1)}%
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    Speech accuracy progress
                                </div>
                            </div>

                            <div className="bg-white border-2 border-green-300 rounded-none p-4">
                                <h4 className="font-black text-green-800 mb-2" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    FLUENCY IMPROVEMENT
                                </h4>
                                <div className="text-2xl font-black text-black">
                                    {(analytics.trends.improvement.fluency_improvement || 0) >= 0 ? '+' : ''}
                                    {((analytics.trends.improvement.fluency_improvement || 0) * 100).toFixed(1)}%
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    Speech fluency progress
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

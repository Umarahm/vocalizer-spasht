import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';

export async function GET(request: NextRequest) {
    try {
        // Get overall game statistics
        const [userStats] = await sql`
            SELECT
                COUNT(*) as total_users,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as new_users_24h,
                COUNT(CASE WHEN last_active >= NOW() - INTERVAL '24 hours' THEN 1 END) as active_users_24h
            FROM users
        `;

        const [progressStats] = await sql`
            SELECT
                COUNT(*) as total_sessions,
                COUNT(DISTINCT user_id) as users_with_progress,
                COUNT(CASE WHEN success = true THEN 1 END) as successful_attempts,
                AVG(score) as average_score,
                AVG(accuracy) as average_accuracy,
                AVG(fluency) as average_fluency,
                AVG(words_per_minute) as average_wpm,
                SUM(coins_earned) as total_coins_earned,
                SUM(xp_earned) as total_xp_earned
            FROM user_progress
        `;

        const [levelStats] = await sql`
            SELECT
                COUNT(DISTINCT level_id) as levels_attempted,
                COUNT(CASE WHEN success = true THEN 1 END) as levels_completed,
                MAX(level_id) as highest_level_reached
            FROM user_progress
            WHERE success = true
        `;

        const [sessionStats] = await sql`
            SELECT
                COUNT(*) as total_game_sessions,
                AVG(total_time_seconds) as average_session_time,
                MAX(total_time_seconds) as longest_session,
                AVG(levels_completed) as average_levels_per_session
            FROM user_sessions
        `;

        // Get level completion breakdown
        const levelCompletion = await sql`
            SELECT
                level_id,
                COUNT(*) as attempts,
                COUNT(CASE WHEN success = true THEN 1 END) as completions,
                AVG(score) as average_score
            FROM user_progress
            GROUP BY level_id
            ORDER BY level_id
        `;

        // Get recent activity (last 7 days)
        const recentActivity = await sql`
            SELECT
                DATE(completed_at) as date,
                COUNT(*) as attempts,
                COUNT(CASE WHEN success = true THEN 1 END) as completions,
                AVG(score) as average_score
            FROM user_progress
            WHERE completed_at >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(completed_at)
            ORDER BY date DESC
        `;

        const stats = {
            overview: {
                total_users: Number(userStats.total_users),
                active_users: Number(userStats.active_users),
                new_users_24h: Number(userStats.new_users_24h),
                active_users_24h: Number(userStats.active_users_24h),
                total_sessions: Number(progressStats.total_sessions),
                users_with_progress: Number(progressStats.users_with_progress)
            },
            performance: {
                successful_attempts: Number(progressStats.successful_attempts),
                average_score: Number(progressStats.average_score) || 0,
                average_accuracy: Number(progressStats.average_accuracy) || 0,
                average_fluency: Number(progressStats.average_fluency) || 0,
                average_wpm: Number(progressStats.average_wpm) || 0,
                total_coins_earned: Number(progressStats.total_coins_earned) || 0,
                total_xp_earned: Number(progressStats.total_xp_earned) || 0
            },
            levels: {
                levels_attempted: Number(levelStats.levels_attempted),
                levels_completed: Number(levelStats.levels_completed),
                highest_level_reached: Number(levelStats.highest_level_reached)
            },
            sessions: {
                total_game_sessions: Number(sessionStats.total_game_sessions),
                average_session_time_seconds: Number(sessionStats.average_session_time) || 0,
                longest_session_seconds: Number(sessionStats.longest_session) || 0,
                average_levels_per_session: Number(sessionStats.average_levels_per_session) || 0
            },
            level_completion_breakdown: levelCompletion.map(row => ({
                level_id: Number(row.level_id),
                attempts: Number(row.attempts),
                completions: Number(row.completions),
                average_score: Number(row.average_score) || 0
            })),
            recent_activity: recentActivity.map(row => ({
                date: row.date.toISOString().split('T')[0],
                attempts: Number(row.attempts),
                completions: Number(row.completions),
                average_score: Number(row.average_score) || 0
            }))
        };

        // Add CORS headers for cross-origin access
        return NextResponse.json(stats, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });

    } catch (error) {
        console.error('Error fetching public stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statistics' },
            {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            }
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


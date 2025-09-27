import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';

export async function GET(request: NextRequest) {
    try {
        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Max 50
        const sortBy = searchParams.get('sortBy') || 'xp'; // 'xp', 'coins', 'levels', 'streak'
        const timeframe = searchParams.get('timeframe') || 'all'; // 'all', 'month', 'week'

        let whereClause = '';
        let timeframeLabel = 'All Time';

        // Add timeframe filtering
        if (timeframe === 'month') {
            whereClause = 'WHERE us.last_updated >= NOW() - INTERVAL \'30 days\'';
            timeframeLabel = 'Last 30 Days';
        } else if (timeframe === 'week') {
            whereClause = 'WHERE us.last_updated >= NOW() - INTERVAL \'7 days\'';
            timeframeLabel = 'Last 7 Days';
        }

        // Build the leaderboard query based on sort criteria
        let orderByClause = '';
        let sortLabel = '';

        switch (sortBy) {
            case 'coins':
                orderByClause = 'ORDER BY us.total_coins DESC, us.total_xp DESC';
                sortLabel = 'Total Coins';
                break;
            case 'levels':
                orderByClause = 'ORDER BY us.levels_completed DESC, us.total_xp DESC';
                sortLabel = 'Levels Completed';
                break;
            case 'streak':
                orderByClause = 'ORDER BY GREATEST(us.current_streak, us.best_streak) DESC, us.total_xp DESC';
                sortLabel = 'Best Streak';
                break;
            case 'xp':
            default:
                orderByClause = 'ORDER BY us.total_xp DESC, us.levels_completed DESC';
                sortLabel = 'Total XP';
                break;
        }

        const leaderboardQuery = `
            SELECT
                u.id,
                u.created_at,
                u.last_active,
                COALESCE(us.total_coins, 0) as total_coins,
                COALESCE(us.total_xp, 0) as total_xp,
                COALESCE(us.current_level, 1) as current_level,
                COALESCE(us.current_streak, 0) as current_streak,
                COALESCE(us.best_streak, 0) as best_streak,
                COALESCE(us.total_sessions, 0) as total_sessions,
                COALESCE(us.total_time_seconds, 0) as total_time_seconds,
                COALESCE(us.levels_completed, 0) as levels_completed,
                COALESCE(us.average_score, 0) as average_score,
                COALESCE(us.average_accuracy, 0) as average_accuracy,
                COALESCE(us.average_fluency, 0) as average_fluency,
                COALESCE(us.average_words_per_minute, 0) as average_words_per_minute,
                us.last_updated
            FROM users u
            LEFT JOIN user_stats us ON u.id = us.user_id
            ${whereClause}
            ${orderByClause}
            LIMIT ${limit}
        `;

        const leaderboard = await sql.unsafe(leaderboardQuery) as unknown as any[];

        // Transform the data for public API (anonymize user IDs)
        const publicLeaderboard = leaderboard.map((user: any, index: number) => ({
            rank: index + 1,
            // Don't expose actual user IDs for privacy
            user_id: `user_${user.id.toString().slice(-4)}`, // Last 4 digits only
            joined_date: user.created_at.toISOString().split('T')[0],
            last_active: user.last_active.toISOString().split('T')[0],
            stats: {
                total_coins: Number(user.total_coins),
                total_xp: Number(user.total_xp),
                current_level: Number(user.current_level),
                current_streak: Number(user.current_streak),
                best_streak: Number(user.best_streak),
                total_sessions: Number(user.total_sessions),
                total_time_seconds: Number(user.total_time_seconds),
                levels_completed: Number(user.levels_completed),
                average_score: Number(user.average_score) || 0,
                average_accuracy: Number(user.average_accuracy) || 0,
                average_fluency: Number(user.average_fluency) || 0,
                average_words_per_minute: Number(user.average_words_per_minute) || 0
            }
        }));

        const response = {
            metadata: {
                sort_by: sortBy,
                sort_label: sortLabel,
                timeframe: timeframe,
                timeframe_label: timeframeLabel,
                limit: limit,
                total_results: publicLeaderboard.length
            },
            leaderboard: publicLeaderboard
        };

        // Add CORS headers for cross-origin access
        return NextResponse.json(response, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json(
            { error: 'Failed to fetch leaderboard' },
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

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const baseUrl = new URL(request.url).origin;

    const apiInfo = {
        name: 'Speech Game Public API',
        version: '1.0.0',
        description: 'Public API for accessing Speech Game data, statistics, and analytics',
        endpoints: {
            stats: {
                url: `${baseUrl}/api/public/stats`,
                description: 'Overall game statistics and analytics',
                parameters: {}
            },
            levels: {
                url: `${baseUrl}/api/public/levels`,
                description: 'Information about all available game levels',
                parameters: {
                    difficulty: 'Filter by difficulty (easy/medium/hard)',
                    type: 'Filter by type (basic/intermediate/advanced/boss)',
                    includeBossLevels: 'Include/exclude boss levels (true/false, default: true)'
                }
            },
            leaderboard: {
                url: `${baseUrl}/api/public/leaderboard`,
                description: 'Top players leaderboard',
                parameters: {
                    limit: 'Number of results to return (max 50, default: 10)',
                    sortBy: 'Sort criteria (xp/coins/levels/streak, default: xp)',
                    timeframe: 'Time period (all/month/week, default: all)'
                }
            }
        },
        cors: {
            enabled: true,
            allowed_origins: ['*'],
            allowed_methods: ['GET', 'OPTIONS'],
            allowed_headers: ['Content-Type']
        },
        usage: {
            authentication: 'No authentication required for public endpoints',
            rate_limiting: 'Standard rate limiting applies',
            content_type: 'application/json',
            examples: {
                get_all_stats: 'GET /api/public/stats',
                get_easy_levels: 'GET /api/public/levels?difficulty=easy',
                get_top_20_by_coins: 'GET /api/public/leaderboard?limit=20&sortBy=coins',
                get_weekly_leaderboard: 'GET /api/public/leaderboard?timeframe=week'
            }
        }
    };

    return NextResponse.json(apiInfo, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
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


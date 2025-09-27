import { NextRequest, NextResponse } from 'next/server';
import { ServerAuthService } from '@/lib/auth/server-auth';
import { DatabaseService } from '@/lib/db/service';

export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await ServerAuthService.requireAuth(request);
        if ('error' in authResult) {
            return authResult.error;
        }

        const { user } = authResult;

        const body = await request.json();
        const {
            sessionKey,
            levelId,
            success,
            score,
            transcription,
            accuracy,
            fluency,
            wordsPerMinute,
            durationSeconds,
            coinsEarned,
            xpEarned
        } = body;

        // Validate required fields
        if (!sessionKey || typeof levelId !== 'number' || typeof success !== 'boolean' || typeof score !== 'number') {
            return NextResponse.json(
                { error: 'Missing required fields: sessionKey, levelId, success, score' },
                { status: 400 }
            );
        }

        // Save progress to database
        const saved = await DatabaseService.saveLevelProgress(user.access_key, sessionKey, {
            levelId,
            success,
            score,
            transcription,
            accuracy,
            fluency,
            wordsPerMinute,
            durationSeconds,
            coinsEarned,
            xpEarned
        });

        if (!saved) {
            return NextResponse.json(
                { error: 'Failed to save progress' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Progress saved successfully'
        });
    } catch (error) {
        console.error('Error saving progress:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await ServerAuthService.requireAuth(request);
        if ('error' in authResult) {
            return authResult.error;
        }

        const { user } = authResult;

        const { searchParams } = new URL(request.url);
        const levelId = searchParams.get('levelId');

        if (levelId) {
            // Get progress for specific level
            const progress = await DatabaseService.getLevelProgress(user.access_key, parseInt(levelId));
            return NextResponse.json({
                success: true,
                data: progress
            });
        } else {
            // Get completion status for all levels
            const userData = await DatabaseService.getUserData(user.access_key);
            return NextResponse.json({
                success: true,
                data: {
                    completedLevels: userData?.completedLevels || [],
                    currentLevel: userData?.currentLevel || 1
                }
            });
        }
    } catch (error) {
        console.error('Error fetching progress:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
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
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

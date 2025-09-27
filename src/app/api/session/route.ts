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
        const { action, sessionData } = body;

        if (action === 'start') {
            // Start a new session
            const session = await DatabaseService.startSession(user.access_key);

            if (!session) {
                return NextResponse.json(
                    { error: 'Failed to start session' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                data: session
            });
        } else if (action === 'end') {
            // End the current session
            const {
                totalTimeSeconds,
                levelsAttempted,
                levelsCompleted,
                totalCoinsEarned,
                totalXpEarned,
                currentLevel
            } = sessionData || {};

            if (typeof totalTimeSeconds !== 'number' ||
                typeof levelsAttempted !== 'number' ||
                typeof levelsCompleted !== 'number' ||
                typeof totalCoinsEarned !== 'number' ||
                typeof totalXpEarned !== 'number' ||
                typeof currentLevel !== 'number') {
                return NextResponse.json(
                    { error: 'Missing required session data fields' },
                    { status: 400 }
                );
            }

            const ended = await DatabaseService.endSession(user.access_key, {
                totalTimeSeconds,
                levelsAttempted,
                levelsCompleted,
                totalCoinsEarned,
                totalXpEarned,
                currentLevel,
                sessionData
            });

            if (!ended) {
                return NextResponse.json(
                    { error: 'Failed to end session' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Session ended successfully'
            });
        } else {
            return NextResponse.json(
                { error: 'Invalid action. Use "start" or "end"' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error managing session:', error);
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
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

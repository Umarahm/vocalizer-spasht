import { NextRequest, NextResponse } from 'next/server';
import { ServerAuthService } from '@/lib/auth/server-auth';
import { DatabaseService } from '@/lib/db/service';

export async function GET(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await ServerAuthService.requireAuth(request);
        if ('error' in authResult) {
            return authResult.error;
        }

        const { user } = authResult;

        // Get user data from database
        const userData = await DatabaseService.getUserData(user.access_key);

        if (!userData) {
            return NextResponse.json(
                { error: 'User data not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: userData
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
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
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

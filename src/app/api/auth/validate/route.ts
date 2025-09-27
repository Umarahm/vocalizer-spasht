import { NextRequest, NextResponse } from 'next/server';
import { ServerAuthService } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { accessKey } = body;

        if (!accessKey || typeof accessKey !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Access key is required' },
                { status: 400 }
            );
        }

        const authResult = await ServerAuthService.validateAccessKey(accessKey);

        if (authResult.success) {
            // Create response with auth cookie
            const response = NextResponse.json({
                success: true,
                user: {
                    id: authResult.user!.id,
                    access_key: authResult.user!.access_key,
                    created_at: authResult.user!.created_at,
                    last_active: authResult.user!.last_active
                }
            });

            // Set access key cookie
            return ServerAuthService.setAccessKeyCookie(response, accessKey);
        } else {
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Auth validation error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
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

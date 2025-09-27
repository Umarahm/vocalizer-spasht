import { DatabaseService } from '../db/service';
import { User } from '../db/client';

export interface AuthResult {
    success: boolean;
    user?: User;
    error?: string;
}

/**
 * Server-side authentication utilities for access key validation
 * This should only be used in API routes and server components
 */
export class ServerAuthService {
    /**
     * Validate access key and get user
     */
    static async validateAccessKey(accessKey: string): Promise<AuthResult> {
        if (!accessKey || accessKey.trim().length === 0) {
            return {
                success: false,
                error: 'Access key is required'
            };
        }

        try {
            const user = await DatabaseService.authenticateUser(accessKey.trim());

            if (!user) {
                return {
                    success: false,
                    error: 'Invalid access key'
                };
            }

            return {
                success: true,
                user
            };
        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                error: 'Authentication service unavailable'
            };
        }
    }

    /**
     * Extract access key from request (cookie or header)
     */
    static getAccessKeyFromRequest(request: Request): string | null {
        // Try cookie first
        const cookies = request.headers.get('cookie');
        if (cookies) {
            const cookieMatch = cookies.match(new RegExp(`speech_game_access_key=([^;]+)`));
            if (cookieMatch) {
                return decodeURIComponent(cookieMatch[1]);
            }
        }

        // Try header
        const headerKey = request.headers.get('x-access-key');
        if (headerKey) {
            return headerKey;
        }

        return null;
    }

    /**
     * Set access key in response cookies
     */
    static setAccessKeyCookie(response: Response, accessKey: string): Response {
        const cookieValue = `speech_game_access_key=${encodeURIComponent(accessKey)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000`; // 1 year
        response.headers.set('Set-Cookie', cookieValue);
        return response;
    }

    /**
     * Clear access key cookie
     */
    static clearAccessKeyCookie(response: Response): Response {
        const cookieValue = `speech_game_access_key=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
        response.headers.set('Set-Cookie', cookieValue);
        return response;
    }

    /**
     * Middleware function for API routes requiring authentication
     */
    static async requireAuth(request: Request): Promise<{ user: User } | { error: Response }> {
        const accessKey = this.getAccessKeyFromRequest(request);

        if (!accessKey) {
            const errorResponse = new Response(
                JSON.stringify({
                    error: 'Access key required',
                    message: 'Please provide a valid access key via cookie or x-access-key header'
                }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            return { error: errorResponse };
        }

        const authResult = await this.validateAccessKey(accessKey);

        if (!authResult.success) {
            const errorResponse = new Response(
                JSON.stringify({
                    error: 'Invalid access key',
                    message: authResult.error || 'Access key validation failed'
                }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            return { error: errorResponse };
        }

        return { user: authResult.user! };
    }
}

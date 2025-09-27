/**
 * Client-side authentication utilities for token management
 * Database operations are handled server-side through API calls
 */
export class AuthService {
    private static ACCESS_KEY_COOKIE = 'speech_game_access_key';
    private static ACCESS_KEY_HEADER = 'x-access-key';

    /**
     * Validate access key by calling the auth API
     */
    static async validateAccessKey(accessKey: string): Promise<{ success: boolean; error?: string }> {
        if (!accessKey || accessKey.trim().length === 0) {
            return {
                success: false,
                error: 'Access key is required'
            };
        }

        try {
            const response = await fetch('/api/auth/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accessKey: accessKey.trim() }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                return { success: true };
            } else {
                return {
                    success: false,
                    error: data.error || 'Invalid access key'
                };
            }
        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                error: 'Authentication service unavailable'
            };
        }
    }

}

/**
 * Client-side authentication utilities
 */
export class ClientAuth {
    private static ACCESS_KEY_KEY = 'speech_game_access_key';

    /**
     * Store access key in localStorage and cookies
     */
    static setAccessKey(accessKey: string): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.ACCESS_KEY_KEY, accessKey);
            // Also set in cookie for server-side access
            document.cookie = `speech_game_access_key=${encodeURIComponent(accessKey)}; path=/; max-age=31536000; samesite=strict`;
        }
    }

    /**
     * Get access key from localStorage
     */
    static getAccessKey(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(this.ACCESS_KEY_KEY);
        }
        return null;
    }

    /**
     * Clear access key from localStorage and cookies
     */
    static clearAccessKey(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(this.ACCESS_KEY_KEY);
            document.cookie = 'speech_game_access_key=; path=/; max-age=0; samesite=strict';
        }
    }

    /**
     * Check if user is authenticated
     */
    static isAuthenticated(): boolean {
        return this.getAccessKey() !== null;
    }

    /**
     * Get authorization headers for API requests
     */
    static getAuthHeaders(): Record<string, string> {
        const accessKey = this.getAccessKey();
        return accessKey ? { 'x-access-key': accessKey } : {};
    }
}

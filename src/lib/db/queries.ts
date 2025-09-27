import { sql, User, UserProgress, UserSession, UserStats } from './client';

/**
 * User-related database queries
 */
export class UserQueries {
    /**
     * Get or create user by access key
     */
    static async getOrCreateUser(accessKey: string): Promise<User> {
        const result = await sql`
            SELECT * FROM get_or_create_user(${accessKey}) as user_id;
        `;

        const userId = result[0].user_id;

        // Get the full user record
        const userResult = await sql`
            SELECT id, access_key, created_at, last_active, is_active
            FROM users
            WHERE id = ${userId}
        `;

        return userResult[0] as User;
    }

    /**
     * Validate access key exists and is active
     */
    static async validateAccessKey(accessKey: string): Promise<boolean> {
        const result = await sql`
            SELECT COUNT(*) as count
            FROM users
            WHERE access_key = ${accessKey} AND is_active = TRUE
        `;

        return result[0].count > 0;
    }

    /**
     * Get user by access key
     */
    static async getUserByAccessKey(accessKey: string): Promise<User | null> {
        const result = await sql`
            SELECT id, access_key, created_at, last_active, is_active
            FROM users
            WHERE access_key = ${accessKey} AND is_active = TRUE
        `;

        return result.length > 0 ? result[0] as User : null;
    }
}

/**
 * Progress-related database queries
 */
export class ProgressQueries {
    /**
     * Save level completion progress
     */
    static async saveProgress(data: {
        userId: number;
        sessionKey: string;
        levelId: number;
        success: boolean;
        score: number;
        transcription?: string;
        accuracy?: number;
        fluency?: number;
        wordsPerMinute?: number;
        durationSeconds?: number;
        coinsEarned?: number;
        xpEarned?: number;
    }): Promise<UserProgress> {
        const result = await sql`
            INSERT INTO user_progress (
                user_id, session_key, level_id, success, score, transcription,
                accuracy, fluency, words_per_minute, duration_seconds,
                coins_earned, xp_earned
            ) VALUES (
                ${data.userId}, ${data.sessionKey}, ${data.levelId}, ${data.success}, ${data.score},
                ${data.transcription || null}, ${data.accuracy || null},
                ${data.fluency || null}, ${data.wordsPerMinute || null},
                ${data.durationSeconds || null}, ${data.coinsEarned || 0},
                ${data.xpEarned || 0}
            )
            RETURNING *
        `;

        return result[0] as UserProgress;
    }

    /**
     * Get user progress for a specific level
     */
    static async getLevelProgress(userId: number, levelId: number): Promise<UserProgress[]> {
        const result = await sql`
            SELECT * FROM user_progress
            WHERE user_id = ${userId} AND level_id = ${levelId}
            ORDER BY completed_at DESC
        `;

        return result as UserProgress[];
    }

    /**
     * Get all progress for a user
     */
    static async getAllUserProgress(userId: number): Promise<UserProgress[]> {
        const result = await sql`
            SELECT * FROM user_progress
            WHERE user_id = ${userId}
            ORDER BY completed_at DESC
        `;

        return result as UserProgress[];
    }

    /**
     * Get all completed levels for a user
     */
    static async getCompletedLevels(userId: number): Promise<number[]> {
        const result = await sql`
            SELECT DISTINCT level_id
            FROM user_progress
            WHERE user_id = ${userId} AND success = TRUE
            ORDER BY level_id
        `;

        return result.map(row => row.level_id);
    }

    /**
     * Check if user has completed a specific level
     */
    static async hasCompletedLevel(userId: number, levelId: number): Promise<boolean> {
        const result = await sql`
            SELECT COUNT(*) as count
            FROM user_progress
            WHERE user_id = ${userId} AND level_id = ${levelId} AND success = TRUE
        `;

        return result[0].count > 0;
    }
}

/**
 * Session-related database queries
 */
export class SessionQueries {
    /**
     * Generate a unique session key
     */
    private static generateSessionKey(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `session_${timestamp}_${random}`;
    }

    /**
     * Start a new session
     */
    static async startSession(userId: number): Promise<UserSession> {
        const sessionKey = this.generateSessionKey();

        const result = await sql`
            INSERT INTO user_sessions (user_id, session_key, session_start)
            VALUES (${userId}, ${sessionKey}, NOW())
            RETURNING *
        `;

        return result[0] as UserSession;
    }

    /**
     * End a session and update stats
     */
    static async endSession(sessionId: number, data: {
        totalTimeSeconds: number;
        levelsAttempted: number;
        levelsCompleted: number;
        totalCoinsEarned: number;
        totalXpEarned: number;
        currentLevel: number;
        sessionData?: any;
    }): Promise<UserSession> {
        const result = await sql`
            UPDATE user_sessions
            SET
                session_end = NOW(),
                total_time_seconds = ${data.totalTimeSeconds},
                levels_attempted = ${data.levelsAttempted},
                levels_completed = ${data.levelsCompleted},
                total_coins_earned = ${data.totalCoinsEarned},
                total_xp_earned = ${data.totalXpEarned},
                current_level = ${data.currentLevel},
                session_data = ${JSON.stringify(data.sessionData) || null}
            WHERE id = ${sessionId}
            RETURNING *
        `;

        return result[0] as UserSession;
    }

    /**
     * Get active session for user (session without end time)
     */
    static async getActiveSession(userId: number): Promise<UserSession | null> {
        const result = await sql`
            SELECT * FROM user_sessions
            WHERE user_id = ${userId} AND session_end IS NULL
            ORDER BY session_start DESC
            LIMIT 1
        `;

        return result.length > 0 ? result[0] as UserSession : null;
    }

    /**
     * Get user session history
     */
    static async getSessionHistory(userId: number, limit: number = 50): Promise<UserSession[]> {
        const result = await sql`
            SELECT * FROM user_sessions
            WHERE user_id = ${userId}
            ORDER BY session_start DESC
            LIMIT ${limit}
        `;

        return result as UserSession[];
    }
}

/**
 * Stats-related database queries
 */
export class StatsQueries {
    /**
     * Get user statistics
     */
    static async getUserStats(userId: number): Promise<UserStats | null> {
        const result = await sql`
            SELECT * FROM user_stats
            WHERE user_id = ${userId}
        `;

        return result.length > 0 ? result[0] as UserStats : null;
    }

    /**
     * Update user streak (call this when user completes levels consecutively)
     */
    static async updateStreak(userId: number, newStreak: number): Promise<void> {
        await sql`
            UPDATE user_stats
            SET
                current_streak = ${newStreak},
                best_streak = GREATEST(best_streak, ${newStreak}),
                last_updated = NOW()
            WHERE user_id = ${userId}
        `;
    }

    /**
     * Reset user streak (call this when user misses a day or fails levels)
     */
    static async resetStreak(userId: number): Promise<void> {
        await sql`
            UPDATE user_stats
            SET current_streak = 0, last_updated = NOW()
            WHERE user_id = ${userId}
        `;
    }

    /**
     * Get leaderboard data
     */
    static async getLeaderboard(limit: number = 10): Promise<Array<UserStats & { access_key: string }>> {
        const result = await sql`
            SELECT
                us.*,
                u.access_key
            FROM user_stats us
            JOIN users u ON us.user_id = u.id
            WHERE u.is_active = TRUE
            ORDER BY us.total_xp DESC, us.levels_completed DESC
            LIMIT ${limit}
        `;

        return result as Array<UserStats & { access_key: string }>;
    }
}

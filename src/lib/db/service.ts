import { UserQueries, ProgressQueries, SessionQueries, StatsQueries } from './queries';
import { User, UserStats } from './client';

/**
 * High-level database service for the Speech Game
 * This service provides all the functionality needed by the application
 */
export class DatabaseService {
    /**
     * Authenticate user with access key
     */
    static async authenticateUser(accessKey: string): Promise<User | null> {
        try {
            return await UserQueries.getOrCreateUser(accessKey);
        } catch (error) {
            console.error('Error authenticating user:', error);
            return null;
        }
    }

    /**
     * Get user statistics and progress data
     */
    static async getUserData(accessKey: string): Promise<{
        user: User;
        stats: UserStats | null;
        completedLevels: number[];
        currentLevel: number;
        totalCoins: number;
        totalXP: number;
        currentStreak: number;
    } | null> {
        try {
            const user = await UserQueries.getUserByAccessKey(accessKey);
            if (!user) return null;

            const [stats, completedLevels] = await Promise.all([
                StatsQueries.getUserStats(user.id),
                ProgressQueries.getCompletedLevels(user.id)
            ]);

            // Calculate totals from progress data if stats are not available
            let totalCoins = stats?.total_coins || 0;
            let totalXP = stats?.total_xp || 0;

            if (!stats || totalCoins === 0) {
                // Calculate from progress data
                const progressData = await ProgressQueries.getAllUserProgress(user.id);
                totalCoins = progressData.reduce((sum, p) => sum + p.coins_earned, 0);
                totalXP = progressData.reduce((sum, p) => sum + p.xp_earned, 0);
            }

            const currentLevel = completedLevels.length > 0 ? Math.max(...completedLevels) + 1 : 1;
            const currentStreak = stats?.current_streak || 0;

            return {
                user,
                stats,
                completedLevels,
                currentLevel,
                totalCoins,
                totalXP,
                currentStreak
            };
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    /**
     * Save level completion progress
     */
    static async saveLevelProgress(accessKey: string, sessionKey: string, levelData: {
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
    }): Promise<boolean> {
        try {
            const user = await UserQueries.getUserByAccessKey(accessKey);
            if (!user) return false;

            await ProgressQueries.saveProgress({
                userId: user.id,
                sessionKey,
                ...levelData
            });

            return true;
        } catch (error) {
            console.error('Error saving level progress:', error);
            return false;
        }
    }

    /**
     * Check if user has completed a level
     */
    static async hasCompletedLevel(accessKey: string, levelId: number): Promise<boolean> {
        try {
            const user = await UserQueries.getUserByAccessKey(accessKey);
            if (!user) return false;

            return await ProgressQueries.hasCompletedLevel(user.id, levelId);
        } catch (error) {
            console.error('Error checking level completion:', error);
            return false;
        }
    }

    /**
     * Get level progress history for a user
     */
    static async getLevelProgress(accessKey: string, levelId: number) {
        try {
            const user = await UserQueries.getUserByAccessKey(accessKey);
            if (!user) return [];

            return await ProgressQueries.getLevelProgress(user.id, levelId);
        } catch (error) {
            console.error('Error getting level progress:', error);
            return [];
        }
    }

    /**
     * Get all progress history for a user
     */
    static async getAllUserProgress(accessKey: string) {
        try {
            const user = await UserQueries.getUserByAccessKey(accessKey);
            if (!user) return [];

            return await ProgressQueries.getAllUserProgress(user.id);
        } catch (error) {
            console.error('Error getting all user progress:', error);
            return [];
        }
    }

    /**
     * Start a new user session
     */
    static async startSession(accessKey: string) {
        try {
            const user = await UserQueries.getUserByAccessKey(accessKey);
            if (!user) return null;

            return await SessionQueries.startSession(user.id);
        } catch (error) {
            console.error('Error starting session:', error);
            return null;
        }
    }

    /**
     * End a user session
     */
    static async endSession(accessKey: string, sessionData: {
        totalTimeSeconds: number;
        levelsAttempted: number;
        levelsCompleted: number;
        totalCoinsEarned: number;
        totalXpEarned: number;
        currentLevel: number;
        sessionData?: any;
    }): Promise<boolean> {
        try {
            const user = await UserQueries.getUserByAccessKey(accessKey);
            if (!user) return false;

            const activeSession = await SessionQueries.getActiveSession(user.id);
            if (!activeSession) return false;

            await SessionQueries.endSession(activeSession.id, sessionData);
            return true;
        } catch (error) {
            console.error('Error ending session:', error);
            return false;
        }
    }

    /**
     * Get leaderboard data
     */
    static async getLeaderboard(limit: number = 10) {
        try {
            return await StatsQueries.getLeaderboard(limit);
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return [];
        }
    }

    /**
     * Update user streak
     */
    static async updateStreak(accessKey: string, newStreak: number): Promise<boolean> {
        try {
            const user = await UserQueries.getUserByAccessKey(accessKey);
            if (!user) return false;

            await StatsQueries.updateStreak(user.id, newStreak);
            return true;
        } catch (error) {
            console.error('Error updating streak:', error);
            return false;
        }
    }

    /**
     * Reset user streak
     */
    static async resetStreak(accessKey: string): Promise<boolean> {
        try {
            const user = await UserQueries.getUserByAccessKey(accessKey);
            if (!user) return false;

            await StatsQueries.resetStreak(user.id);
            return true;
        } catch (error) {
            console.error('Error resetting streak:', error);
            return false;
        }
    }
}

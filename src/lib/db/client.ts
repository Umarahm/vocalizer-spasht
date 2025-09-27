import { neon } from '@neondatabase/serverless';

// Database connection string from environment
const connectionString = process.env.NEON_DATABASE_URL;

if (!connectionString) {
    throw new Error('NEON_DATABASE_URL environment variable is not set');
}

// Create Neon database client
export const sql = neon(connectionString);

// Test database connection
export async function testConnection(): Promise<boolean> {
    try {
        const result = await sql`SELECT 1 as test`;
        return result.length > 0;
    } catch (error) {
        console.error('Database connection test failed:', error);
        return false;
    }
}


// Type definitions for our database tables
export interface User {
    id: number;
    access_key: string;
    created_at: Date;
    last_active: Date;
    is_active: boolean;
}

export interface UserProgress {
    id: number;
    user_id: number;
    session_key: string;
    level_id: number;
    completed_at: Date;
    success: boolean;
    score: number;
    transcription?: string;
    accuracy?: number;
    fluency?: number;
    words_per_minute?: number;
    duration_seconds?: number;
    coins_earned: number;
    xp_earned: number;
}

export interface UserSession {
    id: number;
    user_id: number;
    session_key: string;
    session_start: Date;
    session_end?: Date;
    total_time_seconds: number;
    levels_attempted: number;
    levels_completed: number;
    total_coins_earned: number;
    total_xp_earned: number;
    current_level: number;
    session_data?: any;
}

export interface UserStats {
    id: number;
    user_id: number;
    total_coins: number;
    total_xp: number;
    current_level: number;
    current_streak: number;
    best_streak: number;
    total_sessions: number;
    total_time_seconds: number;
    levels_completed: number;
    average_score: number;
    average_accuracy: number;
    average_fluency: number;
    average_words_per_minute: number;
    last_updated: Date;
}

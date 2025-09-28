#!/usr/bin/env node

/**
 * Migration Script to Add Session Keys to Existing Database
 * This script adds session_key columns to existing tables
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function migrateSessionKeys() {
    const connectionString = process.env.NEON_DATABASE_URL;

    if (!connectionString) {
        console.error('❌ NEON_DATABASE_URL environment variable not found!');
        process.exit(1);
    }

    console.log('🔄 Connecting to Neon DB...');

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        console.log('🔄 Checking and updating schema for session keys...');

        // Check if session_key column exists in user_sessions
        const sessionKeyCheck = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'user_sessions' AND column_name = 'session_key'
        `);

        if (sessionKeyCheck.rows.length === 0) {
            console.log('📝 Adding session_key column to user_sessions table...');
            await client.query(`
                ALTER TABLE user_sessions
                ADD COLUMN session_key VARCHAR(255) UNIQUE
            `);
            console.log('✅ Added session_key to user_sessions');
        } else {
            console.log('ℹ️  session_key column already exists in user_sessions');
        }

        // Check if session_key column exists in user_progress
        const progressKeyCheck = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'user_progress' AND column_name = 'session_key'
        `);

        if (progressKeyCheck.rows.length === 0) {
            console.log('📝 Adding session_key column to user_progress table...');
            await client.query(`
                ALTER TABLE user_progress
                ADD COLUMN session_key VARCHAR(255) REFERENCES user_sessions(session_key) ON DELETE CASCADE
            `);
            console.log('✅ Added session_key to user_progress');
        } else {
            console.log('ℹ️  session_key column already exists in user_progress');
        }

        // Generate session keys for existing sessions
        console.log('🔄 Generating session keys for existing sessions...');
        const existingSessions = await client.query(`
            SELECT id FROM user_sessions WHERE session_key IS NULL
        `);

        for (const session of existingSessions.rows) {
            const sessionKey = `legacy_session_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
            await client.query(`
                UPDATE user_sessions
                SET session_key = $1
                WHERE id = $2
            `, [sessionKey, session.id]);
        }

        console.log(`✅ Generated session keys for ${existingSessions.rows.length} existing sessions`);

        // Update existing progress records to link to sessions
        console.log('🔄 Linking existing progress to sessions...');

        // For each user, find their progress and link to the most recent session
        const users = await client.query('SELECT id, access_key FROM users');

        for (const user of users.rows) {
            const progressRecords = await client.query(`
                SELECT id, completed_at FROM user_progress
                WHERE user_id = $1 AND session_key IS NULL
                ORDER BY completed_at
            `, [user.id]);

            if (progressRecords.rows.length > 0) {
                // Create a session for this user's progress if they don't have recent sessions
                const sessionKey = `migrated_session_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

                await client.query(`
                    INSERT INTO user_sessions (user_id, session_key, session_start, session_end, levels_attempted, levels_completed)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    user.id,
                    sessionKey,
                    progressRecords.rows[0].completed_at,
                    progressRecords.rows[progressRecords.rows.length - 1].completed_at,
                    progressRecords.rows.length,
                    progressRecords.rows.filter(p => p.success).length
                ]);

                // Link progress to this session
                await client.query(`
                    UPDATE user_progress
                    SET session_key = $1
                    WHERE user_id = $2 AND session_key IS NULL
                `, [sessionKey, user.id]);

                console.log(`✅ Migrated ${progressRecords.rows.length} progress records for user ${user.access_key}`);
            }
        }

        // Create indexes for session keys
        console.log('🔄 Creating indexes for session keys...');

        try {
            await client.query(`CREATE INDEX IF NOT EXISTS idx_user_sessions_key ON user_sessions(session_key)`);
            console.log('✅ Created index on user_sessions.session_key');
        } catch (error) {
            console.log('ℹ️  Index on user_sessions.session_key already exists or failed to create');
        }

        try {
            await client.query(`CREATE INDEX IF NOT EXISTS idx_user_progress_session_key ON user_progress(session_key)`);
            console.log('✅ Created index on user_progress.session_key');
        } catch (error) {
            console.log('ℹ️  Index on user_progress.session_key already exists or failed to create');
        }

        console.log('✅ Session key migration completed successfully!');
        console.log('🎉 Database is now ready with session-based tracking!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

// Run migration if called directly
if (require.main === module) {
    migrateSessionKeys().catch(console.error);
}

module.exports = migrateSessionKeys;


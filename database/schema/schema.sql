-- Speech Game Database Schema for Neon DB
-- This schema tracks user progress, sessions, and game statistics

-- Users table - stores user access keys and basic information
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    access_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- User progress table - tracks individual level completions
CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    level_id INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN NOT NULL,
    score INTEGER NOT NULL, -- 0-100
    transcription TEXT,
    accuracy DECIMAL(3,2), -- 0.00 to 1.00
    fluency DECIMAL(3,2), -- 0.00 to 1.00
    words_per_minute DECIMAL(5,2),
    duration_seconds DECIMAL(6,2),
    coins_earned INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    UNIQUE(user_id, level_id, completed_at)
);

-- User sessions table - tracks time spent and session data
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    total_time_seconds INTEGER DEFAULT 0,
    levels_attempted INTEGER DEFAULT 0,
    levels_completed INTEGER DEFAULT 0,
    total_coins_earned INTEGER DEFAULT 0,
    total_xp_earned INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    session_data JSONB -- Store additional session metadata
);

-- User statistics table - aggregated stats for performance tracking
CREATE TABLE IF NOT EXISTS user_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    total_coins INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_time_seconds INTEGER DEFAULT 0,
    levels_completed INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0,
    average_accuracy DECIMAL(5,2) DEFAULT 0,
    average_fluency DECIMAL(5,2) DEFAULT 0,
    average_words_per_minute DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_access_key ON users(access_key);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_level_id ON user_progress(level_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed_at ON user_progress(completed_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_start ON user_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- Function to update user stats when progress is added
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update user stats
    INSERT INTO user_stats (
        user_id,
        total_coins,
        total_xp,
        current_level,
        levels_completed,
        average_score,
        average_accuracy,
        average_fluency,
        average_words_per_minute,
        last_updated
    )
    SELECT
        NEW.user_id,
        COALESCE(SUM(up.coins_earned), 0),
        COALESCE(SUM(up.xp_earned), 0),
        COALESCE(MAX(up.level_id), 1),
        COUNT(CASE WHEN up.success THEN 1 END),
        COALESCE(AVG(up.score), 0),
        COALESCE(AVG(up.accuracy), 0),
        COALESCE(AVG(up.fluency), 0),
        COALESCE(AVG(up.words_per_minute), 0),
        NOW()
    FROM user_progress up
    WHERE up.user_id = NEW.user_id
    ON CONFLICT (user_id)
    DO UPDATE SET
        total_coins = EXCLUDED.total_coins,
        total_xp = EXCLUDED.total_xp,
        current_level = EXCLUDED.current_level,
        levels_completed = EXCLUDED.levels_completed,
        average_score = EXCLUDED.average_score,
        average_accuracy = EXCLUDED.average_accuracy,
        average_fluency = EXCLUDED.average_fluency,
        average_words_per_minute = EXCLUDED.average_words_per_minute,
        last_updated = NOW();

    -- Update user's last active timestamp
    UPDATE users
    SET last_active = NOW()
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update user stats when progress is added
DROP TRIGGER IF EXISTS trigger_update_user_stats ON user_progress;
CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT OR UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- Function to get or create user by access key
CREATE OR REPLACE FUNCTION get_or_create_user(p_access_key VARCHAR(255))
RETURNS INTEGER AS $$
DECLARE
    user_id INTEGER;
BEGIN
    -- Try to find existing user
    SELECT id INTO user_id
    FROM users
    WHERE access_key = p_access_key AND is_active = TRUE;

    -- If not found, create new user
    IF user_id IS NULL THEN
        INSERT INTO users (access_key)
        VALUES (p_access_key)
        RETURNING id INTO user_id;

        -- Create initial stats record
        INSERT INTO user_stats (user_id)
        VALUES (user_id);
    END IF;

    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

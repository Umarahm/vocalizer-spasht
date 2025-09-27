-- Simple Speech Game Database Schema for Neon DB
-- Basic tables without complex functions and triggers

CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, access_key VARCHAR(255) UNIQUE NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(), is_active BOOLEAN DEFAULT TRUE);

CREATE TABLE IF NOT EXISTS user_sessions (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, session_key VARCHAR(255) UNIQUE NOT NULL, session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(), session_end TIMESTAMP WITH TIME ZONE, total_time_seconds INTEGER DEFAULT 0, levels_attempted INTEGER DEFAULT 0, levels_completed INTEGER DEFAULT 0, total_coins_earned INTEGER DEFAULT 0, total_xp_earned INTEGER DEFAULT 0, current_level INTEGER DEFAULT 1, session_data JSONB);

CREATE TABLE IF NOT EXISTS user_progress (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, session_key VARCHAR(255) REFERENCES user_sessions(session_key) ON DELETE CASCADE, level_id INTEGER NOT NULL, completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), success BOOLEAN NOT NULL, score INTEGER NOT NULL, transcription TEXT, accuracy DECIMAL(3,2), fluency DECIMAL(3,2), words_per_minute DECIMAL(5,2), duration_seconds DECIMAL(6,2), coins_earned INTEGER DEFAULT 0, xp_earned INTEGER DEFAULT 0, UNIQUE(user_id, level_id, completed_at));

CREATE TABLE IF NOT EXISTS user_stats (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE, total_coins INTEGER DEFAULT 0, total_xp INTEGER DEFAULT 0, current_level INTEGER DEFAULT 1, current_streak INTEGER DEFAULT 0, best_streak INTEGER DEFAULT 0, total_sessions INTEGER DEFAULT 0, total_time_seconds INTEGER DEFAULT 0, levels_completed INTEGER DEFAULT 0, average_score DECIMAL(5,2) DEFAULT 0, average_accuracy DECIMAL(5,2) DEFAULT 0, average_fluency DECIMAL(5,2) DEFAULT 0, average_words_per_minute DECIMAL(5,2) DEFAULT 0, last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW());

CREATE INDEX IF NOT EXISTS idx_users_access_key ON users(access_key);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_user_progress_level_id ON user_progress(level_id);

CREATE INDEX IF NOT EXISTS idx_user_progress_completed_at ON user_progress(completed_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_start ON user_sessions(session_start);

CREATE INDEX IF NOT EXISTS idx_user_sessions_key ON user_sessions(session_key);

CREATE INDEX IF NOT EXISTS idx_user_progress_session_key ON user_progress(session_key);

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

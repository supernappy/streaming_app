-- Migration: Add track_plays table
-- This table records every time a user plays a track

-- Migration: Add track_plays table (PostgreSQL syntax)
-- This table records every time a user plays a track

CREATE TABLE IF NOT EXISTS track_plays (
    id SERIAL PRIMARY KEY,
    track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for analytics and performance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_track_plays_track_id') THEN
        CREATE INDEX idx_track_plays_track_id ON track_plays(track_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_track_plays_user_id') THEN
        CREATE INDEX idx_track_plays_user_id ON track_plays(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_track_plays_played_at') THEN
        CREATE INDEX idx_track_plays_played_at ON track_plays(played_at);
    END IF;
END$$;

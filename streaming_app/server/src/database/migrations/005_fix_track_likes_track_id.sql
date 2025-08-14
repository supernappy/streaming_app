-- Migration: Fix track_id type in track_likes table
-- 1. Drop indexes and constraints on track_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_track_likes_track_id') THEN
        EXECUTE 'DROP INDEX idx_track_likes_track_id';
    END IF;
END$$;

-- 2. Alter column type from text to integer
ALTER TABLE track_likes ALTER COLUMN track_id DROP NOT NULL;
ALTER TABLE track_likes ALTER COLUMN track_id TYPE INTEGER USING track_id::integer;
ALTER TABLE track_likes ALTER COLUMN track_id SET NOT NULL;

-- 3. Add foreign key constraint
ALTER TABLE track_likes ADD CONSTRAINT fk_track_likes_track_id FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE;

-- 4. Recreate index
CREATE INDEX IF NOT EXISTS idx_track_likes_track_id ON track_likes(track_id);

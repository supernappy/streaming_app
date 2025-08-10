-- Add synchronized audio columns to rooms table
DO $$ 
BEGIN
    -- Add current_track_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rooms' AND column_name = 'current_track_id') THEN
        ALTER TABLE rooms ADD COLUMN current_track_id INTEGER REFERENCES tracks(id);
    END IF;
    
    -- Add current_position column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rooms' AND column_name = 'current_position') THEN
        ALTER TABLE rooms ADD COLUMN current_position DECIMAL(10,3) DEFAULT 0;
    END IF;
    
    -- Add is_playing column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rooms' AND column_name = 'is_playing') THEN
        ALTER TABLE rooms ADD COLUMN is_playing BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add master_volume column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rooms' AND column_name = 'master_volume') THEN
        ALTER TABLE rooms ADD COLUMN master_volume INTEGER DEFAULT 70;
    END IF;
END $$;

-- Create indexes for faster room state queries
CREATE INDEX IF NOT EXISTS idx_rooms_current_track ON rooms(current_track_id);
CREATE INDEX IF NOT EXISTS idx_rooms_sync_state ON rooms(id, current_track_id, is_playing);

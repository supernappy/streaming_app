-- Add room_tracks table for playlist functionality
CREATE TABLE IF NOT EXISTS room_tracks (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    track_id INTEGER REFERENCES tracks(id) ON DELETE CASCADE,
    added_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_tracks_room_id ON room_tracks(room_id);
CREATE INDEX IF NOT EXISTS idx_room_tracks_position ON room_tracks(room_id, position);

-- Add columns to room_participants for status tracking
ALTER TABLE room_participants 
ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hand_raised BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add room_playback_state table for music synchronization
CREATE TABLE IF NOT EXISTS room_playback_state (
    id SERIAL PRIMARY KEY,
    room_id INTEGER UNIQUE REFERENCES rooms(id) ON DELETE CASCADE,
    current_track_id INTEGER REFERENCES tracks(id) ON DELETE SET NULL,
    position_seconds FLOAT DEFAULT 0,
    is_playing BOOLEAN DEFAULT false,
    volume INTEGER DEFAULT 70,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add room_messages table for chat functionality
CREATE TABLE IF NOT EXISTS room_messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'system', 'announcement'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for chat messages
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_created_at ON room_messages(created_at);

-- Add room_invites table for sharing functionality
CREATE TABLE IF NOT EXISTS room_invites (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    uses_count INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT NULL, -- NULL for unlimited
    expires_at TIMESTAMP DEFAULT NULL, -- NULL for no expiration
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for room invites
CREATE INDEX IF NOT EXISTS idx_room_invites_code ON room_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_room_invites_room_id ON room_invites(room_id);

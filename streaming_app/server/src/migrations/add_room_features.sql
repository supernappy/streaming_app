-- Add room_tracks table for playlist functionality
CREATE TABLE IF NOT EXISTS room_tracks (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(255) REFERENCES rooms(id) ON DELETE CASCADE,
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
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add room playback state table for music synchronization
CREATE TABLE IF NOT EXISTS room_playback_state (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(255) REFERENCES rooms(id) ON DELETE CASCADE UNIQUE,
    current_track_id INTEGER,
    current_position DECIMAL(10,3) DEFAULT 0,
    is_playing BOOLEAN DEFAULT false,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add room messages table for chat functionality
CREATE TABLE IF NOT EXISTS room_messages (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(255) REFERENCES rooms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'system', 'track_added', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for room messages
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_created_at ON room_messages(room_id, created_at DESC);

-- Add room invites table
CREATE TABLE IF NOT EXISTS room_invites (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(255) REFERENCES rooms(id) ON DELETE CASCADE,
    invited_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    invited_user INTEGER REFERENCES users(id) ON DELETE CASCADE,
    invite_code VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for invite codes
CREATE INDEX IF NOT EXISTS idx_room_invites_code ON room_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_room_invites_user ON room_invites(invited_user, used_at);

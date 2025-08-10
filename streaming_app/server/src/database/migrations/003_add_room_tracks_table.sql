-- Add room_tracks table for storing tracks added to rooms
CREATE TABLE IF NOT EXISTS room_tracks (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    track_id INTEGER REFERENCES tracks(id) ON DELETE CASCADE,
    added_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, track_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_tracks_room_id ON room_tracks(room_id);
CREATE INDEX IF NOT EXISTS idx_room_tracks_track_id ON room_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_room_tracks_added_by ON room_tracks(added_by);
CREATE INDEX IF NOT EXISTS idx_room_tracks_position ON room_tracks(room_id, position);

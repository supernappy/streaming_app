CREATE TABLE IF NOT EXISTS track_likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, track_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_track_likes_user_id ON track_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_track_likes_track_id ON track_likes(track_id);

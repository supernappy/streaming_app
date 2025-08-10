const { pool } = require('../utils/database');

async function createTrackLikesTable() {
  try {
    console.log('Creating track_likes table if it doesn\'t exist...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS track_likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, track_id)
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_track_likes_user_id ON track_likes(user_id)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_track_likes_track_id ON track_likes(track_id)
    `);

    console.log('✅ track_likes table created successfully');
  } catch (error) {
    console.error('❌ Error creating track_likes table:', error);
  }
}

module.exports = { createTrackLikesTable };

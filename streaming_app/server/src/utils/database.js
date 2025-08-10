const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://walesolagbade@localhost:5432/openstream',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const createTables = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        avatar_url TEXT,
        bio TEXT,
        role VARCHAR(50) DEFAULT 'user',
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tracks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tracks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        album VARCHAR(255),
        genre VARCHAR(100),
        duration NUMERIC(10,3),
        file_url TEXT NOT NULL,
        cover_url TEXT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        is_public BOOLEAN DEFAULT TRUE,
        play_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Playlists table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS playlists (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cover_url TEXT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Playlist tracks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS playlist_tracks (
        id SERIAL PRIMARY KEY,
        playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
        track_id INTEGER REFERENCES tracks(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(playlist_id, track_id)
      )
    `);

    // Favorites table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        track_id INTEGER REFERENCES tracks(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, track_id)
      )
    `);

    // Rooms table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        host_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT FALSE,
        max_participants INTEGER DEFAULT 100,
        participant_count INTEGER DEFAULT 0,
        category VARCHAR(100),
        is_public BOOLEAN DEFAULT TRUE,
        room_type VARCHAR(50) DEFAULT 'audio',
        background_theme VARCHAR(50) DEFAULT 'default',
        mood VARCHAR(50),
        language VARCHAR(10) DEFAULT 'en',
        tags TEXT[],
        scheduled_start TIMESTAMP,
        estimated_duration INTEGER,
        featured BOOLEAN DEFAULT FALSE,
        room_password VARCHAR(255),
        allow_recording BOOLEAN DEFAULT TRUE,
        auto_moderation BOOLEAN DEFAULT FALSE,
        welcome_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Room participants table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS room_participants (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'listener',
        is_muted BOOLEAN DEFAULT FALSE,
        hand_raised BOOLEAN DEFAULT FALSE,
        join_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_time_minutes INTEGER DEFAULT 0,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(room_id, user_id)
      )
    `);

    // Room activities table for enhanced analytics
    await pool.query(`
      CREATE TABLE IF NOT EXISTS room_activities (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        activity_type VARCHAR(50) NOT NULL,
        activity_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Room reactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS room_reactions (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reaction_type VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Room follow table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS room_follows (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(room_id, user_id)
      )
    `);

    // Room tracks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS room_tracks (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        track_id INTEGER REFERENCES tracks(id) ON DELETE CASCADE,
        added_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        position INTEGER NOT NULL DEFAULT 0,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(room_id, track_id)
      )
    `);

    // Room messages table for chat history
    await pool.query(`
      CREATE TABLE IF NOT EXISTS room_messages (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_tracks_play_count ON tracks(play_count DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON rooms(is_active)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_rooms_featured ON rooms(featured)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_rooms_category ON rooms(category)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_rooms_mood ON rooms(mood)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_rooms_scheduled_start ON rooms(scheduled_start)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_room_messages_created_at ON room_messages(created_at)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_room_participants_hand_raised ON room_participants(hand_raised)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_room_activities_room_id ON room_activities(room_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_room_activities_type ON room_activities(activity_type)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_room_reactions_room_id ON room_reactions(room_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_room_follows_user_id ON room_follows(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_room_tracks_room_id ON room_tracks(room_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_room_tracks_track_id ON room_tracks(track_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_room_tracks_added_by ON room_tracks(added_by)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_room_tracks_position ON room_tracks(room_id, position)');

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating database tables:', error);
    throw error;
  }
};

const createChatTable = async () => {
  try {
    console.log('🔄 Creating room_messages table...');
    
    // Create the room_messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS room_messages (
        id SERIAL PRIMARY KEY,
        room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes for better performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_room_messages_created_at ON room_messages(created_at)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_room_messages_user_id ON room_messages(user_id)');
    
    console.log('✅ room_messages table and indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating chat table:', error);
    throw error;
  }
};

module.exports = { pool, createTables, createChatTable };

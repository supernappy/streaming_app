#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const sampleData = {
  users: [
    {
      username: 'demo_user',
      email: 'demo@openstream.app',
      display_name: 'Demo User',
      bio: 'Sample user for testing OpenStream features',
      role: 'user'
    },
    {
      username: 'artist_demo',
      email: 'artist@openstream.app',
      display_name: 'Demo Artist',
      bio: 'Independent artist sharing original music',
      role: 'artist'
    },
    {
      username: 'host_demo',
      email: 'host@openstream.app',
      display_name: 'Room Host',
      bio: 'Hosting live audio conversations',
      role: 'host'
    }
  ],
  playlists: [
    {
      name: 'Chill Vibes',
      description: 'Relaxing tracks for any time of day',
      is_public: true
    },
    {
      name: 'Focus Music',
      description: 'Instrumental tracks for productivity',
      is_public: true
    },
    {
      name: 'My Favorites',
      description: 'Personal collection of liked tracks',
      is_public: false
    }
  ],
  tracks: [
    {
      title: 'Summer Breeze',
      artist: 'Demo Artist',
      album: 'Chill Collection',
      genre: 'Ambient',
      duration: 185,
      file_url: '/demo/summer-breeze.mp3',
      is_public: true,
      play_count: 147
    },
    {
      title: 'Digital Dreams',
      artist: 'Synth Master',
      album: 'Electronic Vibes',
      genre: 'Electronic',
      duration: 220,
      file_url: '/demo/digital-dreams.mp3',
      is_public: true,
      play_count: 89
    },
    {
      title: 'Acoustic Morning',
      artist: 'Coffee Shop Sessions',
      album: 'Unplugged',
      genre: 'Acoustic',
      duration: 165,
      file_url: '/demo/acoustic-morning.mp3',
      is_public: true,
      play_count: 203
    },
    {
      title: 'Bass Drop',
      artist: 'Beat Producer',
      album: 'Heavy Beats',
      genre: 'Hip Hop',
      duration: 195,
      file_url: '/demo/bass-drop.mp3',
      is_public: true,
      play_count: 312
    },
    {
      title: 'Jazz Night',
      artist: 'Smooth Quartet',
      album: 'Late Night Jazz',
      genre: 'Jazz',
      duration: 275,
      file_url: '/demo/jazz-night.mp3',
      is_public: true,
      play_count: 156
    },
    {
      title: 'Rock Anthem',
      artist: 'Electric Legends',
      album: 'Live Sessions',
      genre: 'Rock',
      duration: 240,
      file_url: '/demo/rock-anthem.mp3',
      is_public: true,
      play_count: 89
    },
    {
      title: 'Lo-Fi Study',
      artist: 'Chill Beats',
      album: 'Focus Mode',
      genre: 'Lo-Fi',
      duration: 180,
      file_url: '/demo/lofi-study.mp3',
      is_public: true,
      play_count: 421
    },
    {
      title: 'Classical Sunrise',
      artist: 'Orchestra Dreams',
      album: 'Morning Symphony',
      genre: 'Classical',
      duration: 320,
      file_url: '/demo/classical-sunrise.mp3',
      is_public: true,
      play_count: 67
    }
  ],
  rooms: [
    {
      title: 'Music Discovery Room',
      description: 'Share and discover new music together',
      category: 'Music',
      is_public: true,
      max_participants: 50
    },
    {
      title: 'Tech Talk',
      description: 'Discussing the latest in technology',
      category: 'Technology',
      is_public: true,
      max_participants: 100
    },
    {
      title: 'Open Mic Night',
      description: 'Share your musical talents live',
      category: 'Performance',
      is_public: true,
      max_participants: 25
    }
  ]
};

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with sample data...');

    // Check if users already exist
    const { rows: existingUsers } = await pool.query('SELECT COUNT(*) FROM users');
    const { rows: existingTracks } = await pool.query('SELECT COUNT(*) FROM tracks');
    
    const hasUsers = parseInt(existingUsers[0].count) > 0;
    const hasTracks = parseInt(existingTracks[0].count) > 0;

    // Hash password for all users
    const defaultPassword = 'demo123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    let userIds = [];

    if (!hasUsers) {
      // Insert users
      console.log('👥 Creating sample users...');
      for (const user of sampleData.users) {
        const { rows } = await pool.query(`
          INSERT INTO users (username, email, password_hash, display_name, bio, role)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [user.username, user.email, passwordHash, user.display_name, user.bio, user.role]);
        
        userIds.push(rows[0].id);
        console.log(`✅ Created user: ${user.username}`);
      }
    } else {
      // Get existing user IDs
      console.log('👥 Using existing users...');
      const { rows } = await pool.query('SELECT id FROM users ORDER BY id LIMIT 3');
      userIds = rows.map(row => row.id);
    }

    if (!hasTracks && userIds.length > 0) {
      // Insert tracks
      console.log('🎶 Creating sample tracks...');
      const trackIds = [];
      for (let i = 0; i < sampleData.tracks.length; i++) {
        const track = sampleData.tracks[i];
        const userId = userIds[i % userIds.length]; // Distribute tracks among users
        
        const { rows } = await pool.query(`
          INSERT INTO tracks (title, artist, album, genre, duration, file_url, user_id, is_public, play_count)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `, [track.title, track.artist, track.album, track.genre, track.duration, track.file_url, userId, track.is_public, track.play_count]);
        
        trackIds.push(rows[0].id);
        console.log(`✅ Created track: ${track.title} by ${track.artist}`);
      }
    } else if (hasTracks) {
      console.log('🎶 Tracks already exist, skipping track creation');
    }

    if (!hasUsers) {
      // Insert playlists only if we're creating new users
      console.log('🎵 Creating sample playlists...');
      const playlistIds = [];
      for (let i = 0; i < sampleData.playlists.length; i++) {
        const playlist = sampleData.playlists[i];
        const userId = userIds[i % userIds.length]; // Distribute playlists among users
        
        const { rows } = await pool.query(`
          INSERT INTO playlists (name, description, user_id, is_public)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [playlist.name, playlist.description, userId, playlist.is_public]);
        
        playlistIds.push(rows[0].id);
        console.log(`✅ Created playlist: ${playlist.name}`);
      }

      // Insert rooms only if we're creating new users
      console.log('🎤 Creating sample rooms...');
      for (let i = 0; i < sampleData.rooms.length; i++) {
        const room = sampleData.rooms[i];
        const hostId = userIds[i % userIds.length]; // Distribute rooms among users
        
        const { rows } = await pool.query(`
          INSERT INTO rooms (title, description, host_id, category, is_public, max_participants)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [room.title, room.description, hostId, room.category, room.is_public, room.max_participants]);
        
        console.log(`✅ Created room: ${room.title}`);
        
        // Add host as participant
        await pool.query(`
          INSERT INTO room_participants (room_id, user_id, role)
          VALUES ($1, $2, 'host')
        `, [rows[0].id, hostId]);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📝 Sample login credentials:');
    console.log('  Username: demo_user     | Password: demo123');
    console.log('  Username: artist_demo   | Password: demo123');
    console.log('  Username: host_demo     | Password: demo123');
    console.log('');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };

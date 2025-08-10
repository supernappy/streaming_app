const { pool } = require('./src/utils/database');

async function createUserSettingsTables() {
  const client = await pool.connect();
  
  try {
    console.log('Creating user notification settings table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_notification_settings (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          email_notifications BOOLEAN DEFAULT true,
          push_notifications BOOLEAN DEFAULT false,
          track_likes BOOLEAN DEFAULT true,
          new_followers BOOLEAN DEFAULT true,
          room_invites BOOLEAN DEFAULT true,
          track_comments BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
      );
    `);

    console.log('Creating user privacy settings table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_privacy_settings (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'followers', 'private')),
          show_email BOOLEAN DEFAULT false,
          show_location BOOLEAN DEFAULT true,
          allow_direct_messages BOOLEAN DEFAULT true,
          show_online_status BOOLEAN DEFAULT false,
          show_listening_activity BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
      );
    `);

    console.log('Creating indexes...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON user_notification_settings(user_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_user_id ON user_privacy_settings(user_id);
    `);

    console.log('Inserting default settings for existing users...');
    
    await client.query(`
      INSERT INTO user_notification_settings (user_id)
      SELECT id FROM users 
      WHERE id NOT IN (SELECT user_id FROM user_notification_settings)
      ON CONFLICT (user_id) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO user_privacy_settings (user_id)
      SELECT id FROM users 
      WHERE id NOT IN (SELECT user_id FROM user_privacy_settings)
      ON CONFLICT (user_id) DO NOTHING;
    `);

    console.log('✅ User settings tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating user settings tables:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

createUserSettingsTables();

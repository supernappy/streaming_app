const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://walesolagbade@localhost:5432/openstream',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createChatTable() {
  try {
    console.log('Creating room_messages table...');
    
    // Create the room_messages table
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
    
    console.log('✅ Successfully created room_messages table');
    
    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_room_messages_created_at ON room_messages(created_at)');
    
    console.log('✅ Successfully created indexes for room_messages');
    
    // Verify the table exists
    const checkResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'room_messages'
      ORDER BY ordinal_position
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Verified room_messages table structure:');
      checkResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('❌ Table verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error creating room_messages table:', error.message);
  } finally {
    await pool.end();
  }
}

createChatTable();

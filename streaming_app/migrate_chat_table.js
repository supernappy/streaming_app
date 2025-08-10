#!/usr/bin/env node

const { Pool } = require('pg');

// Use the same connection as the main app
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://walesolagbade@localhost:5432/openstream',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createChatTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creating room_messages table...');
    
    // Create the room_messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS room_messages (
        id SERIAL PRIMARY KEY,
        room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ room_messages table created successfully');
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_room_messages_created_at ON room_messages(created_at);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_room_messages_user_id ON room_messages(user_id);
    `);
    
    console.log('✅ Indexes created successfully');
    
    // Verify the table structure
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'room_messages' 
      ORDER BY ordinal_position;
    `);
    
    console.log('✅ Table structure verified:');
    tableInfo.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''} ${row.column_default || ''}`);
    });
    
    // Test the table with a sample query
    const testQuery = await client.query('SELECT COUNT(*) FROM room_messages');
    console.log(`✅ Table test successful. Current message count: ${testQuery.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error creating chat table:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
createChatTable()
  .then(() => {
    console.log('🎉 Chat table migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  });

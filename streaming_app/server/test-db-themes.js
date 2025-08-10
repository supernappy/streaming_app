const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://walesolagbade@localhost:5432/openstream',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkThemes() {
  try {
    console.log('🔍 Checking background_theme column...');
    
    // Check if column exists
    const columnCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'rooms' AND column_name = 'background_theme';
    `);
    
    console.log('Column info:', columnCheck.rows);
    
    // Check room data
    const roomsCheck = await pool.query('SELECT id, title, background_theme FROM rooms LIMIT 3;');
    console.log('Sample rooms:', roomsCheck.rows);
    
    pool.end();
  } catch (error) {
    console.error('❌ Database error:', error.message);
    pool.end();
  }
}

checkThemes();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://walesolagbade@localhost:5432/openstream',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addBackgroundThemeColumn() {
  try {
    console.log('Adding background_theme column to rooms table...');
    
    // Add the column if it doesn't exist
    await pool.query(`
      ALTER TABLE rooms 
      ADD COLUMN IF NOT EXISTS background_theme VARCHAR(50) DEFAULT 'chill'
    `);
    
    console.log('✅ Successfully added background_theme column');
    
    // Update existing rooms to have the default theme
    const result = await pool.query(`
      UPDATE rooms 
      SET background_theme = 'chill' 
      WHERE background_theme IS NULL
    `);
    
    console.log(`✅ Updated ${result.rowCount} existing rooms with default theme`);
    
    // Verify the column exists
    const checkResult = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'rooms' AND column_name = 'background_theme'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Verified background_theme column exists:', checkResult.rows[0]);
    } else {
      console.log('❌ Column verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error adding background_theme column:', error.message);
  } finally {
    await pool.end();
  }
}

addBackgroundThemeColumn();

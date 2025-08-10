const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost', 
  database: 'openstream',
  password: 'password',
  port: 5432,
});

async function checkTracks() {
  try {
    const result = await pool.query('SELECT id, title, artist, duration FROM tracks ORDER BY id');
    
    console.log('Current Track Status:');
    console.log('====================');
    
    result.rows.forEach(track => {
      const status = track.duration ? `${track.duration}s` : 'MISSING';
      console.log(`ID ${track.id}: "${track.title}" by ${track.artist} - Duration: ${status}`);
    });
    
    const missing = result.rows.filter(t => !t.duration).length;
    console.log(`\nTracks needing duration update: ${missing}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTracks();

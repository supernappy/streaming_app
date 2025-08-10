const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'openstream',
  password: 'password',
  port: 5432,
});

async function checkTrackDurations() {
  try {
    const result = await pool.query('SELECT id, title, duration FROM tracks ORDER BY id');
    console.log('Track Duration Status:');
    console.log('====================');
    
    result.rows.forEach(track => {
      const durationStatus = track.duration ? `${track.duration}s` : 'NULL';
      console.log(`ID: ${track.id} | Title: ${track.title} | Duration: ${durationStatus}`);
    });
    
    const withDuration = result.rows.filter(t => t.duration !== null).length;
    const withoutDuration = result.rows.filter(t => t.duration === null).length;
    
    console.log('\nSummary:');
    console.log(`Total tracks: ${result.rows.length}`);
    console.log(`With duration: ${withDuration}`);
    console.log(`Without duration: ${withoutDuration}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTrackDurations();

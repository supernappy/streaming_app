/**
 * Fix track URLs to use correct port (5002 instead of 5001)
 */

const { pool } = require('./src/utils/database');

async function fixTrackUrls() {
  try {
    console.log('🔧 Fixing track URLs...');
    
    // Check current URLs
    const checkResult = await pool.query('SELECT id, title, file_url FROM tracks LIMIT 10');
    console.log('\nCurrent track URLs:');
    checkResult.rows.forEach(track => {
      console.log(`ID: ${track.id}, Title: ${track.title}`);
      console.log(`URL: ${track.file_url}`);
    });
    
    // Update URLs from port 5001 to 5002
    const updateResult = await pool.query(`
      UPDATE tracks 
      SET file_url = REPLACE(file_url, 'http://localhost:5001/', 'http://localhost:5002/')
      WHERE file_url LIKE 'http://localhost:5001/%'
      RETURNING id, title, file_url
    `);
    
    console.log(`\n✅ Updated ${updateResult.rowCount} track URLs`);
    
    if (updateResult.rows.length > 0) {
      console.log('\nUpdated tracks:');
      updateResult.rows.forEach(track => {
        console.log(`ID: ${track.id}, Title: ${track.title}`);
        console.log(`New URL: ${track.file_url}`);
      });
    }
    
    console.log('\n🎯 Track URLs have been fixed!');
    
  } catch (error) {
    console.error('❌ Error fixing track URLs:', error);
  } finally {
    process.exit(0);
  }
}

fixTrackUrls();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { extractAudioMetadata } = require('../server/src/utils/audioMetadata');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'openstream',
  password: 'password',
  port: 5432,
});

async function fixMidnightRice() {
  try {
    console.log('🎵 Fixing "midnight rice" track duration...\n');
    
    // Get the midnight rice track
    const result = await pool.query(`
      SELECT id, title, artist, file_url, duration 
      FROM tracks 
      WHERE title ILIKE '%midnight rice%'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ "midnight rice" track not found');
      return;
    }
    
    const track = result.rows[0];
    console.log(`🎵 Found track: "${track.title}" by ${track.artist}`);
    console.log(`   Current duration: ${track.duration || 'NULL'}`);
    console.log(`   File URL: ${track.file_url}`);
    
    // Extract filename and build path
    const filename = track.file_url.split('/').pop();
    const filePath = path.join(__dirname, '..', 'uploads', 'tracks', filename);
    
    console.log(`   Looking for file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ File not found: ${filename}`);
      
      // List all files in uploads directory
      const uploadsDir = path.join(__dirname, '..', 'uploads', 'tracks');
      const files = fs.readdirSync(uploadsDir);
      console.log(`   📁 Available files in uploads directory:`);
      files.forEach((file, index) => {
        console.log(`      ${index + 1}. ${file}`);
      });
      
      return;
    }
    
    console.log(`   ✅ File found!`);
    
    // Extract duration
    const metadata = await extractAudioMetadata(filePath);
    const duration = metadata.duration;
    
    if (duration && duration > 0) {
      // Update database
      await pool.query(
        'UPDATE tracks SET duration = $1, updated_at = NOW() WHERE id = $2',
        [duration, track.id]
      );
      
      console.log(`   ✅ Updated duration to: ${duration} seconds`);
      console.log(`   🎉 Track should now display proper duration in UI!`);
      
    } else {
      console.log(`   ❌ Could not extract valid duration from file`);
      console.log(`   Metadata:`, metadata);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixMidnightRice();

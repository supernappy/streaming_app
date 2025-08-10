#!/usr/bin/env node

const { Pool } = require('pg');
const { extractAudioMetadata } = require('../server/src/utils/audioMetadata');
const path = require('path');
const fs = require('fs');

// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'openstream',
  password: 'password',
  port: 5432,
});

/**
 * Update duration metadata for all existing tracks
 */
async function updateTrackDurations() {
  console.log('🎵 Starting track duration update...');
  
  try {
    // Get all tracks that need duration updates
    const tracksResult = await pool.query(`
      SELECT id, title, file_url, duration 
      FROM tracks 
      ORDER BY id
    `);
    
    const tracks = tracksResult.rows;
    console.log(`📊 Found ${tracks.length} tracks to process`);
    
    if (tracks.length === 0) {
      console.log('✅ No tracks found to update');
      return;
    }
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const track of tracks) {
      console.log(`\n🎵 Processing track ${track.id}: "${track.title}"`);
      console.log(`   Current duration: ${track.duration}`);
      console.log(`   File URL: ${track.file_url}`);
      
      try {
        // Extract filename from URL
        const urlParts = track.file_url.split('/');
        const filename = urlParts[urlParts.length - 1];
        const filePath = path.join(__dirname, '..', 'uploads', 'tracks', filename);
        
        console.log(`   Local file path: ${filePath}`);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          console.log(`   ❌ File not found: ${filePath}`);
          errors++;
          continue;
        }
        
        // Extract metadata
        const metadata = await extractAudioMetadata(filePath);
        
        if (metadata.duration && metadata.duration > 0) {
          // Update database with extracted duration
          await pool.query(
            'UPDATE tracks SET duration = $1, updated_at = NOW() WHERE id = $2',
            [metadata.duration, track.id]
          );
          
          console.log(`   ✅ Updated duration to: ${metadata.duration} seconds`);
          updated++;
        } else {
          console.log(`   ⚠️ Could not extract valid duration from file`);
          skipped++;
        }
      } catch (error) {
        console.log(`   ❌ Error processing track: ${error.message}`);
        errors++;
      }
    }
    
    console.log('\n📊 Update Summary:');
    console.log(`   ✅ Successfully updated: ${updated} tracks`);
    console.log(`   ⚠️ Skipped: ${skipped} tracks`);
    console.log(`   ❌ Errors: ${errors} tracks`);
    console.log(`   📊 Total processed: ${tracks.length} tracks`);
    
  } catch (error) {
    console.error('🔥 Fatal error:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  updateTrackDurations().catch(console.error);
}

module.exports = { updateTrackDurations };

#!/usr/bin/env node

/**
 * Update Track Durations Script
 * Updates all existing tracks in OpenStream with proper duration metadata
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { extractAudioMetadata } = require('../server/src/utils/audioMetadata');

// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'openstream',
  password: 'password',
  port: 5432,
});

async function updateTrackDurations() {
  console.log('🎵 OpenStream Track Duration Update');
  console.log('=====================================\n');

  try {
    // Get all tracks from database
    const result = await pool.query(`
      SELECT id, title, artist, file_url, duration 
      FROM tracks 
      ORDER BY id
    `);

    const tracks = result.rows;
    console.log(`📊 Found ${tracks.length} tracks in database\n`);

    if (tracks.length === 0) {
      console.log('✅ No tracks found to update');
      return;
    }

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const track of tracks) {
      console.log(`🎵 Processing Track ${track.id}: "${track.title}" by ${track.artist}`);
      console.log(`   Current duration: ${track.duration || 'NULL'}`);
      console.log(`   File URL: ${track.file_url}`);

      try {
        // Extract filename from URL (e.g., http://localhost:3001/uploads/tracks/filename.mp3)
        const urlParts = track.file_url.split('/');
        const filename = urlParts[urlParts.length - 1];
        const filePath = path.join(__dirname, '..', 'uploads', 'tracks', filename);

        console.log(`   Local path: ${filePath}`);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
          console.log(`   ❌ File not found: ${filename}`);
          errors++;
          continue;
        }

        // Extract audio metadata
        const metadata = await extractAudioMetadata(filePath);
        const duration = metadata.duration;

        if (duration && duration > 0) {
          // Update the database
          await pool.query(
            'UPDATE tracks SET duration = $1, updated_at = NOW() WHERE id = $2',
            [duration, track.id]
          );
          
          console.log(`   ✅ Updated duration to: ${duration} seconds (${formatDuration(duration)})`);
          updated++;
        } else {
          console.log(`   ⚠️ Could not extract valid duration from file`);
          skipped++;
        }

      } catch (error) {
        console.log(`   ❌ Error processing track: ${error.message}`);
        errors++;
      }

      console.log(''); // Empty line for readability
    }

    console.log('📊 Update Summary:');
    console.log(`   ✅ Successfully updated: ${updated} tracks`);
    console.log(`   ⚠️ Skipped: ${skipped} tracks`);
    console.log(`   ❌ Errors: ${errors} tracks`);
    console.log(`   📊 Total processed: ${tracks.length} tracks`);

    if (updated > 0) {
      console.log('\n🎉 Duration metadata update completed successfully!');
      console.log('   All tracks should now display proper duration in the interface.');
    }

  } catch (error) {
    console.error('🔥 Fatal error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

/**
 * Format duration from seconds to MM:SS or HH:MM:SS
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) {
    return '0:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// Run the script
if (require.main === module) {
  updateTrackDurations().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { updateTrackDurations };

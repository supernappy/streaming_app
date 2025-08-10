#!/usr/bin/env node

// Simple script to check and update track durations
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runQuery(sql) {
  try {
    const result = execSync(
      `PGPASSWORD=password psql -h localhost -U postgres -d openstream -t -c "${sql}"`,
      { encoding: 'utf8' }
    );
    return result.trim();
  } catch (error) {
    console.error('SQL Error:', error.message);
    return null;
  }
}

function extractDuration(filePath) {
  try {
    const result = execSync(
      `ffprobe -v quiet -print_format json -show_format "${filePath}"`,
      { encoding: 'utf8' }
    );
    const metadata = JSON.parse(result);
    return parseFloat(metadata.format.duration) || null;
  } catch (error) {
    console.error(`Error extracting duration from ${filePath}:`, error.message);
    return null;
  }
}

async function updateTrackDurations() {
  console.log('🎵 OpenStream Track Duration Update Tool');
  console.log('========================================\n');

  // Get all tracks
  const tracksData = runQuery('SELECT id, title, file_url, duration FROM tracks ORDER BY id;');
  
  if (!tracksData) {
    console.error('❌ Could not fetch tracks from database');
    return;
  }

  const lines = tracksData.split('\n').filter(line => line.trim());
  console.log(`📊 Found ${lines.length} tracks in database\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const line of lines) {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 4) continue;

    const [id, title, fileUrl, currentDuration] = parts;
    
    console.log(`🎵 Track ${id}: "${title}"`);
    console.log(`   Current duration: ${currentDuration === '' ? 'NULL' : currentDuration}`);
    
    // Extract filename from URL
    const filename = fileUrl.split('/').pop();
    const filePath = path.join(__dirname, '..', 'uploads', 'tracks', filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ File not found: ${filename}`);
      errors++;
      continue;
    }
    
    // Extract duration
    const duration = extractDuration(filePath);
    
    if (duration && duration > 0) {
      // Update database
      const updateResult = runQuery(
        `UPDATE tracks SET duration = ${duration}, updated_at = NOW() WHERE id = ${id};`
      );
      
      if (updateResult !== null) {
        console.log(`   ✅ Updated duration to: ${duration} seconds`);
        updated++;
      } else {
        console.log(`   ❌ Failed to update database`);
        errors++;
      }
    } else {
      console.log(`   ⚠️ Could not extract valid duration`);
      skipped++;
    }
    
    console.log(''); // Empty line
  }

  console.log('📊 Final Summary:');
  console.log(`   ✅ Successfully updated: ${updated} tracks`);
  console.log(`   ⚠️ Skipped: ${skipped} tracks`);
  console.log(`   ❌ Errors: ${errors} tracks`);
  console.log(`   📊 Total processed: ${lines.length} tracks`);
}

updateTrackDurations().catch(console.error);

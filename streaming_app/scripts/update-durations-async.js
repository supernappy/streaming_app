#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Log output to a file instead of console to avoid truncation
const logFile = path.join(__dirname, 'duration-update-log.txt');
const logStream = fs.createWriteStream(logFile, { flags: 'w' });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  logStream.write(logMessage);
  console.log(message);
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Command failed: ${errorOutput}`));
      }
    });
  });
}

async function extractDuration(filePath) {
  try {
    const output = await runCommand('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      filePath
    ]);
    
    const metadata = JSON.parse(output);
    return parseFloat(metadata.format.duration) || null;
  } catch (error) {
    log(`Error extracting duration from ${filePath}: ${error.message}`);
    return null;
  }
}

async function getTracks() {
  try {
    const output = await runCommand('psql', [
      '-h', 'localhost',
      '-U', 'postgres',
      '-d', 'openstream',
      '-t',
      '-c', 'SELECT id, title, file_url, duration FROM tracks ORDER BY id;'
    ], { env: { ...process.env, PGPASSWORD: 'password' } });
    
    return output.split('\n').filter(line => line.trim()).map(line => {
      const parts = line.split('|').map(p => p.trim());
      return {
        id: parts[0],
        title: parts[1],
        fileUrl: parts[2],
        duration: parts[3] === '' ? null : parseFloat(parts[3])
      };
    });
  } catch (error) {
    log(`Error fetching tracks: ${error.message}`);
    return [];
  }
}

async function updateTrackDuration(trackId, duration) {
  try {
    await runCommand('psql', [
      '-h', 'localhost',
      '-U', 'postgres',
      '-d', 'openstream',
      '-c', `UPDATE tracks SET duration = ${duration}, updated_at = NOW() WHERE id = ${trackId};`
    ], { env: { ...process.env, PGPASSWORD: 'password' } });
    return true;
  } catch (error) {
    log(`Error updating track ${trackId}: ${error.message}`);
    return false;
  }
}

async function main() {
  log('🎵 Starting OpenStream Track Duration Update');
  log('============================================');

  // Check uploads directory
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'tracks');
  if (!fs.existsSync(uploadsDir)) {
    log(`❌ Uploads directory not found: ${uploadsDir}`);
    return;
  }

  const files = fs.readdirSync(uploadsDir);
  log(`📁 Found ${files.length} audio files in uploads directory`);

  // Get tracks from database
  const tracks = await getTracks();
  log(`📊 Found ${tracks.length} tracks in database`);

  if (tracks.length === 0) {
    log('⚠️ No tracks found in database');
    return;
  }

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const track of tracks) {
    log(`\n🎵 Processing track ${track.id}: "${track.title}"`);
    log(`   Current duration: ${track.duration || 'NULL'}`);
    log(`   File URL: ${track.fileUrl}`);

    // Extract filename
    const filename = track.fileUrl.split('/').pop();
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      log(`   ❌ File not found: ${filename}`);
      errors++;
      continue;
    }

    // Extract duration
    const duration = await extractDuration(filePath);

    if (duration && duration > 0) {
      // Update database
      const success = await updateTrackDuration(track.id, duration);
      if (success) {
        log(`   ✅ Updated duration to: ${duration} seconds`);
        updated++;
      } else {
        log(`   ❌ Failed to update database`);
        errors++;
      }
    } else {
      log(`   ⚠️ Could not extract valid duration`);
      skipped++;
    }
  }

  log('\n📊 Final Summary:');
  log(`   ✅ Successfully updated: ${updated} tracks`);
  log(`   ⚠️ Skipped: ${skipped} tracks`);
  log(`   ❌ Errors: ${errors} tracks`);
  log(`   📊 Total processed: ${tracks.length} tracks`);

  logStream.end();
  log(`\n📄 Full log saved to: ${logFile}`);
}

main().catch(error => {
  log(`🔥 Fatal error: ${error.message}`);
  logStream.end();
});

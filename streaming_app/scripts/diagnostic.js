console.log('🎵 OpenStream Track Duration Updater');
console.log('===================================\n');

const fs = require('fs');
const path = require('path');

// First, let's check what files we have
const uploadsDir = path.join(__dirname, '..', 'uploads', 'tracks');

console.log(`📁 Checking uploads directory: ${uploadsDir}`);
console.log(`📁 Directory exists: ${fs.existsSync(uploadsDir)}`);

if (fs.existsSync(uploadsDir)) {
  const files = fs.readdirSync(uploadsDir);
  console.log(`📊 Found ${files.length} files:`);
  
  files.forEach((file, index) => {
    const filePath = path.join(uploadsDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`   ${index + 1}. ${file} (${sizeKB}KB)`);
  });
} else {
  console.log('❌ Uploads directory not found!');
}

console.log('\n🔄 Now testing ffprobe...');

// Test ffprobe on one file
const { spawn } = require('child_process');

function testFFprobe(filename) {
  return new Promise((resolve) => {
    const filePath = path.join(uploadsDir, filename);
    console.log(`🎵 Testing FFprobe on: ${filename}`);
    
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      filePath
    ]);
    
    let output = '';
    let errorOutput = '';
    
    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ffprobe.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    ffprobe.on('close', (code) => {
      if (code === 0) {
        try {
          const metadata = JSON.parse(output);
          const duration = metadata.format.duration;
          console.log(`   ✅ Duration extracted: ${duration} seconds`);
          resolve(duration);
        } catch (error) {
          console.log(`   ❌ Parse error: ${error.message}`);
          resolve(null);
        }
      } else {
        console.log(`   ❌ FFprobe failed: ${errorOutput}`);
        resolve(null);
      }
    });
  });
}

async function main() {
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    if (files.length > 0) {
      // Test the first file
      await testFFprobe(files[0]);
    }
  }
  
  console.log('\n🗄️ Now testing database connection...');
  
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'openstream', 
      password: 'password',
      port: 5432,
    });
    
    const result = await pool.query('SELECT COUNT(*) as count FROM tracks');
    console.log(`✅ Database connected. Found ${result.rows[0].count} tracks.`);
    
    const tracks = await pool.query('SELECT id, title, duration FROM tracks ORDER BY id');
    tracks.rows.forEach(track => {
      const status = track.duration ? `${track.duration}s` : 'MISSING';
      console.log(`   Track ${track.id}: "${track.title}" - ${status}`);
    });
    
    await pool.end();
    
  } catch (error) {
    console.log(`❌ Database error: ${error.message}`);
  }
  
  console.log('\n✅ Diagnostic complete!');
}

main().catch(console.error);

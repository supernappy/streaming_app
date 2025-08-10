const fs = require('fs');
const path = require('path');

// Simple duration update using cURL to the existing API
async function updateAllTrackDurations() {
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'tracks');
  
  console.log('📁 Checking uploads directory:', uploadsDir);
  
  if (!fs.existsSync(uploadsDir)) {
    console.error('❌ Uploads directory not found');
    return;
  }
  
  const files = fs.readdirSync(uploadsDir);
  console.log(`📊 Found ${files.length} audio files:`);
  
  files.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });
  
  console.log('\n🎵 To update durations, we need to extract metadata from each file...');
  console.log('📝 Files to process:');
  
  files.forEach(file => {
    const filePath = path.join(uploadsDir, file);
    const stats = fs.statSync(filePath);
    console.log(`   ${file} (${Math.round(stats.size / 1024)}KB)`);
  });
}

updateAllTrackDurations();

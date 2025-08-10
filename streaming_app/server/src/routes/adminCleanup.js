const express = require('express');
const { pool } = require('../utils/database');
const { authMiddleware } = require('../middleware/auth');
const { extractAudioMetadata } = require('../utils/audioMetadata');
const fs = require('fs');
const path = require('path');
const router = express.Router();

/**
 * @swagger
 * /api/admin/cleanup-tracks:
 *   post:
 *     summary: Clean up tracks and update durations
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Track cleanup completed
 */
router.post('/cleanup-tracks', authMiddleware, async (req, res) => {
  try {
    console.log('🧹 ADMIN: Starting track cleanup and duration update...');
    
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'tracks');
    
    // Get all files in uploads directory
    const existingFiles = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
    console.log(`📁 Found ${existingFiles.length} files in uploads directory`);
    
    // Get all tracks from database
    const tracksResult = await pool.query(`
      SELECT id, title, artist, file_url, duration 
      FROM tracks 
      ORDER BY id
    `);
    
    const tracks = tracksResult.rows;
    console.log(`📊 Found ${tracks.length} tracks in database`);
    
    const results = {
      filesFound: existingFiles.length,
      tracksInDB: tracks.length,
      updated: 0,
      deleted: 0,
      errors: 0,
      details: []
    };
    
    for (const track of tracks) {
      const trackResult = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        currentDuration: track.duration,
        action: 'pending',
        message: ''
      };
      
      try {
        // Extract filename from URL
        const filename = track.file_url.split('/').pop();
        const filePath = path.join(uploadsDir, filename);
        
        console.log(`🎵 Processing track ${track.id}: "${track.title}" (${filename})`);
        
        // Check if file exists
        if (!existingFiles.includes(filename)) {
          // File doesn't exist, remove from database
          await pool.query('DELETE FROM tracks WHERE id = $1', [track.id]);
          
          trackResult.action = 'deleted';
          trackResult.message = `Track removed from database (file not found: ${filename})`;
          results.deleted++;
          
          console.log(`   🗑️ Deleted track record (file missing)`);
        } else if (!track.duration || track.duration === null) {
          // File exists but duration is missing, update it
          const metadata = await extractAudioMetadata(filePath);
          
          if (metadata.duration && metadata.duration > 0) {
            await pool.query(
              'UPDATE tracks SET duration = $1, updated_at = NOW() WHERE id = $2',
              [metadata.duration, track.id]
            );
            
            trackResult.action = 'updated';
            trackResult.newDuration = metadata.duration;
            trackResult.message = `Duration updated to ${metadata.duration} seconds`;
            results.updated++;
            
            console.log(`   ✅ Updated duration to: ${metadata.duration} seconds`);
          } else {
            trackResult.action = 'error';
            trackResult.message = 'Could not extract valid duration';
            results.errors++;
            
            console.log(`   ❌ Could not extract duration`);
          }
        } else {
          trackResult.action = 'skipped';
          trackResult.message = 'Already has duration';
          
          console.log(`   ⏭️ Already has duration: ${track.duration}s`);
        }
        
      } catch (error) {
        trackResult.action = 'error';
        trackResult.message = error.message;
        results.errors++;
        
        console.log(`   ❌ Error: ${error.message}`);
      }
      
      results.details.push(trackResult);
    }
    
    console.log('\n📊 Cleanup Summary:');
    console.log(`   📁 Files in uploads: ${results.filesFound}`);
    console.log(`   📊 Tracks in database: ${results.tracksInDB}`);
    console.log(`   ✅ Durations updated: ${results.updated}`);
    console.log(`   🗑️ Records deleted: ${results.deleted}`);
    console.log(`   ❌ Errors: ${results.errors}`);
    
    res.json({
      message: 'Track cleanup and duration update completed',
      results
    });
    
  } catch (error) {
    console.error('Admin cleanup tracks error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

module.exports = router;

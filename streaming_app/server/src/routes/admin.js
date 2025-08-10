const express = require('express');
const { pool } = require('../utils/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { extractAudioMetadata } = require('../utils/audioMetadata');
const fs = require('fs');
const path = require('path');
const router = express.Router();

/**
 * @swagger
 * /api/admin/update-track-durations:
 *   post:
 *     summary: Update duration metadata for all tracks
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Track durations updated successfully
 */
router.post('/update-track-durations', authMiddleware, async (req, res) => {
  try {
    console.log('🎵 ADMIN: Starting track duration update...');
    
    // Get all tracks that need duration updates
    const tracksResult = await pool.query(`
      SELECT id, title, artist, file_url, duration 
      FROM tracks 
      ORDER BY id
    `);
    
    const tracks = tracksResult.rows;
    console.log(`📊 Found ${tracks.length} tracks to process`);
    
    const results = {
      total: tracks.length,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: []
    };
    
    for (const track of tracks) {
      const trackResult = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        currentDuration: track.duration,
        newDuration: null,
        status: 'pending',
        message: ''
      };
      
      try {
        console.log(`🎵 Processing track ${track.id}: "${track.title}"`);
        
        // Extract filename from URL
        const urlParts = track.file_url.split('/');
        const filename = urlParts[urlParts.length - 1];
        const filePath = path.join(__dirname, '..', '..', 'uploads', 'tracks', filename);
        
        console.log(`   File path: ${filePath}`);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          trackResult.status = 'error';
          trackResult.message = `File not found: ${filename}`;
          results.errors++;
          console.log(`   ❌ ${trackResult.message}`);
          results.details.push(trackResult);
          continue;
        }
        
        // Extract metadata
        const metadata = await extractAudioMetadata(filePath);
        
        if (metadata.duration && metadata.duration > 0) {
          // Update database
          await pool.query(
            'UPDATE tracks SET duration = $1, updated_at = NOW() WHERE id = $2',
            [metadata.duration, track.id]
          );
          
          trackResult.newDuration = metadata.duration;
          trackResult.status = 'updated';
          trackResult.message = `Updated from ${track.duration || 'NULL'} to ${metadata.duration} seconds`;
          results.updated++;
          
          console.log(`   ✅ Updated duration to: ${metadata.duration} seconds`);
        } else {
          trackResult.status = 'skipped';
          trackResult.message = 'Could not extract valid duration';
          results.skipped++;
          console.log(`   ⚠️ Could not extract valid duration`);
        }
        
      } catch (error) {
        trackResult.status = 'error';
        trackResult.message = error.message;
        results.errors++;
        console.log(`   ❌ Error: ${error.message}`);
      }
      
      results.details.push(trackResult);
    }
    
    console.log('📊 Update Summary:');
    console.log(`   ✅ Successfully updated: ${results.updated} tracks`);
    console.log(`   ⚠️ Skipped: ${results.skipped} tracks`);
    console.log(`   ❌ Errors: ${results.errors} tracks`);
    
    res.json({
      message: 'Track duration update completed',
      results
    });
    
  } catch (error) {
    console.error('Admin update track durations error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/admin/track-status:
 *   get:
 *     summary: Get status of all tracks
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Track status information
 */
router.get('/track-status', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, title, artist, duration, file_url, created_at
      FROM tracks 
      ORDER BY id
    `);
    
    const tracks = result.rows;
    const withDuration = tracks.filter(t => t.duration !== null).length;
    const withoutDuration = tracks.filter(t => t.duration === null).length;
    
    res.json({
      summary: {
        total: tracks.length,
        withDuration,
        withoutDuration
      },
      tracks: tracks.map(track => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        duration: track.duration,
        hasDuration: track.duration !== null,
        filename: track.file_url.split('/').pop(),
        created_at: track.created_at
      }))
    });
    
  } catch (error) {
    console.error('Get track status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/recreate-tracks:
 *   post:
 *     summary: Recreate track entries from existing files
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tracks recreated successfully
 */
router.post('/recreate-tracks', authMiddleware, async (req, res) => {
  try {
    console.log('🔄 ADMIN: Recreating tracks from existing files...');
    
    const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads', 'tracks');
    const existingFiles = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
    
    console.log(`📁 Found ${existingFiles.length} files in uploads directory`);
    
    const results = {
      filesFound: existingFiles.length,
      tracksCreated: 0,
      errors: 0,
      details: []
    };
    
    // Get the user ID (assuming the logged-in user will own these tracks)
    const userId = req.user.userId;
    
    for (const filename of existingFiles) {
      const fileResult = {
        filename,
        action: 'pending',
        message: ''
      };
      
      try {
        const filePath = path.join(uploadsDir, filename);
        
        console.log(`🎵 Processing file: ${filename}`);
        
        // Extract metadata
        const metadata = await extractAudioMetadata(filePath);
        
        // Create meaningful title and artist from filename or metadata
        const baseTitle = metadata.title || path.parse(filename).name;
        const artist = metadata.artist || 'Unknown Artist';
        const duration = metadata.duration || null;
        const fileUrl = `http://localhost:5002/uploads/tracks/${filename}`;
        
        // Insert track into database
        const result = await pool.query(
          `INSERT INTO tracks (title, artist, album, genre, duration, file_url, 
           user_id, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
           RETURNING *`,
          [baseTitle, artist, metadata.album, metadata.genre, duration, fileUrl, userId]
        );
        
        const newTrack = result.rows[0];
        
        fileResult.action = 'created';
        fileResult.trackId = newTrack.id;
        fileResult.title = newTrack.title;
        fileResult.artist = newTrack.artist;
        fileResult.duration = newTrack.duration;
        fileResult.message = `Track created with ID ${newTrack.id}`;
        results.tracksCreated++;
        
        console.log(`   ✅ Created track: "${newTrack.title}" by ${newTrack.artist} (${duration}s)`);
        
      } catch (error) {
        fileResult.action = 'error';
        fileResult.message = error.message;
        results.errors++;
        
        console.log(`   ❌ Error processing ${filename}: ${error.message}`);
      }
      
      results.details.push(fileResult);
    }
    
    console.log('\n📊 Recreation Summary:');
    console.log(`   📁 Files processed: ${results.filesFound}`);
    console.log(`   ✅ Tracks created: ${results.tracksCreated}`);
    console.log(`   ❌ Errors: ${results.errors}`);
    
    res.json({
      message: 'Track recreation completed',
      results
    });
    
  } catch (error) {
    console.error('Admin recreate tracks error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

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
    
    const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads', 'tracks');
    
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

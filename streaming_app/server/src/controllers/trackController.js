const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { pool } = require('../utils/database');
const { authMiddleware } = require('../middleware/auth');
const { transcodeAudio } = require('../services/audioService');
const { uploadToMinio } = require('../services/storageService');
const { extractAudioMetadata, validateAudioFile } = require('../utils/audioMetadata');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('File upload attempt:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg', 'application/octet-stream'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only audio files are allowed.`));
    }
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Track:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         artist:
 *           type: string
 *         album:
 *           type: string
 *         genre:
 *           type: string
 *         duration:
 *           type: number
 *         file_url:
 *           type: string
 *         hls_url:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/tracks:
 *   get:
 *     summary: Get all tracks
 *     tags: [Tracks]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *       - in: query
 *         name: artist
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of tracks
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { genre, artist } = req.query;

    let query = 'SELECT * FROM tracks WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (genre) {
      query += ` AND genre ILIKE $${paramIndex}`;
      params.push(`%${genre}%`);
      paramIndex++;
    }

    if (artist) {
      query += ` AND artist ILIKE $${paramIndex}`;
      params.push(`%${artist}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM tracks WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;

    if (genre) {
      countQuery += ` AND genre ILIKE $${countParamIndex}`;
      countParams.push(`%${genre}%`);
      countParamIndex++;
    }

    if (artist) {
      countQuery += ` AND artist ILIKE $${countParamIndex}`;
      countParams.push(`%${artist}%`);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalTracks = parseInt(countResult.rows[0].count);

    res.json({
      tracks: result.rows,
      pagination: {
        page,
        limit,
        total: totalTracks,
        pages: Math.ceil(totalTracks / limit)
      }
    });
  } catch (error) {
    console.error('Get tracks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all tracks for authenticated user
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(
      `SELECT id, title, artist, duration, file_url, created_at, play_count, is_public
       FROM tracks 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ tracks: result.rows });
  } catch (error) {
    console.error('Get user tracks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// IMPORTANT: Keep more specific/static routes ABOVE the dynamic '/:id' route to avoid conflicts.
// Move recent/liked routes above (originally were placed after and shadowed by '/:id').
// Recent tracks
router.get('/recent', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 10;

    const result = await pool.query(
      `SELECT t.*, u.username as artist_name 
       FROM tracks t 
       INNER JOIN users u ON t.user_id = u.id 
       WHERE t.user_id = $1 
       ORDER BY t.created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Recent tracks error:', error);
    res.status(500).json({ error: 'Failed to fetch recent tracks' });
  }
});

// Liked tracks
router.get('/liked', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT t.*, u.username as artist_name, tl.created_at as liked_at
       FROM tracks t 
       INNER JOIN track_likes tl ON t.id = tl.track_id 
       INNER JOIN users u ON t.user_id = u.id 
       WHERE tl.user_id = $1 
       ORDER BY tl.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Liked tracks error:', error);
    res.status(500).json({ error: 'Failed to fetch liked tracks' });
  }
});

/**
 * @swagger
 * /api/tracks/{id}:
 *   get:
 *     summary: Get track by ID (no side effects)
 *     tags: [Tracks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Track details
 *       404:
 *         description: Track not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM tracks WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }
    res.json({ track: result.rows[0] });
  } catch (error) {
    console.error('Get track error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/tracks/{id}/play:
 *   post:
 *     summary: Increment play count for a track
 *     tags: [Tracks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated track with incremented play_count
 *       404:
 *         description: Track not found
 */
router.post('/:id/play', async (req, res) => {
  try {
    const { id } = req.params;
    const { roomId } = req.body || {};
    const result = await pool.query(
      'UPDATE tracks SET play_count = play_count + 1, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }
    const updated = result.rows[0];
    try {
      const { getIO } = require('../utils/socket');
      const io = getIO && getIO();
      if (io) {
        const payload = { trackId: updated.id, play_count: updated.play_count };
        if (roomId) {
          io.to(`room_${roomId}`).emit('track:play-count-updated', payload);
        } else {
          io.emit('track:play-count-updated', payload);
        }
      }
    } catch (emitErr) {
      console.warn('Socket emit failed for play count update:', emitErr.message);
    }
    res.json({ track: updated });
  } catch (error) {
    console.error('Play track (increment) error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/tracks:
 *   post:
 *     summary: Upload a new track
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               artist:
 *                 type: string
 *               album:
 *                 type: string
 *               genre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Track uploaded successfully
 *       400:
 *         description: Validation error
 */
router.post('/', authMiddleware, (req, res, next) => {
  upload.single('audio')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err.message.includes('Invalid file type')) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: 'Upload failed: ' + err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const { title, artist, album, genre } = req.body;
    const trackId = uuidv4();
    const userId = req.user.userId;

    // TEMPORARY FIX: Save file locally instead of MinIO
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, '../../../uploads/tracks');
    
    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('Track ID:', trackId);
    console.log('Original filename:', req.file.originalname);
    console.log('File buffer size:', req.file.buffer.length);
    console.log('Uploads directory:', uploadsDir);
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      console.log('Creating uploads directory...');
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filename = `${trackId}${path.extname(req.file.originalname)}`;
    const filePath = path.join(uploadsDir, filename);
    
    console.log('Final filename:', filename);
    console.log('Full file path:', filePath);
    
    // Write file to local storage
    fs.writeFileSync(filePath, req.file.buffer);
    
    console.log('File written successfully');
    console.log('File exists check:', fs.existsSync(filePath));
    
    // Extract audio metadata
    console.log('🎵 UPLOAD: Extracting audio metadata...');
    let audioMetadata = {};
    try {
      audioMetadata = await extractAudioMetadata(filePath);
      console.log('🎵 UPLOAD: Metadata extracted successfully:', audioMetadata);
    } catch (metadataError) {
      console.warn('⚠️ UPLOAD: Failed to extract metadata:', metadataError.message);
      // Continue with upload even if metadata extraction fails
    }
    
    // Create URL for local file
    const fileUrl = `http://localhost:5002/uploads/tracks/${filename}`;

    // Use extracted metadata to fill missing fields
    const finalTitle = title || audioMetadata.title || path.parse(req.file.originalname).name;
    const finalArtist = artist || audioMetadata.artist || 'Unknown Artist';
    const finalAlbum = album || audioMetadata.album || null;
    const finalGenre = genre || audioMetadata.genre || null;
    const duration = audioMetadata.duration || null;

    console.log('🎵 UPLOAD: Final track data:', {
      title: finalTitle,
      artist: finalArtist,
      album: finalAlbum,
      genre: finalGenre,
      duration: duration,
      fileUrl: fileUrl
    });

    // Start transcoding process (async) - we'll save HLS URL separately if needed
    // const hlsUrl = await transcodeAudio(req.file.buffer, trackId);

    // Save track metadata to database
    const result = await pool.query(
      `INSERT INTO tracks (title, artist, album, genre, duration, file_url, 
       user_id, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
       RETURNING *`,
      [finalTitle, finalArtist, finalAlbum, finalGenre, duration, fileUrl, userId]
    );

    res.status(201).json({
      message: 'Track uploaded successfully',
      track: result.rows[0]
    });
  } catch (error) {
    console.error('Upload track error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * @swagger
 * /api/tracks/{id}:
 *   put:
 *     summary: Update track metadata
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               artist:
 *                 type: string
 *               album:
 *                 type: string
 *               genre:
 *                 type: string
 *     responses:
 *       200:
 *         description: Track updated successfully
 *       404:
 *         description: Track not found
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist, album, genre } = req.body;
    const userId = req.user.userId;

    // Check if track exists and user owns it (or is admin)
    const trackResult = await pool.query(
      'SELECT * FROM tracks WHERE id = $1',
      [id]
    );

    if (trackResult.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const track = trackResult.rows[0];
    if (track.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Update track
    const result = await pool.query(
      `UPDATE tracks SET title = COALESCE($1, title), 
       artist = COALESCE($2, artist), album = COALESCE($3, album), 
       genre = COALESCE($4, genre), updated_at = NOW() 
       WHERE id = $5 RETURNING *`,
      [title, artist, album, genre, id]
    );

    res.json({
      message: 'Track updated successfully',
      track: result.rows[0]
    });
  } catch (error) {
    console.error('Update track error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/tracks/{id}:
 *   delete:
 *     summary: Delete track
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Track deleted successfully
 *       404:
 *         description: Track not found
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if track exists and user owns it (or is admin)
    const trackResult = await pool.query(
      'SELECT * FROM tracks WHERE id = $1',
      [id]
    );

    if (trackResult.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const track = trackResult.rows[0];
    if (track.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Delete track
    await pool.query('DELETE FROM tracks WHERE id = $1', [id]);

    // TODO: Delete files from MinIO/storage

    res.json({ message: 'Track deleted successfully' });
  } catch (error) {
    console.error('Delete track error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// (Moved recent & liked routes above the dynamic ':id' route)

module.exports = router;

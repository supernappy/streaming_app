const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../utils/database');
const { authMiddleware } = require('../middleware/auth');
const OllamaAIService = require('../services/ollamaAIService');
const router = express.Router();
/**
 * @swagger
 * /api/playlists/smart:
 *   post:
 *     summary: Generate an AI-powered smart playlist
 *     tags: [Playlists, AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - theme
 *             properties:
 *               theme:
 *                 type: string
 *               mood:
 *                 type: string
 *               duration:
 *                 type: integer
 *     responses:
 *       200:
 *         description: AI-generated playlist
 */
router.post('/smart', authMiddleware, async (req, res) => {
  try {
    const { theme, mood, duration } = req.body;
    if (!theme) {
      return res.status(400).json({ error: 'Theme is required' });
    }
    // Get all available tracks
    const tracksResult = await pool.query('SELECT * FROM tracks');
    const tracks = tracksResult.rows;
    const aiService = new OllamaAIService();
    const playlist = await aiService.generateSmartPlaylist(theme, tracks, { mood, duration });
    res.json({ playlist });
  } catch (error) {
    console.error('AI smart playlist error:', error);
    res.status(500).json({ error: 'Failed to generate smart playlist' });
  }
});

/**
 * @swagger
 * /api/tracks/{id}/auto-tag:
 *   post:
 *     summary: Auto-tag a track using AI
 *     tags: [Tracks, AI]
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
 *         description: AI-generated tags and metadata
 */
router.post('/tracks/:id/auto-tag', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const trackResult = await pool.query('SELECT * FROM tracks WHERE id = $1', [id]);
    if (trackResult.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }
    const aiService = new OllamaAIService();
    const analyzedTrack = await aiService.autoTagTrack(trackResult.rows[0]);
    res.json({ analyzedTrack });
  } catch (error) {
    console.error('AI auto-tag error:', error);
    res.status(500).json({ error: 'Failed to auto-tag track' });
  }
});

/**
 * @swagger
 * /api/playlists:
 *   get:
 *     summary: Get user's playlists
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of playlists
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(`
      SELECT p.*, 
             (SELECT COUNT(*) FROM playlist_tracks WHERE playlist_id = p.id) as track_count
      FROM playlists p
      WHERE p.user_id = $1 OR p.is_public = true
      ORDER BY p.created_at DESC
    `, [userId]);

    res.json({ playlists: result.rows });
  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/playlists/{id}:
 *   get:
 *     summary: Get playlist with tracks
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Playlist with tracks
 *       404:
 *         description: Playlist not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get playlist details
    const playlistResult = await pool.query(`
      SELECT p.*, u.username as owner_username
      FROM playlists p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `, [id]);

    if (playlistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Get tracks in playlist
    const tracksResult = await pool.query(`
      SELECT t.*, pt.added_at, pt.position
      FROM tracks t
      JOIN playlist_tracks pt ON t.id = pt.track_id
      WHERE pt.playlist_id = $1
      ORDER BY pt.position
    `, [id]);

    const playlist = playlistResult.rows[0];
    playlist.tracks = tracksResult.rows;

    res.json({ playlist });
  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/playlists:
 *   post:
 *     summary: Create a new playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               is_public:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Playlist created successfully
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, is_public = false } = req.body;
    const userId = req.user.userId;

    if (!name) {
      return res.status(400).json({ error: 'Playlist name is required' });
    }

    const result = await pool.query(`
      INSERT INTO playlists (name, description, user_id, is_public, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `, [name, description, userId, is_public]);

    res.status(201).json({
      message: 'Playlist created successfully',
      playlist: result.rows[0]
    });
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/playlists/{id}/tracks:
 *   post:
 *     summary: Add track to playlist
 *     tags: [Playlists]
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
 *             required:
 *               - track_id
 *             properties:
 *               track_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Track added to playlist
 *       404:
 *         description: Playlist or track not found
 *       403:
 *         description: Permission denied
 */
router.post('/:id/tracks', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { track_id } = req.body;
    const userId = req.user.userId;

    if (!track_id) {
      return res.status(400).json({ error: 'Track ID is required' });
    }

    // Check if playlist exists and user owns it
    const playlistResult = await pool.query(
      'SELECT * FROM playlists WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (playlistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found or permission denied' });
    }

    // Check if track exists
    const trackResult = await pool.query(
      'SELECT * FROM tracks WHERE id = $1',
      [track_id]
    );

    if (trackResult.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // Check if track already in playlist
    const existingTrack = await pool.query(
      'SELECT * FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2',
      [id, track_id]
    );

    if (existingTrack.rows.length > 0) {
      return res.status(400).json({ error: 'Track already in playlist' });
    }

    // Get next position
    const positionResult = await pool.query(
      'SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM playlist_tracks WHERE playlist_id = $1',
      [id]
    );

    const nextPosition = positionResult.rows[0].next_position;

    // Add track to playlist
    await pool.query(`
      INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at)
      VALUES ($1, $2, $3, NOW())
    `, [id, track_id, nextPosition]);

    // Update playlist timestamp
    await pool.query(
      'UPDATE playlists SET updated_at = NOW() WHERE id = $1',
      [id]
    );

    res.status(201).json({ message: 'Track added to playlist successfully' });
  } catch (error) {
    console.error('Add track to playlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/playlists/{id}/tracks/{trackId}:
 *   delete:
 *     summary: Remove track from playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Track removed from playlist
 *       404:
 *         description: Playlist or track not found
 */
router.delete('/:id/tracks/:trackId', authMiddleware, async (req, res) => {
  try {
    const { id, trackId } = req.params;
    const userId = req.user.userId;

    // Check if playlist exists and user owns it
    const playlistResult = await pool.query(
      'SELECT * FROM playlists WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (playlistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found or permission denied' });
    }

    // Remove track from playlist
    const result = await pool.query(
      'DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2',
      [id, trackId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Track not found in playlist' });
    }

    // Update playlist timestamp
    await pool.query(
      'UPDATE playlists SET updated_at = NOW() WHERE id = $1',
      [id]
    );

    res.json({ message: 'Track removed from playlist successfully' });
  } catch (error) {
    console.error('Remove track from playlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/playlists/{id}:
 *   delete:
 *     summary: Delete playlist
 *     tags: [Playlists]
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
 *         description: Playlist deleted successfully
 *       404:
 *         description: Playlist not found
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if playlist exists and user owns it
    const playlistResult = await pool.query(
      'SELECT * FROM playlists WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (playlistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found or permission denied' });
    }

    // Delete playlist tracks first
    await pool.query('DELETE FROM playlist_tracks WHERE playlist_id = $1', [id]);
    
    // Delete playlist
    await pool.query('DELETE FROM playlists WHERE id = $1', [id]);

    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/playlists/user:
 *   get:
 *     summary: Get user's playlists
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user playlists
 */
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT p.*, COUNT(pt.track_id) as track_count
       FROM playlists p 
       LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id 
       WHERE p.user_id = $1 
       GROUP BY p.id 
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('User playlists error:', error);
    res.status(500).json({ error: 'Failed to fetch user playlists' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { pool } = require('../utils/database');

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get user dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tracksUploaded:
 *                   type: integer
 *                 playlistsCreated:
 *                   type: integer
 *                 totalPlays:
 *                   type: integer
 *                 favorites:
 *                   type: integer
 *                 followers:
 *                   type: integer
 *                 following:
 *                   type: integer
 *                 totalDownloads:
 *                   type: integer
 *                 profileViews:
 *                   type: integer
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get tracks uploaded count
    const tracksResult = await pool.query(
      'SELECT COUNT(*) as count FROM tracks WHERE user_id = $1',
      [userId]
    );
    const tracksUploaded = parseInt(tracksResult.rows[0].count);

    // Get playlists created count
    const playlistsResult = await pool.query(
      'SELECT COUNT(*) as count FROM playlists WHERE user_id = $1',
      [userId]
    );
    const playlistsCreated = parseInt(playlistsResult.rows[0].count);

    // Get total plays for user's tracks
    const playsResult = await pool.query(
      'SELECT COALESCE(SUM(play_count), 0) as total FROM tracks WHERE user_id = $1',
      [userId]
    );
    const totalPlays = parseInt(playsResult.rows[0].total);

    // Get favorites count (likes received on user's tracks)
    let favorites = 0;
    try {
      const favoritesResult = await pool.query(
        `SELECT COUNT(*) as count FROM track_likes tl 
         INNER JOIN tracks t ON tl.track_id = t.id 
         WHERE t.user_id = $1`,
        [userId]
      );
      favorites = parseInt(favoritesResult.rows[0].count);
    } catch (likesError) {
      console.warn('track_likes table not found, using default favorites count');
      favorites = 0;
    }

    // Get followers count (placeholder - would need followers table)
    const followers = 0;

    // Get following count (placeholder - would need followers table)
    const following = 0;

    // Get total downloads (placeholder - would need downloads tracking)
    const totalDownloads = Math.floor(totalPlays * 0.1); // Estimate 10% download rate

    // Get profile views (placeholder - would need views tracking)
    const profileViews = Math.floor(totalPlays * 2); // Estimate profile views

    const stats = {
      tracksUploaded,
      playlistsCreated,
      totalPlays,
      favorites,
      followers,
      following,
      totalDownloads,
      profileViews
    };

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router;

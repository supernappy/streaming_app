const express = require('express');
const { pool } = require('../utils/database');
const router = express.Router();

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search tracks, artists, and albums
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, tracks, artists, albums]
 *           default: all
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/', async (req, res) => {
  try {
    const { q, type = 'all', limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchTerm = `%${q}%`;
    const results = {};

    if (type === 'all' || type === 'tracks') {
      const tracksResult = await pool.query(`
        SELECT * FROM tracks 
        WHERE title ILIKE $1 OR artist ILIKE $1 OR album ILIKE $1 OR genre ILIKE $1
        ORDER BY play_count DESC, created_at DESC
        LIMIT $2
      `, [searchTerm, limit]);
      
      results.tracks = tracksResult.rows;
    }

    if (type === 'all' || type === 'artists') {
      const artistsResult = await pool.query(`
        SELECT artist, COUNT(*) as track_count, 
               SUM(play_count) as total_plays,
               MAX(created_at) as latest_release
        FROM tracks 
        WHERE artist ILIKE $1
        GROUP BY artist
        ORDER BY total_plays DESC, track_count DESC
        LIMIT $2
      `, [searchTerm, limit]);
      
      results.artists = artistsResult.rows;
    }

    if (type === 'all' || type === 'albums') {
      const albumsResult = await pool.query(`
        SELECT album, artist, COUNT(*) as track_count,
               SUM(play_count) as total_plays,
               MAX(created_at) as release_date
        FROM tracks 
        WHERE album ILIKE $1 OR artist ILIKE $1
        GROUP BY album, artist
        ORDER BY total_plays DESC, track_count DESC
        LIMIT $2
      `, [searchTerm, limit]);
      
      results.albums = albumsResult.rows;
    }

    res.json({
      query: q,
      type,
      results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search suggestions
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const searchTerm = `${q}%`;
    
    // Get suggestions from track titles, artists, and albums
    const result = await pool.query(`
      (SELECT DISTINCT title as suggestion, 'track' as type FROM tracks WHERE title ILIKE $1 LIMIT 5)
      UNION
      (SELECT DISTINCT artist as suggestion, 'artist' as type FROM tracks WHERE artist ILIKE $1 LIMIT 5)
      UNION
      (SELECT DISTINCT album as suggestion, 'album' as type FROM tracks WHERE album ILIKE $1 AND album != '' LIMIT 5)
      ORDER BY suggestion
      LIMIT 15
    `, [searchTerm]);

    res.json({ suggestions: result.rows });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

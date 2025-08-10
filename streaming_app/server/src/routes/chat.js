// Chat API Routes
const express = require('express');
const router = express.Router();
const { pool } = require('../utils/database');

// Simple auth check (you can enhance this later)
const authCheck = (req, res, next) => {
  // For now, just pass through - you can add proper auth later
  next();
};

/**
 * @swagger
 * /api/chat/{roomId}/messages:
 *   get:
 *     summary: Get chat messages for a room
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chat messages retrieved successfully
 */
router.get('/:roomId/messages', authCheck, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Get messages for the room
    const result = await pool.query(`
      SELECT rm.*, u.username, u.display_name
      FROM room_messages rm
      JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = $1
      ORDER BY rm.created_at DESC
      LIMIT $2 OFFSET $3
    `, [roomId, limit, offset]);

    // Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM room_messages
      WHERE room_id = $1
    `, [roomId]);

    res.json({
      messages: result.rows.reverse(), // Reverse to show oldest first
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/chat/{roomId}/stats:
 *   get:
 *     summary: Get chat statistics for a room
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chat statistics retrieved successfully
 */
router.get('/:roomId/stats', authCheck, async (req, res) => {
  try {
    const { roomId } = req.params;

    // Get chat statistics
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(DISTINCT user_id) as unique_users,
        MIN(created_at) as first_message,
        MAX(created_at) as last_message
      FROM room_messages
      WHERE room_id = $1
    `, [roomId]);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching chat stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

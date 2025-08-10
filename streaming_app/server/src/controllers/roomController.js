const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../utils/database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Get all active rooms
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: List of active rooms
 */
router.get('/', async (req, res) => {
  try {
    const { is_active, category, limit = 20, offset = 0 } = req.query;
    
    let whereClause = 'WHERE r.is_public = true';
    const queryParams = [];
    let paramCount = 0;
    
    if (is_active !== undefined) {
      paramCount++;
      whereClause += ` AND r.is_active = $${paramCount}`;
      queryParams.push(is_active === 'true');
    }
    
    if (category) {
      paramCount++;
      whereClause += ` AND r.category ILIKE $${paramCount}`;
      queryParams.push(`%${category}%`);
    }
    
    paramCount++;
    const limitClause = `LIMIT $${paramCount}`;
    queryParams.push(parseInt(limit));
    
    paramCount++;
    const offsetClause = `OFFSET $${paramCount}`;
    queryParams.push(parseInt(offset));

    const result = await pool.query(`
      SELECT r.*, u.username as host_username, u.display_name as host_display_name,
             COALESCE(r.participant_count, 0) as participant_count
      FROM rooms r
      JOIN users u ON r.host_id = u.id
      ${whereClause}
      ORDER BY r.created_at DESC
      ${limitClause} ${offsetClause}
    `, queryParams);

    res.json({ rooms: result.rows });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/rooms/{id}:
 *   get:
 *     summary: Get room details
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room details
 *       404:
 *         description: Room not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const roomResult = await pool.query(`
      SELECT r.*, u.username as host_username
      FROM rooms r
      JOIN users u ON r.host_id = u.id
      WHERE r.id = $1
    `, [id]);

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Get participants
    const participantsResult = await pool.query(`
      SELECT rp.*, u.username, u.id as user_id
      FROM room_participants rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.room_id = $1
      ORDER BY rp.joined_at
    `, [id]);

    const room = roomResult.rows[0];
    room.participants = participantsResult.rows;

    res.json({ room });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Create a new room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               max_participants:
 *                 type: integer
 *                 default: 100
 *               is_private:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Room created successfully
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, max_participants = 100, is_private = false } = req.body;
    const hostId = req.user.userId;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Create room (convert is_private to is_public, let database auto-generate id)
    const result = await pool.query(`
      INSERT INTO rooms (title, description, host_id, max_participants, 
                        is_public, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      RETURNING *
    `, [title, description, hostId, max_participants, !is_private]);

    const roomId = result.rows[0].id;

    // Add host as participant
    await pool.query(`
      INSERT INTO room_participants (room_id, user_id, role, joined_at)
      VALUES ($1, $2, 'host', NOW())
    `, [roomId, hostId]);

    res.status(201).json({
      message: 'Room created successfully',
      room: result.rows[0]
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/rooms/{id}/join:
 *   post:
 *     summary: Join a room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [listener, speaker]
 *                 default: listener
 *     responses:
 *       200:
 *         description: Joined room successfully
 *       404:
 *         description: Room not found
 *       400:
 *         description: Room is full or user already joined
 */
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { role = 'listener' } = req.body;
    const userId = req.user.userId;

    // Check if room exists and is active
    const roomResult = await pool.query(
      'SELECT * FROM rooms WHERE id = $1 AND is_active = $2',
      [id, true]
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found or inactive' });
    }

    const room = roomResult.rows[0];

    // Check if user already joined
    const existingParticipant = await pool.query(
      'SELECT * FROM room_participants WHERE room_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingParticipant.rows.length > 0) {
      // User already joined - just return success (allow re-entry)
      return res.json({ 
        message: 'Already joined room - welcome back!',
        alreadyJoined: true 
      });
    }

    // Check room capacity
    const participantCount = await pool.query(
      'SELECT COUNT(*) FROM room_participants WHERE room_id = $1',
      [id]
    );

    if (parseInt(participantCount.rows[0].count) >= room.max_participants) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // Add participant
    await pool.query(`
      INSERT INTO room_participants (room_id, user_id, role, joined_at)
      VALUES ($1, $2, $3, NOW())
    `, [id, userId, role]);

    res.json({ message: 'Joined room successfully' });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/rooms/{id}/leave:
 *   post:
 *     summary: Leave a room
 *     tags: [Rooms]
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
 *         description: Left room successfully
 */
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Remove participant
    await pool.query(
      'DELETE FROM room_participants WHERE room_id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/rooms/{id}:
 *   delete:
 *     summary: Delete/close a room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: permanent
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to permanently delete the room
 *     responses:
 *       200:
 *         description: Room deleted successfully
 *       404:
 *         description: Room not found
 *       403:
 *         description: Permission denied
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;
    const userId = req.user.userId;

    // Check if room exists and user is host or admin
    const roomResult = await pool.query(
      'SELECT * FROM rooms WHERE id = $1',
      [id]
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = roomResult.rows[0];
    if (room.host_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    if (permanent === 'true' || permanent === true) {
      // Permanent deletion - remove all related data
      await pool.query('BEGIN');
      
      try {
        // Delete room tracks
        await pool.query('DELETE FROM room_tracks WHERE room_id = $1', [id]);
        
        // Delete room messages
        await pool.query('DELETE FROM room_messages WHERE room_id = $1', [id]);
        
        // Delete room playback state
        await pool.query('DELETE FROM room_playback_state WHERE room_id = $1', [id]);
        
        // Delete room invites
        await pool.query('DELETE FROM room_invites WHERE room_id = $1', [id]);
        
        // Delete room participants
        await pool.query('DELETE FROM room_participants WHERE room_id = $1', [id]);
        
        // Delete the room itself
        await pool.query('DELETE FROM rooms WHERE id = $1', [id]);
        
        await pool.query('COMMIT');
        res.json({ message: 'Room permanently deleted successfully' });
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    } else {
      // Soft delete - mark room as inactive
      await pool.query(
        'UPDATE rooms SET is_active = $1, updated_at = NOW() WHERE id = $2',
        [false, id]
      );

      // Remove all participants
      await pool.query('DELETE FROM room_participants WHERE room_id = $1', [id]);

      res.json({ message: 'Room closed successfully' });
    }
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/rooms/{id}/settings:
 *   get:
 *     summary: Get room settings
 *     tags: [Rooms]
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
 *         description: Room settings retrieved
 *       404:
 *         description: Room not found
 *       403:
 *         description: Permission denied
 */
router.get('/:id/settings', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if room exists and user is host or participant
    const roomResult = await pool.query(`
      SELECT r.*, 
             CASE WHEN r.host_id = $2 THEN true ELSE false END as is_host,
             CASE WHEN rp.user_id IS NOT NULL THEN true ELSE false END as is_participant
      FROM rooms r
      LEFT JOIN room_participants rp ON r.id = rp.room_id AND rp.user_id = $2
      WHERE r.id = $1
    `, [id, userId]);

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = roomResult.rows[0];
    
    // Only hosts and participants can view settings
    if (!room.is_host && !room.is_participant) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Return room settings
    const settings = {
      id: room.id,
      title: room.title,
      description: room.description,
      max_participants: room.max_participants,
      is_public: room.is_public,
      is_active: room.is_active,
      category: room.category,
      allow_chat: room.allow_chat || true,
      allow_reactions: room.allow_reactions || true,
      require_approval: room.require_approval || false,
      mute_participants: room.mute_participants || false,
      host_id: room.host_id,
      created_at: room.created_at,
      updated_at: room.updated_at,
      is_host: room.is_host,
      is_participant: room.is_participant
    };

    res.json({ settings });
  } catch (error) {
    console.error('Get room settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/rooms/{id}/settings:
 *   put:
 *     summary: Update room settings
 *     tags: [Rooms]
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
 *               description:
 *                 type: string
 *               max_participants:
 *                 type: integer
 *               is_public:
 *                 type: boolean
 *               category:
 *                 type: string
 *               allow_chat:
 *                 type: boolean
 *               allow_reactions:
 *                 type: boolean
 *               require_approval:
 *                 type: boolean
 *               mute_participants:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Room settings updated
 *       404:
 *         description: Room not found
 *       403:
 *         description: Permission denied
 */
router.put('/:id/settings', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const {
      title,
      description,
      max_participants,
      is_public,
      category,
      allow_chat,
      allow_reactions,
      require_approval,
      mute_participants,
      background_theme
    } = req.body;

    // Check if room exists and user is host
    const roomResult = await pool.query(
      'SELECT * FROM rooms WHERE id = $1',
      [id]
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = roomResult.rows[0];
    if (room.host_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only room host can modify settings' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (title !== undefined) {
      paramCount++;
      updates.push(`title = $${paramCount}`);
      values.push(title);
    }

    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      values.push(description);
    }

    if (max_participants !== undefined) {
      paramCount++;
      updates.push(`max_participants = $${paramCount}`);
      values.push(max_participants);
    }

    if (is_public !== undefined) {
      paramCount++;
      updates.push(`is_public = $${paramCount}`);
      values.push(is_public);
    }

    if (category !== undefined) {
      paramCount++;
      updates.push(`category = $${paramCount}`);
      values.push(category);
    }

    if (allow_chat !== undefined) {
      paramCount++;
      updates.push(`allow_chat = $${paramCount}`);
      values.push(allow_chat);
    }

    if (allow_reactions !== undefined) {
      paramCount++;
      updates.push(`allow_reactions = $${paramCount}`);
      values.push(allow_reactions);
    }

    if (require_approval !== undefined) {
      paramCount++;
      updates.push(`require_approval = $${paramCount}`);
      values.push(require_approval);
    }

    if (mute_participants !== undefined) {
      paramCount++;
      updates.push(`mute_participants = $${paramCount}`);
      values.push(mute_participants);
    }

    // Handle background_theme with column existence check
    if (background_theme !== undefined) {
      try {
        // Try to add the column if it doesn't exist
        await pool.query(`
          ALTER TABLE rooms 
          ADD COLUMN IF NOT EXISTS background_theme VARCHAR(50) DEFAULT 'chill'
        `);
        
        paramCount++;
        updates.push(`background_theme = $${paramCount}`);
        values.push(background_theme);
      } catch (columnError) {
        console.warn('Could not add background_theme column:', columnError.message);
        // Continue without background_theme update if column addition fails
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid settings provided' });
    }

    // Add updated_at
    paramCount++;
    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    // Add room id for WHERE clause
    paramCount++;
    values.push(id);

    const updateResult = await pool.query(`
      UPDATE rooms 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    res.json({ 
      message: 'Room settings updated successfully',
      room: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Update room settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/rooms/{id}/token:
 *   get:
 *     summary: Get WebRTC token for room
 *     tags: [Rooms]
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
 *         description: WebRTC token generated
 *       404:
 *         description: Room not found
 */
router.get('/:id/token', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if user is participant of the room
    const participantResult = await pool.query(
      'SELECT * FROM room_participants WHERE room_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (participantResult.rows.length === 0) {
      return res.status(403).json({ error: 'User not a participant of this room' });
    }

    // In a real implementation, you would generate a LiveKit token here
    // For now, we'll return a mock token
    const mockToken = `mock_token_${id}_${userId}_${Date.now()}`;

    res.json({ 
      token: mockToken,
      room_id: id,
      user_id: userId,
      role: participantResult.rows[0].role
    });
  } catch (error) {
    console.error('Get token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/rooms/{id}/tracks:
 *   get:
 *     summary: Get room playlist
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room playlist tracks
 */
router.get('/:id/tracks', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('=== SERVER DEBUG: Get room tracks ===');
  console.log('Room ID:', id);
  console.log('User ID:', req.user?.userId || req.user?.id || 'UNKNOWN');
    
    // Verify room exists and user has access
    const roomResult = await pool.query(
      'SELECT * FROM rooms WHERE id = $1',
      [id]
    );
    
    if (roomResult.rows.length === 0) {
      console.log('❌ Room not found:', id);
      return res.status(404).json({ error: 'Room not found' });
    }
    
    console.log('✅ Room found:', roomResult.rows[0].title);
    
    // Get room tracks with track details
    const tracksResult = await pool.query(`
      SELECT rt.room_id, rt.position, rt.added_at, rt.added_by,
             t.id, t.title, t.artist, t.duration, t.file_url, t.cover_url, t.play_count,
             u.username as added_by_username
      FROM room_tracks rt
      JOIN tracks t ON rt.track_id = t.id
      JOIN users u ON rt.added_by = u.id
      WHERE rt.room_id = $1
      ORDER BY rt.position ASC, rt.added_at ASC
    `, [id]);
    
    console.log('Room tracks found:', tracksResult.rows.length);
    console.log('Room tracks data:', tracksResult.rows);
    
    res.json({ tracks: tracksResult.rows });
  } catch (error) {
    console.error('Get room tracks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/rooms/{id}/participants:
 *   get:
 *     summary: Get room participants
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of room participants
 */
router.get('/:id/participants', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Verify room exists
    const roomResult = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Get participants
    const participantsResult = await pool.query(`
      SELECT rp.*, u.username, u.display_name, u.avatar_url
      FROM room_participants rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.room_id = $1
      ORDER BY rp.joined_at ASC
    `, [id]);
    
    res.json({ participants: participantsResult.rows });
  } catch (error) {
    console.error('Get room participants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/rooms/{id}/tracks:
 *   post:
 *     summary: Add track to room playlist
 *     tags: [Rooms]
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
 *               track_id:
 *                 type: string
 *               position:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Track added to room
 */
router.post('/:id/tracks', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { trackId, track_id, position } = req.body;
    const userId = req.user.userId;
    
    console.log('=== SIMPLE DEBUG: Add track to room ===');
    console.log('Room ID:', id, 'User ID:', userId, 'Track ID:', trackId || track_id);
    
    const finalTrackId = trackId || track_id;
    
    if (!finalTrackId) {
      return res.status(400).json({ error: 'Track ID is required' });
    }
    
    // Simple check - is user room host?
    const hostCheck = await pool.query(
      'SELECT id FROM rooms WHERE id = $1 AND host_id = $2',
      [id, userId]
    );
    
    if (hostCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only room host can add tracks' });
    }
    
    // Simple check - does track exist and is owned by user?
    const trackCheck = await pool.query(
      'SELECT id FROM tracks WHERE id = $1 AND user_id = $2',
      [finalTrackId, userId]
    );
    
    if (trackCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found or not owned' });
    }
    
    // Check if track is already in the room
    const duplicateCheck = await pool.query(
      'SELECT id FROM room_tracks WHERE room_id = $1 AND track_id = $2',
      [id, finalTrackId]
    );
    
    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Track is already in this room',
        message: 'This track has already been added to the room.'
      });
    }
    
    // Get next position
    const posResult = await pool.query(
      'SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM room_tracks WHERE room_id = $1',
      [id]
    );
    const nextPosition = posResult.rows[0].next_pos;
    
    // Insert track
    const insertResult = await pool.query(
      'INSERT INTO room_tracks (room_id, track_id, added_by, position, added_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
      [id, finalTrackId, userId, nextPosition]
    );
    
    console.log('✅ Track added successfully, room_track ID:', insertResult.rows[0].id);
    
    res.json({ 
      message: 'Track added to room successfully',
      room_track_id: insertResult.rows[0].id
    });
    
  } catch (error) {
    console.error('❌ SIMPLE ERROR:', error.message);
    console.error('❌ ERROR STACK:', error.stack);
    
    // Handle specific database constraint errors
    if (error.code === '23505' && error.constraint === 'room_tracks_room_id_track_id_key') {
      return res.status(409).json({ 
        error: 'Track is already in this room',
        message: 'This track has already been added to the room.'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to add track to room',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/rooms/{id}/tracks/{trackId}:
 *   delete:
 *     summary: Remove track from room playlist
 *     tags: [Rooms]
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
 *         description: Track removed from room
 */
router.delete('/:id/tracks/:trackId', authMiddleware, async (req, res) => {
  try {
    const { id, trackId } = req.params;
    const userId = req.user.userId;
    
    // Verify room exists and user is participant or host
    const roomResult = await pool.query(
      'SELECT host_id FROM rooms WHERE id = $1',
      [id]
    );
    
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    const isHost = roomResult.rows[0].host_id === userId;
    
    // Check if user is participant or host
    if (!isHost) {
      const participantResult = await pool.query(
        'SELECT * FROM room_participants WHERE room_id = $1 AND user_id = $2',
        [id, userId]
      );
      
      if (participantResult.rows.length === 0) {
        return res.status(403).json({ error: 'Not authorized to remove tracks' });
      }
    }
    
    // Remove track from room playlist
    const deleteResult = await pool.query(
      'DELETE FROM room_tracks WHERE room_id = $1 AND track_id = $2 RETURNING *',
      [id, trackId]
    );
    
    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found in room playlist' });
    }
    
    res.json({ message: 'Track removed from room' });
  } catch (error) {
    console.error('Remove track from room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/rooms/{id}/participants/{userId}:
 *   put:
 *     summary: Update participant status
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
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
 *               is_muted:
 *                 type: boolean
 *               hand_raised:
 *                 type: boolean
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Participant status updated
 */
router.put('/:id/participants/:userId', authMiddleware, async (req, res) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const { is_muted, hand_raised, role } = req.body;
    const requesterId = req.user.userId;
    
    // Verify room exists
    const roomResult = await pool.query(
      'SELECT host_id FROM rooms WHERE id = $1',
      [id]
    );
    
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    const isHost = roomResult.rows[0].host_id === requesterId;
    const isSelf = requesterId === targetUserId;
    
    // Users can update their own status, hosts can update anyone's
    if (!isSelf && !isHost) {
      return res.status(403).json({ error: 'Not authorized to update this participant' });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 0;
    
    if (is_muted !== undefined) {
      paramCount++;
      updates.push(`is_muted = $${paramCount}`);
      values.push(is_muted);
    }
    
    if (hand_raised !== undefined) {
      paramCount++;
      updates.push(`hand_raised = $${paramCount}`);
      values.push(hand_raised);
    }
    
    if (role !== undefined && isHost) {
      paramCount++;
      updates.push(`role = $${paramCount}`);
      values.push(role);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }
    
    paramCount++;
    values.push(id);
    paramCount++;
    values.push(targetUserId);
    
    const updateResult = await pool.query(`
      UPDATE room_participants 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE room_id = $${paramCount - 1} AND user_id = $${paramCount}
      RETURNING *
    `, values);
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    res.json({ 
      message: 'Participant status updated',
      participant: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Update participant status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

const jwt = require('jsonwebtoken');
const { pool } = require('../utils/database');

module.exports = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user details from database
      const userResult = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [decoded.userId]);
      
      if (userResult.rows.length === 0) {
        return next(new Error('User not found'));
      }

      socket.user = userResult.rows[0];
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected via WebSocket`);

    // Handle joining a room
    socket.on('join-room', async (roomId) => {
      try {
        // Verify user has access to this room
        const roomResult = await pool.query(`
          SELECT r.*, rp.user_id as is_participant, r.host_id = $2 as is_host
          FROM rooms r
          LEFT JOIN room_participants rp ON r.id = rp.room_id AND rp.user_id = $2
          WHERE r.id = $1 AND (r.is_public = true OR rp.user_id IS NOT NULL OR r.host_id = $2)
        `, [roomId, socket.user.id]);

        if (roomResult.rows.length === 0) {
          socket.emit('error', { message: 'Room not found or access denied' });
          return;
        }

        const room = roomResult.rows[0];
        socket.join(`room-${roomId}`);
        socket.currentRoom = roomId;

        // Update participant last active time
        await pool.query(`
          UPDATE room_participants 
          SET last_active = CURRENT_TIMESTAMP 
          WHERE room_id = $1 AND user_id = $2
        `, [roomId, socket.user.id]);

        // Notify other participants
        socket.to(`room-${roomId}`).emit('user-joined', {
          user: socket.user,
          timestamp: new Date().toISOString()
        });

        // Send current room state to the joining user
        const playbackState = await getCurrentPlaybackState(roomId);
        const participants = await getRoomParticipants(roomId);
        
        socket.emit('room-state', {
          room,
          playbackState,
          participants,
          userRole: room.is_host ? 'host' : 'participant'
        });

        console.log(`User ${socket.user.username} joined room ${roomId}`);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle leaving a room
    socket.on('leave-room', async () => {
      if (socket.currentRoom) {
        socket.leave(`room-${socket.currentRoom}`);
        
        // Notify other participants
        socket.to(`room-${socket.currentRoom}`).emit('user-left', {
          user: socket.user,
          timestamp: new Date().toISOString()
        });

        console.log(`User ${socket.user.username} left room ${socket.currentRoom}`);
        socket.currentRoom = null;
      }
    });

    // Handle music playback synchronization
    socket.on('playback-update', async (data) => {
      if (!socket.currentRoom) return;

      try {
        // Verify user is host or has permission to control playback
        const roomResult = await pool.query('SELECT host_id FROM rooms WHERE id = $1', [socket.currentRoom]);
        
        if (roomResult.rows.length === 0 || roomResult.rows[0].host_id !== socket.user.id) {
          socket.emit('error', { message: 'Only the host can control playback' });
          return;
        }

        // Update playback state in database
        await pool.query(`
          INSERT INTO room_playback_state (room_id, current_track_id, position_seconds, is_playing, volume, last_updated)
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
          ON CONFLICT (room_id) 
          DO UPDATE SET 
            current_track_id = $2,
            position_seconds = $3,
            is_playing = $4,
            volume = $5,
            last_updated = CURRENT_TIMESTAMP
        `, [socket.currentRoom, data.trackId, data.position, data.isPlaying, data.volume]);

        // Broadcast to all participants in the room
        io.to(`room-${socket.currentRoom}`).emit('playback-sync', {
          trackId: data.trackId,
          position: data.position,
          isPlaying: data.isPlaying,
          volume: data.volume,
          timestamp: new Date().toISOString(),
          updatedBy: socket.user.username
        });

        console.log(`Playback updated in room ${socket.currentRoom} by ${socket.user.username}`);
      } catch (error) {
        console.error('Error updating playback:', error);
        socket.emit('error', { message: 'Failed to update playback' });
      }
    });

    // Handle track queue updates
    socket.on('track-added', async (data) => {
      if (!socket.currentRoom) return;

      try {
        // Broadcast track addition to all participants
        socket.to(`room-${socket.currentRoom}`).emit('track-added', {
          track: data.track,
          addedBy: socket.user,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error broadcasting track addition:', error);
      }
    });

    // Handle chat messages
    socket.on('send-message', async (data) => {
      if (!socket.currentRoom) return;

      try {
        // Save message to database
        const messageResult = await pool.query(`
          INSERT INTO room_messages (room_id, user_id, message, message_type)
          VALUES ($1, $2, $3, $4)
          RETURNING id, created_at
        `, [socket.currentRoom, socket.user.id, data.message, data.type || 'text']);

        const message = {
          id: messageResult.rows[0].id,
          user: socket.user,
          message: data.message,
          type: data.type || 'text',
          timestamp: messageResult.rows[0].created_at
        };

        // Broadcast message to all participants in the room
        io.to(`room-${socket.currentRoom}`).emit('new-message', message);

        console.log(`Message sent in room ${socket.currentRoom} by ${socket.user.username}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle participant status updates (mute, hand raise, etc.)
    socket.on('status-update', async (data) => {
      if (!socket.currentRoom) return;

      try {
        // Update participant status in database
        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        if (data.isMuted !== undefined) {
          updateFields.push(`is_muted = $${paramCount++}`);
          updateValues.push(data.isMuted);
        }

        if (data.handRaised !== undefined) {
          updateFields.push(`hand_raised = $${paramCount++}`);
          updateValues.push(data.handRaised);
        }

        if (updateFields.length > 0) {
          updateValues.push(socket.currentRoom, socket.user.id);
          
          await pool.query(`
            UPDATE room_participants 
            SET ${updateFields.join(', ')}, last_active = CURRENT_TIMESTAMP
            WHERE room_id = $${paramCount++} AND user_id = $${paramCount++}
          `, updateValues);

          // Broadcast status update to all participants
          socket.to(`room-${socket.currentRoom}`).emit('participant-status-update', {
            user: socket.user,
            status: data,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error updating participant status:', error);
        socket.emit('error', { message: 'Failed to update status' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      if (socket.currentRoom) {
        // Notify other participants
        socket.to(`room-${socket.currentRoom}`).emit('user-left', {
          user: socket.user,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`User ${socket.user.username} disconnected`);
    });
  });

  // Helper functions
  async function getCurrentPlaybackState(roomId) {
    try {
      const result = await pool.query(`
        SELECT rps.*, t.title, t.artist, t.album, t.url
        FROM room_playback_state rps
        LEFT JOIN tracks t ON rps.current_track_id = t.id
        WHERE rps.room_id = $1
      `, [roomId]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting playback state:', error);
      return null;
    }
  }

  async function getRoomParticipants(roomId) {
    try {
      const result = await pool.query(`
        SELECT u.id, u.username, rp.is_muted, rp.hand_raised, rp.last_active, rp.joined_at
        FROM room_participants rp
        JOIN users u ON rp.user_id = u.id
        WHERE rp.room_id = $1
        ORDER BY rp.joined_at ASC
      `, [roomId]);

      return result.rows;
    } catch (error) {
      console.error('Error getting room participants:', error);
      return [];
    }
  }
};

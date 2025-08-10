/**
 * Enhanced Socket Service with Synchronized Audio Playback
 * 
 * Features:
 * - Real-time audio synchronization across all room participants
 * - Host-controlled playback (play/pause/seek affects everyone)
 * - Automatic sync for new joiners
 * - Playback state persistence
 */

const jwt = require('jsonwebtoken');
const { pool } = require('../utils/database');

module.exports = (io) => {
  // Store room playback states in memory (in production, use Redis)
  const roomPlaybackStates = new Map();

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
        socket.isHost = room.is_host;

        // Initialize room playback state if it doesn't exist
        if (!roomPlaybackStates.has(roomId)) {
          roomPlaybackStates.set(roomId, {
            isPlaying: false,
            currentTrackId: null,
            currentTime: 0,
            lastUpdateTime: Date.now(),
            volume: 0.7
          });
        }

        // Send current playback state to the new participant
        const playbackState = roomPlaybackStates.get(roomId);
        socket.emit('playback-state-sync', playbackState);

        // Notify other participants
        socket.to(`room-${roomId}`).emit('user-joined', {
          user: socket.user,
          isHost: room.is_host,
          timestamp: new Date().toISOString()
        });

        console.log(`User ${socket.user.username} joined room ${roomId}`);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // HOST ONLY: Control playback for the entire room
    socket.on('host-play', (data) => {
      if (!socket.isHost || !socket.currentRoom) return;

      const roomId = socket.currentRoom;
      const playbackState = roomPlaybackStates.get(roomId);
      
      if (playbackState) {
        playbackState.isPlaying = true;
        playbackState.currentTrackId = data.trackId || playbackState.currentTrackId;
        playbackState.currentTime = data.currentTime || playbackState.currentTime;
        playbackState.lastUpdateTime = Date.now();
        
        // Broadcast to all participants in the room
        io.to(`room-${roomId}`).emit('sync-play', {
          trackId: playbackState.currentTrackId,
          currentTime: playbackState.currentTime,
          timestamp: playbackState.lastUpdateTime
        });
        
        console.log(`Host triggered play in room ${roomId}`);
      }
    });

    // HOST ONLY: Pause for the entire room
    socket.on('host-pause', (data) => {
      if (!socket.isHost || !socket.currentRoom) return;

      const roomId = socket.currentRoom;
      const playbackState = roomPlaybackStates.get(roomId);
      
      if (playbackState) {
        playbackState.isPlaying = false;
        playbackState.currentTime = data.currentTime || playbackState.currentTime;
        playbackState.lastUpdateTime = Date.now();
        
        // Broadcast to all participants in the room
        io.to(`room-${roomId}`).emit('sync-pause', {
          currentTime: playbackState.currentTime,
          timestamp: playbackState.lastUpdateTime
        });
        
        console.log(`Host triggered pause in room ${roomId}`);
      }
    });

    // HOST ONLY: Seek to specific time
    socket.on('host-seek', (data) => {
      if (!socket.isHost || !socket.currentRoom) return;

      const roomId = socket.currentRoom;
      const playbackState = roomPlaybackStates.get(roomId);
      
      if (playbackState) {
        playbackState.currentTime = data.currentTime;
        playbackState.lastUpdateTime = Date.now();
        
        // Broadcast to all participants in the room
        io.to(`room-${roomId}`).emit('sync-seek', {
          currentTime: playbackState.currentTime,
          timestamp: playbackState.lastUpdateTime
        });
        
        console.log(`Host seeked to ${data.currentTime}s in room ${roomId}`);
      }
    });

    // HOST ONLY: Change track
    socket.on('host-change-track', (data) => {
      if (!socket.isHost || !socket.currentRoom) return;

      const roomId = socket.currentRoom;
      const playbackState = roomPlaybackStates.get(roomId);
      
      if (playbackState) {
        playbackState.currentTrackId = data.trackId;
        playbackState.currentTime = 0;
        playbackState.isPlaying = data.autoPlay || false;
        playbackState.lastUpdateTime = Date.now();
        
        // Broadcast to all participants in the room
        io.to(`room-${roomId}`).emit('sync-track-change', {
          trackId: playbackState.currentTrackId,
          autoPlay: playbackState.isPlaying,
          timestamp: playbackState.lastUpdateTime
        });
        
        console.log(`Host changed track to ${data.trackId} in room ${roomId}`);
      }
    });

    // HOST ONLY: Volume control for room
    socket.on('host-volume-change', (data) => {
      if (!socket.isHost || !socket.currentRoom) return;

      const roomId = socket.currentRoom;
      const playbackState = roomPlaybackStates.get(roomId);
      
      if (playbackState) {
        playbackState.volume = data.volume;
        
        // Broadcast to all participants in the room
        io.to(`room-${roomId}`).emit('sync-volume-change', {
          volume: playbackState.volume
        });
        
        console.log(`Host changed volume to ${data.volume} in room ${roomId}`);
      }
    });

    // Request current playback state (for sync recovery)
    socket.on('request-playback-sync', () => {
      if (!socket.currentRoom) return;

      const playbackState = roomPlaybackStates.get(socket.currentRoom);
      if (playbackState) {
        // Calculate current time based on elapsed time if playing
        let currentTime = playbackState.currentTime;
        if (playbackState.isPlaying) {
          const elapsed = (Date.now() - playbackState.lastUpdateTime) / 1000;
          currentTime += elapsed;
        }

        socket.emit('playback-state-sync', {
          ...playbackState,
          currentTime
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.username} disconnected`);
      
      if (socket.currentRoom) {
        socket.to(`room-${socket.currentRoom}`).emit('user-left', {
          user: socket.user,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle leaving a room
    socket.on('leave-room', () => {
      if (socket.currentRoom) {
        socket.to(`room-${socket.currentRoom}`).emit('user-left', {
          user: socket.user,
          timestamp: new Date().toISOString()
        });
        
        socket.leave(`room-${socket.currentRoom}`);
        socket.currentRoom = null;
        socket.isHost = false;
      }
    });
  });
};

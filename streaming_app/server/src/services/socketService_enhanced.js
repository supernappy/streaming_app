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
const RoomSyncService = require('./roomSyncService');

module.exports = (io) => {
  // Initialize room sync service
  const roomSync = new RoomSyncService(io);

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      console.log('🔐 Socket authentication attempt:', {
        auth: socket.handshake.auth,
        headers: socket.handshake.headers.authorization
      });
      
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        console.log('❌ No token provided for socket connection');
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user details from database
      const userResult = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [decoded.userId]);
      
      if (userResult.rows.length === 0) {
        console.log('❌ User not found for socket connection:', decoded.userId);
        return next(new Error('User not found'));
      }

      socket.user = userResult.rows[0];
      console.log('✅ Socket authentication successful for:', socket.user.username);
      next();
    } catch (error) {
      console.log('❌ Socket authentication error:', error.message);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User ${socket.user.username} connected via WebSocket`);

    // Handle joining a room
    socket.on('room:join', async (roomId) => {
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
        socket.join(`room_${roomId}`);
        socket.currentRoom = roomId;
        socket.isHost = room.is_host;

        // Initialize room sync state if needed
        await roomSync.initializeRoomState(roomId);

        // Sync new participant to current playback state
        roomSync.syncParticipant(socket.id, roomId);

        // Load recent chat history (last 50 messages)
        try {
          const chatHistory = await pool.query(`
            SELECT rm.*, u.username 
            FROM room_messages rm
            JOIN users u ON rm.user_id = u.id
            WHERE rm.room_id = $1
            ORDER BY rm.created_at DESC
            LIMIT 50
          `, [roomId]);

          // Send chat history to the user (reverse to show oldest first)
          const formattedHistory = chatHistory.rows.reverse().map(msg => ({
            id: msg.id,
            userId: msg.user_id,
            username: msg.username,
            message: msg.message,
            timestamp: msg.created_at,
            type: msg.message_type
          }));

          if (formattedHistory.length > 0) {
            socket.emit('room:chat-history', formattedHistory);
            console.log(`📜 Sent ${formattedHistory.length} chat history messages to ${socket.user.username}`);
          }
        } catch (chatError) {
          console.warn('Could not load chat history:', chatError.message);
        }

        // Get current participants in the room
        const roomSockets = await io.in(`room_${roomId}`).fetchSockets();
        const currentParticipants = roomSockets.map(s => ({
          id: s.user.id,
          username: s.user.username,
          email: s.user.email,
          isHost: s.isHost,
          joinedAt: new Date().toISOString()
        }));

        // Send current participants list to the new joiner
        socket.emit('room:participants-list', currentParticipants);
        console.log(`📋 Sent ${currentParticipants.length} participants to ${socket.user.username}`);

        // Notify other participants
        socket.to(`room_${roomId}`).emit('room:user-joined', {
          user: socket.user,
          isHost: room.is_host,
          timestamp: new Date().toISOString()
        });

        // Send system message to all participants about the new user
        const joinMessage = {
          id: Date.now(),
          userId: null,
          username: 'System',
          message: `${socket.user.username} joined the room`,
          timestamp: new Date().toISOString(),
          type: 'system'
        };
        io.to(`room_${roomId}`).emit('room:chat-message', joinMessage);

        console.log(`🎵 User ${socket.user.username} joined room ${roomId}`);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle leaving a room
    socket.on('room:leave', (roomId) => {
      socket.leave(`room_${roomId}`);
      socket.to(`room_${roomId}`).emit('room:user-left', {
        user: socket.user,
        timestamp: new Date().toISOString()
      });

      // Send system message about user leaving
      const leaveMessage = {
        id: Date.now(),
        userId: null,
        username: 'System',
        message: `${socket.user.username} left the room`,
        timestamp: new Date().toISOString(),
        type: 'system'
      };
      socket.to(`room_${roomId}`).emit('room:chat-message', leaveMessage);

      socket.currentRoom = null;
      socket.isHost = false;
      console.log(`👋 User ${socket.user.username} left room ${roomId}`);
    });

    // Handle request for participants list
    socket.on('room:get-participants', async (roomId) => {
      try {
        const roomSockets = await io.in(`room_${roomId}`).fetchSockets();
        const currentParticipants = roomSockets.map(s => ({
          id: s.user.id,
          username: s.user.username,
          email: s.user.email,
          isHost: s.isHost,
          joinedAt: new Date().toISOString()
        }));

        socket.emit('room:participants-list', currentParticipants);
        console.log(`📋 Sent ${currentParticipants.length} participants to ${socket.user.username} on request`);
      } catch (error) {
        console.error('Error getting participants:', error);
        socket.emit('error', { message: 'Failed to get participants' });
      }
    });

    // SYNCHRONIZED AUDIO CONTROLS
    
    // Play track (host only)
    socket.on('room:play', async (data) => {
      const { roomId, trackId, currentTime = 0 } = data;
      
      if (!socket.isHost) {
        socket.emit('error', { message: 'Only the host can control playback' });
        return;
      }

      try {
        await roomSync.playTrack(roomId, trackId, currentTime, socket.user.id);
        console.log(`▶️ Host ${socket.user.username} started playing track ${trackId} in room ${roomId}`);
      } catch (error) {
        console.error('Error playing track:', error);
        socket.emit('error', { message: 'Failed to play track' });
      }
    });

    // Pause track (host only)
    socket.on('room:pause', async (data) => {
      const { roomId, currentTime = 0 } = data;
      
      if (!socket.isHost) {
        socket.emit('error', { message: 'Only the host can control playback' });
        return;
      }

      try {
        await roomSync.pauseTrack(roomId, currentTime, socket.user.id);
        console.log(`⏸️ Host ${socket.user.username} paused playback in room ${roomId}`);
      } catch (error) {
        console.error('Error pausing track:', error);
        socket.emit('error', { message: 'Failed to pause track' });
      }
    });

    // Resume track (host only)
    socket.on('room:resume', async (data) => {
      const { roomId, position = 0 } = data;
      
      if (!socket.isHost) {
        socket.emit('error', { message: 'Only the host can control playback' });
        return;
      }

      try {
        await roomSync.resumeTrack(roomId, position, socket.user.id);
        console.log(`▶️ Host ${socket.user.username} resumed playback in room ${roomId} at position ${position}`);
      } catch (error) {
        console.error('Error resuming track:', error);
        socket.emit('error', { message: 'Failed to resume track' });
      }
    });

    // Seek to position (host only)
    socket.on('room:seek', async (data) => {
      const { roomId, currentTime, position } = data;
      const seekTime = typeof currentTime === 'number' ? currentTime : (typeof position === 'number' ? position : 0);
      
      if (!socket.isHost) {
        socket.emit('error', { message: 'Only the host can control playback' });
        return;
      }

      try {
        await roomSync.seekTrack(roomId, seekTime, socket.user.id);
        console.log(`⏭️ Host ${socket.user.username} seeked to ${seekTime}s in room ${roomId}`);
      } catch (error) {
        console.error('Error seeking track:', error);
        socket.emit('error', { message: 'Failed to seek track' });
      }
    });

    // Change track (host only)
    socket.on('room:change-track', async (data) => {
      const { roomId, trackId } = data;
      
      if (!socket.isHost) {
        socket.emit('error', { message: 'Only the host can control playback' });
        return;
      }

      try {
        await roomSync.changeTrack(roomId, trackId, socket.user.id);
        console.log(`🎵 Host ${socket.user.username} changed to track ${trackId} in room ${roomId}`);
      } catch (error) {
        console.error('Error changing track:', error);
        socket.emit('error', { message: 'Failed to change track' });
      }
    });

    // Change volume (host only)
    socket.on('room:volume-change', async (data) => {
      const { roomId, volume } = data;
      
      if (!socket.isHost) {
        socket.emit('error', { message: 'Only the host can control volume' });
        return;
      }

      try {
        await roomSync.changeVolume(roomId, volume, socket.user.id);
        console.log(`🔊 Host ${socket.user.username} changed volume to ${volume} in room ${roomId}`);
      } catch (error) {
        console.error('Error changing volume:', error);
        socket.emit('error', { message: 'Failed to change volume' });
      }
    });

    // Request sync (any participant)
    socket.on('room:request-sync', async (data) => {
      const { roomId } = data;
      
      if (!socket.currentRoom || socket.currentRoom !== roomId) {
        socket.emit('error', { message: 'You are not in this room' });
        return;
      }

      try {
        const roomState = await roomSync.getRoomState(roomId);
        if (roomState) {
          socket.emit('room:playback-sync', roomState);
          console.log(`🔄 Sent sync state to ${socket.user.username} in room ${roomId}`);
        }
      } catch (error) {
        console.error('Error sending sync state:', error);
        socket.emit('error', { message: 'Failed to get sync state' });
      }
    });

    // CHAT FUNCTIONALITY

    // Handle chat messages
    socket.on('room:chat-message', async (data) => {
      console.log('💬 Received chat message:', data);
      const { roomId, message } = data;
      
      if (!socket.currentRoom || socket.currentRoom !== roomId) {
        console.log('❌ User not in room:', { currentRoom: socket.currentRoom, requestedRoom: roomId });
        socket.emit('error', { message: 'You are not in this room' });
        return;
      }

      try {
        // Save message to database
        const messageResult = await pool.query(`
          INSERT INTO room_messages (room_id, user_id, message, message_type)
          VALUES ($1, $2, $3, $4)
          RETURNING id, created_at
        `, [roomId, socket.user.id, message.trim(), 'text']);

        const chatMessage = {
          id: messageResult.rows[0].id,
          userId: socket.user.id,
          username: socket.user.username,
          message: message.trim(),
          timestamp: messageResult.rows[0].created_at,
          isHost: socket.isHost,
          type: 'text'
        };

        console.log('💬 Broadcasting message to room:', roomId, chatMessage);
        // Broadcast to all room participants
        io.to(`room_${roomId}`).emit('room:chat-message', chatMessage);
        
        console.log(`💬 ${socket.user.username} in room ${roomId}: ${message}`);
      } catch (error) {
        console.error('Error saving chat message:', error);
        
        // Fallback to memory-only message if database fails
        const chatMessage = {
          id: Date.now(),
          userId: socket.user.id,
          username: socket.user.username,
          message: message.trim(),
          timestamp: new Date().toISOString(),
          isHost: socket.isHost,
          type: 'text'
        };
        
        io.to(`room_${roomId}`).emit('room:chat-message', chatMessage);
        console.log(`💬 ${socket.user.username} in room ${roomId}: ${message} (memory only)`);
      }
    });

    // TRACK QUEUE MANAGEMENT

    // Add track to room queue
    socket.on('room:add-track', async (data) => {
      const { roomId, trackId } = data;
      
      try {
        // Add track to room queue
        const result = await pool.query(`
          INSERT INTO room_tracks (room_id, track_id, added_by, position)
          SELECT $1, $2, $3, COALESCE(MAX(position), 0) + 1
          FROM room_tracks
          WHERE room_id = $1
          RETURNING *
        `, [roomId, trackId, socket.user.id]);

        // Get track details
        const trackResult = await pool.query(`
          SELECT t.*, u.username as added_by_name
          FROM tracks t
          JOIN users u ON u.id = $3
          WHERE t.id = $1
        `, [trackId, roomId, socket.user.id]);

        const trackData = {
          ...trackResult.rows[0],
          position: result.rows[0].position,
          addedBy: socket.user.id,
          addedByName: socket.user.username
        };

        // Broadcast to all room participants
        io.to(`room_${roomId}`).emit('room:track-added', trackData);
        
        console.log(`🎵 ${socket.user.username} added track ${trackId} to room ${roomId}`);
      } catch (error) {
        console.error('Error adding track to room:', error);
        socket.emit('error', { message: 'Failed to add track to room' });
      }
    });

    // Remove track from room queue
    socket.on('room:remove-track', async (data) => {
      const { roomId, trackId } = data;
      
      try {
        // Only host or track adder can remove
        const trackResult = await pool.query(`
          SELECT added_by FROM room_tracks 
          WHERE room_id = $1 AND track_id = $2
        `, [roomId, trackId]);

        if (trackResult.rows.length === 0) {
          socket.emit('error', { message: 'Track not found in room' });
          return;
        }

        const canRemove = socket.isHost || trackResult.rows[0].added_by === socket.user.id;
        
        if (!canRemove) {
          socket.emit('error', { message: 'You can only remove tracks you added' });
          return;
        }

        // Remove track
        await pool.query(`
          DELETE FROM room_tracks 
          WHERE room_id = $1 AND track_id = $2
        `, [roomId, trackId]);

        // Broadcast to all room participants
        io.to(`room_${roomId}`).emit('room:track-removed', { trackId });
        
        console.log(`🗑️ ${socket.user.username} removed track ${trackId} from room ${roomId}`);
      } catch (error) {
        console.error('Error removing track from room:', error);
        socket.emit('error', { message: 'Failed to remove track from room' });
      }
    });

    // Handle next track
    socket.on('room:next-track', async (data) => {
      const { roomId } = data;
      
      try {
        if (!socket.isHost) {
          socket.emit('error', { message: 'Only host can control track navigation' });
          return;
        }

        // Get current room state
        const roomResult = await pool.query(`
          SELECT current_track_id, current_position FROM rooms WHERE id = $1
        `, [roomId]);

        if (roomResult.rows.length === 0) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Get room tracks in order
        const tracksResult = await pool.query(`
          SELECT rt.track_id, t.title, t.artist, t.file_url, t.duration
          FROM room_tracks rt
          JOIN tracks t ON rt.track_id = t.id
          WHERE rt.room_id = $1
          ORDER BY rt.added_at ASC
        `, [roomId]);

        const tracks = tracksResult.rows;
        if (tracks.length === 0) {
          socket.emit('error', { message: 'No tracks in queue' });
          return;
        }

        // Find current track index
        const currentTrackId = roomResult.rows[0].current_track_id;
        const currentIndex = tracks.findIndex(track => track.track_id === currentTrackId);
        
        // Get next track (loop to beginning if at end)
        const nextIndex = (currentIndex + 1) % tracks.length;
        const nextTrack = tracks[nextIndex];

        // Update room state
        await pool.query(`
          UPDATE rooms 
          SET current_track_id = $1, current_position = 0, is_playing = true, updated_at = NOW()
          WHERE id = $2
        `, [nextTrack.track_id, roomId]);

        // Broadcast to all room participants
        const newState = {
          currentTrackId: nextTrack.track_id,
          currentPosition: 0,
          isPlaying: true,
          masterVolume: 70
        };

        io.to(`room_${roomId}`).emit('room:state-update', newState);
        
        console.log(`⏭️ ${socket.user.username} skipped to next track in room ${roomId}: ${nextTrack.title}`);
      } catch (error) {
        console.error('Error handling next track:', error);
        socket.emit('error', { message: 'Failed to skip to next track' });
      }
    });

    // Handle previous track
    socket.on('room:previous-track', async (data) => {
      const { roomId } = data;
      
      try {
        if (!socket.isHost) {
          socket.emit('error', { message: 'Only host can control track navigation' });
          return;
        }

        // Get current room state
        const roomResult = await pool.query(`
          SELECT current_track_id, current_position FROM rooms WHERE id = $1
        `, [roomId]);

        if (roomResult.rows.length === 0) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Get room tracks in order
        const tracksResult = await pool.query(`
          SELECT rt.track_id, t.title, t.artist, t.file_url, t.duration
          FROM room_tracks rt
          JOIN tracks t ON rt.track_id = t.id
          WHERE rt.room_id = $1
          ORDER BY rt.added_at ASC
        `, [roomId]);

        const tracks = tracksResult.rows;
        if (tracks.length === 0) {
          socket.emit('error', { message: 'No tracks in queue' });
          return;
        }

        // Find current track index
        const currentTrackId = roomResult.rows[0].current_track_id;
        const currentIndex = tracks.findIndex(track => track.track_id === currentTrackId);
        
        // Get previous track (loop to end if at beginning)
        const previousIndex = currentIndex <= 0 ? tracks.length - 1 : currentIndex - 1;
        const previousTrack = tracks[previousIndex];

        // Update room state
        await pool.query(`
          UPDATE rooms 
          SET current_track_id = $1, current_position = 0, is_playing = true, updated_at = NOW()
          WHERE id = $2
        `, [previousTrack.track_id, roomId]);

        // Broadcast to all room participants
        const newState = {
          currentTrackId: previousTrack.track_id,
          currentPosition: 0,
          isPlaying: true,
          masterVolume: 70
        };

        io.to(`room_${roomId}`).emit('room:state-update', newState);
        
        console.log(`⏮️ ${socket.user.username} skipped to previous track in room ${roomId}: ${previousTrack.title}`);
      } catch (error) {
        console.error('Error handling previous track:', error);
        socket.emit('error', { message: 'Failed to skip to previous track' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`👋 User ${socket.user.username} disconnected`);
      
      if (socket.currentRoom) {
        socket.to(`room_${socket.currentRoom}`).emit('room:user-left', {
          user: socket.user,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.username}:`, error);
    });
  });

  console.log('🚀 Enhanced Socket Service with Room Sync initialized');
};

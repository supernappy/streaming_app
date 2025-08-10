const { pool } = require('../utils/database');

class RoomSyncService {
  constructor(io) {
    this.io = io;
    this.roomStates = new Map(); // In-memory room states for quick access
  }

  // Initialize room state
  async initializeRoomState(roomId) {
    try {
      const result = await pool.query(`
        SELECT 
          current_track_id,
          current_position,
          is_playing,
          master_volume
        FROM rooms 
        WHERE id = $1
      `, [roomId]);

      if (result.rows.length > 0) {
        const room = result.rows[0];
        const roomState = {
          roomId,
          currentTrackId: room.current_track_id,
          currentPosition: parseFloat(room.current_position) || 0,
          isPlaying: room.is_playing || false,
          masterVolume: room.master_volume || 70,
          lastUpdate: Date.now()
        };

        this.roomStates.set(roomId, roomState);
        return roomState;
      }
    } catch (error) {
      console.error('Failed to initialize room state:', error);
    }
    return null;
  }

  // Get current room state
  getRoomState(roomId) {
    return this.roomStates.get(roomId);
  }

  // Update room state and broadcast to all participants
  async updateRoomState(roomId, updates, hostUserId) {
    try {
      const currentState = this.roomStates.get(roomId) || {};
      const newState = {
        ...currentState,
        ...updates,
        lastUpdate: Date.now()
      };

      // Update in-memory state
      this.roomStates.set(roomId, newState);

      // Update database
      await this.persistRoomState(roomId, newState);

      // Broadcast to all room participants
      this.io.to(`room_${roomId}`).emit('room:state-update', {
        ...newState,
        updatedBy: hostUserId
      });

      console.log(`🎵 Room ${roomId} state updated:`, newState);
      return newState;
    } catch (error) {
      console.error('Failed to update room state:', error);
      throw error;
    }
  }

  // Persist state to database
  async persistRoomState(roomId, state) {
    await pool.query(`
      UPDATE rooms 
      SET 
        current_track_id = $1,
        current_position = $2,
        is_playing = $3,
        master_volume = $4,
        updated_at = NOW()
      WHERE id = $5
    `, [
      state.currentTrackId,
      state.currentPosition,
      state.isPlaying,
      state.masterVolume,
      roomId
    ]);
  }

  // Handle play action
  async playTrack(roomId, trackId, currentTime = 0, hostUserId) {
    const updates = {
      currentTrackId: trackId,
      currentPosition: currentTime,
      isPlaying: true
    };
    return this.updateRoomState(roomId, updates, hostUserId);
  }

  // Handle pause action
  async pauseTrack(roomId, position, hostUserId) {
    const updates = {
      currentPosition: position,
      isPlaying: false
    };
    return this.updateRoomState(roomId, updates, hostUserId);
  }

  // Handle resume action
  async resumeTrack(roomId, position = 0, hostUserId) {
    const updates = {
      isPlaying: true,
      currentPosition: position
    };
    return this.updateRoomState(roomId, updates, hostUserId);
  }

  // Handle seek action
  async seekTrack(roomId, position, hostUserId) {
    const updates = {
      currentPosition: position,
      lastUpdate: Date.now()
    };
    return this.updateRoomState(roomId, updates, hostUserId);
  }

  // Handle next track
  async nextTrack(roomId, hostUserId) {
    try {
      // Get next track from room queue
      const result = await pool.query(`
        SELECT id, title, artist, file_url, duration
        FROM room_tracks rt
        JOIN tracks t ON rt.track_id = t.id
        WHERE rt.room_id = $1
        ORDER BY rt.position ASC
        LIMIT 1 OFFSET 1
      `, [roomId]);

      if (result.rows.length > 0) {
        const nextTrack = result.rows[0];
        return this.playTrack(roomId, nextTrack.id, hostUserId);
      } else {
        // No more tracks, stop playback
        const updates = {
          currentTrackId: null,
          currentPosition: 0,
          isPlaying: false
        };
        return this.updateRoomState(roomId, updates, hostUserId);
      }
    } catch (error) {
      console.error('Failed to skip to next track:', error);
      throw error;
    }
  }

  // Handle volume change
  async changeVolume(roomId, volume, hostUserId) {
    const updates = {
      masterVolume: Math.max(0, Math.min(100, volume))
    };
    return this.updateRoomState(roomId, updates, hostUserId);
  }

  // Handle track change
  async changeTrack(roomId, trackId, hostUserId) {
    const updates = {
      currentTrackId: trackId,
      currentPosition: 0,
      isPlaying: true
    };
    return this.updateRoomState(roomId, updates, hostUserId);
  }

  // Sync new participant to current state
  syncParticipant(socketId, roomId) {
    const roomState = this.roomStates.get(roomId);
    if (roomState) {
      this.io.to(socketId).emit('room:sync-state', roomState);
      console.log(`🔄 Synced participant ${socketId} to room ${roomId} state`);
    }
  }

  // Clean up room state when empty
  cleanupRoomState(roomId) {
    this.roomStates.delete(roomId);
    console.log(`🧹 Cleaned up room ${roomId} state`);
  }

  // Get current playing track info
  async getCurrentTrackInfo(roomId) {
    const state = this.roomStates.get(roomId);
    if (!state || !state.currentTrackId) {
      return null;
    }

    try {
      const result = await pool.query(`
        SELECT id, title, artist, file_url, duration
        FROM tracks
        WHERE id = $1
      `, [state.currentTrackId]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Failed to get current track info:', error);
      return null;
    }
  }
}

module.exports = RoomSyncService;

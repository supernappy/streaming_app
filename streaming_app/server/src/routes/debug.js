const express = require('express');
const router = express.Router();

module.exports = (io) => {
  // Debug endpoint to see connected sockets
  router.get('/debug/sockets', async (req, res) => {
    try {
      const sockets = await io.fetchSockets();
      const socketInfo = sockets.map(socket => ({
        id: socket.id,
        userId: socket.user?.id,
        username: socket.user?.username,
        currentRoom: socket.currentRoom,
        isHost: socket.isHost,
        connected: socket.connected
      }));

      res.json({
        totalSockets: sockets.length,
        sockets: socketInfo
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Debug endpoint to see room participants
  router.get('/debug/room/:roomId/participants', async (req, res) => {
    try {
      const { roomId } = req.params;
      const roomSockets = await io.in(`room_${roomId}`).fetchSockets();
      
      const participants = roomSockets.map(socket => ({
        id: socket.user?.id,
        username: socket.user?.username,
        isHost: socket.isHost,
        socketId: socket.id,
        connected: socket.connected
      }));

      res.json({
        roomId,
        participantCount: participants.length,
        participants
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

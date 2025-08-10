import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [playbackState, setPlaybackState] = useState({
    isPlaying: false,
    currentTrackId: null,
    currentTime: 0,
    volume: 0.7,
    isSynced: true
  });
  const { user, token } = useAuth();

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection with API URL from environment or default
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002';
    const newSocket = io(apiUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
      setIsConnected(false);
      setCurrentRoom(null);
      setParticipants([]);
      setMessages([]);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Room event handlers
    newSocket.on('user-joined', (data) => {
      console.log('👤 User joined room:', data.user.username);
      setParticipants(prev => {
        if (prev.find(p => p.id === data.user.id)) {
          return prev; // User already in list
        }
        return [...prev, { ...data.user, isHost: data.isHost, joinedAt: data.timestamp }];
      });
    });

    newSocket.on('user-left', (data) => {
      console.log('👤 User left room:', data.user.username);
      setParticipants(prev => prev.filter(p => p.id !== data.user.id));
    });

    // Synchronized playback event handlers
    newSocket.on('playback-state-sync', (state) => {
      console.log('🔄 Playback state sync received:', state);
      setPlaybackState({
        isPlaying: state.isPlaying,
        currentTrackId: state.currentTrackId,
        currentTime: state.currentTime,
        volume: state.volume,
        isSynced: true
      });
    });

    newSocket.on('sync-play', (data) => {
      console.log('▶️ Sync play received:', data);
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: true,
        currentTrackId: data.trackId || prev.currentTrackId,
        currentTime: data.currentTime,
        isSynced: true
      }));
    });

    newSocket.on('sync-pause', (data) => {
      console.log('⏸️ Sync pause received:', data);
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: false,
        currentTime: data.currentTime,
        isSynced: true
      }));
    });

    newSocket.on('sync-seek', (data) => {
      console.log('⏭️ Sync seek received:', data);
      setPlaybackState(prev => ({
        ...prev,
        currentTime: data.currentTime,
        isSynced: true
      }));
    });

    newSocket.on('sync-track-change', (data) => {
      console.log('🎵 Sync track change received:', data);
      setPlaybackState(prev => ({
        ...prev,
        currentTrackId: data.trackId,
        currentTime: 0,
        isPlaying: data.autoPlay,
        isSynced: true
      }));
    });

    newSocket.on('sync-volume-change', (data) => {
      console.log('🔊 Sync volume change received:', data);
      setPlaybackState(prev => ({
        ...prev,
        volume: data.volume,
        isSynced: true
      }));
    });

    // Chat event handlers
    newSocket.on('new-message', (message) => {
      console.log('💬 New message received:', message);
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  // Room management functions
  const joinRoom = useCallback((roomId) => {
    if (socket && isConnected) {
      console.log(`🏠 Joining room: ${roomId}`);
      socket.emit('join-room', roomId);
      setCurrentRoom(roomId);
      setMessages([]); // Clear previous messages
    }
  }, [socket, isConnected]);

  const leaveRoom = useCallback(() => {
    if (socket && currentRoom) {
      console.log(`🚪 Leaving room: ${currentRoom}`);
      socket.emit('leave-room');
      setCurrentRoom(null);
      setParticipants([]);
      setMessages([]);
      setPlaybackState({
        isPlaying: false,
        currentTrackId: null,
        currentTime: 0,
        volume: 0.7,
        isSynced: true
      });
    }
  }, [socket, currentRoom]);

  // Host-only playback controls
  const hostPlay = useCallback((trackId, currentTime = 0) => {
    if (socket && currentRoom) {
      console.log('🎵 Host play:', trackId, currentTime);
      socket.emit('host-play', { trackId, currentTime });
    }
  }, [socket, currentRoom]);

  const hostPause = useCallback((currentTime = 0) => {
    if (socket && currentRoom) {
      console.log('⏸️ Host pause:', currentTime);
      socket.emit('host-pause', { currentTime });
    }
  }, [socket, currentRoom]);

  const hostSeek = useCallback((currentTime) => {
    if (socket && currentRoom) {
      console.log('⏭️ Host seek:', currentTime);
      socket.emit('host-seek', { currentTime });
    }
  }, [socket, currentRoom]);

  const hostChangeTrack = useCallback((trackId, autoPlay = false) => {
    if (socket && currentRoom) {
      console.log('🎵 Host change track:', trackId, autoPlay);
      socket.emit('host-change-track', { trackId, autoPlay });
    }
  }, [socket, currentRoom]);

  const hostVolumeChange = useCallback((volume) => {
    if (socket && currentRoom) {
      console.log('🔊 Host volume change:', volume);
      socket.emit('host-volume-change', { volume });
    }
  }, [socket, currentRoom]);

  // Request playback sync (for recovering from desync)
  const requestPlaybackSync = useCallback(() => {
    if (socket && currentRoom) {
      console.log('🔄 Requesting playback sync');
      socket.emit('request-playback-sync');
    }
  }, [socket, currentRoom]);

  // Chat functions
  const sendMessage = useCallback((message) => {
    if (socket && currentRoom) {
      const messageData = {
        roomId: currentRoom,
        message: message.trim(),
        timestamp: new Date().toISOString()
      };
      socket.emit('send-message', messageData);
    }
  }, [socket, currentRoom]);

  // Status update functions
  const updateStatus = useCallback((status) => {
    if (socket && currentRoom) {
      socket.emit('update-status', { roomId: currentRoom, ...status });
    }
  }, [socket, currentRoom]);

  const notifyTrackAdded = useCallback((trackData) => {
    if (socket && currentRoom) {
      socket.emit('track-added', { roomId: currentRoom, track: trackData });
    }
  }, [socket, currentRoom]);

  const value = {
    socket,
    isConnected,
    currentRoom,
    roomState,
    participants,
    messages,
    playbackState,
    // Room management
    joinRoom,
    leaveRoom,
    // Host playback controls
    hostPlay,
    hostPause,
    hostSeek,
    hostChangeTrack,
    hostVolumeChange,
    requestPlaybackSync,
    // Chat
    sendMessage,
    // Other functions
    updateStatus,
    notifyTrackAdded
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

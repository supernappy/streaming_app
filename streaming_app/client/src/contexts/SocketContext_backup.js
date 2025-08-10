import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const [playbackState, setPlaybackState] = useState(null);
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

    // Create socket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5002', {
      auth: {
        token: token
      }
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Room event handlers
    newSocket.on('room-state', (state) => {
      console.log('Received room state:', state);
      setRoomState(state.room);
      setPlaybackState(state.playbackState);
      setParticipants(state.participants);
    });

    newSocket.on('user-joined', (data) => {
      console.log('User joined:', data.user.username);
      setParticipants(prev => [...prev, data.user]);
    });

    newSocket.on('user-left', (data) => {
      console.log('User left:', data.user.username);
      setParticipants(prev => prev.filter(p => p.id !== data.user.id));
    });

    // Playback synchronization
    newSocket.on('playback-sync', (data) => {
      console.log('Playback sync received:', data);
      setPlaybackState(data);
    });

    newSocket.on('track-added', (data) => {
      console.log('Track added to room:', data.track.title);
      // This will be handled by the room component to refresh the track list
    });

    // Chat messages
    newSocket.on('new-message', (message) => {
      console.log('New message:', message);
      setMessages(prev => [...prev, message]);
    });

    // Participant status updates
    newSocket.on('participant-status-update', (data) => {
      console.log('Participant status update:', data);
      setParticipants(prev =>
        prev.map(p =>
          p.id === data.user.id
            ? { ...p, ...data.status }
            : p
        )
      );
    });

    // Error handling
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, user]);

  // Socket methods
  const joinRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit('join-room', roomId);
      setCurrentRoom(roomId);
      setMessages([]); // Clear previous messages
    }
  };

  const leaveRoom = () => {
    if (socket && isConnected && currentRoom) {
      socket.emit('leave-room');
      setCurrentRoom(null);
      setRoomState(null);
      setParticipants([]);
      setMessages([]);
      setPlaybackState(null);
    }
  };

  const updatePlayback = (playbackData) => {
    if (socket && isConnected && currentRoom) {
      socket.emit('playback-update', playbackData);
    }
  };

  const sendMessage = (message, type = 'text') => {
    if (socket && isConnected && currentRoom) {
      socket.emit('send-message', { message, type });
    }
  };

  const updateStatus = (status) => {
    console.log('updateStatus called with:', status);
    console.log('socket:', socket);
    console.log('isConnected:', isConnected);
    console.log('currentRoom:', currentRoom);
    if (socket && isConnected && currentRoom) {
      console.log('Emitting status-update event');
      socket.emit('status-update', status);
    } else {
      console.log('Cannot emit status-update - missing requirements:', {
        hasSocket: !!socket,
        isConnected,
        hasCurrentRoom: !!currentRoom
      });
    }
  };

  const notifyTrackAdded = (track) => {
    if (socket && isConnected && currentRoom) {
      socket.emit('track-added', { track });
    }
  };

  const value = {
    socket,
    isConnected,
    currentRoom,
    roomState,
    participants,
    messages,
    playbackState,
    joinRoom,
    leaveRoom,
    updatePlayback,
    sendMessage,
    updateStatus,
    notifyTrackAdded
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

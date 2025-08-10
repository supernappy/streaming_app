import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  console.log('🚀 TEST SOCKET PROVIDER: Initializing...');
  
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('🔌 TEST SOCKET: Creating connection...');
    
    const newSocket = io('http://localhost:5002', {
      auth: {
        token: 'test-token-from-context'
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ TEST SOCKET: Connected!');
      setIsConnected(true);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ TEST SOCKET: Connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const value = {
    socket,
    isConnected,
    // Dummy functions
    joinRoom: () => {},
    leaveRoom: () => {},
    hostPlay: () => {},
    hostPause: () => {},
    hostSeek: () => {},
    hostChangeTrack: () => {},
    hostVolumeChange: () => {},
    requestPlaybackSync: () => {},
    playbackState: { isPlaying: false, currentTrackId: null, currentTime: 0, volume: 0.7, isSynced: true },
    participants: [],
    messages: [],
    currentRoom: null,
    roomState: null
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

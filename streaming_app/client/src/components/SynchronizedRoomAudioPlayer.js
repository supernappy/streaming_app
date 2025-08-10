import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Slider,
  Avatar,
  Chip,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  VolumeUp,
  MusicNote,
  Sync,
  SyncProblem,
  QueueMusic,
  Delete
} from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext_enhanced';

const SynchronizedRoomAudioPlayer = ({ room, isHost, tracks = [], onRemoveTrack }) => {
  console.log('🎵 RENDER: SynchronizedRoomAudioPlayer', { 
    room: room?.id, 
    isHost, 
    tracksCount: tracks.length,
    tracks: tracks
  });
  
  // ALL STATE HOOKS FIRST
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isSynced, setIsSynced] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // ALL REF HOOKS
  const audioRef = useRef(null);
  const syncTimeoutRef = useRef(null);
  const lastSyncTime = useRef(0);
  
  // ALL CONTEXT HOOKS
  const { 
    socket, 
    playbackState, 
    hostPlay, 
    hostPause, 
    hostSeek, 
    hostChangeTrack, 
    hostVolumeChange,
    requestPlaybackSync,
    isConnected 
  } = useSocket();

  // Debug socket connection status
  console.log('🔌 SOCKET STATUS:', {
    hasSocket: !!socket,
    isConnected,
    socketConnected: socket?.connected,
    hasHostChangeTrack: !!hostChangeTrack,
    roomId: room?.id
  });

  // Get the currentRoom from socket context for debugging
  const { currentRoom } = useSocket();

  // ALL EFFECT HOOKS - NO EARLY RETURNS BEFORE THIS POINT
  
  // Loading timeout effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  // Initialize first track
  useEffect(() => {
    console.log('🎵 TRACK INIT: Effect triggered', { 
      tracksLength: tracks.length, 
      currentTrack: currentTrack?.id,
      tracks: tracks.map(t => ({ id: t.id, title: t.title }))
    });
    
    if (tracks.length > 0 && !currentTrack) {
      console.log('🎵 SYNC AUDIO: Setting first track:', tracks[0]);
      setCurrentTrack(tracks[0]);
    }
  }, [tracks, currentTrack]);

  // Handle audio element loading when currentTrack changes
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      const audioElement = audioRef.current;
      const trackUrl = currentTrack.file_url || currentTrack.url;
      
      console.log('🎵 AUDIO LOADING: Track changed, loading new audio', {
        trackTitle: currentTrack.title,
        trackId: currentTrack.id,
        trackUrl: trackUrl,
        audioSrc: audioElement.src
      });

      // Reset audio state
      audioElement.currentTime = 0;
      setCurrentTime(0);
      setDuration(0);
      
      // The src is set via the audio element's src attribute in render
      // But we can ensure it's loaded properly
      if (audioElement.src !== trackUrl && trackUrl) {
        console.log('🎵 AUDIO LOADING: URL mismatch, forcing load');
        audioElement.load();
      }
    }
  }, [currentTrack]);

  // Socket event listeners for synchronized playback
  useEffect(() => {
    if (!socket) return;

    // Initial playback state sync when joining
    socket.on('playback-state-sync', (state) => {
      console.log('🔄 SYNC: Received playback state:', state);
      
      if (state.currentTrackId) {
        const track = tracks.find(t => t.id === state.currentTrackId);
        if (track) {
          setCurrentTrack(track);
        }
      }
      
      setIsPlaying(state.isPlaying);
      setCurrentTime(state.currentTime);
      setVolume(state.volume * 100);
      
      // Sync audio element
      if (audioRef.current) {
        audioRef.current.currentTime = state.currentTime;
        if (state.isPlaying) {
          audioRef.current.play().catch(console.error);
        } else {
          audioRef.current.pause();
        }
        audioRef.current.volume = state.volume;
      }
      
      setIsSynced(true);
      lastSyncTime.current = Date.now();
    });

    // Host triggered play
    socket.on('sync-play', (data) => {
      console.log('▶️ SYNC: Play command received:', data);
      
      if (data.trackId) {
        const track = tracks.find(t => t.id === data.trackId);
        if (track) {
          setCurrentTrack(track);
        }
      }
      
      setIsPlaying(true);
      setCurrentTime(data.currentTime);
      
      if (audioRef.current) {
        audioRef.current.currentTime = data.currentTime;
        audioRef.current.play().catch(console.error);
      }
      
      setIsSynced(true);
      lastSyncTime.current = Date.now();
    });

    // Host triggered pause
    socket.on('sync-pause', (data) => {
      console.log('⏸️ SYNC: Pause command received:', data);
      
      setIsPlaying(false);
      setCurrentTime(data.currentTime);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = data.currentTime;
      }
      
      setIsSynced(true);
      lastSyncTime.current = Date.now();
    });

    // Host triggered seek
    socket.on('sync-seek', (data) => {
      console.log('⏭️ SYNC: Seek command received:', data);
      
      setCurrentTime(data.currentTime);
      
      if (audioRef.current) {
        audioRef.current.currentTime = data.currentTime;
      }
      
      setIsSynced(true);
      lastSyncTime.current = Date.now();
    });

    // Host changed track
    socket.on('sync-track-change', (data) => {
      console.log('🎵 SYNC: Track change received:', data);
      console.log('🎵 SYNC: Available tracks:', tracks.map(t => ({ id: t.id, title: t.title })));
      
      const track = tracks.find(t => t.id === data.trackId);
      console.log('🎵 SYNC: Found track for ID', data.trackId, ':', track);
      
      if (track) {
        console.log('🎵 SYNC: Setting new current track:', track.title);
        setCurrentTrack(track);
        setCurrentTime(0);
        setIsPlaying(data.autoPlay);
        
        // Force audio element to update and play if needed
        if (audioRef.current) {
          console.log('🎵 SYNC: Updating audio element src to:', track.file_url || track.url);
          audioRef.current.currentTime = 0;
          
          if (data.autoPlay) {
            console.log('🎵 SYNC: Auto-playing new track');
            // Small delay to ensure src is updated
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.play().catch((error) => {
                  console.error('🎵 SYNC: Auto-play failed:', error);
                });
              }
            }, 100);
          }
        }
      } else {
        console.error('🎵 SYNC ERROR: Track not found in tracks array for ID:', data.trackId);
      }
      
      setIsSynced(true);
      lastSyncTime.current = Date.now();
    });

    // Host changed volume
    socket.on('sync-volume-change', (data) => {
      console.log('🔊 SYNC: Volume change received:', data);
      
      setVolume(data.volume * 100);
      
      if (audioRef.current) {
        audioRef.current.volume = data.volume;
      }
    });

    return () => {
      socket.off('playback-state-sync');
      socket.off('sync-play');
      socket.off('sync-pause');
      socket.off('sync-seek');
      socket.off('sync-track-change');
      socket.off('sync-volume-change');
    };
  }, [socket, tracks]);

  // Audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      const newTime = audio.currentTime;
      setCurrentTime(newTime);
      
      // Check sync drift (only for non-host users)
      if (!isHost && isPlaying) {
        const timeSinceLastSync = Date.now() - lastSyncTime.current;
        if (timeSinceLastSync > 5000) { // 5 seconds without sync
          setIsSynced(false);
        }
      }
    };
    
    const updateDuration = () => setDuration(audio.duration);
    
    const handleWaiting = () => setBuffering(true);
    const handleCanPlay = () => setBuffering(false);
    
    const handleError = (e) => {
      console.error('❌ SYNC AUDIO: Error:', e);
      setIsSynced(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [currentTrack, isHost, isPlaying]);

  // HOST ONLY: Control functions
  const handlePlayPause = () => {
    console.log('🎵 PLAY/PAUSE: Button clicked', {
      isHost,
      hasSocket: !!socket,
      isPlaying,
      currentTrack: currentTrack?.title,
      currentTime
    });
    
    if (!isHost || !socket) {
      console.log('🚫 PLAY/PAUSE: Cannot control - not host or no socket');
      return;
    }
    
    if (isPlaying) {
      console.log('⏸️ PAUSE: Calling hostPause');
      hostPause(currentTime);
    } else {
      console.log('▶️ PLAY: Calling hostPlay');
      hostPlay(currentTrack?.id, currentTime);
    }
  };

  const handleNext = () => {
    console.log('⏭️ NEXT TRACK: Button clicked', {
      isHost,
      hasCurrentTrack: !!currentTrack,
      hasSocket: !!socket,
      currentTrackId: currentTrack?.id,
      currentTrackTitle: currentTrack?.title,
      tracksLength: tracks.length
    });
    
    if (!isHost || !currentTrack || !socket) {
      console.log('🚫 NEXT TRACK: Cannot proceed', {
        isHost,
        hasCurrentTrack: !!currentTrack,
        hasSocket: !!socket
      });
      return;
    }
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    console.log('⏭️ NEXT TRACK: Current track index:', {
      currentIndex,
      tracksLength: tracks.length,
      hasNextTrack: currentIndex < tracks.length - 1
    });
    
    if (currentIndex < tracks.length - 1) {
      const nextTrack = tracks[currentIndex + 1];
      console.log('⏭️ NEXT TRACK: Moving to next track', {
        fromTrack: currentTrack.title,
        toTrack: nextTrack.title,
        nextTrackId: nextTrack.id,
        autoPlay: true
      });
      // Always auto-play the next track
      hostChangeTrack(nextTrack.id, true);
    } else {
      console.log('⏭️ NEXT TRACK: No next track available (at end of queue)');
    }
  };

  const handlePrevious = () => {
    console.log('⏮️ PREVIOUS TRACK: Button clicked', {
      isHost,
      hasCurrentTrack: !!currentTrack,
      hasSocket: !!socket,
      currentTrackId: currentTrack?.id,
      currentTrackTitle: currentTrack?.title,
      tracksLength: tracks.length
    });
    
    if (!isHost || !currentTrack || !socket) {
      console.log('🚫 PREVIOUS TRACK: Cannot proceed', {
        isHost,
        hasCurrentTrack: !!currentTrack,
        hasSocket: !!socket
      });
      return;
    }
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    console.log('⏮️ PREVIOUS TRACK: Current track index:', {
      currentIndex,
      tracksLength: tracks.length,
      hasPreviousTrack: currentIndex > 0
    });
    
    if (currentIndex > 0) {
      const prevTrack = tracks[currentIndex - 1];
      console.log('⏮️ PREVIOUS TRACK: Moving to previous track', {
        fromTrack: currentTrack.title,
        toTrack: prevTrack.title,
        prevTrackId: prevTrack.id,
        autoPlay: true
      });
      // Always auto-play the previous track
      hostChangeTrack(prevTrack.id, true);
    } else {
      console.log('⏮️ PREVIOUS TRACK: No previous track available (at beginning of queue)');
    }
  };

  const handleSeek = (event, newValue) => {
    if (!isHost || !socket) return;
    
    hostSeek(newValue);
  };

  const handleVolumeChange = (event, newValue) => {
    if (!isHost || !socket) return;
    
    hostVolumeChange(newValue / 100);
  };

  // Request sync if out of sync
  const handleRequestSync = () => {
    if (socket && requestPlaybackSync) {
      requestPlaybackSync();
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // SINGLE RETURN STATEMENT - CONDITIONAL RENDERING
  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {/* Conditional Content Based on Component State */}
      {!currentTrack ? (
        // No tracks available
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <MusicNote sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No tracks in the queue
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isHost ? 'Add some tracks to get started!' : 'Waiting for host to add tracks...'}
          </Typography>
        </Box>
      ) : (!socket || !isConnected) && !loadingTimeout ? (
        // Loading/Connecting state
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Connecting to room...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading tracks...
          </Typography>
        </Box>
      ) : (
        // Main Player Interface
        <>
          {/* Audio element */}
          <audio
            ref={audioRef}
            src={currentTrack?.file_url || currentTrack?.url}
            crossOrigin="anonymous"
            preload="metadata"
            onLoadStart={() => {
              console.log('🎵 AUDIO: Load started for', {
                trackTitle: currentTrack?.title,
                trackId: currentTrack?.id,
                src: currentTrack?.file_url || currentTrack?.url
              });
            }}
            onCanPlay={() => {
              console.log('🎵 AUDIO: Can play', {
                trackTitle: currentTrack?.title,
                trackId: currentTrack?.id
              });
            }}
            onError={(e) => {
              console.error('🎵 AUDIO ERROR:', {
                trackTitle: currentTrack?.title,
                trackId: currentTrack?.id,
                src: currentTrack?.file_url || currentTrack?.url,
                error: e
              });
            }}
          />

          {/* Sync Status Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Chip
              icon={isSynced ? <Sync /> : <SyncProblem />}
              label={isSynced ? 'Synced' : 'Out of sync'}
              color={isSynced ? 'success' : 'error'}
              size="small"
              sx={{ mr: 1 }}
            />
            {!isSynced && (
              <Tooltip title="Click to resync">
                <IconButton size="small" onClick={handleRequestSync}>
                  <Sync />
                </IconButton>
              </Tooltip>
            )}
            {buffering && (
              <Chip
                label="Buffering..."
                color="warning"
                size="small"
                sx={{ ml: 1 }}
              />
            )}
            
            {/* Debug Info Panel (only show if track clicking isn't working) */}
            {isHost && (
              <Chip
                label={`Socket: ${socket?.connected ? '✅' : '❌'} | Room: ${currentRoom || '❌'}`}
                color={socket?.connected && currentRoom ? 'success' : 'error'}
                size="small"
                sx={{ ml: 1, fontFamily: 'monospace' }}
              />
            )}
          </Box>

          {/* Current Track Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ width: 56, height: 56, mr: 2 }}>
              <MusicNote />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" noWrap>
                {currentTrack.title}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" noWrap>
                {currentTrack.artist}
              </Typography>
              <Chip 
                label={isHost ? "Host Controls" : "Listening"}
                color={isHost ? "primary" : "secondary"}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>

          {/* Playback Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Tooltip title={isHost ? "Previous track" : "Host controls only"}>
              <span>
                <IconButton 
                  onClick={handlePrevious}
                  disabled={!isHost || !currentTrack || tracks.findIndex(t => t.id === currentTrack.id) === 0}
                  size="large"
                >
                  <SkipPrevious />
                </IconButton>
              </span>
            </Tooltip>
            
            <Tooltip title={isHost ? (isPlaying ? "Pause for everyone" : "Play for everyone") : "Host controls playback"}>
              <span>
                <IconButton 
                  onClick={handlePlayPause}
                  disabled={!isHost || !currentTrack}
                  size="large"
                  sx={{ mx: 1, bgcolor: isHost ? 'primary.main' : 'grey.300', color: 'white' }}
                >
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
              </span>
            </Tooltip>
            
            <Tooltip title={isHost ? "Next track" : "Host controls only"}>
              <span>
                <IconButton 
                  onClick={handleNext}
                  disabled={!isHost || !currentTrack || tracks.findIndex(t => t.id === currentTrack.id) === tracks.length - 1}
                  size="large"
                >
                  <SkipNext />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {/* Progress Bar */}
          <Box sx={{ mb: 2 }}>
            <Slider
              value={currentTime}
              max={duration || 100}
              onChange={handleSeek}
              disabled={!isHost}
              size="small"
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                {formatTime(currentTime)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatTime(duration)}
              </Typography>
            </Box>
          </Box>

          {/* Volume Control (Host Only) */}
          {isHost && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <VolumeUp sx={{ mr: 1 }} />
              <Slider
                value={volume}
                onChange={handleVolumeChange}
                size="small"
                sx={{ flexGrow: 1 }}
              />
              <Typography variant="caption" sx={{ ml: 1, minWidth: 35 }}>
                {Math.round(volume)}%
              </Typography>
            </Box>
          )}

          {/* Track Queue List */}
          {tracks && tracks.length > 1 && (
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <QueueMusic sx={{ mr: 1 }} />
                Track Queue ({tracks.length} tracks)
              </Typography>
              
              {/* Debug Panel for Host */}
              {isHost && (
                <Box sx={{ mb: 2, p: 2, backgroundColor: 'background.paper', border: '1px solid #ddd', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    🔧 Debug Info:
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'monospace' }}>
                    Socket Connected: {socket?.connected ? '✅ YES' : '❌ NO'} | 
                    Current Room: {currentRoom ? `✅ ${currentRoom}` : '❌ NONE'} | 
                    Host Function: {hostChangeTrack ? '✅ YES' : '❌ NO'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'monospace' }}>
                    Current Track: {currentTrack?.id || 'NONE'} | 
                    Total Tracks: {tracks.length}
                  </Typography>
                  {/* Manual Test Button */}
                  {tracks.length > 1 && (
                    <button 
                      style={{ marginTop: '8px', padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => {
                        const nextTrackIndex = tracks.findIndex(t => t.id === currentTrack?.id) + 1;
                        const nextTrack = tracks[nextTrackIndex < tracks.length ? nextTrackIndex : 0];
                        console.log('🧪 MANUAL TEST: Switching to track', nextTrack.id, nextTrack.title);
                        if (hostChangeTrack) {
                          hostChangeTrack(nextTrack.id, true);
                        }
                      }}
                    >
                      🧪 Manual Test Track Switch
                    </button>
                  )}
                </Box>
              )}
              
              {isHost && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  🎵 Click on any track to play it • 🗑️ Click the delete button to remove from room
                </Typography>
              )}
              {!isHost && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  👥 Only the host can control playback
                </Typography>
              )}
              <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                {tracks.map((track, index) => (
                  <Box
                    key={track.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: currentTrack?.id === track.id ? 'action.selected' : 'transparent',
                      border: currentTrack?.id === track.id ? '1px solid' : '1px solid transparent',
                      borderColor: currentTrack?.id === track.id ? 'primary.main' : 'transparent',
                      mb: 1,
                      cursor: isHost ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      '&:hover': isHost ? {
                        backgroundColor: currentTrack?.id === track.id ? 'action.selected' : 'action.hover',
                        transform: 'translateX(4px)',
                        boxShadow: 2,
                        borderColor: 'primary.light'
                      } : {},
                      '&:active': isHost ? {
                        transform: 'translateX(2px)',
                        boxShadow: 1
                      } : {}
                    }}
                    onClick={async (event) => {
                      // Prevent any event bubbling
                      event.preventDefault();
                      event.stopPropagation();
                      
                      console.log('🖱️ TRACK CLICK: Track clicked', {
                        trackId: track.id,
                        trackTitle: track.title,
                        isHost,
                        hasHostChangeTrack: !!hostChangeTrack,
                        currentTrackId: currentTrack?.id,
                        isDifferentTrack: track.id !== currentTrack?.id,
                        socketConnected: socket?.connected,
                        roomId: room?.id
                      });
                      
                      // Check if we can proceed with track change
                      if (!isHost) {
                        console.log('🚫 TRACK CLICK: Only host can change tracks');
                        return;
                      }
                      
                      if (!hostChangeTrack) {
                        console.log('🚫 TRACK CLICK: No hostChangeTrack function available');
                        return;
                      }
                      
                      if (!socket?.connected) {
                        console.log('🚫 TRACK CLICK: Socket not connected');
                        return;
                      }
                      
                      // Always switch and play the clicked track
                      console.log('🎵 TRACK SWITCH: Calling hostChangeTrack', {
                        fromTrack: currentTrack?.title,
                        toTrack: track.title,
                        trackId: track.id,
                        autoPlay: true
                      });
                      
                      try {
                        // Switch track and auto-play
                        await hostChangeTrack(track.id, true);
                        console.log('✅ TRACK SWITCH: hostChangeTrack call completed');
                      } catch (error) {
                        console.error('❌ TRACK SWITCH: Error calling hostChangeTrack:', error);
                      }
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        minWidth: 24, 
                        mr: 2, 
                        fontWeight: currentTrack?.id === track.id ? 'bold' : 'normal',
                        color: currentTrack?.id === track.id ? 'primary.main' : 'text.secondary'
                      }}
                    >
                      {index + 1}
                    </Typography>
                    <Avatar sx={{ width: 32, height: 32, mr: 2, position: 'relative' }}>
                      <MusicNote sx={{ fontSize: 16 }} />
                      {isHost && currentTrack?.id !== track.id && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            borderRadius: '50%',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            '&:hover': { opacity: 1 }
                          }}
                        >
                          <PlayArrow sx={{ fontSize: 14, color: 'white' }} />
                        </Box>
                      )}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        noWrap
                        sx={{ 
                          fontWeight: currentTrack?.id === track.id ? 'bold' : 'normal',
                          color: currentTrack?.id === track.id ? 'primary.main' : 'text.primary'
                        }}
                      >
                        {track.title}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        noWrap
                      >
                        {track.artist}
                      </Typography>
                    </Box>
                    {currentTrack?.id === track.id && (
                      <Chip 
                        label="Playing" 
                        color="primary" 
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                    {isHost && onRemoveTrack && tracks.length > 1 && (
                      <Tooltip title="Remove track from room">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent track selection when clicking delete
                            onRemoveTrack(track);
                          }}
                          sx={{ 
                            ml: 1,
                            color: 'error.main',
                            '&:hover': {
                              backgroundColor: 'error.light',
                              color: 'error.contrastText'
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Track Queue Info */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Track {tracks.findIndex(t => t.id === currentTrack.id) + 1} of {tracks.length}
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default SynchronizedRoomAudioPlayer;

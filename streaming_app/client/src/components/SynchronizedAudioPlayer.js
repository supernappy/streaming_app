
// ...existing code...
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Card, IconButton, Slider, Typography, LinearProgress, Chip } from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  SkipNext, 
  SkipPrevious, 
  VolumeUp,
  VolumeOff,
  QueueMusic,
  Headphones,
  MusicNote,
  Equalizer,
  Visibility
} from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext_enhanced';
import api from '../services/api';
import { formatPlays } from '../utils/format';

const SynchronizedAudioPlayer = ({ roomId, isHost, tracks = [] }) => {

  // Playback state (declare all before any code that uses them)
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncTimeout, setSyncTimeout] = useState(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isLocalAction, setIsLocalAction] = useState(false);

  // Helper to determine file type
  const getFileType = (fileUrl) => {
    if (!fileUrl) return 'audio';
    const ext = fileUrl.split('.').pop().toLowerCase();
    if (ext === 'mp4') return 'video';
    return 'audio';
  };

  // Track file type for currentTrack
  const fileType = getFileType(currentTrack?.file_url);
  useEffect(() => {
    console.log('[SynchronizedAudioPlayer] tracks prop changed:', tracks);
  }, [tracks]);
  const { socket } = useSocket();
  const audioRef = useRef(null);
  const incrementedRef = useRef(new Set());
  const lastIncrementAtRef = useRef({});
  const postIncrementPlay = useCallback((trackId) => {
    if (!trackId) return;
    const now = Date.now();
    const last = lastIncrementAtRef.current[trackId] || 0;
    if (now - last < 150) return; // tiny debounce window
    lastIncrementAtRef.current[trackId] = now;
    incrementedRef.current.add(trackId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('play-debug', { detail: { type: 'play-increment', id: trackId, ts: Date.now(), roomId } }));
    }
    api.post(`/tracks/${trackId}/play`, { roomId }).catch(() => {});
  }, [roomId]);
  
  // ...existing code...

  // Format time for display
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    console.log('🎮 Play/pause clicked - isHost:', isHost, 'isPlaying:', isPlaying, 'currentTrack:', currentTrack?.title, 'currentPosition:', currentTime);
    
    if (!isHost) {
      console.log('❌ Not host, cannot control playback');
      return;
    }
    
    setIsLocalAction(true);
    
    if (isPlaying) {
      // Currently playing, so pause at current position
      const currentPosition = audioRef.current?.currentTime || currentTime || 0;
      console.log('⏸️ Pausing audio at position:', currentPosition);
      socket.emit('room:pause', {
        roomId,
        currentTime: currentPosition
      });
    } else {
      // Currently paused or stopped, so resume from current position
      if (currentTrack) {
        const resumePosition = currentTime || 0;
        console.log('▶️ Resuming track at position:', resumePosition);
        socket.emit('room:resume', { 
          roomId,
          position: resumePosition
        });
      } else if (tracks.length > 0) {
        // No current track, start first track
        console.log('🎵 Starting first track:', tracks[0].title);
        socket.emit('room:play', {
          roomId,
          trackId: tracks[0].id,
          currentTime: 0
        });
        // Only host should count the play to avoid duplicates
        if (isHost && !incrementedRef.current.has(tracks[0].id)) {
          postIncrementPlay(tracks[0].id);
        }
      } else {
        console.log('❌ No tracks available to play');
      }
    }
  }, [isHost, isPlaying, currentTrack, currentTime, roomId, socket, tracks]);

  // Handle next track
  const handleNext = useCallback(() => {
    if (!isHost) return;
    
    setIsLocalAction(true);
    socket.emit('room:next-track', { roomId });
  }, [isHost, roomId, socket]);

  // Handle previous track
  const handlePrevious = useCallback(() => {
    if (!isHost) return;
    
    setIsLocalAction(true);
    socket.emit('room:previous-track', { roomId });
  }, [isHost, roomId, socket]);

  // Handle seek
  const handleSeek = useCallback((newTime) => {
    if (!isHost || !audioRef.current) return;
    
    setIsLocalAction(true);
    setIsSeeking(true);
    
    socket.emit('room:seek', {
      roomId,
      currentTime: newTime
    });
    
    // Clear seeking state after a delay
    setTimeout(() => setIsSeeking(false), 100);
  }, [isHost, roomId, socket]);

  // Handle volume change
  const handleVolumeChange = useCallback((newVolume) => {
    if (!isHost) return;
    
    setIsLocalAction(true);
    socket.emit('room:volume', {
      roomId,
      volume: newVolume
    });
  }, [isHost, roomId, socket]);

  // Update audio element time and playing state
  const syncAudioElement = useCallback(async (state) => {
    if (!audioRef.current) {
      return;
    }

    // Reset local action flag after processing
    if (isLocalAction) {
      setIsLocalAction(false);
    }

    try {
      const audio = audioRef.current;
      
      // Set volume
      audio.volume = (state.masterVolume || 70) / 100;
      
      // Load track if different
      if (state.currentTrackId && (!currentTrack || currentTrack.id !== state.currentTrackId)) {
        const track = tracks.find(t => t.id === state.currentTrackId);
        if (track) {
          setCurrentTrack(track);
          setIsLoading(true);
          audio.src = track.file_url;
          await new Promise((resolve) => {
            audio.onloadeddata = resolve;
          });
          setIsLoading(false);
        }
      }
      
      // Sync time position (with tolerance for network delay)
      const timeDiff = Math.abs(audio.currentTime - (state.currentPosition || 0));
      if (timeDiff > 1) { // Only sync if difference is significant
        audio.currentTime = state.currentPosition || 0;
      }
      
      // Sync play/pause state - always sync regardless of local action
      console.log('🔄 Syncing audio state - server isPlaying:', state.isPlaying, 'audio paused:', audio.paused);
      if (state.isPlaying && audio.paused) {
        console.log('🎵 Syncing to PLAY state');
        await audio.play();
      } else if (!state.isPlaying && !audio.paused) {
        console.log('⏸️ Syncing to PAUSE state');
        audio.pause();
      } else {
        console.log('✅ Audio state already in sync');
      }
      
    } catch (error) {
      console.error('Audio sync error:', error);
      setIsLoading(false);
    }
  }, [currentTrack, tracks, isLocalAction]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Initial sync when joining room
    const handleSyncState = (state) => {
      console.log('🔄 Syncing to room state:', state);
      setIsPlaying(state.isPlaying || false);
      setCurrentTime(state.currentPosition || 0);
      setVolume(state.masterVolume || 70);
      syncAudioElement(state);
    };

    // Real-time state updates
    const handleStateUpdate = (state) => {
      console.log('📡 Room state update:', state);
      setIsPlaying(state.isPlaying || false);
      setCurrentTime(state.currentPosition || 0);
      setVolume(state.masterVolume || 70);
      if (isHost && state.isPlaying && state.currentTrackId && !incrementedRef.current.has(state.currentTrackId)) {
        postIncrementPlay(state.currentTrackId);
      }
      
      // Clear any pending sync and schedule new one
      if (syncTimeout) clearTimeout(syncTimeout);
      setSyncTimeout(setTimeout(() => syncAudioElement(state), 50));
    };

    socket.on('room:sync-state', handleSyncState);
    socket.on('room:state-update', handleStateUpdate);

    // Merge live play_count updates into local currentTrack
    const handlePlayCount = ({ trackId, play_count }) => {
      setCurrentTrack(prev => prev && prev.id === trackId ? { ...prev, play_count } : prev);
    };
    socket.on('track:play-count-updated', handlePlayCount);

    return () => {
      socket.off('room:sync-state', handleSyncState);
      socket.off('room:state-update', handleStateUpdate);
      socket.off('track:play-count-updated', handlePlayCount);
      if (syncTimeout) clearTimeout(syncTimeout);
    };
  }, [socket, syncAudioElement, syncTimeout]);

  // Audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isSeeking && !isLocalAction) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = (e) => {
      console.error('Audio error:', e);
      setIsLoading(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [isSeeking, isLocalAction]);

  // Auto-load first track when tracks become available
  useEffect(() => {
    console.log('🔍 Auto-load check - tracks:', tracks.length, 'currentTrack:', currentTrack?.title, 'audioRef:', !!audioRef.current);
    if (tracks.length > 0 && !currentTrack && audioRef.current) {
      console.log('🎵 Loading first track:', tracks[0].title, 'URL:', tracks[0].file_url);
      setCurrentTrack(tracks[0]);
      audioRef.current.src = tracks[0].file_url;
    }
  }, [tracks, currentTrack]);

  return (
    <Card 
      sx={{ 
        p: 3, 
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isPlaying ? 
            'linear-gradient(45deg, rgba(78, 205, 196, 0.1), rgba(68, 160, 141, 0.1))' :
            'transparent',
          transition: 'all 0.3s ease',
          zIndex: -1
        }
      }}
    >
      {/* Audio/Video element (mp3/mp4 support) */}
      {currentTrack && currentTrack.file_url ? (
        fileType === 'audio' ? (
          <audio ref={audioRef} preload="metadata" style={{ display: 'none' }} src={currentTrack.file_url} />
        ) : (
          <video
            ref={audioRef}
            preload="metadata"
            src={currentTrack.file_url}
            style={{ width: '100%', maxHeight: 320, background: '#000', borderRadius: 8, marginBottom: 16 }}
            controls={false}
          />
        )
      ) : (
        <Box sx={{ color: 'red', textAlign: 'center', mb: 2 }}>
          <Typography variant="body2">No track loaded or file URL missing.</Typography>
        </Box>
      )}
      {/* Debug: show current track and file URL */}
      <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 2 }}>
        <Typography variant="caption" sx={{ color: 'gray' }}>
          Debug: {currentTrack ? `Track: ${currentTrack.title}, URL: ${currentTrack.file_url}` : 'No track'}
        </Typography>
      </Box>
      
      {/* Loading indicator */}
      {isLoading && (
        <LinearProgress 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(45deg, #4ECDC4, #44A08D)'
            }
          }} 
        />
      )}
      
      {/* Current track info */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        {fileType === 'video' && currentTrack?.file_url && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, display: 'block' }}>
            (MP4 Video - audio will play, video visible below)
          </Typography>
        )}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mb: 2,
          gap: 2
        }}>
          <Box sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: currentTrack ? 
              'linear-gradient(45deg, #4ECDC4, #44A08D)' : 
              'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: isPlaying ? 'beat 1s infinite' : 'none',
            transition: 'all 0.3s ease'
          }}>
            {isPlaying ? <Equalizer sx={{ color: 'white', fontSize: 28 }} /> : 
             currentTrack ? <MusicNote sx={{ color: 'white', fontSize: 28 }} /> :
             <QueueMusic sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 28 }} />}
          </Box>
          
          <Box sx={{ flex: 1, textAlign: 'left' }}>
            <Typography variant="h5" sx={{ 
              color: 'white', 
              mb: 0.5,
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {currentTrack?.title || 'No track selected'}
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              mb: 0.5
            }}>
              {currentTrack?.artist || 'Unknown artist'}
            </Typography>
            <Chip label={formatPlays(typeof currentTrack?.play_count === 'number' ? currentTrack.play_count : 0)} size="small" sx={{ mr: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                size="small"
                label={isPlaying ? "Playing" : currentTrack ? "Paused" : "Stopped"}
                sx={{
                  background: isPlaying ? 
                    'linear-gradient(45deg, #4ECDC4, #44A08D)' : 
                    'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
              {currentTrack && (
                <Typography variant="caption" sx={{ 
                  color: 'rgba(255, 255, 255, 0.6)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1
                }}>
                  Track {tracks.findIndex(t => t.id === currentTrack.id) + 1} of {tracks.length}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Progress section */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography variant="caption" sx={{ 
            color: 'rgba(255, 255, 255, 0.8)',
            minWidth: '45px',
            fontFamily: 'monospace'
          }}>
            {formatTime(currentTime)}
          </Typography>
          
          <Box sx={{ flex: 1, position: 'relative' }}>
            <Slider
              value={currentTime}
              max={duration || 100}
              onChange={(_, value) => !isSeeking && setCurrentTime(value)}
              onChangeCommitted={(_, value) => handleSeek(value)}
              disabled={!isHost || !currentTrack}
              sx={{
                height: 8,
                '& .MuiSlider-track': {
                  background: 'linear-gradient(45deg, #4ECDC4, #44A08D)',
                  border: 'none',
                  height: 8
                },
                '& .MuiSlider-rail': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  height: 8
                },
                '& .MuiSlider-thumb': {
                  height: 20,
                  width: 20,
                  backgroundColor: '#fff',
                  border: '3px solid #4ECDC4',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 8px rgba(78, 205, 196, 0.16)',
                  },
                  '&.Mui-active': {
                    boxShadow: '0 0 0 14px rgba(78, 205, 196, 0.16)',
                  }
                }
              }}
            />
          </Box>
          
          <Typography variant="caption" sx={{ 
            color: 'rgba(255, 255, 255, 0.8)',
            minWidth: '45px',
            fontFamily: 'monospace',
            textAlign: 'right'
          }}>
            {formatTime(duration)}
          </Typography>
        </Box>
        
        {/* Progress percentage */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Typography variant="caption" sx={{ 
            color: 'rgba(255, 255, 255, 0.6)',
            background: 'rgba(255, 255, 255, 0.1)',
            px: 1,
            py: 0.5,
            borderRadius: 1
          }}>
            {duration > 0 ? `${Math.round((currentTime / duration) * 100)}% complete` : '0% complete'}
          </Typography>
        </Box>
      </Box>

      {/* Control buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
        <IconButton 
          onClick={handlePrevious}
          disabled={!isHost || tracks.length <= 1}
          sx={{ 
            color: 'white',
            background: 'rgba(255, 255, 255, 0.1)',
            '&:hover': { 
              background: 'rgba(255, 255, 255, 0.2)',
              transform: 'scale(1.1)'
            },
            '&:disabled': { 
              color: 'rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.05)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <SkipPrevious />
        </IconButton>
        
        <IconButton 
          onClick={handlePlayPause}
          disabled={!isHost || (!currentTrack && tracks.length === 0)}
          sx={{ 
            color: 'white', 
            background: isPlaying ? 
              'linear-gradient(45deg, #FF6B6B, #FF8E8E)' :
              'linear-gradient(45deg, #4ECDC4, #44A08D)',
            width: 64,
            height: 64,
            boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
            '&:hover': { 
              background: isPlaying ?
                'linear-gradient(45deg, #FF8E8E, #FF6B6B)' :
                'linear-gradient(45deg, #44A08D, #4ECDC4)',
              transform: 'scale(1.1)',
              boxShadow: '0 12px 24px rgba(0,0,0,0.4)'
            },
            '&:disabled': { 
              color: 'rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.1)',
              boxShadow: 'none'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {isPlaying ? <Pause sx={{ fontSize: 32 }} /> : <PlayArrow sx={{ fontSize: 32 }} />}
        </IconButton>
        
        <IconButton 
          onClick={handleNext}
          disabled={!isHost || tracks.length <= 1}
          sx={{ 
            color: 'white',
            background: 'rgba(255, 255, 255, 0.1)',
            '&:hover': { 
              background: 'rgba(255, 255, 255, 0.2)',
              transform: 'scale(1.1)'
            },
            '&:disabled': { 
              color: 'rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.05)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <SkipNext />
        </IconButton>
      </Box>

      {/* Volume control */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <IconButton 
          onClick={() => setIsMuted(!isMuted)}
          disabled={!isHost}
          sx={{ 
            color: 'white',
            '&:disabled': { color: 'rgba(255, 255, 255, 0.3)' }
          }}
        >
          {isMuted || volume === 0 ? <VolumeOff /> : <VolumeUp />}
        </IconButton>
        
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Slider
            value={isMuted ? 0 : volume}
            onChange={(_, value) => {
              setVolume(value);
              setIsMuted(value === 0);
            }}
            onChangeCommitted={(_, value) => handleVolumeChange(value)}
            disabled={!isHost}
            sx={{
              color: '#4ECDC4',
              '& .MuiSlider-thumb': {
                backgroundColor: '#4ECDC4',
                width: 16,
                height: 16,
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: '0 0 0 8px rgba(78, 205, 196, 0.16)',
                }
              },
              '& .MuiSlider-track': {
                backgroundColor: '#4ECDC4',
                height: 4
              },
              '& .MuiSlider-rail': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                height: 4
              }
            }}
          />
          
          <Typography variant="caption" sx={{ 
            color: 'rgba(255, 255, 255, 0.7)', 
            minWidth: '35px',
            textAlign: 'right',
            fontFamily: 'monospace'
          }}>
            {Math.round(isMuted ? 0 : volume)}%
          </Typography>
        </Box>
      </Box>

      {/* Host/Participant indicator */}
      <Box sx={{ textAlign: 'center' }}>
        {isHost ? (
          <Chip
            icon={<Headphones />}
            label="Host Controls"
            size="small"
            sx={{
              background: 'linear-gradient(45deg, #4ECDC4, #44A08D)',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        ) : (
          <Chip
            icon={<Visibility />}
            label="Listener Mode"
            size="small"
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          />
        )}
      </Box>
    </Card>
  );
};

export default SynchronizedAudioPlayer;

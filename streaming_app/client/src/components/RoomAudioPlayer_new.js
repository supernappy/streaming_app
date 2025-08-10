import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Slider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  Tooltip
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  VolumeUp,
  QueueMusic,
  Add,
  MusicNote
} from '@mui/icons-material';
import { tracksAPI } from '../services/api';
import socketService from '../services/socketService';

const RoomAudioPlayer = ({ room, isHost, onAddTrack, tracks = [] }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableTracks, setAvailableTracks] = useState([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const audioRef = useRef(null);
  const syncTimeoutRef = useRef(null);

  useEffect(() => {
    if (tracks.length > 0 && !currentTrack) {
      console.log('=== ROOM AUDIO DEBUG ===');
      console.log('Setting first track as current:', tracks[0]);
      console.log('Track file_url:', tracks[0].file_url);
      console.log('Track url:', tracks[0].url);
      setCurrentTrack(tracks[0]);
    }
  }, [tracks, currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    
    const handleLoadStart = () => {
      console.log('🔄 Room audio: Load started for:', currentTrack?.title);
    };
    
    const handleCanPlay = () => {
      console.log('✅ Room audio: Can play:', currentTrack?.title);
    };
    
    const handleError = (e) => {
      console.error('❌ Room audio error:', e);
      console.error('❌ Audio error for track:', currentTrack?.title);
      console.error('❌ Audio src:', audio.src);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [currentTrack]);

  // Socket connection and synchronization
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No auth token found for socket connection');
          return;
        }

        // Connect to socket service
        await socketService.connect(token);
        
        // Join room
        socketService.joinRoom(room.id, isHost);

        // Set up event listeners
        socketService.on('playback-state-sync', handlePlaybackStateSync);
        socketService.on('sync-play', handleSyncPlay);
        socketService.on('sync-pause', handleSyncPause);
        socketService.on('sync-seek', handleSyncSeek);
        socketService.on('sync-track-change', handleSyncTrackChange);
        socketService.on('sync-volume-change', handleSyncVolumeChange);
        socketService.on('user-joined', handleUserJoined);
        socketService.on('user-left', handleUserLeft);

        console.log('🔗 Socket service initialized for room', room.id);
      } catch (error) {
        console.error('Failed to initialize socket service:', error);
      }
    };

    if (room?.id) {
      initializeSocket();
    }

    return () => {
      // Clean up socket listeners
      socketService.off('playback-state-sync', handlePlaybackStateSync);
      socketService.off('sync-play', handleSyncPlay);
      socketService.off('sync-pause', handleSyncPause);
      socketService.off('sync-seek', handleSyncSeek);
      socketService.off('sync-track-change', handleSyncTrackChange);
      socketService.off('sync-volume-change', handleSyncVolumeChange);
      socketService.off('user-joined', handleUserJoined);
      socketService.off('user-left', handleUserLeft);
      
      socketService.leaveRoom();
    };
  }, [room?.id, isHost]);

  // Socket event handlers
  const handlePlaybackStateSync = (data) => {
    console.log('🔄 Syncing playback state:', data);
    setIsSyncing(true);
    
    if (data.currentTrackId && tracks.length > 0) {
      const track = tracks.find(t => t.id === data.currentTrackId);
      if (track && track !== currentTrack) {
        setCurrentTrack(track);
      }
    }
    
    if (audioRef.current) {
      audioRef.current.currentTime = data.currentTime || 0;
      audioRef.current.volume = (data.volume || 0.7) / 100;
      
      if (data.isPlaying && !isPlaying) {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      } else if (!data.isPlaying && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
    
    setTimeout(() => setIsSyncing(false), 500);
  };

  const handleSyncPlay = (data) => {
    console.log('▶️ Received sync play command:', data);
    if (!isHost && audioRef.current) {
      setIsSyncing(true);
      audioRef.current.currentTime = data.currentTime || 0;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setTimeout(() => setIsSyncing(false), 500);
      }).catch(console.error);
    }
  };

  const handleSyncPause = (data) => {
    console.log('⏸️ Received sync pause command:', data);
    if (!isHost && audioRef.current) {
      setIsSyncing(true);
      audioRef.current.currentTime = data.currentTime || 0;
      audioRef.current.pause();
      setIsPlaying(false);
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleSyncSeek = (data) => {
    console.log('⏩ Received sync seek command:', data);
    if (!isHost && audioRef.current) {
      setIsSyncing(true);
      audioRef.current.currentTime = data.currentTime;
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleSyncTrackChange = (data) => {
    console.log('🎵 Received sync track change:', data);
    if (!isHost && tracks.length > 0) {
      const track = tracks.find(t => t.id === data.trackId);
      if (track) {
        setIsSyncing(true);
        setCurrentTrack(track);
        setCurrentTime(0);
        
        if (data.autoPlay && audioRef.current) {
          setTimeout(() => {
            audioRef.current.play().then(() => {
              setIsPlaying(true);
            }).catch(console.error);
          }, 100);
        }
        
        setTimeout(() => setIsSyncing(false), 500);
      }
    }
  };

  const handleSyncVolumeChange = (data) => {
    console.log('🔊 Received sync volume change:', data);
    if (!isHost && audioRef.current) {
      setVolume(data.volume);
      audioRef.current.volume = data.volume / 100;
    }
  };

  const handleUserJoined = (data) => {
    console.log('👋 User joined:', data);
    setConnectedUsers(prev => [...prev.filter(u => u.id !== data.user.id), data.user]);
  };

  const handleUserLeft = (data) => {
    console.log('👋 User left:', data);
    setConnectedUsers(prev => prev.filter(u => u.id !== data.user.id));
  };

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || isSyncing) return;
    
    try {
      if (isPlaying) {
        // Pause
        audio.pause();
        setIsPlaying(false);
        
        // If host, sync pause with all participants
        if (isHost) {
          socketService.hostPause(audio.currentTime);
        }
      } else {
        // Play
        await audio.play();
        setIsPlaying(true);
        
        // If host, sync play with all participants
        if (isHost && currentTrack) {
          socketService.hostPlay(currentTrack.id, audio.currentTime);
        }
      }
    } catch (error) {
      console.error('Error in handlePlayPause:', error);
    }
  };

  const handleTrackClick = (track, index) => {
    console.log('Track clicked:', track.title, 'Index:', index);
    
    if (isSyncing) {
      console.log('Ignoring track click during sync');
      return;
    }
    
    setCurrentTrack(track);
    setCurrentTime(0);
    
    // If host, sync track change with all participants
    if (isHost) {
      socketService.hostChangeTrack(track.id, true); // autoPlay = true
    } else if (audioRef.current) {
      // Non-host users can still change tracks locally (will be overridden by host sync)
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    }
  };

  const handlePrevious = () => {
    if (!tracks.length || isSyncing) return;
    
    const currentIndex = tracks.findIndex(track => track.id === currentTrack?.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1;
    const prevTrack = tracks[prevIndex];
    
    if (prevTrack) {
      handleTrackClick(prevTrack, prevIndex);
    }
  };

  const handleNext = () => {
    if (!tracks.length || isSyncing) return;
    
    const currentIndex = tracks.findIndex(track => track.id === currentTrack?.id);
    const nextIndex = currentIndex < tracks.length - 1 ? currentIndex + 1 : 0;
    const nextTrack = tracks[nextIndex];
    
    if (nextTrack) {
      handleTrackClick(nextTrack, nextIndex);
    }
  };

  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
    if (audioRef.current) {
      audioRef.current.volume = newValue / 100;
      
      // If host, sync volume with all participants
      if (isHost) {
        socketService.hostVolumeChange(newValue);
      }
    }
  };

  const handleSeek = (event, newValue) => {
    if (audioRef.current && !isSyncing) {
      audioRef.current.currentTime = newValue;
      setCurrentTime(newValue);
      
      // If host, sync seek with all participants
      if (isHost) {
        socketService.hostSeek(newValue);
      }
    }
  };

  // Original functions continue below...
  const originalHandlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        console.log('🎵 Room audio: Attempting to play:', currentTrack?.title);
        console.log('🎵 Audio src:', audio.src);
        await audio.play();
        setIsPlaying(true);
        console.log('✅ Room audio: Playing successfully');
      }
    } catch (error) {
      console.error('❌ Room audio play error:', error);
      setIsPlaying(false);
    }
  };

  // Original handleNext and handlePrevious removed - using synchronized versions above

  const handleSeekLocal = (event, newValue) => {
    const audio = audioRef.current;
    audio.currentTime = newValue;
    setCurrentTime(newValue);
  };

  const handleVolumeChangeLocal = (event, newValue) => {
    const audio = audioRef.current;
    audio.volume = newValue / 100;
    setVolume(newValue);
  };

    const handleAddTrack = async () => {
    try {
      console.log('=== DEBUG: Starting handleAddTrack ===');
      console.log('Is host:', isHost);
      console.log('Room:', room);
      console.log('Current tracks:', tracks);
      
      setIsLoadingTracks(true);
      
      console.log('Token exists:', !!localStorage.getItem('token'));
      
      // Get available tracks from user's library
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      console.log('Fetching user tracks...');
      const response = await tracksAPI.getUserTracks();
      
      console.log('Tracks API response:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      if (response.data && response.data.tracks) {
        const extractedTracks = response.data.tracks;
        console.log('Extracted tracks:', extractedTracks);
        console.log('Number of tracks found:', extractedTracks.length);
        
        setAvailableTracks(extractedTracks);
        
        // Add explicit debugging for dialog display
        console.log('🎯 TRACKS AVAILABLE FOR SELECTION:');
        extractedTracks.forEach((track, index) => {
          console.log(`${index + 1}. "${track.title}" by ${track.artist} (ID: ${track.id})`);
        });
        console.log('🎯 Dialog will now show these tracks. Click on any track to add it to the room.');
        
        // 🚨 BYPASS DIALOG - Auto-add the first track for testing
        if (extractedTracks.length > 0) {
          const firstTrack = extractedTracks[0];
          console.log('🚨 BYPASS: Auto-adding first track for testing:', firstTrack.title);
          
          // Call handleSelectTrack directly
          if (onAddTrack) {
            try {
              console.log('🎯 CALLING onAddTrack directly with first track...');
              await onAddTrack(firstTrack);
              alert(`✅ SUCCESS! Auto-added "${firstTrack.title}" to the room!`);
              setShowAddTrack(false);
            } catch (error) {
              console.error('❌ Error calling onAddTrack:', error);
              alert(`❌ Error adding track: ${error.message}`);
            }
          } else {
            console.error('❌ onAddTrack function not available');
            alert('❌ onAddTrack function not available');
          }
        }
        
      } else {
        console.warn('No tracks found in response');
        setAvailableTracks([]);
        alert('No tracks found in your library');
      }
      
      // Still open dialog for manual testing if needed
      setShowAddTrack(true);
      
      console.log('=== DEBUG: handleAddTrack completed successfully ===');
      console.log('🚨 NEXT STEP: Track should now be auto-added! Check for success message.');
    } catch (error) {
      console.error('=== DEBUG: Error in handleAddTrack ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      // More specific error messages
      if (error.response?.status === 401) {
        alert('Authentication failed. Please log in again and try.');
      } else if (error.response?.status === 403) {
        alert('You do not have permission to access your tracks.');
      } else if (error.response?.status === 500) {
        alert('Server error. Please try again later.');
      } else {
        alert(`Failed to load your tracks: ${error.message}. Please check the console for details.`);
      }
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handleSelectTrack = async (track) => {
    try {
      console.log('🎵 === DEBUG: Starting handleSelectTrack ===');
      console.log('Selected track:', track);
      console.log('Track title:', track.title);
      console.log('Track ID:', track.id);
      console.log('Room ID:', room?.id);
      console.log('onAddTrack function:', typeof onAddTrack);
      
      // Show immediate feedback to user
      const originalButton = document.activeElement;
      if (originalButton && originalButton.textContent.includes('Add')) {
        originalButton.innerHTML = '⏳ Adding...';
        originalButton.disabled = true;
      }
      
      if (!onAddTrack) {
        console.error('❌ onAddTrack function is not provided');
        alert('Cannot add track: missing callback function');
        return;
      }
      
      if (!track || !track.id) {
        console.error('❌ Invalid track selected:', track);
        alert('Invalid track selected');
        return;
      }
      
      console.log('📤 Calling onAddTrack with track:', track.title);
      await onAddTrack(track);
      
      setShowAddTrack(false);
      setSearchQuery('');
      console.log('✅ === DEBUG: Track added successfully! ===');
      console.log('Track title added:', track.title);
      
      // Show success feedback
      alert(`✅ Successfully added "${track.title}" to the room!`);
      
    } catch (error) {
      console.error('❌ === DEBUG: Error in handleSelectTrack ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // More specific error messages
      if (error.response?.status === 403) {
        alert('❌ You do not have permission to add tracks to this room.');
      } else if (error.response?.status === 404) {
        alert('❌ Track or room not found.');
      } else if (error.response?.status === 409) {
        alert('⚠️ This track is already in the room.');
      } else if (error.response?.status === 500) {
        alert('❌ Server error. Please try again later.');
      } else {
        alert(`❌ Failed to add track: ${error.message}`);
      }
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const filteredTracks = availableTracks.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentTrack && tracks.length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <QueueMusic sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No tracks in this room yet
        </Typography>
        {/* Show Add First Track button for all users, not just hosts */}
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={handleAddTrack}
          disabled={isLoadingTracks}
          sx={{ mt: 2 }}
        >
          {isLoadingTracks ? 'Loading...' : 'Add First Track'}
        </Button>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <audio
        ref={audioRef}
        src={currentTrack?.file_url || currentTrack?.url}
        onEnded={handleNext}
        crossOrigin="anonymous"
      />
      
      {/* Current Track Info */}
      {currentTrack && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ width: 56, height: 56, mr: 2 }}>
            <MusicNote />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap>
              {currentTrack.title}
              {isSyncing && (
                <Chip 
                  label="Syncing..." 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 1 }} 
                />
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {currentTrack.artist}
              {isHost && (
                <Chip 
                  label="HOST" 
                  size="small" 
                  color="success" 
                  sx={{ ml: 1 }} 
                />
              )}
              {connectedUsers.length > 0 && (
                <Chip 
                  label={`${connectedUsers.length + 1} users`} 
                  size="small" 
                  color="info" 
                  sx={{ ml: 1 }} 
                />
              )}
            </Typography>
          </Box>
          <Chip 
            label={`${tracks.findIndex(t => t.id === currentTrack.id) + 1} of ${tracks.length}`}
            size="small"
            variant="outlined"
          />
        </Box>
      )}

      {/* Player Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        <Tooltip title="Previous">
          <IconButton 
            onClick={handlePrevious}
            disabled={!currentTrack || tracks.findIndex(t => t.id === currentTrack.id) === 0}
          >
            <SkipPrevious />
          </IconButton>
        </Tooltip>
        
        <Tooltip title={isPlaying ? "Pause" : "Play"}>
          <IconButton 
            onClick={handlePlayPause}
            disabled={!currentTrack}
            sx={{ mx: 1 }}
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Next">
          <IconButton 
            onClick={handleNext}
            disabled={!currentTrack || tracks.findIndex(t => t.id === currentTrack.id) === tracks.length - 1}
          >
            <SkipNext />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Progress Bar */}
      {currentTrack && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="caption" sx={{ mr: 1, minWidth: '40px' }}>
            {formatTime(currentTime)}
          </Typography>
          <Slider
            value={currentTime}
            max={duration || 0}
            onChange={handleSeekLocal}
            sx={{ flexGrow: 1, mx: 1 }}
          />
          <Typography variant="caption" sx={{ ml: 1, minWidth: '40px' }}>
            {formatTime(duration)}
          </Typography>
        </Box>
      )}

      {/* Volume Control */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <VolumeUp sx={{ mr: 1 }} />
        <Slider
          value={volume}
          onChange={handleVolumeChange}
          sx={{ width: 100 }}
        />
      </Box>

      {/* Queue/Playlist */}
      {tracks.length > 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Queue ({tracks.length} tracks)
            </Typography>
            {/* Show Add Track button for all users, not just hosts */}
            <Button 
              variant="outlined" 
              size="small"
              startIcon={<Add />}
              onClick={handleAddTrack}
              disabled={isLoadingTracks}
            >
              {isLoadingTracks ? 'Loading...' : 'Add Track'}
            </Button>
          </Box>
          
          <List sx={{ maxHeight: 200, overflow: 'auto' }}>
            {tracks.map((track, index) => (
              <ListItem 
                key={track.id}
                button
                selected={currentTrack?.id === track.id}
                onClick={() => handleTrackClick(track, index)}
              >
                <ListItemAvatar>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    <MusicNote fontSize="small" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={track.title}
                  secondary={track.artist}
                  primaryTypographyProps={{ noWrap: true }}
                  secondaryTypographyProps={{ noWrap: true }}
                />
                <Typography variant="caption" color="text.secondary">
                  {index + 1}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Add Track Dialog */}
      <Dialog 
        open={showAddTrack} 
        onClose={() => setShowAddTrack(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            zIndex: 9999
          }
        }}
      >
        <DialogTitle>
          Add Track to Room
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            🎵 Click on any track below or click the "Add" button to add it to the room
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search your tracks..."
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ mb: 2 }}
          />
          
          <Typography variant="subtitle2" gutterBottom>
            Your Tracks ({availableTracks.length} available)
          </Typography>
          
          {isLoadingTracks ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography>Loading your tracks...</Typography>
            </Box>
          ) : availableTracks.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography color="text.secondary">
                No tracks found. Upload some tracks first to add them to the room.
              </Typography>
              <Button 
                variant="contained" 
                sx={{ mt: 2 }}
                onClick={() => window.location.href = '/upload'}
              >
                Upload Tracks
              </Button>
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
                ⚠️ DEBUG: {filteredTracks.length} tracks rendered. Click DIRECTLY on the track items below.
              </Typography>
              <List sx={{ maxHeight: 300, overflow: 'auto', border: '2px solid red', borderRadius: 1 }}>
                {filteredTracks.map((track, index) => {
                  console.log(`🎵 Rendering track ${index + 1}: ${track.title} (ID: ${track.id})`);
                  return (
                    <ListItem 
                      key={track.id}
                      button
                      onClick={(e) => {
                        console.log('🎯 LIST ITEM CLICKED:', track.title);
                        console.log('Event:', e);
                        console.log('Event target:', e.target);
                        console.log('Event currentTarget:', e.currentTarget);
                        handleSelectTrack(track);
                      }}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          transform: 'scale(1.02)',
                          transition: 'all 0.2s ease'
                        },
                        border: '1px solid blue',
                        borderRadius: 1,
                        mb: 1,
                        cursor: 'pointer',
                        backgroundColor: 'rgba(0, 255, 0, 0.1)' // Green background for visibility
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <MusicNote />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {track.title}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {track.artist} • {track.genre || 'Unknown Genre'}
                          </Typography>
                        }
                      />
                      <Button
                        variant="contained"
                        size="small"
                        color="secondary"
                        sx={{ 
                          ml: 2,
                          minWidth: 80,
                          backgroundColor: 'red',
                          '&:hover': {
                            backgroundColor: 'darkred'
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('🎯 ADD BUTTON CLICKED for track:', track.title);
                          console.log('Button event:', e);
                          console.log('Track details:', track);
                          handleSelectTrack(track);
                        }}
                      >
                        ➕ Add
                      </Button>
                    </ListItem>
                  );
                })}
              </List>
              <Typography variant="body2" color="error" sx={{ mt: 2, fontWeight: 'bold' }}>
                🚨 If you can see tracks above but clicking doesn't work, there's a UI blocking issue!
              </Typography>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default RoomAudioPlayer;

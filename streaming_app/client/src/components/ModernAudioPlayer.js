import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Slider,
  Avatar,
  Chip,
  Button,
  LinearProgress,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Fab,
  Grid,
  Paper,
  Collapse,
  Zoom,
  Fade,
  Divider
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  VolumeUp,
  VolumeDown,
  VolumeOff,
  Shuffle,
  Repeat,
  RepeatOne,
  QueueMusic,
  Add,
  Remove,
  MusicNote,
  GraphicEq,
  Equalizer,
  Favorite,
  FavoriteBorder,
  Share,
  Download,
  Album,
  LibraryMusic,
  PlaylistAdd,
  DeleteOutline,
  Fullscreen,
  FullscreenExit,
  Waves,
  AutoAwesome,
  TrendingUp,
  Whatshot,
  EmojiEvents
} from '@mui/icons-material';
import { formatPlays } from '../utils/format';
// Integrate global player for consistent play count increments
import { usePlayer } from '../contexts/PlayerContext';

const ModernAudioPlayer = ({ 
  room, 
  isHost, 
  tracks = [], 
  userTracks = [],
  onAddTrack, 
  onRemoveTrack,
  onEnergyChange,
  onVibeChange
}) => {
  // Use global player context for playback & play counts
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = usePlayer();
  const [displayTracks, setDisplayTracks] = useState(tracks);
  const [localCurrentTrack, setLocalCurrentTrack] = useState(null); // keep for UI initial selection
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0: none, 1: all, 2: one
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // UI state
  const [showQueue, setShowQueue] = useState(false);
  const [showAddTracks, setShowAddTracks] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [visualizerData, setVisualizerData] = useState(Array(32).fill(0));
  const [isVisualizerActive, setIsVisualizerActive] = useState(true);
  const [trackLoved, setTrackLoved] = useState({});
  const [energy, setEnergy] = useState(75);
  const [beatDetected, setBeatDetected] = useState(false);
  
  // Refs
  const audioRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  // Initialize audio context for visualizer
  useEffect(() => {
    if (!audioContextRef.current && audioRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaElementSource(audioRef.current);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
        analyserRef.current.fftSize = 64;
      } catch (error) {
        console.error('Failed to create audio context:', error);
      }
    }
  }, []);

  // Set first track when tracks change
  useEffect(() => {
    setDisplayTracks(tracks);
    if (tracks.length > 0 && !localCurrentTrack) {
      setLocalCurrentTrack(tracks[0]);
      setCurrentTrackIndex(0);
    }
  }, [tracks, localCurrentTrack]);

  // Live-merge updated play_count from global currentTrack into local display list
  useEffect(() => {
    if (currentTrack?.id && typeof currentTrack.play_count !== 'undefined') {
      setDisplayTracks(prev => (prev || []).map(t => t.id === currentTrack.id ? { ...t, play_count: currentTrack.play_count } : t));
    }
  }, [currentTrack]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => handleNext();
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack]);

  // Visualizer animation
  useEffect(() => {
    if (isPlaying && isVisualizerActive && analyserRef.current) {
      const updateVisualizer = () => {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Update visualizer data
        setVisualizerData(Array.from(dataArray).slice(0, 32));
        
        // Beat detection (simplified)
        const bass = dataArray.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
        if (bass > 200) {
          setBeatDetected(true);
          setTimeout(() => setBeatDetected(false), 100);
          
          // Update energy based on audio intensity
          const avgIntensity = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const newEnergy = Math.min(100, (avgIntensity / 255) * 100);
          setEnergy(newEnergy);
          onEnergyChange?.(newEnergy);
        }
        
        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setVisualizerData(Array(32).fill(0));
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, isVisualizerActive, onEnergyChange]);

  const handlePlayPause = () => {
    if (!currentTrack && localCurrentTrack) {
      playTrack(localCurrentTrack, tracks);
      return;
    }
    togglePlayPause();
  };

  const handleNext = () => {
    if (tracks.length === 0) return;
    
    let nextIndex;
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else {
      nextIndex = (currentTrackIndex + 1) % tracks.length;
    }
    
  setCurrentTrackIndex(nextIndex);
  const nextTrack = displayTracks[nextIndex] || tracks[nextIndex];
  setLocalCurrentTrack(nextTrack);
  playTrack(nextTrack, displayTracks || tracks);
  };

  const handlePrevious = () => {
    if (tracks.length === 0) return;
    
    let prevIndex;
    if (isShuffled) {
      prevIndex = Math.floor(Math.random() * tracks.length);
    } else {
      prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
    }
    
  setCurrentTrackIndex(prevIndex);
  const prevTrack = displayTracks[prevIndex] || tracks[prevIndex];
  setLocalCurrentTrack(prevTrack);
  playTrack(prevTrack, displayTracks || tracks);
  };

  const handleSeek = (event, newValue) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newValue;
      setCurrentTime(newValue);
    }
  };

  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
    if (audioRef.current) {
      audioRef.current.volume = newValue / 100;
    }
  };

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => (prev + 1) % 3);
  };

  const handleTrackSelect = (track, index) => {
    setLocalCurrentTrack(track);
    setCurrentTrackIndex(index);
    playTrack(track, displayTracks || tracks);
    setShowQueue(false);
  };

  const handleAddTrackToRoom = async (track) => {
    try {
      await onAddTrack(track);
    } catch (error) {
      console.error('Failed to add track:', error);
    }
  };

  const handleRemoveTrack = async (track) => {
    try {
      await onRemoveTrack(track);
      
      // If removing current track, switch to next
      if (currentTrack?.id === track.id) {
        handleNext();
      }
    } catch (error) {
      console.error('Failed to remove track:', error);
    }
  };

  const toggleTrackLove = (trackId) => {
    setTrackLoved(prev => ({
      ...prev,
      [trackId]: !prev[trackId]
    }));
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTrackUrl = (track) => track?.file_url || track?.url || '';

  return (
    <Card sx={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Background Audio Element */}
  {/* Local audio element no longer needed; global PlayerContext manages playback via Howler */}

      {/* Visualizer Background */}
      {isVisualizerActive && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: 0.5,
            opacity: 0.3,
            zIndex: 1
          }}
        >
          {visualizerData.map((value, index) => (
            <Box
              key={index}
              sx={{
                width: '4px',
                height: `${Math.max(4, (value / 255) * 100)}%`,
                background: `linear-gradient(to top, 
                  ${energy > 80 ? '#FF6B6B' : energy > 50 ? '#4ECDC4' : '#667eea'}, 
                  ${energy > 80 ? '#FF8E53' : energy > 50 ? '#44A08D' : '#764ba2'})`,
                borderRadius: '2px',
                transition: 'height 0.1s ease',
                animation: beatDetected ? 'beat 0.1s ease' : 'none'
              }}
            />
          ))}
        </Box>
      )}

      <CardContent sx={{ p: 0, position: 'relative', zIndex: 2 }}>
        {/* Main Player */}
        <Box sx={{ p: 4 }}>
          {currentTrack ? (
            <>
              {/* Track Info */}
              <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        mr: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        animation: isPlaying ? 'spin 10s linear infinite' : 'none'
                      }}
                    >
                      <Album sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                        {currentTrack.title}
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
                        {currentTrack.artist || 'Unknown Artist'}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip 
                          label={`Track ${currentTrackIndex + 1} of ${tracks.length}`}
                          size="small"
                          sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                        />
                        <Chip 
                          label={formatTime(currentTrack.duration)}
                          size="small"
                          sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                        />
                        <Chip 
                          label={formatPlays(currentTrack.play_count ?? 0)}
                          size="small"
                          sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                        />
                      </Stack>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="h4" sx={{ color: 'white', mr: 2 }}>
                      {Math.round(energy)}%
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Energy
                      </Typography>
                      <Box sx={{ 
                        width: 60, 
                        height: 8, 
                        background: 'rgba(255,255,255,0.2)', 
                        borderRadius: 4,
                        overflow: 'hidden',
                        mt: 0.5
                      }}>
                        <Box
                          sx={{
                            width: `${energy}%`,
                            height: '100%',
                            background: energy > 80 ? 'linear-gradient(45deg, #FF6B6B, #FF8E53)' : 
                                       energy > 50 ? 'linear-gradient(45deg, #4ECDC4, #44A08D)' :
                                       'linear-gradient(45deg, #667eea, #764ba2)',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              {/* Progress Bar */}
              <Box sx={{ mb: 3 }}>
                <Slider
                  value={currentTime}
                  max={duration || 100}
                  onChange={handleSeek}
                  sx={{
                    color: 'white',
                    height: 8,
                    '& .MuiSlider-track': {
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      border: 'none',
                      height: 8
                    },
                    '& .MuiSlider-rail': {
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      height: 8
                    },
                    '& .MuiSlider-thumb': {
                      backgroundColor: 'white',
                      width: 20,
                      height: 20,
                      '&:hover': {
                        boxShadow: '0 0 0 8px rgba(255,255,255,0.16)'
                      }
                    }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    {formatTime(currentTime)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    {formatTime(duration)}
                  </Typography>
                </Box>
              </Box>

              {/* Controls */}
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Tooltip title="Shuffle">
                    <IconButton 
                      onClick={toggleShuffle}
                      sx={{ 
                        color: isShuffled ? '#4ECDC4' : 'rgba(255,255,255,0.7)',
                        background: isShuffled ? 'rgba(78, 205, 196, 0.2)' : 'transparent'
                      }}
                    >
                      <Shuffle />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Previous">
                    <IconButton 
                      onClick={handlePrevious}
                      sx={{ color: 'white', fontSize: '2rem' }}
                    >
                      <SkipPrevious sx={{ fontSize: '2rem' }} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={isPlaying ? "Pause" : "Play"}>
                    <Fab
                      onClick={handlePlayPause}
                      sx={{
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        color: 'white',
                        width: 80,
                        height: 80,
                        fontSize: '2rem',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          background: 'linear-gradient(45deg, #764ba2, #667eea)'
                        }
                      }}
                    >
                      {isPlaying ? <Pause sx={{ fontSize: '2rem' }} /> : <PlayArrow sx={{ fontSize: '2rem' }} />}
                    </Fab>
                  </Tooltip>

                  <Tooltip title="Next">
                    <IconButton 
                      onClick={handleNext}
                      sx={{ color: 'white', fontSize: '2rem' }}
                    >
                      <SkipNext sx={{ fontSize: '2rem' }} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={`Repeat ${repeatMode === 0 ? 'Off' : repeatMode === 1 ? 'All' : 'One'}`}>
                    <IconButton 
                      onClick={toggleRepeat}
                      sx={{ 
                        color: repeatMode > 0 ? '#4ECDC4' : 'rgba(255,255,255,0.7)',
                        background: repeatMode > 0 ? 'rgba(78, 205, 196, 0.2)' : 'transparent'
                      }}
                    >
                      {repeatMode === 2 ? <RepeatOne /> : <Repeat />}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              {/* Secondary Controls */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Tooltip title={trackLoved[currentTrack.id] ? "Unlike" : "Like"}>
                    <IconButton 
                      onClick={() => toggleTrackLove(currentTrack.id)}
                      sx={{ color: trackLoved[currentTrack.id] ? '#FF6B6B' : 'rgba(255,255,255,0.7)' }}
                    >
                      {trackLoved[currentTrack.id] ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Toggle Visualizer">
                    <IconButton 
                      onClick={() => setIsVisualizerActive(!isVisualizerActive)}
                      sx={{ color: isVisualizerActive ? '#4ECDC4' : 'rgba(255,255,255,0.7)' }}
                    >
                      <GraphicEq />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 150 }}>
                    <VolumeDown sx={{ color: 'rgba(255,255,255,0.7)', mr: 1 }} />
                    <Slider
                      value={volume}
                      onChange={handleVolumeChange}
                      sx={{
                        color: 'white',
                        '& .MuiSlider-track': {
                          background: 'linear-gradient(45deg, #4ECDC4, #44A08D)'
                        },
                        '& .MuiSlider-rail': {
                          backgroundColor: 'rgba(255,255,255,0.2)'
                        }
                      }}
                    />
                    <VolumeUp sx={{ color: 'rgba(255,255,255,0.7)', ml: 1 }} />
                  </Box>

                  <Tooltip title="Show Queue">
                    <IconButton 
                      onClick={() => setShowQueue(!showQueue)}
                      sx={{ color: showQueue ? '#4ECDC4' : 'rgba(255,255,255,0.7)' }}
                    >
                      <Badge badgeContent={tracks.length} color="secondary">
                        <QueueMusic />
                      </Badge>
                    </IconButton>
                  </Tooltip>

                  {isHost && (
                    <Tooltip title="Add Tracks">
                      <IconButton 
                        onClick={() => setShowAddTracks(true)}
                        sx={{ color: 'rgba(255,255,255,0.7)' }}
                      >
                        <Add />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Avatar sx={{ 
                width: 120, 
                height: 120, 
                mx: 'auto', 
                mb: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <MusicNote sx={{ fontSize: 60 }} />
              </Avatar>
              <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
                No track selected
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Select a track from the queue to start playing
              </Typography>
            </Box>
          )}
        </Box>

        {/* Queue */}
        <Collapse in={showQueue}>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                Queue ({tracks.length} tracks)
              </Typography>
              <Button
                onClick={() => setShowQueue(false)}
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Hide Queue
              </Button>
            </Box>
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {(displayTracks || tracks).map((track, index) => (
                <ListItem
                  key={track.id}
                  button
                  onClick={() => handleTrackSelect(track, index)}
                  sx={{
                    borderRadius: '12px',
                    mb: 1,
                    background: currentTrack?.id === track.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.05)'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      background: currentTrack?.id === track.id ? 
                        'linear-gradient(45deg, #4ECDC4, #44A08D)' : 
                        'linear-gradient(45deg, #667eea, #764ba2)'
                    }}>
                      {currentTrack?.id === track.id && isPlaying ? <GraphicEq /> : <MusicNote />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
                        {track.title}
                      </Typography>
                    }
                    secondary={
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        {track.artist || 'Unknown Artist'} • {formatTime(track.duration)}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip 
                        label={formatPlays(track.play_count ?? 0)}
                        size="small"
                        sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                      />
                      {isHost && (
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTrack(track);
                          }}
                          sx={{ color: 'rgba(255,255,255,0.7)' }}
                        >
                          <DeleteOutline />
                        </IconButton>
                      )}
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        </Collapse>
      </CardContent>

      {/* Add Tracks Dialog */}
      <Dialog
        open={showAddTracks}
        onClose={() => setShowAddTracks(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(50, 50, 50, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Add Tracks to Room 🎵
          </Typography>
        </DialogTitle>
        <DialogContent>
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {userTracks.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <MusicNote sx={{ fontSize: 64, color: 'rgba(255,255,255,0.5)', mb: 2 }} />
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
                  No tracks available
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Upload some tracks to add them to this room
                </Typography>
              </Box>
            ) : (
              userTracks.filter(track => !tracks.find(t => t.id === track.id)).map((track) => (
                <ListItem
                  key={track.id}
                  sx={{
                    borderRadius: '12px',
                    mb: 1,
                    background: 'rgba(255,255,255,0.05)',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ background: 'linear-gradient(45deg, #667eea, #764ba2)' }}>
                      <MusicNote />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
                        {track.title}
                      </Typography>
                    }
                    secondary={
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        {track.artist || 'Unknown Artist'} • {formatTime(track.duration)}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => handleAddTrackToRoom(track)}
                      sx={{
                        background: 'linear-gradient(45deg, #4ECDC4, #44A08D)',
                        borderRadius: '20px',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #44A08D, #4ECDC4)'
                        }
                      }}
                    >
                      Add
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )}
          </List>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ModernAudioPlayer;

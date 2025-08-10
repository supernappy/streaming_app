import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Slider,
  LinearProgress,
  Avatar,
  Chip,
  Tooltip,
  Fade,
  Zoom
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
  FavoriteBorder,
  Favorite,
  QueueMusic,
  Equalizer
} from '@mui/icons-material';
import { usePlayer } from '../contexts/PlayerContext';

const Player = () => {
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    togglePlayPause,
    seek,
    changeVolume,
    playNext,
    playPrevious
  } = usePlayer();

  // Enhanced state for more alive features
  const [isFavorite, setIsFavorite] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off', 'all', 'one'
  const [shuffleMode, setShuffleMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [visualBars, setVisualBars] = useState(Array(20).fill(0));

  // Animate visualizer bars when playing
  useEffect(() => {
    let animationId;
    if (isPlaying) {
      const animateVisualizer = () => {
        setVisualBars(prev => 
          prev.map(() => Math.random() * 100)
        );
        animationId = requestAnimationFrame(animateVisualizer);
      };
      animateVisualizer();
    } else {
      setVisualBars(Array(20).fill(0));
    }
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  if (!currentTrack) {
    return null;
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (event, newValue) => {
    seek(newValue);
  };

  const handleVolumeChange = (event, newValue) => {
    changeVolume(newValue / 100);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const cycleRepeatMode = () => {
    const modes = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  const toggleShuffle = () => {
    setShuffleMode(!shuffleMode);
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeOff />;
    if (volume < 0.5) return <VolumeDown />;
    return <VolumeUp />;
  };

  const getRepeatIcon = () => {
    if (repeatMode === 'one') return <RepeatOne />;
    return <Repeat />;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Fade in={true}>
      <Paper
        elevation={isExpanded ? 16 : 8}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          background: isPlaying 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #232526 0%, #414345 100%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          p: 2,
          transition: 'all 0.3s ease-in-out',
          backdropFilter: 'blur(10px)',
          boxShadow: isPlaying 
            ? '0 0 30px rgba(102, 126, 234, 0.3)'
            : '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Animated Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiLinearProgress-bar': {
              background: isPlaying 
                ? 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4)'
                : '#1DB954',
              transition: 'all 0.3s ease'
            }
          }}
        />

        {/* Audio Visualizer */}
        <Box
          sx={{
            position: 'absolute',
            top: 6,
            left: 0,
            right: 0,
            height: 3,
            display: 'flex',
            alignItems: 'end',
            justifyContent: 'center',
            gap: 0.5,
            opacity: isPlaying ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        >
          {visualBars.map((height, index) => (
            <Box
              key={index}
              sx={{
                width: 2,
                height: `${height * 0.03}px`,
                backgroundColor: '#fff',
                borderRadius: 1,
                transition: 'height 0.1s ease',
                opacity: 0.7
              }}
            />
          ))}
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 1
          }}
        >
          {/* Enhanced Track Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Zoom in={isPlaying}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  mr: 2,
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: isPlaying ? '0 0 20px rgba(255, 255, 255, 0.3)' : 'none',
                  transition: 'all 0.3s ease',
                  background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)'
                }}
                src={currentTrack.cover_url}
              >
                <Equalizer />
              </Avatar>
            </Zoom>
            <Box sx={{ mr: 2 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                {currentTrack.title}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  mb: 0.5
                }}
              >
                {currentTrack.artist}
              </Typography>
              {currentTrack.genre && (
                <Chip
                  label={currentTrack.genre}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '0.7rem'
                  }}
                />
              )}
            </Box>
          </Box>

          {/* Enhanced Player Controls */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              gap: 1
            }}
          >
            {/* Secondary Controls */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={shuffleMode ? "Shuffle On" : "Shuffle Off"}>
                <span>
                  <IconButton 
                    onClick={toggleShuffle}
                    sx={{ 
                      color: shuffleMode ? '#1DB954' : 'rgba(255, 255, 255, 0.7)',
                      transition: 'all 0.2s ease'
                    }}
                    size="small"
                  >
                    <Shuffle fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              
              <Tooltip title="Add to Favorites">
                <span>
                  <IconButton 
                    onClick={toggleFavorite}
                    sx={{ 
                      color: isFavorite ? '#ff6b6b' : 'rgba(255, 255, 255, 0.7)',
                      transition: 'all 0.2s ease'
                    }}
                    size="small"
                  >
                    {isFavorite ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title={`Repeat: ${repeatMode}`}>
                <span>
                  <IconButton 
                    onClick={cycleRepeatMode}
                    sx={{ 
                      color: repeatMode !== 'off' ? '#1DB954' : 'rgba(255, 255, 255, 0.7)',
                      transition: 'all 0.2s ease'
                    }}
                    size="small"
                  >
                    {getRepeatIcon()}
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Queue">
                <span>
                  <IconButton 
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    size="small"
                  >
                    <QueueMusic fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>

            {/* Main Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Previous">
                <span>
                  <IconButton 
                    onClick={playPrevious} 
                    sx={{ 
                      color: 'white',
                      '&:hover': { 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <SkipPrevious />
                  </IconButton>
                </span>
              </Tooltip>
              
              <Zoom in={true}>
                <IconButton
                  onClick={togglePlayPause}
                  sx={{
                    backgroundColor: isPlaying ? '#ff6b6b' : '#1DB954',
                    color: 'white',
                    width: 56,
                    height: 56,
                    '&:hover': {
                      backgroundColor: isPlaying ? '#ff5252' : '#1ed760',
                      transform: 'scale(1.05)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                    },
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }}
                >
                  {isPlaying ? <Pause sx={{ fontSize: 28 }} /> : <PlayArrow sx={{ fontSize: 28 }} />}
                </IconButton>
              </Zoom>
              
              <Tooltip title="Next">
                <span>
                  <IconButton 
                    onClick={playNext} 
                    sx={{ 
                      color: 'white',
                      '&:hover': { 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <SkipNext />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>

            {/* Time Display and Seek */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', maxWidth: 400 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)', minWidth: 35 }}>
                {formatTime(currentTime)}
              </Typography>
              <Slider
                size="small"
                value={currentTime}
                max={duration}
                onChange={handleSeek}
                sx={{
                  flex: 1,
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                    backgroundColor: '#fff',
                    border: '2px solid currentColor',
                    '&:hover': {
                      boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.16)'
                    }
                  },
                  '& .MuiSlider-track': {
                    background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4)',
                    border: 'none'
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)'
                  }
                }}
              />
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)', minWidth: 35 }}>
                {formatTime(duration)}
              </Typography>
            </Box>
          </Box>

          {/* Enhanced Volume Control */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flex: 1,
              justifyContent: 'flex-end'
            }}
          >
            <Tooltip title={`Volume: ${Math.round(volume * 100)}%`}>
              <IconButton 
                onClick={() => changeVolume(volume > 0 ? 0 : 0.8)}
                sx={{ 
                  color: 'white',
                  '&:hover': { 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                {getVolumeIcon()}
              </IconButton>
            </Tooltip>
            <Slider
              size="small"
              value={volume * 100}
              onChange={handleVolumeChange}
              sx={{
                width: 100,
                '& .MuiSlider-thumb': {
                  width: 12,
                  height: 12,
                  backgroundColor: '#fff'
                },
                '& .MuiSlider-track': {
                  backgroundColor: '#1DB954'
                },
                '& .MuiSlider-rail': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)'
                }
              }}
            />
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
};

export default Player;

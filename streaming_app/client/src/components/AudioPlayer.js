import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Slider,
  LinearProgress,
  Avatar,
  Chip,
  Tooltip,
  Fade,
  Zoom,
  ButtonGroup,
  Button
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
  Equalizer,
  FullscreenExit,
  Fullscreen,
  Share,
  Download
} from '@mui/icons-material';
import { usePlayer } from '../contexts/PlayerContext';
import { formatPlays } from '../utils/format';

const AudioPlayer = ({ track, onPlay, compact = false, showIndex = null }) => {
  const {
    currentTrack,
    isPlaying,
    playTrack
  } = usePlayer();

  const [isHovered, setIsHovered] = useState(false);
  const [audioWaves, setAudioWaves] = useState(Array(40).fill(0));
  const [ripples, setRipples] = useState([]);
  const waveIntervalRef = useRef();

  const isCurrentTrack = currentTrack && currentTrack.id === track.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;

  // Generate audio wave animation
  useEffect(() => {
    if (isTrackPlaying) {
      waveIntervalRef.current = setInterval(() => {
        setAudioWaves(prev => 
          prev.map(() => Math.random() * 100)
        );
      }, 150);
    } else {
      clearInterval(waveIntervalRef.current);
      setAudioWaves(Array(40).fill(0));
    }

    return () => clearInterval(waveIntervalRef.current);
  }, [isTrackPlaying]);

  const handlePlay = () => {
    if (isCurrentTrack) {
      // Track is already current, just toggle play/pause
      return;
    }
    
    // Add ripple effect
    const newRipple = {
      id: Date.now(),
      x: Math.random() * 100,
      y: Math.random() * 100
    };
    setRipples(prev => [...prev, newRipple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 1000);

    playTrack(track);
    if (onPlay) onPlay(track);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <Card
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: isTrackPlaying 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handlePlay}
      >
        {/* Animated background waves */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'end',
            justifyContent: 'space-around',
            padding: 1,
            opacity: isTrackPlaying ? 0.3 : 0,
            transition: 'opacity 0.3s ease'
          }}
        >
          {audioWaves.map((height, index) => (
            <Box
              key={index}
              sx={{
                width: 2,
                height: `${height * 0.5}%`,
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                borderRadius: 1,
                transition: 'height 0.2s ease'
              }}
            />
          ))}
        </Box>

        {/* Ripple effects */}
        {ripples.map(ripple => (
          <Box
            key={ripple.id}
            sx={{
              position: 'absolute',
              left: `${ripple.x}%`,
              top: `${ripple.y}%`,
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              animation: 'ripple 1s ease-out forwards',
              transform: 'translate(-50%, -50%)',
              '@keyframes ripple': {
                '0%': {
                  width: 0,
                  height: 0,
                  opacity: 1
                },
                '100%': {
                  width: 60,
                  height: 60,
                  opacity: 0
                }
              }
            }}
          />
        ))}

        <CardContent sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {showIndex && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#ccc', 
                  minWidth: 24, 
                  textAlign: 'center',
                  fontWeight: 500
                }}
              >
                {showIndex}
              </Typography>
            )}
            <Zoom in={isHovered || isTrackPlaying}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: isTrackPlaying ? '#ff6b6b' : '#1DB954',
                  transition: 'all 0.3s ease'
                }}
                src={track.cover_url}
              >
                {isTrackPlaying ? <Equalizer /> : <PlayArrow />}
              </Avatar>
            </Zoom>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600,
                  color: isTrackPlaying ? 'white' : '#fff',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {track.title}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: isTrackPlaying ? 'rgba(255,255,255,0.8)' : '#ccc',
                  display: 'block'
                }}
              >
                {track.artist}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 35 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: isTrackPlaying ? 'rgba(255,255,255,0.8)' : '#ccc'
                }}
              >
                {formatDuration(track.duration)}
              </Typography>
              <Chip 
                label={formatPlays(typeof track.play_count === 'number' ? track.play_count : 0)}
                size="small"
                sx={{ 
                  height: 20,
                  color: isTrackPlaying ? 'white' : '#ccc',
                  borderColor: isTrackPlaying ? 'rgba(255,255,255,0.4)' : '#555'
                }}
                variant="outlined"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Full player view
  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        background: isTrackPlaying 
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 35px rgba(0,0,0,0.15)'
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Animation */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'end',
          justifyContent: 'space-around',
          padding: 2,
          opacity: isTrackPlaying ? 0.2 : 0,
          transition: 'opacity 0.3s ease'
        }}
      >
        {audioWaves.map((height, index) => (
          <Box
            key={index}
            sx={{
              width: 3,
              height: `${height * 0.8}%`,
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              borderRadius: 1,
              transition: 'height 0.2s ease'
            }}
          />
        ))}
      </Box>

      <CardContent sx={{ position: 'relative', zIndex: 2 }}>
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Album Art */}
          <Box sx={{ position: 'relative' }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                borderRadius: 2,
                boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                border: isTrackPlaying ? '3px solid rgba(255,255,255,0.5)' : 'none',
                transition: 'all 0.3s ease'
              }}
              src={track.cover_url}
            >
              <Equalizer sx={{ fontSize: 40 }} />
            </Avatar>
            
            {/* Play Button Overlay */}
            <Fade in={isHovered && !isTrackPlaying}>
              <IconButton
                onClick={handlePlay}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  width: 60,
                  height: 60,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,1)',
                    transform: 'translate(-50%, -50%) scale(1.1)'
                  }
                }}
              >
                <PlayArrow sx={{ fontSize: 30 }} />
              </IconButton>
            </Fade>
          </Box>

          {/* Track Info & Controls */}
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600,
                color: isTrackPlaying ? 'white' : 'text.primary',
                mb: 1
              }}
            >
              {track.title}
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                color: isTrackPlaying ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                mb: 2
              }}
            >
              {track.artist}
            </Typography>

            {track.album && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: isTrackPlaying ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                  mb: 1
                }}
              >
                Album: {track.album}
              </Typography>
            )}

            {track.genre && (
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={track.genre}
                  size="small"
                  sx={{
                    backgroundColor: isTrackPlaying ? 'rgba(255,255,255,0.2)' : 'primary.main',
                    color: isTrackPlaying ? 'white' : 'white'
                  }}
                />
              </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant={isTrackPlaying ? "outlined" : "contained"}
                startIcon={isTrackPlaying ? <Pause /> : <PlayArrow />}
                onClick={handlePlay}
                sx={{
                  color: isTrackPlaying ? 'white' : 'white',
                  borderColor: isTrackPlaying ? 'rgba(255,255,255,0.5)' : 'transparent',
                  backgroundColor: isTrackPlaying ? 'transparent' : '#1DB954',
                  '&:hover': {
                    backgroundColor: isTrackPlaying ? 'rgba(255,255,255,0.1)' : '#1ed760'
                  }
                }}
              >
                {isTrackPlaying ? 'Playing' : 'Play'}
              </Button>

              <Tooltip title="Add to Favorites">
                <IconButton sx={{ color: isTrackPlaying ? 'white' : 'text.secondary' }}>
                  <FavoriteBorder />
                </IconButton>
              </Tooltip>

              <Tooltip title="Add to Queue">
                <IconButton sx={{ color: isTrackPlaying ? 'white' : 'text.secondary' }}>
                  <QueueMusic />
                </IconButton>
              </Tooltip>

              <Tooltip title="Share">
                <IconButton sx={{ color: isTrackPlaying ? 'white' : 'text.secondary' }}>
                  <Share />
                </IconButton>
              </Tooltip>

              <Tooltip title="Download">
                <IconButton sx={{ color: isTrackPlaying ? 'white' : 'text.secondary' }}>
                  <Download />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Track Stats */}
          <Box sx={{ textAlign: 'right', minWidth: 100 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: isTrackPlaying ? 'white' : 'text.primary',
                fontWeight: 600
              }}
            >
              {formatDuration(track.duration)}
            </Typography>
            
            <Typography 
              variant="caption" 
              sx={{ 
                color: isTrackPlaying ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                display: 'block'
              }}
            >
              {formatPlays(typeof track.play_count === 'number' ? track.play_count : 0)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AudioPlayer;

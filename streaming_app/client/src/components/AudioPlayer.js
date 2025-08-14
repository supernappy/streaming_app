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
  Download,
  Close
} from '@mui/icons-material';
import { usePlayer } from '../contexts/PlayerContext';
import { formatPlays } from '../utils/format';

const AudioPlayer = ({ track, onPlay, compact = false, showIndex = null }) => {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
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
        setAudioWaves(prev => prev.map(() => Math.random() * 100));
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
          background: isTrackPlaying ? '#667eea' : '#2a2a2a',
          color: 'white',
          minWidth: 200,
          maxWidth: 400,
          margin: '16px auto',
          padding: 2,
          borderRadius: 3,
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
        }}
      >
        <IconButton
          onClick={e => { e.stopPropagation(); setVisible(false); }}
          sx={{ position: 'absolute', top: 8, right: 8, color: 'white', zIndex: 2 }}
          aria-label="Close player"
        >
          <Close />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={track.cover_url} sx={{ width: 56, height: 56, mr: 2 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>{track.title}</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{track.artist}</Typography>
          </Box>
        </Box>
      </Card>
    );
  }

  // Main (non-compact) render
  return (
    <Card sx={{
      borderRadius: 3,
      boxShadow: isTrackPlaying ? '0 0 30px rgba(102, 126, 234, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.3)',
      background: isTrackPlaying
        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        : 'linear-gradient(135deg, #232526 0%, #414345 100%)',
      color: isTrackPlaying ? 'white' : 'inherit',
      position: 'relative',
      overflow: 'visible',
      p: 0,
      mb: 2,
      transition: 'all 0.3s ease-in-out',
      minWidth: 320,
      maxWidth: 600,
      mx: 'auto',
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* ...existing code... */}
        </Box>
      </CardContent>
    </Card>
  );
}

export default AudioPlayer;

import React, { useState, useEffect } from 'react';
import {
  Fab,
  Box,
  Paper,
  Typography,
  IconButton,
  Slide,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  VolumeUp,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import { usePlayer } from '../contexts/PlayerContext';

const FloatingPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    playNext,
    playPrevious,
    volume
  } = usePlayer();

  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      // Show floating player when scrolled down and player is at bottom
      setIsVisible(currentScrollY > 200 && currentTrack);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentTrack]);

  if (!currentTrack) {
    return null;
  }

  return (
    <Slide direction="up" in={isVisible} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1400,
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          width: isExpanded ? 320 : 200,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}
      >
        {/* Header */}
        <Box 
          sx={{ 
            p: 1.5, 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer' 
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              mr: 1.5,
              border: '2px solid rgba(255,255,255,0.3)'
            }}
            src={currentTrack.cover_url}
          />
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: 'white',
                fontWeight: 600,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              {currentTrack.title}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255,255,255,0.8)',
                display: 'block',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              {currentTrack.artist}
            </Typography>
          </Box>
          
          <IconButton 
            size="small" 
            sx={{ color: 'rgba(255,255,255,0.8)' }}
          >
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        {/* Expanded Controls */}
        {isExpanded && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
              <Tooltip title="Previous">
                <IconButton 
                  onClick={playPrevious}
                  sx={{ 
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <SkipPrevious />
                </IconButton>
              </Tooltip>
              
              <Tooltip title={isPlaying ? "Pause" : "Play"}>
                <IconButton
                  onClick={togglePlayPause}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Next">
                <IconButton 
                  onClick={playNext}
                  sx={{ 
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <SkipNext />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Volume Indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VolumeUp sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }} />
              <Box
                sx={{
                  flex: 1,
                  height: 4,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    width: `${volume * 100}%`,
                    height: '100%',
                    backgroundColor: 'white',
                    transition: 'width 0.2s ease'
                  }}
                />
              </Box>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255,255,255,0.7)',
                  minWidth: 30
                }}
              >
                {Math.round(volume * 100)}%
              </Typography>
            </Box>
          </Box>
        )}

        {/* Quick Play FAB when collapsed */}
        {!isExpanded && (
          <Fab
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            sx={{
              position: 'absolute',
              bottom: -20,
              right: -20,
              backgroundColor: '#ff6b6b',
              color: 'white',
              '&:hover': {
                backgroundColor: '#ff5252',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </Fab>
        )}
      </Paper>
    </Slide>
  );
};

export default FloatingPlayer;

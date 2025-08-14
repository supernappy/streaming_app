import React, { useState, useRef } from 'react';
  // Media refs for audio/video
  const audioRef = useRef(null);
  const videoRef = useRef(null);

  // Utility: is current track an MP4?
  const isCurrentTrackMp4 = currentTrack && (currentTrack.file_url || currentTrack.url || '').toLowerCase().endsWith('.mp4');
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Slider,
  Avatar,
  Chip,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  Button
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  VolumeUp,
  QueueMusic,
  Add,
  Shuffle,
  Repeat
} from '@mui/icons-material';
import { formatPlays } from '../utils/format';

const ModernAudioPlayerSimple = ({ 
  tracks = [], 
  room, 
  onTrackChange, 
  onPlayStateChange, 
  onVolumeChange,
  onEnergyChange,
  userTracks = [],
  onAddTrack,
  participants = []
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(tracks[0] || null);
  const [volume, setVolume] = useState(70);
  const [progress, setProgress] = useState(30);

  const getMediaRef = () => (isCurrentTrackMp4 ? videoRef : audioRef);

  const handlePlayPause = () => {
    const media = getMediaRef().current;
    if (media) {
      if (isPlaying) {
        media.pause();
      } else {
        media.play();
      }
    }
    setIsPlaying(!isPlaying);
    if (onPlayStateChange) onPlayStateChange(!isPlaying);
  };

  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
    const media = getMediaRef().current;
    if (media) {
      media.volume = newValue / 100;
    }
    if (onVolumeChange) onVolumeChange(newValue);
  };

  return (
    <Card sx={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: 'white'
    }}>
      <CardContent sx={{ p: 4 }}>
        <Grid container spacing={3}>
          {/* Now Playing Section */}
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                🎵 Now Playing
              </Typography>
              
              {currentTrack ? (
                <Box>
                  {/* Media element: audio or video */}
                  {isCurrentTrackMp4 ? (
                    <video
                      ref={videoRef}
                      src={currentTrack.file_url || currentTrack.url}
                      poster={currentTrack.cover_url}
                      style={{ width: 180, maxHeight: 120, margin: '0 auto 16px', display: 'block', background: '#000' }}
                      controls
                      crossOrigin="anonymous"
                      onEnded={() => setIsPlaying(false)}
                    />
                  ) : (
                    <audio
                      ref={audioRef}
                      src={currentTrack.file_url || currentTrack.url}
                      crossOrigin="anonymous"
                      onEnded={() => setIsPlaying(false)}
                      style={{ display: 'none' }}
                    />
                  )}
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      mx: 'auto',
                      mb: 2,
                      background: 'linear-gradient(45deg, #4ECDC4, #44A08D)',
                      fontSize: '3rem',
                      position: 'relative',
                      zIndex: 1
                    }}
                    src={!isCurrentTrackMp4 ? currentTrack.cover_url : undefined}
                  >
                    🎵
                  </Avatar>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {currentTrack.title || 'Unknown Track'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                    {currentTrack.artist || 'Unknown Artist'}
                  </Typography>
                  {typeof currentTrack.play_count !== 'undefined' && (
                    <Chip 
                      size="small"
                      label={formatPlays(currentTrack.play_count)}
                      sx={{ 
                        mb: 2,
                        background: 'rgba(255,255,255,0.15)', 
                        color: 'white' 
                      }} 
                    />
                  )}
                </Box>
              ) : (
                <Box sx={{ py: 4 }}>
                  <Typography variant="body1" sx={{ opacity: 0.7 }}>
                    No track selected
                  </Typography>
                </Box>
              )}

              {/* Progress Bar */}
              <Box sx={{ mb: 3 }}>
                <Slider
                  value={progress}
                  onChange={(e, val) => setProgress(val)}
                  sx={{
                    color: '#4ECDC4',
                    '& .MuiSlider-thumb': {
                      backgroundColor: '#4ECDC4',
                    }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption">1:23</Typography>
                  <Typography variant="caption">3:45</Typography>
                </Box>
              </Box>

              {/* Controls */}
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton sx={{ color: 'white' }}>
                  <Shuffle />
                </IconButton>
                <IconButton sx={{ color: 'white' }}>
                  <SkipPrevious />
                </IconButton>
                <IconButton
                  onClick={handlePlayPause}
                  sx={{
                    background: 'linear-gradient(45deg, #4ECDC4, #44A08D)',
                    color: 'white',
                    width: 64,
                    height: 64,
                    '&:hover': {
                      background: 'linear-gradient(45deg, #44A08D, #4ECDC4)',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  {isPlaying ? <Pause sx={{ fontSize: 32 }} /> : <PlayArrow sx={{ fontSize: 32 }} />}
                </IconButton>
                <IconButton sx={{ color: 'white' }}>
                  <SkipNext />
                </IconButton>
                <IconButton sx={{ color: 'white' }}>
                  <Repeat />
                </IconButton>
              </Box>

              {/* Volume Control */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <VolumeUp sx={{ color: 'white' }} />
                <Slider
                  value={volume}
                  onChange={handleVolumeChange}
                  sx={{
                    color: '#4ECDC4',
                    '& .MuiSlider-thumb': {
                      backgroundColor: '#4ECDC4',
                    }
                  }}
                />
              </Box>
            </Box>
          </Grid>

          {/* Queue Section */}
          <Grid item xs={12} md={6}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  🎶 Track Queue
                </Typography>
                <Chip
                  icon={<QueueMusic />}
                  label={`${tracks.length} tracks`}
                  sx={{
                    background: 'rgba(78, 205, 196, 0.2)',
                    color: 'white'
                  }}
                />
              </Box>

              <Paper sx={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                maxHeight: 300,
                overflow: 'auto'
              }}>
                <List>
                  {tracks.length > 0 ? tracks.map((track, index) => (
                    <ListItem
                      key={track.id || index}
                      sx={{
                        borderRadius: '12px',
                        mb: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.1)'
                        }
                      }}
                      onClick={() => {
                        setCurrentTrack(track);
                        if (onTrackChange) onTrackChange(track);
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography sx={{ color: 'white', fontWeight: currentTrack?.id === track.id ? 'bold' : 'normal' }}>
                            {track.title || `Track ${index + 1}`}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                              {track.artist || 'Unknown Artist'}
                            </Typography>
              {typeof track.play_count !== 'undefined' && (
                              <Chip 
                                size="small"
                label={formatPlays(track.play_count)}
                                sx={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  )) : (
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                            No tracks in queue
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>

              {/* Add Track Button */}
              <Button
                fullWidth
                startIcon={<Add />}
                sx={{
                  mt: 2,
                  background: 'rgba(78, 205, 196, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(78, 205, 196, 0.3)',
                  borderRadius: '12px',
                  '&:hover': {
                    background: 'rgba(78, 205, 196, 0.3)'
                  }
                }}
              >
                Add Track to Queue
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ModernAudioPlayerSimple;

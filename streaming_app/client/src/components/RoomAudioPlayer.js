import React, { useState, useEffect, useRef } from 'react';
import { useSnackbar } from 'notistack';
import { formatPlays } from '../utils/format';
import { usePlayer } from '../contexts/PlayerContext';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Slider,
  List,
  ListItem,
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

const RoomAudioPlayer = ({ room, isHost, onAddTrack, tracks = [] }) => {
  const { enqueueSnackbar } = useSnackbar();
  // Remove showPlayer state; always show player if a track is playing
  const [volume, setVolume] = useState(0.7);
  const [localCurrentTrack, setLocalCurrentTrack] = useState(null);
  const [displayTracks, setDisplayTracks] = useState(tracks);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackArtist, setNewTrackArtist] = useState('');
  const [newTrackUrl, setNewTrackUrl] = useState('');

  const audioRef = useRef(null);

  useEffect(() => {
    setDisplayTracks(tracks);
    // If a track is playing globally, sync localCurrentTrack
    if (currentTrack && currentTrack.id) {
      setLocalCurrentTrack(currentTrack);
    } else if (tracks.length > 0 && !localCurrentTrack) {
      setLocalCurrentTrack(tracks[0]);
    }
  }, [tracks, localCurrentTrack]);

  // Merge updated play_count from global currentTrack into local list
  useEffect(() => {
    if (currentTrack?.id && typeof currentTrack.play_count !== 'undefined') {
      setDisplayTracks(prev => (prev || []).map(t => t.id === currentTrack.id ? { ...t, play_count: currentTrack.play_count } : t));
      if (localCurrentTrack?.id === currentTrack.id) {
        setLocalCurrentTrack(prev => prev ? { ...prev, play_count: currentTrack.play_count } : prev);
      }
    }
  }, [currentTrack, localCurrentTrack?.id]);

  // Local HTML5 element removed; global player handles timing.

  const handlePlayPause = () => {
    if (!currentTrack && localCurrentTrack) {
      playTrack(localCurrentTrack, tracks);
      return;
    }
    togglePlayPause();
  };

  const handleNext = () => {
    if (localCurrentTrack && tracks.length > 1) {
      const currentIndex = tracks.findIndex(t => t.id === localCurrentTrack.id);
      const nextIndex = (currentIndex + 1) % tracks.length;
      const nextTrack = tracks[nextIndex];
      setLocalCurrentTrack(nextTrack);
      playTrack(nextTrack, tracks);
    }
  };

  const handlePrevious = () => {
    if (localCurrentTrack && tracks.length > 1) {
      const currentIndex = tracks.findIndex(t => t.id === localCurrentTrack.id);
      const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
      const prevTrack = tracks[prevIndex];
      setLocalCurrentTrack(prevTrack);
      playTrack(prevTrack, tracks);
    }
  };

  const handleSeek = (event, newValue) => {
    seek(newValue);
  };

  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
    changeVolume(newValue);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddTrack = async () => {
    if (newTrackTitle.trim() && newTrackArtist.trim() && newTrackUrl.trim()) {
      const trackData = {
        title: newTrackTitle.trim(),
        artist: newTrackArtist.trim(),
        url: newTrackUrl.trim()
      };
      try {
        if (onAddTrack) {
          await onAddTrack(trackData);
        }
        enqueueSnackbar('Track added to queue!', { variant: 'success', autoHideDuration: 2000 });
        // Reset form
        setNewTrackTitle('');
        setNewTrackArtist('');
        setNewTrackUrl('');
        setShowAddDialog(false);
      } catch (err) {
        enqueueSnackbar('Failed to add track.', { variant: 'error', autoHideDuration: 2000 });
      }
    } else {
      enqueueSnackbar('Please fill in all fields.', { variant: 'warning', autoHideDuration: 2000 });
    }
  };

  if (!localCurrentTrack && tracks.length === 0) {
      return (
        <Paper elevation={6} sx={{
          p: 3,
          mb: 3,
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(18px) saturate(180%)',
          borderRadius: 4,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
          border: '1px solid rgba(255,255,255,0.18)',
          position: 'relative',
          overflow: 'visible'
        }}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <MusicNote sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tracks in the queue
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {isHost ? 'Add some tracks to get the party started!' : 'Waiting for the host to add tracks...'}
          </Typography>
          {isHost && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowAddDialog(true)}
            >
              Add Track
            </Button>
          )}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      {/* Audio element */}
  {/* Local audio element removed; global player handles playback */}

      {/* Current Track Info */}
      {localCurrentTrack && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ width: 72, height: 72, mr: 3, bgcolor: 'primary.main', boxShadow: '0 4px 16px 0 rgba(124,77,255,0.15)' }}>
            <MusicNote />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" component="div" sx={{ fontWeight: 700, color: '#232526' }}>
              {localCurrentTrack.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
              {localCurrentTrack.artist}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip 
                label={formatPlays(localCurrentTrack.play_count ?? 0)} 
                size="small" 
                sx={{ background: 'rgba(124,77,255,0.10)', color: '#7c4dff' }}
              />
              <Chip 
                label="Now Playing" 
                color="primary" 
                size="small" 
                sx={{ background: 'linear-gradient(135deg, #7c4dff 0%, #b388ff 100%)', color: 'white' }}
              />
            </Box>
          </Box>
        </Box>
      )}

      {/* Modernized Playback Controls */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        py: 2,
        px: 2,
        borderRadius: 3,
        background: 'rgba(255,255,255,0.25)',
        boxShadow: '0 2px 8px 0 rgba(124,77,255,0.10)',
        mb: 2,
        position: 'sticky',
        top: 0,
        zIndex: 2
      }}>
        <IconButton onClick={handlePrevious} sx={{ fontSize: 32, color: '#7c4dff', background: 'rgba(124,77,255,0.08)', borderRadius: 2, boxShadow: '0 2px 8px 0 rgba(124,77,255,0.10)', '&:hover': { background: 'rgba(124,77,255,0.18)' } }}>
          <SkipPrevious fontSize="large" />
        </IconButton>
        <IconButton onClick={handlePlayPause} sx={{ fontSize: 40, color: 'white', background: 'linear-gradient(135deg, #7c4dff 0%, #b388ff 100%)', borderRadius: 3, boxShadow: '0 4px 16px 0 rgba(124,77,255,0.15)', mx: 2, '&:hover': { background: 'linear-gradient(135deg, #b388ff 0%, #7c4dff 100%)' } }}>
          {isPlaying ? <Pause fontSize="large" /> : <PlayArrow fontSize="large" />}
        </IconButton>
        <IconButton onClick={handleNext} sx={{ fontSize: 32, color: '#7c4dff', background: 'rgba(124,77,255,0.08)', borderRadius: 2, boxShadow: '0 2px 8px 0 rgba(124,77,255,0.10)', '&:hover': { background: 'rgba(124,77,255,0.18)' } }}>
          <SkipNext fontSize="large" />
        </IconButton>
        {/* Volume Slider */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 3 }}>
          <VolumeUp sx={{ color: '#7c4dff', mr: 1 }} />
          <Slider
            value={volume}
            min={0}
            max={1}
            step={0.01}
            onChange={handleVolumeChange}
            sx={{ width: 120, color: '#7c4dff' }}
          />
        </Box>
      </Box>

      {/* Animated Progress Bar */}
      <Box sx={{ width: '100%', mb: 2 }}>
        <Slider
          value={currentTime}
          min={0}
          max={duration || 1}
          step={1}
          onChange={handleSeek}
          sx={{
            color: '#7c4dff',
            height: 8,
            borderRadius: 4,
            boxShadow: '0 2px 8px 0 rgba(124,77,255,0.10)',
            '& .MuiSlider-thumb': {
              width: 18,
              height: 18,
              background: 'linear-gradient(135deg, #7c4dff 0%, #b388ff 100%)',
              boxShadow: '0 2px 8px 0 rgba(124,77,255,0.15)'
            }
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -2, mb: 1 }}>
          <Typography variant="caption" color="text.secondary">{formatTime(currentTime)}</Typography>
          <Typography variant="caption" color="text.secondary">{formatTime(duration)}</Typography>
        </Box>
      </Box>
      {/* Queue/Playlist */}
  {tracks.length > 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Queue ({tracks.length} tracks)
            </Typography>
            {isHost && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Add />}
                onClick={() => setShowAddDialog(true)}
              >
                Add Track
              </Button>
            )}
          </Box>
          
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {(displayTracks || tracks).map((track, index) => (
              <ListItem
                key={track.id}
                button
                onClick={() => {
                  playTrack(track, displayTracks || tracks);
                  // localCurrentTrack will sync via useEffect when global currentTrack updates
                }}
                selected={localCurrentTrack?.id === track.id}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText'
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: localCurrentTrack?.id === track.id ? 'primary.main' : 'grey.300' }}>
                    {localCurrentTrack?.id === track.id ? <QueueMusic /> : index + 1}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={track.title}
                  secondary={track.artist}
                  primaryTypographyProps={{
                    fontWeight: localCurrentTrack?.id === track.id ? 'bold' : 'normal'
                  }}
                />
                <Chip label={formatPlays(track.play_count ?? 0)} size="small" />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Add Track Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Track to Queue</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Track Title"
            fullWidth
            variant="outlined"
            value={newTrackTitle}
            onChange={(e) => setNewTrackTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Artist"
            fullWidth
            variant="outlined"
            value={newTrackArtist}
            onChange={(e) => setNewTrackArtist(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Audio URL"
            fullWidth
            variant="outlined"
            value={newTrackUrl}
            onChange={(e) => setNewTrackUrl(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
            <Button onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddTrack} 
              variant="contained"
              disabled={!newTrackTitle.trim() || !newTrackArtist.trim() || !newTrackUrl.trim()}
            >
              Add Track
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Paper>
  );
}

export default RoomAudioPlayer;

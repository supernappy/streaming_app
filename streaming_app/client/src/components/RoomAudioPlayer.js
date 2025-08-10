import React, { useState, useEffect, useRef } from 'react';
import { formatPlays } from '../utils/format';
import { usePlayer } from '../contexts/PlayerContext';
import { Chip } from '@mui/material';
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

const RoomAudioPlayer = ({ room, isHost, onAddTrack, tracks = [] }) => {
  const { currentTrack, isPlaying, playTrack, togglePlayPause, currentTime, duration, seek, changeVolume } = usePlayer();
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
    if (tracks.length > 0 && !localCurrentTrack) {
      setLocalCurrentTrack(tracks[0]);
      // Don't auto play; wait for user action
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
      
      if (onAddTrack) {
        await onAddTrack(trackData);
      }
      
      // Reset form
      setNewTrackTitle('');
      setNewTrackArtist('');
      setNewTrackUrl('');
      setShowAddDialog(false);
    }
  };

  if (!localCurrentTrack && tracks.length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
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
          <Avatar sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}>
            <MusicNote />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div">
              {localCurrentTrack.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {localCurrentTrack.artist}
            </Typography>
            <Chip 
              label={formatPlays(localCurrentTrack.play_count ?? 0)} 
              size="small" 
              sx={{ mt: 0.5 }}
            />
            <Chip 
              label="Now Playing" 
              color="primary" 
              size="small" 
              sx={{ mt: 0.5 }}
            />
          </Box>
        </Box>
      )}

      {/* Player Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        <IconButton 
          onClick={handlePrevious} 
          disabled={!currentTrack || tracks.length <= 1}
        >
          <SkipPrevious />
        </IconButton>
        
        <Tooltip title={isPlaying ? "Pause" : "Play"}>
          <IconButton 
                onClick={handlePlayPause} 
                disabled={!localCurrentTrack}
            sx={{ mx: 1, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
        </Tooltip>
        
        <IconButton 
          onClick={handleNext} 
          disabled={!currentTrack || tracks.length <= 1}
        >
          <SkipNext />
        </IconButton>
      </Box>

      {/* Progress Bar */}
  {localCurrentTrack && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" sx={{ minWidth: 40 }}>
            {formatTime(currentTime)}
          </Typography>
          <Slider
            size="small"
            value={currentTime}
            max={duration || 100}
            onChange={handleSeek}
            sx={{ mx: 2 }}
          />
          <Typography variant="body2" sx={{ minWidth: 40 }}>
            {formatTime(duration)}
          </Typography>
        </Box>
      )}

      {/* Volume Control */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <VolumeUp sx={{ mr: 1 }} />
        <Slider
          size="small"
          value={volume}
          min={0}
          max={1}
          step={0.1}
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
                onClick={() => { setLocalCurrentTrack(track); playTrack(track, displayTracks || tracks); }}
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
};

export default RoomAudioPlayer;

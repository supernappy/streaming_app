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

const RoomAudioPlayer = ({ room, isHost, onAddTrack, tracks = [] }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableTracks, setAvailableTracks] = useState([]);
  const audioRef = useRef(null);

  useEffect(() => {
    if (tracks.length > 0 && !currentTrack) {
      setCurrentTrack(tracks[0]);
    }
  }, [tracks, currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [currentTrack]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
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

  const handleNext = () => {
    const currentIndex = tracks.findIndex(track => track.id === currentTrack?.id);
    if (currentIndex < tracks.length - 1) {
      setCurrentTrack(tracks[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const currentIndex = tracks.findIndex(track => track.id === currentTrack?.id);
    if (currentIndex > 0) {
      setCurrentTrack(tracks[currentIndex - 1]);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAddTrack = async () => {
    setShowAddTrack(true);
    
    try {
      // Fetch user's tracks from API
      const response = await fetch('/api/tracks/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableTracks(data.tracks || []);
      }
    } catch (error) {
      console.error('Error fetching user tracks:', error);
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSelectTrack = (track) => {
    if (onAddTrack) {
      onAddTrack(track);
    }
    setShowAddTrack(false);
    setSearchQuery('');
  };

  const filteredTracks = availableTracks.filter(track =>
    track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Paper elevation={3} sx={{ p: 3, backgroundColor: '#1a1a1a', color: 'white' }}>
      {/* Current Track Display */}
      {currentTrack ? (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar 
            src={currentTrack.artwork || '/default-album.jpg'} 
            sx={{ width: 64, height: 64, mr: 2 }}
          >
            <MusicNote />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ color: 'white' }}>
              {currentTrack.title || 'Unknown Track'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {currentTrack.artist || 'Unknown Artist'}
            </Typography>
            <Chip 
              label={currentTrack.genre || 'Unknown'} 
              size="small" 
              variant="outlined"
              sx={{ mt: 1 }}
            />
          </Box>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <MusicNote sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No tracks in room playlist
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isHost ? 'Add some tracks to get started!' : 'Wait for the host to add tracks'}
          </Typography>
        </Box>
      )}

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack?.file_path}
        onEnded={handleNext}
      />

      {/* Player Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        <IconButton onClick={handlePrevious} disabled={!currentTrack}>
          <SkipPrevious sx={{ color: 'white' }} />
        </IconButton>
        <IconButton 
          onClick={handlePlayPause} 
          disabled={!currentTrack}
          sx={{ 
            backgroundColor: '#1ed760',
            color: 'white',
            '&:hover': { backgroundColor: '#1ed760' },
            '&:disabled': { backgroundColor: 'rgba(255,255,255,0.1)' }
          }}
        >
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
        <IconButton onClick={handleNext} disabled={!currentTrack}>
          <SkipNext sx={{ color: 'white' }} />
        </IconButton>
      </Box>

      {/* Progress Bar */}
      {currentTrack && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="caption" sx={{ color: 'white', minWidth: '40px' }}>
            {formatTime(currentTime)}
          </Typography>
          <Slider
            value={currentTime}
            max={duration || 100}
            onChange={handleSeek}
            sx={{ 
              mx: 2, 
              color: '#1ed760',
              '& .MuiSlider-thumb': { backgroundColor: '#1ed760' },
              '& .MuiSlider-track': { backgroundColor: '#1ed760' },
            }}
          />
          <Typography variant="caption" sx={{ color: 'white', minWidth: '40px' }}>
            {formatTime(duration)}
          </Typography>
        </Box>
      )}

      {/* Bottom Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '150px' }}>
          <VolumeUp sx={{ color: 'white', mr: 1 }} />
          <Slider
            value={volume}
            onChange={handleVolumeChange}
            sx={{ 
              color: '#1ed760',
              '& .MuiSlider-thumb': { backgroundColor: '#1ed760' },
              '& .MuiSlider-track': { backgroundColor: '#1ed760' },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Room Playlist">
            <IconButton>
              <QueueMusic sx={{ color: 'white' }} />
            </IconButton>
          </Tooltip>
          
          {isHost && (
            <Tooltip title="Add Track">
              <IconButton onClick={handleAddTrack}>
                <Add sx={{ color: 'white' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Room Playlist */}
      <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'white' }}>
        Room Playlist ({tracks.length} tracks)
      </Typography>
      
      <List sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
        {tracks.map((track, index) => (
          <ListItem 
            key={track.id}
            selected={currentTrack?.id === track.id}
            sx={{ 
              backgroundColor: currentTrack?.id === track.id ? 'rgba(30, 215, 96, 0.1)' : 'transparent',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ backgroundColor: '#1ed760' }}>
                <MusicNote />
              </Avatar>
            </ListItemAvatar>
            <ListItemText 
              primary={track.title || `Track ${index + 1}`}
              secondary={track.artist || 'Unknown Artist'}
              sx={{ color: 'white' }}
            />
            {currentTrack?.id === track.id && (
              <Chip label="Playing" size="small" color="primary" />
            )}
          </ListItem>
        ))}
      </List>

      {/* Add Track Dialog */}
      <Dialog 
        open={showAddTrack} 
        onClose={() => setShowAddTrack(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Track to Room</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search your tracks..."
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ mb: 2 }}
          />
          
          <Typography variant="subtitle2" gutterBottom>
            Your Tracks
          </Typography>
          
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {filteredTracks.map((track) => (
              <ListItem 
                key={track.id}
                button
                onClick={() => handleSelectTrack(track)}
              >
                <ListItemAvatar>
                  <Avatar>
                    <MusicNote />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={track.title}
                  secondary={track.artist}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleSelectTrack(track)}
                >
                  Add
                </Button>
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default RoomAudioPlayer;

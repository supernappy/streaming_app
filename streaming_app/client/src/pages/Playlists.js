import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Divider
} from '@mui/material';
import { Add, PlayArrow, Delete, Favorite, FavoriteBorder, MoreVert, Share, MusicNote } from '@mui/icons-material';
import axios from 'axios';
import { usePlayer } from '../contexts/PlayerContext';
import Tooltip from '@mui/material/Tooltip';
import AudioPlayer from '../components/AudioPlayer';
import TrackCard from '../components/TrackCard';
import useSyncTrackCounts from '../hooks/useSyncTrackCounts';
import { formatPlays } from '../utils/format';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5002';
axios.defaults.withCredentials = true;

// Add auth token to requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [availableTracks, setAvailableTracks] = useState([]);
  const [syncedAvailableTracks, setSyncedAvailableTracks] = useSyncTrackCounts([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addTracksDialogOpen, setAddTracksDialogOpen] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newPlaylist, setNewPlaylist] = useState({
    name: '',
    description: '',
    is_public: false
  });
  const { playTrack, recentlyPlayed } = usePlayer ? usePlayer() : { playTrack: () => {}, recentlyPlayed: [] };
  const [syncedPlaylistTracks, setSyncedPlaylistTracks] = useSyncTrackCounts([]);

  useEffect(() => {
    fetchPlaylists();
    fetchAvailableTracks();
  }, []);

  const fetchAvailableTracks = async () => {
    try {
      const response = await axios.get('/api/tracks');
  const list = response.data.tracks || [];
  setAvailableTracks(list);
  setSyncedAvailableTracks(list);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const response = await axios.get('/api/playlists');
      setPlaylists(response.data.playlists || []);
      if (response.data.playlists && response.data.playlists.length > 0) {
        setSelectedPlaylist(response.data.playlists[0]);
        fetchPlaylistTracks(response.data.playlists[0].id);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setError('Failed to load playlists. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylistTracks = async (playlistId) => {
    try {
      const response = await axios.get(`/api/playlists/${playlistId}`);
  setSelectedPlaylist(response.data.playlist);
  setSyncedPlaylistTracks(response.data.playlist?.tracks || []);
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylist.name) return;

    try {
      await axios.post('/api/playlists', newPlaylist);
      setCreateDialogOpen(false);
      setNewPlaylist({
        name: '',
        description: '',
        is_public: false
      });
      setSuccess('Playlist created successfully!');
      fetchPlaylists();
    } catch (error) {
      console.error('Error creating playlist:', error);
      setError('Failed to create playlist. Please try again.');
    }
  };

  const handleAddTracks = async () => {
    if (!selectedPlaylist || selectedTracks.length === 0) return;

    try {
      // Add each selected track to the playlist
      for (const trackId of selectedTracks) {
        await axios.post(`/api/playlists/${selectedPlaylist.id}/tracks`, {
          track_id: trackId
        });
      }
      
      setAddTracksDialogOpen(false);
      setSelectedTracks([]);
      setSuccess(`Added ${selectedTracks.length} track(s) to playlist!`);
      fetchPlaylistTracks(selectedPlaylist.id);
    } catch (error) {
      console.error('Error adding tracks to playlist:', error);
      setError('Failed to add tracks to playlist. Please try again.');
    }
  };

  const handleRemoveTrack = async (trackId) => {
    if (!selectedPlaylist) return;

    try {
      await axios.delete(`/api/playlists/${selectedPlaylist.id}/tracks/${trackId}`);
      setSuccess('Track removed from playlist!');
      fetchPlaylistTracks(selectedPlaylist.id);
    } catch (error) {
      console.error('Error removing track from playlist:', error);
      setError('Failed to remove track. Please try again.');
    }
  };

  const handleTrackSelection = (trackId) => {
    setSelectedTracks(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  const handlePlayPlaylist = () => {
    if (syncedPlaylistTracks?.length > 0) {
      playTrack(syncedPlaylistTracks[0], syncedPlaylistTracks);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography>Loading playlists...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, mb: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          My Playlists
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Playlist
        </Button>
      </Box>

      {playlists.length > 0 ? (
        <Grid container spacing={3}>
          {/* Playlist List */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: 'sticky', top: 20 }}>
              {playlists.map((playlist) => (
                <Card
                  key={playlist.id}
                  sx={{
                    mb: 2,
                    backgroundColor: selectedPlaylist?.id === playlist.id ? '#2a2a2a' : '#1e1e1e',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#2a2a2a'
                    }
                  }}
                  onClick={() => fetchPlaylistTracks(playlist.id)}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{playlist.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {playlist.track_count || 0} tracks
                    </Typography>
                    {playlist.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {playlist.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Grid>

          {/* Playlist Details */}
          <Grid item xs={12} md={8}>
            {selectedPlaylist ? (
              <Card sx={{ backgroundColor: '#1e1e1e' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
                    <Box>
                      <Typography variant="h5" gutterBottom sx={{ color: '#fff' }}>
                        {selectedPlaylist.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedPlaylist.tracks?.length || 0} tracks • by {selectedPlaylist.owner_username}
                      </Typography>
                      {selectedPlaylist.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {selectedPlaylist.description}
                        </Typography>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={() => setAddTracksDialogOpen(true)}
                        sx={{
                          borderColor: '#1DB954',
                          color: '#1DB954',
                          '&:hover': {
                            borderColor: '#1ed760',
                            color: '#1ed760'
                          }
                        }}
                      >
                        Add Tracks
                      </Button>
                      {selectedPlaylist.tracks?.length > 0 && (
                        <Button
                          variant="contained"
                          startIcon={<PlayArrow />}
                          onClick={handlePlayPlaylist}
                          sx={{
                            backgroundColor: '#1DB954',
                            '&:hover': {
                              backgroundColor: '#1ed760'
                            }
                          }}
                        >
                          Play All
                        </Button>
                      )}
                    </Box>
                  </Box>

                  {/* Track List */}
                  {selectedPlaylist.tracks?.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {syncedPlaylistTracks.map((track, index) => (
                        <TrackCard
                          key={track.id}
                          track={track}
                          onPlay={() => playTrack(track, syncedPlaylistTracks)}
                          showActions={true}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <MusicNote sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary" gutterBottom>
                        This playlist is empty
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Add some tracks to get started
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setAddTracksDialogOpen(true)}
                        sx={{
                          backgroundColor: '#1DB954',
                          '&:hover': {
                            backgroundColor: '#1ed760'
                          }
                        }}
                      >
                        Add Tracks
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ backgroundColor: '#1e1e1e' }}>
                <CardContent>
                  <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    Select a playlist to view its tracks
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No playlists yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first playlist to organize your favorite tracks
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ mt: 2 }}
          >
            Create Playlist
          </Button>
        </Box>
      )}

      {/* Create Playlist Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#2a2a2a',
            color: '#fff'
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>Create New Playlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Playlist Name"
            fullWidth
            variant="outlined"
            value={newPlaylist.name}
            onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#1DB954' },
              },
              '& .MuiInputBase-input': { color: '#fff' },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
            }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newPlaylist.description}
            onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#1DB954' },
              },
              '& .MuiInputBase-input': { color: '#fff' },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} sx={{ color: '#ccc' }}>Cancel</Button>
          <Button 
            onClick={handleCreatePlaylist} 
            variant="contained"
            disabled={!newPlaylist.name}
            sx={{
              backgroundColor: '#1DB954',
              '&:hover': { backgroundColor: '#1ed760' }
            }}
          >
            Create Playlist
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Tracks Dialog */}
      <Dialog 
        open={addTracksDialogOpen} 
        onClose={() => setAddTracksDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#2a2a2a',
            color: '#fff',
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          Add Tracks to "{selectedPlaylist?.name}"
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select tracks to add to your playlist
          </Typography>
          
      {syncedAvailableTracks.length > 0 ? (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
        {syncedAvailableTracks.map((track) => (
                <React.Fragment key={track.id}>
                  <ListItem
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      backgroundColor: selectedTracks.includes(track.id) ? 'rgba(29, 185, 84, 0.1)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      }
                    }}
                  >
                    <Checkbox
                      checked={selectedTracks.includes(track.id)}
                      onChange={() => handleTrackSelection(track.id)}
                      sx={{
                        color: '#1DB954',
                        '&.Mui-checked': {
                          color: '#1DB954'
                        }
                      }}
                    />
                    <ListItemText
                      primary={
                        <Typography sx={{ color: '#fff' }}>
                          {track.title}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            {track.artist}
                          </Typography>
                          <Chip 
                            label={formatPlays(typeof track.play_count === 'number' ? track.play_count : 0)}
                            size="small"
                            variant="outlined"
                            sx={{ color: '#ccc', borderColor: '#555', height: 20 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No tracks available to add
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setAddTracksDialogOpen(false);
              setSelectedTracks([]);
            }} 
            sx={{ color: '#ccc' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddTracks} 
            variant="contained"
            disabled={selectedTracks.length === 0}
            sx={{
              backgroundColor: '#1DB954',
              '&:hover': { backgroundColor: '#1ed760' }
            }}
          >
            Add {selectedTracks.length} Track{selectedTracks.length !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
      {/* Recently Played Section */}
            {recentlyPlayed && recentlyPlayed.length > 0 && (
              <Box sx={{ mt: 6, mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Recently Played
                </Typography>
                <Grid container spacing={2}>
                  {recentlyPlayed.slice(0, 8).map((track) => (
                    <Grid item xs={12} sm={6} md={3} key={track.id}>
                      <TrackCard
                        track={track}
                        onPlay={() => playTrack(track)}
                        showActions={true}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

      {/* AI Recommendations Section */}
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
          AI Picks For You
        </Typography>
      </Box>
    </Container>
  );
};

export default Playlists;

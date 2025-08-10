import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  IconButton,
  Avatar,
  Skeleton,
  Paper
} from '@mui/material';
import { 
  PlayArrow, 
  FavoriteBorder, 
  CloudUpload,
  QueueMusic,
  Groups,
  TrendingUp,
  AccessTime
} from '@mui/icons-material';
import { tracksAPI, roomsAPI } from '../services/api';
import { usePlayer } from '../contexts/PlayerContext';
import { formatPlays } from '../utils/format';
import Tooltip from '@mui/material/Tooltip';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ModernRoomCard from '../components/ModernRoomCard';
import useSyncTrackCounts from '../hooks/useSyncTrackCounts';

const Home = () => {
  const [tracksRaw, setTracksRaw] = useState([]);
  const [tracks, setTracks] = useSyncTrackCounts(tracksRaw);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);
  
  const { playTrack, recentlyPlayed } = usePlayer ? usePlayer() : { playTrack: () => {}, recentlyPlayed: [] };
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchTracks(), fetchRooms()]);
    setLoading(false);
  };

  const fetchTracks = async () => {
    setTracksLoading(true);
    try {
  const response = await tracksAPI.getAll({ limit: 12, sort: 'created_at' });
  setTracksRaw(response.data.tracks || []);
    } catch (error) {
      console.error('Error fetching tracks:', error);
      setTracks([]);
    } finally {
      setTracksLoading(false);
    }
  };

  const fetchRooms = async () => {
    setRoomsLoading(true);
    try {
      const response = await roomsAPI.getAll({ limit: 6, is_active: true });
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  const handlePlay = (track) => {
    playTrack(track, tracks);
  };

  const handleLike = async (trackId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    console.log('Like track:', trackId);
  };

  const handleJoinRoom = async (roomId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await roomsAPI.join(roomId);
      navigate(`/rooms/${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      let errorMessage = 'Failed to join room.';
      
      if (error.response?.status === 404) {
        errorMessage = 'Room not found or is no longer active.';
      } else if (error.response?.status === 400 && error.response.data?.error?.includes('full')) {
        errorMessage = 'This room is currently full.';
      }
      
      alert(errorMessage);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const LoadingSkeleton = ({ count = 8 }) => (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="80%" height={32} />
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={24} />
              <Box sx={{ mt: 1 }}>
                <Skeleton variant="rectangular" width={60} height={24} />
              </Box>
            </CardContent>
            <CardActions>
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="circular" width={40} height={40} />
            </CardActions>
          </Card>
        </Grid>
      ))}
    </>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4, mb: 10 }}>
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ 
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #1DB954, #1ed760)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Welcome to OpenStream
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          The open-source audio streaming platform built for creators
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
          Stream music, create playlists, host live audio rooms, and connect with creators 
          worldwide. All powered by open-source technology.
        </Typography>
        
        {!isAuthenticated && (
          <Box sx={{ mt: 3 }}>
            <Button 
              variant="contained" 
              size="large" 
              onClick={() => navigate('/register')}
              sx={{ 
                mr: 2,
                background: 'linear-gradient(45deg, #1DB954, #1ed760)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1ed760, #1DB954)',
                }
              }}
            >
              Get Started
            </Button>
            <Button 
              variant="outlined" 
              size="large" 
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </Box>
        )}
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <QueueMusic sx={{ fontSize: 40, color: '#1DB954', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {tracks.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tracks Available
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Groups sx={{ fontSize: 40, color: '#1DB954', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {rooms.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Rooms
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <TrendingUp sx={{ fontSize: 40, color: '#1DB954', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              24/7
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Streaming
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <CloudUpload sx={{ fontSize: 40, color: '#1DB954', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Free
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload & Stream
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Active Rooms */}
      {rooms.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Live Audio Rooms
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/rooms')}
              endIcon={<Groups />}
            >
              View All
            </Button>
          </Box>
          
          <Grid container spacing={3} sx={{ mb: 6 }}>
            {roomsLoading ? (
              <LoadingSkeleton count={3} />
            ) : (
              rooms.map((room) => (
                <Grid item xs={12} sm={6} md={4} key={room.id}>
                  <Card 
                    sx={{ 
                      border: '1px solid #1DB954',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: '0 8px 25px rgba(29, 185, 84, 0.3)'
                      }
                    }}
                    onClick={() => handleJoinRoom(room.id)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ backgroundColor: '#1DB954', mr: 2 }}>
                          <Groups />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" noWrap>
                            {room.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            🔴 LIVE
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {room.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip 
                          label={room.category || 'General'} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                        <Typography variant="caption" color="text.secondary">
                          {room.participant_count || 0} listening
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </>
      )}

      {/* Recent Tracks */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Recently Added
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/search')}
          endIcon={<QueueMusic />}
        >
          Browse All
        </Button>
      </Box>
      

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {tracksLoading ? (
          <LoadingSkeleton count={8} />
        ) : tracks.length > 0 ? (
          tracks.map((track) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={track.id}>
              <Card 
                sx={{ 
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ backgroundColor: '#1DB954', mr: 2, width: 40, height: 40 }}>
                      <QueueMusic />
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="h6" noWrap title={track.title}>
                        {track.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {track.artist}
                      </Typography>
                    </Box>
                  </Box>
                  {track.album && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Album: {track.album}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    {track.genre && (
                      <Chip label={track.genre} size="small" variant="outlined" color="primary" />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {formatDuration(track.duration)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tooltip title={track.play_count === 1 ? 'Played once' : `Played ${track.play_count || 0} times`} arrow>
                      <Typography variant="caption" color="text.secondary">
                        <AccessTime sx={{ fontSize: 12, mr: 0.5 }} />
                        {formatPlays(track.play_count || 0)}
                      </Typography>
                    </Tooltip>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(track.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <IconButton
                    onClick={() => handlePlay(track)}
                    sx={{
                      backgroundColor: '#1DB954',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#1ed760',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <PlayArrow />
                  </IconButton>
                  <IconButton
                    onClick={() => handleLike(track.id)}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { color: '#1DB954' }
                    }}
                  >
                    <FavoriteBorder />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <QueueMusic sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                No tracks available yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Be the first to upload some music and start streaming!
              </Typography>
              {isAuthenticated && (
                <Button 
                  variant="contained" 
                  startIcon={<CloudUpload />}
                  onClick={() => navigate('/upload')}
                  sx={{ 
                    background: 'linear-gradient(45deg, #1DB954, #1ed760)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1ed760, #1DB954)',
                    }
                  }}
                >
                  Upload Your First Track
                </Button>
              )}
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Recently Played Section */}
      {recentlyPlayed && recentlyPlayed.length > 0 && (
        <Box sx={{ mt: 6, mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            Recently Played
          </Typography>
          <Grid container spacing={2}>
            {recentlyPlayed.slice(0, 8).map((track) => (
              <Grid item xs={12} sm={6} md={3} key={track.id}>
                <Card sx={{ bgcolor: '#23272f', color: 'white' }}>
                  <CardContent>
                    <Typography variant="subtitle1" noWrap>{track.title}</Typography>
                    <Typography variant="body2" color="#aaa" noWrap>{track.artist}</Typography>
                    <Tooltip title={track.play_count === 1 ? 'Played once' : `Played ${track.play_count || 0} times`} arrow>
                      <Typography variant="caption" color="#aaa">
                        <AccessTime sx={{ fontSize: 12, mr: 0.5 }} />
                        {formatPlays(track.play_count || 0)}
                      </Typography>
                    </Tooltip>
                  </CardContent>
                  <CardActions>
                    <IconButton onClick={() => handlePlay(track)} sx={{ color: '#1DB954' }}>
                      <PlayArrow />
                    </IconButton>
                  </CardActions>
                </Card>
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

      {/* Call to Action */}
      {!isAuthenticated && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            Ready to start your streaming journey?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Join thousands of creators already using OpenStream
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<CloudUpload />}
            onClick={() => navigate('/register')}
            sx={{ 
              mr: 2,
              background: 'linear-gradient(45deg, #1DB954, #1ed760)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1ed760, #1DB954)',
              }
            }}
          >
            Start Creating
          </Button>
          <Button 
            variant="outlined" 
            size="large"
            onClick={() => navigate('/rooms')}
          >
            Explore Rooms
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default Home;

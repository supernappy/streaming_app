import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import { Button, Box, Typography, Container, Grid, Card, CardContent, CardActions, Skeleton, Paper, Tooltip, IconButton, InputBase } from '@mui/material';
import { PlayArrow, FavoriteBorder, CloudUpload, QueueMusic, Groups, TrendingUp, AccessTime, Search as SearchIcon, MusicNote, Movie } from '@mui/icons-material';
import { tracksAPI, roomsAPI } from '../services/api';
import { usePlayer } from '../contexts/PlayerContext';
import { formatPlays } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ModernRoomCard from '../components/ModernRoomCard';
import TrackCard from '../components/TrackCard';
import useSyncTrackCounts from '../hooks/useSyncTrackCounts';


// Only one Home component and one export default should exist in this file. All duplicate declarations and exports have been removed.

const Home = () => {
  const [tracksRaw, setTracksRaw] = useState([]);
  const [tracks, setTracks] = useSyncTrackCounts(tracksRaw);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const { playTrack, incrementPlayCount, recentlyPlayed } = usePlayer ? usePlayer() : { playTrack: () => {}, incrementPlayCount: () => {}, recentlyPlayed: [] };
  // Modal state for AI Recommendations
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPicks, setAiPicks] = useState([]);
  const [aiError, setAiError] = useState(null);
  // Fetch AI recommendations using shared axios instance for robust error handling
  const fetchAIRecommendations = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      if (!user?.id) throw new Error('You must be logged in for AI recommendations.');
      // Use shared axios instance (api.js)
      const res = await import('../services/api').then(m => m.default.get(`/ai/recommendations/${user.id}`));
      setAiPicks(res.data.recommendations || []);
    } catch (err) {
      // Axios error handling
      if (err.response) {
        if (err.response.data && err.response.data.error) {
          setAiError(err.response.data.error);
        } else {
          setAiError(`Error: ${err.response.status} ${err.response.statusText}`);
        }
      } else if (err.request) {
        setAiError('No response from server. Please check your network or backend.');
      } else {
        setAiError(err.message || 'Unknown error');
      }
    } finally {
      setAiLoading(false);
    }
  };
  const { isAuthenticated, user } = useAuth();
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

  const getWelcomeMessage = () => {
    if (isAuthenticated && user && user.name) {
      const hour = new Date().getHours();
      let greeting = 'Welcome';
      if (hour < 12) greeting = 'Good morning';
      else if (hour < 18) greeting = 'Good afternoon';
      else greeting = 'Good evening';
      return `${greeting}, ${user.name}!`;
    }
    return 'Welcome to OpenStream!';
  };

  const handlePlay = (track) => {
    playTrack(track, tracks);
    incrementPlayCount(track);
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
      <Box sx={{ textAlign: 'center', mb: 6, position: 'relative', overflow: 'hidden', minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Animated background circles */}
        <Box sx={{ position: 'absolute', top: '-60px', left: '-60px', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, #1DB954 60%, #1ed760 100%)', opacity: 0.18, zIndex: 0, animation: 'float1 8s ease-in-out infinite' }} />
        <Box sx={{ position: 'absolute', bottom: '-80px', right: '-80px', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, #1ed760 60%, #1DB954 100%)', opacity: 0.13, zIndex: 0, animation: 'float2 10s ease-in-out infinite' }} />
        <style>{`
          @keyframes float1 {
            0% { transform: translateY(0) scale(1); }
            50% { transform: translateY(20px) scale(1.05); }
            100% { transform: translateY(0) scale(1); }
          }
          @keyframes float2 {
            0% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-18px) scale(1.04); }
            100% { transform: translateY(0) scale(1); }
          }
        `}</style>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', background: 'linear-gradient(45deg, #1DB954, #1ed760)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Welcome to OpenStream
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          The open-source audio streaming platform built for creators
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
          Stream music, create playlists, host live audio rooms, and connect with creators worldwide. All powered by open-source technology.
        </Typography>
        {!isAuthenticated && (
          <Box sx={{ mt: 3 }}>
            <Button variant="contained" size="large" onClick={() => navigate('/register')} sx={{ mr: 2, background: 'linear-gradient(45deg, #1DB954, #1ed760)', '&:hover': { background: 'linear-gradient(45deg, #1ed760, #1DB954)' } }}>
              Get Started
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </Box>
        )}
      </Box>

      {/* Personalized Welcome */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
          {getWelcomeMessage()}
        </Typography>
      </Box>

      {/* Featured Content */}
      <Box sx={{ mt: 2, mb: 6, textAlign: 'left', px: { xs: 1, sm: 0 } }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          Featured Content
        </Typography>
        <Grid container spacing={3}>
          {/* Trending Now */}
          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                borderRadius: 4,
                boxShadow: 6,
                position: 'relative',
                overflow: 'hidden',
                minHeight: 200,
                color: 'white',
                background: 'linear-gradient(135deg, #1DB954 60%, #1ed760 100%)',
                transition: 'transform 0.25s cubic-bezier(.4,2,.6,1), box-shadow 0.25s',
                '&:hover': {
                  transform: 'scale(1.04) translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(29,185,84,0.25)',
                },
              }}
            >
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.18, background: 'url(https://img.icons8.com/color/96/000000/trend.png) center/60% no-repeat' }} />
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUp sx={{ fontSize: 32, mr: 1, color: '#fff' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Trending Now
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  Check out the hottest tracks and rooms right now.
                </Typography>
              </CardContent>
              <CardActions sx={{ position: 'relative', zIndex: 1 }}>
                <Button size="medium" variant="contained" sx={{ background: 'rgba(0,0,0,0.18)', color: 'white', fontWeight: 600, borderRadius: 2, '&:hover': { background: 'rgba(0,0,0,0.28)' } }} onClick={() => navigate('/trending')}>
                  Explore
                </Button>
              </CardActions>
            </Card>
          </Grid>
          {/* Editor's Pick */}
          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                borderRadius: 4,
                boxShadow: 6,
                position: 'relative',
                overflow: 'hidden',
                minHeight: 200,
                color: 'white',
                background: 'linear-gradient(135deg, #4ECDC4 60%, #556270 100%)',
                transition: 'transform 0.25s cubic-bezier(.4,2,.6,1), box-shadow 0.25s',
                '&:hover': {
                  transform: 'scale(1.04) translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(78,205,196,0.25)',
                },
              }}
            >
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.15, background: 'url(https://img.icons8.com/color/96/000000/editor.png) center/60% no-repeat' }} />
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <QueueMusic sx={{ fontSize: 32, mr: 1, color: '#fff' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Editor’s Pick
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  Handpicked content for you to explore.
                </Typography>
              </CardContent>
              <CardActions sx={{ position: 'relative', zIndex: 1 }}>
                <Button size="medium" variant="contained" sx={{ background: 'rgba(0,0,0,0.18)', color: 'white', fontWeight: 600, borderRadius: 2, '&:hover': { background: 'rgba(0,0,0,0.28)' } }} onClick={() => navigate('/curated-playlist')}>
                  Explore
                </Button>
              </CardActions>
            </Card>
          </Grid>
          {/* AI Recommendation */}
          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                borderRadius: 4,
                boxShadow: 6,
                position: 'relative',
                overflow: 'hidden',
                minHeight: 200,
                color: 'white',
                background: 'linear-gradient(135deg, #764ba2 60%, #667eea 100%)',
                transition: 'transform 0.25s cubic-bezier(.4,2,.6,1), box-shadow 0.25s',
                '&:hover': {
                  transform: 'scale(1.04) translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(118,75,162,0.25)',
                },
              }}
            >
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.15, background: 'url(https://img.icons8.com/color/96/000000/artificial-intelligence.png) center/60% no-repeat' }} />
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PlayArrow sx={{ fontSize: 32, mr: 1, color: '#fff' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    AI Recommendation
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  AI-powered picks based on your taste.
                </Typography>
              </CardContent>
              <CardActions sx={{ position: 'relative', zIndex: 1 }}>
                <Button size="medium" variant="contained" sx={{ background: 'rgba(0,0,0,0.18)', color: 'white', fontWeight: 600, borderRadius: 2, '&:hover': { background: 'rgba(0,0,0,0.28)' } }} onClick={() => { setAiModalOpen(true); fetchAIRecommendations(); }}>
                  Explore
                </Button>
              </CardActions>
            </Card>
          </Grid>
      {/* AI Recommendations Modal */}
      <Dialog open={aiModalOpen} onClose={() => setAiModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>AI Recommendations</DialogTitle>
        <DialogContent>
          {aiLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
              <CircularProgress />
            </Box>
          ) : aiError ? (
            <Typography color="error">{aiError}</Typography>
          ) : aiPicks.length === 0 ? (
            <Typography>No AI recommendations found.</Typography>
          ) : (
            <Box>
              {aiPicks.map((track, idx) => (
                <Box key={track.id || idx} sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: '#23272f' }}>
                  <Typography variant="subtitle1">
                    {typeof track.title === 'object' ? JSON.stringify(track.title) : String(track.title)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {typeof track.artist === 'object' ? JSON.stringify(track.artist) : String(track.artist)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {typeof track.reason === 'object' ? JSON.stringify(track.reason) : String(track.reason || '')}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
        </Grid>
      </Box>

      {/* Rooms Section */}
      <Box sx={{ mt: 6, mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          Active Rooms
        </Typography>
        {roomsLoading ? (
          <LoadingSkeleton count={6} />
        ) : rooms.length === 0 ? (
          <Typography color="text.secondary">No active rooms right now.</Typography>
        ) : (
          <Grid container spacing={2}>
            {rooms.map(room => (
              <Grid item xs={12} sm={6} md={4} key={room.id}>
                <ModernRoomCard room={room} onJoin={() => handleJoinRoom(room.id)} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Tracks Section */}
      <Box sx={{ mt: 6, mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          Latest Tracks
        </Typography>
        {tracksLoading ? (
          <LoadingSkeleton count={8} />
        ) : tracks.length === 0 ? (
          <Typography color="text.secondary">No tracks found.</Typography>
        ) : (
          <Grid container spacing={3}>
            {tracks.map(track => (
              <Grid item xs={12} sm={6} md={3} key={track.id}>
                <TrackCard
                  track={track}
                  onPlay={() => handlePlay(track)}
                  onFavorite={() => handleLike(track.id)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

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
                  onPlay={() => handlePlay(track)}
                  showActions={true}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

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


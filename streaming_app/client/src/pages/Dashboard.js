import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Alert,
  Snackbar,
  CircularProgress,
  Button
} from '@mui/material';
import {
  CloudUpload,
  QueueMusic,
  Favorite,
  PlayArrow,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useNavigate } from 'react-router-dom';
import AudioPlayer from '../components/AudioPlayer';
import axios from 'axios';
import useSyncTrackCounts from '../hooks/useSyncTrackCounts';
import Tooltip from '@mui/material/Tooltip';
import { formatNumberCompact } from '../utils/format';

const PlaysOverTimeChart = lazy(() => import('../components/PlaysOverTimeChart'));

// Configure axios defaults
const api = axios.create({
  baseURL: 'http://localhost:5002',
  withCredentials: true
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function getFakePlaysOverTime(total) {
  const days = 14;
  let left = total;
  const arr = [];
  for (let i = days - 1; i >= 0; i--) {
    const plays = i === 0 ? left : Math.max(0, Math.round(Math.random() * (left / (i + 1))));
    arr.push({ date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10), plays });
    left -= plays;
  }
  return arr;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { playTrack } = usePlayer();
  const navigate = useNavigate();
  
  // Add debug logging for user changes
  useEffect(() => {
    console.log('🔍 User context changed:', user);
    console.log('🔍 User properties:', {
      id: user?.id,
      userId: user?.userId, 
      username: user?.username,
      email: user?.email
    });
  }, [user]);
  
  // Dashboard stats
  const [stats, setStats] = useState({
    tracksUploaded: 0,
    playlistsCreated: 0,
    totalPlays: 0,
    favorites: 0
  });
  
  // Data arrays
  const [recentTracksRaw, setRecentTracksRaw] = useState([]);
  const [recentTracks, setRecentTracks] = useSyncTrackCounts(recentTracksRaw);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔍 Dashboard mounted. User context:', user);
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

   // Auto-refresh dashboard data every 60 seconds
  useEffect(() => {
    if (user) {
      const interval = setInterval(fetchDashboardData, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    // Start loading and clear previous errors
    setLoading(true);
    setError(null);
    
    console.log('🔄 Fetching dashboard data for user:', user);
    
    try {
      // Fetch dashboard stats with fallback
      try {
        const statsResponse = await api.get('/api/dashboard/stats');
        console.log('✅ Dashboard stats response:', statsResponse.data);
        setStats(statsResponse.data);
      } catch (statsError) {
        console.warn('Dashboard stats endpoint not available, fetching basic stats');
        console.error('Stats error:', statsError);
        // Fallback: Get basic track count from tracks endpoint
        try {
          const tracksResponse = await api.get('/api/tracks');
          console.log('📊 Raw tracks response:', tracksResponse.data);
          const allTracks = tracksResponse.data.tracks || tracksResponse.data;
          console.log('📊 All tracks:', allTracks);
          const userId = user?.id || user?.userId;
          const userTracks = allTracks.filter(track => track.user_id === userId);
          console.log('🎵 User tracks found:', userTracks.length, 'for userId:', userId, userTracks);
          setStats({
            tracksUploaded: userTracks.length,
            playlistsCreated: 0,
            totalPlays: userTracks.reduce((sum, track) => sum + (track.play_count || 0), 0),
            favorites: 0
          });
        } catch (fallbackError) {
          console.warn('Basic stats fallback failed, using defaults');
          console.error('Fallback error:', fallbackError);
          setStats({
            tracksUploaded: 0,
            playlistsCreated: 0,
            totalPlays: 0,
            favorites: 0
          });
        }
      }

      // Fetch recent tracks with fallback to general tracks endpoint
      try {
        // Try getting user's tracks from general tracks endpoint
        const tracksResponse = await api.get('/api/tracks');
        const allTracks = tracksResponse.data.tracks || tracksResponse.data;
        const userId = user?.id || user?.userId;
        const userTracks = allTracks
          .filter(track => track.user_id === userId)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5); // Get 5 most recent
  setRecentTracksRaw(userTracks);
        console.log('🎵 Recent tracks loaded:', userTracks.length, 'for userId:', userId, userTracks);
      } catch (tracksError) {
        console.warn('Recent tracks endpoint not available, using empty array');
        console.error('Tracks error:', tracksError);
  setRecentTracksRaw([]);
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Failed to load some dashboard data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading dashboard...
        </Typography>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 4, mb: 10 }}>
        {/* Welcome Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              Welcome back, {user?.username}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here's your OpenStream activity overview
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={() => navigate('/profile')}
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                }
              }}
            >
              View Profile
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchDashboardData}
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': { borderColor: 'white' }
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#1e1e1e', textAlign: 'center' }}>
              <CardContent>
                <CloudUpload sx={{ fontSize: 40, color: '#1DB954', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.tracksUploaded}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tracks Uploaded
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#1e1e1e', textAlign: 'center' }}>
              <CardContent>
                <QueueMusic sx={{ fontSize: 40, color: '#1DB954', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.playlistsCreated}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Playlists Created
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#1e1e1e', textAlign: 'center' }}>
              <CardContent>
                <PlayArrow sx={{ fontSize: 40, color: '#1DB954', mb: 1 }} />
                <Tooltip title="Total number of times your tracks have been played (live updated)">
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatNumberCompact(stats.totalPlays)}
                  </Typography>
                </Tooltip>
                <Typography variant="body2" color="text.secondary">
                  Total Plays
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#1e1e1e', textAlign: 'center' }}>
              <CardContent>
                <Favorite sx={{ fontSize: 40, color: '#1DB954', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.favorites}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Favorites
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Activity */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#fff' }}>
              Recent Tracks ({recentTracks.length})
            </Typography>
            
            {/* Analytics and Recently Played */}
            <Suspense fallback={<div>Loading chart...</div>}>
              <PlaysOverTimeChart data={getFakePlaysOverTime(stats.totalPlays)} />
            </Suspense>
            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#fff' }}>
                  Recently Played (last 5)
                </Typography>
                {recentTracks.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {recentTracks.map((track) => (
                      <AudioPlayer 
                        key={track.id} 
                        track={track} 
                        onPlay={(track) => playTrack(track, recentTracks)}
                        compact={true}
                      />
                    ))}
                  </Box>
                ) : (
                  <Card sx={{ backgroundColor: '#2a2a2a' }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        No recent tracks found.
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
              <Card 
                sx={{ backgroundColor: '#2a2a2a', cursor: 'pointer', '&:hover': { backgroundColor: '#3a3a3a' } }}
                onClick={() => navigate('/upload')}
              >
                <CardContent>
                  <CloudUpload sx={{ color: '#1DB954', mb: 1 }} />
                  <Typography variant="h6" sx={{ color: '#fff' }}>Upload Track</Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Share your music with the world
                  </Typography>
                </CardContent>
              </Card>
              <Card 
                sx={{ backgroundColor: '#2a2a2a', cursor: 'pointer', '&:hover': { backgroundColor: '#3a3a3a' } }}
                onClick={() => navigate('/profile')}
              >
                <CardContent>
                  <QueueMusic sx={{ color: '#1DB954', mb: 1 }} />
                  <Typography variant="h6" sx={{ color: '#fff' }}>Edit Profile</Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Update your profile and settings
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>
      
      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Dashboard;

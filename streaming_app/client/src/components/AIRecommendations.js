import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Stack
} from '@mui/material';
import {
  Psychology,
  PlayArrow,
  Favorite,
  Share,
  AutoAwesome,
  TrendingUp,
  Explore,
  MusicNote,
  Refresh
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import AudioPlayer from './AudioPlayer';


import { useEffect, useState } from 'react';
import api from '../services/api';

const AIRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { playTrack } = usePlayer();

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/ai/recommendations/${user?.id}`);
        setRecommendations(res.data.recommendations || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchRecommendations();
  }, [user?.id]);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2, color: '#4caf50' }}>
        <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} /> AI Recommendations
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : recommendations.length === 0 ? (
        <Alert severity="info">No recommendations available.</Alert>
      ) : (
        <Grid container spacing={2}>
          {recommendations.map((track, idx) => (
            <Grid item xs={12} md={6} lg={4} key={track.id || idx}>
              <Card sx={{ bgcolor: '#23272f', color: 'white', borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{track.title}</Typography>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>{track.artist}</Typography>
                  <Typography variant="caption" sx={{ color: '#4caf50' }}>{track.aiReason}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip label={`Score: ${(track.aiScore * 100).toFixed(0)}%`} size="small" color="success" />
                    {track.genre && <Chip label={track.genre} size="small" />}
                  </Stack>
                  <Box sx={{ mt: 2 }}>
                    <Button variant="contained" color="primary" startIcon={<PlayArrow />} onClick={() => playTrack(track)}>
                      Play
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

import { formatPlays } from '../utils/format';
export default AIRecommendations;

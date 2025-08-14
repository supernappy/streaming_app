import React, { useEffect, useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { Box, Typography, Grid, CircularProgress, Card, CardContent } from '@mui/material';
import { MusicNote, Movie, PlayArrow, FavoriteBorder, AccessTime } from '@mui/icons-material';
import TrackCard from '../components/TrackCard';
import api from '../services/api';

const Library = () => {
  const { playTrack } = usePlayer();
  const [tracks, setTracks] = useState([]);
  const [artists, setArtists] = useState([]);
  // Search state removed; use navbar search only
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const tracksRes = await api.get('/tracks');
        setTracks(tracksRes.data.tracks || tracksRes.data || []);
        // Extract unique artists from tracks
        const uniqueArtists = Array.from(new Set((tracksRes.data.tracks || tracksRes.data || []).map(t => t.artist || 'Unknown Artist')));
        setArtists(uniqueArtists);
      } catch (err) {
        setTracks([]);
        setArtists([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // No local search; use navbar search instead
  const filteredTracks = tracks;
  const filteredArtists = artists;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Library</Typography>
  {/* Search bar removed; use navbar search instead */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="h6" sx={{ mt: 2 }}>Artists</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {filteredArtists.map((artist, idx) => {
              // Use initials for avatar
              const initials = artist.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
              // Pick a color from a palette for each artist
              const colors = [
                'linear-gradient(135deg, #ffb6b9 0%, #fcdffb 100%)',
                'linear-gradient(135deg, #b5ead7 0%, #c7ceea 100%)',
                'linear-gradient(135deg, #f9d1b7 0%, #f6eac2 100%)',
                'linear-gradient(135deg, #c1c8e4 0%, #e2f0cb 100%)',
                'linear-gradient(135deg, #f7cac9 0%, #92a8d1 100%)',
                'linear-gradient(135deg, #ffe0ac 0%, #b5ead7 100%)',
                'linear-gradient(135deg, #ffdac1 0%, #b5ead7 100%)',
                'linear-gradient(135deg, #e2f0cb 0%, #b5ead7 100%)',
              ];
              const bg = colors[idx % colors.length];
              return (
                <Grid item xs={6} sm={4} md={3} key={artist + idx}>
                  <Card
                    sx={{
                      borderRadius: 4,
                      minHeight: 120,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(186,230,253,0.22) 100%)',
                      color: '#23272f',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      margin: '10px',
                      padding: '14px 0 10px 0',
                      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.13)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1.5px solid rgba(255,255,255,0.25)',
                      transition: 'transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s',
                      '&:before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        zIndex: 0,
                        background: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)',
                        opacity: 0.45,
                      },
                      '&:hover': {
                        transform: 'scale(1.045) translateY(-2px)',
                        boxShadow: '0 12px 36px 0 rgba(31, 38, 135, 0.18)',
                        border: '1.5px solid #a1c4fd',
                      },
                    }}
                  >
                    {/* Overlay for glassmorphic effect */}
                    <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }} />
                    <Box sx={{
                      mt: 1,
                      mb: 0.5,
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.72)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 21,
                      letterSpacing: 1,
                      boxShadow: '0 2px 8px rgba(161,196,253,0.13)',
                      zIndex: 1,
                    }}>
                      {initials}
                    </Box>
                    <CardContent sx={{ p: 0.5, textAlign: 'center', zIndex: 1 }}>
                      <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600, fontSize: 15, color: '#23272f' }}>{artist}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
            {filteredArtists.length === 0 && <Typography sx={{ ml: 2 }}>No artists found.</Typography>}
          </Grid>
          <Typography variant="h6">Tracks</Typography>
          <Grid container spacing={3}>
            {filteredTracks.map(track => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={track.id}>
                <TrackCard
                  track={track}
                  onPlay={() => playTrack(track, filteredTracks)}
                  showActions={true}
                />
              </Grid>
            ))}
            {filteredTracks.length === 0 && <Typography sx={{ ml: 2 }}>No tracks found.</Typography>}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Library;

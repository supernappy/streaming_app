import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Box, CircularProgress } from '@mui/material';
import { tracksAPI, roomsAPI } from '../services/api';
import ModernRoomCard from '../components/ModernRoomCard';
import TrackCard from '../components/TrackCard';


const Trending = () => {
  const [tracks, setTracks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tracksRes, roomsRes] = await Promise.all([
          tracksAPI.getAll({ sort: 'trending', limit: 20 }),
          roomsAPI.getAll({ is_active: true, limit: 6 })
        ]);
        setTracks(tracksRes.data.tracks || []);
        setRooms(roomsRes.data.rooms || []);
      } catch (e) {
        setTracks([]);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 3 }}>
        Trending Now
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Tracks</Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {tracks.length === 0 ? <Typography color="text.secondary">No trending tracks found.</Typography> : tracks.map(track => (
              <Grid item xs={12} sm={6} md={4} key={track.id}>
                <TrackCard
                  track={track}
                  showActions={true}
                />
              </Grid>
            ))}
          </Grid>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Active Rooms</Typography>
          <Grid container spacing={2}>
            {rooms.length === 0 ? <Typography color="text.secondary">No active rooms found.</Typography> : rooms.map(room => (
              <Grid item xs={12} sm={6} md={4} key={room.id}>
                <ModernRoomCard room={room} />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default Trending;

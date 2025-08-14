import React, { useEffect, useState } from 'react';
import { Container, Typography, Card, CardContent, Box, CircularProgress, Tooltip } from '@mui/material';
import { playlistsAPI } from '../services/api';
import AudioPlayer from '../components/AudioPlayer';


const CuratedPlaylist = () => {
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurated = async () => {
      setLoading(true);
      try {
        // Try to fetch a featured playlist, fallback to first public playlist
        const res = await playlistsAPI.getAll({ featured: true, limit: 1 });
        const list = res.data.playlists || [];
        if (list.length > 0) {
          const pl = await playlistsAPI.getById(list[0].id);
          setPlaylist(pl.data.playlist);
        } else {
          setPlaylist(null);
        }
      } catch (e) {
        setPlaylist(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCurated();
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 3 }}>
        Editor’s Pick: Curated Playlist
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : !playlist ? (
        <Typography color="text.secondary">No curated playlist found.</Typography>
      ) : (
        <Card sx={{ backgroundColor: '#1e1e1e', mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ color: '#fff' }}>{playlist.name}</Typography>
            <Typography variant="body2" color="text.secondary">{playlist.tracks?.length || 0} tracks • by {playlist.owner_username}</Typography>
            {playlist.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{playlist.description}</Typography>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
              {playlist.tracks?.length > 0 ? playlist.tracks.map((track, idx) => (
                <Tooltip key={track.id} title={track.play_count === 1 ? 'Played once' : `Played ${track.play_count || 0} times`} arrow>
                  <div>
                    <AudioPlayer track={track} compact={true} showIndex={idx + 1} />
                  </div>
                </Tooltip>
              )) : <Typography color="text.secondary">No tracks in this playlist.</Typography>}
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default CuratedPlaylist;

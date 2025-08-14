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
  IconButton,
  Chip
} from '@mui/material';
import { PlayArrow, Person, Album, MusicNote } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { usePlayer } from '../contexts/PlayerContext';
import Tooltip from '@mui/material/Tooltip';
import AudioPlayer from '../components/AudioPlayer';
import { formatNumberCompact } from '../utils/format';
import useSyncTrackCounts from '../hooks/useSyncTrackCounts';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [results, setResults] = useState({ tracks: [], artists: [], albums: [] });
  const [syncedTracks, setSyncedTracks] = useSyncTrackCounts(results.tracks);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const { playTrack, recentlyPlayed } = usePlayer ? usePlayer() : { playTrack: () => {}, recentlyPlayed: [] };

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      // Debug: log the full raw response from backend
      if (window && window.localStorage) {
        window.localStorage.setItem('search_raw_response', JSON.stringify(response.data));
      }
      console.log('DEBUG: Raw backend response:', response.data);
      const newResults = response.data.results || {};
      setResults({
        tracks: Array.isArray(newResults.tracks) ? newResults.tracks : [],
        artists: Array.isArray(newResults.artists) ? newResults.artists : [],
        albums: Array.isArray(newResults.albums) ? newResults.albums : [],
      });
    } catch (error) {
      console.error('Search error:', error);
  setResults({ tracks: [], artists: [], albums: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handlePlayTrack = (track) => {
  const trackList = syncedTracks || [];
  playTrack(track, trackList);
  };

  if (!query) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Enter a search term to find music
        </Typography>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography>Searching for "{query}"...</Typography>
      </Container>
    );
  }

  const tabs = [
    { label: 'All', icon: <MusicNote /> },
  { label: `Tracks (${(syncedTracks?.length) || 0})`, icon: <MusicNote /> },
    { label: `Artists (${results.artists?.length || 0})`, icon: <Person /> },
    { label: `Albums (${results.albums?.length || 0})`, icon: <Album /> }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4, mb: 10 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Search Results for "{query}"
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} icon={tab.icon} iconPosition="start" />
          ))}
        </Tabs>
      </Box>
      {/* All Results */}
      {activeTab === 0 && (
        <Box>
          {/* Top Tracks */}
          {syncedTracks && syncedTracks.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                Tracks
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {syncedTracks.slice(0, 6).map((track) => (
                  track.file_url && track.file_url.toLowerCase().endsWith('.mp4') ? (
                    <Card key={track.id} sx={{ backgroundColor: '#1e1e1e', color: 'white', mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1">{track.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{track.artist}</Typography>
                        <Typography variant="caption" color="text.secondary">Video</Typography>
                        <Box sx={{ mt: 1 }}>
                          <video src={track.file_url} controls style={{ width: '100%', maxWidth: 320, borderRadius: 8 }} />
                        </Box>
                      </CardContent>
                    </Card>
                  ) : (
                    <Tooltip key={track.id} title={track.play_count === 1 ? 'Played once' : `Played ${track.play_count || 0} times`} arrow>
                      <div>
                        <AudioPlayer 
                          track={track} 
                          onPlay={(track) => handlePlayTrack(track)}
                          compact={true}
                        />
                      </div>
                    </Tooltip>
                  )
                ))}
              </Box>
            </Box>
          )}

          {/* Top Artists */}
          {results.artists && results.artists.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                Artists
              </Typography>
              <Grid container spacing={2}>
                {results.artists.slice(0, 4).map((artist, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card sx={{ backgroundColor: '#1e1e1e', textAlign: 'center' }}>
                      <CardContent>
                        <Person sx={{ fontSize: 48, color: '#1DB954', mb: 1 }} />
                        <Typography variant="h6">{artist.artist}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {artist.track_count} tracks • {formatNumberCompact(artist.total_plays)} plays
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      )}

      {/* Tracks Tab */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {syncedTracks && syncedTracks.length > 0 ? (
            syncedTracks.map((track) => (
              track.file_url && track.file_url.toLowerCase().endsWith('.mp4') ? (
                <Card key={track.id} sx={{ backgroundColor: '#1e1e1e', color: 'white', mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1">{track.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{track.artist}</Typography>
                    <Typography variant="caption" color="text.secondary">Video</Typography>
                    <Box sx={{ mt: 1 }}>
                      <video src={track.file_url} controls style={{ width: '100%', maxWidth: 320, borderRadius: 8 }} />
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <Tooltip key={track.id} title={track.play_count === 1 ? 'Played once' : `Played ${track.play_count || 0} times`} arrow>
                  <div>
                    <AudioPlayer 
                      track={track} 
                      onPlay={(track) => handlePlayTrack(track)}
                      compact={true}
                    />
                  </div>
                </Tooltip>
              )
            ))
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No tracks found for "{query}"
            </Typography>
          )}
        </Box>
      )}

      {/* Artists Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          {results.artists && results.artists.length > 0 ? (
            results.artists.map((artist, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ backgroundColor: '#1e1e1e', textAlign: 'center' }}>
                  <CardContent>
                    <Person sx={{ fontSize: 64, color: '#1DB954', mb: 2 }} />
                    <Typography variant="h5">{artist.artist}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {artist.track_count} tracks
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatNumberCompact(artist.total_plays)} total plays
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
                No artists found for "{query}"
              </Typography>
            </Grid>
          )}
        </Grid>
      )}

      {/* Albums Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          {results.albums && results.albums.length > 0 ? (
            results.albums.map((album, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ backgroundColor: '#1e1e1e' }}>
                  <CardContent>
                    <Album sx={{ fontSize: 48, color: '#1DB954', mb: 2 }} />
                    <Typography variant="h6">{album.album}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      by {album.artist}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {album.track_count} tracks • {formatNumberCompact(album.total_plays)} plays
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
                No albums found for "{query}"
              </Typography>
            </Grid>
          )}
        </Grid>
      )}
      {/* Recently Played Section */}
      {recentlyPlayed && recentlyPlayed.length > 0 && (
        <Box sx={{ mt: 6, mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            Recently Played
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
            {recentlyPlayed.slice(0, 8).map((track) => (
              <Tooltip key={track.id} title={track.play_count === 1 ? 'Played once' : `Played ${track.play_count || 0} times`} arrow>
                <div style={{ minWidth: 220, flex: '1 0 220px' }}>
                  <AudioPlayer 
                    track={track} 
                    onPlay={(track) => handlePlayTrack(track)}
                    compact={true}
                  />
                </div>
              </Tooltip>
            ))}
          </Box>
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

export default Search;

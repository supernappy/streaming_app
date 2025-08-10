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
  Chip,
  Button,
  TextField,
  InputAdornment,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Paper
} from '@mui/material';
import { 
  PlayArrow, 
  Person, 
  Album, 
  MusicNote, 
  Search,
  Psychology,
  AutoAwesome,
  TrendingUp,
  Explore,
  FilterList,
  Clear
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { formatPlays } from '../utils/format';
import { usePlayer } from '../contexts/PlayerContext';
import AudioPlayer from '../components/AudioPlayer';
import useSyncTrackCounts from '../hooks/useSyncTrackCounts';

const AIEnhancedSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);
  const [results, setResults] = useState({});
  const [aiResults, setAiResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [aiMode, setAiMode] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const { playTrack } = usePlayer();
  const [syncedTraditional, setSyncedTraditional] = useSyncTrackCounts([]);
  const [syncedAIExact, setSyncedAIExact] = useSyncTrackCounts([]);
  const [syncedAIHigh, setSyncedAIHigh] = useSyncTrackCounts([]);
  const [syncedAIMediumRelated, setSyncedAIMediumRelated] = useSyncTrackCounts([]);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  useEffect(() => {
    if (searchInput && searchInput.length > 2) {
      fetchSuggestions(searchInput);
    } else {
      setSuggestions([]);
    }
  }, [searchInput]);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      if (aiMode) {
        // AI-Enhanced Search
  const aiResponse = await axios.get(`/api/ai/search?q=${encodeURIComponent(searchQuery)}&limit=50`);
  const aiRes = aiResponse.data.aiResults;
  setAiResults(aiRes);
  setResults({ tracks: aiResponse.data.traditionalResults || [] });
  setSyncedTraditional(aiResponse.data.traditionalResults || []);
  setSyncedAIExact(aiRes?.categorized?.exact || []);
  setSyncedAIHigh(aiRes?.categorized?.high || []);
  setSyncedAIMediumRelated([...(aiRes?.categorized?.medium || []), ...(aiRes?.categorized?.related || [])]);
      } else {
        // Traditional Search
  const response = await axios.get(`/api/search?q=${encodeURIComponent(searchQuery)}`);
  setResults(response.data.results);
  setSyncedTraditional(response.data.results?.tracks || []);
        setAiResults(null);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (searchQuery) => {
    try {
      const response = await axios.get(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Suggestions error:', error);
    }
  };

  const handleSearch = (searchQuery = searchInput) => {
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
      performSearch(searchQuery.trim());
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handlePlayTrack = (track) => {
    const trackList = aiMode && aiResults 
      ? [...(syncedAIExact || []), ...(syncedAIHigh || []), ...(syncedAIMediumRelated || [])]
      : (syncedTraditional || []);
    playTrack(track, trackList);
  };

  const applySuggestion = (suggestion) => {
    setSearchInput(suggestion.suggestion);
    handleSearch(suggestion.suggestion);
    setSuggestions([]);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchParams({});
    setResults({});
    setAiResults(null);
    setSuggestions([]);
  };

  const renderAIResults = () => {
    if (!aiResults) return null;

    const { categorized, totalResults, suggestions: aiSuggestions } = aiResults;

    return (
      <Box>
        {/* AI Search Stats */}
        <Paper sx={{ bgcolor: '#1a1a1a', p: 3, mb: 3, border: '1px solid #667eea' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Psychology sx={{ color: '#667eea', mr: 2, fontSize: 32 }} />
              <Box>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  AI Enhanced Results
                </Typography>
                <Typography variant="body2" sx={{ color: '#ccc' }}>
                  Found {totalResults} results with intelligent matching
                </Typography>
              </Box>
            </Box>
            <Chip 
              label="AI Powered" 
              sx={{ bgcolor: '#667eea', color: 'white' }}
              icon={<AutoAwesome />}
            />
          </Box>

          {aiSuggestions && aiSuggestions.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ color: '#667eea', mb: 1 }}>
                AI Suggestions:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {aiSuggestions.map((suggestion, index) => (
                  <Chip
                    key={index}
                    label={suggestion}
                    size="small"
                    onClick={() => handleSearch(suggestion)}
                    sx={{ 
                      bgcolor: '#2a2a2a', 
                      color: '#ccc',
                      '&:hover': { bgcolor: '#667eea', color: 'white' }
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Paper>

        {/* Exact Matches */}
        {categorized.exact && categorized.exact.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
              <TrendingUp sx={{ mr: 1, color: '#4caf50' }} />
              Perfect Matches ({categorized.exact.length})
            </Typography>
            <Grid container spacing={2}>
              {categorized.exact.map((track) => (
                <Grid item xs={12} key={track.id}>
                  <Card sx={{ 
                    bgcolor: '#1e1e1e',
                    border: '2px solid #4caf50',
                    '&:hover': { bgcolor: '#2a2a2a' }
                  }}>
                    <CardContent sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip 
                          label={`${Math.round(track.relevanceScore * 100)}% match`}
                          size="small"
                          sx={{ bgcolor: '#4caf50', color: 'white' }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ color: 'white' }}>
                            {track.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            by {track.artist} • {track.genre}
                          </Typography>
                        </Box>
                        <IconButton
                          onClick={() => handlePlayTrack(track)}
                          sx={{ color: '#4caf50' }}
                        >
                          <PlayArrow />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* High Relevance */}
        {categorized.high && categorized.high.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
              <Psychology sx={{ mr: 1, color: '#667eea' }} />
              High Relevance ({categorized.high.length})
            </Typography>
            <Grid container spacing={2}>
              {categorized.high.slice(0, 10).map((track) => (
                <Grid item xs={12} sm={6} key={track.id}>
                  <Card sx={{ 
                    bgcolor: '#1e1e1e',
                    border: '1px solid #667eea',
                    '&:hover': { bgcolor: '#2a2a2a' }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Chip 
                          label={`${Math.round(track.relevanceScore * 100)}% match`}
                          size="small"
                          sx={{ bgcolor: '#667eea', color: 'white' }}
                        />
                        <IconButton
                          onClick={() => handlePlayTrack(track)}
                          sx={{ color: '#667eea' }}
                        >
                          <PlayArrow />
                        </IconButton>
                      </Box>
                      <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                        {track.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        by {track.artist}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888' }}>
                        {track.genre} • {formatPlays(track.play_count || 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Medium & Related */}
        {(categorized.medium?.length > 0 || categorized.related?.length > 0) && (
          <Box>
            <Typography variant="h5" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
              <Explore sx={{ mr: 1, color: '#ff9800' }} />
              You Might Also Like
            </Typography>
            <Grid container spacing={2}>
              {[...(categorized.medium || []), ...(categorized.related || [])]
                .slice(0, 8)
                .map((track) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={track.id}>
                  <Card sx={{ 
                    bgcolor: '#1e1e1e',
                    '&:hover': { bgcolor: '#2a2a2a', transform: 'translateY(-2px)' },
                    transition: 'all 0.2s ease'
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'white', mb: 1, fontSize: '1rem' }}>
                        {track.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                        {track.artist}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip 
                          label={track.genre || 'Unknown'}
                          size="small"
                          variant="outlined"
                          sx={{ color: '#ccc', borderColor: '#555' }}
                        />
                        <IconButton
                          onClick={() => handlePlayTrack(track)}
                          sx={{ color: '#ff9800' }}
                        >
                          <PlayArrow />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    );
  };

  const renderTraditionalResults = () => {
  if (!syncedTraditional || syncedTraditional.length === 0) return null;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
  {syncedTraditional.map((track) => (
          <AudioPlayer 
            key={track.id} 
            track={track} 
            onPlay={(track) => handlePlayTrack(track)}
            compact={true}
          />
        ))}
      </Box>
    );
  };

  const tabs = [
    { 
      label: aiMode ? 'AI Results' : 'All Results', 
      icon: aiMode ? <Psychology /> : <MusicNote />,
      count: aiMode ? (aiResults?.totalResults || 0) : (results.tracks?.length || 0)
    },
    { label: `Artists`, icon: <Person />, count: results.artists?.length || 0 },
    { label: `Albums`, icon: <Album />, count: results.albums?.length || 0 }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4, mb: 10 }}>
      {/* Enhanced Search Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'white' }}>
          {aiMode ? 'AI-Powered Search' : 'Music Search'}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
          <TextField
            fullWidth
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={aiMode ? "Search with AI intelligence..." : "Search tracks, artists, albums..."}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {aiMode ? <Psychology sx={{ color: '#667eea' }} /> : <Search sx={{ color: '#ccc' }} />}
                </InputAdornment>
              ),
              endAdornment: searchInput && (
                <InputAdornment position="end">
                  <IconButton onClick={clearSearch} sx={{ color: '#ccc' }}>
                    <Clear />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#1e1e1e',
                '& fieldset': { borderColor: aiMode ? '#667eea' : '#555' },
                '&:hover fieldset': { borderColor: aiMode ? '#764ba2' : '#777' },
                '&.Mui-focused fieldset': { borderColor: aiMode ? '#667eea' : '#999' }
              },
              '& .MuiInputBase-input': { color: 'white' }
            }}
          />
          
          <Button
            variant="contained"
            onClick={() => handleSearch()}
            disabled={loading || !searchInput.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <Search />}
            sx={{ 
              bgcolor: '#667eea',
              minWidth: 120,
              '&:hover': { bgcolor: '#764ba2' }
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </Box>

        {/* AI Mode Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            variant={aiMode ? "contained" : "outlined"}
            startIcon={<Psychology />}
            onClick={() => setAiMode(true)}
            sx={{
              bgcolor: aiMode ? '#667eea' : 'transparent',
              borderColor: '#667eea',
              color: aiMode ? 'white' : '#667eea',
              '&:hover': { 
                bgcolor: aiMode ? '#764ba2' : 'rgba(102, 126, 234, 0.1)',
                borderColor: '#764ba2'
              }
            }}
          >
            AI Search
          </Button>
          <Button
            variant={!aiMode ? "contained" : "outlined"}
            startIcon={<FilterList />}
            onClick={() => setAiMode(false)}
            sx={{
              bgcolor: !aiMode ? '#667eea' : 'transparent',
              borderColor: '#667eea',
              color: !aiMode ? 'white' : '#667eea',
              '&:hover': { 
                bgcolor: !aiMode ? '#764ba2' : 'rgba(102, 126, 234, 0.1)',
                borderColor: '#764ba2'
              }
            }}
          >
            Traditional
          </Button>
          {aiMode && (
            <Tooltip title="AI Search uses machine learning to understand context and find better matches">
              <Chip 
                label="Beta"
                size="small"
                sx={{ bgcolor: '#ffd700', color: '#000' }}
              />
            </Tooltip>
          )}
        </Box>

        {/* Search Suggestions */}
        {suggestions.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#ccc', mb: 1 }}>
              Suggestions:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {suggestions.slice(0, 6).map((suggestion, index) => (
                <Chip
                  key={index}
                  label={suggestion.suggestion}
                  size="small"
                  onClick={() => applySuggestion(suggestion)}
                  sx={{ 
                    bgcolor: '#2a2a2a', 
                    color: '#ccc',
                    '&:hover': { bgcolor: '#667eea', color: 'white', cursor: 'pointer' }
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      {/* Results */}
      {!query && !searchInput && (
        <Card sx={{ bgcolor: '#1e1e1e', textAlign: 'center', py: 8 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Psychology sx={{ fontSize: 80, color: '#667eea' }} />
            </Box>
            <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
              {aiMode ? 'AI-Powered Music Discovery' : 'Search for Music'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
              {aiMode 
                ? 'Experience intelligent search that understands context, mood, and musical relationships to find exactly what you\'re looking for.'
                : 'Search for tracks, artists, and albums across our entire music library.'
              }
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="outlined"
                onClick={() => handleSearch('chill music')}
                sx={{ borderColor: '#667eea', color: '#667eea' }}
              >
                Try "chill music"
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleSearch('upbeat electronic')}
                sx={{ borderColor: '#667eea', color: '#667eea' }}
              >
                Try "upbeat electronic"
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress sx={{ color: '#667eea' }} />
          <Typography sx={{ mt: 2, color: '#ccc' }}>
            {aiMode ? '🤖 AI is analyzing your search...' : 'Searching...'}
          </Typography>
        </Box>
      )}

      {!loading && query && (
        <Box>
          {/* Search Results Header */}
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'white', mb: 3 }}>
            {aiMode ? 'AI Results' : 'Search Results'} for "{query}"
          </Typography>

          {/* Results Content */}
          {aiMode ? renderAIResults() : renderTraditionalResults()}

          {/* No Results */}
          {((aiMode && aiResults && aiResults.totalResults === 0) || 
            (!aiMode && results.tracks && results.tracks.length === 0)) && (
            <Card sx={{ bgcolor: '#1e1e1e', textAlign: 'center', py: 6 }}>
              <CardContent>
                <MusicNote sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#ccc', mb: 2 }}>
                  No results found for "{query}"
                </Typography>
                <Typography variant="body2" sx={{ color: '#888', mb: 3 }}>
                  Try different keywords or check your spelling
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setAiMode(!aiMode)}
                  sx={{ borderColor: '#667eea', color: '#667eea' }}
                >
                  Try {aiMode ? 'Traditional' : 'AI'} Search
                </Button>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Container>
  );
};

export default AIEnhancedSearch;

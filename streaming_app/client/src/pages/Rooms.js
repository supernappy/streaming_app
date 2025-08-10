import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Tab,
  Tabs,
  IconButton,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Fab,
  Zoom,
  Paper,
  Divider,
  LinearProgress,
  Stack,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Autocomplete
} from '@mui/material';
import { 
  Add, 
  People, 
  Mic, 
  TrendingUp,
  Schedule,
  Star,
  FilterList,
  Search,
  Visibility,
  PanTool,
  RecordVoiceOver,
  Language,
  Public,
  Lock,
  AccessTime,
  EmojiEvents,
  Favorite,
  FavoriteBorder,
  Share,
  Bookmark,
  BookmarkBorder,
  LiveTv,
  CalendarToday,
  PersonAdd,
  VolumeUp,
  Whatshot,
  AutoAwesome,
  Psychology,
  MusicNote,
  Business,
  School,
  SportsEsports,
  LocalMovies,
  Spa,
  FitnessCenter,
  MicNone
} from '@mui/icons-material';
import { roomsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import EnhancedRoomCard from '../components/EnhancedRoomCard';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [followedRooms, setFollowedRooms] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  
  const [newRoom, setNewRoom] = useState({
    title: '',
    description: '',
    category: '',
    mood: '',
    max_participants: 100,
    is_private: false,
    room_type: 'audio',
    background_theme: 'default',
    language: 'en',
    tags: [],
    scheduled_start: '',
    estimated_duration: 60,
    welcome_message: '',
    allow_recording: true,
    auto_moderation: false
  });

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const categories = [
    'Music & Audio',
    'Business & Tech', 
    'Education',
    'Gaming',
    'Entertainment',
    'Wellness & Health',
    'Fitness',
    'Social & Casual'
  ];

  const moods = [
    'Energetic',
    'Chill & Relaxed',
    'Focused & Productive', 
    'Creative & Inspiring',
    'Social & Fun',
    'Learning & Growth',
    'Supportive & Caring'
  ];

  const themes = [
    'Default',
    'Sunset',
    'Ocean', 
    'Forest',
    'Cosmic',
    'Neon'
  ];

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await roomsAPI.getAll();
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoom.title.trim()) {
      alert('Please enter a room title.');
      return;
    }

    if (!isAuthenticated) {
      alert('You must be logged in to create a room.');
      navigate('/login');
      return;
    }

    try {
      console.log('Creating room with data:', newRoom);
      console.log('Auth token present:', !!localStorage.getItem('token'));
      
      const response = await roomsAPI.create(newRoom);
      console.log('Room created successfully:', response.data);
      
      setCreateDialogOpen(false);
      setNewRoom({
        title: '',
        description: '',
        category: '',
        mood: '',
        max_participants: 100,
        is_private: false,
        room_type: 'audio',
        background_theme: 'default',
        language: 'en',
        tags: [],
        scheduled_start: '',
        estimated_duration: 60,
        welcome_message: '',
        allow_recording: true,
        auto_moderation: false
      });
      fetchRooms(); // Refresh the rooms list
      
      alert('Room created successfully!');
    } catch (error) {
      console.error('Error creating room:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Failed to create room. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to create rooms.';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.error || 'Invalid room data provided.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        // Other error
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
      
      alert(errorMessage);
    }
  };

  const handleJoinRoom = async (roomId) => {
    if (!isAuthenticated) {
      alert('You must be logged in to join a room.');
      navigate('/login');
      return;
    }

    try {
      console.log('Joining room:', roomId);
      console.log('Auth token present:', !!localStorage.getItem('token'));
      
      const response = await roomsAPI.join(roomId);
      console.log('Room join response:', response.data);
      
      // Check if user was already joined
      if (response.data.alreadyJoined) {
        console.log('User was already in the room - entering...');
      } else {
        console.log('Successfully joined room:', roomId);
      }
      
      // Navigate to room regardless of whether they just joined or were already in
      navigate(`/rooms/${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Failed to join room. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to join this room.';
        } else if (error.response.status === 404) {
          errorMessage = 'Room not found or is no longer active.';
        } else if (error.response.status === 400) {
          const errorData = error.response.data?.error || 'Cannot join room.';
          // Handle specific case of room being full
          if (errorData.includes('full')) {
            errorMessage = 'This room is currently full. Please try again later.';
          } else {
            errorMessage = errorData;
          }
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        // Other error
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
      
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography>Loading rooms...</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      pb: 10
    }}>
      {/* Hero Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        py: 6,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)',
          animation: 'pulse 4s ease-in-out infinite',
        }
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h2" component="h1" sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #fff 30%, #f0f8ff 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              Discover Audio Rooms
            </Typography>
            <Typography variant="h5" sx={{ 
              color: 'rgba(255,255,255,0.9)', 
              mb: 4,
              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}>
              Join conversations that spark your imagination
            </Typography>
            
            {/* Stats */}
            <Grid container spacing={4} justifyContent="center" sx={{ mb: 4 }}>
              <Grid item>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                    {rooms.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Active Rooms
                  </Typography>
                </Box>
              </Grid>
              <Grid item>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                    {rooms.reduce((total, room) => total + (room.participant_count || 0), 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    People Connected
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {isAuthenticated && (
              <Button
                variant="contained"
                size="large"
                startIcon={<Add />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{
                  background: 'linear-gradient(45deg, #1DB954 30%, #1ed760 90%)',
                  py: 1.5,
                  px: 4,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  boxShadow: '0 8px 25px rgba(29, 185, 84, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1ed760 30%, #17c653 90%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 35px rgba(29, 185, 84, 0.4)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Create Your Room
              </Button>
            )}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Enhanced Controls */}
        <Paper sx={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: 4,
          p: 3,
          mb: 4,
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search rooms..."
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: 'rgba(255,255,255,0.7)', mr: 1 }} />,
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#1DB954' },
                    },
                    '& .MuiInputBase-input': { color: '#fff' },
                    '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.7)' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  displayEmpty
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1DB954' },
                    '& .MuiSelect-select': { color: '#fff' },
                    '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.7)' }
                  }}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <Select
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  displayEmpty
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1DB954' },
                    '& .MuiSelect-select': { color: '#fff' },
                    '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.7)' }
                  }}
                >
                  <MenuItem value="">All Moods</MenuItem>
                  {moods.map((mood) => (
                    <MenuItem key={mood} value={mood}>{mood}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSelectedMood('');
                  setSelectedTheme('');
                }}
                sx={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#fff',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.5)',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Theme Selection */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 'bold' }}>
            Browse by Theme
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {themes.map((theme) => (
              <Chip
                key={theme}
                label={theme}
                onClick={() => setSelectedTheme(selectedTheme === theme ? '' : theme)}
                variant={selectedTheme === theme ? 'filled' : 'outlined'}
                sx={{
                  color: selectedTheme === theme ? '#000' : '#fff',
                  backgroundColor: selectedTheme === theme ? '#1DB954' : 'transparent',
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': {
                    backgroundColor: selectedTheme === theme ? '#1ed760' : 'rgba(255,255,255,0.1)',
                    borderColor: 'rgba(255,255,255,0.5)'
                  },
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Tabbed Navigation */}
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            mb: 4,
            '& .MuiTabs-indicator': { backgroundColor: '#1DB954' },
            '& .MuiTab-root': { 
              color: 'rgba(255,255,255,0.7)',
              '&.Mui-selected': { color: '#1DB954' }
            }
          }}
        >
          <Tab label="All Rooms" />
          <Tab label="Popular" />
          <Tab label="Recent" />
          <Tab label="Live Now" />
        </Tabs>

        {/* Enhanced Room Grid */}
        {rooms.length > 0 ? (
          <Grid container spacing={3}>
            {rooms
              .filter(room => {
                const matchesSearch = room.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    room.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    room.host_username.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCategory = !selectedCategory || room.category === selectedCategory;
                const matchesMood = !selectedMood || room.mood === selectedMood;
                const matchesTheme = !selectedTheme || room.themes?.includes(selectedTheme);
                
                return matchesSearch && matchesCategory && matchesMood && matchesTheme;
              })
              .map((room) => (
                <Grid item xs={12} sm={6} lg={4} key={room.id}>
                  <EnhancedRoomCard 
                    room={room} 
                    onJoin={() => handleJoinRoom(room.id)}
                    isAuthenticated={isAuthenticated}
                  />
                </Grid>
              ))}
          </Grid>
        ) : (
          <Paper sx={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            p: 8,
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <MicNone sx={{ fontSize: 80, color: 'rgba(255,255,255,0.5)', mb: 2 }} />
            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 'bold' }}>
              No Rooms Found
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4 }}>
              Be the pioneer of conversations - create the first room!
            </Typography>
            {isAuthenticated && (
              <Button
                variant="contained"
                size="large"
                startIcon={<Add />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{
                  background: 'linear-gradient(45deg, #1DB954 30%, #1ed760 90%)',
                  py: 1.5,
                  px: 4,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  boxShadow: '0 8px 25px rgba(29, 185, 84, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1ed760 30%, #17c653 90%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 35px rgba(29, 185, 84, 0.4)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Create First Room
              </Button>
            )}
          </Paper>
        )}

        {/* Enhanced Create Room Dialog */}
        <Dialog 
          open={createDialogOpen} 
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(50, 50, 50, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: 4,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <DialogTitle sx={{ 
            color: '#fff', 
            fontSize: '1.5rem', 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #1DB954 30%, #1ed760 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Create Your Audio Room
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  autoFocus
                  label="Room Title"
                  fullWidth
                  variant="outlined"
                  value={newRoom.title}
                  onChange={(e) => setNewRoom({ ...newRoom, title: e.target.value })}
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
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Category</InputLabel>
                  <Select
                    value={newRoom.category || ''}
                    onChange={(e) => setNewRoom({ ...newRoom, category: e.target.value })}
                    label="Category"
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1DB954' },
                      '& .MuiSelect-select': { color: '#fff' },
                      '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.7)' }
                    }}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Mood</InputLabel>
                  <Select
                    value={newRoom.mood || ''}
                    onChange={(e) => setNewRoom({ ...newRoom, mood: e.target.value })}
                    label="Mood"
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1DB954' },
                      '& .MuiSelect-select': { color: '#fff' },
                      '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.7)' }
                    }}
                  >
                    {moods.map((mood) => (
                      <MenuItem key={mood} value={mood}>{mood}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Max Participants"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={newRoom.max_participants}
                  onChange={(e) => setNewRoom({ ...newRoom, max_participants: parseInt(e.target.value) })}
                  inputProps={{ min: 2, max: 1000 }}
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={newRoom.is_private || false}
                      onChange={(e) => setNewRoom({ ...newRoom, is_private: e.target.checked })}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#1DB954' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#1DB954' }
                      }}
                    />
                  }
                  label={<Typography sx={{ color: '#fff' }}>Private Room</Typography>}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => setCreateDialogOpen(false)}
              sx={{ color: 'rgba(255,255,255,0.7)' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRoom} 
              variant="contained"
              disabled={!newRoom.title}
              sx={{
                background: 'linear-gradient(45deg, #1DB954 30%, #1ed760 90%)',
                px: 3,
                py: 1,
                fontWeight: 'bold',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1ed760 30%, #17c653 90%)',
                },
                '&:disabled': {
                  background: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.3)'
                }
              }}
            >
              Create Room
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Rooms;

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Paper,
  IconButton,
  Chip,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  Badge,
  Stack,
  Switch,
  FormControlLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  MusicNote,
  QueueMusic,
  Favorite,
  PlayArrow,
  Share,
  CloudUpload,
  BarChart,
  TrendingUp,
  People,
  Star,
  Visibility,
  Settings,
  Security,
  Notifications,
  Delete,
  Psychology,
  AutoAwesome,
  Lightbulb,
  Analytics
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AvatarUploadDialog from '../components/AvatarUploadDialog';
import AIRecommendations from '../components/AIRecommendations';
import axios from 'axios';
import api from '../services/api';
import useSyncTrackCounts from '../hooks/useSyncTrackCounts';
import { formatPlays, formatNumberCompact } from '../utils/format';
import { usePlayer } from '../contexts/PlayerContext';
// import Tooltip from '@mui/material/Tooltip';

// Configure axios
axios.defaults.baseURL = 'http://localhost:5002';
axios.defaults.withCredentials = true;
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Clean, simple input component that never loses focus
const CleanInput = ({ label, value, onChange, disabled = false, multiline = false, placeholder = "", type = "text" }) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        color: disabled ? '#888' : '#667eea',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          rows={4}
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid rgba(102, 126, 234, 0.3)',
            borderRadius: '8px',
            backgroundColor: disabled ? '#2a2a2a' : '#1a1a1a',
            color: disabled ? '#888' : '#ffffff',
            fontSize: '16px',
            fontFamily: 'inherit',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(102, 126, 234, 0.3)'}
        />
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid rgba(102, 126, 234, 0.3)',
            borderRadius: '8px',
            backgroundColor: disabled ? '#2a2a2a' : '#1a1a1a',
            color: disabled ? '#888' : '#ffffff',
            fontSize: '16px',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(102, 126, 234, 0.3)'}
        />
      )}
    </div>
  );
};

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { playTrack, recentlyPlayed } = usePlayer ? usePlayer() : { playTrack: () => {}, recentlyPlayed: [] };
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  // Profile data
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    display_name: '',
    bio: '',
    avatar_url: '',
    location: '',
    website: '',
    social_links: {
      twitter: '',
      instagram: '',
      soundcloud: '',
      spotify: ''
    }
  });
  
  // Stats
  const [stats, setStats] = useState({
    tracksUploaded: 0,
    totalPlays: 0,
    totalLikes: 0,
    followers: 0,
    following: 0,
    playlistsCreated: 0
  });
  
  // User content
  const [userTracks, setUserTracks] = useState([]);
  // Memoize userTracks to avoid passing a new array to useSyncTrackCounts on every render
  const memoizedUserTracks = useMemo(() => userTracks, [userTracks]);
  const [syncedUserTracks, setSyncedUserTracks] = useSyncTrackCounts(memoizedUserTracks);
  const [userPlaylists, setUserPlaylists] = useState([]);
  
  // AI Enhancement state
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiAnalysisDialog, setAiAnalysisDialog] = useState(false);
  
  // Dialog states
  const [avatarUploadDialog, setAvatarUploadDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [notificationsDialog, setNotificationsDialog] = useState(false);
  const [privacyDialog, setPrivacyDialog] = useState(false);
  
  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    trackLikes: true,
    newFollowers: true,
    roomInvites: true,
    trackComments: false
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showLocation: true,
    allowDirectMessages: true,
    showOnlineStatus: false,
    showListeningActivity: true
  });

  // Load profile data on mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  // Fetch AI enhancement suggestions when profile loads
  // Only run fetchAIEnhancements when user or profile.username changes, but ensure it does not update profile.username
  // AI enhancement suggestions are disabled due to missing backend endpoint
  // useEffect(() => {
  //   if (user && profile.username) {
  //     fetchAIEnhancements();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [user, profile.username]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch profile
      const profileResponse = await axios.get('/api/users/profile');
      const userData = profileResponse.data.user;
      
      // Fetch tracks
      const tracksResponse = await axios.get('/api/tracks?limit=50');
      const userTracksData = tracksResponse.data.tracks?.filter(track => track.user_id === userData.id) || [];
      
      // Fetch playlists
      const playlistsResponse = await axios.get('/api/playlists');
      const userPlaylistsData = playlistsResponse.data.playlists || [];
      
      // Update profile state
      setProfile({
        username: userData.username || '',
        email: userData.email || '',
        display_name: userData.display_name || userData.username || '',
        bio: userData.bio || '',
        avatar_url: userData.avatar_url || '',
        location: userData.location || '',
        website: userData.website || '',
        social_links: {
          twitter: userData.twitter || '',
          instagram: userData.instagram || '',
          soundcloud: userData.soundcloud || '',
          spotify: userData.spotify || ''
        }
      });
      
      // Update stats
      const totalPlays = userTracksData.reduce((total, track) => total + (track.play_count || 0), 0);
      setStats({
        tracksUploaded: userTracksData.length,
        totalPlays: totalPlays,
        totalLikes: 0,
        followers: 0,
        following: 0,
        playlistsCreated: userPlaylistsData.length
      });
      
  setUserTracks(userTracksData);
  setSyncedUserTracks(userTracksData);
      setUserPlaylists(userPlaylistsData);
      
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setError('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch AI enhancement suggestions
  // const fetchAIEnhancements = async () => {};

  // Apply AI bio suggestion
  const applyAIBioSuggestion = (suggestion) => {
    setProfile(prev => ({ ...prev, bio: suggestion }));
    setEditMode(true);
    setSuccess('AI suggestion applied! Don\'t forget to save your changes.');
  };

  // Analyze track with AI
  const analyzeTrackWithAI = async (track) => {
    try {
      setLoadingAI(true);
  const response = await api.post('/ai/track/analyze', {
        trackData: {
          title: track.title,
          artist: track.artist || user?.username || 'Unknown Artist',
          genre: track.genre,
          duration: track.duration,
          id: track.id
        }
      });
      
      if (response.data.analysis) {
        setSuccess(`AI Analysis complete for "${track.title}"! ${response.data.insights?.mood ? `Detected mood: ${response.data.insights.mood}` : ''}`);
        // Refresh tracks to get updated AI data
        fetchProfileData();
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      setError(error.response?.data?.error || 'Failed to analyze track with AI');
    } finally {
      setLoadingAI(false);
    }
  };

  // Simple handlers without complex logic
  const handleFieldChange = (field, event) => {
    const value = event.target.value;
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialLinkChange = (platform, event) => {
    const value = event.target.value;
    setProfile(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value
      }
    }));
  };

  const handlePasswordFieldChange = (field, event) => {
    const value = event.target.value;
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  };

  const handleProfileUpdate = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const updateData = {
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        location: profile.location,
        website: profile.website,
        twitter: profile.social_links.twitter,
        instagram: profile.social_links.instagram,
        soundcloud: profile.social_links.soundcloud,
        spotify: profile.social_links.spotify
      };
      
      const response = await axios.put('/api/users/profile', updateData);
      
      if (response.data.user) {
        updateUser(response.data.user);
        setSuccess('Profile updated successfully!');
        setEditMode(false);
      }
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setSaving(true);
      await axios.put('/api/users/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setSuccess('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordDialog(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpdate = async (newAvatarUrl) => {
    try {
      setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));
      
      const response = await axios.put('/api/users/profile', {
        avatar_url: newAvatarUrl
      });
      
      if (response.data.user) {
        updateUser(response.data.user);
        setSuccess('Profile picture updated successfully!');
      }
      
    } catch (error) {
      console.error('Error updating avatar:', error);
      setError('Failed to update profile picture. Please try again.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2, color: '#ccc' }}>Loading profile...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, mb: 10 }}>
      {/* Profile Header */}
      <Paper 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '24px',
          p: 4,
          mb: 4,
          color: 'white'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <IconButton
                  size="small"
                  onClick={() => setAvatarUploadDialog(true)}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                  }}
                >
                  <PhotoCamera fontSize="small" />
                </IconButton>
              }
            >
              <Avatar
                src={profile.avatar_url?.startsWith('gradient:') ? undefined : profile.avatar_url}
                sx={{ 
                  width: 120, 
                  height: 120,
                  border: '4px solid rgba(255,255,255,0.3)',
                  fontSize: '3rem',
                  background: profile.avatar_url?.startsWith('gradient:') 
                    ? profile.avatar_url.replace('gradient:', '') 
                    : undefined
                }}
              >
                {profile.display_name?.charAt(0)?.toUpperCase() || profile.username?.charAt(0)?.toUpperCase()}
              </Avatar>
            </Badge>
          </Grid>
          
          <Grid item xs>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {profile.display_name || profile.username}
              </Typography>
              <Chip 
                label="Artist" 
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white'
                }}
              />
            </Box>
            
            <Typography variant="h6" sx={{ opacity: 0.8, mb: 2 }}>
              @{profile.username}
            </Typography>
            
            {profile.bio && (
              <Typography variant="body1" sx={{ mb: 2, maxWidth: 600 }}>
                {profile.bio}
              </Typography>
            )}
            
            <Stack direction="row" spacing={4}>
              <Box textAlign="center">
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {stats.tracksUploaded}
                </Typography>
                <Typography variant="caption">Tracks</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {formatNumberCompact(stats.totalPlays)}
                </Typography>
                <Typography variant="caption">Plays</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {stats.followers}
                </Typography>
                <Typography variant="caption">Followers</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {stats.following}
                </Typography>
                <Typography variant="caption">Following</Typography>
              </Box>
            </Stack>
          </Grid>
          
          <Grid item>
            <Stack spacing={1}>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : (editMode ? <Save /> : <Edit />)}
                onClick={editMode ? handleProfileUpdate : () => setEditMode(true)}
                disabled={saving}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                {saving ? 'Saving...' : (editMode ? 'Save Profile' : 'Edit Profile')}
              </Button>
              
              {editMode && (
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={() => {
                    setEditMode(false);
                    fetchProfileData();
                  }}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: 'white',
                    '&:hover': { borderColor: 'rgba(255,255,255,0.5)' }
                  }}
                >
                  Cancel
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Box sx={{ width: '100%' }}>
        <Tabs 
          value={activeTab} 
          onChange={(event, newValue) => setActiveTab(newValue)}
          sx={{ 
            mb: 3,
            '& .MuiTab-root': { 
              color: '#ccc',
              '&.Mui-selected': { color: '#667eea' }
            }
          }}
        >
          <Tab icon={<MusicNote />} label="My Tracks" />
          <Tab icon={<QueueMusic />} label="Playlists" />
          <Tab icon={<Psychology />} label="AI Discover" />
          <Tab icon={<BarChart />} label="Analytics" />
          <Tab icon={<Settings />} label="Settings" />
        </Tabs>

        {/* Settings Tab Content */}
        {activeTab === 4 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ bgcolor: '#1e1e1e', borderRadius: '12px' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ color: 'white' }}>
                      Profile Information
                    </Typography>
                    <Button
                      variant={editMode ? "contained" : "outlined"}
                      startIcon={editMode ? <Save /> : <Edit />}
                      onClick={() => {
                        if (editMode) {
                          handleProfileUpdate();
                        } else {
                          setEditMode(true);
                        }
                      }}
                      disabled={saving}
                      sx={{
                        bgcolor: editMode ? '#667eea' : 'transparent',
                        borderColor: '#667eea',
                        color: editMode ? 'white' : '#667eea',
                        '&:hover': { 
                          bgcolor: editMode ? '#764ba2' : 'rgba(102, 126, 234, 0.1)',
                          borderColor: '#764ba2'
                        }
                      }}
                    >
                      {saving ? 'Saving...' : (editMode ? 'Save Changes' : 'Edit Profile')}
                    </Button>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <CleanInput
                        label="Display Name"
                        value={profile.display_name}
                        onChange={(event) => handleFieldChange('display_name', event)}
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <CleanInput
                        label="Location"
                        value={profile.location}
                        onChange={(event) => handleFieldChange('location', event)}
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <CleanInput
                        label="Bio"
                        multiline
                        value={profile.bio}
                        onChange={(event) => handleFieldChange('bio', event)}
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <CleanInput
                        label="Website"
                        value={profile.website}
                        onChange={(event) => handleFieldChange('website', event)}
                        disabled={!editMode}
                        placeholder="https://"
                      />
                    </Grid>
                  </Grid>
                  
                  <Typography variant="h6" sx={{ color: 'white', mt: 4, mb: 3 }}>
                    Social Links
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <CleanInput
                        label="Twitter"
                        value={profile.social_links.twitter}
                        onChange={(event) => handleSocialLinkChange('twitter', event)}
                        disabled={!editMode}
                        placeholder="@username"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <CleanInput
                        label="Instagram"
                        value={profile.social_links.instagram}
                        onChange={(event) => handleSocialLinkChange('instagram', event)}
                        disabled={!editMode}
                        placeholder="@username"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <CleanInput
                        label="SoundCloud"
                        value={profile.social_links.soundcloud}
                        onChange={(event) => handleSocialLinkChange('soundcloud', event)}
                        disabled={!editMode}
                        placeholder="soundcloud.com/username"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <CleanInput
                        label="Spotify"
                        value={profile.social_links.spotify}
                        onChange={(event) => handleSocialLinkChange('spotify', event)}
                        disabled={!editMode}
                        placeholder="Artist name or profile URL"
                      />
                    </Grid>
                  </Grid>
                  
                  {editMode && (
                    <Box sx={{ mt: 3, textAlign: 'right' }}>
                      <Button
                        variant="outlined"
                        startIcon={<Cancel />}
                        onClick={() => {
                          setEditMode(false);
                          fetchProfileData();
                        }}
                        sx={{
                          borderColor: '#667eea',
                          color: '#667eea',
                          '&:hover': { borderColor: '#764ba2', color: '#764ba2' }
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: '#1e1e1e', borderRadius: '12px' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                    Account Settings
                  </Typography>
                  
                  <List>
                    <ListItem button onClick={() => setPasswordDialog(true)}>
                      <ListItemText 
                        primary="Change Password"
                        secondary="Update your account password"
                        sx={{ color: 'white' }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton sx={{ color: '#667eea' }} onClick={() => setPasswordDialog(true)}>
                          <Security />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem button onClick={() => setNotificationsDialog(true)}>
                      <ListItemText 
                        primary="Notifications"
                        secondary="Manage notification preferences"
                        sx={{ color: 'white' }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton sx={{ color: '#667eea' }} onClick={() => setNotificationsDialog(true)}>
                          <Notifications />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem button onClick={() => setPrivacyDialog(true)}>
                      <ListItemText 
                        primary="Privacy Settings"
                        secondary="Control who can see your profile"
                        sx={{ color: 'white' }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton sx={{ color: '#667eea' }} onClick={() => setPrivacyDialog(true)}>
                          <Visibility />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                  
                  <Divider sx={{ my: 2, bgcolor: '#333' }} />
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                  >
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* My Tracks Tab - Enhanced with AI */}
        {activeTab === 0 && (
          <Box>
            {syncedUserTracks.length > 0 ? (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ color: 'white' }}>
                      My Tracks ({syncedUserTracks.length})
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Psychology />}
                      onClick={() => setAiAnalysisDialog(true)}
                      sx={{
                        borderColor: '#667eea',
                        color: '#667eea',
                        '&:hover': { borderColor: '#764ba2', color: '#764ba2' }
                      }}
                    >
                      AI Analysis
                    </Button>
                  </Box>
                </Grid>
                
                {syncedUserTracks.map((track, index) => (
                  <Grid item xs={12} sm={6} md={4} key={track.id}>
                    <Tooltip title={track.play_count === 1 ? 'Played once' : `Played ${track.play_count || 0} times`} arrow>
                      <div>
                        <Card sx={{ 
                          bgcolor: '#1e1e1e',
                          '&:hover': { bgcolor: '#2a2a2a', transform: 'translateY(-2px)' },
                          transition: 'all 0.2s ease'
                        }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                              {track.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                              {track.genre} • {formatPlays(track.play_count || 0)}
                            </Typography>
                            {track.ai_tags && (
                              <Box sx={{ mb: 2 }}>
                                <Chip
                                  size="small"
                                  label={`AI: ${Math.round(track.ai_tags.aiConfidence * 100)}% confident`}
                                  sx={{ bgcolor: '#4caf50', color: 'white', mr: 1 }}
                                />
                                {track.ai_tags.energy && (
                                  <Chip
                                    size="small"
                                    label={`Energy: ${Math.round(track.ai_tags.energy * 100)}%`}
                                    variant="outlined"
                                    sx={{ color: '#ccc', borderColor: '#555' }}
                                  />
                                )}
                              </Box>
                            )}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Button
                                size="small"
                                startIcon={<Psychology />}
                                onClick={() => analyzeTrackWithAI(track)}
                                disabled={loadingAI}
                                sx={{ color: '#667eea' }}
                              >
                                {loadingAI ? 'Analyzing...' : 'AI Analyze'}
                              </Button>
                              <IconButton sx={{ color: '#667eea' }} onClick={() => playTrack(track, syncedUserTracks)}>
                                <PlayArrow />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      </div>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Card sx={{ bgcolor: '#1e1e1e', textAlign: 'center', py: 6 }}>
                <CardContent>
                  <MusicNote sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#ccc', mb: 2 }}>
                    No tracks uploaded yet
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<CloudUpload />}
                    onClick={() => navigate('/upload')}
                    sx={{ bgcolor: '#667eea' }}
                  >
                    Upload Your First Track
                  </Button>
                </CardContent>
              </Card>
            )}
          </Box>
        )}

        {/* Playlists Tab */}
        {activeTab === 1 && (
          <Card sx={{ bgcolor: '#1e1e1e', textAlign: 'center', py: 6 }}>
            <CardContent>
              <QueueMusic sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#ccc', mb: 2 }}>
                {userPlaylists.length === 0 ? 'No playlists created yet' : `${userPlaylists.length} playlists`}
              </Typography>
              <Button
                variant="contained"
                startIcon={<QueueMusic />}
                onClick={() => navigate('/playlists')}
                sx={{ bgcolor: '#667eea' }}
              >
                Create Your First Playlist
              </Button>
            </CardContent>
          </Card>
        )}

        {/* AI Discover Tab - New AI-powered content */}
        {activeTab === 2 && (
          <Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                <Psychology sx={{ mr: 2, color: '#667eea' }} />
                Real AI-Powered Music Discovery
              </Typography>
              
              <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                <Chip 
                  label="🤖 Real AI Engine" 
                  sx={{ bgcolor: '#4caf50', color: 'white', fontWeight: 'bold' }}
                />
                <Chip 
                  label="🧠 Hugging Face Models" 
                  sx={{ bgcolor: '#667eea', color: 'white' }}
                />
                <Chip 
                  label="🎯 Semantic Analysis" 
                  sx={{ bgcolor: '#ff9800', color: 'white' }}
                />
              </Stack>
              
              {/* AI Profile Enhancement Card */}
              {aiSuggestions && (
                <Card sx={{ bgcolor: '#1a1a1a', mb: 3, border: '1px solid #667eea' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Lightbulb sx={{ mr: 1, color: '#ffd700' }} />
                      AI Profile Enhancement Suggestions
                      {loadingAI && <CircularProgress size={20} sx={{ ml: 2 }} />}
                    </Typography>
                    
                    {aiSuggestions.bio && aiSuggestions.bio.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ color: '#667eea', mb: 1 }}>
                          Bio Suggestions:
                        </Typography>
                        <Stack spacing={1}>
                          {aiSuggestions.bio.slice(0, 3).map((suggestion, index) => (
                            <Box key={index} sx={{ 
                              p: 2, 
                              bgcolor: '#2a2a2a', 
                              borderRadius: 1,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <Typography variant="body2" sx={{ color: '#ccc', flex: 1 }}>
                                "{suggestion}"
                              </Typography>
                              <Button
                                size="small"
                                startIcon={<AutoAwesome />}
                                onClick={() => applyAIBioSuggestion(suggestion)}
                                sx={{ color: '#667eea', ml: 2 }}
                              >
                                Apply
                              </Button>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {aiSuggestions.genres && aiSuggestions.genres.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ color: '#667eea', mb: 1 }}>
                          Your Musical DNA:
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {aiSuggestions.genres.map((genre, index) => (
                            <Chip
                              key={index}
                              label={genre}
                              size="small"
                              sx={{ bgcolor: '#667eea', color: 'white' }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {aiSuggestions.insights && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#4caf50', mb: 1 }}>
                          AI Insights:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#ccc' }}>
                          Musical Style: {aiSuggestions.style} • 
                          Strengths: {aiSuggestions.insights.strengths?.join(', ')}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* AI Recommendations Component */}
            <AIRecommendations />
          </Box>
        )}

        {/* Analytics Tab - Enhanced with AI insights */}
        {activeTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ bgcolor: '#1e1e1e', borderRadius: '12px' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 3, display: 'flex', alignItems: 'center' }}>
                    <Analytics sx={{ mr: 2, color: '#667eea' }} />
                    Performance Overview
                    <Chip 
                      label="AI Enhanced" 
                      size="small" 
                      sx={{ ml: 2, bgcolor: '#667eea', color: 'white' }}
                    />
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={6} md={3}>
                      <Box textAlign="center" sx={{ p: 2, bgcolor: '#2a2a2a', borderRadius: 2 }}>
                        <TrendingUp sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {formatNumberCompact(stats.totalPlays)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#ccc' }}>
                          Total Plays
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min((stats.totalPlays / 1000) * 100, 100)} 
                          sx={{ mt: 1, bgcolor: '#1a1a1a', '& .MuiLinearProgress-bar': { bgcolor: '#4caf50' } }}
                        />
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Box textAlign="center" sx={{ p: 2, bgcolor: '#2a2a2a', borderRadius: 2 }}>
                        <Star sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {stats.totalLikes}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#ccc' }}>
                          Total Likes
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min((stats.totalLikes / 100) * 100, 100)} 
                          sx={{ mt: 1, bgcolor: '#1a1a1a', '& .MuiLinearProgress-bar': { bgcolor: '#ff9800' } }}
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={6} md={3}>
                      <Box textAlign="center" sx={{ p: 2, bgcolor: '#2a2a2a', borderRadius: 2 }}>
                        <MusicNote sx={{ fontSize: 40, color: '#667eea', mb: 1 }} />
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {stats.tracksUploaded}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#ccc' }}>
                          Tracks
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min((stats.tracksUploaded / 50) * 100, 100)} 
                          sx={{ mt: 1, bgcolor: '#1a1a1a', '& .MuiLinearProgress-bar': { bgcolor: '#667eea' } }}
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={6} md={3}>
                      <Box textAlign="center" sx={{ p: 2, bgcolor: '#2a2a2a', borderRadius: 2 }}>
                        <People sx={{ fontSize: 40, color: '#9c27b0', mb: 1 }} />
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {stats.followers}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#ccc' }}>
                          Followers
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min((stats.followers / 1000) * 100, 100)} 
                          sx={{ mt: 1, bgcolor: '#1a1a1a', '& .MuiLinearProgress-bar': { bgcolor: '#9c27b0' } }}
                        />
                      </Box>
                    </Grid>
                  </Grid>

                  {/* AI Growth Insights */}
                  <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(102, 126, 234, 0.1)', borderRadius: 2, border: '1px solid #667eea' }}>
                    <Typography variant="h6" sx={{ color: '#667eea', mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Psychology sx={{ mr: 1 }} />
                      AI Growth Insights
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                      Based on your music and engagement patterns, here are AI-powered insights:
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2, bgcolor: '#2a2a2a', borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ color: '#4caf50', mb: 1 }}>
                            🎯 Engagement Rate
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            {stats.tracksUploaded > 0 
                              ? `${Math.round((stats.totalPlays / stats.tracksUploaded) * 100) / 100} plays per track`
                              : 'Upload tracks to see insights'
                            }
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2, bgcolor: '#2a2a2a', borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ color: '#ff9800', mb: 1 }}>
                            📈 Growth Potential
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            {stats.tracksUploaded < 5 
                              ? 'Upload more tracks to increase discovery'
                              : 'Great catalog! Focus on promotion'
                            }
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: '#1e1e1e', borderRadius: '12px' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                    AI Recommendations
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box sx={{ p: 2, bgcolor: '#2a2a2a', borderRadius: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: '#667eea', mb: 1 }}>
                        🎵 Next Actions
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ccc', fontSize: '0.875rem' }}>
                        {stats.tracksUploaded === 0 
                          ? 'Upload your first track to get started'
                          : stats.tracksUploaded < 3
                          ? 'Upload 2-3 more tracks to build your catalog'
                          : 'Create playlists to organize your music'
                        }
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2, bgcolor: '#2a2a2a', borderRadius: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: '#4caf50', mb: 1 }}>
                        🎯 Audience Growth
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ccc', fontSize: '0.875rem' }}>
                        {stats.followers < 10
                          ? 'Share your music to gain first followers'
                          : 'Engage with other artists to grow your network'
                        }
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2, bgcolor: '#2a2a2a', borderRadius: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: '#ff9800', mb: 1 }}>
                        💡 AI Tip
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ccc', fontSize: '0.875rem' }}>
                        Add detailed track descriptions and tags to improve discoverability
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Recently Played Section */}
      {recentlyPlayed && recentlyPlayed.length > 0 && (
        <Box sx={{ mt: 6, mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: 'white' }}>
            Recently Played
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
            {recentlyPlayed.slice(0, 8).map((track) => (
              <Tooltip key={track.id} title={track.play_count === 1 ? 'Played once' : `Played ${track.play_count || 0} times`} arrow>
                <div style={{ minWidth: 220, flex: '1 0 220px' }}>
                  <Card sx={{ bgcolor: '#23272f', color: 'white' }}>
                    <CardContent>
                      <Typography variant="subtitle1" noWrap>{track.title}</Typography>
                      <Typography variant="body2" color="#aaa" noWrap>{track.artist}</Typography>
                      <Typography variant="caption" color="#aaa">
                        {formatPlays(track.play_count || 0)}
                      </Typography>
                    </CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                      <IconButton onClick={() => playTrack(track)} sx={{ color: '#1DB954' }}>
                        <PlayArrow />
                      </IconButton>
                    </Box>
                  </Card>
                </div>
              </Tooltip>
            ))}
          </Box>
        </Box>
      )}
      
      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>

      {/* Avatar Upload Dialog */}
      <AvatarUploadDialog
        open={avatarUploadDialog}
        onClose={() => setAvatarUploadDialog(false)}
        currentAvatar={profile.avatar_url}
        onAvatarUpdate={handleAvatarUpdate}
      />

      {/* Password Change Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1e1e1e', color: 'white' }}>
          Change Password
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1e1e1e', color: 'white', pt: 2 }}>
          <CleanInput
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(event) => handlePasswordFieldChange('currentPassword', event)}
          />
          <CleanInput
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(event) => handlePasswordFieldChange('newPassword', event)}
          />
          <CleanInput
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(event) => handlePasswordFieldChange('confirmPassword', event)}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1e1e1e' }}>
          <Button onClick={() => setPasswordDialog(false)} sx={{ color: '#ccc' }}>
            Cancel
          </Button>
          <Button 
            onClick={handlePasswordChange} 
            variant="contained"
            disabled={saving}
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' }
            }}
          >
            {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Update Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Analysis Dialog */}
      <Dialog 
        open={aiAnalysisDialog} 
        onClose={() => setAiAnalysisDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#1e1e1e', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Psychology sx={{ mr: 2, color: '#667eea' }} />
            AI Track Analysis Dashboard
          </Box>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1e1e1e', color: 'white', pt: 2 }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Let our AI analyze your tracks to provide insights on genre, mood, energy levels, and suggestions for improvement.
          </Typography>
          
          {userTracks.length > 0 ? (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Select tracks to analyze:
              </Typography>
              <Stack spacing={2} sx={{ maxHeight: 300, overflow: 'auto' }}>
                {userTracks.map((track) => (
                  <Box 
                    key={track.id}
                    sx={{ 
                      p: 2, 
                      bgcolor: '#2a2a2a', 
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ color: 'white' }}>
                        {track.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        {track.genre} • {formatPlays(track.play_count || 0)}
                      </Typography>
                      {track.ai_tags && (
                        <Chip
                          size="small"
                          label="AI Analyzed"
                          sx={{ bgcolor: '#4caf50', color: 'white', mt: 1 }}
                        />
                      )}
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Psychology />}
                      onClick={() => analyzeTrackWithAI(track)}
                      disabled={loadingAI}
                      sx={{
                        borderColor: '#667eea',
                        color: '#667eea',
                        '&:hover': { borderColor: '#764ba2', color: '#764ba2' }
                      }}
                    >
                      {loadingAI ? 'Analyzing...' : track.ai_tags ? 'Re-analyze' : 'Analyze'}
                    </Button>
                  </Box>
                ))}
              </Stack>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <MusicNote sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#ccc' }}>
                No tracks to analyze yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#888' }}>
                Upload some tracks first to get AI insights
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1e1e1e' }}>
          <Button onClick={() => setAiAnalysisDialog(false)} sx={{ color: '#ccc' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;

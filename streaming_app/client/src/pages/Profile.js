import React, { useState, useEffect, useMemo } from 'react';
import Analytics from '@mui/icons-material/Analytics';
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
  LinearProgress,
  FormGroup,
  TextField
} from '@mui/material';
import TrackCard from '../components/TrackCard';
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
  AutoAwesome
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AvatarUploadDialog from '../components/AvatarUploadDialog';
import AIRecommendations from '../components/AIRecommendations';

import api from '../services/api';
import useSyncTrackCounts from '../hooks/useSyncTrackCounts';
import { formatPlays, formatNumberCompact } from '../utils/format';
import { usePlayer } from '../contexts/PlayerContext';
// import Tooltip from '@mui/material/Tooltip';


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
  const [loadingAIByTrackId, setLoadingAIByTrackId] = useState({});
  const [aiAnalysisDialog, setAiAnalysisDialog] = useState(false);
  const [latestAIAnalysis, setLatestAIAnalysis] = useState(null);
  
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


  // Fetch AI enhancement suggestions (mocked)
  useEffect(() => {
    if (user && profile.username) {
      fetchAIEnhancements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile.username]);

  // Mock AI enhancement fetch
  const fetchAIEnhancements = async () => {
    setAiSuggestions({
      bio: [
        "Passionate about sharing music and connecting with listeners.",
        "Blending genres to create a unique sound.",
        "Always exploring new musical frontiers."
      ],
      genres: ["Hip-Hop", "Electronic", "Indie Pop"],
      style: "Experimental, Melodic",
      insights: { strengths: ["Creativity", "Consistency", "Engagement"] }
    });
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch profile
  const profileResponse = await api.get('/users/profile');
      const userData = profileResponse.data.user;
      
      // Fetch tracks
  const tracksResponse = await api.get('/tracks?limit=50');
      const userTracksData = tracksResponse.data.tracks?.filter(track => track.user_id === userData.id) || [];
      
      // Fetch playlists
  const playlistsResponse = await api.get('/playlists');
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
      const totalLikes = userTracksData.reduce((total, track) => total + (track.like_count || 0), 0);

      let followers = 0;
      let following = 0;
      try {
        if (userData.id) {
          const followersRes = await api.get(`/users/${userData.id}/followers`);
          followers = Array.isArray(followersRes.data) ? followersRes.data.length : (followersRes.data.count || 0);
          const followingRes = await api.get(`/users/${userData.id}/following`);
          following = Array.isArray(followingRes.data) ? followingRes.data.length : (followingRes.data.count || 0);
        }
      } catch (err) {
        // If followers/following endpoints fail, fallback to 0
        followers = 0;
        following = 0;
      }

      setStats({
        tracksUploaded: userTracksData.length,
        totalPlays: totalPlays,
        totalLikes: totalLikes,
        followers: followers,
        following: following,
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

  // ...AI analysis logic removed...

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
      
  const response = await api.put('/users/profile', updateData);
      
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

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    try {
      setSaving(true);
  await api.post('/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setSuccess('Password changed successfully!');
      setPasswordDialog(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError('Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpdate = async (newAvatarUrl) => {
    try {
      setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));
      
  const response = await api.put('/users/profile', {
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

  // Notification settings handler
  const handleSaveNotifications = async () => {
    try {
      // Replace with your API call for saving notification settings
      await api.post('/users/notification-settings', notificationSettings);
      setSuccess('Notification settings saved!');
      setNotificationsDialog(false);
    } catch (err) {
      setError('Failed to save notification settings. Please try again.');
    }
  };

  // Privacy settings handler
  const handleSavePrivacy = async () => {
    try {
      // Replace with your API call for saving privacy settings
      await api.post('/users/privacy-settings', privacySettings);
      setSuccess('Privacy settings saved!');
      setPrivacyDialog(false);
    } catch (err) {
      setError('Failed to save privacy settings. Please try again.');
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
          <Tab icon={<BarChart />} label="Analytics" />
          <Tab icon={<Settings />} label="Settings" />
          {/* <Tab icon={<Psychology />} label="AI Discover" /> */}
        </Tabs>

        {/* Settings Tab Content */}
  {activeTab === 3 && (
          <Grid container spacing={3}>
            {/* Profile & Social Info */}
            <Grid item xs={12} md={8}>
              <Card sx={{ bgcolor: '#1e1e1e', borderRadius: '12px', mb: 3 }}>
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
              {/* Notification & Privacy Settings */}
              <Card sx={{ bgcolor: '#1e1e1e', borderRadius: '12px', mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                    Notification Settings
                  </Typography>
                  <FormGroup>
                    <FormControlLabel control={<Switch checked={notificationSettings.emailNotifications} onChange={e => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))} />} label="Email Notifications" />
                    <FormControlLabel control={<Switch checked={notificationSettings.pushNotifications} onChange={e => setNotificationSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))} />} label="Push Notifications" />
                    <FormControlLabel control={<Switch checked={notificationSettings.trackLikes} onChange={e => setNotificationSettings(prev => ({ ...prev, trackLikes: e.target.checked }))} />} label="Track Likes" />
                    <FormControlLabel control={<Switch checked={notificationSettings.newFollowers} onChange={e => setNotificationSettings(prev => ({ ...prev, newFollowers: e.target.checked }))} />} label="New Followers" />
                    <FormControlLabel control={<Switch checked={notificationSettings.roomInvites} onChange={e => setNotificationSettings(prev => ({ ...prev, roomInvites: e.target.checked }))} />} label="Room Invites" />
                    <FormControlLabel control={<Switch checked={notificationSettings.trackComments} onChange={e => setNotificationSettings(prev => ({ ...prev, trackComments: e.target.checked }))} />} label="Track Comments" />
                  </FormGroup>
                  <Divider sx={{ my: 3, bgcolor: '#333' }} />
                  <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                    Privacy Settings
                  </Typography>
                  <FormGroup>
                    <FormControlLabel control={<Switch checked={privacySettings.profileVisibility === 'public'} onChange={e => setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.checked ? 'public' : 'private' }))} />} label="Profile Public" />
                    <FormControlLabel control={<Switch checked={privacySettings.showEmail} onChange={e => setPrivacySettings(prev => ({ ...prev, showEmail: e.target.checked }))} />} label="Show Email" />
                    <FormControlLabel control={<Switch checked={privacySettings.showLocation} onChange={e => setPrivacySettings(prev => ({ ...prev, showLocation: e.target.checked }))} />} label="Show Location" />
                    <FormControlLabel control={<Switch checked={privacySettings.allowDirectMessages} onChange={e => setPrivacySettings(prev => ({ ...prev, allowDirectMessages: e.target.checked }))} />} label="Allow Direct Messages" />
                    <FormControlLabel control={<Switch checked={privacySettings.showOnlineStatus} onChange={e => setPrivacySettings(prev => ({ ...prev, showOnlineStatus: e.target.checked }))} />} label="Show Online Status" />
                    <FormControlLabel control={<Switch checked={privacySettings.showListeningActivity} onChange={e => setPrivacySettings(prev => ({ ...prev, showListeningActivity: e.target.checked }))} />} label="Show Listening Activity" />
                  </FormGroup>
                </CardContent>
              </Card>
            </Grid>
            {/* Account Settings */}
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
                      // startIcon for AI removed
                      onClick={() => setAiAnalysisDialog(true)}
                      sx={{
                        borderColor: '#667eea',
                        color: '#667eea',
                        '&:hover': { borderColor: '#764ba2', color: '#764ba2' }
                      }}
                    >
                      {/* AI Analysis removed */}
                    </Button>
                  </Box>
                </Grid>
                
                {syncedUserTracks.map((track, index) => (
                  <Grid item xs={12} sm={6} md={4} key={track.id}>
                    <TrackCard
                      track={track}
                      onPlay={() => playTrack(track, syncedUserTracks)}
                      showActions={true}
                    />
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


        {/* Analytics Tab - Show user stats and AI suggestions */}
        {activeTab === 2 && (
          <Box>
            {/* Modern Stat Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* Tracks Uploaded */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ background: 'linear-gradient(135deg, #667eea 60%, #764ba2 100%)', color: 'white', boxShadow: 3, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.04)' } }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <MusicNote sx={{ fontSize: 36, color: 'white' }} />
                      <Box>
                        <Tooltip title="Tracks you have uploaded">
                          <Typography variant="h6">{stats.tracksUploaded}</Typography>
                        </Tooltip>
                        <Typography variant="body2">Tracks Uploaded</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              {/* Total Plays */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ background: 'linear-gradient(135deg, #43cea2 60%, #185a9d 100%)', color: 'white', boxShadow: 3, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.04)' } }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <BarChart sx={{ fontSize: 36, color: 'white' }} />
                      <Box>
                        <Tooltip title="Total number of plays on your tracks">
                          <Typography variant="h6">{stats.totalPlays}</Typography>
                        </Tooltip>
                        <Typography variant="body2">Total Plays</Typography>
                        <LinearProgress variant="determinate" value={Math.min(stats.totalPlays / 100, 100)} sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: '#333' }} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              {/* Total Likes */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ background: 'linear-gradient(135deg, #ff5858 60%, #f09819 100%)', color: 'white', boxShadow: 3, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.04)' } }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Star sx={{ fontSize: 36, color: 'white' }} />
                      <Box>
                        <Tooltip title="Total likes received on your tracks">
                          <Typography variant="h6">{stats.totalLikes}</Typography>
                        </Tooltip>
                        <Typography variant="body2">Total Likes</Typography>
                        <LinearProgress variant="determinate" value={Math.min(stats.totalLikes / 100, 100)} sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: '#333' }} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              {/* Followers */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ background: 'linear-gradient(135deg, #43cea2 60%, #667eea 100%)', color: 'white', boxShadow: 3, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.04)' } }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <People sx={{ fontSize: 36, color: 'white' }} />
                      <Box>
                        <Tooltip title="People following you">
                          <Typography variant="h6">{stats.followers}</Typography>
                        </Tooltip>
                        <Typography variant="body2">Followers</Typography>
                        <LinearProgress variant="determinate" value={Math.min(stats.followers / 100, 100)} sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: '#333' }} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              {/* Following */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ background: 'linear-gradient(135deg, #f7971e 60%, #ffd200 100%)', color: 'white', boxShadow: 3, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.04)' } }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <People sx={{ fontSize: 36, color: 'white', opacity: 0.7 }} />
                      <Box>
                        <Tooltip title="People you are following">
                          <Typography variant="h6">{stats.following}</Typography>
                        </Tooltip>
                        <Typography variant="body2">Following</Typography>
                        <LinearProgress variant="determinate" value={Math.min(stats.following / 100, 100)} sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: '#333' }} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              {/* Playlists Created */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ background: 'linear-gradient(135deg, #667eea 60%, #43cea2 100%)', color: 'white', boxShadow: 3, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.04)' } }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <QueueMusic sx={{ fontSize: 36, color: 'white' }} />
                      <Box>
                        <Tooltip title="Playlists you have created">
                          <Typography variant="h6">{stats.playlistsCreated}</Typography>
                        </Tooltip>
                        <Typography variant="body2">Playlists Created</Typography>
                        <LinearProgress variant="determinate" value={Math.min(stats.playlistsCreated / 100, 100)} sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: '#333' }} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            {/* AI Profile Enhancement Card */}
            {aiSuggestions && (
              <Card sx={{ bgcolor: 'linear-gradient(135deg, #1a1a1a 80%, #667eea 100%)', mb: 3, border: '1px solid #667eea', boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                    AI Profile Enhancement Suggestions
                  </Typography>
                  {aiSuggestions.bio && aiSuggestions.bio.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ color: '#667eea', mb: 1 }}>
                        Bio Suggestions:
                      </Typography>
                      <Stack spacing={1}>
                        {aiSuggestions.bio.slice(0, 3).map((suggestion, index) => (
                          <Box key={index} sx={{ p: 2, bgcolor: '#2a2a2a', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#ccc', flex: 1 }}>
                              "{suggestion}"
                            </Typography>
                            <Button size="small" startIcon={<AutoAwesome />} onClick={() => applyAIBioSuggestion(suggestion)} sx={{ color: '#667eea', ml: 2 }}>
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
                          <Chip key={index} label={genre} size="small" sx={{ bgcolor: '#667eea', color: 'white' }} />
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
                        Musical Style: {aiSuggestions.style} • Strengths: {aiSuggestions.insights.strengths?.join(', ')}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        )}


      </Box>

      {/* Recently Played Section */}
      {recentlyPlayed && recentlyPlayed.length > 0 && (
        <Box sx={{ mt: 6, mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: 'white' }}>
            Recently Played
          </Typography>
          <Grid container spacing={2}>
            {recentlyPlayed.slice(0, 8).map((track) => (
              <Grid item xs={12} sm={6} md={3} key={track.id}>
                <TrackCard
                  track={track}
                  onPlay={() => playTrack(track)}
                  showActions={true}
                />
              </Grid>
            ))}
          </Grid>
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
      <AvatarUploadDialog open={avatarUploadDialog} onClose={() => setAvatarUploadDialog(false)} />

      {/* Password Dialog */}
      <Dialog
        open={passwordDialog}
        onClose={() => setPasswordDialog(false)}
        maxWidth="xs"
        fullWidth
        transitionDuration={400}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(40,40,60,0.95) 0%, rgba(60,60,80,0.95) 100%)',
            backdropFilter: 'blur(24px) saturate(180%)',
            borderRadius: '20px',
            border: '1.5px solid rgba(255,255,255,0.10)',
            boxShadow: '0 8px 40px 0 rgba(102,126,234,0.18)',
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 700, fontSize: '1.3rem', pb: 1 }}>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            label="Current Password"
            type="password"
            fullWidth
            sx={{ mb: 2 }}
            value={passwordForm.currentPassword}
            onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            sx={{ mb: 2 }}
            value={passwordForm.newPassword}
            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
          />
          <TextField
            label="Confirm New Password"
            type="password"
            fullWidth
            sx={{ mb: 2 }}
            value={passwordForm.confirmPassword}
            onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2 }}>
          <Button onClick={() => setPasswordDialog(false)} sx={{ color: '#fff', background: 'rgba(255,255,255,0.08)', borderRadius: 2, px: 3, fontWeight: 500, boxShadow: '0 2px 8px 0 rgba(102,126,234,0.10)', transition: 'background 0.2s', '&:hover': { background: 'rgba(255,255,255,0.18)' } }}>Cancel</Button>
          <Button onClick={handleChangePassword} variant="contained" sx={{ bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', borderRadius: 2, px: 3, fontWeight: 600, boxShadow: '0 4px 16px 0 rgba(102,126,234,0.18)', transition: 'background 0.2s', '&:hover': { bgcolor: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' } }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog
        open={notificationsDialog}
        onClose={() => setNotificationsDialog(false)}
        maxWidth="xs"
        fullWidth
        transitionDuration={400}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(40,40,60,0.95) 0%, rgba(60,60,80,0.95) 100%)',
            backdropFilter: 'blur(24px) saturate(180%)',
            borderRadius: '20px',
            border: '1.5px solid rgba(255,255,255,0.10)',
            boxShadow: '0 8px 40px 0 rgba(102,126,234,0.18)',
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 700, fontSize: '1.3rem', pb: 1 }}>Notification Settings</DialogTitle>
        <DialogContent>
          <FormGroup>
            <FormControlLabel control={<Switch checked={notificationSettings.emailNotifications} onChange={e => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })} />} label="Email Notifications" />
            <FormControlLabel control={<Switch checked={notificationSettings.pushNotifications} onChange={e => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })} />} label="Push Notifications" />
            <FormControlLabel control={<Switch checked={notificationSettings.trackLikes} onChange={e => setNotificationSettings({ ...notificationSettings, trackLikes: e.target.checked })} />} label="Track Likes" />
            <FormControlLabel control={<Switch checked={notificationSettings.newFollowers} onChange={e => setNotificationSettings({ ...notificationSettings, newFollowers: e.target.checked })} />} label="New Followers" />
            <FormControlLabel control={<Switch checked={notificationSettings.roomInvites} onChange={e => setNotificationSettings({ ...notificationSettings, roomInvites: e.target.checked })} />} label="Room Invites" />
            <FormControlLabel control={<Switch checked={notificationSettings.trackComments} onChange={e => setNotificationSettings({ ...notificationSettings, trackComments: e.target.checked })} />} label="Track Comments" />
          </FormGroup>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2 }}>
          <Button onClick={() => setNotificationsDialog(false)} sx={{ color: '#fff', background: 'rgba(255,255,255,0.08)', borderRadius: 2, px: 3, fontWeight: 500, boxShadow: '0 2px 8px 0 rgba(102,126,234,0.10)', transition: 'background 0.2s', '&:hover': { background: 'rgba(255,255,255,0.18)' } }}>Cancel</Button>
          <Button onClick={handleSaveNotifications} variant="contained" sx={{ bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', borderRadius: 2, px: 3, fontWeight: 600, boxShadow: '0 4px 16px 0 rgba(102,126,234,0.18)', transition: 'background 0.2s', '&:hover': { bgcolor: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' } }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Privacy Dialog */}
      <Dialog
        open={privacyDialog}
        onClose={() => setPrivacyDialog(false)}
        maxWidth="xs"
        fullWidth
        transitionDuration={400}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(40,40,60,0.95) 0%, rgba(60,60,80,0.95) 100%)',
            backdropFilter: 'blur(24px) saturate(180%)',
            borderRadius: '20px',
            border: '1.5px solid rgba(255,255,255,0.10)',
            boxShadow: '0 8px 40px 0 rgba(102,126,234,0.18)',
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 700, fontSize: '1.3rem', pb: 1 }}>Privacy Settings</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <FormLabel component="legend" sx={{ color: '#fff', mb: 2 }}>Profile Visibility</FormLabel>
            <RadioGroup
              value={privacySettings.profileVisibility}
              onChange={e => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
              row
            >
              <FormControlLabel value="public" control={<Radio />} label="Public" />
              <FormControlLabel value="private" control={<Radio />} label="Private" />
              <FormControlLabel value="friends" control={<Radio />} label="Friends Only" />
            </RadioGroup>
            <FormGroup sx={{ mt: 2 }}>
              <FormControlLabel control={<Switch checked={privacySettings.showEmail} onChange={e => setPrivacySettings({ ...privacySettings, showEmail: e.target.checked })} />} label="Show Email" />
              <FormControlLabel control={<Switch checked={privacySettings.showLocation} onChange={e => setPrivacySettings({ ...privacySettings, showLocation: e.target.checked })} />} label="Show Location" />
              <FormControlLabel control={<Switch checked={privacySettings.allowDirectMessages} onChange={e => setPrivacySettings({ ...privacySettings, allowDirectMessages: e.target.checked })} />} label="Allow Direct Messages" />
              <FormControlLabel control={<Switch checked={privacySettings.showOnlineStatus} onChange={e => setPrivacySettings({ ...privacySettings, showOnlineStatus: e.target.checked })} />} label="Show Online Status" />
              <FormControlLabel control={<Switch checked={privacySettings.showListeningActivity} onChange={e => setPrivacySettings({ ...privacySettings, showListeningActivity: e.target.checked })} />} label="Show Listening Activity" />
            </FormGroup>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2 }}>
          <Button onClick={() => setPrivacyDialog(false)} sx={{ color: '#fff', background: 'rgba(255,255,255,0.08)', borderRadius: 2, px: 3, fontWeight: 500, boxShadow: '0 2px 8px 0 rgba(102,126,234,0.10)', transition: 'background 0.2s', '&:hover': { background: 'rgba(255,255,255,0.18)' } }}>Cancel</Button>
          <Button onClick={handleSavePrivacy} variant="contained" sx={{ bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', borderRadius: 2, px: 3, fontWeight: 600, boxShadow: '0 4px 16px 0 rgba(102,126,234,0.18)', transition: 'background 0.2s', '&:hover': { bgcolor: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' } }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* AI Analysis Dialog */}
      <Dialog
        open={aiAnalysisDialog}
        onClose={() => setAiAnalysisDialog(false)}
        maxWidth="sm"
        fullWidth
        transitionDuration={400}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(40,40,60,0.95) 0%, rgba(60,60,80,0.95) 100%)',
            backdropFilter: 'blur(24px) saturate(180%)',
            borderRadius: '20px',
            border: '1.5px solid rgba(255,255,255,0.10)',
            boxShadow: '0 8px 40px 0 rgba(102,126,234,0.18)',
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 700, fontSize: '1.3rem', pb: 1 }}>AI Track Analysis</DialogTitle>
        <DialogContent>
          {latestAIAnalysis ? (
            <Box>
              <Typography variant="h6" sx={{ color: '#667eea', mb: 2 }}>AI Analysis Result</Typography>
              <Typography variant="body2" sx={{ color: '#fff', mb: 2 }}>{latestAIAnalysis.summary}</Typography>
              <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>Key Insights:</Typography>
              <List>
                {latestAIAnalysis.insights?.map((insight, idx) => (
                  <ListItem key={idx}>
                    <ListItemText primary={insight} />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
              <CircularProgress color="secondary" />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2 }}>
          <Button onClick={() => setAiAnalysisDialog(false)} sx={{ color: '#fff', background: 'rgba(255,255,255,0.08)', borderRadius: 2, px: 3, fontWeight: 500, boxShadow: '0 2px 8px 0 rgba(102,126,234,0.10)', transition: 'background 0.2s', '&:hover': { background: 'rgba(255,255,255,0.18)' } }}>Close</Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default Profile;

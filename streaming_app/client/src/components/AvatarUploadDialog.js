import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Avatar,
  Card,
  CardContent,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  PhotoCamera,
  AccountCircle,
  Palette,
  Save,
  Cancel
} from '@mui/icons-material';

const AvatarUploadDialog = ({ open, onClose, currentAvatar, onAvatarUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatar || '');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [error, setError] = useState('');

  // Preset avatar colors/gradients
  const presetAvatars = [
    { id: 1, bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', name: 'Purple' },
    { id: 2, bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', name: 'Pink' },
    { id: 3, bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', name: 'Blue' },
    { id: 4, bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', name: 'Green' },
    { id: 5, bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', name: 'Orange' },
    { id: 6, bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', name: 'Pastel' },
    { id: 7, bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', name: 'Rose' },
    { id: 8, bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', name: 'Lavender' }
  ];

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const data = await response.json();
      setAvatarUrl(data.avatarUrl);
      
    } catch (error) {
      console.error('Avatar upload error:', error);
      setError('Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset.id);
    setAvatarUrl(`gradient:${preset.bg}`);
  };

  const handleSave = () => {
    onAvatarUpdate(avatarUrl);
    onClose();
  };

  const handleCancel = () => {
    setAvatarUrl(currentAvatar || '');
    setSelectedPreset(null);
    setError('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="md"
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
  <DialogTitle sx={{ color: 'white', textAlign: 'center', fontWeight: 700, letterSpacing: 0.5, fontSize: '1.5rem', pb: 1 }}>
        <PhotoCamera sx={{ mr: 1, verticalAlign: 'middle' }} />
        Update Profile Picture
      </DialogTitle>
      
  <DialogContent sx={{ pb: 0 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Current/Preview Avatar */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar
            src={avatarUrl.startsWith('gradient:') ? undefined : avatarUrl}
            sx={{
              width: 120,
              height: 120,
              margin: '0 auto',
              fontSize: '3rem',
              background: avatarUrl.startsWith('gradient:') ? avatarUrl.replace('gradient:', '') : '#ccc'
            }}
          >
            {!avatarUrl && <AccountCircle sx={{ fontSize: '4rem' }} />}
          </Avatar>
          <Typography variant="body2" sx={{ color: '#ccc', mt: 1 }}>
            Preview
          </Typography>
        </Box>

        {/* Upload File */}
        <Card sx={{ bgcolor: '#2a2a2a', mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Upload Custom Image
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={uploading ? <CircularProgress size={20} /> : <PhotoCamera />}
                disabled={uploading}
                sx={{ bgcolor: '#667eea' }}
              >
                Choose File
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </Button>
              <Typography variant="body2" sx={{ color: '#ccc' }}>
                JPG, PNG, GIF up to 5MB
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* URL Input */}
        <Card sx={{ bgcolor: '#2a2a2a', mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Use Image URL
            </Typography>
            <TextField
              fullWidth
              placeholder="https://example.com/image.jpg"
              value={avatarUrl.startsWith('gradient:') ? '' : avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              sx={{ 
                '& .MuiInputBase-input': { color: 'white' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#555' },
                  '&:hover fieldset': { borderColor: '#777' },
                  '&.Mui-focused fieldset': { borderColor: '#667eea' }
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Preset Avatars */}
        <Card sx={{ bgcolor: '#2a2a2a' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              <Palette sx={{ mr: 1, verticalAlign: 'middle' }} />
              Choose Style
            </Typography>
            <Grid container spacing={2}>
              {presetAvatars.map((preset) => (
                <Grid item xs={3} key={preset.id}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      '&:hover': { transform: 'scale(1.1)' },
                      transition: 'transform 0.2s'
                    }}
                    onClick={() => handlePresetSelect(preset)}
                  >
                    <Avatar
                      sx={{
                        width: 60,
                        height: 60,
                        margin: '0 auto',
                        background: preset.bg,
                        border: selectedPreset === preset.id ? '3px solid #667eea' : '2px solid transparent'
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#ccc', mt: 1, display: 'block' }}>
                      {preset.name}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2 }}>
        <Button
          onClick={handleCancel}
          startIcon={<Cancel />}
          sx={{ color: '#fff', background: 'rgba(255,255,255,0.08)', borderRadius: 2, px: 3, fontWeight: 500, boxShadow: '0 2px 8px 0 rgba(102,126,234,0.10)', transition: 'background 0.2s', '&:hover': { background: 'rgba(255,255,255,0.18)' } }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          startIcon={<Save />}
          variant="contained"
          sx={{ bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', borderRadius: 2, px: 3, fontWeight: 600, boxShadow: '0 4px 16px 0 rgba(102,126,234,0.18)', transition: 'background 0.2s', '&:hover': { bgcolor: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' } }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AvatarUploadDialog;

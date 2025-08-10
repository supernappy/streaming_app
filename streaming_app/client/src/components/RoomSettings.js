import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Typography,
  Box,
  Alert,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Settings,
  Delete,
  DeleteForever,
  Warning,
  Security,
  Group,
  Chat,
  VolumeOff,
  Public,
  Lock,
  Save,
  Cancel
} from '@mui/icons-material';
import { roomsAPI } from '../services/api';

const RoomSettings = ({ 
  open, 
  onClose, 
  room, 
  isHost, 
  onRoomUpdated, 
  onRoomDeleted 
}) => {
  const [settings, setSettings] = useState({
    title: '',
    description: '',
    max_participants: 100,
    is_public: true,
    category: '',
    allow_chat: true,
    allow_reactions: true,
    require_approval: false,
    mute_participants: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState('soft'); // 'soft' or 'permanent'

  const categories = [
    'Music',
    'Podcasts',
    'Talk Show',
    'Study Session',
    'Gaming',
    'Social',
    'Educational',
    'Entertainment',
    'Other'
  ];

  useEffect(() => {
    console.log('🔧 RoomSettings useEffect triggered:', { room: !!room, open, roomId: room?.id });
    if (room && open) {
      loadSettings();
    }
  }, [room, open]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      console.log('🔧 Loading room settings for room:', room.id);
      const response = await roomsAPI.getSettings(room.id);
      console.log('✅ Room settings loaded:', response.data);
      setSettings(response.data.settings);
    } catch (error) {
      console.error('❌ Failed to load room settings:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      setError('Failed to load room settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await roomsAPI.updateSettings(room.id, settings);
      setSuccess('Room settings updated successfully!');
      
      if (onRoomUpdated) {
        onRoomUpdated(response.data.room);
      }
      
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update room settings');
      console.error('Update settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    try {
      setLoading(true);
      setError('');
      
      await roomsAPI.delete(room.id, deleteType === 'permanent');
      
      if (onRoomDeleted) {
        onRoomDeleted(room.id, deleteType === 'permanent');
      }
      
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete room');
      console.error('Delete room error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowDeleteConfirm(false);
    setError('');
    setSuccess('');
    onClose();
  };

  console.log('🔧 RoomSettings render:', { room: !!room, open, isHost, roomTitle: room?.title });

  if (!room) {
    console.log('❌ RoomSettings: No room provided');
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          minHeight: '70vh',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white'
        }
      }}
    >
      <DialogTitle sx={{ color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings />
          <Typography variant="h6">Room Settings</Typography>
          <Chip 
            label={isHost ? 'Host' : 'Participant'} 
            color={isHost ? 'primary' : 'default'}
            size="small"
            sx={{
              background: isHost ? 
                'linear-gradient(45deg, #4ECDC4, #44A08D)' : 
                'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none'
            }}
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ color: 'white' }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              background: 'rgba(244, 67, 54, 0.1)',
              color: '#ff9999',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              '& .MuiAlert-icon': { color: '#ff9999' }
            }}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2,
              background: 'rgba(76, 175, 80, 0.1)',
              color: '#99ff99',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              '& .MuiAlert-icon': { color: '#99ff99' }
            }}
          >
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'white',
              fontWeight: 'bold'
            }}>
              <Group />
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
          </Grid>

          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Room Title"
              value={settings.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              disabled={!isHost || loading}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4ECDC4',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Category</InputLabel>
              <Select
                value={settings.category || ''}
                label="Category"
                onChange={(e) => handleInputChange('category', e.target.value)}
                disabled={!isHost || loading}
                sx={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#4ECDC4',
                  },
                  '& .MuiSelect-icon': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
                onChange={(e) => handleInputChange('category', e.target.value)}
                disabled={!isHost || loading}
                label="Category"
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={settings.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={!isHost || loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4ECDC4',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Max Participants"
              type="number"
              value={settings.max_participants}
              onChange={(e) => handleInputChange('max_participants', parseInt(e.target.value))}
              disabled={!isHost || loading}
              inputProps={{ min: 1, max: 1000 }}
            />
          </Grid>

          {/* Privacy & Access */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <Security />
              Privacy & Access
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.is_public}
                  onChange={(e) => handleInputChange('is_public', e.target.checked)}
                  disabled={!isHost || loading}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {settings.is_public ? <Public /> : <Lock />}
                  {settings.is_public ? 'Public Room' : 'Private Room'}
                </Box>
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.require_approval}
                  onChange={(e) => handleInputChange('require_approval', e.target.checked)}
                  disabled={!isHost || loading}
                />
              }
              label="Require Approval to Join"
            />
          </Grid>

          {/* Room Features */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <Chat />
              Room Features
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.allow_chat}
                  onChange={(e) => handleInputChange('allow_chat', e.target.checked)}
                  disabled={!isHost || loading}
                />
              }
              label="Enable Chat"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.allow_reactions}
                  onChange={(e) => handleInputChange('allow_reactions', e.target.checked)}
                  disabled={!isHost || loading}
                />
              }
              label="Enable Reactions"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.mute_participants}
                  onChange={(e) => handleInputChange('mute_participants', e.target.checked)}
                  disabled={!isHost || loading}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VolumeOff />
                  Mute All Participants
                </Box>
              }
            />
          </Grid>

          {/* Danger Zone */}
          {isHost && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3, color: 'error.main' }}>
                <Warning />
                Danger Zone
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<Delete />}
                  onClick={() => {
                    setDeleteType('soft');
                    setShowDeleteConfirm(true);
                  }}
                  disabled={loading}
                >
                  Close Room
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteForever />}
                  onClick={() => {
                    setDeleteType('permanent');
                    setShowDeleteConfirm(true);
                  }}
                  disabled={loading}
                >
                  Delete Permanently
                </Button>
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                <strong>Close Room:</strong> Marks room as inactive, can be reactivated later.<br />
                <strong>Delete Permanently:</strong> Completely removes the room and all data. This cannot be undone.
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ 
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 'bold',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          Cancel
        </Button>
        {isHost && (
          <Button
            onClick={handleSaveSettings}
            variant="contained"
            startIcon={<Save />}
            disabled={loading || !settings.title.trim()}
            sx={{
              background: 'linear-gradient(45deg, #4ECDC4, #44A08D)',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
              '&:hover': {
                background: 'linear-gradient(45deg, #44A08D, #4ECDC4)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 16px rgba(78, 205, 196, 0.3)'
              },
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.3)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Save Settings
          </Button>
        )}
      </DialogActions>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
            <Warning />
            Confirm {deleteType === 'permanent' ? 'Permanent Deletion' : 'Room Closure'}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {deleteType === 'permanent' ? (
              <>
                <strong>This will permanently delete the room and all associated data:</strong>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Room information and settings</li>
                  <li>Chat messages and history</li>
                  <li>Playlist and tracks</li>
                  <li>Participant data</li>
                </ul>
                <strong>This action cannot be undone!</strong>
              </>
            ) : (
              <>
                <strong>This will close the room:</strong>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>All participants will be removed</li>
                  <li>Room will be marked as inactive</li>
                  <li>Data will be preserved for potential reactivation</li>
                </ul>
              </>
            )}
          </Alert>
          
          <Typography>
            Are you sure you want to {deleteType === 'permanent' ? 'permanently delete' : 'close'} the room "{room.title}"?
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteRoom}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={deleteType === 'permanent' ? <DeleteForever /> : <Delete />}
          >
            {deleteType === 'permanent' ? 'Delete Permanently' : 'Close Room'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default RoomSettings;

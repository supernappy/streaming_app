import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Avatar
} from '@mui/material';
import { 
  ArrowBack,
  MusicNote
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { roomsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ModernRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  // Room state
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    loadRoom();
  }, [id, isAuthenticated, navigate]);

  const loadRoom = async () => {
    try {
      setLoading(true);
      const response = await roomsAPI.getRoom(id);
      setRoom(response);
    } catch (error) {
      console.error('Failed to load room:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <Box sx={{ 
            width: 80, 
            height: 80, 
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            mx: 'auto',
            mb: 2
          }} />
          <Typography variant="h6">Loading the vibe...</Typography>
        </Box>
      </Box>
    );
  }

  if (!room) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Room not found</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <AppBar 
        position="sticky" 
        sx={{ 
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <Toolbar>
          <IconButton 
            edge="start" 
            color="inherit" 
            onClick={() => navigate('/rooms')}
            sx={{ 
              mr: 2,
              '&:hover': { transform: 'scale(1.1)' }
            }}
          >
            <ArrowBack />
          </IconButton>
          
          <Avatar sx={{ 
            width: 40, 
            height: 40, 
            mr: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}>
            <MusicNote />
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {room.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Modern Room - Under Construction
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 3, position: 'relative', zIndex: 2 }}>
        <Box sx={{ textAlign: 'center', color: 'white', mt: 8 }}>
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
            🎵 Welcome to {room.name}
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.8 }}>
            Modern audio experience coming soon...
          </Typography>
          
          <Box sx={{
            p: 4,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '24px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            maxWidth: 600,
            mx: 'auto'
          }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              The modern room experience is being loaded...
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Room ID: {room.id}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Description: {room.description || 'No description'}
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default ModernRoom;

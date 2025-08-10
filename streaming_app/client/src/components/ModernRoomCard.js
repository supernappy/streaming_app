import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  PlayArrow,
  People,
  VolumeUp,
  Favorite,
  Share,
  MoreVert
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '20px',
  overflow: 'hidden',
  position: 'relative',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: 'none',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    backdropFilter: 'blur(10px)',
    zIndex: 1
  }
}));

const ContentWrapper = styled(Box)({
  position: 'relative',
  zIndex: 2,
  color: 'white'
});

const LiveIndicator = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '16px',
  right: '16px',
  zIndex: 3,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: 'rgba(76, 175, 80, 0.9)',
  backdropFilter: 'blur(10px)',
  borderRadius: '20px',
  padding: '4px 12px',
  fontSize: '12px',
  fontWeight: 600,
  color: 'white',
  '&::before': {
    content: '""',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4CAF50',
    animation: 'pulse 2s infinite'
  },
  '@keyframes pulse': {
    '0%': {
      boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)'
    },
    '70%': {
      boxShadow: '0 0 0 10px rgba(76, 175, 80, 0)'
    },
    '100%': {
      boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)'
    }
  }
}));

const ActionButtons = styled(Box)({
  display: 'flex',
  gap: '8px',
  marginTop: '16px'
});

const StyledIconButton = styled(IconButton)({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  color: 'white',
  width: '40px',
  height: '40px',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.2)',
    transform: 'scale(1.1)'
  }
});

const ModernRoomCard = ({ room, onJoin }) => {
  const theme = useTheme();

  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  ];

  const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

  return (
    <StyledCard
      onClick={() => onJoin(room.id)}
      sx={{ background: randomGradient }}
    >
      <LiveIndicator>
        LIVE
      </LiveIndicator>
      
      <CardContent sx={{ padding: '24px' }}>
        <ContentWrapper>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                fontSize: '24px',
                fontWeight: 'bold'
              }}
            >
              {room.name?.charAt(0)?.toUpperCase() || 'R'}
            </Avatar>
            <Box flex={1}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  marginBottom: '4px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                {room.name || 'Unnamed Room'}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.9,
                  fontSize: '0.875rem',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}
              >
                Host: {room.host || 'Unknown'}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Chip
              icon={<People sx={{ color: 'white !important' }} />}
              label={`${room.participants || 0} listening`}
              size="small"
              sx={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                fontWeight: 600,
                '& .MuiChip-icon': {
                  color: 'white'
                }
              }}
            />
            {room.currentTrack && (
              <Chip
                icon={<VolumeUp sx={{ color: 'white !important' }} />}
                label={room.currentTrack}
                size="small"
                sx={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  fontWeight: 600,
                  maxWidth: '200px',
                  '& .MuiChip-label': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }
                }}
              />
            )}
          </Box>

          <ActionButtons>
            <Tooltip title="Join Room">
              <StyledIconButton onClick={(e) => { e.stopPropagation(); onJoin(room.id); }}>
                <PlayArrow />
              </StyledIconButton>
            </Tooltip>
            <Tooltip title="Add to Favorites">
              <StyledIconButton onClick={(e) => e.stopPropagation()}>
                <Favorite />
              </StyledIconButton>
            </Tooltip>
            <Tooltip title="Share Room">
              <StyledIconButton onClick={(e) => e.stopPropagation()}>
                <Share />
              </StyledIconButton>
            </Tooltip>
            <Tooltip title="More Options">
              <StyledIconButton onClick={(e) => e.stopPropagation()}>
                <MoreVert />
              </StyledIconButton>
            </Tooltip>
          </ActionButtons>
        </ContentWrapper>
      </CardContent>
    </StyledCard>
  );
};

export default ModernRoomCard;
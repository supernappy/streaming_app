import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Badge,
  Tooltip,
  Card,
  CardContent,
  Stack,
  Zoom,
  Fade
} from '@mui/material';
import {
  Mic,
  MicOff,
  VolumeUp,
  VolumeOff,
  PanTool,
  Star,
  Crown,
  Headphones,
  GraphicEq,
  Favorite,
  EmojiEvents,
  LocalFireDepartment,
  MusicNote,
  Waves
} from '@mui/icons-material';

const ParticipantsList = ({ participants, isHost, currentUser }) => {
  const [hoveredParticipant, setHoveredParticipant] = useState(null);

  const getParticipantStatus = (participant) => {
    if (participant.isHost) return 'host';
    if (participant.handRaised) return 'speaking';
    if (participant.isMuted) return 'muted';
    return 'listening';
  };

  const getStatusColor = (status) => {
    const colors = {
      host: 'linear-gradient(45deg, #FFD700, #FFA500)',
      speaking: 'linear-gradient(45deg, #4ECDC4, #44A08D)',
      muted: 'linear-gradient(45deg, #FF6B6B, #FF8E53)',
      listening: 'linear-gradient(45deg, #667eea, #764ba2)'
    };
    return colors[status];
  };

  const getStatusIcon = (participant) => {
    if (participant.isHost) return <Crown />;
    if (participant.handRaised) return <PanTool />;
    if (participant.isMuted) return <MicOff />;
    return <Headphones />;
  };

  const getVibeEmoji = (participant) => {
    const vibes = ['🎵', '🎶', '🔥', '⚡', '🌟', '💫', '🎪', '🎨'];
    const index = participant.id ? participant.id.charCodeAt(0) % vibes.length : 0;
    return vibes[index];
  };

  return (
    <Card sx={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      height: '100%'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', flex: 1 }}>
            Who's Vibing ({participants.length})
          </Typography>
          <Chip
            icon={<GraphicEq />}
            label="Live"
            size="small"
            sx={{
              background: 'linear-gradient(45deg, #4ECDC4, #44A08D)',
              color: 'white',
              fontWeight: 'bold',
              animation: 'pulse 2s infinite'
            }}
          />
        </Box>

        <List sx={{ maxHeight: 'calc(100% - 80px)', overflow: 'auto', pr: 1 }}>
          {participants.map((participant, index) => {
            const status = getParticipantStatus(participant);
            const isCurrentUser = currentUser && participant.id === currentUser.id;
            
            return (
              <Zoom in timeout={300 + index * 100} key={participant.id || index}>
                <ListItem
                  sx={{
                    borderRadius: '16px',
                    mb: 1,
                    background: isCurrentUser ? 'rgba(78, 205, 196, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    border: isCurrentUser ? '1px solid rgba(78, 205, 196, 0.3)' : 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.1)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onMouseEnter={() => setHoveredParticipant(participant.id)}
                  onMouseLeave={() => setHoveredParticipant(null)}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      badgeContent={
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: getStatusColor(status),
                            border: '2px solid white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Box sx={{ color: 'white', fontSize: '8px' }}>
                            {getStatusIcon(participant)}
                          </Box>
                        </Box>
                      }
                    >
                      <Avatar
                        sx={{
                          width: 50,
                          height: 50,
                          background: getStatusColor(status),
                          fontSize: '1.5rem',
                          animation: participant.handRaised ? 'bounce 1s infinite' : 
                                    participant.isHost ? 'glow 3s ease-in-out infinite' : 'none'
                        }}
                      >
                        {participant.isHost ? <Crown /> : getVibeEmoji(participant)}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          sx={{ 
                            color: 'white', 
                            fontWeight: 'bold',
                            fontSize: isCurrentUser ? '1.1rem' : '1rem'
                          }}
                        >
                          {participant.display_name || participant.username || 'Anonymous'}
                          {isCurrentUser && ' (You)'}
                        </Typography>
                        {participant.isHost && (
                          <Chip
                            icon={<Crown />}
                            label="Host"
                            size="small"
                            sx={{
                              background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                              color: 'white',
                              fontSize: '0.7rem',
                              height: '20px'
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            {status === 'host' && 'Leading the vibe'}
                            {status === 'speaking' && 'Speaking up'}
                            {status === 'muted' && 'Listening quietly'}
                            {status === 'listening' && 'Vibing along'}
                          </Typography>
                          
                          {hoveredParticipant === participant.id && (
                            <Fade in>
                              <Stack direction="row" spacing={0.5}>
                                {participant.handRaised && (
                                  <Tooltip title="Hand raised">
                                    <PanTool sx={{ fontSize: 12, color: '#4ECDC4' }} />
                                  </Tooltip>
                                )}
                                {participant.isMuted && (
                                  <Tooltip title="Muted">
                                    <MicOff sx={{ fontSize: 12, color: '#FF6B6B' }} />
                                  </Tooltip>
                                )}
                                {!participant.isMuted && !participant.handRaised && (
                                  <Tooltip title="Active">
                                    <Waves sx={{ fontSize: 12, color: '#4ECDC4' }} />
                                  </Tooltip>
                                )}
                              </Stack>
                            </Fade>
                          )}
                        </Stack>

                        {/* Energy/Activity Indicator */}
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            Energy:
                          </Typography>
                          <Box sx={{ 
                            width: 30, 
                            height: 3, 
                            background: 'rgba(255,255,255,0.2)', 
                            borderRadius: 2,
                            overflow: 'hidden'
                          }}>
                            <Box
                              sx={{
                                width: `${Math.random() * 100}%`, // Simulate energy level
                                height: '100%',
                                background: status === 'host' ? 'linear-gradient(45deg, #FFD700, #FFA500)' :
                                           status === 'speaking' ? 'linear-gradient(45deg, #4ECDC4, #44A08D)' :
                                           'linear-gradient(45deg, #667eea, #764ba2)',
                                transition: 'width 0.5s ease'
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    }
                  />

                  {/* Action Buttons for Host */}
                  {isHost && !isCurrentUser && (
                    <Box sx={{ ml: 1 }}>
                      <Stack direction="column" spacing={0.5}>
                        <Tooltip title="Give recognition">
                          <IconButton 
                            size="small"
                            sx={{ 
                              color: 'rgba(255,255,255,0.7)',
                              '&:hover': { color: '#FFD700', transform: 'scale(1.2)' }
                            }}
                          >
                            <EmojiEvents sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Send love">
                          <IconButton 
                            size="small"
                            sx={{ 
                              color: 'rgba(255,255,255,0.7)',
                              '&:hover': { color: '#FF6B6B', transform: 'scale(1.2)' }
                            }}
                          >
                            <Favorite sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  )}
                </ListItem>
              </Zoom>
            );
          })}

          {participants.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Avatar sx={{ 
                width: 60, 
                height: 60, 
                mx: 'auto', 
                mb: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <MusicNote sx={{ fontSize: 30 }} />
              </Avatar>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                No one here yet
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Be the first to join the vibe!
              </Typography>
            </Box>
          )}
        </List>

        {/* Room Stats */}
        {participants.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#4ECDC4', fontWeight: 'bold' }}>
                  {participants.filter(p => !p.isMuted).length}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Active
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
                  {participants.filter(p => p.handRaised).length}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Speaking
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#FF6B6B', fontWeight: 'bold' }}>
                  {participants.filter(p => p.isMuted).length}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Listening
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ParticipantsList;

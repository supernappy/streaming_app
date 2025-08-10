import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
  Button,
  Tooltip,
  Badge,
  LinearProgress,
  Stack,
  Fade,
  Zoom,
  Paper,
  Backdrop
} from '@mui/material';
import {
  Groups,
  Star,
  StarBorder,
  Share,
  Bookmark,
  BookmarkBorder,
  Schedule,
  Language,
  VolumeUp,
  PanTool,
  Visibility,
  AccessTime,
  TrendingUp,
  AutoAwesome,
  LiveTv,
  PlayArrow,
  Favorite,
  FavoriteBorder,
  MoreVert,
  Notifications,
  NotificationsActive
} from '@mui/icons-material';

const EnhancedRoomCard = ({ 
  room, 
  onJoin, 
  onFollow, 
  onShare, 
  isFollowing = false,
  showAnalytics = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const getCategoryIcon = (category) => {
    const icons = {
      music: '🎵',
      business: '💼',
      education: '📚',
      gaming: '🎮',
      entertainment: '🎬',
      wellness: '🧘',
      fitness: '💪',
      social: '👥'
    };
    return icons[category] || '💬';
  };

  const getMoodColor = (mood) => {
    const colors = {
      energetic: '#ff4757',
      chill: '#3742fa',
      focused: '#2ed573',
      creative: '#ff6348',
      social: '#ffa502',
      learning: '#5352ed',
      supportive: '#ff9ff3'
    };
    return colors[mood] || '#1DB954';
  };

  const getThemeGradient = (theme) => {
    const gradients = {
      sunset: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      ocean: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      forest: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
      cosmic: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      neon: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      default: 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)'
    };
    return gradients[theme] || gradients.default;
  };

  const getEnhancedGradient = (theme, isLive, isHovered) => {
    const baseGradients = {
      sunset: isHovered 
        ? 'linear-gradient(135deg, #ff7675 0%, #fd79a8 100%)' 
        : 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      ocean: isHovered 
        ? 'linear-gradient(135deg, #5a6acf 0%, #6c5ce7 100%)' 
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      forest: isHovered 
        ? 'linear-gradient(135deg, #00b894 0%, #55efc4 100%)' 
        : 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
      cosmic: isHovered 
        ? 'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)' 
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      neon: isHovered 
        ? 'linear-gradient(135deg, #00cec9 0%, #55efc4 100%)' 
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      default: isHovered 
        ? 'linear-gradient(135deg, #00b894 0%, #55efc4 100%)' 
        : 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)'
    };

    const liveGradients = {
      sunset: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
      ocean: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
      forest: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
      cosmic: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)',
      neon: 'linear-gradient(135deg, #00cec9 0%, #00b894 100%)',
      default: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'
    };

    return isLive ? liveGradients[theme] || liveGradients.default : baseGradients[theme] || baseGradients.default;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const isScheduled = room.scheduled_start && new Date(room.scheduled_start) > new Date();
  const isLive = room.is_active && !isScheduled;
  const occupancyRate = (room.participant_count / room.max_participants) * 100;

  return (
    <Zoom in timeout={300}>
      <Card
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          height: '100%',
          position: 'relative',
          background: getEnhancedGradient(room.background_theme || 'default', isLive, isHovered),
          border: `2px solid ${isLive ? '#ff4757' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '20px',
          overflow: 'hidden',
          cursor: 'pointer',
          boxShadow: isHovered 
            ? '0 25px 50px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)' 
            : '0 15px 35px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.08)',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
          backdropFilter: 'blur(10px)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isLive 
              ? 'radial-gradient(circle at 50% 50%, rgba(255, 107, 107, 0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle at 50% 50%, rgba(116, 185, 255, 0.2) 0%, transparent 70%)',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
            zIndex: 1,
            animation: isLive ? 'pulse 2s infinite' : 'none'
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, transparent 49%, rgba(255,255,255,0.03) 50%, transparent 51%)',
            zIndex: 2,
            pointerEvents: 'none'
          }
        }}
      >
        {/* Live Badge with enhanced animation */}
        {isLive && (
          <Fade in timeout={500}>
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 10,
                background: 'linear-gradient(45deg, #ff4757, #ff3742)',
                borderRadius: '20px',
                padding: '6px 12px',
                boxShadow: '0 4px 15px rgba(255, 71, 87, 0.4)',
                animation: 'pulse 2s infinite'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LiveTv sx={{ fontSize: 16, color: 'white' }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '0.7rem'
                  }}
                >
                  LIVE
                </Typography>
              </Box>
            </Box>
          </Fade>
        )}
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.2)',
            zIndex: 1
          }
        }}
        onClick={() => onJoin(room.id)}
      >
        {/* Live/Scheduled Badge */}
        <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 3 }}>
          {isLive && (
            <Chip
              icon={<LiveTv />}
              label="LIVE"
              size="small"
              sx={{
                background: 'rgba(255, 71, 87, 0.9)',
                color: 'white',
                fontWeight: 'bold',
                animation: 'pulse 2s infinite'
              }}
            />
          )}
          {isScheduled && (
            <Chip
              icon={<Schedule />}
              label="Scheduled"
              size="small"
              sx={{
                background: 'rgba(53, 82, 237, 0.9)',
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          )}
        </Box>

        {/* Featured Badge */}
        {room.featured && (
          <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 3 }}>
            <Tooltip title="Featured Room">
              <Avatar sx={{ 
                width: 32, 
                height: 32, 
                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                animation: 'sparkle 3s infinite'
              }}>
                <AutoAwesome sx={{ fontSize: 18 }} />
              </Avatar>
            </Tooltip>
          </Box>
        )}

        {/* Enhanced Content Area */}
        <Box
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            margin: '16px',
            padding: '20px',
            position: 'relative',
            zIndex: 3,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Header with title and category */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  lineHeight: 1.3,
                  background: 'linear-gradient(45deg, #2c3e50, #34495e)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                {room.title || room.name}
              </Typography>
              
              <Typography variant="body2" sx={{ color: '#888', mb: 1, fontSize: '0.9rem' }}>
                by {room.host_display_name || room.host}
              </Typography>
              
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  icon={<span style={{ fontSize: '14px' }}>{getCategoryIcon(room.category)}</span>}
                  label={room.category}
                  size="small"
                  sx={{
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                    height: '24px',
                    '& .MuiChip-icon': { fontSize: '14px' }
                  }}
                />
                
                {room.mood && (
                  <Chip
                    label={room.mood}
                    size="small"
                    sx={{
                      backgroundColor: getMoodColor(room.mood),
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.7rem',
                      height: '24px'
                    }}
                  />
                )}
              </Stack>
            </Box>

            {/* Action Buttons */}
            <Stack direction="row" spacing={0.5}>
              <Tooltip title={isFavorited ? "Remove from favorites" : "Add to favorites"}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFavorited(!isFavorited);
                  }}
                  sx={{
                    background: isFavorited ? 'linear-gradient(45deg, #ff6b6b, #ee5a24)' : 'rgba(255, 255, 255, 0.8)',
                    color: isFavorited ? 'white' : '#666',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                      color: 'white',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  {isFavorited ? <Favorite sx={{ fontSize: 16 }} /> : <FavoriteBorder sx={{ fontSize: 16 }} />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Share room">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare?.(room);
                  }}
                  sx={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    color: '#666',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #74b9ff, #0984e3)',
                      color: 'white',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <Share sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Description */}
          <Typography
            variant="body2"
            sx={{
              color: '#666',
              mb: 2,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {room.description}
          </Typography>

          {/* Tags */}
          {room.tags && room.tags.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
              {room.tags.slice(0, 3).map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  sx={{
                    background: 'linear-gradient(45deg, #74b9ff, #0984e3)',
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20,
                    fontWeight: 'bold'
                  }}
                />
              ))}
              {room.tags.length > 3 && (
                <Chip
                  label={`+${room.tags.length - 3}`}
                  size="small"
                  sx={{
                    background: 'linear-gradient(45deg, #a29bfe, #6c5ce7)',
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20,
                    fontWeight: 'bold'
                  }}
                />
              )}
            </Stack>
          )}

          {/* Enhanced Stats Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2,
              mb: 2
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                padding: '12px',
                color: 'white',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                {room.participant_count}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Active
              </Typography>
              <Groups sx={{ position: 'absolute', top: 8, right: 8, opacity: 0.3, fontSize: 20 }} />
            </Box>

            <Box
              sx={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '12px',
                padding: '12px',
                color: 'white',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                {formatTimeAgo(room.created_at)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Created
              </Typography>
              <AccessTime sx={{ position: 'absolute', top: 8, right: 8, opacity: 0.3, fontSize: 20 }} />
            </Box>
          </Box>

          {/* Occupancy Bar */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold' }}>
                Capacity
              </Typography>
              <Typography variant="caption" sx={{ color: '#666' }}>
                {room.participant_count}/{room.max_participants}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={occupancyRate}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: occupancyRate > 80 
                    ? 'linear-gradient(45deg, #ff6b6b, #ee5a24)'
                    : occupancyRate > 60 
                    ? 'linear-gradient(45deg, #fdcb6e, #e17055)'
                    : 'linear-gradient(45deg, #00b894, #55efc4)'
                }
              }}
            />
          </Box>

          {/* Enhanced Action Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            onClick={() => onJoin?.(room)}
            sx={{
              background: 'linear-gradient(45deg, #1DB954, #1ed760)',
              borderRadius: '12px',
              padding: '12px',
              fontWeight: 'bold',
              textTransform: 'none',
              fontSize: '1rem',
              boxShadow: '0 4px 15px rgba(29, 185, 84, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(45deg, #1ed760, #17c653)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(29, 185, 84, 0.4)'
              }
            }}
          >
            {isScheduled ? 'Set Reminder' : 'Join Room'}
          </Button>
        </Box> 
            justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box>
            <Tooltip title={isFollowing ? "Unfollow" : "Follow"}>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onFollow(room.id);
                }}
                sx={{ color: 'white' }}
              >
                {isFollowing ? <Star /> : <StarBorder />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Share Room">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(room);
                }}
                sx={{ color: 'white' }}
              >
                <Share />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Card>
    </Zoom>
  );
};

export default EnhancedRoomCard;

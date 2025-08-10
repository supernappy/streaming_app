import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Avatar, 
  Chip,
  IconButton,
  Skeleton,
  Button,
  AppBar,
  Toolbar,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  Tooltip
} from '@mui/material';
import { 
  ArrowBack,
  Groups,
  Mic,
  MicOff,
  PanTool,
  RecordVoiceOver,
  VideoCall,
  Settings,
  ExitToApp,
  VolumeUp,
  VolumeOff,
  PersonAdd,
  Share,
  MoreVert,
  QueueMusic,
  Chat,
  MusicNote,
  Palette,
  Visibility
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { roomsAPI, tracksAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useSocket } from '../contexts/SocketContext_enhanced';
// Import enhanced audio player component
import RoomAudioPlayer_new from '../components/RoomAudioPlayer_new';
import RoomChat from '../components/RoomChat';
import RoomSettings from '../components/RoomSettings';
import RoomThemes from '../components/RoomThemes';
import AudioVisualizer from '../components/AudioVisualizer';

const Room = () => {
  const { recentlyPlayed } = usePlayer ? usePlayer() : { recentlyPlayed: [] };
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { 
    joinRoom, 
    leaveRoom, 
    participants: socketParticipants, 
    roomState, 
    isConnected,
    updateStatus,
    notifyTrackAdded
  } = useSocket();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomError, setRoomError] = useState('');
  const [participants, setParticipants] = useState([]);
  const [roomTracks, setRoomTracks] = useState([]);
  const [userTracks, setUserTracks] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [themeLoading, setThemeLoading] = useState(false);
  // Set initial theme from backend if available
  useEffect(() => {
    if (room && room.background_theme) {
      setCurrentTheme(room.background_theme);
    }
  }, [room]);

  // Handler to update theme both locally and in backend
  const handleThemeChange = async (themeKey) => {
    setThemeLoading(true);
    setCurrentTheme(themeKey);
    try {
      await roomsAPI.updateSettings(id, { background_theme: themeKey });
      setRoom((prev) => prev ? { ...prev, background_theme: themeKey } : prev);
    } catch (err) {
      // Optionally show error to user
      alert('Failed to update theme.');
    } finally {
      setThemeLoading(false);
    }
  };
  const [showVisualizer, setShowVisualizer] = useState(true);
  const [visualizerType, setVisualizerType] = useState('bars');
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchRoom();
    fetchParticipants();
    fetchRoomTracks();
    fetchUserTracks();
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (room && user) {
      const hostStatus = room.host_id === user.id;
      console.log('=== DEBUG: Host status check ===');
      console.log('Room:', room);
      console.log('Room host_id:', room.host_id);
      console.log('Current user:', user);
      console.log('Current user ID:', user.id);
      console.log('Is host:', hostStatus);
      console.log('User ID type:', typeof user.id);
      console.log('Host ID type:', typeof room.host_id);
      
      setIsHost(hostStatus);
      
      // Join the room via API (to be added to participants table)
      if (!hostStatus) {
        // Non-hosts need to join the room as participants
        roomsAPI.join(id).then((response) => {
          console.log('Successfully joined room as participant:', response);
        }).catch(error => {
          console.error('Failed to join room:', error);
          // Check if it's because already joined
          if (error.response?.status !== 409) {
            console.warn('Unexpected error joining room, but continuing...');
          }
        });
      }
      
      // Join the room via WebSocket
      if (isConnected) {
        console.log('Joining room via WebSocket:', id, user);
        joinRoom(id, user);
      }
    }
  }, [room, user, isConnected, id, joinRoom]);

  // Sync participants with WebSocket
  useEffect(() => {
    if (socketParticipants.length > 0) {
      setParticipants(socketParticipants);
    }
  }, [socketParticipants]);

  // Sync room state with WebSocket
  useEffect(() => {
    if (roomState) {
      setRoom(roomState);
    }
  }, [roomState]);

  const fetchRoom = async () => {
    try {
      const response = await roomsAPI.getById(id);
      console.log('[Room.js] fetchRoom response:', response);
      setRoom(response.data.room);
      setRoomError('');
    } catch (error) {
      console.error('[Room.js] Error fetching room:', error);
      setRoomError('Failed to load room data. Please check your backend/API and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await roomsAPI.getParticipants(id);
      setParticipants(response.data.participants || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const fetchRoomTracks = async () => {
    try {
      console.log('=== DEBUG: Fetching room tracks ===');
      console.log('Room ID:', id);
      const response = await roomsAPI.getTracks(id);
      console.log('Room tracks response:', response.data);
      console.log('Room tracks array:', response.data.tracks);
      setRoomTracks(response.data.tracks || []);
      console.log('Room tracks set, length:', (response.data.tracks || []).length);
    } catch (error) {
      console.error('Error fetching room tracks:', error);
      setRoomTracks([]); // Set empty array on error
    }
  };

  const fetchUserTracks = async () => {
    try {
      const response = await tracksAPI.getUserTracks();
      setUserTracks(response.data.tracks || []);
    } catch (error) {
      console.error('Error fetching user tracks:', error);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      leaveRoom(); // Leave WebSocket room
      await roomsAPI.leave(id);
      navigate('/rooms');
    } catch (error) {
      console.error('Error leaving room:', error);
      alert('Failed to leave room. Please try again.');
    }
  };

  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    updateStatus({ isMuted: newMutedState });
  };

  const handleRaiseHand = () => {
    console.log('handleRaiseHand clicked, current handRaised:', handRaised);
    console.log('isConnected:', isConnected);
    console.log('currentRoom:', roomState);
    const newHandState = !handRaised;
    console.log('newHandState:', newHandState);
    setHandRaised(newHandState);
    updateStatus({ handRaised: newHandState });
    console.log('updateStatus called with:', { handRaised: newHandState });
  };

  const handleAddTrackToRoom = async (track) => {
    try {
      console.log('=== DEBUG: Room handleAddTrackToRoom ===');
      console.log('Room ID:', id);
      console.log('Track to add:', track);
      console.log('Track ID:', track.id);
      console.log('User:', user);
      console.log('Is authenticated:', isAuthenticated);
      
      if (!track || !track.id) {
        throw new Error('Invalid track: missing track or track ID');
      }
      
      if (!id) {
        throw new Error('Invalid room: missing room ID');
      }
      
      console.log('Making API call to add track...');
      const response = await roomsAPI.addTrack(id, track.id);
      console.log('API response:', response);
      
      setRoomTracks(prev => {
        const updated = [...prev, track];
        console.log('Updated room tracks:', updated);
        return updated;
      });
      
      notifyTrackAdded(track); // Notify via WebSocket
      console.log('=== DEBUG: Track added successfully to room ===');
      console.log('Track title:', track.title);
    } catch (error) {
      console.error('=== DEBUG: Error in handleAddTrackToRoom ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Show user-friendly error message
      if (error.response?.status === 403) {
        alert('You do not have permission to add tracks to this room. Make sure you are a participant.');
      } else if (error.response?.status === 404) {
        alert('Track or room not found. Please refresh and try again.');
      } else if (error.response?.status === 409) {
        alert('This track is already in the room. You cannot add the same track twice.');
      } else {
        alert(`Failed to add track to room: ${error.response?.data?.error || error.message}`);
      }
      
      // Re-throw so the component can handle it too
      throw error;
    }
  };

  const handleRemoveTrackFromRoom = async (track) => {
    try {
      console.log('=== DEBUG: Room handleRemoveTrackFromRoom ===');
      console.log('Room ID:', id);
      console.log('Track to remove:', track);
      console.log('Track ID:', track.id);
      console.log('User:', user);
      console.log('Is authenticated:', isAuthenticated);
      
      if (!track || !track.id) {
        throw new Error('Invalid track: missing track or track ID');
      }
      
      if (!id) {
        throw new Error('Invalid room: missing room ID');
      }
      
      // Show confirmation dialog
      const confirmed = window.confirm(`Are you sure you want to remove "${track.title}" from this room?`);
      if (!confirmed) {
        return;
      }
      
      console.log('Making API call to remove track...');
      const response = await roomsAPI.removeTrack(id, track.id);
      console.log('API response:', response);
      
      // Update local state
      setRoomTracks(prev => {
        const updated = prev.filter(t => t.id !== track.id);
        console.log('Updated room tracks after removal:', updated);
        return updated;
      });
      
      console.log('=== DEBUG: Track removed successfully from room ===');
      console.log('Track title:', track.title);
    } catch (error) {
      console.error('=== DEBUG: Error in handleRemoveTrackFromRoom ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Show user-friendly error message
      if (error.response?.status === 403) {
        alert('You do not have permission to remove tracks from this room.');
      } else if (error.response?.status === 404) {
        alert('Track not found in room or room not found.');
      } else {
        alert(`Failed to remove track from room: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  const handleRoomUpdated = (updatedRoom) => {
    setRoom(updatedRoom);
    console.log('Room updated:', updatedRoom.title);
  };

  const handleRoomDeleted = (roomId, isPermanent) => {
    console.log('Room deleted:', roomId, 'permanent:', isPermanent);
    // Navigate back to rooms list
    navigate('/rooms');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, mb: 10 }}>
        <Paper sx={{ p: 4 }}>
          <Skeleton variant="text" width="30%" height={40} />
          <Skeleton variant="text" width="50%" height={24} sx={{ mt: 2 }} />
          <Box sx={{ mt: 4 }}>
            <Skeleton variant="rectangular" height={200} />
          </Box>
        </Paper>
      </Container>
    );
  }

  if (roomError) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {roomError}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Try refreshing the page or check your backend/API logs for errors.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      pb: 2,
      transition: 'background 0.5s',
      background: (() => {
        // Map theme keys to backgrounds (sync with RoomThemes.js)
        switch (currentTheme) {
          case 'light': return '#fff';
          case 'dark': return '#222';
          case 'aqua': return '#4ecdc4';
          case 'sunset': return 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)';
          case 'forest': return '#228B22';
          case 'midnight': return 'linear-gradient(135deg, #232526 0%, #414345 100%)';
          case 'lavender': return '#b57edc';
          case 'peach': return '#ffdab9';
          case 'ocean': return 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)';
          case 'rose': return '#ffb6c1';
          case 'space': return 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)';
          default: return 'linear-gradient(135deg, #232526 0%, #414345 100%)';
        }
      })()
    }}>
      <RoomThemes theme={currentTheme} onThemeChange={handleThemeChange} loading={themeLoading} />
      {/* Enhanced Room Header */}
      <AppBar 
        position="static" 
        sx={{ 
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'none'
        }}
      >
        <Toolbar>
          <IconButton 
            onClick={() => navigate('/rooms')} 
            sx={{ mr: 2, color: 'white' }}
          >
            <ArrowBack />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
              {room?.title || `Room ${id}`}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Host: {room?.host_username} • {participants.length} participants
            </Typography>
          </Box>

          {/* Room Status & Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={room?.is_active ? 'Live' : 'Inactive'} 
              color={room?.is_active ? 'success' : 'default'}
              size="small"
            />
            <IconButton 
              onClick={handleMuteToggle}
              sx={{ 
                color: isMuted ? '#ff4444' : 'white',
                backgroundColor: isMuted ? 'rgba(255, 68, 68, 0.1)' : 'transparent'
              }}
            >
              {isMuted ? <MicOff /> : <Mic />}
            </IconButton>
            <IconButton 
              onClick={handleRaiseHand}
              sx={{ 
                color: handRaised ? '#1DB954' : 'white',
                backgroundColor: handRaised ? 'rgba(29, 185, 84, 0.1)' : 'transparent'
              }}
            >
              <PanTool />
            </IconButton>
            

            
            <Tooltip title="Toggle Visualizer">
              <IconButton 
                onClick={() => setShowVisualizer(!showVisualizer)}
                sx={{ 
                  color: showVisualizer ? '#1DB954' : 'white',
                  backgroundColor: showVisualizer ? 'rgba(29, 185, 84, 0.1)' : 'transparent'
                }}
              >
                <Visibility />
              </IconButton>
            </Tooltip>
            
            <IconButton 
              onClick={() => setShowLeaveDialog(true)}
              sx={{ color: '#ff4444' }}
            >
              <ExitToApp />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Room Info */}
        <Paper sx={{
          p: 3,
          mb: 3,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              sx={{ 
                width: 60, 
                height: 60, 
                backgroundColor: '#1DB954',
                mr: 3
              }}
            >
              <RecordVoiceOver sx={{ fontSize: 30 }} />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
                {room?.title}
              </Typography>
              {room?.description && (
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
                  {room.description}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                {room?.category && (
                  <Chip label={room.category} size="small" variant="outlined" sx={{ color: 'white' }} />
                )}
                {room?.mood && (
                  <Chip label={room.mood} size="small" variant="outlined" sx={{ color: 'white' }} />
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Badge badgeContent={participants.length} color="primary">
                <Groups sx={{ color: 'white' }} />
              </Badge>
              <IconButton 
                sx={{ color: showChat ? 'primary.main' : 'white' }}
                onClick={() => setShowChat(!showChat)}
              >
                <Chat />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <Share />
              </IconButton>
              {isHost && (
                <IconButton 
                  sx={{ color: 'white' }}
                  onClick={() => setShowSettings(true)}
                  title="Room Settings"
                >
                  <Settings />
                </IconButton>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Audio Visualizer */}
        {showVisualizer && roomTracks.length > 0 && (
          <Paper sx={{
            p: 2,
            mb: 3,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <AudioVisualizer 
              type={visualizerType}
              theme={currentTheme}
            />
          </Paper>
        )}

        {/* Main Content */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={showChat ? 8 : 12}>
            {/* Audio Player Component with Error Boundary */}
            {roomTracks && roomTracks.length > 0 ? (
              <>
                <RoomAudioPlayer_new 
                  room={room}
                  isHost={isHost}
                  tracks={roomTracks}
                  onAddTrack={handleAddTrackToRoom}
                  onRemoveTrack={handleRemoveTrackFromRoom}
                />
                {/* Room Track List with Play Count Tooltips */}
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    Room Track List
                  </Typography>
                  <Grid container spacing={2}>
                    {roomTracks.map((track) => (
                      <Grid item xs={12} sm={6} md={4} key={track.id}>
                        <Tooltip title={track.play_count === 1 ? 'Played once' : `Played ${track.play_count || 0} times`} arrow>
                          <Paper sx={{ p: 2, bgcolor: '#23272f', color: 'white' }}>
                            <Typography variant="subtitle1" noWrap>{track.title}</Typography>
                            <Typography variant="body2" color="#aaa" noWrap>{track.artist}</Typography>
                            <Typography variant="caption" color="#aaa">
                              Plays: {track.play_count || 0}
                            </Typography>
                          </Paper>
                        </Tooltip>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </>
            ) : (
              <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <MusicNote sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No tracks in this room
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isHost ? 'Add some tracks to get started!' : 'Waiting for host to add tracks...'}
                  </Typography>
                </Box>
              </Paper>
            )}
            {/* Recently Played Section */}
            {recentlyPlayed && recentlyPlayed.length > 0 && (
              <Box sx={{ mt: 6, mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: 'white' }}>
                  Recently Played
                </Typography>
                <Grid container spacing={2}>
                  {recentlyPlayed.slice(0, 8).map((track) => (
                    <Grid item xs={12} sm={6} md={3} key={track.id}>
                      <Tooltip title={track.play_count === 1 ? 'Played once' : `Played ${track.play_count || 0} times`} arrow>
                        <Paper sx={{ bgcolor: '#23272f', color: 'white', p: 2 }}>
                          <Typography variant="subtitle1" noWrap>{track.title}</Typography>
                          <Typography variant="body2" color="#aaa" noWrap>{track.artist}</Typography>
                          <Typography variant="caption" color="#aaa">
                            Plays: {track.play_count || 0}
                          </Typography>
                        </Paper>
                      </Tooltip>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* AI Recommendations Section */}
            <Box sx={{ mt: 8, mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: 'white' }}>
                AI Picks For This Room
              </Typography>
            </Box>

            {/* Add Tracks Section - Only show if user is host or has permission */}
            {isHost && (
              <Paper elevation={3} sx={{ 
                p: 3, 
                mt: 3,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'white', display: 'flex', alignItems: 'center' }}>
                  <QueueMusic sx={{ mr: 1 }} />
                  Add Tracks to Room
                  <Chip 
                    label={`${userTracks.length} available`} 
                    size="small" 
                    sx={{ ml: 2, backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} 
                  />
                </Typography>
                
                {userTracks.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <MusicNote sx={{ fontSize: 48, color: 'rgba(255,255,255,0.5)', mb: 2 }} />
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
                      You don't have any tracks yet
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => navigate('/upload')}
                      startIcon={<MusicNote />}
                    >
                      Upload Your First Track
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    {userTracks.map((track) => {
                      const isAlreadyInRoom = roomTracks.some(rt => rt.id === track.id);
                      return (
                        <Box
                          key={track.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 2,
                            mb: 1,
                            borderRadius: 2,
                            backgroundColor: isAlreadyInRoom ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                            border: isAlreadyInRoom ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                            transition: 'all 0.2s ease',
                            '&:hover': !isAlreadyInRoom ? {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              transform: 'translateX(4px)'
                            } : {}
                          }}
                        >
                          <Avatar sx={{ width: 50, height: 50, mr: 2, backgroundColor: 'primary.main' }}>
                            <MusicNote />
                          </Avatar>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                color: 'white', 
                                fontWeight: 'bold',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {track.title}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'rgba(255,255,255,0.7)',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {track.artist}
                            </Typography>
                            {track.duration && (
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                Duration: {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                              </Typography>
                            )}
                          </Box>
                          {isAlreadyInRoom ? (
                            <Chip 
                              label="In Room" 
                              color="success" 
                              size="small"
                              icon={<MusicNote />}
                              sx={{ mr: 1 }}
                            />
                          ) : (
                            <Tooltip title="Add this track to the room">
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={() => handleAddTrackToRoom(track)}
                                startIcon={<QueueMusic />}
                                sx={{
                                  minWidth: 100,
                                  '&:hover': {
                                    backgroundColor: 'primary.dark',
                                    transform: 'scale(1.05)'
                                  }
                                }}
                              >
                                Add
                              </Button>
                            </Tooltip>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Paper>
            )}

            {/* Participants Panel */}
            <Paper sx={{
              p: 3,
              mt: 3,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'white', display: 'flex', alignItems: 'center' }}>
                <Groups sx={{ mr: 1 }} />
                Participants ({participants.length})
                {isHost && (
                  <Button 
                    size="small" 
                    startIcon={<PersonAdd />}
                    sx={{ ml: 'auto', color: '#1DB954' }}
                  >
                    Invite
                  </Button>
                )}
              </Typography>
              
              <List>
                {participants.map((participant, index) => (
                  <ListItem key={participant.id} divider={index < participants.length - 1}>
                    <ListItemAvatar>
                      <Avatar src={participant.avatar_url}>
                        {participant.username?.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ color: 'white' }}>
                            {participant.display_name || participant.username}
                          </Typography>
                          {participant.id === room?.host_id && (
                            <Chip label="Host" size="small" color="primary" />
                          )}
                          {participant.role === 'speaker' && (
                            <Chip label="Speaker" size="small" variant="outlined" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          {participant.is_muted ? 'Muted' : 'Speaking'} • 
                          {participant.hand_raised ? ' Hand raised' : ' Listening'}
                        </Typography>
                      }
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {participant.is_muted ? <VolumeOff color="disabled" /> : <VolumeUp color="primary" />}
                      {participant.hand_raised && <PanTool color="warning" />}
                    </Box>
                  </ListItem>
                ))}
                
                {participants.length === 0 && (
                  <ListItem>
                    <ListItemText 
                      primary={
                        <Typography sx={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                          No participants yet
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>

          {/* Chat Panel */}
          {showChat && (
            <Grid item xs={12} lg={4}>
              <Box sx={{ height: '600px' }}>
                <RoomChat room={room} />
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Leave Room Confirmation Dialog */}
        <Dialog 
          open={showLeaveDialog} 
          onClose={() => setShowLeaveDialog(false)}
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(50, 50, 50, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <DialogTitle sx={{ color: 'white' }}>Leave Room</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Are you sure you want to leave this room?
            </Alert>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
              You can rejoin this room anytime if it's still active.
              {isHost && (
                <Typography component="span" sx={{ color: '#ff4444', fontWeight: 'bold', display: 'block', mt: 1 }}>
                  Warning: As the host, leaving will end the room for all participants.
                </Typography>
              )}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setShowLeaveDialog(false)}
              sx={{ color: 'rgba(255,255,255,0.7)' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLeaveRoom}
              variant="contained"
              color="error"
              startIcon={<ExitToApp />}
            >
              {isHost ? 'End Room' : 'Leave Room'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Room Settings Dialog */}
        <RoomSettings
          open={showSettings}
          onClose={() => setShowSettings(false)}
          room={room}
          isHost={isHost}
          onRoomUpdated={handleRoomUpdated}
          onRoomDeleted={handleRoomDeleted}
        />
      </Container>
      </Box>

  );
};

export default Room;

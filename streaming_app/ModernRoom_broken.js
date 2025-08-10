
import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, AppBar, Toolbar, IconButton, Chip, Avatar, Grid, Card, CardContent, Button, List, ListItem, ListItemAvatar, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, Badge, Fab, Tooltip, TextField } from '@mui/material';
import { tracksAPI } from '../services/api';
import {
  PlayArrow, Pause, SkipNext, SkipPrevious
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useSocket } from '../contexts/SocketContext_enhanced';
import SynchronizedAudioPlayer from '../components/SynchronizedAudioPlayer';
import ParticipantsListSimple from '../components/ParticipantsListSimple';
import RoomChat from '../components/RoomChat';
import RoomSettings from '../components/RoomSettings';
import RoomThemes from '../components/RoomThemes';

const ModernRoom = () => {
  // --- State and hooks ---
  // const { id } = useParams();
  // const navigate = useNavigate();
  // const { isAuthenticated, user } = useAuth();
  // const { recentlyPlayed } = usePlayer ? usePlayer() : { recentlyPlayed: [] };
  // const {
  //   joinRoom,
  //   leaveRoom,
  //   participants: socketParticipants,
  //   roomState,
  //   isConnected,
  //   updateStatus,
  //   notifyTrackAdded,
  //   getParticipants,
  //   socket
  // } = useSocket();

  // const [room, setRoom] = useState(null);
  // const [loading, setLoading] = useState(true);
  // const [participants, setParticipants] = useState([]);
  // const [roomTracks, setRoomTracks] = useState([]); // Duplicate declaration commented out
  // const [userTracks, setUserTracks] = useState([]); // Duplicate declaration commented out
  // const [currentTrack, setCurrentTrack] = useState(null); // Duplicate declaration commented out
  // const [isPlaying, setIsPlaying] = useState(false); // Duplicate declaration commented out
  // const [volume, setVolume] = useState(70); // Duplicate declaration commented out
  // const [roomEnergy, setRoomEnergy] = useState(50); // Duplicate declaration commented out
  // const [showSettings, setShowSettings] = useState(false); // Duplicate declaration commented out
  // const [showChat, setShowChat] = useState(false); // Duplicate declaration commented out
  // const [showParticipants, setShowParticipants] = useState(false); // Duplicate declaration commented out
  // const [showThemes, setShowThemes] = useState(false); // Duplicate declaration commented out
  // const [showAddTrack, setShowAddTrack] = useState(false); // Duplicate declaration commented out
  // const [sparkles, setSparkles] = useState([]); // Duplicate declaration commented out
  // const [roomVibe, setRoomVibe] = useState('chill'); // Duplicate declaration commented out
  // Add track selection state
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [userTracksLoading, setUserTracksLoading] = useState(false);
  const [userTracksError, setUserTracksError] = useState('');

  // Fetch user tracks when opening Add Track dialog
  useEffect(() => {
    if (showAddTrack && userTracks.length === 0 && !userTracksLoading) {
      setUserTracksLoading(true);
      tracksAPI.getUserTracks()
        .then(res => {
          setUserTracks(res.data.tracks || []);
          setUserTracksLoading(false);
        })
        .catch(err => {
          setUserTracksError('Failed to load your tracks');
          setUserTracksLoading(false);
        });
    }
    if (!showAddTrack) {
      setSelectedTrackId('');
      setUserTracksError('');
    }
  }, [showAddTrack]);

  // Add track handler
  const handleAddTrack = async () => {
    const track = userTracks.find(t => t.id === selectedTrackId);
    if (!track) return;
    setRoomTracks(prev => [...prev, track]);
    setShowAddTrack(false);
    setSelectedTrackId('');
    if (notifyTrackAdded) notifyTrackAdded(track);
  };
  // --- State and hooks ---
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { recentlyPlayed } = usePlayer ? usePlayer() : { recentlyPlayed: [] };
  const {
    joinRoom,
    leaveRoom,
    participants: socketParticipants,
    roomState,
    isConnected,
    updateStatus,
    notifyTrackAdded,
    getParticipants,
    socket
  } = useSocket();

  // Room state
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [roomTracks, setRoomTracks] = useState([]);
  const [userTracks, setUserTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [roomEnergy, setRoomEnergy] = useState(50);
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  // const [showAddTrack, setShowAddTrack] = useState(false); // Duplicate declaration commented out
  const [sparkles, setSparkles] = useState([]);
  const [roomVibe, setRoomVibe] = useState('chill');

  // --- Effects for room, participants, etc. (minimal for now) ---
  useEffect(() => {
    // Example: load room data, join room, etc.
    // ...existing logic...
  }, [id, isAuthenticated]);

  // --- Main Layout ---
  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', width: '100%' }}>
      {/* Animated Background */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.2) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.2) 0%, transparent 50%)',
          zIndex: 0
        }
      }} />

      {/* Sparkles Effect */}
      {sparkles.map(sparkle => (
        <Box
          key={sparkle.id}
          sx={{
            position: 'absolute',
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: sparkle.size,
            height: sparkle.size,
            background: sparkle.color,
            borderRadius: '50%',
            animation: 'sparkle 2s ease-in-out',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
      ))}

      {/* Header */}
      <AppBar position="sticky" sx={{ zIndex: 2 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/rooms')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {room?.title || 'Modern Room'}
          </Typography>
          {/* Example: Room vibe chip */}
          <Chip label={roomVibe} sx={{ ml: 2 }} />
          <IconButton color="inherit" onClick={() => setShowSettings(true)}>
            <Settings />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 3, position: 'relative', zIndex: 2 }}>
        <Grid container spacing={3}>
          {/* Player Section */}
          <Grid item xs={12} md={8}>
            {/* Room Playback Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <IconButton
                color="primary"
                onClick={() => {
                  if (roomTracks.length > 0) {
                    if (room?.host_id === user?.id) {
                      // Host triggers play for first track
                      socket.emit('room:play', {
                        roomId: room?.id,
                        trackId: roomTracks[0].id,
                        currentTime: 0
                      });
                    }
                  }
                }}
                disabled={roomTracks.length === 0 || !room?.host_id || !user?.id}
              >
                <PlayArrow />
              </IconButton>
              <IconButton
                color="primary"
                onClick={() => {
                  if (room?.host_id === user?.id) {
                    socket.emit('room:pause', {
                      roomId: room?.id,
                      currentTime: 0
                    });
                  }
                }}
                disabled={!room?.host_id || !user?.id}
              >
        <Pause />
              </IconButton>
              <IconButton
                color="primary"
            onClick={() => {
                  if (room?.hostetIsPlaying(!isPlaying);
                                      setIsPlaying(!isPlaying);
                                                          setIsPlaying(!isPlaying);
                                                                              if (!isPlaying && currentTrack) {
                                                                                                      socket.emit('room:play', { roomId: room?.id });
                                                                              } else {
                                                                                                        socket.emit('room:pause', { roomId: room?.id });

                                                                                                                            setIsPlaying(!isPlaying);
                                                                                                                                                if (!isPlaying && currentTrack) {
                                                                                                                                                                           socket.emit('room:play', { roomId: room?.id });
                                                                                                                                                } else {
                                                                                                                                                                            socket.emit('room:pause', { roomId: room?.id });
                                                                                                                                                }
                                                                                                                                                }
                                                                                                                                                }
                                                                              }
                                                                              }
                                                          if (!isPlaying && currentTrack) {
                                                                                    socket.emit('room:play', { roomId: room?.id });
                                                          } else {
                                                                                    socket.emit('room:pause', { roomId: room?.id });

                                                          }
                                                          }
                                      if (!isPlaying && currentTrack) {
                                                                socket.emit('room:play', { roomId: room?.id });
                                      } else {
                                                                socket.emit('room:pause', { roomId: room?.id });
                                                                id === user?.id) {
                    socket.emit('room:previous-track', { roomId: room?.id });
                  }
                }}
                disabled={!room?.host_id || !user?.id}
              >
                <SkipPrevious />
              </IconButton>
              <IconButton
                color="primary"
                onClick={() => {
                  if (room?.host_id === user?.id) {
                    socket.emit('room:next-track', { roomId: room?.id });
                  }
                }}
                disabled={!room?.host_id || !user?.id}
              >
            <SkipNext />
              </IconButton>
            </Box>
            <SynchronizedAudioPlayer
              roomId={room?.id}
              isHost={room?.host_id === user?.id}
              tracks={roomTracks}
            />
            {/* Analytics, AI, etc. */}
            <Box sx={{ mt: 4 }}>
            </Box>
          </Grid>
          {/* Queue Section */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Queue</Typography>
                <List>
                  {roomTracks.map((track, idx) => (
                    <ListItem key={track.id}>
                      <ListItemAvatar>
                        <Avatar>
                          {idx + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={track.title}
                        secondary={track.artist}
                      />
                      <Chip label={`Plays: ${track.play_count || 0}`} size="small" />
                    </ListItem>
                  ))}
                </List>
                <Button startIcon={<Add />} onClick={() => setShowAddTrack(true)} sx={{ mt: 2 }}>
                  Add Track
                </Button>
              </CardContent>
            </Card>
            {/* Recently Played */}
            {recentlyPlayed && recentlyPlayed.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle1">Recently Played</Typography>
                <List>
                  {recentlyPlayed.slice(0, 5).map(track => (
                    <ListItem key={track.id}>
                      <ListItemText primary={track.title} secondary={track.artist} />
                      <Chip label={`Plays: ${track.play_count || 0}`} size="small" />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Modals */}
      <Dialog open={showAddTrack} onClose={() => setShowAddTrack(false)}>
        <DialogTitle>Add Track</DialogTitle>
        <DialogContent>
          {userTracksLoading ? (
            <Typography>Loading your tracks...</Typography>
          ) : userTracksError ? (
            <Typography color="error">{userTracksError}</Typography>
          ) : userTracks.length === 0 ? (
            <Typography>No tracks found. Upload some tracks first.</Typography>
          ) : (
            <List>
              {userTracks.map(track => (
                <ListItem
                  key={track.id}
                  button
                  selected={selectedTrackId === track.id}
                  onClick={() => setSelectedTrackId(track.id)}
                  sx={{ borderRadius: 2, mb: 1, bgcolor: selectedTrackId === track.id ? 'primary.light' : undefined }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <MusicNote />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={track.title} secondary={track.artist} />
                  {selectedTrackId === track.id && <Chip label="Selected" color="primary" size="small" />}
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddTrack(false)}>Cancel</Button>
          <Button onClick={handleAddTrack} variant="contained" disabled={!selectedTrackId}>Add</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={showSettings} onClose={() => setShowSettings(false)}>
        <DialogTitle>Room Settings</DialogTitle>
        <DialogContent>
          <RoomSettings room={room} isHost={room?.host_id === user?.id} onRoomUpdated={setRoom} onRoomDeleted={() => navigate('/rooms')} />
        </DialogContent>
      </Dialog>
      <Dialog open={showParticipants} onClose={() => setShowParticipants(false)}>
        <DialogTitle>Participants</DialogTitle>
        <DialogContent>
          <ParticipantsListSimple participants={participants} isHost={room?.host_id === user?.id} currentUser={user} />
        </DialogContent>
      </Dialog>
      <Dialog open={showChat} onClose={() => setShowChat(false)}>
        <DialogTitle>Room Chat</DialogTitle>
        <DialogContent>
          <RoomChat room={room} />
        </DialogContent>
      </Dialog>
      <Dialog open={showThemes} onClose={() => setShowThemes(false)}>
        <DialogTitle>Choose Your Vibe</DialogTitle>
        <DialogContent>
          <RoomThemes room={room} onThemeChange={theme => { setRoom({ ...room, background_theme: theme }); setRoomVibe(theme); }} />
        </DialogContent>
      </Dialog>
      {/* Floating Action Button for Participants */}
      <Fab color="primary" sx={{ position: 'fixed', bottom: 32, right: 32 }} onClick={() => setShowParticipants(true)}>
        <Badge badgeContent={participants.length} color="secondary">
          <Groups />
        </Badge>
      </Fab>
    </Box>
  );
};

export default ModernRoom;

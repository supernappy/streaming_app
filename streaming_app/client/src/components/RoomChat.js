import React, { useState, useRef, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Chip,
  Tooltip,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress
} from '@mui/material';
import {
  Send,
  Person,
  Info,
  Announcement,
  MusicNote
} from '@mui/icons-material';

import { useSocket } from '../contexts/SocketContext_enhanced';
import { useAuth } from '../contexts/AuthContext';

const RoomChat = ({ room }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [trackSearch, setTrackSearch] = useState('');
  const [trackResults, setTrackResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestNote, setRequestNote] = useState('');
  const [selectedTrack, setSelectedTrack] = useState(null);

  const { messages, sendMessage, participants, reactToMessage, socket, currentRoom, playbackState } = useSocket();
  // Determine if current user is host
  const isHost = participants.find(p => p.id === user.id)?.isHost;

  // Host: Accept & Queue song request
  const handleAcceptSongRequest = (msg) => {
    if (!isHost || !msg.trackId) return;
    if (socket && currentRoom) {
      socket.emit('room:add-track', {
        roomId: currentRoom,
        trackId: msg.trackId
      });
      enqueueSnackbar('Song request accepted and added to queue!', { variant: 'success', autoHideDuration: 2500 });
    } else {
      enqueueSnackbar('Failed to accept song request.', { variant: 'error', autoHideDuration: 2500 });
    }
  };
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessage(message.trim());
    setMessage('');
    enqueueSnackbar('Message sent!', { variant: 'info', autoHideDuration: 1500 });
  };

  // Song request logic
  const handleOpenRequestDialog = () => {
    setShowRequestDialog(true);
    setTrackSearch('');
    setTrackResults([]);
    setRequestNote('');
    setSelectedTrack(null);
  };
  const handleCloseRequestDialog = () => {
    setShowRequestDialog(false);
  };
  const handleTrackSearch = async (query) => {
    setTrackSearch(query);
    if (!query.trim()) {
      setTrackResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=tracks`);
      const data = await res.json();
      setTrackResults((data.results && data.results.tracks) ? data.results.tracks : []);
    } catch (err) {
      setTrackResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  const handleSelectTrack = (track) => {
    setSelectedTrack(track);
  };
  const handleRequestSong = () => {
    if (!selectedTrack) {
      enqueueSnackbar('Please select a track to request.', { variant: 'warning', autoHideDuration: 2000 });
      return;
    }
    // Send as a special chat message
    if (socket && currentRoom) {
      socket.emit('room:chat-message', {
        roomId: currentRoom,
        message: requestNote,
        messageType: 'song_request',
        trackId: selectedTrack.id,
        trackInfo: {
          title: selectedTrack.title,
          artist: selectedTrack.artist,
          album: selectedTrack.album,
          genre: selectedTrack.genre,
          duration: selectedTrack.duration
        }
      });
      enqueueSnackbar('Song request sent!', { variant: 'success', autoHideDuration: 2000 });
    } else {
      enqueueSnackbar('Failed to send song request.', { variant: 'error', autoHideDuration: 2000 });
    }
    setShowRequestDialog(false);
    setSelectedTrack(null);
    setRequestNote('');
    setTrackSearch('');
    setTrackResults([]);
  };





  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'system':
        return <Info fontSize="small" />;
      case 'announcement':
        return <Announcement fontSize="small" />;
      default:
        return <Person fontSize="small" />;
    }
  };

  const getMessageTypeColor = (type) => {
    switch (type) {
      case 'system':
        return 'info';
      case 'announcement':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Paper elevation={6} sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(255,255,255,0.15)',
      backdropFilter: 'blur(16px) saturate(180%)',
      borderRadius: 4,
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
      border: '1px solid rgba(255,255,255,0.18)'
    }}>
      {/* Chat Header */}
      <Box sx={{
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 2,
        background: 'rgba(255,255,255,0.25)',
        backdropFilter: 'blur(12px) saturate(180%)',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16
      }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Chat
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              size="small" 
              label={`${participants.length} participant${participants.length !== 1 ? 's' : ''}`}
              variant="outlined"
            />
            <Chip 
              size="small" 
              label={`${messages.length} message${messages.length !== 1 ? 's' : ''}`}
              variant="outlined"
            />
          </Box>
        </Box>
      </Box>

      {/* Messages Container */}
      <Box 
        ref={messagesContainerRef}
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          maxHeight: '400px',
          p: 1,
          background: 'rgba(255,255,255,0.10)',
          transition: 'background 0.3s',
          borderRadius: 3
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: 'text.secondary'
          }}>
            <Typography variant="body2">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {messages.map((msg, index) => {
              const isCurrentUser = msg.user?.id === user.id;
              const isSystemMessage = msg.type !== 'text' && msg.type !== 'song_request';
              if (msg.type === 'song_request') {
                // Song request message UI
                return (
                  <ListItem
                    key={msg.id || index}
                    alignItems="flex-start"
                    sx={{
                      flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                      px: 1, py: 0.5,
                      transition: 'background 0.3s',
                      borderRadius: 3,
                      mb: 1,
                      background: isCurrentUser ? 'rgba(124,77,255,0.10)' : 'rgba(243,229,245,0.7)',
                      boxShadow: isCurrentUser ? '0 2px 8px 0 rgba(124,77,255,0.10)' : '0 2px 8px 0 rgba(124,77,255,0.05)'
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Tooltip title={msg.username}>
                        <Avatar sx={{
                          width: 36,
                          height: 36,
                          bgcolor: 'secondary.main',
                          border: msg.isHost ? '2px solid #7c4dff' : '2px solid #fff',
                          boxShadow: msg.isHost ? '0 0 0 2px #7c4dff' : 'none',
                          transition: 'border 0.2s, box-shadow 0.2s'
                        }}>
                          {msg.username?.charAt(0).toUpperCase()}
                        </Avatar>
                      </Tooltip>
                    </ListItemAvatar>
                    <Box sx={{ maxWidth: '70%', ml: isCurrentUser ? 0 : 1, mr: isCurrentUser ? 1 : 0 }}>
                      <Paper elevation={0} sx={{
                        p: 1.5,
                        background: 'rgba(124,77,255,0.08)',
                        borderLeft: '6px solid #7c4dff',
                        borderRadius: 3,
                        boxShadow: '0 1px 4px 0 rgba(124,77,255,0.08)'
                      }}>
                        <Typography variant="caption" color="secondary" fontWeight="bold">
                          {msg.username} requested a song:
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {msg.trackInfo?.title || 'Unknown Title'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {msg.trackInfo?.artist || 'Unknown Artist'}
                          {msg.trackInfo?.album ? ` • ${msg.trackInfo.album}` : ''}
                          {msg.trackInfo?.genre ? ` • ${msg.trackInfo.genre}` : ''}
                        </Typography>
                        {msg.message && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <i>"{msg.message}"</i>
                          </Typography>
                        )}
                        {/* Host action: Accept/Queue button */}
                        {isHost && (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            sx={{ mt: 1, borderRadius: 2, boxShadow: '0 2px 8px 0 rgba(124,77,255,0.15)' }}
                            onClick={() => handleAcceptSongRequest(msg)}
                          >
                            Accept & Queue
                          </Button>
                        )}
                      </Paper>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isCurrentUser ? 'right' : 'left', mt: 0.5, px: 1 }}>
                        {formatTime(msg.timestamp)}
                      </Typography>
                    </Box>
                  </ListItem>
                );
              }
              // Default (text/system) message UI
              return (
                <ListItem
                  key={msg.id || index}
                  alignItems="flex-start"
                  sx={{ flexDirection: isCurrentUser ? 'row-reverse' : 'row', px: 1, py: 0.5 }}
                >
                  {!isSystemMessage && (
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Tooltip title={msg.user?.username}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {msg.user?.username?.charAt(0).toUpperCase()}
                        </Avatar>
                      </Tooltip>
                    </ListItemAvatar>
                  )}
                  <Box sx={{ maxWidth: '70%', ml: isCurrentUser ? 0 : 1, mr: isCurrentUser ? 1 : 0 }}>
                    {isSystemMessage ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 1 }}>
                        <Chip
                          icon={getMessageTypeIcon(msg.type)}
                          label={msg.message}
                          size="small"
                          color={getMessageTypeColor(msg.type)}
                          variant="outlined"
                        />
                      </Box>
                    ) : (
                      <>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            background: isCurrentUser ? 'linear-gradient(135deg, #7c4dff 0%, #b388ff 100%)' : 'rgba(255,255,255,0.7)',
                            color: isCurrentUser ? 'white' : 'text.primary',
                            borderRadius: 3,
                            borderTopRightRadius: isCurrentUser ? 0.5 : 3,
                            borderTopLeftRadius: isCurrentUser ? 3 : 0.5,
                            boxShadow: isCurrentUser ? '0 2px 8px 0 rgba(124,77,255,0.15)' : '0 1px 4px 0 rgba(124,77,255,0.05)',
                            transition: 'background 0.3s, color 0.3s'
                          }}
                        >
                          {!isCurrentUser && (
                            <Typography 
                              variant="caption" 
                              color={isCurrentUser ? 'primary.contrastText' : 'primary.main'}
                              fontWeight="bold"
                            >
                              {msg.user?.username}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ wordWrap: 'break-word' }}>
                            {msg.message}
                          </Typography>
                          {/* Emoji Reactions UI */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            {msg.reactions && Object.entries(msg.reactions).map(([emoji, userIds]) => (
                              <Chip
                                key={emoji}
                                label={`${emoji} ${userIds.length}`}
                                size="small"
                                color={userIds.includes(user.id) ? 'primary' : 'default'}
                                onClick={() => reactToMessage(msg.id, emoji, !userIds.includes(user.id))}
                                sx={{
                                  cursor: 'pointer',
                                  fontSize: 18,
                                  borderRadius: 2,
                                  boxShadow: userIds.includes(user.id) ? '0 2px 8px 0 rgba(124,77,255,0.15)' : 'none',
                                  transition: 'box-shadow 0.2s'
                                }}
                              />
                            ))}
                            {/* Animated emoji picker */}
                            {["👍", "😂", "🔥", "🎵", "❤️"].map(emoji => (
                              <Button
                                key={emoji}
                                size="small"
                                onClick={() => reactToMessage(msg.id, emoji, true)}
                                sx={{
                                  minWidth: 32,
                                  fontSize: 18,
                                  p: 0.5,
                                  borderRadius: 2,
                                  transition: 'background 0.2s',
                                  '&:hover': { background: 'rgba(124,77,255,0.08)' }
                                }}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </Box>
                        </Paper>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ display: 'block', textAlign: isCurrentUser ? 'right' : 'left', mt: 0.5, px: 1 }}
                        >
                          {formatTime(msg.timestamp)}
                        </Typography>
                      </>
                    )}
                  </Box>
                </ListItem>
              );
            })}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>

      {/* Message Input */}
      <Divider />
      <Box sx={{ p: 2 }}>
        <form onSubmit={handleSendMessage}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              variant="outlined"
              autoComplete="off"
              multiline
              maxRows={3}
            />
            <Tooltip title="Send message">
              <span>
                <IconButton 
                  type="submit" 
                  color="primary"
                  disabled={!message.trim()}
                  sx={{ alignSelf: 'flex-end' }}
                >
                  <Send />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </form>
      </Box>
    </Paper>
  );
};

export default RoomChat;

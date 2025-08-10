import React, { useState, useRef, useEffect } from 'react';
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
  Button
} from '@mui/material';
import {
  Send,
  Person,
  Info,
  Announcement,
  SmartToy
} from '@mui/icons-material';
import { aiAPI } from '../services/ai';
import { useSocket } from '../contexts/SocketContext_enhanced';
import { useAuth } from '../contexts/AuthContext';

const RoomChat = ({ room }) => {
  const [message, setMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const { messages, sendMessage, participants } = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    // AI moderation: check message before sending
    try {
      const modRes = await aiAPI.moderateMessage(message.trim(), room?.id);
      if (modRes && modRes.isToxic) {
        sendMessage(`[AI] ⚠️ Message flagged as toxic (confidence: ${modRes.confidence ?? '?'}). Message was not sent.`);
        setMessage('');
        return;
      }
      // Only send the message if not toxic
      sendMessage(message.trim());
      setMessage('');
    } catch (err) {
      // If moderation fails, allow message but warn, and show backend error if available
      const backendMsg = err?.response?.data?.error;
      if (backendMsg) {
        sendMessage(`[AI] ⚠️ Moderation error: ${backendMsg}`);
      } else {
        sendMessage('[AI] ⚠️ Moderation service unavailable. Message sent without check.');
      }
      sendMessage(message.trim());
      setMessage('');
    }
  };

  const handleSummarize = async () => {
    setSummarizing(true);
    try {
      const chatHistory = messages.map(m => m.text || m.message || '').join('\n');
      const res = await aiAPI.summarizeChat(chatHistory, room?.id);
      setSummary(res.summary || 'No summary available.');
    } catch (err) {
      const backendMsg = err?.response?.data?.error;
      setSummary(backendMsg ? `AI summarization failed: ${backendMsg}` : 'AI summarization failed.');
    } finally {
      setSummarizing(false);
    }
  };

  const handleAIReply = async () => {
    if (!message.trim()) return;
    setAiLoading(true);
    try {
      const aiRes = await aiAPI.getAIResponse(message.trim(), room?.id);
      if (aiRes && aiRes.reply) {
        sendMessage(`[AI] ${aiRes.reply}`);
      } else if (aiRes && aiRes.response) {
        sendMessage(`[AI] ${aiRes.response}`);
      } else {
        sendMessage('[AI] No response from AI.');
      }
    } catch (err) {
      const backendMsg = err?.response?.data?.error;
      sendMessage(backendMsg ? `[AI] Error: ${backendMsg}` : '[AI] Sorry, I could not process your request.');
    } finally {
      setAiLoading(false);
    }
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
    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
        <Button onClick={handleSummarize} size="small" disabled={summarizing} variant="outlined">
          {summarizing ? 'Summarizing...' : 'Summarize Chat'}
        </Button>
      </Box>
      {summary && (
        <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.04)', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" color="secondary">AI Summary:</Typography>
          <Typography variant="body2">{summary}</Typography>
        </Box>
      )}

      {/* Messages Container */}
      <Box 
        ref={messagesContainerRef}
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          maxHeight: '400px',
          p: 1
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
              const isCurrentUser = msg.user.id === user.id;
              const isSystemMessage = msg.type !== 'text';
              
              return (
                <ListItem
                  key={msg.id || index}
                  alignItems="flex-start"
                  sx={{ 
                    flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                    px: 1,
                    py: 0.5
                  }}
                >
                  {!isSystemMessage && (
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Tooltip title={msg.user.username}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {msg.user.username.charAt(0).toUpperCase()}
                        </Avatar>
                      </Tooltip>
                    </ListItemAvatar>
                  )}
                  
                  <Box sx={{ 
                    maxWidth: '70%',
                    ml: isCurrentUser ? 0 : 1,
                    mr: isCurrentUser ? 1 : 0
                  }}>
                    {isSystemMessage ? (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        my: 1
                      }}>
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
                          elevation={1}
                          sx={{
                            p: 1,
                            backgroundColor: isCurrentUser ? 'primary.main' : 'background.paper',
                            color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
                            borderRadius: 2,
                            borderTopRightRadius: isCurrentUser ? 0.5 : 2,
                            borderTopLeftRadius: isCurrentUser ? 2 : 0.5,
                          }}
                        >
                          {!isCurrentUser && (
                            <Typography 
                              variant="caption" 
                              color={isCurrentUser ? 'primary.contrastText' : 'primary.main'}
                              fontWeight="bold"
                            >
                              {msg.user.username}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ wordWrap: 'break-word' }}>
                            {msg.message}
                          </Typography>
                        </Paper>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            display: 'block',
                            textAlign: isCurrentUser ? 'right' : 'left',
                            mt: 0.5,
                            px: 1
                          }}
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
            <Tooltip title="Ask AI for help or suggestion">
              <span>
                <IconButton
                  color="secondary"
                  disabled={!message.trim() || aiLoading}
                  onClick={handleAIReply}
                  sx={{ alignSelf: 'flex-end' }}
                >
                  <SmartToy />
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

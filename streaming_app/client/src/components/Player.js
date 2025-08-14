// Helper to parse LRC lyrics into [{ time, text }]
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Slider,
  LinearProgress,
  Avatar,
  Chip,
  Tooltip,
  Fade,
  Zoom
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  VolumeUp,
  VolumeDown,
  VolumeOff,
  Shuffle,
  Repeat,
  RepeatOne,
  FavoriteBorder,
  Favorite,
  QueueMusic,
  Equalizer,
  Close,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { usePlayer } from '../contexts/PlayerContext';

function parseLRC(lrc) {
  if (!lrc) return null;
  const lines = lrc.split(/\r?\n/);
  const result = [];
  const timeExp = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?\]/;
  for (const line of lines) {
    const match = line.match(timeExp);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3].padEnd(2, '0'), 10) : 0;
      const time = min * 60 + sec + ms / 100;
      const text = line.replace(timeExp, '').trim();
      result.push({ time, text });
    }
  }
  return result;
}

function SyncedLyrics({ lyrics, currentTime }) {
  const lrcLines = parseLRC(lyrics);
  const boxRef = React.useRef(null);
  // Find current line index
  let currentIdx = -1;
  for (let i = 0; i < lrcLines.length; i++) {
    if (currentTime >= lrcLines[i].time) currentIdx = i;
    else break;
  }

  // Auto-scroll to current line
  React.useEffect(() => {
    if (boxRef.current && currentIdx >= 0) {
      const el = boxRef.current.querySelector(`[data-lyric-idx='${currentIdx}']`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentIdx]);

  if (!lyrics) {
    return (
      <Box sx={{ mt: 1, width: '100%', maxHeight: 180, minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 2, p: 2 }}>
        <Typography variant="body2" sx={{ color: '#aaa', fontStyle: 'italic' }}>No lyrics available for this track.</Typography>
      </Box>
    );
  }

  if (!lrcLines || !lrcLines.length) {
    // fallback: show as plain text
    return (
      <Box sx={{ mt: 1, width: '100%', maxHeight: 180, minHeight: 60, overflowY: 'auto', background: 'rgba(255,255,255,0.04)', borderRadius: 2, p: 2 }}>
        <Typography variant="caption" sx={{ color: '#4ECDC4', fontWeight: 700, mb: 0.5 }}>Lyrics</Typography>
        <Typography variant="body1" sx={{ color: 'white', whiteSpace: 'pre-line', fontSize: 16 }}>{lyrics}</Typography>
      </Box>
    );
  }
  return (
    <Box ref={boxRef} sx={{ mt: 1, width: '100%', maxHeight: 180, minHeight: 60, overflowY: 'auto', background: 'rgba(255,255,255,0.04)', borderRadius: 2, p: 2 }}>
      <Typography variant="caption" sx={{ color: '#4ECDC4', fontWeight: 700, mb: 0.5 }}>Lyrics</Typography>
      {lrcLines.map((line, idx) => (
        <Typography
          key={idx}
          data-lyric-idx={idx}
          variant="body1"
          sx={{
            color: idx === currentIdx ? '#1DB954' : 'white',
            fontWeight: idx === currentIdx ? 900 : 400,
            background: idx === currentIdx ? 'rgba(29,185,84,0.12)' : 'none',
            borderRadius: 1,
            px: 1,
            py: 0.5,
            fontSize: 18,
            letterSpacing: 0.5,
            transition: 'background 0.2s, color 0.2s',
            mb: 0.2
          }}
        >
          {line.text}
        </Typography>
      ))}
    </Box>
  );
}

function Player() {

  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    queue,
    shuffleMode,
    repeatMode,
    isLoading,
    error,
    playTrack,
    togglePlayPause,
    stop,
    seek,
    changeVolume,
    playNext,
    playPrevious,
    toggleShuffle,
    setRepeat
  } = usePlayer();

  // Declare isCurrentTrackMp4 at the very top, before any hooks or logic
  const isCurrentTrackMp4 = currentTrack && (currentTrack.file_url || currentTrack.url || '').toLowerCase().endsWith('.mp4');

  // Local state for HTML5 element playback
  const [html5Playing, setHtml5Playing] = useState(false);

  // Timer interval for updating localCurrentTime
  useEffect(() => {
    let interval = null;
    const updateTime = () => {
      if (isCurrentTrackMp4 && videoRef.current) {
        setLocalCurrentTime(videoRef.current.currentTime || 0);
      } else if (!isCurrentTrackMp4 && audioRef.current) {
        setLocalCurrentTime(audioRef.current?.currentTime || 0);
      }
    };
    if ((isCurrentTrackMp4 && videoRef.current && !videoRef.current.paused) || (!isCurrentTrackMp4 && audioRef.current && !audioRef.current.paused)) {
      interval = setInterval(updateTime, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCurrentTrackMp4, currentTrack, html5Playing]);



  // Show player again when a new track is selected
  useEffect(() => {
    if (currentTrack) setVisible(true);
  }, [currentTrack]);

  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [localVolume, setLocalVolume] = useState(volume * 100);
  const [isExpanded, setIsExpanded] = useState(true);
  const [visible, setVisible] = useState(true);

  // Sync localCurrentTime with global currentTime (for Howler), or HTML5 element (for audio/video)
  useEffect(() => {
    if (isCurrentTrackMp4 && videoRef.current) {
      const handler = () => setLocalCurrentTime(videoRef.current?.currentTime || 0);
      videoRef.current.addEventListener('timeupdate', handler);
      return () => {
        if (videoRef.current) videoRef.current.removeEventListener('timeupdate', handler);
      };
    } else if (!isCurrentTrackMp4 && audioRef.current) {
      const handler = () => setLocalCurrentTime(audioRef.current?.currentTime || 0);
      audioRef.current.addEventListener('timeupdate', handler);
      return () => {
        if (audioRef.current) audioRef.current.removeEventListener('timeupdate', handler);
      };
    } else {
      setLocalCurrentTime(currentTime);
    }
  }, [isCurrentTrackMp4, currentTrack]);

  useEffect(() => {
    setLocalVolume(volume * 100);
  }, [volume]);


  if (!visible || !currentTrack) return null;

  const handleSeek = (event, newValue) => {
    setLocalCurrentTime(newValue);
    if (isCurrentTrackMp4 && videoRef.current) {
      videoRef.current.currentTime = newValue;
    } else if (!isCurrentTrackMp4 && audioRef.current) {
      if (audioRef.current) audioRef.current.currentTime = newValue;
    } else {
      seek(newValue);
    }
  };
  const handleTogglePlayPause = () => {
    if (isCurrentTrackMp4 && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setHtml5Playing(true);
      } else {
        videoRef.current.pause();
        setHtml5Playing(false);
      }
    } else if (!isCurrentTrackMp4 && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setHtml5Playing(true);
      } else {
        audioRef.current.pause();
        setHtml5Playing(false);
      }
    } else {
      togglePlayPause();
    }
  };

  const handleVolumeChange = (event, newValue) => {
    setLocalVolume(newValue);
    changeVolume(newValue / 100);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Fade in={true}>
      <Paper
        elevation={12}
        sx={{
          position: 'fixed',
          left: '50%',
          bottom: 24,
          transform: 'translateX(-50%)',
          zIndex: 1400,
          width: '95vw',
          maxWidth: 420,
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          p: { xs: 1, sm: 2 },
        }}
      >
  {isCurrentTrackMp4 ? (
          <>
            <video
              ref={videoRef}
              src={currentTrack.file_url || currentTrack.url}
              poster={currentTrack.cover_url}
              style={{ width: '100%', maxWidth: 720, height: 'auto', aspectRatio: '16/9', borderRadius: 8, background: '#000', marginBottom: 8 }}
              controls
              crossOrigin="anonymous"
              onEnded={playNext}
              autoPlay
            />
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mt: 1 }}>
              <Avatar
                sx={{ width: 48, height: 48, mr: 2, background: 'linear-gradient(45deg, #4ECDC4, #44A08D)', fontSize: '1.2rem' }}
                src={currentTrack.cover_url}
              >
                🎬
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{currentTrack.title || 'Unknown Video'}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{currentTrack.artist || 'Unknown Artist'}</Typography>
              </Box>
              <IconButton size="small" onClick={() => { setVisible(false); stop(); }} sx={{ color: 'white', ml: 1 }}>
                <Close fontSize="small" />
              </IconButton>
            </Box>
            </>
          ) : (
            <>
              <audio
                ref={audioRef}
                src={currentTrack.file_url || currentTrack.url}
                crossOrigin="anonymous"
                autoPlay
                style={{ display: 'none' }}
                onEnded={playNext}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Avatar
                  sx={{ width: 48, height: 48, mr: 2, background: 'linear-gradient(45deg, #4ECDC4, #44A08D)', fontSize: '1.2rem' }}
                  src={currentTrack.cover_url}
                >
                  🎵
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{currentTrack.title || 'Unknown Track'}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{currentTrack.artist || 'Unknown Artist'}</Typography>
                  <Slider
                    value={localCurrentTime}
                    max={typeof duration === 'number' && !isNaN(duration) ? duration : 100}
                    onChange={handleSeek}
                    sx={{ color: '#4ECDC4', height: 4, mt: 0.5, '& .MuiSlider-thumb': { width: 12, height: 12, backgroundColor: '#4ECDC4' } }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="caption">{formatTime(localCurrentTime)}</Typography>
                    <Typography variant="caption">{formatTime(duration)}</Typography>
                  </Box>
                </Box>
                <IconButton size="small" onClick={playPrevious} sx={{ color: 'white', mx: 0.5 }}><SkipPrevious fontSize="small" /></IconButton>
                <IconButton size="medium" onClick={handleTogglePlayPause} sx={{ color: 'white', mx: 0.5 }}>
                  {(isCurrentTrackMp4 || audioRef.current) ?
                    ((isCurrentTrackMp4 ? !(videoRef.current?.paused) : !(audioRef.current?.paused)) ? <Pause fontSize="medium" /> : <PlayArrow fontSize="medium" />)
                    : (isPlaying ? <Pause fontSize="medium" /> : <PlayArrow fontSize="medium" />)
                  }
                </IconButton>
                <IconButton size="small" onClick={playNext} sx={{ color: 'white', mx: 0.5 }}><SkipNext fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => { setVisible(false); stop(); }} sx={{ color: 'white', ml: 1 }}>
                  <Close fontSize="small" />
                </IconButton>
              </Box>
              {/* Lyrics Section with real-time sync (audio only) */}
              {currentTrack.lyrics && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#4ECDC4', fontWeight: 700, flex: 1 }}>Lyrics</Typography>
                    <IconButton size="small" onClick={() => setIsExpanded((v) => !v)} sx={{ color: '#4ECDC4' }}>
                      {isExpanded ? <ExpandMore /> : <ExpandLess />}
                    </IconButton>
                  </Box>
                  {isExpanded && (
                    <Box sx={{ maxHeight: 180, minHeight: 60, overflowY: 'auto', background: 'rgba(255,255,255,0.04)', borderRadius: 2, p: 1, border: '1px solid #4ECDC4' }}>
                      <SyncedLyrics lyrics={currentTrack.lyrics} currentTime={localCurrentTime} />
                    </Box>
                  )}
                </Box>
              )}
              {/* Volume Control */}
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mt: 1 }}>
                <VolumeUp sx={{ mr: 1 }} />
                <Slider
                  value={localVolume}
                  min={0}
                  max={100}
                  onChange={handleVolumeChange}
                  sx={{ width: 100 }}
                />
                <Typography variant="caption" sx={{ ml: 1 }}>{Math.round(localVolume)}%</Typography>
              </Box>
            </>
          )}
      </Paper>
    </Fade>
  );
}

export default Player;


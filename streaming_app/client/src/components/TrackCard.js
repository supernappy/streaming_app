import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box, IconButton, Chip, Tooltip, Avatar } from '@mui/material';
import { MusicNote, PlayArrow, Favorite, ShareRounded } from '@mui/icons-material';
import Snackbar from '@mui/material/Snackbar';

/**
 * Universal TrackCard for displaying tracks consistently across the app.
 * Props:
 * - track: { id, title, artist, cover_url, play_count, duration, ... }
 * - onPlay, onFavorite, onShare: optional handlers
 * - showActions: bool (default true)
 * - highlight: bool (optional, for current/playing track)
 */
// Helper to format duration in seconds to mm:ss
function formatDuration(duration) {
  if (duration == null || isNaN(duration)) return '0:00';
  let seconds = Number(duration);
  // If duration is a string, try to parse
  if (typeof duration === 'string') {
    seconds = parseFloat(duration);
    if (isNaN(seconds)) return '0:00';
  }
  // If duration is in ms, convert to seconds if > 1000
  if (seconds > 1000) {
    // Heuristic: treat as ms if > 1000
    seconds = Math.round(seconds / 1000);
  }
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

import { useState } from 'react';

const TrackCard = ({
  track,
  onPlay,
  onFavorite,
  onShare,
  showActions = true,
  highlight = false,
  children
}) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleShare = async () => {
    const url = window.location.origin + `/track/${track.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setSnackbarOpen(true);
    } catch (e) {
      setSnackbarOpen(true);
    }
    if (onShare) onShare(track);
  };


  return (
    <Card
      sx={{
        display: 'flex',
        alignItems: 'center',
        bgcolor: highlight ? 'primary.light' : 'background.paper',
        boxShadow: highlight ? 6 : 1,
        borderRadius: 3,
        mb: 2,
        p: 1,
        minWidth: 0,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 8 }
      }}
    >
      <CardMedia>
        <Avatar
          src={track.cover_url || '/default_cover.png'}
          alt={track.title}
          sx={{ width: 56, height: 56, mr: 2, bgcolor: 'grey.800' }}
          variant="rounded"
        >
          <MusicNote />
        </Avatar>
      </CardMedia>
      <CardContent sx={{ flex: 1, minWidth: 0, p: 1 }}>
        <Typography variant="subtitle1" noWrap>{track.title}</Typography>
        <Typography variant="body2" color="text.secondary" noWrap>{track.artist}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Chip label={`Plays: ${track.play_count || 0}`} size="small" />
          <Chip label={formatDuration(track.duration)} size="small" />
        </Box>
        {children}
      </CardContent>
      {showActions && (
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', pr: 1, gap: 0.5, mt: 1 }}>
          <Tooltip title="Play">
            <IconButton onClick={() => onPlay?.(track)} color="primary" size="small">
              <PlayArrow />
            </IconButton>
          </Tooltip>
          <Tooltip title="Favorite">
            <IconButton onClick={() => onFavorite?.(track)} color="secondary" size="small">
              <Favorite />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share">
            <IconButton
              onClick={handleShare}
              color="info"
              size="small"
              sx={{
                bgcolor: 'info.light',
                color: 'white',
                transition: 'transform 0.15s',
                '&:hover': {
                  bgcolor: 'info.main',
                  transform: 'scale(1.12) rotate(-8deg)'
                }
              }}
            >
              <ShareRounded sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={1800}
            onClose={() => setSnackbarOpen(false)}
            message="Track link copied!"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          />
        </Box>
      )}
    </Card>
  );
}
export default TrackCard;

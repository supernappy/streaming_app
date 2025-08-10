import { useEffect, useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { useSocket } from '../contexts/SocketContext_enhanced';

// Keeps a local list of tracks in sync with live play_count updates from PlayerContext/socket
export default function useSyncTrackCounts(initialTracks = []) {
  const { socket } = useSocket?.() || {};
  const { currentTrack } = usePlayer();
  const [tracks, setTracks] = useState(initialTracks);

  // Update local list when initial prop changes
  useEffect(() => {
    setTracks(initialTracks);
  }, [initialTracks]);

  // Merge in play_count whenever PlayerContext currentTrack updates
  useEffect(() => {
    if (!currentTrack?.id || typeof currentTrack.play_count === 'undefined') return;
    setTracks(prev => prev.map(t => t.id === currentTrack.id ? { ...t, play_count: currentTrack.play_count } : t));
  }, [currentTrack?.id, currentTrack?.play_count]);

  // Also listen directly to socket global play-count updates to keep any list fresh
  useEffect(() => {
    if (!socket) return;
    const handler = ({ trackId, play_count }) => {
      setTracks(prev => prev.map(t => t.id === trackId ? { ...t, play_count } : t));
    };
    socket.on('track:play-count-updated', handler);
    return () => socket.off('track:play-count-updated', handler);
  }, [socket]);

  return [tracks, setTracks];
}

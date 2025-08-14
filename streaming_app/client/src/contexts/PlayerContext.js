import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Howl } from 'howler';
import { useSocket } from './SocketContext_enhanced';
import api from '../services/api';

const PlayerContext = createContext();

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

export const PlayerProvider = ({ children }) => {
  const { socket, currentRoom } = useSocket?.() || {};
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  // Add recentlyPlayed state
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off', 'all', 'one'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const soundRef = useRef(null);
  const intervalRef = useRef(null);
  const testAudioRef = useRef(null);

  // Removed auto-play on refresh. Player will only start when a track is clicked.

  // Cleanup function to properly stop and dispose of audio resources
  const cleanupAudio = () => {
    if (soundRef.current) {
      try {
        soundRef.current.stop();
        soundRef.current.unload();
      } catch (error) {
        console.warn('Error during Howl cleanup:', error);
      }
      soundRef.current = null;
    }
    
    if (testAudioRef.current) {
      try {
        testAudioRef.current.pause();
        testAudioRef.current.src = '';
        testAudioRef.current.load();
      } catch (error) {
        console.warn('Error during HTML5 audio cleanup:', error);
      }
      testAudioRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

    // Test if track URL is accessible
  const testTrackAccessibility = async (url) => {
    try {
      console.log('🔍 Testing track accessibility:', url);
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'cors'
      });
      console.log('✅ Track accessibility test result:', response.status, response.statusText);
      return response.ok;
    } catch (error) {
      console.error('❌ Track accessibility test failed:', error);
      return false;
    }
  };

  // Per-track timestamp guard to avoid immediate double counts on resume, but allow replays later
  const lastIncrementAtRef = useRef({});

  // Increment play count for a track (single fire per track start) using new endpoint
  const incrementPlayCount = async (track) => {
    if (!track?.id) return;
    const id = track.id;
    const now = Date.now();
    const last = lastIncrementAtRef.current[id] || 0;
    // Suppress duplicates within 2s (pause/resume), but allow replay after
    if (now - last < 2000) return;
    lastIncrementAtRef.current[id] = now;
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('play-debug', { detail: { type: 'play-increment', id, ts: Date.now(), roomId: currentRoom } }));
      }
      const payload = currentRoom ? { roomId: currentRoom } : {};
      const res = await api.post(`/tracks/${id}/play`, payload);
      if (res.data && res.data.track) {
        const updatedTrack = res.data.track;
        // Optimistically update currentTrack and queue copy
        setCurrentTrack(prev => prev && prev.id === id ? { ...prev, play_count: updatedTrack.play_count } : prev);
        setQueue(prev => prev.map(t => t.id === id ? { ...t, play_count: updatedTrack.play_count } : t));
      }
    } catch (err) {
      console.warn('Failed to increment play count', err);
    }
  };

  // Merge play_count updates received via socket into local state
  useEffect(() => {
    if (!socket) return;
    const handler = ({ trackId, play_count }) => {
      setCurrentTrack(prev => (prev && prev.id === trackId) ? { ...prev, play_count } : prev);
      setQueue(prev => prev.map(t => t.id === trackId ? { ...t, play_count } : t));
    };
    socket.on('track:play-count-updated', handler);
    return () => {
      socket.off('track:play-count-updated', handler);
    };
  }, [socket]);

  const playTrack = async (track, trackListArg) => {
    console.log('=== PLAYER DEBUG ===');
    console.log('Attempting to play track:', track);
    console.log('Track file_url:', track.file_url);
    console.log('Track hls_url:', track.hls_url);
    
    // Clean up any existing audio resources first
    cleanupAudio();
    setError(null); // Clear any previous errors

    setIsLoading(true);
    let fullTrack = track;
    // If lyrics is missing, fetch full track details
    if (!track.lyrics) {
      try {
        const res = await api.get(`/tracks/${track.id}`);
        if (res.data && res.data.track) {
          fullTrack = { ...track, ...res.data.track };
        }
      } catch (err) {
        console.warn('Failed to fetch full track details for lyrics:', err);
      }
    }
    setCurrentTrack(fullTrack);
    // Use provided trackListArg as queue if available, else use current queue
    const queueToUse = Array.isArray(trackListArg) && trackListArg.length > 0 ? trackListArg : queue;
    setQueue(queueToUse);
    setCurrentIndex(queueToUse.findIndex(t => t.id === track.id));

    const audioUrl = fullTrack.hls_url || fullTrack.file_url;
    console.log('Using audio URL:', audioUrl);

    // Validate URL
    if (!audioUrl) {
      setError('No audio URL available for this track');
      setIsLoading(false);
      return;
    }

    // Test track accessibility before attempting to play
    const isAccessible = await testTrackAccessibility(audioUrl);
    if (!isAccessible) {
      console.error('❌ Track is not accessible');
      setError('Cannot access audio file. The track may be missing or the server is unavailable.');
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(fullTrack.duration || 0);
  };

  const handleTrackEnd = () => {
    try {
      if (repeatMode === 'one') {
        // Replay current track
        if (soundRef.current && soundRef.current.state() === 'loaded') {
          soundRef.current.seek(0);
          soundRef.current.play();
        }
      } else if (repeatMode === 'all' || queue.length > currentIndex + 1) {
        playNext();
      }
    } catch (error) {
      console.error('❌ Error in handleTrackEnd:', error);
      setIsPlaying(false);
    }
  };

  const startTimeTracking = () => {
    intervalRef.current = setInterval(() => {
      if (soundRef.current && soundRef.current.playing()) {
        setCurrentTime(soundRef.current.seek());
      }
    }, 1000);
  };

  const togglePlayPause = () => {
    if (soundRef.current && soundRef.current.state() === 'loaded') {
      try {
        if (isPlaying) {
          soundRef.current.pause();
        } else {
          // Check if the sound is still valid before playing
          if (soundRef.current._src) {
            const playPromise = soundRef.current.play();
            if (playPromise !== undefined) {
              // Handle the promise if returned
              console.log('Play initiated successfully');
            }
          }
        }
      } catch (error) {
        console.error('❌ Error in togglePlayPause:', error);
        setIsPlaying(false);
        setIsLoading(false);
      }
    }
  };

  const seek = (time) => {
    if (soundRef.current) {
      soundRef.current.seek(time);
      setCurrentTime(time);
    }
  };

  const changeVolume = (newVolume) => {
    setVolume(newVolume);
    if (soundRef.current) {
      soundRef.current.volume(newVolume);
    }
  };

  const playNext = () => {
    if (queue.length > 0) {
      let nextIndex;
      
      if (shuffleMode) {
        // Random next track
        nextIndex = Math.floor(Math.random() * queue.length);
      } else if (currentIndex < queue.length - 1) {
        nextIndex = currentIndex + 1;
      } else if (repeatMode === 'all') {
        nextIndex = 0; // Loop back to start
      } else {
        return; // No next track
      }
      
      const nextTrack = queue[nextIndex];
      playTrack(nextTrack, queue);
    }
  };

  const playPrevious = () => {
    if (queue.length > 0) {
      let prevIndex;
      
      if (shuffleMode) {
        // Random previous track
        prevIndex = Math.floor(Math.random() * queue.length);
      } else if (currentIndex > 0) {
        prevIndex = currentIndex - 1;
      } else if (repeatMode === 'all') {
        prevIndex = queue.length - 1; // Loop to end
      } else {
        return; // No previous track
      }
      
      const prevTrack = queue[prevIndex];
      playTrack(prevTrack, queue);
    }
  };

  const toggleShuffle = () => {
    setShuffleMode(!shuffleMode);
  };

  const setRepeat = (mode) => {
    setRepeatMode(mode);
  };

  const addToQueue = (track) => {
    setQueue(prev => [...prev, track]);
  };

  const removeFromQueue = (trackId) => {
    setQueue(prev => prev.filter(track => track.id !== trackId));
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(0);
  };

  const stop = () => {
    cleanupAudio();
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setIsLoading(false);
  };

  const value = {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    queue,
    currentIndex,
    shuffleMode,
    repeatMode,
    isLoading,
    error,
    playTrack,
    incrementPlayCount, // Expose incrementPlayCount to consumers
    togglePlayPause,
    stop,
    seek,
    changeVolume,
    playNext,
    playPrevious,
    addToQueue,
    removeFromQueue,
    clearQueue,
    toggleShuffle,
    setRepeat,
    recentlyPlayed,
    setRecentlyPlayed
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

import React, { createContext, useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const soundRef = useRef(null);
  const positionInterval = useRef(null);

  useEffect(() => {
    setupAudio();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (positionInterval.current) {
        clearInterval(positionInterval.current);
      }
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const startPositionTracking = () => {
    if (positionInterval.current) {
      clearInterval(positionInterval.current);
    }
    
    positionInterval.current = setInterval(async () => {
      if (soundRef.current && isPlaying) {
        try {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
            setCurrentTime(status.positionMillis / 1000);
            setDuration(status.durationMillis / 1000);
          }
        } catch (error) {
          console.error('Error getting playback status:', error);
        }
      }
    }, 1000);
  };

  const stopPositionTracking = () => {
    if (positionInterval.current) {
      clearInterval(positionInterval.current);
    }
  };

  const playTrack = async (track) => {
    try {
      // If same track is already loaded, just resume
      if (currentTrack && currentTrack.id === track.id && soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        startPositionTracking();
        return;
      }

      // Stop current track if playing
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Load new track
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.file_url || track.audio_url },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setCurrentTrack(track);
      setIsPlaying(true);
      setCurrentTime(0);

      // Set up playback status update
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setCurrentTime(status.positionMillis / 1000);
          setDuration(status.durationMillis / 1000);
          setIsPlaying(status.isPlaying);

          // Handle track end
          if (status.didJustFinish) {
            handleTrackEnd();
          }
        }
      });

      startPositionTracking();
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  const pauseTrack = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        stopPositionTracking();
      }
    } catch (error) {
      console.error('Error pausing track:', error);
    }
  };

  const stopTrack = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        setIsPlaying(false);
        setCurrentTime(0);
        stopPositionTracking();
      }
    } catch (error) {
      console.error('Error stopping track:', error);
    }
  };

  const seekTo = async (position) => {
    try {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(position * 1000);
        setCurrentTime(position);
      }
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const playNext = async () => {
    if (queue.length === 0) return;

    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = (currentIndex + 1) % queue.length;
    }

    setCurrentIndex(nextIndex);
    await playTrack(queue[nextIndex]);
  };

  const playPrevious = async () => {
    if (queue.length === 0) return;

    let prevIndex;
    if (isShuffle) {
      prevIndex = Math.floor(Math.random() * queue.length);
    } else {
      prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
    }

    setCurrentIndex(prevIndex);
    await playTrack(queue[prevIndex]);
  };

  const handleTrackEnd = async () => {
    if (isRepeat) {
      // Repeat current track
      await seekTo(0);
      await playTrack(currentTrack);
    } else if (queue.length > 1) {
      // Play next track
      await playNext();
    } else {
      // Stop playback
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const addToQueue = (track) => {
    setQueue(prev => [...prev, track]);
  };

  const removeFromQueue = (index) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (index < currentIndex) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(0);
  };

  const setRepeat = (repeat) => {
    setIsRepeat(repeat);
  };

  const setShuffle = (shuffle) => {
    setIsShuffle(shuffle);
  };

  const value = {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    isRepeat,
    isShuffle,
    queue,
    currentIndex,
    playTrack,
    pauseTrack,
    stopTrack,
    seekTo,
    playNext,
    playPrevious,
    addToQueue,
    removeFromQueue,
    clearQueue,
    setRepeat,
    setShuffle,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlayerContext } from '../contexts/PlayerContext';

const { width } = Dimensions.get('window');

const PlayerScreen = ({ navigation }) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    playTrack,
    pauseTrack,
    seekTo,
    setRepeat,
    setShuffle,
    isRepeat,
    isShuffle,
  } = useContext(PlayerContext);

  if (!currentTrack) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="musical-notes" size={48} color="#404040" />
        <Text style={styles.emptyText}>No track selected</Text>
      </View>
    );
  }

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  };

  const handleProgressPress = (event) => {
    const { locationX } = event.nativeEvent;
    const percentage = locationX / (width - 48);
    const newTime = percentage * duration;
    seekTo(newTime);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack(currentTrack);
    }
  };

  const toggleRepeat = () => {
    setRepeat(!isRepeat);
  };

  const toggleShuffle = () => {
    setShuffle(!isShuffle);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Playing from</Text>
          <Text style={styles.headerSubtitle}>Your Library</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Album Art */}
        <View style={styles.albumContainer}>
          <Image
            source={{
              uri: currentTrack.cover_url || 'https://via.placeholder.com/300',
            }}
            style={styles.albumArt}
          />
        </View>

        {/* Track Info */}
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={2}>
            {currentTrack.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <TouchableOpacity
            style={styles.progressBar}
            onPress={handleProgressPress}
            activeOpacity={1}
          >
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${getProgressPercentage()}%` },
                ]}
              />
              <View
                style={[
                  styles.progressThumb,
                  { left: `${getProgressPercentage()}%` },
                ]}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleShuffle}
          >
            <Ionicons
              name="shuffle"
              size={24}
              color={isShuffle ? '#1DB954' : '#b3b3b3'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="play-skip-back" size={32} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playButton}
            onPress={togglePlayPause}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={32}
              color="#000"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="play-skip-forward" size={32} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleRepeat}
          >
            <Ionicons
              name={isRepeat ? 'repeat' : 'repeat'}
              size={24}
              color={isRepeat ? '#1DB954' : '#b3b3b3'}
            />
          </TouchableOpacity>
        </View>

        {/* Additional Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart-outline" size={24} color="#b3b3b3" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={24} color="#b3b3b3" />
          </TouchableOpacity>
        </View>

        {/* Queue Button */}
        <TouchableOpacity style={styles.queueButton}>
          <Ionicons name="list" size={20} color="#fff" />
          <Text style={styles.queueButtonText}>Up Next</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    gap: 16,
  },
  emptyText: {
    color: '#b3b3b3',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: 20,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#b3b3b3',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  albumContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  albumArt: {
    width: width - 80,
    height: width - 80,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  trackArtist: {
    color: '#b3b3b3',
    fontSize: 18,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 40,
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#404040',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginLeft: -8,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 24,
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
    marginBottom: 32,
  },
  actionButton: {
    padding: 8,
  },
  queueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 8,
  },
  queueButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PlayerScreen;

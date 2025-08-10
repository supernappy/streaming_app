import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MiniPlayer = ({ track, isPlaying, onPress, onPlayPause }) => {
  if (!track) return null;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {track.artist}
        </Text>
      </View>
      
      <TouchableOpacity style={styles.playButton} onPress={onPlayPause}>
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={24}
          color="#fff"
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  trackInfo: {
    flex: 1,
    marginRight: 16,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  trackArtist: {
    color: '#b3b3b3',
    fontSize: 12,
    marginTop: 2,
  },
  playButton: {
    padding: 8,
  },
});

export default MiniPlayer;

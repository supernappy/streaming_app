import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';
import { PlayerContext } from '../contexts/PlayerContext';
import { getTracks, getFeaturedPlaylists } from '../services/api';

const TrackItem = ({ track, onPlay }) => (
  <TouchableOpacity style={styles.trackItem} onPress={() => onPlay(track)}>
    <Image
      source={{ uri: track.cover_url || 'https://via.placeholder.com/50' }}
      style={styles.trackCover}
    />
    <View style={styles.trackInfo}>
      <Text style={styles.trackTitle} numberOfLines={1}>
        {track.title}
      </Text>
      <Text style={styles.trackArtist} numberOfLines={1}>
        {track.artist}
      </Text>
    </View>
    <TouchableOpacity style={styles.playButton}>
      <Ionicons name="play" size={24} color="#1DB954" />
    </TouchableOpacity>
  </TouchableOpacity>
);

const PlaylistCard = ({ playlist, onPress }) => (
  <TouchableOpacity style={styles.playlistCard} onPress={() => onPress(playlist)}>
    <Image
      source={{ uri: playlist.cover_url || 'https://via.placeholder.com/120' }}
      style={styles.playlistCover}
    />
    <Text style={styles.playlistTitle} numberOfLines={2}>
      {playlist.name}
    </Text>
  </TouchableOpacity>
);

const HomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { playTrack } = useContext(PlayerContext);
  const [recentTracks, setRecentTracks] = useState([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [tracksResponse, playlistsResponse] = await Promise.all([
        getTracks({ limit: 10, sort: 'created_at', order: 'desc' }),
        getFeaturedPlaylists(),
      ]);

      setRecentTracks(tracksResponse.data.tracks);
      setFeaturedPlaylists(playlistsResponse.data.playlists);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handlePlayTrack = (track) => {
    playTrack(track);
    navigation.navigate('Player');
  };

  const handlePlaylistPress = (playlist) => {
    // Navigate to playlist detail screen
    console.log('Navigate to playlist:', playlist.id);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}
        </Text>
        <Text style={styles.username}>{user?.username}</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="shuffle" size={24} color="#fff" />
          <Text style={styles.quickActionText}>Shuffle Play</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="heart" size={24} color="#fff" />
          <Text style={styles.quickActionText}>Liked Songs</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Tracks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recently Added</Text>
        <FlatList
          data={recentTracks}
          renderItem={({ item }) => (
            <TrackItem track={item} onPlay={handlePlayTrack} />
          )}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Featured Playlists */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Playlists</Text>
        <FlatList
          data={featuredPlaylists}
          renderItem={({ item }) => (
            <PlaylistCard playlist={item} onPress={handlePlaylistPress} />
          )}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.playlistsContainer}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  username: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  trackCover: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  trackArtist: {
    color: '#b3b3b3',
    fontSize: 14,
    marginTop: 2,
  },
  playButton: {
    padding: 8,
  },
  playlistsContainer: {
    gap: 15,
  },
  playlistCard: {
    width: 120,
  },
  playlistCover: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  playlistTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    lineHeight: 16,
  },
});

export default HomeScreen;

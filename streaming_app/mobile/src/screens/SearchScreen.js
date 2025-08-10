import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchTracks, searchArtists, searchPlaylists } from '../services/api';

const SearchResultItem = ({ item, type, onPress }) => {
  const getItemTitle = () => {
    switch (type) {
      case 'tracks':
        return item.title;
      case 'artists':
        return item.name;
      case 'playlists':
        return item.name;
      default:
        return '';
    }
  };

  const getItemSubtitle = () => {
    switch (type) {
      case 'tracks':
        return item.artist;
      case 'artists':
        return `${item.tracks_count || 0} tracks`;
      case 'playlists':
        return `${item.tracks_count || 0} tracks`;
      default:
        return '';
    }
  };

  const getItemImage = () => {
    switch (type) {
      case 'tracks':
        return item.cover_url;
      case 'artists':
        return item.avatar_url;
      case 'playlists':
        return item.cover_url;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity style={styles.resultItem} onPress={() => onPress(item, type)}>
      <Image
        source={{ uri: getItemImage() || 'https://via.placeholder.com/50' }}
        style={styles.resultImage}
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {getItemTitle()}
        </Text>
        <Text style={styles.resultSubtitle} numberOfLines={1}>
          {getItemSubtitle()}
        </Text>
      </View>
      <TouchableOpacity style={styles.actionButton}>
        <Ionicons 
          name={type === 'tracks' ? 'play' : 'chevron-forward'} 
          size={20} 
          color="#1DB954" 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('tracks');
  const [results, setResults] = useState({
    tracks: [],
    artists: [],
    playlists: [],
  });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([
    'Chill Vibes',
    'Workout Mix',
    'Jazz Classics',
    'Electronic',
  ]);

  const tabs = [
    { key: 'tracks', label: 'Tracks' },
    { key: 'artists', label: 'Artists' },
    { key: 'playlists', label: 'Playlists' },
  ];

  const performSearch = async (query) => {
    if (!query.trim()) {
      setResults({ tracks: [], artists: [], playlists: [] });
      return;
    }

    setLoading(true);
    try {
      const [tracksRes, artistsRes, playlistsRes] = await Promise.all([
        searchTracks(query),
        searchArtists(query),
        searchPlaylists(query),
      ]);

      setResults({
        tracks: tracksRes.data.tracks || [],
        artists: artistsRes.data.artists || [],
        playlists: playlistsRes.data.playlists || [],
      });
    } catch (error) {
      console.error('Search error:', error);
      setResults({ tracks: [], artists: [], playlists: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleResultPress = (item, type) => {
    switch (type) {
      case 'tracks':
        // Play track or navigate to track details
        console.log('Play track:', item.id);
        break;
      case 'artists':
        // Navigate to artist page
        console.log('Navigate to artist:', item.id);
        break;
      case 'playlists':
        // Navigate to playlist page
        console.log('Navigate to playlist:', item.id);
        break;
    }
  };

  const handleRecentSearchPress = (search) => {
    setSearchQuery(search);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults({ tracks: [], artists: [], playlists: [] });
  };

  const renderSearchContent = () => {
    if (!searchQuery) {
      return (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          {recentSearches.map((search, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recentItem}
              onPress={() => handleRecentSearchPress(search)}
            >
              <Ionicons name="time-outline" size={20} color="#b3b3b3" />
              <Text style={styles.recentText}>{search}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    const currentResults = results[activeTab];

    if (currentResults.length === 0) {
      return (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search" size={48} color="#404040" />
          <Text style={styles.noResultsText}>
            No {activeTab} found for "{searchQuery}"
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={currentResults}
        renderItem={({ item }) => (
          <SearchResultItem
            item={item}
            type={activeTab}
            onPress={handleResultPress}
          />
        )}
        keyExtractor={(item) => `${activeTab}-${item.id}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.resultsList}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#b3b3b3" />
          <TextInput
            style={styles.searchInput}
            placeholder="What do you want to listen to?"
            placeholderTextColor="#b3b3b3"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close" size={20} color="#b3b3b3" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Tabs */}
      {searchQuery ? (
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* Content */}
      <View style={styles.content}>
        {renderSearchContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
  },
  activeTab: {
    backgroundColor: '#1DB954',
  },
  tabText: {
    color: '#b3b3b3',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  recentSection: {
    padding: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  recentText: {
    color: '#fff',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#b3b3b3',
    fontSize: 16,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  noResultsText: {
    color: '#b3b3b3',
    fontSize: 16,
    textAlign: 'center',
  },
  resultsList: {
    padding: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  resultImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  resultSubtitle: {
    color: '#b3b3b3',
    fontSize: 14,
    marginTop: 2,
  },
  actionButton: {
    padding: 8,
  },
});

export default SearchScreen;

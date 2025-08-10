import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';
import { getRooms, joinRoom, leaveRoom } from '../services/api';

const RoomCard = ({ room, onJoin, onLeave, userRooms }) => {
  const isJoined = userRooms.includes(room.id);
  const [localJoined, setLocalJoined] = useState(isJoined);

  const handlePress = async () => {
    try {
      if (localJoined) {
        await onLeave(room.id);
        setLocalJoined(false);
      } else {
        await onJoin(room.id);
        setLocalJoined(true);
      }
    } catch (error) {
      console.error('Error toggling room:', error);
    }
  };

  const formatParticipantCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <View style={styles.roomCard}>
      <View style={styles.roomHeader}>
        <View style={styles.roomInfo}>
          <Text style={styles.roomTitle} numberOfLines={2}>
            {room.title}
          </Text>
          <Text style={styles.roomDescription} numberOfLines={3}>
            {room.description}
          </Text>
        </View>
        <View style={styles.roomStatus}>
          <View style={[styles.statusDot, room.is_active && styles.activeDot]} />
          <Text style={styles.statusText}>
            {room.is_active ? 'Live' : 'Scheduled'}
          </Text>
        </View>
      </View>

      <View style={styles.roomMeta}>
        <View style={styles.participantInfo}>
          <Ionicons name="people" size={16} color="#b3b3b3" />
          <Text style={styles.participantCount}>
            {formatParticipantCount(room.participant_count || 0)}
          </Text>
        </View>
        
        <View style={styles.categoryInfo}>
          <Ionicons name="bookmark" size={16} color="#b3b3b3" />
          <Text style={styles.categoryText}>
            {room.category || 'General'}
          </Text>
        </View>
      </View>

      <View style={styles.roomActions}>
        <TouchableOpacity
          style={[
            styles.joinButton,
            localJoined && styles.joinedButton,
          ]}
          onPress={handlePress}
        >
          <Ionicons
            name={localJoined ? 'checkmark' : 'add'}
            size={20}
            color={localJoined ? '#fff' : '#1DB954'}
          />
          <Text
            style={[
              styles.joinButtonText,
              localJoined && styles.joinedButtonText,
            ]}
          >
            {localJoined ? 'Joined' : 'Join'}
          </Text>
        </TouchableOpacity>

        {room.is_active && (
          <TouchableOpacity style={styles.listenButton}>
            <Ionicons name="headset" size={20} color="#fff" />
            <Text style={styles.listenButtonText}>Listen</Text>
          </TouchableOpacity>
        )}
      </View>

      {room.hosts && room.hosts.length > 0 && (
        <View style={styles.hostsSection}>
          <Text style={styles.hostsLabel}>Hosted by:</Text>
          <View style={styles.hostsList}>
            {room.hosts.slice(0, 3).map((host, index) => (
              <View key={host.id} style={styles.hostItem}>
                <Image
                  source={{
                    uri: host.avatar_url || 'https://via.placeholder.com/24',
                  }}
                  style={styles.hostAvatar}
                />
                <Text style={styles.hostName}>{host.username}</Text>
              </View>
            ))}
            {room.hosts.length > 3 && (
              <Text style={styles.moreHosts}>
                +{room.hosts.length - 3} more
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const RoomsScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [userRooms, setUserRooms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, live, joined

  const loadRooms = async () => {
    try {
      const response = await getRooms({ 
        sort: 'participant_count',
        order: 'desc',
        limit: 50 
      });
      
      setRooms(response.data.rooms || []);
      
      // Get user's joined rooms
      const joinedRooms = response.data.rooms
        .filter(room => room.participants?.some(p => p.id === user?.id))
        .map(room => room.id);
      setUserRooms(joinedRooms);
    } catch (error) {
      console.error('Error loading rooms:', error);
      Alert.alert('Error', 'Failed to load rooms');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRooms();
  };

  const handleJoinRoom = async (roomId) => {
    try {
      await joinRoom(roomId);
      setUserRooms(prev => [...prev, roomId]);
    } catch (error) {
      console.error('Error joining room:', error);
      Alert.alert('Error', 'Failed to join room');
    }
  };

  const handleLeaveRoom = async (roomId) => {
    try {
      await leaveRoom(roomId);
      setUserRooms(prev => prev.filter(id => id !== roomId));
    } catch (error) {
      console.error('Error leaving room:', error);
      Alert.alert('Error', 'Failed to leave room');
    }
  };

  const getFilteredRooms = () => {
    switch (filter) {
      case 'live':
        return rooms.filter(room => room.is_active);
      case 'joined':
        return rooms.filter(room => userRooms.includes(room.id));
      default:
        return rooms;
    }
  };

  const renderFilterButton = (filterKey, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterKey && styles.activeFilterButton,
      ]}
      onPress={() => setFilter(filterKey)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === filterKey && styles.activeFilterButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading rooms...</Text>
      </View>
    );
  }

  const filteredRooms = getFilteredRooms();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Audio Rooms</Text>
        <TouchableOpacity style={styles.createButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {renderFilterButton('all', 'All Rooms')}
        {renderFilterButton('live', 'Live Now')}
        {renderFilterButton('joined', 'Joined')}
      </View>

      {/* Rooms List */}
      <FlatList
        data={filteredRooms}
        renderItem={({ item }) => (
          <RoomCard
            room={item}
            onJoin={handleJoinRoom}
            onLeave={handleLeaveRoom}
            userRooms={userRooms}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.roomsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="radio" size={48} color="#404040" />
            <Text style={styles.emptyText}>
              {filter === 'live' 
                ? 'No live rooms right now'
                : filter === 'joined'
                ? 'You haven\'t joined any rooms yet'
                : 'No rooms available'
              }
            </Text>
          </View>
        }
      />
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#1DB954',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
  },
  activeFilterButton: {
    backgroundColor: '#1DB954',
  },
  filterButtonText: {
    color: '#b3b3b3',
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  roomsList: {
    padding: 20,
    gap: 16,
  },
  roomCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roomInfo: {
    flex: 1,
    marginRight: 12,
  },
  roomTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  roomDescription: {
    color: '#b3b3b3',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 18,
  },
  roomStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#404040',
  },
  activeDot: {
    backgroundColor: '#1DB954',
  },
  statusText: {
    color: '#b3b3b3',
    fontSize: 12,
    fontWeight: '500',
  },
  roomMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantCount: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  roomActions: {
    flexDirection: 'row',
    gap: 12,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1DB954',
    backgroundColor: 'transparent',
    gap: 6,
  },
  joinedButton: {
    backgroundColor: '#1DB954',
    borderColor: '#1DB954',
  },
  joinButtonText: {
    color: '#1DB954',
    fontSize: 14,
    fontWeight: '600',
  },
  joinedButtonText: {
    color: '#fff',
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    gap: 6,
  },
  listenButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  hostsSection: {
    marginTop: 8,
  },
  hostsLabel: {
    color: '#b3b3b3',
    fontSize: 12,
    marginBottom: 6,
  },
  hostsList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hostItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hostAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  hostName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  moreHosts: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    color: '#b3b3b3',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default RoomsScreen;

import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const [stats] = useState({
    tracksUploaded: 24,
    playlistsCreated: 8,
    roomsJoined: 12,
    followers: 156,
    following: 89,
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.navigate('Login');
          }
        },
      ]
    );
  };

  const handleEditProfile = () => {
    console.log('Navigate to edit profile');
  };

  const handleSettings = () => {
    console.log('Navigate to settings');
  };

  const profileMenuItems = [
    {
      icon: 'musical-notes',
      title: 'My Tracks',
      subtitle: `${stats.tracksUploaded} uploaded`,
      onPress: () => console.log('Navigate to my tracks'),
    },
    {
      icon: 'list',
      title: 'My Playlists',
      subtitle: `${stats.playlistsCreated} created`,
      onPress: () => console.log('Navigate to my playlists'),
    },
    {
      icon: 'radio',
      title: 'Joined Rooms',
      subtitle: `${stats.roomsJoined} rooms`,
      onPress: () => console.log('Navigate to joined rooms'),
    },
    {
      icon: 'heart',
      title: 'Liked Songs',
      subtitle: 'Your favorite tracks',
      onPress: () => console.log('Navigate to liked songs'),
    },
    {
      icon: 'download',
      title: 'Downloads',
      subtitle: 'Offline music',
      onPress: () => console.log('Navigate to downloads'),
    },
  ];

  const settingsMenuItems = [
    {
      icon: 'settings',
      title: 'Settings',
      onPress: handleSettings,
    },
    {
      icon: 'help-circle',
      title: 'Help & Support',
      onPress: () => console.log('Navigate to help'),
    },
    {
      icon: 'information-circle',
      title: 'About',
      onPress: () => console.log('Navigate to about'),
    },
    {
      icon: 'log-out',
      title: 'Logout',
      onPress: handleLogout,
      dangerous: true,
    },
  ];

  const renderMenuItem = (item, index) => (
    <TouchableOpacity
      key={index}
      style={styles.menuItem}
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons
          name={item.icon}
          size={24}
          color={item.dangerous ? '#ff4444' : '#b3b3b3'}
        />
        <View style={styles.menuItemText}>
          <Text
            style={[
              styles.menuItemTitle,
              item.dangerous && styles.dangerousText,
            ]}
          >
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.menuItemSubtitle}>
              {item.subtitle}
            </Text>
          )}
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color="#404040"
      />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: user?.avatar_url || 'https://via.placeholder.com/100',
            }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="camera" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={handleEditProfile}
        >
          <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.followers}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.following}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.tracksUploaded}</Text>
          <Text style={styles.statLabel}>Tracks</Text>
        </View>
      </View>

      {/* Profile Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Library</Text>
        {profileMenuItems.map(renderMenuItem)}
      </View>

      {/* Settings Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>More</Text>
        {settingsMenuItems.map(renderMenuItem)}
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>OpenStream v1.0.0</Text>
        <Text style={styles.appInfoText}>© 2024 OpenStream</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1DB954',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#121212',
  },
  username: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    color: '#b3b3b3',
    fontSize: 16,
    marginBottom: 20,
  },
  editProfileButton: {
    borderWidth: 1,
    borderColor: '#b3b3b3',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  editProfileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 32,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    paddingVertical: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#b3b3b3',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#404040',
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemSubtitle: {
    color: '#b3b3b3',
    fontSize: 14,
    marginTop: 2,
  },
  dangerousText: {
    color: '#ff4444',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 4,
  },
  appInfoText: {
    color: '#404040',
    fontSize: 12,
  },
});

export default ProfileScreen;

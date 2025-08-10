import React, { useContext } from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import RoomsScreen from './src/screens/RoomsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import PlayerScreen from './src/screens/PlayerScreen';

// Context providers
import { AuthProvider, AuthContext } from './src/contexts/AuthContext';
import { PlayerProvider, PlayerContext } from './src/contexts/PlayerContext';

// Components
import MiniPlayer from './src/components/MiniPlayer';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MainTabNavigator = () => {
  const { currentTrack, isPlaying, playTrack, pauseTrack } = useContext(PlayerContext);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Search') {
              iconName = focused ? 'search' : 'search-outline';
            } else if (route.name === 'Rooms') {
              iconName = focused ? 'radio' : 'radio-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#1DB954',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#191414',
            borderTopColor: '#282828',
            paddingBottom: currentTrack ? 60 : 0, // Add padding when mini player is visible
          },
          headerStyle: {
            backgroundColor: '#191414',
          },
          headerTintColor: '#fff',
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Rooms" component={RoomsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
      
      {/* Mini Player */}
      {currentTrack && (
        <MiniPlayer
          track={currentTrack}
          isPlaying={isPlaying}
          onPress={() => {
            // Navigate to full player - you'll need to implement this with navigation ref
            console.log('Navigate to player');
          }}
          onPlayPause={() => {
            if (isPlaying) {
              pauseTrack();
            } else {
              playTrack(currentTrack);
            }
          }}
        />
      )}
    </>
  );
};

const AppNavigator = () => {
  const { user } = useContext(AuthContext);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#191414',
        },
        headerTintColor: '#fff',
      }}
    >
      {user ? (
        <>
          <Stack.Screen 
            name="Main" 
            component={MainTabNavigator} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Player" 
            component={PlayerScreen}
            options={{ 
              presentation: 'modal',
              headerTitle: 'Now Playing'
            }}
          />
        </>
      ) : (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PlayerProvider>
          <NavigationContainer>
            <StatusBar barStyle="light-content" backgroundColor="#191414" />
            <AppNavigator />
          </NavigationContainer>
        </PlayerProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

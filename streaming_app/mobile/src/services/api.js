import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.baseURL = BASE_URL;
  }

  async getAuthHeaders() {
    const token = await AsyncStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    const config = {
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Tracks endpoints
  async getTracks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/tracks${queryString ? `?${queryString}` : ''}`);
  }

  async getTrack(id) {
    return this.request(`/tracks/${id}`);
  }

  async uploadTrack(formData) {
    const token = await AsyncStorage.getItem('token');
    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(`${this.baseURL}/tracks/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    return data;
  }

  async deleteTrack(id) {
    return this.request(`/tracks/${id}`, {
      method: 'DELETE',
    });
  }

  // Playlists endpoints
  async getPlaylists(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/playlists${queryString ? `?${queryString}` : ''}`);
  }

  async getPlaylist(id) {
    return this.request(`/playlists/${id}`);
  }

  async createPlaylist(playlistData) {
    return this.request('/playlists', {
      method: 'POST',
      body: JSON.stringify(playlistData),
    });
  }

  async updatePlaylist(id, playlistData) {
    return this.request(`/playlists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(playlistData),
    });
  }

  async deletePlaylist(id) {
    return this.request(`/playlists/${id}`, {
      method: 'DELETE',
    });
  }

  async addTrackToPlaylist(playlistId, trackId) {
    return this.request(`/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ track_id: trackId }),
    });
  }

  async removeTrackFromPlaylist(playlistId, trackId) {
    return this.request(`/playlists/${playlistId}/tracks/${trackId}`, {
      method: 'DELETE',
    });
  }

  async getFeaturedPlaylists() {
    return this.request('/playlists/featured');
  }

  // Rooms endpoints
  async getRooms(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/rooms${queryString ? `?${queryString}` : ''}`);
  }

  async getRoom(id) {
    return this.request(`/rooms/${id}`);
  }

  async createRoom(roomData) {
    return this.request('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async updateRoom(id, roomData) {
    return this.request(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  }

  async deleteRoom(id) {
    return this.request(`/rooms/${id}`, {
      method: 'DELETE',
    });
  }

  async joinRoom(id) {
    return this.request(`/rooms/${id}/join`, {
      method: 'POST',
    });
  }

  async leaveRoom(id) {
    return this.request(`/rooms/${id}/leave`, {
      method: 'POST',
    });
  }

  // Search endpoints
  async searchTracks(query, params = {}) {
    const queryParams = new URLSearchParams({ q: query, ...params }).toString();
    return this.request(`/search/tracks?${queryParams}`);
  }

  async searchArtists(query, params = {}) {
    const queryParams = new URLSearchParams({ q: query, ...params }).toString();
    return this.request(`/search/artists?${queryParams}`);
  }

  async searchPlaylists(query, params = {}) {
    const queryParams = new URLSearchParams({ q: query, ...params }).toString();
    return this.request(`/search/playlists?${queryParams}`);
  }

  async search(query, params = {}) {
    const queryParams = new URLSearchParams({ q: query, ...params }).toString();
    return this.request(`/search?${queryParams}`);
  }

  // User endpoints
  async getProfile() {
    return this.request('/user/profile');
  }

  async updateProfile(userData) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getUserTracks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/user/tracks${queryString ? `?${queryString}` : ''}`);
  }

  async getUserPlaylists(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/user/playlists${queryString ? `?${queryString}` : ''}`);
  }

  // Favorites endpoints
  async getFavorites() {
    return this.request('/user/favorites');
  }

  async addToFavorites(trackId) {
    return this.request('/user/favorites', {
      method: 'POST',
      body: JSON.stringify({ track_id: trackId }),
    });
  }

  async removeFromFavorites(trackId) {
    return this.request(`/user/favorites/${trackId}`, {
      method: 'DELETE',
    });
  }
}

const apiService = new ApiService();

// Export individual functions for easier import
export const {
  login,
  register,
  logout,
  getTracks,
  getTrack,
  uploadTrack,
  deleteTrack,
  getPlaylists,
  getPlaylist,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  getFeaturedPlaylists,
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  joinRoom,
  leaveRoom,
  searchTracks,
  searchArtists,
  searchPlaylists,
  search,
  getProfile,
  updateProfile,
  getUserTracks,
  getUserPlaylists,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
} = apiService;

export default apiService;

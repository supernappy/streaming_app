// Generate lyrics for a track using AI
export const generateLyricsAPI = (data) => {
  // data: { title, artist, file (optional) }
  const formData = new FormData();
  if (data.file) formData.append('audio', data.file);
  if (data.title) formData.append('title', data.title);
  if (data.artist) formData.append('artist', data.artist);
  return api.post('/tracks/generate-lyrics', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: (process.env.REACT_APP_API_URL || 'http://localhost:5002') + '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => {
    console.log('🌐 API DEBUG: Making login request to:', `${api.defaults.baseURL}/auth/login`);
    console.log('🌐 API DEBUG: Login payload:', { email, password: '***' });
    return api.post('/auth/login', { email, password });
  },
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
};

// Tracks API
export const tracksAPI = {
  getAll: (params = {}) => api.get('/tracks', { params }),
  getById: (id) => api.get(`/tracks/${id}`),
  getUserTracks: () => api.get('/tracks/user'),
  upload: (formData) => api.post('/tracks', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/tracks/${id}`, data),
  delete: (id) => api.delete(`/tracks/${id}`),
  like: (id) => api.post(`/tracks/${id}/like`),
  unlike: (id) => api.delete(`/tracks/${id}/like`),
  generateLyrics: generateLyricsAPI,
};

// Playlists API
export const playlistsAPI = {
  getAll: (params = {}) => api.get('/playlists', { params }),
  getById: (id) => api.get(`/playlists/${id}`),
  create: (data) => api.post('/playlists', data),
  update: (id, data) => api.put(`/playlists/${id}`, data),
  delete: (id) => api.delete(`/playlists/${id}`),
  addTrack: (id, trackId) => api.post(`/playlists/${id}/tracks`, { trackId }),
  removeTrack: (id, trackId) => api.delete(`/playlists/${id}/tracks/${trackId}`),
};

// Rooms API
export const roomsAPI = {
  getAll: (params = {}) => api.get('/rooms', { params }),
  getById: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id, permanent = false) => api.delete(`/rooms/${id}`, { params: { permanent } }),
  join: (id) => api.post(`/rooms/${id}/join`),
  leave: (id) => api.post(`/rooms/${id}/leave`),
  getParticipants: (id) => api.get(`/rooms/${id}/participants`),
  // Room tracks management
  getTracks: (id) => api.get(`/rooms/${id}/tracks`),
  addTrack: (id, trackId) => api.post(`/rooms/${id}/tracks`, { trackId }),
  removeTrack: (id, trackId) => api.delete(`/rooms/${id}/tracks/${trackId}`),
  // Participant status update
  updateParticipantStatus: (id, userId, status) => api.put(`/rooms/${id}/participants/${userId}`, status),
  // Room settings management
  getSettings: (id) => api.get(`/rooms/${id}/settings`),
  updateSettings: (id, settings) => api.put(`/rooms/${id}/settings`, settings),
};

// Search API
export const searchAPI = {
  global: (query) => api.get('/search', { params: { q: query } }),
  tracks: (query) => api.get('/search/tracks', { params: { q: query } }),
  users: (query) => api.get('/search/users', { params: { q: query } }),
  rooms: (query) => api.get('/search/rooms', { params: { q: query } }),
};

// Users API
export const usersAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  follow: (id) => api.post(`/users/${id}/follow`),
  unfollow: (id) => api.delete(`/users/${id}/follow`),
  getFollowers: (id) => api.get(`/users/${id}/followers`),
  getFollowing: (id) => api.get(`/users/${id}/following`),
};

export default api;

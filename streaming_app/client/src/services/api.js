import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || window.location.origin,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
};

// Music API calls
export const musicAPI = {
  getTracks: () => api.get('/api/tracks'),
  getPlaylists: () => api.get('/api/playlists'),
  createPlaylist: (data) => api.post('/api/playlists', data),
  uploadTrack: (formData) => api.post('/api/tracks/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export default api;

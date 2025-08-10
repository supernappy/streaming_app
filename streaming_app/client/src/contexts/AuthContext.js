import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [rememberedCredentials, setRememberedCredentials] = useState(() => {
    const saved = localStorage.getItem('rememberedCredentials');
    return saved ? JSON.parse(saved) : null;
  });

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const saveCredentials = (email, password, remember) => {
    if (remember) {
      const credentials = { email, password };
      localStorage.setItem('rememberedCredentials', JSON.stringify(credentials));
      localStorage.setItem('rememberMe', 'true');
      setRememberedCredentials(credentials);
    } else {
      localStorage.removeItem('rememberedCredentials');
      localStorage.removeItem('rememberMe');
      setRememberedCredentials(null);
    }
  };

  const getRememberedCredentials = () => {
    const isRememberEnabled = localStorage.getItem('rememberMe') === 'true';
    if (isRememberEnabled && rememberedCredentials) {
      return rememberedCredentials;
    }
    return null;
  };

  const login = async (email, password, rememberMe = false) => {
    try {
      console.log('🔐 LOGIN DEBUG: Attempting login with:', { email, password: '***' });
      console.log('🔐 LOGIN DEBUG: API URL:', process.env.REACT_APP_API_URL);
      
      const response = await authAPI.login(email, password);
      console.log('🔐 LOGIN DEBUG: Login response:', response);
      
      const { user, token } = response.data;
      
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Save credentials if remember me is checked
      saveCredentials(email, password, rememberMe);
      
      console.log('🔐 LOGIN DEBUG: Login successful, user set:', user);
      return { success: true };
    } catch (error) {
      console.error('🔐 LOGIN DEBUG: Login error:', error);
      console.error('🔐 LOGIN DEBUG: Error response:', error.response);
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const register = async (email, username, password) => {
    try {
      const response = await authAPI.register({
        email,
        username,
        password
      });
      const { user, token } = response.data;
      
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Note: We keep remembered credentials for next login unless user explicitly unchecks remember me
  };

  const clearRememberedCredentials = () => {
    localStorage.removeItem('rememberedCredentials');
    localStorage.removeItem('rememberMe');
    setRememberedCredentials(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    console.log('🔄 User updated in context:', updatedUser);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
    rememberedCredentials,
    getRememberedCredentials,
    clearRememberedCredentials,
    saveCredentials
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

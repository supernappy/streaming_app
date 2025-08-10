import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link as MuiLink,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff, LockOpen } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, getRememberedCredentials } = useAuth();
  const navigate = useNavigate();

  // Load remembered credentials on component mount
  useEffect(() => {
    const remembered = getRememberedCredentials();
    if (remembered) {
      setFormData({
        email: remembered.email,
        password: remembered.password
      });
      setRememberMe(true);
    }
  }, [getRememberedCredentials]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password, rememberMe);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      py: 4
    }}>
      <Container component="main" maxWidth="sm">
        <Paper 
          elevation={6} 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white'
          }}
        >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 2,
            background: 'linear-gradient(45deg, #4ECDC4, #44A08D)',
            borderRadius: 2,
            px: 2,
            py: 1
          }}
        >
          <LockOpen sx={{ color: 'white' }} />
          <Typography variant="h4" component="h1" sx={{ 
            color: 'white', 
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            Welcome Back
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}

        {rememberMe && formData.email && (
          <Alert 
            severity="info" 
            sx={{ 
              width: '100%', 
              mb: 2,
              background: 'rgba(78, 205, 196, 0.1)',
              border: '1px solid rgba(78, 205, 196, 0.3)'
            }}
          >
            Welcome back! Your credentials have been remembered.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(78, 205, 196, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#4ECDC4',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#4ECDC4',
                },
              },
              '& .MuiOutlinedInput-input': {
                color: 'white',
              },
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(78, 205, 196, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#4ECDC4',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#4ECDC4',
                },
              },
              '& .MuiOutlinedInput-input': {
                color: 'white',
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                    disabled={loading}
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                name="rememberMe"
                color="primary"
                disabled={loading}
                sx={{
                  '&.Mui-checked': {
                    color: '#4ECDC4',
                  },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">
                  Remember my username and password
                </Typography>
                {rememberMe && (
                  <Typography variant="caption" sx={{ 
                    color: '#4ECDC4', 
                    fontWeight: 'bold' 
                  }}>
                    ✓ Enabled
                  </Typography>
                )}
              </Box>
            }
            sx={{ mt: 1, mb: 1, alignItems: 'flex-start' }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ 
              mt: 3, 
              mb: 2,
              background: 'linear-gradient(45deg, #4ECDC4, #44A08D)',
              color: 'white',
              fontWeight: 'bold',
              py: 1.5,
              '&:hover': {
                background: 'linear-gradient(45deg, #44A08D, #4ECDC4)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 16px rgba(78, 205, 196, 0.3)'
              },
              '&:disabled': {
                background: 'rgba(78, 205, 196, 0.3)',
                color: 'rgba(255, 255, 255, 0.5)'
              },
              transition: 'all 0.3s ease'
            }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : rememberMe && formData.email ? 'Welcome Back!' : 'Sign In'}
          </Button>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <MuiLink component={Link} to="/register" variant="body2" sx={{ color: '#4ECDC4' }}>
              Don't have an account? Sign Up
            </MuiLink>
            
            {rememberMe && formData.email && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Your credentials are saved securely
                </Typography>
                <br />
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setRememberMe(false);
                    setFormData({ email: '', password: '' });
                    localStorage.removeItem('rememberedCredentials');
                    localStorage.removeItem('rememberMe');
                  }}
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.75rem',
                    '&:hover': { color: '#FF6B6B' }
                  }}
                >
                  Clear saved credentials
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  </Box>
  );
};

export default Login;

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  AccountCircle,
  Home,
  QueueMusic,
  Radio,
  Upload,
  Dashboard
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleMenuClose();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <AppBar position="sticky" sx={{ backgroundColor: '#191414' }}>
      <Toolbar>
        {/* Logo */}
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
            mr: 4
          }}
        >
          🎧 OpenStream
        </Typography>

        {/* Navigation Links */}
        <Box sx={{ display: 'flex', gap: 2, mr: 4 }}>
          <Button
            color="inherit"
            component={Link}
            to="/"
            startIcon={<Home />}
          >
            Home
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/rooms"
            startIcon={<Radio />}
          >
            Rooms
          </Button>
          {isAuthenticated && (
            <>
              <Button
                color="inherit"
                component={Link}
                to="/playlists"
                startIcon={<QueueMusic />}
              >
                Playlists
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/upload"
                startIcon={<Upload />}
              >
                Upload
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/dashboard"
                startIcon={<Dashboard />}
              >
                Dashboard
              </Button>
            </>
          )}
        </Box>

        {/* Search Bar */}
        <Box component="form" onSubmit={handleSearch} sx={{ flexGrow: 1, mx: 2 }}>
          <TextField
            size="small"
            placeholder="Search tracks, artists, albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              width: '100%',
              maxWidth: 500,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                },
              },
            }}
          />
        </Box>

        {/* User Menu */}
        <Box>
          {isAuthenticated ? (
            <>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="primary-search-account-menu"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user?.username?.charAt(0)?.toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem 
                  onClick={() => {
                    navigate('/profile');
                    handleMenuClose();
                  }}
                >
                  <AccountCircle sx={{ mr: 1 }} />
                  Profile
                </MenuItem>
                <MenuItem 
                  onClick={() => {
                    navigate('/dashboard');
                    handleMenuClose();
                  }}
                >
                  <Dashboard sx={{ mr: 1 }} />
                  Dashboard
                </MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              <Button
                variant="outlined"
                color="primary"
                component={Link}
                to="/register"
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

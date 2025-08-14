// ...existing code...
// ErrorBoundary to catch invalid React children errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log error to console for debugging
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, color: 'red', background: '#fff' }}>
          <h2>Something went wrong.</h2>
          <pre>{String(this.state.error)}</pre>
          <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import React from 'react';
import { SnackbarProvider } from 'notistack';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { SocketProvider } from './contexts/SocketContext_enhanced';

console.log('🚀 APP.JS: Loading with test socket context...');

import Navbar from './components/Navbar';
import ThreeDBackground from './components/ThreeDBackground';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Upload from './pages/Upload';
import Rooms from './pages/Rooms';
import Room from './pages/Room';
import Playlists from './pages/Playlists';
import Search from './pages/Search';
import Library from './pages/Library';
import Trending from './pages/Trending';
import CuratedPlaylist from './pages/CuratedPlaylist';
import Player from './components/Player';
import FloatingPlayer from './components/FloatingPlayer';
import ProtectedRoute from './components/ProtectedRoute';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1DB954',
      light: '#1ed760',
      dark: '#169943',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1ed760',
      light: '#26d86c',
      dark: '#169943',
      contrastText: '#ffffff',
    },
    background: {
      default: 'transparent',
      paper: 'rgba(255, 255, 255, 0.05)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.8)',
    },
    divider: 'rgba(255, 255, 255, 0.1)',
    action: {
      hover: 'rgba(29, 185, 84, 0.1)',
      selected: 'rgba(29, 185, 84, 0.2)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 700,
      fontSize: '3rem',
      lineHeight: 1.2,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 600,
      fontSize: '2.5rem',
      lineHeight: 1.3,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
      letterSpacing: '-0.015em',
    },
    h4: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 500,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body1: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    body2: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.875rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    button: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(29, 185, 84, 0.1)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontWeight: 500,
          textTransform: 'none',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(29, 185, 84, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #1DB954, #1ed760)',
          boxShadow: '0 4px 15px rgba(29, 185, 84, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1ed760, #26d86c)',
            boxShadow: '0 8px 25px rgba(29, 185, 84, 0.4)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#181c24', // solid dark color
          minHeight: '100vh',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(15, 15, 35, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
  },
});


function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <SnackbarProvider maxSnack={4} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} autoHideDuration={3500}>
          <AuthProvider>
            <SocketProvider>
              <PlayerProvider>
                <Router>
                  <div className="App" style={{ position: 'relative', minHeight: '100vh', zIndex: 1 }}>
                    <ThreeDBackground />
                    <Navbar />
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/trending" element={<Trending />} />
                      <Route path="/curated-playlist" element={<CuratedPlaylist />} />
                      <Route path="/library" element={<Library />} />
                      <Route path="/rooms" element={<Rooms />} />
                      <Route path="/rooms/:id" element={<Room />} />
                      {/* Dashboard route removed, Home is now Dashboard */}
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/upload"
                        element={
                          <ProtectedRoute>
                            <Upload />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/playlists"
                        element={
                          <ProtectedRoute>
                            <Playlists />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    <Player />
                    {/* PlayEventsDebugPanel removed */}
                  </div>
                </Router>
              </PlayerProvider>
            </SocketProvider>
          </AuthProvider>
        </SnackbarProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;

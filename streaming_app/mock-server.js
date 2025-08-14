const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock user data
const mockUsers = [
  {
    id: 1,
    email: 'demo@openstream.com',
    password: 'demo123',
    username: 'demo_user',
    name: 'Demo User'
  },
  {
    id: 2,
    email: 'walesolagbade@yahoo.com',
    password: 'password123',
    username: 'walesolagbade',
    name: 'Wale Solagbade'
  }
];

// Mock login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email, password });
  
  // Find user
  const user = mockUsers.find(u => u.email === email && u.password === password);
  
  if (user) {
    // Generate mock token
    const token = 'mock-jwt-token-' + Date.now();
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mock server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- POST /api/auth/login');
  console.log('- GET /api/health');
  console.log('\nDemo credentials:');
  console.log('Email: demo@openstream.com');
  console.log('Password: demo123');
});
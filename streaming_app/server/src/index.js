// Chat functionality enabled - Database persistence + API routes
// Settings functionality added - User preferences management
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./controllers/authController');
const trackRoutes = require('./controllers/trackController');
const playlistRoutes = require('./controllers/playlistController');
const roomRoutes = require('./controllers/roomController');
const userRoutes = require('./controllers/userController');
const searchRoutes = require('./controllers/searchController');
const dashboardRoutes = require('./controllers/dashboardController');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const aiRoutes = require('./routes/ai');
const { createTrackLikesTable } = require('./migrations/createTrackLikes');

const app = express();
const PORT = process.env.PORT || 5000;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OpenStream API',
      version: '1.0.0',
      description: 'Open source audio streaming platform API',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/controllers/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      mediaSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Range"],
  exposedHeaders: ["Content-Range", "Accept-Ranges"]
}));
app.use(limiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files for local uploads with CORS headers
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for static files - allow multiple origins
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:3003', 'http://localhost:3002'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range, Authorization');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  res.header('Accept-Ranges', 'bytes');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
}, express.static(path.join(__dirname, '../../uploads'), {
  // Add specific options for serving audio and image files
  acceptRanges: true,
  setHeaders: (res, path, stat) => {
    if (path.endsWith('.mp3') || path.endsWith('.wav') || path.endsWith('.flac')) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Accept-Ranges', 'bytes');
    }
    if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png') || path.endsWith('.gif')) {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours cache for images
    }
  }
}));

// API Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Swagger documentation

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'OpenStream API v1.0.0',
    docs: '/docs',
    health: '/health'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const http = require('http');
const { Server } = require('socket.io');

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004"],
    methods: ["GET", "POST"]
  }
});

// Import and initialize WebSocket handlers
require('./services/socketService_enhanced')(io);
// Expose io instance to controllers/services for cross-cutting emits
const { setIO } = require('./utils/socket');
setIO(io);

// Add debug routes (pass io instance)
const debugRoutes = require('./routes/debug')(io);
app.use('/api/debug', debugRoutes);

// Initialize database tables
const { createChatTable } = require('./utils/database');

server.listen(PORT, async () => {
  console.log(`🎧 OpenStream API listening on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/docs`);
  console.log(`🔗 WebSocket server ready for real-time features`);
  
  // Initialize chat table
  try {
    await createChatTable();
    console.log('✅ Chat functionality initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing chat table:', error.message);
    console.log('⚠️ Chat will work in memory-only mode');
  }

  // Initialize track_likes table for dashboard stats
  try {
    await createTrackLikesTable();
    console.log('✅ Dashboard functionality initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing track_likes table:', error.message);
    console.log('⚠️ Dashboard stats will use fallback values');
  }
});
// CORS fix

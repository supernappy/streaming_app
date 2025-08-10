
🎧 OpenStream — The Open Source Audio Streaming Platform

Welcome to **OpenStream**, a fully open-source Spotify + Clubhouse hybrid. Stream music, host live audio rooms, build playlists, and more — all built with privacy, performance, and extensibility in mind.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org)

---

## 🔥 Features

### 🎵 On-Demand Audio Streaming (Spotify-style)
- ✅ Upload, transcode, and stream audio (MP3, AAC, FLAC)
- ✅ HLS adaptive bitrate streaming with FFmpeg
- ✅ Playlists, favorites, and listening history
- ✅ Search by artist, genre, album, and tags
- ✅ Offline-ready (with local cache)
- ✅ High-quality audio with multiple bitrate options

### 🎙️ Live Audio Rooms (Clubhouse-style)
- ✅ Real-time audio rooms using WebRTC + LiveKit
- ✅ Host/moderator roles, mute controls, room limits
- ✅ Low-latency audio chat with scalable SFU support
- ✅ Raise hand functionality and speaker queue
- ✅ Recording capabilities for later playback


### 🧠 Smart User Experience

- ✅ Custom audio player with EQ and background playback
- ✅ Mood-based audio discovery (AI-enhanced)
- ✅ Lyrics display (via Musixmatch API or Genius)
- ✅ Cross-platform synchronization
- ✅ Social features (follow, share, comments)

#### 🦙 Unified AI Features (Ollama-powered)

- 🎶 **AI-powered smart playlists**: Instantly generate playlists tailored to your mood or theme using local LLMs (Ollama)
- 🏷️ **AI auto-tagging**: Enrich tracks with AI-generated tags, genres, and mood metadata
- 🛡️ **Content moderation & summarization**: All chat and content AI features now use a unified, privacy-friendly local AI backend

> All AI endpoints are now unified under the Ollama engine. Legacy `/api/ai/*` endpoints are deprecated—see below for new endpoints.

### 🔐 Privacy & Monetization Ready
- ✅ Secure streaming with tokenized URLs
- ✅ Subscription models via Stripe or LemonSqueezy
- ✅ Admin dashboard for uploads, moderation & insights
- ✅ DRM-optional, token-authenticated HLS segments
- ✅ GDPR compliant user data handling

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend Web** | React.js, Next.js | Web application |
| **Frontend Mobile** | React Native, Expo | iOS/Android apps |
| **Backend API** | Node.js, Express, NestJS | REST API server |
| **Live Audio** | WebRTC, LiveKit, Mediasoup | Real-time audio rooms |
| **Audio Streaming** | HLS, FFmpeg, Nginx | Adaptive audio streaming |
| **Database** | PostgreSQL, Redis | Data persistence & caching |
| **Storage** | MinIO (S3-compatible) | Audio file storage |
| **Authentication** | Keycloak, Auth.js | OAuth2, SSO, JWT |
| **Search** | MeiliSearch, Typesense | Full-text search engine |
| **Analytics** | PostHog (self-hosted) | Usage analytics |
| **Audio Player** | Howler.js, ExoPlayer | Cross-platform playback |
| **Transcoding** | FFmpeg | Audio processing |
| **CDN** | Nginx, Cloudflare | Content delivery |

---

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile Client  │    │  Admin Panel    │
│   (React.js)    │    │ (React Native)  │    │   (React.js)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      Load Balancer        │
                    │        (Nginx)            │
                    └─────────────┬─────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼───────┐    ┌─────────▼───────┐    ┌─────────▼───────┐
│   API Server    │    │  Auth Server    │    │  Media Server   │
│   (Node.js)     │    │  (Keycloak)     │    │   (Nginx/HLS)   │
└─────────┬───────┘    └─────────────────┘    └─────────┬───────┘
          │                                             │
┌─────────▼───────┐                            ┌─────────▼───────┐
│   Database      │                            │   File Storage  │
│ (PostgreSQL)    │                            │    (MinIO)      │
└─────────────────┘                            └─────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** (recommended)
- **Node.js 18+** and **npm/yarn**
- **FFmpeg** for audio transcoding
- **Git** for version control

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/openstream.git
cd openstream
```

2. **Start all services**
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- MinIO storage
- Keycloak auth server
- Backend API
- Nginx media server
- Web frontend

3. **Access the application**
- Web App: http://localhost:3000
- Admin Panel: http://localhost:3001
- API Documentation: http://localhost:5000/docs
- Keycloak Admin: http://localhost:8080

### Option 2: Manual Setup

1. **Backend Setup**
```bash
cd server
npm install
npm run dev
```

2. **Frontend Setup**
```bash
cd client
npm install
npm start
```

3. **Mobile Setup** (Optional)
```bash
cd mobile
npm install
npx expo start
```

---

## 📁 Project Structure

```
openstream/
├── 📁 client/                 # React.js web application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Application pages
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API services
│   │   └── utils/            # Utility functions
│   └── package.json
├── 📁 mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── screens/          # Mobile screens
│   │   ├── components/       # Mobile components
│   │   └── services/         # API services
│   └── package.json
├── 📁 server/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/      # Route controllers
│   │   ├── models/           # Database models
│   │   ├── middleware/       # Express middleware
│   │   ├── services/         # Business logic
│   │   └── utils/            # Helper functions
│   └── package.json
├── 📁 admin/                  # Admin dashboard
├── 📁 media/                  # HLS transcoded audio files
├── 📁 storage/                # MinIO storage configuration
├── 📁 scripts/                # Deployment and utility scripts
├── 📁 docs/                   # Documentation
├── docker-compose.yml         # Docker services configuration
├── .env.example              # Environment variables template
└── README.md                 # This file
```

---

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/openstream
REDIS_URL=redis://localhost:6379

# Authentication
KEYCLOAK_URL=http://localhost:8080
JWT_SECRET=your-secret-key

# Storage
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Media
MEDIA_BASE_URL=http://localhost:8081
FFMPEG_PATH=/usr/bin/ffmpeg

# External APIs
MUSIXMATCH_API_KEY=your-musixmatch-key
STRIPE_SECRET_KEY=your-stripe-key
```

---

## 🎵 Audio Upload & Processing

### Supported Formats
- **Input**: MP3, WAV, FLAC, AAC, OGG
- **Output**: HLS (.m3u8) with multiple bitrates

### Automatic Processing Pipeline
1. **Upload** → Audio file uploaded via `/api/upload`
2. **Validation** → File format and quality checks
3. **Transcoding** → FFmpeg converts to HLS segments
4. **Storage** → Files saved to MinIO/S3
5. **Database** → Metadata stored in PostgreSQL
6. **CDN** → Files served via Nginx

### Manual Transcoding
```bash
# Convert single file
npm run transcode -- /path/to/audio.mp3

# Batch process
npm run transcode:batch -- /path/to/folder
```

---

## 🎙️ Live Audio Rooms

### Features
- **Real-time Audio**: WebRTC with LiveKit SFU
- **Role Management**: Host, Moderator, Speaker, Listener
- **Room Controls**: Mute, raise hand, kick users
- **Recording**: Save rooms for later playback
- **Scalable**: Supports 1000+ concurrent users per room

### Room API Endpoints
```javascript
POST /api/rooms          // Create room
GET /api/rooms           // List rooms
GET /api/rooms/:id       // Join room
DELETE /api/rooms/:id    // Delete room
POST /api/rooms/:id/join // Join as speaker/listener
```

---

## 🔐 Authentication & Authorization

### Supported Auth Methods
- **Email/Password** with JWT tokens
- **OAuth2** (Google, GitHub, Discord)
- **Single Sign-On** via Keycloak
- **Magic Links** (passwordless)

### User Roles
- **Admin**: Full system access
- **Moderator**: Content moderation
- **Creator**: Upload content, create rooms
- **Premium**: Enhanced features
- **User**: Basic streaming access

---

## 📱 Mobile App Features

### iOS & Android Support
- **Offline Playback**: Download for offline listening
- **Background Audio**: Continue playing when app is closed
- **CarPlay/Android Auto**: Vehicle integration
- **Push Notifications**: New releases, room invites
- **Biometric Auth**: Face ID, Touch ID, Fingerprint

### Mobile-Specific APIs
```javascript
// Download for offline
await downloadTrack(trackId);

// Background playback
await setBackgroundPlayback(true);

// Push notifications
await registerForNotifications();
```

---

## 📊 Analytics & Monitoring

### Built-in Analytics
- **User Engagement**: Play time, skip rate, completion
- **Content Performance**: Popular tracks, artists
- **System Health**: Server performance, error rates
- **Revenue Tracking**: Subscription metrics

### Self-Hosted PostHog
```bash
# View analytics dashboard
http://localhost:8000/insights

# Custom event tracking
analytics.track('song_played', {
  trackId: '123',
  userId: 'user456',
  duration: 180
});
```

---

## 🚀 Deployment

### Production Deployment Options

#### 1. VPS Deployment (Recommended)
```bash
# Deploy to DigitalOcean, Hetzner, Linode
git clone https://github.com/yourusername/openstream.git
cd openstream
docker-compose -f docker-compose.prod.yml up -d
```

#### 2. Cloud Deployment
- **AWS**: ECS, RDS, S3, CloudFront
- **Google Cloud**: GKE, Cloud SQL, Cloud Storage
- **Azure**: AKS, Azure Database, Blob Storage

#### 3. Self-Hosted
```bash
# Ubuntu/Debian server setup
./scripts/deploy-production.sh
```

### Performance Optimization
- **CDN**: Use Cloudflare or AWS CloudFront
- **Caching**: Redis for API responses
- **Database**: PostgreSQL with read replicas
- **Load Balancing**: Nginx or HAProxy

---

## 🛠️ Development

### Running Tests
```bash
# Backend tests
cd server && npm test

# Frontend tests
cd client && npm test

# Integration tests
npm run test:e2e
```

### Code Quality
```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking
npm run type-check
```

### Database Management
```bash
# Run migrations
npm run migrate

# Seed development data
npm run seed

# Reset database
npm run db:reset
```

---

## 🔌 API Documentation

### Core Endpoints

#### Authentication
```http
POST /api/auth/register     # Register new user
POST /api/auth/login        # Login user
POST /api/auth/refresh      # Refresh JWT token
POST /api/auth/logout       # Logout user
```

#### Audio Management
```http
GET /api/tracks             # List tracks
POST /api/tracks            # Upload track
GET /api/tracks/:id         # Get track details
PUT /api/tracks/:id         # Update track
DELETE /api/tracks/:id      # Delete track
```



#### Playlists & AI Features

```http
GET /api/playlists                  # List playlists
POST /api/playlists                 # Create playlist
POST /api/playlists/:id/tracks      # Add track to playlist
POST /api/playlists/smart           # Generate AI-powered smart playlist (Ollama)
POST /api/tracks/:id/auto-tag       # AI auto-tag a track (Ollama)
```

> **Note:** All AI-powered endpoints are now unified under the Ollama local LLM engine. Legacy `/api/ai/*` endpoints are **deprecated**. See `server/src/controllers/playlistController.js` for the latest AI integration.

#### Live Rooms
```http
GET /api/rooms              # List active rooms
POST /api/rooms             # Create room
GET /api/rooms/:id/token    # Get WebRTC token
```

### API Rate Limits
- **Free Tier**: 100 requests/minute
- **Premium**: 1000 requests/minute
- **Unlimited**: No limits

---

## 🎨 Customization

### Theming
```javascript
// Custom theme configuration
const theme = {
  colors: {
    primary: '#1DB954',      // Spotify green
    secondary: '#191414',    // Dark background
    accent: '#1ed760'        // Bright green
  },
  fonts: {
    primary: 'Inter',
    secondary: 'Roboto'
  }
};
```

### Plugin System
```javascript
// Create custom plugin
export const customPlugin = {
  name: 'MyPlugin',
  version: '1.0.0',
  install: (app) => {
    // Plugin logic
  }
};
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code of Conduct
Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## 📋 Roadmap

### Phase 1: Core Features ✅
- [x] Audio streaming with HLS
- [x] User authentication
- [x] Basic playlists
- [x] File upload

### Phase 2: Enhanced Features 🚧
- [x] Live audio rooms
- [x] Mobile apps
- [ ] Offline mode
- [ ] Social features

### Phase 3: Advanced Features 📅
- [ ] AI recommendations
- [ ] Lyrics synchronization
- [ ] Podcast support
- [ ] NFT integration
- [ ] Spatial audio

### Phase 4: Enterprise Features 🔮
- [ ] Multi-tenant support
- [ ] Advanced analytics
- [ ] Content moderation AI
- [ ] Global CDN

---

## 📞 Support & Community

### Get Help
- 📖 **Documentation**: [docs.openstream.dev](https://docs.openstream.dev)
- 💬 **Discord**: [Join our community](https://discord.gg/openstream)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/openstream/issues)
- 📧 **Email**: support@openstream.dev

### Community
- 🐦 **Twitter**: [@OpenStreamDev](https://twitter.com/openstreamdev)
- 📱 **Telegram**: [OpenStream Chat](https://t.me/openstream)
- 📺 **YouTube**: [OpenStream Channel](https://youtube.com/c/openstream)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 OpenStream Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/openstream&type=Date)](https://star-history.com/#yourusername/openstream&Date)

---

## 💝 Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website.

[![Sponsor](https://img.shields.io/badge/Sponsor-OpenStream-red.svg)](https://github.com/sponsors/yourusername)

---

<div align="center">

### 🎶 Built for creators. Powered by community. 🎶

**Made with ❤️ by the open-source community**

[⭐ Star us on GitHub](https://github.com/yourusername/openstream) • [🚀 Deploy Now](https://deploy.openstream.dev) • [📖 Read Docs](https://docs.openstream.dev)

</div>

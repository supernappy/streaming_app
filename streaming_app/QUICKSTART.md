# 🎧 OpenStream Quick Start Guide

Get your OpenStream audio streaming platform up and running in minutes!

## 🚀 Method 1: Quick Development Setup (Recommended)

### Prerequisites
- **Node.js 18+** ([Download here](https://nodejs.org/))
- **Git** ([Download here](https://git-scm.com/))
- **Docker** (optional but recommended) ([Download here](https://docker.com/))

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/openstream.git
cd openstream

# Run the setup script
./setup.sh
```

### 2. Start Development
```bash
# Start all services
./start-dev.sh
```

### 3. Access Your App
- 🌐 **Web App**: http://localhost:3000
- 🔌 **API**: http://localhost:3001/api  
- 📚 **API Docs**: http://localhost:3001/api-docs
- 📱 **Mobile**: Use Expo Go app with QR code

---

## 🐳 Method 2: Docker Compose (Full Stack)

### Quick Start
```bash
# Clone repository
git clone https://github.com/yourusername/openstream.git
cd openstream

# Start all services with Docker
docker-compose up -d

# Wait for services to start (about 2 minutes)
# Then access at http://localhost:3000
```

### Services Included
- ✅ PostgreSQL Database
- ✅ Redis Cache  
- ✅ MinIO Storage
- ✅ API Server
- ✅ Web Client
- ✅ Media Server

---

## 📱 Method 3: Mobile Development

### Setup React Native
```bash
# Install Expo CLI
npm install -g @expo/cli

# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start development server
npx expo start
```

### Run on Device
1. Install **Expo Go** app on your phone
2. Scan the QR code from terminal
3. App will load on your device

---

## ⚙️ Configuration

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
nano .env
```

### Key Settings
```env
# Database
DATABASE_URL=postgresql://openstream:openstream123@localhost:5432/openstream

# JWT Secret (change this!)
JWT_SECRET=your-super-secret-jwt-key

# File Storage
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

---

## 🎵 First Steps

### 1. Create Account
- Visit http://localhost:3000
- Click "Sign Up" 
- Create your admin account

### 2. Upload Music
- Click "Upload" in navigation
- Select audio files (MP3, WAV, FLAC)
- Add title, artist, and cover art
- Click "Upload Track"

### 3. Create Playlist
- Go to "Library" → "Playlists"
- Click "Create Playlist"
- Add tracks and customize

### 4. Start Live Room
- Navigate to "Rooms"
- Click "Create Room"
- Set title and start streaming

---

## 🔧 Development Commands

### Backend
```bash
cd server
npm run dev        # Start development server
npm run migrate    # Run database migrations
npm run seed       # Add sample data
npm test          # Run tests
```

### Frontend
```bash
cd client
npm start         # Start development server
npm run build     # Build for production
npm test          # Run tests
```

### Mobile
```bash
cd mobile
npx expo start    # Start Expo development
npx expo build    # Build for app stores
```

---

## 🐛 Common Issues

### Port Already in Use
```bash
# Kill processes on ports
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:3001 | xargs kill -9
```

### Database Connection Error
```bash
# Restart PostgreSQL with Docker
docker-compose restart postgres

# Or check if running locally
brew services restart postgresql
```

### FFmpeg Not Found
```bash
# Install FFmpeg
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows (use chocolatey)
choco install ffmpeg
```

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 🚀 Production Deployment

### VPS Deployment
```bash
# Clone on your server
git clone https://github.com/yourusername/openstream.git
cd openstream

# Run production setup
./scripts/deploy-production.sh
```

### Environment Setup
1. Edit `.env` with production values
2. Configure domain in Nginx
3. Set up SSL certificate
4. Start services

### Docker Production
```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📞 Need Help?

### Resources
- 📖 **Full Documentation**: [docs.openstream.dev](https://docs.openstream.dev)
- 💬 **Discord Community**: [Join Discord](https://discord.gg/openstream)
- 🐛 **Report Issues**: [GitHub Issues](https://github.com/yourusername/openstream/issues)
- 📧 **Email Support**: support@openstream.dev

### Quick Support
```bash
# Check service status
./stop-dev.sh
./start-dev.sh

# View logs
docker-compose logs -f

# Reset database
cd server && npm run db:reset
```

---

## ✅ Next Steps

Once you have OpenStream running:

1. **🎨 Customize Branding**: Update logos, colors, and app name
2. **🔐 Setup Authentication**: Configure OAuth providers
3. **📊 Enable Analytics**: Add PostHog or Google Analytics  
4. **💳 Add Payments**: Integrate Stripe for subscriptions
5. **📱 Deploy Mobile**: Submit to App Store and Google Play
6. **🌍 Go Global**: Add CDN and multiple regions

---

<div align="center">

### 🎶 Ready to Stream? 🎶

**Your audio platform awaits!**

[🚀 Start Development](#-method-1-quick-development-setup-recommended) • [📱 Mobile Setup](#-method-3-mobile-development) • [🌐 Production Deploy](#-production-deployment)

</div>

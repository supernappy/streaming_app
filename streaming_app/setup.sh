#!/bin/bash

# OpenStream Quick Setup Script
# Use this for local development setup

set -e

echo "🎵 Setting up OpenStream for local development..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_warning "Docker is not installed. Installing services locally instead."
    DOCKER_AVAILABLE=false
else
    DOCKER_AVAILABLE=true
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file from template..."
    cp .env.example .env
    print_warning "Please edit .env file with your configuration"
fi

# Install server dependencies
print_status "Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies  
print_status "Installing client dependencies..."
cd client
npm install
cd ..

# Install mobile dependencies
print_status "Installing mobile dependencies..."
cd mobile
npm install
cd ..

if [ "$DOCKER_AVAILABLE" = true ]; then
    # Start services with Docker
    print_status "Starting services with Docker..."
    docker-compose up -d postgres redis minio
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_status "Docker services started successfully"
    else
        print_error "Failed to start Docker services"
        exit 1
    fi
else
    print_warning "Docker not available. Please ensure PostgreSQL, Redis, and MinIO are running locally."
fi

# Run database migrations
print_status "Running database migrations..."
cd server
npm run migrate

# Seed development data
print_status "Seeding development data..."
npm run seed

cd ..

# Create start script
print_status "Creating start script..."
cat > start-dev.sh << 'EOF'
#!/bin/bash

# Start OpenStream development servers

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🎵 Starting OpenStream Development Servers...${NC}"

# Function to start a service in background
start_service() {
    local service_name=$1
    local command=$2
    local directory=$3
    
    echo -e "${YELLOW}Starting $service_name...${NC}"
    cd $directory
    $command &
    echo $! > "../.$service_name.pid"
    cd ..
}

# Start backend API
start_service "backend" "npm run dev" "server"

# Wait a bit for backend to start
sleep 3

# Start frontend web app
start_service "frontend" "npm start" "client"

echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "🌐 Web App: http://localhost:3000"
echo "🔌 API: http://localhost:3001/api"
echo "📚 API Docs: http://localhost:3001/api-docs"
echo ""
echo "To stop all services, run: ./stop-dev.sh"
EOF

chmod +x start-dev.sh

# Create stop script
cat > stop-dev.sh << 'EOF'
#!/bin/bash

# Stop OpenStream development servers

echo "🛑 Stopping OpenStream development servers..."

# Function to stop a service
stop_service() {
    local service_name=$1
    local pid_file=".$service_name.pid"
    
    if [ -f $pid_file ]; then
        local pid=$(cat $pid_file)
        if ps -p $pid > /dev/null; then
            echo "Stopping $service_name (PID: $pid)..."
            kill $pid
        fi
        rm -f $pid_file
    fi
}

# Stop services
stop_service "backend"
stop_service "frontend"

echo "✅ All services stopped!"
EOF

chmod +x stop-dev.sh

# Print completion message
echo ""
print_status "🎉 OpenStream development setup completed!"
echo ""
echo "Quick start commands:"
echo "  ./start-dev.sh    - Start all development servers"
echo "  ./stop-dev.sh     - Stop all development servers"
echo ""
echo "Individual commands:"
echo "  Server:   cd server && npm run dev"
echo "  Client:   cd client && npm start"
echo "  Mobile:   cd mobile && npx expo start"
echo ""
echo "Access points:"
echo "  🌐 Web App:    http://localhost:3000"
echo "  🔌 API:        http://localhost:3001/api"
echo "  📚 API Docs:   http://localhost:3001/api-docs"
echo "  📱 Mobile:     Use Expo Go app with QR code"
echo ""
print_warning "Make sure to configure your .env file before starting!"
echo ""
echo "🚀 Ready to start developing! Run ./start-dev.sh"

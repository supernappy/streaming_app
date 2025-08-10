#!/bin/bash

# OpenStream Start Development Script
# Starts all development servers in the correct order

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            print_status "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within expected time"
    return 1
}

# Function to start a service in background
start_service() {
    local service_name=$1
    local command=$2
    local directory=$3
    local port=$4
    
    print_status "Starting $service_name..."
    
    # Check if port is already in use
    if [ -n "$port" ] && check_port $port; then
        print_warning "$service_name appears to be already running on port $port"
        return 0
    fi
    
    # Change to service directory
    if [ -n "$directory" ]; then
        cd "$directory"
    fi
    
    # Start the service
    eval "$command" &
    local pid=$!
    echo $pid > "../.$service_name.pid"
    
    # Return to root directory
    if [ -n "$directory" ]; then
        cd ..
    fi
    
    print_status "$service_name started with PID $pid"
    return 0
}

# Function to cleanup on exit
cleanup() {
    print_warning "Shutting down services..."
    
    # Kill all background processes
    if [ -f .backend.pid ]; then
        kill $(cat .backend.pid) 2>/dev/null || true
        rm -f .backend.pid
    fi
    
    if [ -f .frontend.pid ]; then
        kill $(cat .frontend.pid) 2>/dev/null || true
        rm -f .frontend.pid
    fi
    
    print_status "Services stopped."
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
print_header "🎵 Starting OpenStream Development Environment"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "server" ] || [ ! -d "client" ]; then
    print_error "Please run this script from the OpenStream root directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.example .env
    print_warning "Please edit .env file with your configuration"
fi

# Start Docker services if available
if command -v docker-compose &> /dev/null; then
    print_status "Starting Docker services (PostgreSQL, Redis, MinIO)..."
    docker-compose up -d postgres redis minio nginx 2>/dev/null || print_warning "Docker services may already be running"
    sleep 5
else
    print_warning "Docker Compose not found. Make sure PostgreSQL, Redis, and MinIO are running manually."
fi

# Check if server dependencies are installed
if [ ! -d "server/node_modules" ]; then
    print_status "Installing server dependencies..."
    cd server && npm install && cd ..
fi

# Check if client dependencies are installed
if [ ! -d "client/node_modules" ]; then
    print_status "Installing client dependencies..."
    cd client && npm install && cd ..
fi

print_status "Running database migrations..."
cd server && npm run migrate 2>/dev/null || print_warning "Migration failed - database may not be ready"
cd ..

print_status "Seeding development data..."
cd server && npm run seed 2>/dev/null || print_warning "Seeding failed - database may not be ready"
cd ..

# Start backend API server
start_service "backend" "npm run dev" "server" 3001

# Wait for backend to be ready
sleep 5
if ! wait_for_service "http://localhost:3001/api/health" "Backend API"; then
    print_error "Backend failed to start"
    cleanup
    exit 1
fi

# Start frontend development server
start_service "frontend" "npm start" "client" 3000

# Wait for frontend to be ready
if ! wait_for_service "http://localhost:3000" "Frontend"; then
    print_error "Frontend failed to start"
    cleanup
    exit 1
fi

# Print success message
echo ""
print_header "🎉 OpenStream Development Environment Started Successfully!"
echo ""
echo "Access your application:"
echo "  🌐 Web App:     http://localhost:3000"
echo "  🔌 API Server:  http://localhost:3001/api"
echo "  📚 API Docs:    http://localhost:3001/api-docs"
echo "  💾 MinIO UI:    http://localhost:9001 (minioadmin/minioadmin)"
echo ""
echo "Development servers are running in the background."
echo "Press Ctrl+C to stop all services."
echo ""
print_status "Ready for development! 🚀"

# Keep script running
while true; do
    sleep 1
done

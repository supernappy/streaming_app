#!/bin/bash

# OpenStream Stop Development Script
# Stops all development servers gracefully

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo -e "${RED}🛑 Stopping OpenStream Development Servers...${NC}"
echo ""

# Function to stop a service
stop_service() {
    local service_name=$1
    local pid_file=".$service_name.pid"
    
    if [ -f $pid_file ]; then
        local pid=$(cat $pid_file)
        if ps -p $pid > /dev/null 2>&1; then
            print_status "Stopping $service_name (PID: $pid)..."
            kill $pid
            
            # Wait for process to terminate
            local attempts=0
            while ps -p $pid > /dev/null 2>&1 && [ $attempts -lt 10 ]; do
                sleep 1
                attempts=$((attempts + 1))
            done
            
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                print_warning "Force killing $service_name..."
                kill -9 $pid
            fi
        else
            print_warning "$service_name was not running"
        fi
        rm -f $pid_file
    else
        print_warning "No PID file found for $service_name"
    fi
}

# Stop services
stop_service "backend"
stop_service "frontend"

# Stop any remaining OpenStream processes
print_status "Cleaning up any remaining processes..."

# Kill processes by name
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

# Kill processes on specific ports
for port in 3000 3001; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
        print_status "Killing process on port $port (PID: $pid)..."
        kill $pid 2>/dev/null || true
    fi
done

# Optionally stop Docker services
if command -v docker-compose &> /dev/null; then
    read -p "Do you want to stop Docker services (PostgreSQL, Redis, MinIO)? [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Stopping Docker services..."
        docker-compose down
    fi
fi

echo ""
print_status "✅ All OpenStream services stopped!"
echo ""
echo "To start again, run: ./start.sh"

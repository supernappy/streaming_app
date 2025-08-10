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

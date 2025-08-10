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

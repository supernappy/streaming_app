#!/bin/bash

# OpenStream Production Deployment Script
# This script sets up OpenStream on a fresh Ubuntu/Debian server

set -e

echo "🎵 Starting OpenStream Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Don't run this script as root. Use a user with sudo privileges."
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Node.js 18+
print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker
print_status "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
print_status "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install FFmpeg
print_status "Installing FFmpeg..."
sudo apt install -y ffmpeg

# Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx

# Install PostgreSQL client
print_status "Installing PostgreSQL client..."
sudo apt install -y postgresql-client

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p /opt/openstream
sudo chown $USER:$USER /opt/openstream

# Clone repository (replace with your actual repo)
print_status "Cloning OpenStream repository..."
cd /opt/openstream
git clone https://github.com/yourusername/openstream.git .

# Install Node.js dependencies for server
print_status "Installing server dependencies..."
cd /opt/openstream/server
npm ci --production

# Install Node.js dependencies for client
print_status "Installing client dependencies..."
cd /opt/openstream/client
npm ci

# Build client for production
print_status "Building client for production..."
npm run build

# Create environment file
print_status "Creating environment configuration..."
cd /opt/openstream
if [ ! -f .env ]; then
    cp .env.example .env
    print_warning "Please edit .env file with your configuration before continuing"
fi

# Create systemd service for OpenStream API
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/openstream-api.service > /dev/null <<EOF
[Unit]
Description=OpenStream API Server
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/openstream/server
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/opt/openstream/.env

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/openstream

[Install]
WantedBy=multi-user.target
EOF

# Create Nginx configuration
print_status "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/openstream > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Serve React app
    location / {
        root /opt/openstream/client/build;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Serve audio files
    location /media/ {
        root /opt/openstream;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Upload size limit
    client_max_body_size 100M;
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/openstream /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Create directories
print_status "Creating necessary directories..."
mkdir -p /opt/openstream/{uploads,media,logs}

# Set up log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/openstream > /dev/null <<EOF
/opt/openstream/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        systemctl reload openstream-api || true
    endscript
}
EOF

# Create backup script
print_status "Creating backup script..."
sudo tee /usr/local/bin/openstream-backup > /dev/null <<EOF
#!/bin/bash
# OpenStream Backup Script

BACKUP_DIR="/opt/backups/openstream"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Backup database
pg_dump -h localhost -U openstream openstream > \$BACKUP_DIR/db_\$DATE.sql

# Backup uploads
tar -czf \$BACKUP_DIR/uploads_\$DATE.tar.gz -C /opt/openstream uploads/

# Backup configuration
cp /opt/openstream/.env \$BACKUP_DIR/env_\$DATE

# Clean old backups (keep 30 days)
find \$BACKUP_DIR -name "*.sql" -mtime +30 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find \$BACKUP_DIR -name "env_*" -mtime +30 -delete

echo "Backup completed: \$DATE"
EOF

sudo chmod +x /usr/local/bin/openstream-backup

# Add backup to crontab
print_status "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/openstream-backup") | crontab -

# Start and enable services
print_status "Starting Docker services..."
cd /opt/openstream
docker-compose -f docker-compose.yml up -d

# Wait for services to start
print_status "Waiting for services to start..."
sleep 30

# Run database migrations
print_status "Running database migrations..."
cd /opt/openstream/server
npm run migrate

# Seed initial data
print_status "Seeding initial data..."
npm run seed

# Start OpenStream API service
print_status "Starting OpenStream API service..."
sudo systemctl daemon-reload
sudo systemctl enable openstream-api
sudo systemctl start openstream-api

# Start and enable Nginx
print_status "Starting Nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Print completion message
print_status "OpenStream deployment completed successfully!"
echo ""
echo "🎉 OpenStream has been deployed!"
echo ""
echo "Next steps:"
echo "1. Edit /opt/openstream/.env with your configuration"
echo "2. Update domain name in /etc/nginx/sites-available/openstream"
echo "3. Set up SSL certificate with certbot (recommended)"
echo "4. Restart services: sudo systemctl restart openstream-api nginx"
echo ""
echo "Access your application:"
echo "- Web App: http://your-domain.com"
echo "- API: http://your-domain.com/api"
echo ""
echo "Service management:"
echo "- Start: sudo systemctl start openstream-api"
echo "- Stop: sudo systemctl stop openstream-api"
echo "- Status: sudo systemctl status openstream-api"
echo "- Logs: journalctl -u openstream-api -f"
echo ""
echo "Manual backup: /usr/local/bin/openstream-backup"
echo ""
print_warning "Remember to configure your .env file and restart services!"

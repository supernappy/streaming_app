# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Production stage
FROM node:18-alpine AS production

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S openstream -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=openstream:nodejs /app .

# Create necessary directories
RUN mkdir -p uploads media logs
RUN chown -R openstream:nodejs uploads media logs

# Switch to app user
USER openstream

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "src/index.js"]

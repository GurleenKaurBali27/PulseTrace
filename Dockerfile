# Multi-stage Dockerfile for API Failure Visualizer
# Stage 1: Build dependencies
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
COPY testAPI/package*.json ./testAPI/

# Install dependencies (with production flags)
RUN npm install --production && \
    npm --prefix ./server install --production && \
    npm --prefix ./client install && \
    npm --prefix ./testAPI install --production

# Stage 2: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# Copy built dependencies from builder
COPY --from=builder /app/client/node_modules /app/client/node_modules

# Copy client source
COPY client/ ./

# Build React app for production
RUN npm run build

# Stage 3: Production runtime
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY testAPI/package*.json ./testAPI/

# Copy node_modules from builder
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/server/node_modules /app/server/node_modules
COPY --from=builder /app/testAPI/node_modules /app/testAPI/node_modules

# Copy built frontend from frontend-builder
COPY --from=frontend-builder /app/client/dist /app/client/dist

# Copy server source code
COPY server/config ./server/config
COPY server/database ./server/database
COPY server/models ./server/models
COPY server/routes ./server/routes
COPY server/utils ./server/utils
COPY server/app.js ./server/app.js
COPY server/server.js ./server/server.js
COPY server/socket.js ./server/socket.js

# Copy testAPI source
COPY testAPI/testAPI.js ./testAPI/
COPY tracker/ ./tracker/

# Copy environment template
COPY .env.production .env

# Copy tracker
COPY tracker/ ./tracker/

# Expose ports
EXPOSE 5000 5173 4000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Switch to non-root user
USER nodejs

# Health check endpoint check
CMD ["npm", "start"]

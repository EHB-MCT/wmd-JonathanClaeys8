# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory for backend
WORKDIR /usr/src/app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/ .

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /usr/src/app
USER appuser

# Expose backend port
EXPOSE 3000

# Run backend application
CMD ["node", "server.js"]
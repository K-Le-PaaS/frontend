# Multi-stage build for React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev) for build tools like TypeScript/Vite
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage - using specific version for better security
FROM nginx:1.29-alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Security hardening
RUN apk add --no-cache dumb-init && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    chmod -R 755 /usr/share/nginx/html && \
    chmod 644 /etc/nginx/nginx.conf

# Switch to non-root user
USER nginx

EXPOSE 3000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]

# Multi-stage build for React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for ARM64
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies with specific rollup binary
RUN rm -rf node_modules package-lock.json && \
    npm install --omit=dev && \
    npm install @rollup/rollup-linux-arm64-musl --save-optional && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Set proper permissions for existing nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Switch to non-root user
USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

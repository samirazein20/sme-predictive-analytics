# Multi-stage build for React frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps && \
    npm install ajv@^8.12.0 --legacy-peer-deps

# Copy source code
COPY . .

# Set production environment variables for Create React App
ENV NODE_ENV=production
ENV REACT_APP_BACKEND_URL=https://backend.prouddesert-fa0ab96d.eastus.azurecontainerapps.io
ENV REACT_APP_ML_SERVICE_URL=https://ml-services.prouddesert-fa0ab96d.eastus.azurecontainerapps.io
ENV REACT_APP_ENV=production

# Build for production with production environment variables
RUN npm run build

# Production stage with nginx
FROM nginx:1.25-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Adjust permissions for nginx user (already exists in nginx image)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Build stage
FROM node:16-alpine as build

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the app for production
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built app to nginx directory
COPY --from=build /app/build /usr/share/nginx/html

# Create custom nginx config for React Router
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    
    # Serve static files
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    # Handle API requests (proxy to backend if needed)
    location /api {
        # If you need to proxy API requests to backend
        # proxy_pass http://your-backend-url;
        # For now, return 404 for API calls (frontend should use full backend URL)
        return 404;
    }
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
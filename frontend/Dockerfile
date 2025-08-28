# Build stage
FROM node:16-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config (optional)
COPY nginx.conf /etc/nginx/nginx.conf 2>/dev/null || true

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
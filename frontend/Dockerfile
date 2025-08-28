# Use Node.js for frontend
FROM node:18 AS build

WORKDIR /app

# Copy package.json first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the project
COPY . .

# Build production-ready frontend
RUN npm run build

# Serve with a lightweight webserver
FROM nginx:alpine

# Copy built frontend files to Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

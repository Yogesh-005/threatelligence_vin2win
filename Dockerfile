# Stage 1: Build React app
FROM node:18 AS build

WORKDIR /app

# Copy only frontend package.json first (for caching)
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY frontend/ ./

# Build React app
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy React build into nginx html folder
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

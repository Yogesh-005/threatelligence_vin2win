# Build stage
FROM node:18 AS build

WORKDIR /app

# Copy package.json + package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of project (src + public)
COPY . .

# Build React app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build output to Nginx HTML dir
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

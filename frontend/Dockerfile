# Build stage
FROM node:18 AS build

WORKDIR /app

# Copy package.json first
COPY package*.json ./

RUN npm install

# Copy the rest of the frontend code
COPY . .

# Build React app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx default folder
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

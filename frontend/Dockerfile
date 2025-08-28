# Use Node.js official image
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install serve to serve the build
RUN npm install -g serve

# Expose port (Railway will automatically set PORT)
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"]
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

# Expose port (Railway will set PORT environment variable)
EXPOSE $PORT

# Start the application on 0.0.0.0 and use Railway's PORT
CMD ["sh", "-c", "serve -s build -l ${PORT:-3000} -n"]
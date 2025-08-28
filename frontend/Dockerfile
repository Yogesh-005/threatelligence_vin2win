# Use Node.js base image
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json from the FINAL/frontend directory
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code from FINAL/frontend (including public folder)
COPY frontend/ ./

# Verify public/index.html exists (debugging step)
RUN ls -la public/

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
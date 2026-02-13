FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY server.js ./
COPY index.html ./
COPY game-stats.html ./
COPY teams.json ./

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["npm", "start"]

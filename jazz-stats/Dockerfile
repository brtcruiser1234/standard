FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY server.js ./
COPY utah-jazz.html ./

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["npm", "start"]

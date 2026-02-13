#!/bin/bash

# Utah Jazz Live Stats - Unraid Setup Script
# This script sets up the Node.js proxy server for NBA API access

echo "================================================"
echo "Utah Jazz Live Stats - Unraid Setup"
echo "================================================"
echo ""

# Set variables
APP_DIR="/mnt/user/appdata/jazz-stats"
CONTAINER_NAME="utah-jazz-stats"
HOST_PORT="8888"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (or use sudo)"
    exit 1
fi

echo "📁 Creating directory: $APP_DIR"
mkdir -p "$APP_DIR"

# Check if required files exist in current directory
REQUIRED_FILES=("utah-jazz.html" "server.js" "package.json" "Dockerfile")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Error: $file not found in current directory"
        echo "   Please make sure all files are in the same directory as this script"
        exit 1
    fi
done

echo "📋 Copying files to $APP_DIR..."
cp utah-jazz.html "$APP_DIR/"
cp server.js "$APP_DIR/"
cp package.json "$APP_DIR/"
cp Dockerfile "$APP_DIR/"

echo "🐳 Checking if Docker is available..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

echo "🔍 Checking if container already exists..."
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "⚠️  Container $CONTAINER_NAME already exists. Removing..."
    docker stop $CONTAINER_NAME 2>/dev/null
    docker rm $CONTAINER_NAME 2>/dev/null
fi

echo "🏗️  Building Docker image..."
cd "$APP_DIR"
docker build -t jazz-stats-img .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi

echo "🚀 Creating and starting Docker container..."
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -p $HOST_PORT:3000 \
    jazz-stats-img

# Wait a moment for container to start
sleep 2

# Check if container is running
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo ""
    echo "================================================"
    echo "✅ SUCCESS! Utah Jazz Stats is now running!"
    echo "================================================"
    echo ""
    echo "🌐 Access your stats page at:"
    echo "   http://$(hostname -I | awk '{print $1}'):$HOST_PORT"
    echo ""
    echo "🔧 This setup includes:"
    echo "   ✓ Node.js proxy server (handles API requests)"
    echo "   ✓ Auto-refresh every 30 seconds"
    echo "   ✓ Live scores and player stats"
    echo "   ✓ Current season statistics"
    echo ""
    echo "📊 Container Management:"
    echo "   Stop:    docker stop $CONTAINER_NAME"
    echo "   Start:   docker start $CONTAINER_NAME"
    echo "   Restart: docker restart $CONTAINER_NAME"
    echo "   Logs:    docker logs -f $CONTAINER_NAME"
    echo ""
    echo "🎉 Enjoy watching the Utah Jazz! 🏀"
    echo "================================================"
else
    echo ""
    echo "❌ Error: Container failed to start"
    echo "   Check Docker logs: docker logs $CONTAINER_NAME"
    exit 1
fi

#!/bin/bash

# NHL Team Tracker - Deployment Script
# Deploys local changes to Unraid production server

set -e  # Exit on any error

echo "🏒 NHL Team Tracker - Deployment Script"
echo "========================================"
echo ""

# Configuration
SERVER="root@10.1.10.193"
REMOTE_PATH="/mnt/user/appdata/nhl-team-tracker"
CONTAINER_NAME="nhl-team-tracker"
IMAGE_NAME="nhl-team-tracker"
PORT_MAPPING="3050:3000"

# Step 1: Copy files to server
echo "📦 Step 1: Copying files to server..."
scp package.json server.js index.html game-stats.html teams.json Dockerfile docker-compose.yml $SERVER:$REMOTE_PATH/
if [ $? -eq 0 ]; then
    echo "✅ Files copied successfully"
else
    echo "❌ Failed to copy files"
    exit 1
fi

echo ""

# Step 2: Stop container
echo "🛑 Step 2: Stopping container..."
ssh $SERVER "docker stop $CONTAINER_NAME" 2>/dev/null || echo "⚠️  Container not running"

echo ""

# Step 3: Remove container
echo "🗑️  Step 3: Removing container..."
ssh $SERVER "docker rm $CONTAINER_NAME" 2>/dev/null || echo "⚠️  Container not found"

echo ""

# Step 4: Rebuild image
echo "🔨 Step 4: Building Docker image..."
ssh $SERVER "cd $REMOTE_PATH && docker build -t $IMAGE_NAME ."
if [ $? -eq 0 ]; then
    echo "✅ Image built successfully"
else
    echo "❌ Failed to build image"
    exit 1
fi

echo ""

# Step 5: Start container
echo "🚀 Step 5: Starting container..."
ssh $SERVER "docker run -d --name $CONTAINER_NAME --restart unless-stopped -p $PORT_MAPPING $IMAGE_NAME"
if [ $? -eq 0 ]; then
    echo "✅ Container started successfully"
else
    echo "❌ Failed to start container"
    exit 1
fi

echo ""

# Step 6: Verify container is running
echo "🔍 Step 6: Verifying deployment..."
sleep 2
CONTAINER_STATUS=$(ssh $SERVER "docker ps --filter name=$CONTAINER_NAME --format '{{.Status}}'")
if [ -n "$CONTAINER_STATUS" ]; then
    echo "✅ Container is running: $CONTAINER_STATUS"
    echo ""
    echo "🎉 Deployment complete!"
    echo "🌐 App available at: http://10.1.10.193:3050"
else
    echo "❌ Container failed to start"
    echo "📋 Checking logs..."
    ssh $SERVER "docker logs $CONTAINER_NAME --tail 20"
    exit 1
fi

#!/bin/bash

# MCPH Easy Deployment Script
set -e

echo "🚀 MCPH Deployment Script"
echo "========================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "📝 Please copy .env.template to .env and fill in your values:"
    echo "   cp .env.template .env"
    echo "   nano .env"
    exit 1
fi

# Check if service account file exists
GOOGLE_CREDS=$(grep GOOGLE_APPLICATION_CREDENTIALS .env | cut -d '=' -f2)
if [ ! -f "$GOOGLE_CREDS" ]; then
    echo "❌ Google service account file not found at: $GOOGLE_CREDS"
    echo "📝 Please ensure your service account file exists and update .env"
    exit 1
fi

# Choose deployment method
echo ""
echo "Choose deployment method:"
echo "1) Docker Compose (Local/Server)"
echo "2) Google Cloud Run (Production)"
echo "3) Build only (No deploy)"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "🐳 Starting Docker Compose deployment..."
        
        # Build and start services
        docker-compose down --remove-orphans 2>/dev/null || true
        docker-compose build --no-cache
        docker-compose up -d
        
        echo ""
        echo "✅ Deployment complete!"
        echo "🌐 Frontend: http://localhost:3000"
        echo "🔧 MCP Server: http://localhost:8080"
        echo ""
        echo "📋 View logs with: docker-compose logs -f"
        echo "🛑 Stop with: docker-compose down"
        ;;
        
    2)
        echo "☁️  Starting Google Cloud deployment..."
        
        # Check if gcloud is installed
        if ! command -v gcloud &> /dev/null; then
            echo "❌ gcloud CLI not found!"
            echo "📦 Please install: https://cloud.google.com/sdk/docs/install"
            exit 1
        fi
        
        # Deploy both services
        echo "🚀 Deploying frontend..."
        npm run gcp:deploy
        
        echo "🚀 Deploying MCP server..."
        npm run gcp:deploy:mcp
        
        echo ""
        echo "✅ Cloud deployment complete!"
        echo "📱 Check your Google Cloud Console for service URLs"
        ;;
        
    3)
        echo "🔨 Building Docker images..."
        
        # Build both images
        docker build -t mcph-frontend .
        docker build -t mcph-mcp -f mcp/Dockerfile .
        
        echo ""
        echo "✅ Build complete!"
        echo "🐳 Images built: mcph-frontend, mcph-mcp"
        ;;
        
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac
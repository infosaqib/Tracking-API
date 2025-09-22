#!/bin/bash

# Tracking API Startup Script

set -e

echo "🚀 Starting Tracking API..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from example..."
    cp env.example .env
    echo "📝 Please update .env file with your configuration before running again."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

# Create necessary directories
mkdir -p logs uploads ssl

# Generate SSL certificates for development
if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
    echo "🔐 Generating SSL certificates for development..."
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
fi

# Start services
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if API is healthy
echo "🏥 Checking API health..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ API is healthy!"
        break
    fi
    
    echo "⏳ Attempt $attempt/$max_attempts - API not ready yet..."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ API failed to start within expected time. Check logs with: docker-compose logs api"
    exit 1
fi

echo ""
echo "🎉 Tracking API is now running!"
echo ""
echo "📊 Services:"
echo "  • API: http://localhost:3000"
echo "  • API Docs: http://localhost:3000/api-docs"
echo "  • Health Check: http://localhost:3000/health"
echo "  • MongoDB Express: http://localhost:8081"
echo "  • Redis Commander: http://localhost:8082"
echo ""
echo "🔧 Management Commands:"
echo "  • View logs: docker-compose logs -f"
echo "  • Stop services: docker-compose down"
echo "  • Restart API: docker-compose restart api"
echo "  • View API logs: docker-compose logs -f api"
echo ""
echo "📚 Documentation: http://localhost:3000/api-docs"
echo ""

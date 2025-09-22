@echo off
REM Tracking API Startup Script for Windows

echo 🚀 Starting Tracking API...

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Creating from example...
    copy env.example .env
    echo 📝 Please update .env file with your configuration before running again.
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ docker-compose is not installed. Please install docker-compose and try again.
    pause
    exit /b 1
)

REM Create necessary directories
if not exist logs mkdir logs
if not exist uploads mkdir uploads
if not exist ssl mkdir ssl

REM Generate SSL certificates for development
if not exist ssl\cert.pem (
    echo 🔐 Generating SSL certificates for development...
    openssl req -x509 -newkey rsa:4096 -keyout ssl\key.pem -out ssl\cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
)

REM Start services
echo 🐳 Starting Docker containers...
docker-compose up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check if API is healthy
echo 🏥 Checking API health...
set max_attempts=30
set attempt=1

:health_check_loop
curl -f http://localhost:3000/health >nul 2>&1
if not errorlevel 1 (
    echo ✅ API is healthy!
    goto :success
)

echo ⏳ Attempt %attempt%/%max_attempts% - API not ready yet...
timeout /t 2 /nobreak >nul
set /a attempt+=1

if %attempt% leq %max_attempts% goto :health_check_loop

echo ❌ API failed to start within expected time. Check logs with: docker-compose logs api
pause
exit /b 1

:success
echo.
echo 🎉 Tracking API is now running!
echo.
echo 📊 Services:
echo   • API: http://localhost:3000
echo   • API Docs: http://localhost:3000/api-docs
echo   • Health Check: http://localhost:3000/health
echo   • MongoDB Express: http://localhost:8081
echo   • Redis Commander: http://localhost:8082
echo.
echo 🔧 Management Commands:
echo   • View logs: docker-compose logs -f
echo   • Stop services: docker-compose down
echo   • Restart API: docker-compose restart api
echo   • View API logs: docker-compose logs -f api
echo.
echo 📚 Documentation: http://localhost:3000/api-docs
echo.
pause

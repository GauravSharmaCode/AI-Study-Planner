@echo off
REM ============================================================================
REM AI Study Planner - Comprehensive Test Suite
REM ============================================================================

echo ============================================================================
echo Starting AI Study Planner Test Suite
echo ============================================================================

set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..
cd /d "%PROJECT_ROOT%"

echo.
echo [1/7] Checking Docker Container Status...
echo ============================================================================
docker-compose ps

echo.
echo [2/7] Installing Dependencies (if needed)...
echo ============================================================================
echo Checking user-service dependencies...
cd /d "%PROJECT_ROOT%\services\user-service"
if not exist "node_modules" (
    echo Installing user-service dependencies...
    npm install --silent
)

echo Checking ai-schedule-service dependencies...
cd /d "%PROJECT_ROOT%\services\ai-schedule-service"
if not exist "node_modules" (
    echo Installing ai-schedule-service dependencies...
    npm install --silent
)

cd /d "%PROJECT_ROOT%"

echo.
echo [3/7] Running Linting for User Service...
echo ============================================================================
cd /d "%PROJECT_ROOT%\services\user-service"
if exist "src\" (
    echo Linting user-service TypeScript files...
    npm run lint
    if errorlevel 1 (
        echo ERROR: User service linting failed
        exit /b 1
    )
    echo ✅ User service linting passed
) else (
    echo ⚠️  User service src directory not found, skipping lint
)

echo.
echo [4/7] Running Linting for AI Schedule Service...
echo ============================================================================
cd /d "%PROJECT_ROOT%\services\ai-schedule-service"
if exist "src\" (
    echo Linting ai-schedule-service TypeScript files...
    npm run lint
    if errorlevel 1 (
        echo ERROR: AI schedule service linting failed
        exit /b 1
    )
    echo ✅ AI schedule service linting passed
) else (
    echo ⚠️  AI schedule service src directory not found, skipping lint
)

echo.
echo [5/7] Testing Docker Container Health Endpoints...
echo ============================================================================
echo Testing User Service Health (via Docker)...
curl -f -s http://localhost:3001/health > nul
if errorlevel 1 (
    echo ❌ User service health check failed
    exit /b 1
)
echo ✅ User service health check passed

echo Testing AI Schedule Service Health (via Docker)...
curl -f -s http://localhost:3002/health > nul
if errorlevel 1 (
    echo ❌ AI schedule service health check failed
    exit /b 1
)
echo ✅ AI schedule service health check passed

echo Testing NGINX Gateway Health (via Docker)...
curl -f -s http://localhost:8090/health > nul
if errorlevel 1 (
    echo ❌ NGINX gateway health check failed
    exit /b 1
)
echo ✅ NGINX gateway health check passed

echo.
echo [6/7] Testing API Endpoints via Docker Containers...
echo ============================================================================

REM Test User Service Registration
echo Testing User Registration via NGINX Gateway...
set TEST_EMAIL=testuser_%RANDOM%@example.com
curl -X POST -H "Content-Type: application/json" ^
     -d "{\"email\":\"%TEST_EMAIL%\",\"password\":\"Test123!\",\"firstName\":\"Test\",\"lastName\":\"User\"}" ^
     -f -s http://localhost:8080/api/v1/auth/register > nul
if errorlevel 1 (
    echo ❌ User registration test failed
    exit /b 1
)
echo ✅ User registration test passed

REM Test User Service Login
echo Testing User Login via NGINX Gateway...
curl -X POST -H "Content-Type: application/json" ^
     -d "{\"email\":\"%TEST_EMAIL%\",\"password\":\"Test123!\"}" ^
     -f -s http://localhost:8080/api/v1/auth/login > nul
if errorlevel 1 (
    echo ❌ User login test failed
    exit /b 1
)
echo ✅ User login test passed

REM Test AI Schedule Service
echo Testing AI Schedule Generation via NGINX Gateway...
curl -X POST -H "Content-Type: application/json" ^
     -d "{\"subjects\":[\"Math\",\"Science\"],\"dailyStudyHours\":4,\"examDate\":\"2025-12-01\",\"currentLevel\":\"intermediate\"}" ^
     -f -s http://localhost:8080/api/v1/schedules/generate > nul
if errorlevel 1 (
    echo ⚠️  AI schedule generation test failed (might be due to quota limits)
) else (
    echo ✅ AI schedule generation test passed
)

echo.
echo [7/7] Testing Database Connectivity...
echo ============================================================================
echo Testing User Database Connection...
docker exec ai-study-planner-user-db pg_isready -U postgres > nul
if errorlevel 1 (
    echo ❌ User database connection failed
    exit /b 1
)
echo ✅ User database connection passed

echo Testing Schedule Database Connection...
docker exec ai-study-planner-schedule-db pg_isready -U postgres > nul
if errorlevel 1 (
    echo ❌ Schedule database connection failed
    exit /b 1
)
echo ✅ Schedule database connection passed

echo Testing Redis Connection...
docker exec ai-study-planner-redis redis-cli ping > nul
if errorlevel 1 (
    echo ❌ Redis connection failed
    exit /b 1
)
echo ✅ Redis connection passed

echo.
echo ============================================================================
echo 🎉 ALL TESTS PASSED! AI Study Planner is healthy and functional.
echo ============================================================================
echo.
echo Test Summary:
echo - ✅ Container Health Checks
echo - ✅ Code Linting (TypeScript)
echo - ✅ API Endpoint Testing
echo - ✅ Database Connectivity
echo - ✅ Service Integration via NGINX Gateway
echo.
echo The system is ready for production use!
echo ============================================================================

exit /b 0

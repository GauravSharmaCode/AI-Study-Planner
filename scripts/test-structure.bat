@echo off
setlocal enabledelayedexpansion

echo 🧪 Testing AI Study Planner Services
echo ====================================

REM Test folder structure
echo 📁 Checking folder structure...

REM Check if obsolete folders are gone
if exist "backend" (
    echo ❌ ERROR: Obsolete 'backend' folder still exists
    exit /b 1
) else (
    echo ✅ Obsolete 'backend' folder removed
)

if exist "apps\api-gateway" (
    echo ❌ ERROR: Obsolete 'apps\api-gateway' folder still exists
    exit /b 1
) else (
    echo ✅ Obsolete 'apps\api-gateway' folder removed
)

if exist "test" (
    echo ❌ ERROR: Obsolete 'test' folder still exists
    exit /b 1
) else (
    echo ✅ Obsolete 'test' folder removed
)

REM Check if required services exist
if exist "apps\nginx-gateway" (
    echo ✅ NGINX Gateway folder exists
) else (
    echo ❌ ERROR: NGINX Gateway folder missing
    exit /b 1
)

if exist "services\user-service" (
    echo ✅ User Service folder exists
) else (
    echo ❌ ERROR: User Service folder missing
    exit /b 1
)

if exist "services\ai-schedule-service" (
    echo ✅ AI Schedule Service folder exists
) else (
    echo ❌ ERROR: AI Schedule Service folder missing
    exit /b 1
)

echo.
echo 🔧 Testing service configurations...

REM Check package.json files
if exist "services\user-service\package.json" (
    echo ✅ User Service package.json exists
) else (
    echo ❌ ERROR: User Service package.json missing
    exit /b 1
)

if exist "services\ai-schedule-service\package.json" (
    echo ✅ AI Schedule Service package.json exists
) else (
    echo ❌ ERROR: AI Schedule Service package.json missing
    exit /b 1
)

if exist "docker-compose.yml" (
    echo ✅ Docker Compose file exists
) else (
    echo ❌ ERROR: Docker Compose file missing
    exit /b 1
)

echo.
echo 🚀 Testing Docker build (dry run)...

REM Check if docker-compose config is valid
docker-compose config >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker Compose configuration is valid
) else (
    echo ❌ ERROR: Docker Compose configuration has issues
    echo Run 'docker-compose config' for details
    exit /b 1
)

echo.
echo 📦 Testing service dependencies...

REM Check if services have required files
set "files=services\user-service\src\index.ts services\user-service\Dockerfile services\ai-schedule-service\src\index.ts services\ai-schedule-service\Dockerfile apps\nginx-gateway\nginx.conf apps\nginx-gateway\Dockerfile"

for %%f in (%files%) do (
    if exist "%%f" (
        echo ✅ %%f exists
    ) else (
        echo ❌ ERROR: %%f missing
        exit /b 1
    )
)

echo.
echo 🎉 All structure tests passed!
echo.
echo Next steps:
echo 1. Start Docker Desktop
echo 2. Run: docker-compose up --build -d
echo 3. Test endpoints:
echo    - NGINX Gateway: http://localhost:8080/
echo    - User Service: http://localhost:8080/api/v1/auth/health
echo    - AI Schedule: http://localhost:8080/api/v1/schedules/health

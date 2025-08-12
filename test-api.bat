@echo off
setlocal enabledelayedexpansion

echo 🧪 AI Study Planner API Tests
echo =============================

REM Colors don't work well in Windows, so using simple text
echo.
echo [INFO] Testing API endpoints...

REM Test NGINX Gateway
echo.
echo [TEST] NGINX Gateway Health...
curl -s -f http://localhost:8080/ >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ NGINX Gateway - HEALTHY
) else (
    echo ❌ NGINX Gateway - UNHEALTHY ^(is Docker running?^)
)

REM Test NGINX Gateway /health
echo.
echo [TEST] NGINX Gateway /health...
curl -s -f http://localhost:8080/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ NGINX Gateway /health - HEALTHY
) else (
    echo ❌ NGINX Gateway /health - UNHEALTHY
)

REM Test User Service Health
echo.
echo [TEST] User Service Auth Health...
curl -s -f http://localhost:8080/api/v1/auth/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ User Service Auth - HEALTHY
) else (
    echo ❌ User Service Auth - UNHEALTHY
)

REM Test AI Schedule Service Health
echo.
echo [TEST] AI Schedule Service Health...
curl -s -f http://localhost:8080/api/v1/schedules/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ AI Schedule Service - HEALTHY
) else (
    echo ❌ AI Schedule Service - UNHEALTHY
)

REM Test User Registration (Integration Test)
echo.
echo [TEST] User Registration API...
curl -s -X POST http://localhost:8080/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"firstName\":\"Test\",\"lastName\":\"User\"}" ^
  --write-out "%%{http_code}" --output response.json >nul 2>&1

set /p status=<response.json
if "!status:~-3!" == "201" (
    echo ✅ User Registration - SUCCESS ^(201^)
) else (
    echo ❌ User Registration - FAILED ^(!status:~-3!^)
)

REM Test User Login (Integration Test)
echo.
echo [TEST] User Login API...
curl -s -X POST http://localhost:8080/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}" ^
  --write-out "%%{http_code}" --output login_response.json >nul 2>&1

set /p login_status=<login_response.json
if "!login_status:~-3!" == "200" (
    echo ✅ User Login - SUCCESS ^(200^)
) else (
    echo ❌ User Login - FAILED ^(!login_status:~-3!^)
)

REM Clean up temp files
if exist response.json del response.json
if exist login_response.json del login_response.json

echo.
echo [INFO] API Testing Complete!
echo.
echo Manual Test URLs:
echo - Gateway Info: http://localhost:8080/
echo - User Auth Health: http://localhost:8080/api/v1/auth/health
echo - AI Schedule Health: http://localhost:8080/api/v1/schedules/health
echo.
echo Integration Test Commands:
echo curl -X POST http://localhost:8080/api/v1/auth/register -H "Content-Type: application/json" -d "{\"email\":\"test2@example.com\",\"password\":\"password123\",\"firstName\":\"Test\",\"lastName\":\"User\"}"
echo.
echo curl -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test2@example.com\",\"password\":\"password123\"}"

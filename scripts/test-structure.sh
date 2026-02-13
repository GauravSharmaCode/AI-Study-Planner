#!/bin/bash

echo "🧪 Testing AI Study Planner Services"
echo "===================================="

# Test folder structure
echo "📁 Checking folder structure..."

# Check if obsolete folders are gone
if [ -d "backend" ]; then
    echo "❌ ERROR: Obsolete 'backend' folder still exists"
    exit 1
else
    echo "✅ Obsolete 'backend' folder removed"
fi

if [ -d "apps/api-gateway" ]; then
    echo "❌ ERROR: Obsolete 'apps/api-gateway' folder still exists"
    exit 1
else
    echo "✅ Obsolete 'apps/api-gateway' folder removed"
fi

if [ -d "test" ]; then
    echo "❌ ERROR: Obsolete 'test' folder still exists"
    exit 1
else
    echo "✅ Obsolete 'test' folder removed"
fi

# Check if required services exist
if [ -d "apps/nginx-gateway" ]; then
    echo "✅ NGINX Gateway folder exists"
else
    echo "❌ ERROR: NGINX Gateway folder missing"
    exit 1
fi

if [ -d "services/user-service" ]; then
    echo "✅ User Service folder exists"
else
    echo "❌ ERROR: User Service folder missing"
    exit 1
fi

if [ -d "services/ai-schedule-service" ]; then
    echo "✅ AI Schedule Service folder exists"
else
    echo "❌ ERROR: AI Schedule Service folder missing"
    exit 1
fi

echo ""
echo "🔧 Testing service configurations..."

# Check package.json files
if [ -f "services/user-service/package.json" ]; then
    echo "✅ User Service package.json exists"
else
    echo "❌ ERROR: User Service package.json missing"
    exit 1
fi

if [ -f "services/ai-schedule-service/package.json" ]; then
    echo "✅ AI Schedule Service package.json exists"
else
    echo "❌ ERROR: AI Schedule Service package.json missing"
    exit 1
fi

if [ -f "docker-compose.yml" ]; then
    echo "✅ Docker Compose file exists"
else
    echo "❌ ERROR: Docker Compose file missing"
    exit 1
fi

echo ""
echo "🚀 Testing Docker build (dry run)..."

# Check if docker-compose config is valid
if docker-compose config > /dev/null 2>&1; then
    echo "✅ Docker Compose configuration is valid"
else
    echo "❌ ERROR: Docker Compose configuration has issues"
    echo "Run 'docker-compose config' for details"
    exit 1
fi

echo ""
echo "📦 Testing service dependencies..."

# Check if services have required files
REQUIRED_FILES=(
    "services/user-service/src/index.ts"
    "services/user-service/Dockerfile"
    "services/ai-schedule-service/src/index.ts"
    "services/ai-schedule-service/Dockerfile"
    "apps/nginx-gateway/nginx.conf"
    "apps/nginx-gateway/Dockerfile"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ ERROR: $file missing"
        exit 1
    fi
done

echo ""
echo "🎉 All structure tests passed!"
echo ""
echo "Next steps:"
echo "1. Start Docker Desktop"
echo "2. Run: docker-compose up --build -d"
echo "3. Test endpoints:"
echo "   - NGINX Gateway: http://localhost:8080/"
echo "   - User Service: http://localhost:8080/api/v1/auth/health"
echo "   - AI Schedule: http://localhost:8080/api/v1/schedules/health"

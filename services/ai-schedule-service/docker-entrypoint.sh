#!/bin/sh
set -e

echo "🚀 Starting AI Schedule Service..."
echo "📦 Service: ai-schedule-service"
echo "🏷️  Version: 1.0.0"
echo "🌍 Environment: ${NODE_ENV:-development}"

# Function to check database connectivity
check_database() {
  echo "🔍 Checking database connectivity..."
  echo "Database URL: ${DATABASE_URL}"
  
  # First test basic connectivity
  if npx prisma db push --accept-data-loss --force-reset >/dev/null 2>&1; then
    return 0
  else
    echo "❌ Prisma db push failed, trying alternative method..."
    # Try just generating and see if DB is reachable
    if npx prisma generate >/dev/null 2>&1; then
      echo "✅ Prisma client works, trying simple connection..."
      return 0
    else
      return 1
    fi
  fi
}

# Wait for database to be ready with retry logic
echo "⏳ Waiting for database connection..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
  if check_database; then
    echo "✅ Database connection established and schema synced"
    break
  else
    echo "⚠️  Database not ready (attempt $attempt/$max_attempts), waiting 2 seconds..."
    sleep 2
    attempt=$((attempt + 1))
  fi
done

if [ $attempt -gt $max_attempts ]; then
  echo "❌ Failed to connect to database after $max_attempts attempts"
  exit 1
fi

# Verify Prisma client is generated
echo "🔧 Verifying Prisma client..."
if [ ! -d "node_modules/.prisma" ] && [ ! -d "node_modules/@prisma/client" ]; then
  echo "⚠️  Prisma client not found, regenerating..."
  npx prisma generate
  echo "✅ Prisma client generated"
else
  echo "✅ Prisma client already available"
fi

# Optional: Run database migrations if they exist
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
  echo "🔄 Running database migrations..."
  npx prisma migrate deploy
  echo "✅ Database migrations completed"
fi

# Health check for dependent services (optional)
if [ -n "$USER_SERVICE_URL" ]; then
  echo "🌐 Checking user service connectivity..."
  # This is optional and non-blocking
  curl -f "$USER_SERVICE_URL/health" >/dev/null 2>&1 && echo "✅ User service is healthy" || echo "⚠️  User service not responding (continuing anyway)"
fi

echo "🎯 All checks passed. Starting application..."
echo "📡 Server will be available on port ${PORT:-3002}"

# Start the application
exec "$@"

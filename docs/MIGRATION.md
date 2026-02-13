# Migration Guide: AI Study Planner v2.0

## 🚀 Overview

This guide helps you migrate from the JavaScript monolith to the new TypeScript microservices architecture.

## 📋 Prerequisites

- Node.js 20+ and npm 10+
- Docker and Docker Compose
- PostgreSQL 16+
- Google Gemini API key

## 🔧 Step-by-Step Migration

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configurations
# Required variables:
# - DATABASE_URL
# - GOOGLE_GENAI_API_KEY
# - JWT_SECRET
```

### 2. Database Migration

```bash
# Navigate to the main project directory
cd AI-Study-Planner

# Generate Prisma client for the main schema
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Optional: Open Prisma Studio to verify
npm run prisma:studio
```

### 3. Install Dependencies

```bash
# Install root dependencies
npm install

# Install service dependencies
npm install --workspace=services/user-service
npm install --workspace=services/ai-schedule-service
npm install --workspace=apps/api-gateway
```

### 4. Development Environment

#### Option A: Local Development

```bash
# Start all services in development mode
npm run dev

# Services will be available at:
# - API Gateway: http://localhost:3000
# - User Service: http://localhost:3001
# - AI Schedule Service: http://localhost:3002
```

#### Option B: Docker Development

```bash
# Build and start all services with Docker
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### 5. API Migration

The new API structure is:

```
Old → New
/api/study-plans → /api/study-plans (via API Gateway)
/api/schedules → /api/schedules (via API Gateway)
Direct backend calls → /api/auth/*, /api/users/* (via API Gateway)
```

#### Authentication
```bash
# Register a new user
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Study Plans & Schedules
```bash
# Generate AI schedule (same as before, but via API Gateway)
POST /api/schedules/generate
{
  "studyPlan": { ... },
  "dayNumber": 1,
  "totalDays": 30
}
```

## 🔄 Code Migration

### Frontend Integration

If you have a frontend, update API endpoints:

```javascript
// Old
const API_BASE = 'http://localhost:3000/api'

// New
const API_BASE = 'http://localhost:3000/api'  // Same, but now goes through API Gateway
```

### Authentication Headers

```javascript
// Include JWT token in requests
const token = localStorage.getItem('authToken');
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

## 🧪 Testing the Migration

### 1. Health Checks

```bash
# API Gateway
curl http://localhost:3000/health

# User Service
curl http://localhost:3001/health

# AI Schedule Service
curl http://localhost:3002/health
```

### 2. User Registration & Login

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. AI Schedule Generation

```bash
# Test AI schedule generation (requires auth token)
curl -X POST http://localhost:3000/api/schedules/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "studyPlan": {
      "id": 1,
      "userId": "user-id",
      "exam": "JEE Main",
      "subjects": ["Physics", "Chemistry", "Mathematics"],
      "dailyHours": 6
    },
    "dayNumber": 1,
    "totalDays": 30
  }'
```

## 🐳 Production Deployment

### Docker Production Setup

```bash
# Create production environment file
cp .env.example .env.production

# Edit .env.production with production values
# Build and deploy
docker-compose -f docker-compose.yml up -d
```

### Environment Variables for Production

```bash
NODE_ENV=production
DATABASE_URL="your-production-database-url"
GOOGLE_GENAI_API_KEY="your-production-api-key"
JWT_SECRET="your-secure-jwt-secret"
REDIS_URL="your-redis-url"
```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secret**: Use a strong, unique secret in production
3. **Database**: Use connection pooling and SSL in production
4. **API Keys**: Rotate Google Gemini API keys regularly
5. **Rate Limiting**: Adjust rate limits based on your needs

## 📊 Monitoring & Logging

All services include:
- Structured JSON logging
- Health check endpoints
- Request/response logging
- Error tracking

View logs:
```bash
# Docker logs
npm run docker:logs

# Individual service logs
tail -f logs/user-service-combined.log
tail -f logs/ai-schedule-service-combined.log
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's running on ports
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   netstat -ano | findstr :3002
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connection
   npx prisma db pull
   ```

3. **Service Communication Issues**
   ```bash
   # Check service health
   curl http://localhost:3001/health
   curl http://localhost:3002/health
   ```

4. **Docker Issues**
   ```bash
   # Rebuild containers
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

## 📈 Performance Optimization

### Production Optimizations

1. **Database Indexing**: Already included in schema
2. **Connection Pooling**: Configured via Prisma
3. **Caching**: Redis integration ready
4. **Load Balancing**: Nginx configuration included

### Scaling Considerations

- Each service can be scaled independently
- Use container orchestration (Kubernetes) for large scale
- Implement service discovery for dynamic scaling
- Add monitoring with Prometheus/Grafana

## 🎯 Next Steps

1. ✅ Complete migration following this guide
2. ✅ Test all functionality
3. ✅ Deploy to staging environment
4. ✅ Performance testing
5. ✅ Production deployment
6. 🔄 Monitor and optimize

## 🆘 Support

If you encounter issues during migration:

1. Check the logs for error details
2. Verify environment variables
3. Ensure all services are running
4. Test database connectivity
5. Check API Gateway routing

For additional help, refer to the main README.md or create an issue in the repository.

---

**Migration completed successfully? You now have a modern, scalable, TypeScript-based microservices architecture! 🎉**

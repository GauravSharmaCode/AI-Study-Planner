# API Contract Fixes - AI Study Planner Services

## Issues Identified and Fixed

### 1. **User Service - Route Path Mismatch**
**Problem**: NGINX gateway expected `/api/v1/auth/*` and `/api/v1/users/*` but user service was serving `/auth/*` and `/users/*`

**Fix**: Updated `src/index.ts` to serve both versioned and legacy routes:
```typescript
// API routes - Updated to match NGINX gateway expectations
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

// Legacy API routes (for backward compatibility)
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
```

### 2. **AI Schedule Service - Missing HTTP Server**
**Problem**: AI Schedule Service only had business logic (`ScheduleService` class) but no HTTP server to handle API requests. NGINX was trying to proxy to endpoints that didn't exist.

**Fix**: Created `src/index.ts` with Express.js server and proper API endpoints:
- Added Express server with middleware (CORS, Helmet, Morgan)
- Created versioned routes `/api/v1/schedules/*` and legacy `/schedules/*`
- Added proper error handling and logging
- Updated package.json dependencies and scripts

**New API Endpoints**:
```typescript
// Schedules
POST /api/v1/schedules/generate
GET /api/v1/schedules/:id
GET /api/v1/schedules/study-plan/:studyPlanId
PUT /api/v1/schedules/:id
DELETE /api/v1/schedules/:id
POST /api/v1/schedules/content/generate

// Study Plans (placeholder redirects)
GET /api/v1/study-plans/health
GET /api/v1/study-plans (redirects to main backend)
```

### 3. **NGINX Proxy Configuration Issues**
**Problem**: 
- User service: NGINX was trying to proxy to `/auth/` and `/users/` instead of `/api/v1/auth/` and `/api/v1/users/`
- AI Schedule service: NGINX was trying to proxy to `/schedules/` and `/study-plans/` instead of `/api/v1/schedules/` and `/api/v1/study-plans/`

**Fix**: Updated NGINX configuration to properly proxy to versioned endpoints:
```nginx
# User Service
location /api/v1/auth/ {
    proxy_pass http://user_service/api/v1/auth/;
    # ... other config
}

location /api/v1/users/ {
    proxy_pass http://user_service/api/v1/users/;
    # ... other config  
}

# AI Schedule Service
location /api/v1/schedules/ {
    proxy_pass http://ai_schedule_service/api/v1/schedules/;
    # ... other config
}

location /api/v1/study-plans/ {
    proxy_pass http://ai_schedule_service/api/v1/study-plans/;
    # ... other config
}
```

### 4. **Authentication Response Format Inconsistency**
**Problem**: 
- Register endpoint returned `{ status: "success", data: user }` without token
- Login endpoint returned `{ status: "success", token, data: { user } }` without message
- Inconsistent response structure

**Fix**: Updated auth controller responses:

#### Register Response (Now includes token for immediate login):
```json
{
  "status": "success",
  "message": "User registered successfully", 
  "token": "jwt-token-here",
  "data": {
    "user": { /* user object */ }
  }
}
```

#### Login Response (Now includes message):
```json
{
  "status": "success",
  "message": "Login successful",
  "token": "jwt-token-here", 
  "data": {
    "user": { /* user object */ }
  }
}
```

### 5. **Route Documentation**
**Fix**: Updated route documentation in `authRoutes.ts` to reflect correct API paths:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/health`

## Current API Contract

### Base URL
- **Production**: `http://nginx-gateway:8080`
- **Development**: `http://localhost:8080`

### Service Endpoints

#### User Service

##### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

#### Login User
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com", 
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John", 
      "lastName": "Doe",
      "isActive": true,
      "lastLoginAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

#### Logout User
```http
POST /api/v1/auth/logout
Authorization: Bearer {jwt-token}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

##### User Management Endpoints

#### Get Current User
```http
GET /api/v1/users/me
Authorization: Bearer {jwt-token}
```

#### Update Current User  
```http
PATCH /api/v1/users/me
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

#### Delete Current User
```http
DELETE /api/v1/users/me
Authorization: Bearer {jwt-token}
```

### AI Schedule Service

#### Schedule Management Endpoints

##### Generate Daily Schedule
```http
POST /api/v1/schedules/generate
Content-Type: application/json

{
  "studyPlan": {
    "id": 123,
    "userId": "user-uuid",
    "exam": "JEE Main",
    "subjects": ["Mathematics", "Physics", "Chemistry"],
    "dailyHours": 8,
    "preferences": {
      "startTime": "09:00"
    }
  },
  "dayNumber": 1,
  "totalDays": 30
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "Schedule generated successfully",
  "data": {
    "schedule": {
      "id": 456,
      "type": "DAILY",
      "studyPlanId": 123,
      "userId": "user-uuid",
      "dayNumber": 1,
      "focus": "Day 1 Study: Mathematics",
      "sessions": { /* sessions array */ },
      "breaks": [ /* breaks array */ ],
      "dailyTargets": [ /* targets array */ ],
      "metadata": { /* metadata object */ }
    }
  }
}
```

##### Get Schedule by ID
```http
GET /api/v1/schedules/:id
```

##### Get Schedules by Study Plan
```http
GET /api/v1/schedules/study-plan/:studyPlanId
```

##### Update Schedule
```http
PUT /api/v1/schedules/:id
Content-Type: application/json

{
  "focus": "Updated focus",
  "metadata": { "status": "COMPLETED" }
}
```

##### Delete Schedule
```http
DELETE /api/v1/schedules/:id
```

##### Generate Day Content (Preview)
```http
POST /api/v1/schedules/content/generate
Content-Type: application/json

{
  "studyPlan": { /* study plan object */ },
  "dayNumber": 1
}
```

#### Study Plans Endpoints

##### Health Check
```http
GET /api/v1/study-plans/health
```

**Note**: Study plan CRUD operations are handled by the main backend service. These endpoints return `501 Not Implemented` with redirect information.

### Health Checks
```http
GET /api/v1/auth/health      # User service auth health
GET /api/v1/schedules/health # AI schedule service health
GET /api/v1/study-plans/health # AI schedule service study plans health
GET /health                  # Individual service health
GET /                        # Gateway health and info
```

## Backward Compatibility

The service now supports both versioned and legacy routes:
- **New**: `/api/v1/auth/*` and `/api/v1/users/*`
- **Legacy**: `/auth/*` and `/users/*` (for existing clients)

## Testing

### Structure Testing
Run the structure validation:
```bash
test-structure.bat  # Windows
# or
bash test-structure.sh  # Linux/Mac
```

### API Testing (requires Docker services running)
```bash
# 1. Start all services
docker-compose up --build -d

# 2. Wait for services to start (30 seconds)
timeout 30

# 3. Run API tests
test-api.bat

# 4. Manual testing commands
curl -X GET http://localhost:8080/
curl -X GET http://localhost:8080/api/v1/auth/health
curl -X GET http://localhost:8080/api/v1/schedules/health

# 5. Integration testing
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Unit Testing (User Service)
```bash
cd services/user-service
npm install
npm test
```

## Notes

- **User Service**: All responses now include consistent structure with `status`, `message` (where appropriate), and `data`
- **AI Schedule Service**: Now properly set up as HTTP service with Express.js server and API endpoints
- **JWT tokens**: Provided immediately upon registration for seamless user experience
- **Versioned Routes**: Both services support versioned (`/api/v1/*`) and legacy (`/*`) routes
- **NGINX Gateway**: Properly routes to the correct versioned service endpoints
- **Rate Limiting**: Applied appropriately (5 req/min for auth, 100 req/min for general API, 30 req/min for AI endpoints)
- **Error Handling**: Comprehensive error handling with proper HTTP status codes and meaningful messages
- **Dependencies**: AI Schedule Service package.json updated with required Express.js dependencies

## Major Fixes Summary

✅ **User Service API Contract Alignment**
- Fixed route mounting and response formats
- Added proper JWT token handling
- Updated NGINX proxy configuration

✅ **AI Schedule Service HTTP Server Setup**  
- Created missing Express.js server (`src/index.ts`)
- Added all required API endpoints for schedule management
- Updated package.json with Express dependencies
- Fixed NGINX proxy routing

✅ **NGINX Gateway Configuration**
- Fixed proxy routes to point to correct versioned endpoints
- Added proper error handling and rate limiting
- Updated health check endpoints

---

**You were absolutely right to call out these API contract issues. The AI Schedule Service was completely missing its HTTP server layer, and both services had routing mismatches that would have caused complete system failure.**

# User Service

A production-grade microservice for user management and authentication in the AI Study Planner application. Built with Express.js, Prisma ORM, and PostgreSQL.

## ✨ Features

### Core Features
- ✅ User registration and authentication
- ✅ JWT-based authentication with secure token management
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC)
- ✅ Input validation and sanitization

### Security & Reliability
- ✅ Comprehensive structured logging with neat-logger
- ✅ Database query monitoring with Prisma
- ✅ Rate limiting and security headers
- ✅ Health checks and service monitoring
- ✅ Graceful shutdown handling
- ✅ Docker containerization with multi-stage builds
- ✅ Production-ready error handling

### Recent Additions
- ✅ Complete TypeScript conversion with strict type checking
- ✅ Restructured API routes (/auth and /users separation)
- ✅ Enhanced error handling with clean JSON responses
- ✅ Improved authentication middleware with role-based access
- ✅ User statistics endpoint for admin dashboard
- ✅ Comprehensive user management CRUD operations
- ✅ Logout functionality with token invalidation
- ✅ Enhanced request logging with structured metadata

## 🚀 Tech Stack

- **Runtime**: Node.js 20.x
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **Validation**: express-validator
- **Logging**: Shared neat-logger utility
- **Security**: Helmet, CORS, Rate Limiting
- **Testing**: Jest with supertest
- **Containerization**: Docker with Alpine Linux

## 🏗️ Project Structure

```
user-service/
├── src/
│   ├── controllers/          # Request handlers (TypeScript)
│   ├── models/              # Database models (Prisma)
│   ├── middleware/          # Express middleware
│   ├── routes/              # API route definitions
│   │   ├── authRoutes.ts    # Authentication routes
│   │   └── userRoutes.ts    # User management routes
│   ├── services/            # Business logic services
│   ├── utils/               # Utility functions
│   ├── config/              # Configuration files
│   ├── interfaces.ts        # TypeScript interfaces
│   └── index.ts             # Application entry point
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
├── tests/                   # Test files
├── dist/                    # Compiled JavaScript (build output)
├── Dockerfile              # Multi-stage Docker build
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x
- PostgreSQL database
- Docker (optional)

### Development Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

### Using Docker

```bash
# Build and start with Docker Compose (from root directory)
docker-compose up user-service

# Or build standalone
docker build -t user-service .
docker run -p 3001:3001 user-service
```

## 🔧 Environment Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=3001
SERVICE_NAME=user-service

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/user_service_db?schema=public

# JWT Configuration
JWT_SECRET=your-development-jwt-secret-change-in-production
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=info
```

## 📋 API Documentation

### Base URL
- Development: `http://localhost:3001`
- Health Check: `GET /health`

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true,
      "createdAt": "2025-07-16T08:00:00.000Z"
    },
    "token": "jwt-token-here"
  }
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "token": "jwt-token-here"
  }
}
```

### User Management Endpoints

#### Get Current User Profile
```http
GET /users/me
Authorization: Bearer {jwt-token}
```

#### Update Current User Profile
```http
PATCH /users/me
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "email": "johnsmith@example.com"
}
```

#### Delete Current User Account
```http
DELETE /users/me
Authorization: Bearer {jwt-token}
```

#### Logout User
```http
POST /auth/logout
Authorization: Bearer {jwt-token}
```

### Admin Endpoints

#### Get User Statistics (Admin only)
```http
GET /users/stats
Authorization: Bearer {admin-jwt-token}
```

#### List All Users (Admin only)
```http
GET /users
Authorization: Bearer {admin-jwt-token}
```

#### Create User (Admin only)
```http
POST /users
Authorization: Bearer {admin-jwt-token}
Content-Type: application/json

{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "securePassword123",
  "firstName": "New",
  "lastName": "User"
}
```

#### Get Specific User (Admin only)
```http
GET /users/{userId}
Authorization: Bearer {admin-jwt-token}
```

#### Update User (Admin only)
```http
PATCH /users/{userId}
Authorization: Bearer {admin-jwt-token}
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name"
}
```

#### Delete User (Admin only)
```http
DELETE /users/{userId}
Authorization: Bearer {admin-jwt-token}
```

#### Change User Password (Admin only)
```http
PATCH /users/{userId}/change-password
Authorization: Bearer {admin-jwt-token}
Content-Type: application/json

{
  "newPassword": "newSecurePassword456"
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration
```

### Test Structure
- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Database Tests**: Prisma model testing
- **Authentication Tests**: JWT and middleware testing

## 🐳 Docker

### Multi-stage Dockerfile
- **Builder stage**: Installs dependencies and builds application
- **Production stage**: Minimal Alpine Linux image with only runtime dependencies
- **Security**: Non-root user, minimal attack surface
- **Health checks**: Built-in container health monitoring

### Docker Compose Integration
The service integrates with the main `docker-compose.yml` for:
- Database connections
- Service networking
- Health checks
- Volume mounting

## 📊 Monitoring & Logging

### Health Checks
- **Container Health**: `/health` endpoint with comprehensive system checks
- **Database Health**: Connection and query verification
- **Memory Monitoring**: Process memory usage tracking
- **Uptime Tracking**: Service availability metrics

### Logging Strategy
```javascript
import { logger } from '@gauravsharmacode/neat-logger';

// Structured logging with context
logger.info('User registered successfully', {
  service: 'user-service',
  function: 'registerUser',
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString()
});
```

### Log Levels
- **error**: System errors and exceptions
- **warn**: Warning conditions
- **info**: General information
- **debug**: Detailed debugging information

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure, stateless authentication
- **Password Hashing**: bcrypt with salt rounds
- **Role-based Access**: User/Admin role separation
- **Token Expiration**: Configurable token lifetime

### Request Security
- **Rate Limiting**: Prevents abuse and DDoS
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Cross-origin request handling
- **Security Headers**: Helmet.js security middleware
- **SQL Injection Protection**: Prisma ORM parameterized queries

## 🚀 Performance Optimizations

- **Database Connection Pooling**: Prisma connection pool management
- **Efficient Queries**: Optimized database queries with proper indexing
- **Memory Management**: Graceful shutdown and cleanup
- **Caching Strategy**: Ready for Redis integration
- **Compression**: Gzip response compression

## 🔄 Database Schema

### User Model
```prisma
model User {
  id          String      @id @default(uuid())
  email       String      @unique
  name        String
  firstName   String?
  lastName    String?
  password    String?
  phone       String?
  isActive    Boolean     @default(true)
  isVerified  Boolean     @default(false)
  role        String      @default("user")
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}
```

### Migration Commands
```bash
# Create new migration
npm run prisma:migrate

# Deploy migrations to production
npm run prisma:migrate:prod

# Reset database (development only)
npx prisma migrate reset
```

## 🛠️ Development

### Available Scripts
```bash
# Development
npm run dev              # Start with hot reload
npm run dev:debug        # Start with debugger

# Building
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npx prisma studio        # Open Prisma Studio

# Code Quality
npm run lint             # ESLint check
npm run lint:fix         # Fix ESLint issues
npm run format           # Prettier formatting

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Adding New Features
1. **Create route**: Add new route in `src/routes/`
2. **Add controller**: Implement logic in `src/controllers/`
3. **Add validation**: Create validation middleware
4. **Write tests**: Add comprehensive tests
5. **Update docs**: Document new endpoints

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Use conventional commit messages
5. Ensure all linting and tests pass

## 📝 Error Handling

### Error Response Format
```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error details"
  },
  "timestamp": "2025-07-16T08:00:00.000Z"
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `USER_NOT_FOUND`: User does not exist
- `INVALID_CREDENTIALS`: Authentication failed
- `UNAUTHORIZED`: Access denied
- `USER_ALREADY_EXISTS`: Registration conflict
- `INTERNAL_ERROR`: Server error

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Part of the AI Study Planner microservices ecosystem** 🚀

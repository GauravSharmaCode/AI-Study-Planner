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
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login User
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Logout User
```http
POST /api/v1/auth/logout
Authorization: Bearer {jwt-token}
```

### User Management Endpoints

#### Get Current User Profile
```http
GET /api/v1/users/me
Authorization: Bearer {jwt-token}
```

#### Update Current User Profile
```http
PATCH /api/v1/users/me
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
DELETE /api/v1/users/me
Authorization: Bearer {jwt-token}
```

### Admin Endpoints

#### Get User Statistics (Admin only)
```http
GET /api/v1/users/stats
Authorization: Bearer {admin-jwt-token}
```

#### List All Users (Admin only)
```http
GET /api/v1/users
Authorization: Bearer {admin-jwt-token}
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

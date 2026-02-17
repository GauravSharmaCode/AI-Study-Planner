# AI Study Planner

A modern, scalable AI-powered study planner built with microservices architecture, TypeScript, Docker, and PostgreSQL.

The application helps students prepare for high-stakes examinations by generating structured, balanced daily study plans using Google Gemini AI, and adapting them dynamically based on execution data.

## 🏗️ Architecture Overview

The application follows a microservices architecture with clear domain separation:

```
┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │     NGINX       │
│  (Frontend)     │◄──►│  Load Balancer  │
└─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │ NGINX Gateway   │
                       │    (Port 8080)  │
                       └─────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
            ┌─────────────────┐    ┌─────────────────┐
            │  User Service   │    │ AI Schedule     │
            │   (Port 3001)   │    │   Service       │
            │                 │    │  (Port 3002)    │
            └─────────────────┘    └─────────────────┘
                    │                       │
            ┌─────────────────┐    ┌─────────────────┐
            │   User DB       │    │  Schedule DB    │
            │ (Port 5432)     │    │ (Port 5433)     │
            └─────────────────┘    └─────────────────┘
                    │                       │
                    └───────┬───────────────┘
                            │
                    ┌─────────────────┐
                    │     Redis       │
                    │  (Port 6379)    │
                    └─────────────────┘
```

## 🎯 Services

### 1. NGINX Gateway (Port 8080)
- **Purpose**: High-performance API Gateway and reverse proxy
- **Tech Stack**: NGINX, Docker
- **Features**:
  - Request routing to appropriate services
  - Rate limiting with different zones
  - Load balancing with health checks
  - Security headers and CORS handling
  - Request/response logging
  - Connection limiting and protection

### 2. User Service (Port 3001)
- **Purpose**: User authentication and profile management
- **Tech Stack**: Express.js, TypeScript, Prisma, PostgreSQL, JWT, bcrypt
- **Domain**: User management
- **Features**:
  - User registration and authentication
  - JWT token generation and validation
  - Profile management
  - Role-based access control (RBAC)

### 3. AI Schedule Service (Port 3002)
- **Purpose**: AI-powered study schedule generation and management
- **Tech Stack**: Express.js, TypeScript, Prisma, PostgreSQL, Google Gemini AI, BullMQ, Redis
- **Domain**: Study plans and schedules
- **Features**:
  - **Deterministic Engine**: AI-assisted heuristic estimation with deterministic scheduling logic.
  - **Study Plan Management**: Create, update, and track study plans.
  - **Session Management**: Track daily sessions, mark as completed/skipped.
  - **Adaptive Rescheduling**: Background workers (BullMQ) redistribute workload when sessions are skipped.
  - **Integration**: Validates users via HTTP calls to User Service.

## 🛠️ Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Cache / Queue**: Redis
- **AI**: Google Gemini API
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: NGINX
- **Authentication**: JWT

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)
- Git

### Environment Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd AI-Study-Planner
   ```

2. **Set up environment variables**:
   ```bash
   # Copy environment templates
   cp apps/nginx-gateway/.env.example apps/nginx-gateway/.env
   cp services/user-service/.env.example services/user-service/.env
   cp services/ai-schedule-service/.env.example services/ai-schedule-service/.env

   # Create root .env for Docker Compose
   echo "JWT_SECRET=your-super-secret-jwt-key-here" > .env
   echo "GEMINI_API_KEY=your-gemini-api-key-here" >> .env
   echo "GOOGLE_GENAI_API_KEY=your-gemini-api-key-here" >> .env
   ```

3. **Start the services**:
   ```bash
   # Build and start all services
   docker-compose up --build

   # Or run in detached mode
   docker-compose up -d --build
   ```

4. **Access the API**:
   - **API Gateway**: http://localhost:8080
   - **Gateway Health**: http://localhost:8080/health
   - **Internal Health**: http://localhost:8090/nginx-health

5. **Initialize databases**:
   ```bash
   # User Service database
   docker-compose exec user-service npx prisma migrate deploy
   docker-compose exec user-service npx prisma generate

   # AI Schedule Service database
   docker-compose exec ai-schedule-service npx prisma migrate deploy
   docker-compose exec ai-schedule-service npx prisma generate
   ```

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start databases only**:
   ```bash
   docker-compose up user-db schedule-db redis -d
   ```

3. **Start services in development mode**:
   ```bash
   # Terminal 1 - NGINX Gateway
   cd apps/nginx-gateway
   npm run dev

   # Terminal 2 - User Service
   cd services/user-service
   npm run dev

   # Terminal 3 - AI Schedule Service
   cd services/ai-schedule-service
   npm run dev
   ```

## 📡 API Endpoints

All endpoints are accessed through the NGINX Gateway at `http://localhost:8080`

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/health` - Auth service health

### Users (`/api/v1/users`)
- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/me` - Update user profile
- `DELETE /api/v1/users/me` - Delete user account
- `GET /api/v1/users/stats` - Get user statistics (Admin only)

### Study Plans (`/api/v1/plans`)
- `POST /api/v1/plans/generate` - Generate AI-assisted study plan
- `GET /api/v1/plans` - Get user's study plans
- `GET /api/v1/plans/:id` - Get specific study plan
- `PUT /api/v1/plans/:id` - Update study plan
- `DELETE /api/v1/plans/:id` - Delete study plan
- `POST /api/v1/plans/:id/reschedule` - Trigger manual reschedule
- `GET /api/v1/plans/:id/analytics` - Get plan analytics

### Study Sessions (`/api/v1/sessions`)
- `PATCH /api/v1/sessions/:id/status` - Update session status (triggers reschedule if needed)
- `PATCH /api/v1/sessions/:id/remarks` - Update session remarks

### Health Checks
- `GET /health` - NGINX Gateway health
- `GET /nginx-health` - Internal NGINX status (port 8090)
- `GET /api/v1/health/services` - Service health aggregation

## 🔧 Configuration

### Environment Variables

#### NGINX Gateway
- No environment variables needed (configuration via nginx.conf)
- Upstream services discovered via Docker networking

#### User Service
- `PORT` - Service port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - JWT expiration time
- `BCRYPT_ROUNDS` - Password hashing rounds

#### AI Schedule Service
- `PORT` - Service port (default: 3002)
- `DATABASE_URL` - PostgreSQL connection string
- `USER_SERVICE_URL` - User service URL for validation
- `GOOGLE_GENAI_API_KEY` - Google Gemini API key
- `AI_MODEL` - AI model to use (default: gemini-1.5-flash)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests for specific service
cd services/user-service && npm test
cd services/ai-schedule-service && npm test
cd apps/nginx-gateway && npm test

# Run integration tests
npm run test:integration
```

## 📊 Monitoring & Logging

- **Logs**: Centralized structured logging
- **Health Checks**: Built-in health endpoints for all services
- **Metrics**: Service-level metrics and monitoring
- **Log Files**: Stored in `./logs` directory

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds
- **Rate Limiting**: Protection against abuse
- **CORS**: Cross-origin request security
- **Input Validation**: Request validation middleware (Zod)
- **Security Headers**: Helmet.js security headers

## 🐳 Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start specific services
docker-compose up user-service ai-schedule-service

# View logs
docker-compose logs -f user-service

# Execute commands in container
docker-compose exec user-service npm run prisma:studio

# Stop all services
docker-compose down

# Remove volumes (caution: deletes data)
docker-compose down -v
```

## 🏗️ Project Structure

```
AI-Study-Planner/
├── apps/
│   └── nginx-gateway/        # NGINX API Gateway
├── services/
│   ├── user-service/         # User authentication service
│   │   ├── src/
│   │   │   ├── controllers/  # Request handlers
│   │   │   ├── models/       # Database models (Prisma)
│   │   │   ├── middleware/   # Express middleware
│   │   │   ├── routes/       # API route definitions
│   │   │   ├── services/     # Business logic services
│   │   │   ├── utils/        # Utility functions
│   │   │   └── index.ts      # Application entry point
│   │   └── prisma/           # Database schema & migrations
│   └── ai-schedule-service/  # AI scheduling service
│       ├── src/
│       │   ├── controllers/  # Plan & Session controllers
│       │   ├── services/     # Scheduling Engine & AI Client
│       │   ├── queues/       # BullMQ queues
│       │   ├── workers/      # Reschedule workers
│       │   └── index.ts      # Application entry point
│       └── prisma/           # Database schema & migrations
├── infra/
│   ├── nginx.conf           # NGINX load balancer config
│   ├── init-user-db.sql     # User DB initialization
│   └── init-schedule-db.sql # Schedule DB initialization
├── logs/                    # Application logs
├── docker-compose.yml       # Docker services orchestration
└── README.md               # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the logs for debugging information

---

**Built with ❤️ using TypeScript, Docker, and modern microservices architecture**

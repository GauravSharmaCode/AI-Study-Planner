# AI Study Planner - Microservices Architecture v2.0

A modern, scalable AI-powered study planner built with microservices architecture, TypeScript, Docker, and PostgreSQL.

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
  - Request/response logging with metrics
  - Connection limiting and protection
  - Custom error handling

### 2. User Service (Port 3001)
- **Purpose**: User authentication and profile management
- **Tech Stack**: Express.js, TypeScript, Prisma, PostgreSQL, JWT, bcrypt
- **Domain**: User management
- **Features**:
  - User registration and authentication
  - JWT token generation and validation
  - Profile management
  - Password hashing and security

### 3. AI Schedule Service (Port 3002)
- **Purpose**: AI-powered study schedule generation and management
- **Tech Stack**: Express.js, TypeScript, Prisma, PostgreSQL, Google Gemini AI
- **Domain**: Study plans and schedules
- **Features**:
  - AI-powered schedule generation
  - Study plan management
  - User validation via HTTP calls to User Service
  - Integration with Google Gemini for intelligent scheduling

## 🛠️ Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Cache**: Redis
- **AI**: Google Gemini API
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: NGINX
- **Authentication**: JWT
- **Security**: bcrypt, helmet, CORS, rate limiting

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

### Users (`/api/v1/users`)
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update user profile
- `DELETE /api/v1/users/me` - Delete user account

### Schedules (`/api/v1/schedules`)
- `POST /api/v1/schedules/generate` - Generate AI-powered study schedule
- `GET /api/v1/schedules` - Get user's schedules
- `GET /api/v1/schedules/:id` - Get specific schedule
- `PUT /api/v1/schedules/:id` - Update schedule
- `DELETE /api/v1/schedules/:id` - Delete schedule

### Study Plans (`/api/v1/study-plans`)
- `POST /api/v1/study-plans` - Create study plan
- `GET /api/v1/study-plans` - Get user's study plans
- `GET /api/v1/study-plans/:id` - Get specific study plan
- `PUT /api/v1/study-plans/:id` - Update study plan
- `DELETE /api/v1/study-plans/:id` - Delete study plan

### Health Checks
- `GET /health` - NGINX Gateway health
- `GET /nginx-health` - Internal NGINX status (port 8090)
- `GET /api/v1/health/services` - Service health aggregation

### Legacy API Support
The gateway supports legacy endpoints with 301 redirects:
- `/api/auth/*` → `/api/v1/auth/*`
- `/api/users/*` → `/api/v1/users/*`
- `/api/schedules/*` → `/api/v1/schedules/*`

## 🔧 Configuration

### Environment Variables

#### NGINX Gateway
- No environment variables needed (configuration via nginx.conf)
- Upstream services discovered via Docker networking
- Rate limiting and timeouts configured in nginx.conf
- Logs stored in `/var/log/nginx/`

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
- `GEMINI_API_KEY` - Google Gemini API key
- `AI_MODEL` - AI model to use
- `AI_TEMPERATURE` - AI creativity level (0-1)

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

- **Logs**: Centralized logging with Winston
- **Health Checks**: Built-in health endpoints for all services
- **Metrics**: Service-level metrics and monitoring
- **Log Files**: Stored in `./logs` directory

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds
- **Rate Limiting**: Protection against abuse
- **CORS**: Cross-origin request security
- **Input Validation**: Request validation middleware
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
│   │   │   │   ├── authRoutes.ts    # Authentication routes
│   │   │   │   └── userRoutes.ts    # User management routes
│   │   │   ├── services/     # Business logic services
│   │   │   ├── utils/        # Utility functions
│   │   │   ├── config/       # Configuration files
│   │   │   ├── interfaces.ts # TypeScript interfaces
│   │   │   └── index.ts      # Application entry point
│   │   ├── prisma/           # Database schema & migrations
│   │   ├── tests/            # Test files
│   │   ├── dist/             # Compiled JavaScript
│   │   ├── Dockerfile        # Multi-stage Docker build
│   │   └── README.md
│   └── ai-schedule-service/  # AI scheduling service
│       └── [similar structure to user-service]
├── infra/
│   ├── nginx.conf           # NGINX load balancer config
│   ├── init-user-db.sql     # User DB initialization
│   └── init-schedule-db.sql # Schedule DB initialization
├── logs/                    # Application logs
├── docker-compose.yml       # Docker services orchestration
└── README.md               # This file
```

## 🔄 Microservices Communication

Services communicate via:
1. **HTTP APIs**: Synchronous service-to-service calls
2. **Shared Cache**: Redis for session storage and caching
3. **Database per Service**: Each service owns its data

### Inter-Service Communication Example:
```typescript
// AI Schedule Service validates users via HTTP call to User Service
const userResponse = await serviceClient.get('/users/validate', {
  headers: { Authorization: `Bearer ${token}` }
});
```

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**:
   - Set production environment variables
   - Configure proper JWT secrets
   - Set up SSL certificates

2. **Database Setup**:
   - Use managed PostgreSQL services
   - Configure connection pooling
   - Set up database backups

3. **Container Orchestration**:
   - Use Kubernetes or Docker Swarm
   - Configure auto-scaling
   - Set up health checks and monitoring

4. **Load Balancing**:
   - Configure NGINX or cloud load balancers
   - Set up SSL termination
   - Configure proper caching

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

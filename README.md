# AI Study Planner

An AI-powered study planner microservices application built with TypeScript, Express.js, Prisma ORM, PostgreSQL, and Google Gemini AI.

## 🏗️ Architecture

This project follows a **microservices architecture** with the following services:

- **User Service** (Port 3001): User management, authentication, and profiles
- **AI Schedule Service** (Port 3002): AI-powered study plan generation and session management
- **NGINX Gateway** (Port 8080): API gateway and load balancer
- **PostgreSQL Databases**: Separate databases for each service
- **Redis**: Caching and session management

## ✨ Features

- **AI-Powered Study Plans**: Generate personalized study schedules using Google Gemini AI
- **Microservices Architecture**: Scalable and maintainable service-oriented design
- **User Management**: Registration, authentication, and profile management
- **Study Session Tracking**: Track progress with session status and remarks
- **Clean Architecture**: Separation of concerns with service and controller layers
- **Docker Support**: Full containerization with Docker Compose
- **Database Per Service**: Independent data storage for each microservice
- **Comprehensive Logging**: Structured logging with Winston
- **Health Checks**: Built-in health monitoring for all services
- **Automatic Schema Management**: Prisma integration with Docker entrypoints

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Google Gemini AI API Key

### Environment Setup

1. **Clone the repository:**
```bash
git clone https://github.com/GauravSharmaCode/AI-Study-Planner.git
cd AI-Study-Planner
```

2. **Create environment file:**
Create a `.env` file in the root directory:
```bash
# AI Configuration
GOOGLE_GENAI_API_KEY=your_google_gemini_api_key_here

# Security
JWT_SECRET=your_secure_jwt_secret_here

# Optional: Override default settings
NODE_ENV=production
LOG_LEVEL=info
```

3. **Start the application:**
```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

4. **Verify services are running:**
```bash
# Health checks
curl http://localhost:3001/health  # User Service
curl http://localhost:3002/health  # AI Schedule Service
curl http://localhost:8080/health  # NGINX Gateway
```

## 📡 API Endpoints

### 🔐 User Service (Port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/auth/register` | User registration |
| POST | `/auth/login` | User login |
| GET | `/users/profile` | Get user profile |
| PUT | `/users/profile` | Update user profile |

### 🤖 AI Schedule Service (Port 3002)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/plans/generate` | Generate AI study plan |
| GET | `/plans/:id` | Get study plan by ID |
| PATCH | `/sessions/:id/status` | Update session status |
| PATCH | `/sessions/:id/remarks` | Update session remarks |

### 🌐 NGINX Gateway (Port 8080)

All services are accessible through the gateway:
- User Service: `http://localhost:8080/api/users/*`
- AI Schedule Service: `http://localhost:8080/api/schedule/*`

## 🧪 API Testing

### Generate Study Plan
```powershell
$body = @{
    subjects = @("Mathematics", "Physics", "Chemistry")
    availableHoursPerDay = 4
    targetCompletionDate = "2025-09-01"
    userId = "user-123"
} | ConvertTo-Json

Invoke-WebRequest -Method POST -Uri "http://localhost:3002/plans/generate" -Body $body -ContentType "application/json"
```

### Get Study Plan
```powershell
Invoke-WebRequest -Method GET -Uri "http://localhost:3002/plans/your-plan-id"
```

### Update Session Status
```powershell
$statusBody = @{
    status = "completed"
} | ConvertTo-Json

Invoke-WebRequest -Method PATCH -Uri "http://localhost:3002/sessions/session-id/status" -Body $statusBody -ContentType "application/json"
```

## 🗄️ Database Schema

### User Service Database

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  password  String?
  googleId  String?  @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### AI Schedule Service Database

```prisma
model StudyPlan {
  id                    String        @id @default(uuid())
  userId                String
  subjects              String[]
  availableHoursPerDay  Int
  targetCompletionDate  DateTime
  plan                  Json
  sessions              StudySession[]
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt
}

model StudySession {
  id          String    @id @default(uuid())
  studyPlanId String
  studyPlan   StudyPlan @relation(fields: [studyPlanId], references: [id], onDelete: Cascade)
  topic       String
  startTime   String
  endTime     String
  status      SessionStatus @default(PENDING)
  remarks     String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum SessionStatus {
  PENDING
  COMPLETED
  SKIPPED
}
```

## 🏃 Development

### Local Development Setup

1. **Install dependencies:**
```bash
# Install root dependencies
npm install

# Install service dependencies
cd services/user-service && npm install
cd ../ai-schedule-service && npm install
```

2. **Set up databases:**
```bash
# Start only databases
docker-compose up -d user-db schedule-db redis

# Run migrations
cd services/user-service && npx prisma migrate dev
cd ../ai-schedule-service && npx prisma migrate dev
```

3. **Start services locally:**
```bash
# Terminal 1: User Service
cd services/user-service
npm run dev

# Terminal 2: AI Schedule Service
cd services/ai-schedule-service
npm run dev
```

### Testing

```bash
# Run tests for AI Schedule Service
cd services/ai-schedule-service
npm test

# Run with coverage
npm run test:coverage

# Run tests with verbose output
npm test -- --verbose --no-silent
```

### Building

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build ai-schedule-service

# Build without cache
docker-compose build --no-cache
```

## 🔧 Configuration

### Service Ports

- **User Service**: 3001
- **AI Schedule Service**: 3002
- **NGINX Gateway**: 8080 (HTTP), 8090 (Admin)
- **User Database**: 5432
- **Schedule Database**: 5433
- **Redis**: 6379

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_GENAI_API_KEY` | Google Gemini AI API Key | Required |
| `JWT_SECRET` | JWT signing secret | `your-jwt-secret-key` |
| `NODE_ENV` | Environment mode | `production` |
| `LOG_LEVEL` | Logging level | `info` |
| `DATABASE_URL` | Database connection string | Auto-configured |

## 📊 Monitoring & Logging

### Centralized Logging

All services use Winston for structured logging:

```typescript
// Logs are available in
./logs/user-service-combined.log
./logs/ai-schedule-service-combined.log
./logs/nginx-access.log
```

### Health Monitoring

Each service provides health endpoints:

```bash
# Check all service health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:8080/health
```

### Docker Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f ai-schedule-service
docker-compose logs -f user-service
```

## 🚀 Deployment

### Production Deployment

1. **Ensure environment variables are set:**
```bash
export GOOGLE_GENAI_API_KEY="your-api-key"
export JWT_SECRET="your-secure-secret"
```

2. **Deploy with Docker Compose:**
```bash
docker-compose -f docker-compose.yml up -d
```

3. **Verify deployment:**
```bash
docker-compose ps
curl http://your-domain:8080/health
```

### Scaling Services

```bash
# Scale AI Schedule Service
docker-compose up -d --scale ai-schedule-service=3

# Scale User Service
docker-compose up -d --scale user-service=2
```

## 🧰 Troubleshooting

### Common Issues

**Database Connection Issues:**
```bash
# Check database status
docker-compose logs user-db
docker-compose logs schedule-db

# Restart databases
docker-compose restart user-db schedule-db
```

**Service Not Starting:**
```bash
# Check service logs
docker-compose logs service-name

# Rebuild service
docker-compose build --no-cache service-name
```

**Prisma Issues:**
```bash
# Regenerate Prisma client
cd services/ai-schedule-service
npx prisma generate
npx prisma db push
```

## 📁 Project Structure

```
AI-Study-Planner/
├── services/
│   ├── user-service/              # User management service
│   │   ├── src/                   # Source code
│   │   ├── prisma/                # Database schema
│   │   ├── tests/                 # Test files
│   │   ├── Dockerfile             # Container definition
│   │   └── docker-entrypoint.sh   # Startup script
│   └── ai-schedule-service/       # AI-powered scheduling service
│       ├── src/
│       │   ├── controllers/       # Thin HTTP controllers
│       │   ├── services/          # Business logic layer
│       │   ├── routes/            # API routes
│       │   └── utils/             # Utilities
│       ├── prisma/                # Database schema
│       ├── tests/                 # Comprehensive tests
│       ├── Dockerfile             # Container definition
│       └── docker-entrypoint.sh   # Startup script
├── apps/
│   └── nginx-gateway/             # API Gateway
├── shared/
│   ├── types/                     # Shared TypeScript types
│   └── utils/                     # Shared utilities
├── infra/                         # Infrastructure configs
├── logs/                          # Application logs
├── docker-compose.yml             # Multi-service orchestration
└── README.md                      # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Gaurav Sharma**
- GitHub: [@GauravSharmaCode](https://github.com/GauravSharmaCode)
- Email: shrma.gurv@gmail.com

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) - AI-powered study plan generation
- [Prisma ORM](https://prisma.io/) - Database toolkit
- [Express.js](https://expressjs.com/) - Web framework
- [Docker](https://docker.com/) - Containerization platform
- [Winston](https://github.com/winstonjs/winston) - Logging library

# AI Study Planner - Modular TypeScript Architecture

A modern, scalable AI-powered study planning application built with TypeScript, microservices architecture, and Docker containerization.

## 🏗️ Architecture Overview

```
AI-Study-Planner/
├── apps/                          # Applications
│   └── api-gateway/              # Main API Gateway
├── services/                     # Microservices
│   ├── ai-schedule-service/      # AI-powered schedule generation
│   └── user-service/             # User management and authentication
├── shared/                       # Shared utilities and types
├── infra/                        # Infrastructure configuration
├── backend/                      # Legacy backend (being migrated)
└── docker-compose.yml            # Container orchestration
```

## 🚀 Features

- **Modular Microservices**: Each service handles specific business logic
- **TypeScript**: Full type safety across all services
- **Docker Containerization**: Easy deployment and development
- **AI-Powered Scheduling**: Uses Google Gemini AI for intelligent study plan generation
- **API Gateway**: Centralized routing and rate limiting
- **PostgreSQL Database**: Robust data persistence with Prisma ORM
- **Redis Caching**: Fast data access and session management
- **Nginx Reverse Proxy**: Load balancing and SSL termination

## 🛠️ Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Cache**: Redis 7
- **AI**: Google Gemini API
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **Logging**: Winston
- **Testing**: Jest

## 📦 Services

### API Gateway (Port 3000)
- Request routing and load balancing
- Rate limiting and security headers
- CORS and authentication middleware
- Health checks and monitoring

### User Service (Port 3001)
- User registration and authentication
- JWT token management
- Password hashing with bcrypt
- User profile management

### AI Schedule Service (Port 3002)
- AI-powered study schedule generation
- Integration with Google Gemini API
- Dynamic content creation for study plans
- Schedule optimization algorithms

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 8+
- Docker and Docker Compose
- Google Gemini API key

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/GauravSharmaCode/AI-Study-Planner.git
   cd AI-Study-Planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development services**
   ```bash
   npm run dev
   ```

### Docker Deployment

1. **Build and start all services**
   ```bash
   npm run docker:up
   ```

2. **View logs**
   ```bash
   npm run docker:logs
   ```

3. **Stop services**
   ```bash
   npm run docker:down
   ```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev                 # Start all services in development mode
npm run build              # Build all services
npm run test               # Run tests for all services

# Docker
npm run docker:build       # Build Docker images
npm run docker:up          # Start containers
npm run docker:down        # Stop containers
npm run docker:logs        # View container logs

# Database
npm run prisma:migrate     # Run database migrations
npm run prisma:generate    # Generate Prisma client
npm run prisma:studio      # Open Prisma Studio

# Code Quality
npm run lint               # Run ESLint
npm run format            # Format code with Prettier
```

### Adding a New Service

1. Create service directory in `services/`
2. Add `package.json`, `tsconfig.json`, and `Dockerfile`
3. Implement service logic in `src/`
4. Add service to `docker-compose.yml`
5. Update API Gateway routing

## 🌐 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Study Plans
- `GET /api/study-plans` - Get user's study plans
- `POST /api/study-plans` - Create new study plan
- `PUT /api/study-plans/:id` - Update study plan
- `DELETE /api/study-plans/:id` - Delete study plan

### Schedules
- `GET /api/schedules` - Get schedules for study plan
- `POST /api/schedules/generate` - Generate AI schedule
- `PUT /api/schedules/:id` - Update schedule
- `DELETE /api/schedules/:id` - Delete schedule

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting per IP
- CORS protection
- Security headers via Helmet
- Input validation with Joi
- SQL injection prevention via Prisma

## 📊 Monitoring & Logging

- Structured logging with Winston
- Health check endpoints
- Container health monitoring
- Request/response logging
- Error tracking and aggregation

## 🚀 Deployment

### Production Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# AI Service
GOOGLE_GENAI_API_KEY=your-gemini-api-key

# Redis
REDIS_URL=redis://host:6379

# Environment
NODE_ENV=production
```

### Docker Production Deployment

```bash
# Build optimized images
docker-compose -f docker-compose.prod.yml build

# Deploy with production configuration
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- GitHub Issues: [Report bugs or request features](https://github.com/GauravSharmaCode/AI-Study-Planner/issues)
- Email: shrma.gurv@gmail.com
- GitHub: [@GauravSharmaCode](https://github.com/GauravSharmaCode)

## 🗺️ Roadmap

- [ ] Real-time notifications
- [ ] Mobile app support
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Calendar integration
- [ ] Collaborative study plans
- [ ] Progress tracking
- [ ] Gamification features

---

**Built with ❤️ by [Gaurav Sharma](https://github.com/GauravSharmaCode)**

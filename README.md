# AI Study Planner

An AI-powered study planner microservices application built with TypeScript, Express.js, Prisma ORM, PostgreSQL, and Google Gemini AI.

## 🏗️ Architecture

This project follows a **microservices architecture** managed as a **Monorepo**.

### Services

- **User Service** (Port 3001): User management, authentication, and profiles
- **AI Schedule Service** (Port 3002): AI-powered study plan generation (`/api/v1/plans/*`, `/api/v1/sessions/*`)
- **NGINX Gateway** (Port 8080): API gateway and load balancer

### Validation (Zod Schemas)

Each service uses **Zod** for runtime validation and type inference. Services maintain their own validation schemas in `src/schemas/` - these are not shared but follow similar patterns.

### Infrastructure

- **PostgreSQL Databases**: Separate databases for each service
- **Redis**: Caching and session management
- **Docker**: Full containerization

## ✨ Features

- **AI-Powered Study Plans**: Generate personalized study schedules using Google Gemini AI
- **Microservices Architecture**: Scalable, decoupled design
- **User Management**: Secure auth with JWT
- **Study Session Management**: Session status updates (pending, completed, skipped)
- **Docker Support**: "One-command" startup

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Google Gemini AI API Key

### Environment Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/GauravSharmaCode/AI-Study-Planner.git
   cd AI-Study-Planner
   ```

2. **Create environment file**
   Create a `.env` file in the root directory:

   ```bash
   GOOGLE_GENAI_API_KEY=your_key
   JWT_SECRET=your_secret
   # See .env.example for full list
   ```

3. **Start the application**

   ```bash
   docker-compose up -d --build
   ```

4. **Verify services**
   ```bash
   curl http://localhost:8080/health
   ```

## 👩‍💻 Development

### Install Dependencies

```bash
npm install # Installs dependencies for all workspaces
```

### Build & Validate

We use Zod schemas to validate types during the build process.

```bash
npm run build
```

### Run Locally

```bash
# Terminal 1: User Service
cd services/user-service
npm run dev

# Terminal 2: AI Schedule Service
cd services/ai-schedule-service
npm run dev
```

## 🗄️ Database Schema

### User Service

- `User`: Core authentication entity

### AI Schedule Service

- `StudyPlan`: User study goals with subjects, hours per day, target date, and AI-generated plan JSON
- `StudySession`: Individual study blocks with date, topic, time, status (pending/completed/skipped), and remarks

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

ISC

## 👨‍💻 Author

**Gaurav Sharma**

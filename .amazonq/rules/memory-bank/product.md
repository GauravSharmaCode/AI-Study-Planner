# Product Overview

## Purpose
AI Study Planner is a microservices-based application that helps students prepare for high-stakes examinations by generating structured, balanced daily study plans using Google Gemini AI. The system adapts dynamically based on execution data, redistributing workload when sessions are skipped or completed.

## Value Proposition
- **AI-Powered Planning**: Leverages Google Gemini AI for intelligent study schedule generation with deterministic scheduling logic
- **Adaptive Rescheduling**: Automatically redistributes workload using background workers (BullMQ) when sessions are skipped
- **Scalable Architecture**: Built with microservices pattern for independent scaling and deployment
- **Production-Ready**: Includes NGINX gateway, rate limiting, health checks, and comprehensive monitoring

## Key Features

### Study Plan Management
- Generate AI-assisted study plans with heuristic estimation
- Create, update, track, and delete study plans
- View plan analytics and progress tracking
- Manual reschedule triggers for plan adjustments

### Session Management
- Track daily study sessions with status updates (completed/skipped)
- Add remarks and notes to sessions
- Automatic workload redistribution on session status changes
- Session-level progress monitoring

### User Management
- Secure user registration and authentication with JWT
- Profile management and updates
- Role-based access control (RBAC)
- User statistics dashboard (Admin only)

### Infrastructure Features
- **API Gateway**: NGINX-based reverse proxy with rate limiting and load balancing
- **Health Monitoring**: Built-in health endpoints for all services
- **Security**: JWT authentication, bcrypt password hashing, security headers, CORS
- **Caching & Queuing**: Redis for caching and BullMQ job processing
- **Database**: PostgreSQL with Prisma ORM for type-safe database access

## Target Users

### Primary Users
- **Students**: Preparing for competitive exams, certifications, or academic tests
- **Self-Learners**: Individuals managing complex learning schedules
- **Educators**: Creating structured study plans for students

### Use Cases
1. **Exam Preparation**: Generate comprehensive study schedules for upcoming exams
2. **Skill Development**: Plan learning paths for new technologies or subjects
3. **Time Management**: Balance multiple subjects with optimal time allocation
4. **Progress Tracking**: Monitor study completion and adjust plans dynamically
5. **Adaptive Learning**: Automatically reschedule based on actual progress

## Technical Highlights
- **Microservices Architecture**: Independent services for user management and scheduling
- **Containerized Deployment**: Docker and Docker Compose for easy deployment
- **Type Safety**: Full TypeScript implementation across all services
- **API-First Design**: RESTful APIs with comprehensive endpoint coverage
- **Observability**: Structured logging, health checks, and monitoring capabilities

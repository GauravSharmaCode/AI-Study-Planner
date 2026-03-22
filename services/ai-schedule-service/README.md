# AI Schedule Service

## Overview

The AI Schedule Service is a microservice that generates intelligent study schedules using Ollama Cloud AI with open-source models (Llama 3.1, Mistral, Mixtral, etc.). It creates personalized daily schedules, study sessions, and learning targets based on user study plans and preferences.

## Features

- **AI-Powered Schedule Generation**: Uses Ollama Cloud AI to create intelligent study schedules (deterministic + heuristic).
- **Personalized Content**: Generates topics, sessions, and targets based on study plans.
- **Adaptive Rescheduling**: Automatically redistributes workload when sessions are skipped.
- **Progress Tracking**: Monitors study progress and adapts recommendations.
- **User Validation**: Integrates with User Service for authentication and validation.
- **Robust Error Handling**: Graceful fallbacks when AI quota is exceeded.

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: Ollama Cloud API (`ollama` npm package)
- **Queue**: BullMQ with Redis (for async rescheduling)
- **Logging**: Winston with structured logging
- **Testing**: Jest with Supertest
- **Containerization**: Docker

## Project Structure

```
ai-schedule-service/
├── src/
│   ├── services/
│   │   ├── schedulingEngine.ts     # Core deterministic engine
│   │   ├── studyPlanService.ts     # Business logic for plans
│   │   └── ai-api-client.ts        # AI API client (Ollama Cloud)
│   ├── controllers/
│   │   └── studyPlanController.ts  # Request handlers
│   ├── routes/
│   │   ├── studyPlanRoutes.ts      # Plan management routes
│   │   └── sessionRoutes.ts        # Session management routes
│   ├── queues/
│   │   └── rescheduleQueue.ts      # BullMQ queue setup
│   ├── workers/
│   │   └── rescheduleWorker.ts     # Background worker for rescheduling
│   ├── utils/
│   │   └── logger.ts               # Winston logging configuration
│   ├── healthcheck.ts              # Docker health check script
│   └── index.ts                    # Application entry point
├── tests/
│   ├── unit/                       # Unit tests
│   └── integration/                # Integration tests
├── prisma/
│   └── schema.prisma               # Database schema definition
├── logs/
│   ├── combined.log                # All application logs
│   └── error.log                   # Error-only logs
├── Dockerfile                      # Multi-stage Docker build
├── jest.config.json                # Jest testing configuration
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # This documentation
```

## Prerequisites

- Node.js 20+
- PostgreSQL database
- Redis (for BullMQ)
- Ollama Cloud API key (get from https://ollama.com)
- Docker (for containerized deployment)

## Environment Variables

Create a `.env` file in the service root:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ai_schedule_db"

# Ollama Cloud AI
# Get your API key from https://ollama.com
OLLAMA_API_KEY="your_ollama_api_key_here"
OLLAMA_MODEL="llama3.1:8b-cloud"  # Optional: override default model

# Service Configuration
PORT=3002
NODE_ENV=development

# External Services
USER_SERVICE_URL="http://localhost:3001"

# Logging
LOG_LEVEL=info
```

### Supported Ollama Cloud Models

| Model | Size | Use Case |
|-------|------|----------|
| `llama3.1:8b-cloud` | 8B | Fast, cost-effective (recommended) |
| `llama3.1:70b-cloud` | 70B | Higher quality reasoning |
| `mixtral:8x7b-cloud` | 47B | Balanced performance |
| `mistral:7b-cloud` | 7B | Lightweight tasks |

## Installation

### Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Docker Deployment

```bash
# Build Docker image
docker build -t ai-schedule-service .

# Run container
docker run -p 3002:3002 --env-file .env ai-schedule-service
```

## API Endpoints

### Base URL
- Development: `http://localhost:3002`
- Health Check: `GET /health`

### Study Plans (`/api/v1/plans`)

#### Generate Study Plan
```http
POST /api/v1/plans/generate
Content-Type: application/json

{
  "subjects": ["Data Structures", "Algorithms", "Database Systems"],
  "availableHoursPerDay": 6,
  "targetCompletionDate": "2025-09-01",
  "userId": "user123"
}
```

#### Get All Study Plans
```http
GET /api/v1/plans
```

#### Get Study Plan by ID
```http
GET /api/v1/plans/:id
```

#### Update Study Plan
```http
PUT /api/v1/plans/:id
Content-Type: application/json

{
  "availableHoursPerDay": 8
}
```

#### Delete Study Plan
```http
DELETE /api/v1/plans/:id
```

#### Trigger Manual Reschedule
```http
POST /api/v1/plans/:id/reschedule
```

#### Get Analytics
```http
GET /api/v1/plans/:id/analytics
```

### Study Sessions (`/api/v1/sessions`)

#### Update Session Status
```http
PATCH /api/v1/sessions/:id/status
Content-Type: application/json

{
  "status": "completed"
}
```
*Triggers async rescheduling if status is 'skipped' or 'partial'*

#### Update Session Remarks
```http
PATCH /api/v1/sessions/:id/remarks
Content-Type: application/json

{
  "remarks": "Focused on Binary Search Trees today"
}
```

## Data Models

### Study Plan

```typescript
interface StudyPlan {
  id: string;
  userId: string;
  subjects: string[];
  availableHoursPerDay: number;
  targetCompletionDate: string;
  plan: any; // Entire JSON plan structure
  createdAt: Date;
  updatedAt: Date;
}
```

### Study Session

```typescript
interface StudySession {
  id: string;
  studyPlanId: string;
  date: Date;
  topic: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'completed' | 'skipped';
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Testing

### Unit Tests

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Integration Tests

```bash
# Run API tests through Docker
docker-compose up -d
npm run test:integration
```

## Error Handling

The service implements comprehensive error handling:

- **Validation Errors**: Zod schema validation
- **AI Service Errors**: Graceful handling of quota and connection issues
- **Database Errors**: Transaction rollbacks and connection recovery
- **External Service Errors**: Retry logic for User Service calls

## Logging

Structured logging with Winston:

```typescript
// Log levels: error, warn, info, debug
logger.info('Schedule generated', {
  scheduleId: schedule.id,
  userId: studyPlan.userId
});
```

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console output (development)

## AI Integration Details

The service uses Ollama Cloud API for AI-powered topic estimation:

1. **Topic Estimation**: AI breaks down subjects into specific, study-able topics
2. **Effort Estimation**: AI estimates hours needed per topic (0.5-8 hours)
3. **Difficulty Tagging**: AI tags topics as easy/medium/hard

### Circuit Breaker Pattern

The AI client implements the circuit breaker pattern for resilience:

- **Timeout**: 8 seconds per request
- **Error Threshold**: 50% failure rate triggers open state
- **Reset Timeout**: 10 seconds before retry
- **Fallback**: Deterministic topic estimation when circuit is open

### Retry Logic

Exponential backoff with configurable parameters:

- **Max Retries**: 2
- **Initial Delay**: 500ms
- **Max Delay**: 2000ms
- **Backoff Multiplier**: 2x

# AI Schedule Service

## Overview

The AI Schedule Service is a microservice that generates intelligent study schedules using Google's Gemini AI. It creates personalized daily schedules, study sessions, and learning targets based on user study plans and preferences.

## Features

- **AI-Powered Schedule Generation**: Uses Google Gemini AI to create intelligent study schedules
- **Personalized Content**: Generates topics, sessions, and targets based on study plans
- **Flexible Study Sessions**: Creates balanced study sessions with appropriate breaks
- **Progress Tracking**: Monitors study progress and adapts recommendations
- **User Validation**: Integrates with User Service for authentication and validation
- **Robust Error Handling**: Graceful fallbacks when AI quota is exceeded

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: Google Gemini AI (`@google/genai`)
- **Logging**: Winston
- **Testing**: Jest with Supertest
- **Containerization**: Docker

## Project Structure

```
ai-schedule-service/
├── src/
│   ├── services/
│   │   └── ScheduleService.ts      # Main business logic for AI schedule generation
│   ├── types/
│   │   └── index.ts                # TypeScript type definitions
│   ├── utils/
│   │   └── logger.ts               # Winston logging configuration
│   ├── healthcheck.ts              # Docker health check script
│   └── index.ts                    # Application entry point and Express server setup
├── tests/
│   ├── unit/
│   │   └── scheduleService.unit.test.ts  # Unit tests for ScheduleService
│   └── setup.ts                    # Test environment setup
├── prisma/
│   └── schema.prisma               # Database schema definition
├── logs/
│   ├── combined.log                # All application logs
│   └── error.log                   # Error-only logs
├── .env.example                    # Environment variables template
├── .eslintrc.js                    # ESLint configuration
├── Dockerfile                      # Multi-stage Docker build
├── jest.config.json                # Jest testing configuration
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # This documentation
```

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google Gemini AI API key
- Docker (for containerized deployment)

## Environment Variables

Create a `.env` file in the service root:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ai_schedule_db"

# Google Gemini AI
GOOGLE_GENAI_API_KEY="your_gemini_api_key_here"

# Service Configuration
PORT=3002
NODE_ENV=development

# External Services
USER_SERVICE_URL="http://localhost:3001"

# Logging
LOG_LEVEL=info
```

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

### Health Check

```http
GET /health
```

Returns service health status and AI connection verification.

### Schedule Management

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

#### Get Study Plan by ID

```http
GET /api/v1/plans/:id
```

#### Update Session Status

```http
PATCH /api/v1/sessions/:id/status
Content-Type: application/json

{
  "status": "completed"
}
```

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

### Schedule

```typescript
interface Schedule {
  id: number;
  type: 'DAILY';
  studyPlanId: number;
  userId: string;
  dayNumber: number;
  focus: string;
  sessions: {
    set: Session[];
  };
  breaks: Break[];
  dailyTargets: string[];
  metadata: ScheduleMetadata;
  createdAt: Date;
  updatedAt: Date;
}
```

### Session

```typescript
interface Session {
  time: string;
  subject: string;
  topics: Topic[];
  type: 'STUDY';
  duration: string;
  recommendedPace: string;
}
```

### Topic

```typescript
interface Topic {
  name: string;
  type: 'NEW' | 'REVIEW' | 'REVISION';
  difficulty: number; // 1-5 scale
  duration: string;   // in minutes
}
```

## AI Integration

The service integrates with Google Gemini AI for:

1. **Topic Generation**: Creates relevant study topics based on subjects and progress
2. **Daily Targets**: Generates specific learning objectives for each day
3. **Content Personalization**: Adapts content based on difficulty and user preferences

### Quota Management

The service handles AI quota limits gracefully:

- **Fallback Content**: Provides default topics when quota is exceeded
- **Warning Logs**: Logs quota issues without failing requests
- **Retry Logic**: Implements intelligent retry mechanisms

## Database Schema

```prisma
model StudyPlan {
  id                    String   @id @default(uuid())
  userId                String   
  subjects              String[] 
  availableHoursPerDay  Int      
  targetCompletionDate  DateTime 
  plan                  Json     
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model StudySession {
  id          String   @id @default(uuid())
  studyPlanId String
  date        String   
  topic       String   
  startTime   String   
  endTime     String   
  status      String   @default("pending") 
  remarks     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
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

- **Validation Errors**: Input validation with detailed error messages
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

## Performance Considerations

- **Database Indexing**: Indexes on frequently queried fields
- **Connection Pooling**: Prisma connection management
- **AI Request Batching**: Efficient AI API usage
- **Caching Strategy**: Redis integration ready (infrastructure present)

## Development Guidelines

### Code Style

- TypeScript strict mode enabled
- ESLint configuration for code quality
- Consistent error handling patterns
- Comprehensive JSDoc documentation

### Adding New Features

1. Define TypeScript interfaces in `src/types/`
2. Implement business logic in `src/services/`
3. Add appropriate tests in `tests/`
4. Update API documentation

## Monitoring and Health Checks

### Health Endpoint

The `/health` endpoint provides:

```json
{
  "status": "healthy",
  "timestamp": "2025-08-11T07:30:00.000Z",
  "services": {
    "database": "connected",
    "ai": "available",
    "userService": "reachable"
  },
  "version": "1.0.0"
}
```

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node dist/healthcheck.js
```

## Troubleshooting

### Common Issues

1. **AI Quota Exceeded**
   - Check API key validity
   - Monitor quota usage in Google Cloud Console
   - Service continues with fallback content

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check PostgreSQL service status
   - Review connection pool settings

3. **User Service Integration**
   - Verify USER_SERVICE_URL
   - Check network connectivity
   - Review service discovery configuration

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

## Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export DATABASE_URL="postgresql://..."
   export GOOGLE_GENAI_API_KEY="..."
   ```

2. **Build and Deploy**
   ```bash
   npm run build
   npm start
   ```

3. **Docker Compose**
   ```bash
   docker-compose up -d ai-schedule-service
   ```

### Scaling Considerations

- Horizontal scaling supported (stateless service)
- Database connection pooling configured
- AI API rate limiting handled gracefully
- Load balancer health checks supported

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Update documentation
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create GitHub issues for bugs
- Check logs in `logs/` directory
- Review health check endpoint
- Verify environment configuration

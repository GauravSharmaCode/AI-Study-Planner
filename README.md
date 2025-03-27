# AI Study Planner

An AI-powered study planner application built with Express.js, Prisma ORM, and PostgreSQL.

## Features

- User management with Prisma ORM
- Study plan creation and tracking
- Study session management
- Resource management for study sessions
- Logging with Winston
- PostgreSQL database integration

## Prerequisites

- Node.js (v20 or higher)
- PostgreSQL (Neon.tech)
- npm

## Installation

1. Clone and setup:

```bash
git clone https://github.com/GauravSharmaCode/AI-Study-Planner.git
cd AI-Study-Planner
npm install
```

2. Environment Configuration:  
   Create a `.env` file in the `backend/` directory with the following content:

```properties
PORT=3000

# Replace with your PostgreSQL connection string
DATABASE_URL="postgresql://<username>:<password>@<host>/<database>?sslmode=require"
```

3. Database Setup:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

## API Endpoints

### Fetch All Users

```http
GET /
```

**Success Response (200 OK)**

```json
[
  {
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2023-10-01T12:00:00.000Z",
    "updatedAt": "2023-10-01T12:00:00.000Z"
  }
]
```

**Error Responses**

- `500`: Internal Server Error

## Database Schema

```prisma
model User {
  id             String     @id @default(uuid())
  email          String     @unique
  name           String?
  password       String?
  googleId       String?    @unique
  studyPlans     StudyPlan[]
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
}

model StudyPlan {
  id             String       @id @default(uuid())
  userId         String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  exam           String
  studyDuration  String
  dailyHours     Int
  subjects       String[]
  optionals      String[]
  studyStyle     String[]
  numberOfAttempts Int
  studySessions  StudySession[]
  createdAt      DateTime     @default(now())
}

model StudySession {
  id             String      @id @default(uuid())
  studyPlanId    String
  studyPlan      StudyPlan   @relation(fields: [studyPlanId], references: [id], onDelete: Cascade)
  day            Int
  topics         String[]
  completed      Boolean     @default(false)
  resources      Resource[]
}

model Resource {
  id            String      @id @default(uuid())
  studySessionId String
  studySession  StudySession @relation(fields: [studySessionId], references: [id], onDelete: Cascade)
  type          String
  url           String
}
```

## Logging

The application uses Winston for logging:

- Logs are stored in the `backend/logs/` directory.
- Separate logs for errors, combined logs, and query logs.

## Running the Application

**Development**

```bash
npm run dev
```

**Production**

```bash
set NODE_ENV=production
npm start
```

## Dependencies

- express: Web framework
- @prisma/client: Database ORM
- dotenv: Environment variable management
- winston: Logging

## Author

Gaurav Sharma

- GitHub: [@GauravSharmaCode](https://github.com/GauravSharmaCode)
- Email: shrma.gurv@gmail.com

## License

ISC

## Additional Resources

- [Prisma Documentation](https://pris.ly/d/prisma-schema)
- [Express.js Documentation](https://expressjs.com/)
- [Winston Documentation](https://github.com/winstonjs/winston)

# Test Cases Documentation

## AI Study Planner - Comprehensive Testing Strategy

This document outlines the test cases implemented for both microservices in the AI Study Planner application.

## 🎯 Testing Strategy Overview

### Test Types Implemented:
1. **Unit Tests** - Testing individual functions and methods
2. **Integration Tests** - Testing API endpoints and service integration
3. **Performance Tests** - Testing response times and concurrent load
4. **Error Handling Tests** - Testing error scenarios and edge cases

### Test Coverage Goals:
- **Code Coverage**: >80% for all services
- **API Coverage**: 100% of endpoints tested
- **Error Coverage**: All error scenarios covered
- **Performance**: Response times within acceptable limits

---

## 🧪 User Service Test Cases

### Unit Tests (`tests/unit/userService.test.ts`)

#### UserService.createUser()
- ✅ **Success Case**: Create user with all fields
- ✅ **Success Case**: Create user with minimal required fields
- ✅ **Error Case**: Email already exists (409)
- ✅ **Error Case**: Phone already exists (409)
- ✅ **Validation**: Password hashing verification

#### UserService.authenticateUser()
- ✅ **Success Case**: Valid credentials
- ✅ **Error Case**: User not found (401)
- ✅ **Error Case**: Inactive user account (401)
- ✅ **Error Case**: Incorrect password (401)
- ✅ **Side Effect**: Last login timestamp update

#### UserService.getUserById()
- ✅ **Success Case**: User found
- ✅ **Error Case**: User not found (404)

#### UserService.updateUser()
- ✅ **Success Case**: Update user profile
- ✅ **Error Case**: Phone conflict with another user
- ✅ **Validation**: Name field computation

#### UserService.softDeleteUser()
- ✅ **Success Case**: Soft delete user
- ✅ **Verification**: User marked as inactive

#### UserService.getAllUsers()
- ✅ **Success Case**: Paginated user list
- ✅ **Feature**: Search and filtering
- ✅ **Feature**: Sorting options

### Integration Tests (`tests/integration/userService.integration.test.ts`)

#### POST /api/v1/auth/register
- ✅ **201**: Successful registration with token
- ✅ **400**: Invalid email format
- ✅ **400**: Missing required fields
- ✅ **409**: Duplicate email registration

#### POST /api/v1/auth/login
- ✅ **200**: Successful login with token
- ✅ **401**: Invalid password
- ✅ **401**: Non-existent user
- ✅ **401**: Inactive user account

#### GET /api/v1/users/me
- ✅ **200**: Get current user profile
- ✅ **401**: No authentication token
- ✅ **401**: Invalid authentication token

#### PATCH /api/v1/users/me
- ✅ **200**: Update profile successfully
- ✅ **400**: Invalid phone format
- ✅ **409**: Phone conflict

#### DELETE /api/v1/users/me
- ✅ **204**: Soft delete account
- ✅ **Verification**: Login fails after deletion

#### GET /health
- ✅ **200**: Health check response
- ✅ **Metrics**: Memory usage and uptime

---

## 🤖 AI Schedule Service Test Cases

### Unit Tests (`tests/unit/scheduleService.test.ts`)

#### ScheduleService.generateSchedule()
- ✅ **Success Case**: Generate schedule with AI
- ✅ **Error Case**: AI service unavailable
- ✅ **Error Case**: Quota exceeded (429)
- ✅ **Validation**: Required study plan fields

#### ScheduleService.optimizeSchedule()
- ✅ **Success Case**: Optimize based on feedback
- ✅ **Feature**: Performance metrics integration
- ✅ **Feature**: Difficulty adjustment

#### ScheduleService.validateScheduleData()
- ✅ **Validation**: Correct schedule data
- ✅ **Error**: Missing subjects
- ✅ **Error**: Invalid daily hours (>12)
- ✅ **Error**: Past exam date

#### ScheduleService.generatePrompt()
- ✅ **Feature**: Comprehensive AI prompt generation
- ✅ **Feature**: Optional fields handling
- ✅ **Feature**: Study style integration

#### ScheduleService.parseAIResponse()
- ✅ **Success**: Valid AI response parsing
- ✅ **Error**: Invalid JSON format
- ✅ **Error**: Missing required fields

#### Error Handling
- ✅ **Network Errors**: Connection refused
- ✅ **Timeout Errors**: Request timeout
- ✅ **Rate Limiting**: Quota exceeded

### Integration Tests (`tests/integration/aiScheduleService.integration.test.ts`)

#### POST /api/v1/schedules/generate
- ✅ **200**: Generate study schedule successfully
- ✅ **400**: Invalid request data
- ✅ **429/503**: AI service errors gracefully handled

#### POST /api/v1/schedules/optimize
- ✅ **200**: Optimize schedule with feedback
- ✅ **404**: Non-existent schedule

#### GET /api/v1/schedules/:id
- ✅ **200**: Retrieve schedule by ID
- ✅ **404**: Non-existent schedule

#### PUT /api/v1/schedules/:id
- ✅ **200**: Update schedule successfully
- ✅ **404**: Non-existent schedule

#### DELETE /api/v1/schedules/:id
- ✅ **204**: Delete schedule successfully
- ✅ **Verification**: Schedule not found after deletion

#### Study Plans Endpoints (Not Implemented)
- ✅ **501**: GET /api/v1/study-plans
- ✅ **501**: POST /api/v1/study-plans

#### Error Handling
- ✅ **404**: Unknown routes
- ✅ **400**: Malformed JSON requests
- ✅ **429**: Rate limiting enforcement

#### AI Content Generation
- ✅ **Resilience**: AI quota exceeded handling
- ✅ **Validation**: AI response format validation

#### Performance Tests
- ✅ **Response Time**: <1 second for health checks
- ✅ **Concurrency**: Handle 5 concurrent requests
- ✅ **Rate Limiting**: Proper rate limit enforcement

#### GET /health
- ✅ **200**: Health check response
- ✅ **Metrics**: Service status and timestamp

---

## 🔧 Test Configuration

### Jest Configuration
```json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "setupFilesAfterEnv": ["<rootDir>/tests/setup.ts"],
  "collectCoverageFrom": ["src/**/*.ts", "!src/index.ts"],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

### Test Scripts
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- userService.test.ts
```

---

## 🏃‍♂️ Running Tests

### User Service Tests
```bash
cd services/user-service
npm test
```

### AI Schedule Service Tests
```bash
cd services/ai-schedule-service
npm test
```

### All Services Tests
```bash
# From project root
docker-compose -f docker-compose.test.yml up --build
```

---

## 📊 Test Metrics & Goals

### Coverage Targets
- **Unit Tests**: 85% code coverage
- **Integration Tests**: 100% endpoint coverage
- **Error Scenarios**: 90% error path coverage

### Performance Benchmarks
- **API Response Time**: <500ms for 95% of requests
- **Database Queries**: <100ms average
- **AI Generation**: <30s timeout
- **Concurrent Users**: Support 100+ concurrent requests

### Quality Gates
- ✅ All tests must pass before merge
- ✅ Code coverage above 80%
- ✅ No critical security vulnerabilities
- ✅ Performance benchmarks met

---

## 🚀 Continuous Integration

### GitHub Actions Workflow
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Test Environments
- **Development**: Run tests locally
- **Staging**: Full integration testing
- **Production**: Smoke tests only

---

## 📝 Test Maintenance

### Regular Tasks
- 🔄 Update test data monthly
- 🔄 Review and update API contracts
- 🔄 Performance benchmark validation
- 🔄 Security test updates

### Test Data Management
- Use factories for test data generation
- Isolate tests with proper cleanup
- Mock external services consistently
- Maintain realistic test scenarios

---

This comprehensive test suite ensures high quality, reliability, and performance of the AI Study Planner microservices architecture.

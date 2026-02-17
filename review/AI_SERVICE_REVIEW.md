# Production-Grade Code Review: AI Service Integration

## Summary

Critical security vulnerabilities and reliability issues identified in AI service integration. Major concerns around prompt injection, API key management, and error handling before production deployment.

## Context

Review of AI schedule service components including Google Gemini client integration, study plan generation, and AI response handling. This service processes user input and sends it to external AI APIs.

## Critical Issues Found

### 1. API Key Management - CRITICAL (Risk: 5/5)

**File**: `services/ai-schedule-service/src/config/index.ts:31`

```typescript
googleGenAiKey: process.env.GOOGLE_GENAI_API_KEY || '',
```

**File**: `services/ai-schedule-service/src/services/studyPlanService.ts:33`

```typescript
this.aiClient = new AIAPIClient(process.env.GOOGLE_GENAI_API_KEY || "");
```

**Issue**: Empty string fallback for API key allows uninitialized client creation.
**Impact**: Service will fail silently or expose error details.
**Remediation**:

- Remove empty string fallback
- Fail fast on startup if API key missing
- Implement proper secret management (AWS Secrets Manager, HashiCorp Vault)
- Add API key rotation mechanism

### 2. Prompt Injection Vulnerability - CRITICAL (Risk: 5/5)

**File**: `services/ai-schedule-service/src/services/studyPlanService.ts:230-237`

```typescript
private async generateStudyPlanContent(data: CreatePlanRequest): Promise<any> {
  const prompt = `Generate a study plan for the following:
  Subjects: ${data.subjects.join(', ')}
  Available hours per day: ${data.availableHoursPerDay}
  Target completion date: ${data.targetCompletionDate}

  Return a JSON object with dates as keys and arrays of study sessions as values.
  Each session should have: topic, start_time, end_time, status (default "pending").
  Format: {"2025-08-12": [{"topic": "Algebra", "start_time": "09:00", "end_time": "10:00", "status": "pending"}]}`;
```

**Issue**: Direct string interpolation of user input into AI prompt without sanitization.
**Impact**: Malicious users can inject arbitrary prompts, bypass AI safety measures, or extract system information.
**Remediation**:

- Implement strict input sanitization and validation
- Use prompt templating with escaping
- Add prompt length limits
- Implement content filtering for both input and output
- Add system prompts that restrict AI behavior

### 3. AI Response Parsing Vulnerability - HIGH (Risk: 4/5)

**File**: `services/ai-schedule-service/src/services/studyPlanService.ts:240-246`

```typescript
const aiResponse = await this.aiClient.generateContent(prompt);
const jsonMatch = aiResponse.match(/\{.*\}/s);

if (!jsonMatch) {
  throw new Error("AI failed to generate valid study plan format");
}

return JSON.parse(jsonMatch[0]);
```

**Issue**: Unsafe regex parsing and JSON parsing without validation.
**Impact**:

- Code injection via malicious JSON
- Service crashes on malformed responses
- Potential denial of service
  **Remediation**:
- Use schema validation (Zod, Joi) for AI responses
- Implement safe JSON parsing with try-catch
- Add response size limits
- Validate structure and content of parsed data
- Use structured output with responseSchema consistently

### 4. Input Validation Issues - HIGH (Risk: 4/5)

#### 4a. Insufficient Subject Validation

**File**: `services/ai-schedule-service/src/services/studyPlanService.ts:200-203`

```typescript
if (
  !data.subjects ||
  !Array.isArray(data.subjects) ||
  data.subjects.length === 0
) {
  throw new Error("Subjects are required and must be a non-empty array");
}
```

**Issue**: No validation of subject content, length, or allowed values.
**Impact**:

- Prompt injection via malicious subject names
- Excessive token usage
- Unpredictable AI behavior
  **Remediation**:
- Implement allowed subject list/whitelist
- Add string length limits for subjects
- Sanitize subject names (remove special characters)
- Limit number of subjects per request

#### 4b. Weak Date Validation

**File**: `services/ai-schedule-service/src/services/studyPlanService.ts:220-223`

```typescript
if (targetDate <= new Date()) {
  throw new Error("Target completion date must be in the future");
}
```

**Issue**: No upper bound on target date.
**Impact**: Unreasonable planning horizons, excessive resource usage.
**Remediation**:

- Add maximum planning horizon (e.g., 2 years)
- Validate date ranges
- Add business logic validation for reasonable study periods

### 5. Error Handling & Information Disclosure - HIGH (Risk: 4/5)

#### 5a. Detailed Error Messages

**File**: `services/ai-schedule-service/src/controllers/studyPlanController.ts:40-44`

```typescript
} catch (error) {
  logger.error("Controller: Error generating study plan:", error);
  res.status(500).json({
    error: "Failed to generate study plan",
    message: (error as Error).message,
  });
}
```

**Issue**: Exposing internal error details to clients.
**Impact**: Information disclosure, potential attack vector discovery.
**Remediation**:

- Sanitize error messages for external responses
- Use generic error messages for clients
- Log detailed errors internally
- Implement error classification (user errors vs system errors)

#### 5b. Missing Circuit Breaker

**File**: `services/ai-schedule-service/src/services/ai-api-client.ts:17-52`
**Issue**: No circuit breaker pattern for AI API failures.
**Impact**: Cascading failures when AI service is down.
**Remediation**:

- Implement circuit breaker pattern
- Add fallback mechanisms
- Monitor AI API health
- Graceful degradation when AI unavailable

### 6. Resource Management Issues - MEDIUM (Risk: 3/5)

#### 6a. Unbounded Token Usage

**Issue**: No token usage limits or cost controls.
**Impact**: Excessive API costs, resource exhaustion.
**Remediation**:

- Implement token counting and limits
- Add user-based quotas
- Monitor usage patterns
- Implement cost controls

#### 6b. No Request Rate Limiting

**File**: `services/ai-schedule-service/src/controllers/studyPlanController.ts`
**Issue**: No rate limiting on AI endpoints.
**Impact**: API abuse, cost spikes, DoS potential.
**Remediation**:

- Implement strict rate limiting on AI endpoints
- Add user-based quotas
- Implement request queuing
- Add usage monitoring

## Positive Security Measures

### 1. Retry Logic

✅ Implemented exponential backoff with jitter
✅ Configurable retry attempts
✅ Proper error logging for retries

### 2. Structured Output Usage

✅ Using responseSchema for some endpoints
✅ Type-safe response handling

### 3. Database Operations

✅ Proper transaction handling
✅ Error handling for database operations
✅ Input validation for database operations

## Design Issues

### 1. Mixed Response Handling

**Issue**: Inconsistent use of structured vs unstructured AI responses.
**Impact**: Unpredictable parsing, maintenance complexity.
**Remediation**: Standardize on structured output with schema validation.

### 2. Tight Coupling

**Issue**: AI client tightly coupled to Google Gemini specific implementation.
**Impact**: Difficult to switch providers, test failures.
**Remediation**: Abstract AI client behind interface, implement factory pattern.

### 3. Missing Observability

**Issue**: No metrics for AI operations, costs, or performance.
**Impact**: No visibility into AI service usage and health.
**Remediation**: Add comprehensive metrics and monitoring.

## Risk Scorecard

| Dimension           | Score | Justification                                     |
| ------------------- | ----- | ------------------------------------------------- |
| API Security        | 1/5   | API key fallback, no secret management            |
| Input Validation    | 2/5   | Basic validation, missing sanitization            |
| Prompt Security     | 1/5   | Direct interpolation, prompt injection vulnerable |
| Response Handling   | 2/5   | Unsafe parsing, inconsistent validation           |
| Error Handling      | 2/5   | Information disclosure, missing circuit breaker   |
| Resource Management | 3/5   | Basic retry, missing quotas and limits            |
| Observability       | 2/5   | Good logging, missing metrics                     |

**Overall AI Service Risk: 2/5 (HIGH)**

## Remediation Plan

### Immediate (Critical - Fix Before Production)

1. **Remove API key fallback** - Fail fast if missing
2. **Implement prompt sanitization** - Escape and validate all user input
3. **Add response schema validation** - Use Zod for all AI responses
4. **Fix error information disclosure** - Sanitize external error messages
5. **Add input content validation** - Whitelist subjects, length limits

### Short-term (High Priority - Within 1 Week)

1. **Implement circuit breaker** - Prevent cascading failures
2. **Add rate limiting** - Strict limits on AI endpoints
3. **Implement token counting** - Track and limit usage
4. **Add content filtering** - Input/output safety checks
5. **Standardize structured output** - Consistent schema usage

### Medium-term (Standard - Within 1 Month)

1. **Implement proper secret management** - Vault integration
2. **Add AI provider abstraction** - Interface-based design
3. **Implement cost controls** - Usage quotas and monitoring
4. **Add comprehensive observability** - Metrics, tracing, alerts
5. **Implement fallback mechanisms** - Graceful degradation

## Testing Requirements

### Security Tests

- Prompt injection attempts
- Malformed input handling
- API key security validation
- Error information disclosure tests

### Reliability Tests

- AI API failure scenarios
- Circuit breaker functionality
- Retry logic validation
- Rate limiting effectiveness

### Performance Tests

- Token usage validation
- Response time benchmarks
- Concurrent request handling
- Resource usage monitoring

## Production Readiness Checklist

- [ ] API keys properly managed (no fallbacks)
- [ ] Prompt injection protection implemented
- [ ] Response schema validation active
- [ ] Error messages sanitized
- [ ] Input content validation enforced
- [ ] Rate limiting configured
- [ ] Circuit breaker implemented
- [ ] Token counting and limits active
- [ ] Security tests passing
- [ ] Reliability tests completed

**Status: NOT PRODUCTION READY**

This AI service integration requires immediate security fixes, particularly around prompt injection and API key management, before production deployment. The vulnerabilities pose significant security and reliability risks.

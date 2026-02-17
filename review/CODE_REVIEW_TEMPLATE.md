# Code Review Template (Production-Grade)

## Summary
- What was changed and why? (1-2 sentences)

## Context
- Where in the system does this live? Which module/service? What problem does it solve?

## Design and Architecture
- SRP and modularity
- Boundaries and contracts (data shapes, error types, side effects)
- Coupling and extensibility
- API surface and stability

## Naming and Readability
- Domain-aligned names
- Ownership and clear responsibilities
- Readability and complexity

## Error Handling and Resilience
- Error propagation and typing
- Retries, backoff, idempotency
- Timeouts, cancellation, and resource cleanup
- User-facing vs internal errors

## Observability
- Structured logging and correlation IDs
- Metrics and dashboards
- Tracing across boundaries

## Data and Persistence
- Data contracts and migrations
- Validation and sanitization at boundaries
- DB access patterns and indices
- Transactions and consistency models

## Performance and Scalability
- Algorithms and complexity
- Caching and invalidation
- Streaming vs buffering / memory usage
- Concurrency safety

## Security and Compliance
- Input validation and sanitization
- Secrets management
- Access control and least privilege
- Data privacy

## Testing and Reliability
- Unit/integration/end-to-end coverage
- Determinism and flaky tests
- Test doubles and mocks
- CI/CD reliability

## Deployment and Operations
- Feature flags and canaries
- Rollback plans and health checks
- Configuration management

## Maintenance and Future Cost
- Technical debt signals
- Onboarding cost and learnability
- Roadmap alignment

## Risk Scorecard
- Design:  /5
- Naming/Abstractions: /5
- Error handling: /5
- Observability: /5
- Data/Persistence: /5
- Performance/Scalability: /5
- Security/Compliance: /5
- Testing/CI: /5
- Deployment/Operations: /5
- Maintenance: /5

## Remediation Plan
- High priority:
- Medium priority:
- Low priority:

## Follow-up
- What to re-check and when

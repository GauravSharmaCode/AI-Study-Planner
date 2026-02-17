# Production-Grade Code Review Guide

This guide outlines a practical, repeatable approach to reviewing code destined for production systems. It emphasizes identifying risks early, ensuring maintainability, and producing actionable remediation plans.

## How to use
- Treat this as a lightweight QA pass that supplements automated tests.
- Start with the critical paths and primary interfaces before touching incidental code.
- Produce concrete, testable remediation steps with priority and tradeoffs.

## Review phases
- Design and architecture: SRP, boundaries, and extensibility.
- Naming and readability: domain-aligned terminology, clear ownership.
- Error handling and resilience: error types, propagation, retries, timeouts, idempotency.
- Observability: structured logs, correlation IDs, metrics, traces.
- Data modeling and persistence: contracts, migrations, validation.
- Performance and scalability: algorithms, memory, caching, backpressure.
- Security and compliance: input validation, secrets, access control.
- Testing and reliability: coverage, determinism, CI reliability, flaky tests.
- Deployment and operations: feature flags, canaries, rollback, health checks.
- Maintenance and future cost: debt signals, onboarding, roadmap fit.

## Risk scoring
- Use a 1-5 scale for each dimension. 1 = low risk, 5 = critical risk.
- Provide a short justification and concrete remediation suggestion.

## Deliverables
- A remediation backlog with high/medium/low priorities.
- A lightweight, PR-facing review checklist.
- A template for follow-up reviews and re-scans.

## Quick-start checklist (per review)
- [ ] Design: SRP, contracts, boundaries
- [ ] API: naming, surface area, stability
- [ ] Errors: types, propagation, user-visible messages
- [ ] Observability: logs, correlation IDs, metrics
- [ ] Data: contracts, migrations, validation
- [ ] Performance: hotspots, N+1, caching
- [ ] Security: input validation, secrets, auth
- [ ] Tests: coverage, determinism, CI
- [ ] Deployment: flags, rollback, health checks
- [ ] Maintenance: debt signals, onboarding, docs

## Example output format
- Critical path: Payment flow from UI to gateway
- Risk score: X/5 (Reason)
- Remediation: ...
- Validation plan: unit/integration/chaos tests

This guide should be lightweight enough to apply repeatedly and thorough enough to catch common production pitfalls.

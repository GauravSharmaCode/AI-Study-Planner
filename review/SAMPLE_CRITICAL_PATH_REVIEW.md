# Sample Critical Path Review: Payment Processing

Context: Review the end-to-end payment processing path from UI submission to settlement gateway.

1) Scope
- Entry: API Gateway / UI handler
- Core path: Validation -> Idempotency -> Payment gateway call -> Receipt/Confirmation
- SLO targets: 99.9% success, latency budget < 300ms for 95th percentile (mocked in CI)

2) Observability and contracts
- Ensure correlation IDs propagate through all steps
- Structured logs with request_id, user_id, amount, currency, status
- Error codes distinguishable (invalid_data, timeout, gateway_error, insufficient_funds)

3) Design issues to probe
- Idempotency: Are writes protected against duplicates? Is idempotency key enforced?
- Retries: Exponential backoff with jitter; avoid duplicate charges
- Timeouts: Time-bound gateway calls; cancellation safety
- Data mutation: Are account balances updated atomically? Use distributed transaction or compensating actions?
- Secrets: Are API keys for gateway stored securely and rotated?

4) Potential red flags
- Non-idempotent gateway calls without dedupe
- Silent retries causing double charges
- Missing feature flags to roll back
- Tight coupling to gateway SDK

5) Remediation plan (example)
- Add idempotency keys for every payment request
- Implement gateway call with timeout and circuit-breaker
- Introduce a saga/compensation for partial failures
- Centralize gateway credentials with vault and rotation policy

6) Tests to add
- Unit: idempotency key handling
- Integration: gateway failure modes (timeout, 500 errors)
- End-to-end: successful payment, duplicate submission, rollback on failure
- Chaos testing: simulate gateway outages

7) Risk score snapshot
- Overall: High (4-5) due to financial impact and external dependency


---
description: Generate feature specification from natural language description (AI Study Planner adapted)
est_time: 5-10 min
stage: Specification
handoffs:
  - label: Clarify Requirements
    agent: speckit.clarify
    prompt: Clarify specification requirements
    send: true
  - label: Create Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec
    send: false
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Context

Project: AI Study Planner - Microservices app with TypeScript, Express, Prisma, PostgreSQL, Google Gemini AI

**Architecture**:
- User Service (3001) - Auth & user management
- AI Schedule Service (3002) - Study plan generation
- NGINX Gateway (8080) - Reverse proxy
- PostgreSQL (5432, 5433) - Dedicated DBs per service
- Redis (6379) - Caching, BullMQ queues

**Constitution**: `.specify/memory/constitution.md` (if exists)

## Execution Steps

### 1. Generate Branch Name

Extract 2-4 word short name from feature description:
- Action-noun format: `add-user-auth`, `fix-payment-bug`
- Preserve acronyms: `oauth2`, `jwt`, `api`
- Examples:
  - "Add email notifications" → `email-notifications`
  - "Implement JWT refresh tokens" → `jwt-refresh-tokens`

### 2. Check Existing Branches

```bash
git fetch --all --prune
```

Find highest number for short-name across:
- Remote: `git ls-remote --heads origin | grep -E 'refs/heads/[0-9]+-<short-name>$'`
- Local: `git branch | grep -E '^[* ]*[0-9]+-<short-name>$'`
- Specs dir: `specs/[0-9]+-<short-name>`

Use N+1 for new branch number. Start with 1 if none exist.

### 3. Create Feature Branch

Check if `.specify/scripts/bash/create-new-feature.sh` exists:

**If exists**: Run with `--json --number N --short-name "name" "description"`

**If not exists**: Create branch manually:
```bash
git checkout -b N-short-name
mkdir -p specs/N-short-name
```

Set `SPEC_FILE=specs/N-short-name/spec.md`

### 4. Load Spec Template

Check for template in priority order:
1. `.qwen/templates/spec-template.md`
2. `.specify/templates/spec-template.md`
3. Use default structure below

### 5. Generate Specification

**Mandatory Sections**:

```markdown
# Feature: [Feature Name]

## Overview
[2-3 sentence description of user value]

## User Scenarios
- As a [user type], I want to [action] so that [benefit]

## Functional Requirements
- FR-1: [Testable requirement with clear success condition]
- FR-2: [Testable requirement with clear success condition]

## Non-Functional Requirements
- NFR-1: [Measurable quality attribute, e.g., "Support 1000 concurrent users"]
- NFR-2: [Measurable quality attribute]

## Success Criteria
- [Measurable outcome, e.g., "Users complete study session setup in <2 minutes"]
- [Measurable outcome]

## Edge Cases
- [Edge case scenario and expected behavior]

## Assumptions
- [Documented assumption]
```

**Generation Rules**:
- **WHAT not HOW**: No frameworks, APIs, databases, code structure
- **Make informed guesses**: Use industry standards for defaults
- **Max 3 `[NEEDS CLARIFICATION]` markers**: Only for critical decisions
- **Prioritize**: scope > security/privacy > UX > technical details

**AI Study Planner Specific**:
- Respect microservices boundaries (no cross-service coupling)
- Consider async operations (BullMQ queues)
- Account for AI latency (Google Gemini)
- Plan for containerization (Docker)

### 6. Quality Validation

Create `FEATURE_DIR/checklists/requirements.md`:

```markdown
# Specification Quality: [Feature Name]

**Created**: [DATE]
**Feature**: [spec.md path]

## Content Quality
- [ ] No implementation details (frameworks, APIs, databases)
- [ ] Focused on user value
- [ ] All mandatory sections completed

## Requirement Quality
- [ ] No [NEEDS CLARIFICATION] markers remain (or max 3)
- [ ] Requirements are testable
- [ ] Success criteria are measurable
- [ ] Edge cases identified

## Feature Readiness
- [ ] User scenarios cover primary flows
- [ ] Requirements align with success criteria
```

**Validation**:
- Review spec against each checklist item
- If items fail: Update spec (max 3 iterations)
- If `[NEEDS CLARIFICATION]` remains: Proceed to step 7

### 7. Handle Clarifications (if needed)

For each `[NEEDS CLARIFICATION: question]` (max 3):

```markdown
## Question [N]: [Topic]

**Context**: [Quote spec section]

**Question**: [Specific question]

**Recommended**: [Your suggestion with 1-sentence reasoning]

| Option | Answer | Implications |
|--------|--------|--------------|
| A | [Answer A] | [Implication] |
| B | [Answer B] | [Implication] |
| C | [Answer C] | [Implication] |
| Short | Custom answer | Provide your own |

**Your choice**: _[Wait for response]_
```

Present all questions together. Wait for user response (e.g., "Q1: A, Q2: B").

Update spec: Replace `[NEEDS CLARIFICATION]` with chosen answer.

### 8. Write Specification

```markdown
specs/N-short-name/spec.md
```

Preserve template structure. Replace placeholders with concrete details.

### 9. Update Checklist

Mark pass/fail for each validation item. Add notes for any remaining issues.

### 10. Report Completion

```text
✅ Specification created

Branch: N-short-name
Spec: specs/N-short-name/spec.md
Checklist: specs/N-short-name/checklists/requirements.md

Clarifications: [N resolved / M remaining]
Quality Status: [PASS / NEEDS REVIEW]

Next steps:
- /qwen:clarify (if clarifications remain)
- /qwen:plan (to create technical plan)
```

## Guidelines

### Reasonable Defaults (Don't Ask)

- Authentication: JWT sessions for User Service
- Data retention: 90 days for study plans (configurable)
- Performance: <500ms API response (p95)
- Error handling: User-friendly messages with fallbacks
- Integration: RESTful HTTP via NGINX gateway

### Success Criteria Examples

**Good** (measurable, user-focused):
- "Users create study plan in under 3 minutes"
- "System generates AI schedule in <30 seconds"
- "95% of users complete onboarding without errors"

**Bad** (implementation-focused):
- "API response time <200ms" (too technical)
- "Redis cache hit rate >80%" (technology-specific)
- "Prisma queries optimized" (implementation detail)

### Constitution Alignment

If `.specify/memory/constitution.md` exists:
- Validate spec against all MUST principles
- Flag violations as `[NEEDS CLARIFICATION]`
- Do not dilute principles - adjust spec instead

## Context

$ARGUMENTS

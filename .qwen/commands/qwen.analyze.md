---
description: Cross-artifact consistency analysis for spec, plan, and tasks (AI Study Planner adapted)
est_time: 5-7 min
stage: Quality Gate
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Identify inconsistencies, duplications, ambiguities, and gaps across `spec.md`, `plan.md`, and `tasks.md` before implementation.

**Run AFTER** `/qwen:tasks` has produced complete `tasks.md`.

**Read-only**: Do NOT modify files. Output structured analysis report.

## Execution Steps

### 1. Initialize Analysis Context

Run from repo root:
```bash
if [ -f ".specify/scripts/bash/check-prerequisites.sh" ]; then
  .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
else
  echo "Manual check: Ensure spec.md, plan.md, tasks.md exist"
fi
```

Parse JSON for:
- `FEATURE_DIR`
- `AVAILABLE_DOCS`

Derive paths:
- `SPEC = FEATURE_DIR/spec.md`
- `PLAN = FEATURE_DIR/plan.md`
- `TASKS = FEATURE_DIR/tasks.md`
- `CONSTITUTION = .specify/memory/constitution.md` (if exists)

**Abort** if any required file missing:
- "Run `/qwen:specify`" (if spec.md missing)
- "Run `/qwen:plan`" (if plan.md missing)
- "Run `/qwen:tasks`" (if tasks.md missing)

### 2. Load Artifacts (Progressive Disclosure)

**From spec.md**:
- Overview/Context
- Functional Requirements (FR-1, FR-2, ...)
- Non-Functional Requirements (NFR-1, NFR-2, ...)
- User Stories
- Edge Cases

**From plan.md**:
- Architecture/stack choices
- Data Model
- API Contracts
- Phases
- Technical constraints

**From tasks.md**:
- Task IDs (T001, T002, ...)
- Descriptions with file paths
- Phase grouping
- Parallel markers `[P]`
- Story labels `[US1]`, `[US2]`, ...

**From constitution** (if exists):
- Principle names
- MUST/SHOULD normative statements

### 3. Build Semantic Models

Create internal representations (don't output raw content):

**Requirements Inventory**:
```typescript
interface Requirement {
  id: string;        // FR-1, NFR-2
  type: 'functional' | 'non-functional';
  text: string;
  location: string;  // spec.md:L120-134
  slug: string;      // user-can-create-plan
}
```

**User Story Inventory**:
```typescript
interface UserStory {
  id: string;        // US1, US2
  priority: string;  // P1, P2, P3
  text: string;
  acceptanceCriteria: string[];
  location: string;
}
```

**Task Coverage Mapping**:
```typescript
interface Task {
  id: string;        // T001
  description: string;
  filePath: string;
  phase: string;     // Setup, US1, Polish
  parallel: boolean; // [P] marker
  story?: string;    // [US1] label
  mappedRequirements: string[]; // ['FR-1', 'FR-3']
}
```

**Constitution Rule Set**:
```typescript
interface Principle {
  name: string;
  type: 'MUST' | 'SHOULD';
  statement: string;
}
```

### 4. Detection Passes

**Limit**: Max 50 findings total. Aggregate remainder in overflow summary.

#### A. Duplication Detection

**Find**:
- Near-duplicate requirements (same intent, different wording)
- Duplicate tasks (same file, same action)

**Example**:
```
ID: D1
Category: Duplication
Severity: MEDIUM
Location: spec.md:L45-50, spec.md:L78-82
Summary: Two similar requirements for user authentication
Recommendation: Merge phrasing; keep clearer version
```

#### B. Ambiguity Detection

**Find**:
- Vague adjectives without metrics: "fast", "scalable", "secure", "intuitive", "robust"
- Unresolved placeholders: `TODO`, `TKTK`, `???`, `<placeholder>`

**Example**:
```
ID: A1
Category: Ambiguity
Severity: HIGH
Location: spec.md:NFR-2
Summary: "System should be fast" lacks measurable criteria
Recommendation: Define specific latency target (e.g., "<500ms p95")
```

#### C. Underspecification

**Find**:
- Requirements with verbs but missing object/outcome
- User stories missing acceptance criteria
- Tasks referencing undefined files/components

**Example**:
```
ID: U1
Category: Underspecification
Severity: HIGH
Location: spec.md:FR-5
Summary: "System sends notifications" - missing channel, timing, content
Recommendation: Specify notification channel (email/SMS), trigger event, and content template
```

#### D. Constitution Alignment

**Find**:
- Requirements/plan elements conflicting with MUST principles
- Missing mandated sections/quality gates

**AI Study Planner Constitution Checks**:
- Schema-first design (Zod schemas present?)
- Service decoupling (no cross-service imports?)
- TypeScript strict mode (enabled in tsconfig?)
- Logging standards (no console.*, using logger?)
- Containerization (Docker config present?)

**Example**:
```
ID: C1
Category: Constitution Alignment
Severity: CRITICAL
Location: plan.md:Architecture
Summary: Plan proposes direct database access from frontend (violates service decoupling)
Recommendation: Route all requests through NGINX gateway to backend services
```

#### E. Coverage Gaps

**Find**:
- Requirements with zero associated tasks
- Tasks with no mapped requirement/story
- Non-functional requirements not reflected in tasks

**Example**:
```
ID: G1
Category: Coverage Gap
Severity: HIGH
Location: spec.md:NFR-3, tasks.md:(none)
Summary: Performance requirement "Support 1000 concurrent users" has no implementation tasks
Recommendation: Add load testing, caching, and optimization tasks
```

#### F. Inconsistency

**Find**:
- Terminology drift (same concept named differently)
- Data entities in plan but absent in spec (or vice versa)
- Task ordering contradictions (integration before setup)
- Conflicting requirements (Next.js vs Vue)

**Example**:
```
ID: I1
Category: Inconsistency
Severity: MEDIUM
Location: spec.md:FR-2, plan.md:DataModel
Summary: Spec uses "StudyPlan", plan uses "LearningPlan" for same entity
Recommendation: Standardize on "StudyPlan" across all artifacts
```

### 5. Severity Assignment

| Severity | Criteria | Action |
|----------|----------|--------|
| **CRITICAL** | Constitution MUST violation, missing core artifact, blocking functionality | **Must resolve before implementation** |
| **HIGH** | Duplicate/conflicting requirements, ambiguous security/performance, untestable criteria | **Should resolve before implementation** |
| **MEDIUM** | Terminology drift, missing NFR task coverage, underspecified edge case | **Resolve during implementation** |
| **LOW** | Style/wording improvements, minor redundancy | **Optional fixes** |

### 6. Produce Analysis Report

```markdown
# Specification Analysis Report

**Feature**: [Feature name]
**Date**: [DATE]
**Analyzer**: /qwen:analyze

## Summary

| Metric | Count |
|--------|-------|
| Total Requirements | N |
| Total Tasks | M |
| Coverage % | X% (requirements with ≥1 task) |
| Ambiguity Count | N |
| Duplication Count | N |
| Critical Issues | N |

---

## Findings

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | Constitution | CRITICAL | plan.md:L45-60 | Direct DB access proposed | Use NGINX gateway routing |
| G1 | Coverage Gap | HIGH | spec.md:NFR-3 | No perf testing tasks | Add load testing tasks |
| A1 | Ambiguity | HIGH | spec.md:NFR-2 | "Fast" lacks metrics | Define "<500ms p95" |
| I1 | Inconsistency | MEDIUM | spec.md:FR-2, plan.md:DataModel | "StudyPlan" vs "LearningPlan" | Standardize terminology |
| D1 | Duplication | MEDIUM | spec.md:L45-50, L78-82 | Duplicate auth requirements | Merge phrasing |

*(Showing 5 of N findings. See overflow summary below if N > 50)*

---

## Coverage Summary

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-1 | ✅ | T017, T019, T020 | Fully covered |
| FR-2 | ✅ | T021, T022 | Covered |
| FR-3 | ❌ | (none) | **Gap: No implementation tasks** |
| NFR-1 | ✅ | T045 | Load testing task present |
| NFR-2 | ⚠️ | T046 | **Ambiguous: "fast" not quantified** |
| NFR-3 | ❌ | (none) | **Gap: No perf tasks** |

---

## Constitution Alignment Issues

| Principle | Status | Evidence |
|-----------|--------|----------|
| Schema-First Design | ✅ | Zod schemas in src/schemas/ |
| Service Decoupling | ❌ | plan.md proposes direct DB access |
| TypeScript Strict | ✅ | tsconfig.json has strict: true |
| Logging Standards | ✅ | neat-logger in controllers |
| Containerization | ✅ | docker-compose.yml present |

---

## Unmapped Tasks

| Task ID | Description | Issue |
|---------|-------------|-------|
| T050 | Update documentation | No mapped requirement |
| T051 | Refactor logger utility | No mapped requirement |

---

## Overflow Summary

*(If findings > 50)*

Additional findings not shown:
- N findings with LOW severity
- M findings with MEDIUM severity

**Recommendation**: Address CRITICAL and HIGH findings first. Review LOW/MEDIUM findings during implementation.

---

## Next Actions

### Before Implementation (CRITICAL/HIGH)

1. **C1**: Fix constitution violation in plan.md
2. **G1**: Add performance testing tasks to tasks.md
3. **A1**: Clarify "fast" with specific metrics in spec.md

### During Implementation (MEDIUM)

4. **I1**: Standardize terminology across artifacts
5. **D1**: Merge duplicate requirements in spec.md

### Optional (LOW)

6. Style improvements in spec.md

---

## Recommended Commands

```bash
# Fix spec ambiguities
/qwen:clarify

# Update plan to fix constitution violation
/qwen:plan

# Regenerate tasks with coverage gaps filled
/qwen:tasks

# Re-run analysis after fixes
/qwen:analyze
```
```

### 7. Offer Remediation

At end of report:

```text
Would you like me to suggest concrete remediation edits for the top N issues?

- /qwen:clarify (fix spec ambiguities)
- /qwen:plan (fix architecture issues)
- /qwen:tasks (add missing coverage)
```

**Do NOT apply edits automatically**. User must explicitly approve follow-up commands.

### 8. Operating Principles

**Context Efficiency**:
- Minimal high-signal tokens (focus on actionable findings)
- Progressive disclosure (load artifacts incrementally)
- Token-efficient output (limit 50 findings, summarize overflow)
- Deterministic results (rerunning produces consistent IDs/counts)

**Analysis Guidelines**:
- **NEVER modify files** (read-only analysis)
- **NEVER hallucinate missing sections** (report accurately if absent)
- **Prioritize constitution violations** (always CRITICAL)
- **Use examples over generic patterns** (cite specific instances)
- **Report zero issues gracefully** (emit success report with stats)

## AI Study Planner Specific Checks

### Microservice Boundaries

- ✅ Each service has own database (no shared DB)
- ✅ No cross-service imports (HTTP via NGINX only)
- ✅ Service-specific Prisma schemas
- ✅ Independent deployment per service

### API Contracts

- ✅ Zod schemas in `src/schemas/index.ts` per service
- ✅ Request/response validation in controllers
- ✅ Error handling middleware present
- ✅ Health check endpoints (`/health`)

### Data Consistency

- ✅ Eventual consistency documented (if applicable)
- ✅ Cache invalidation strategy specified
- ✅ Transaction boundaries defined

### Testing

- ✅ Jest configuration present
- ✅ Mock external dependencies (DB, AI, Redis)
- ✅ Integration tests with supertest
- ✅ Docker containers for test isolation

## Context

$ARGUMENTS

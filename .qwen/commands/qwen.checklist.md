---
description: Create "unit tests for requirements" checklist (AI Study Planner adapted)
est_time: 2-4 min
stage: Quality Gate
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Generate checklist that validates **requirements quality**, NOT implementation correctness.

**Metaphor**: If spec is code written in English, checklist is its unit test suite.

## Execution Steps

### 1. Check Prerequisites

Run from repo root:
```bash
if [ -f ".specify/scripts/bash/check-prerequisites.sh" ]; then
  .specify/scripts/bash/check-prerequisites.sh --json
else
  echo "Manual: Ensure spec.md exists"
fi
```

Parse:
- `FEATURE_DIR` - Feature directory
- `AVAILABLE_DOCS` - List of available artifacts
- `SPEC_FILE` - Path to spec.md

**Abort** if `spec.md` missing: "Run `/qwen:specify` first"

### 2. Clarify Intent (Dynamic)

Derive up to 3 contextual questions from user input + spec signals:

**Extract Signals**:
- Feature domain: auth, latency, UX, API, AI/ML
- Risk indicators: "critical", "must", "compliance", "security"
- Stakeholder hints: "QA", "review", "security team"
- Explicit deliverables: "a11y", "rollback", "contracts"

**Generate Questions** (if ambiguous):

```markdown
## Clarification 1: Scope

Should this checklist focus on:
- **A)** API contract correctness only
- **B)** End-to-end user journey
- **C)** Security and compliance gates
- **Short**: Custom focus (<=5 words)

## Clarification 2: Depth

Is this a:
- **A)** Lightweight pre-commit sanity list (5-10 items)
- **B)** Standard PR review checklist (15-25 items)
- **C)** Formal release gate (30+ items)
- **Short**: Custom depth

## Clarification 3: Audience

Primary users:
- **A)** Author (self-check before PR)
- **B)** Reviewers (PR review process)
- **C)** QA team (formal testing)
- **Short**: Custom audience
```

**Skip** questions if already clear from `$ARGUMENTS`.

**Defaults** (if no response):
- Depth: Standard (15-25 items)
- Audience: Reviewer (PR)
- Focus: Top 2 relevance clusters

### 3. Load Feature Context

**Read from `FEATURE_DIR`**:

**spec.md** (required):
- Functional requirements
- Non-functional requirements
- User stories
- Edge cases

**plan.md** (if exists):
- Architecture decisions
- Data model
- Technical constraints

**tasks.md** (if exists):
- Implementation tasks
- Test strategy

**Context Loading Strategy**:
- Load only relevant sections (progressive disclosure)
- Summarize long sections into bullets
- Don't dump full file content

### 4. Generate Checklist

**Create `FEATURE_DIR/checklists/`** if not exists.

**Filename**: `[domain].md` based on focus area:
- `ux.md` - User experience requirements
- `api.md` - API contract requirements
- `security.md` - Security requirements
- `performance.md` - Performance requirements
- `accessibility.md` - Accessibility requirements
- `test.md` - Testing strategy requirements

**If file exists**: Append to existing content (don't overwrite).

### 5. Checklist Structure

```markdown
# [Domain] Requirements Checklist: [Feature Name]

**Purpose**: Validate requirements quality for [domain]
**Created**: [DATE]
**Feature**: [spec.md path]
**Focus**: [Selected focus areas]
**Depth**: [Standard/Lightweight/Formal]
**Audience**: [Author/Reviewer/QA]

---

## Requirement Completeness

- [ ] CHK001 - Are [requirement type] defined for [scenario]? [Completeness, Spec §FR-X]
- [ ] CHK002 - Are error handling requirements specified for all failure modes? [Completeness, Gap]

## Requirement Clarity

- [ ] CHK003 - Is '[vague term]' quantified with specific metrics? [Clarity, Spec §NFR-X]
- [ ] CHK004 - Are success criteria measurable without implementation details? [Clarity]

## Requirement Consistency

- [ ] CHK005 - Do [requirement A] align with [requirement B]? [Consistency, Spec §FR-X vs §FR-Y]

## Acceptance Criteria Quality

- [ ] CHK006 - Can [acceptance criterion] be objectively verified? [Measurability, Spec §AC-X]

## Scenario Coverage

- [ ] CHK007 - Are [scenario type] requirements defined? [Coverage, Gap]
- [ ] CHK008 - Are concurrent user interactions addressed? [Coverage]

## Edge Case Coverage

- [ ] CHK009 - Is fallback behavior defined for [edge case]? [Edge Case, Gap]

## Non-Functional Requirements

- [ ] CHK010 - Are performance requirements quantified? [NFR, Spec §NFR-X]
- [ ] CHK011 - Are security requirements aligned with threat model? [Security, Gap]

## Dependencies & Assumptions

- [ ] CHK012 - Are external dependencies documented? [Dependency, Spec §Assumptions]
- [ ] CHK013 - Is the assumption of [assumption] validated? [Assumption]

## Notes

- [Any notes, unresolved items, or references]
```

### 6. Checklist Item Rules

**CORRECT** (Testing requirements quality):
- ✅ "Are visual hierarchy requirements defined with measurable criteria? [Clarity, Spec §FR-1]"
- ✅ "Is 'fast loading' quantified with specific timing thresholds? [Clarity, Spec §NFR-2]"
- ✅ "Are error handling requirements specified for all API failure modes? [Completeness, Gap]"
- ✅ "Do navigation requirements align across all pages? [Consistency, Spec §FR-10 vs §FR-10a]"
- ✅ "Is fallback behavior defined when logo image fails to load? [Edge Case, Gap]"

**INCORRECT** (Testing implementation):
- ❌ "Verify landing page displays 3 episode cards"
- ❌ "Test hover states work correctly on desktop"
- ❌ "Confirm API returns 200 status"
- ❌ "Check that error handling works"

**Item Structure**:
```text
- [ ] CHK### - [Question about requirement quality]? [Dimension, Reference]
```

**Dimensions**:
- Completeness - Are all requirements present?
- Clarity - Are requirements unambiguous?
- Consistency - Do requirements align?
- Measurability - Can requirements be verified?
- Coverage - Are all scenarios addressed?

**References**:
- `[Spec §FR-X]` - Functional requirement X
- `[Spec §NFR-X]` - Non-functional requirement X
- `[Gap]` - Missing requirement
- `[Ambiguity]` - Vague term needs clarification
- `[Conflict]` - Conflicting requirements
- `[Assumption]` - Documented assumption

### 7. AI Study Planner Specific Checklists

#### API Requirements (`api.md`)

```markdown
## API Requirements Quality

- [ ] CHK001 - Are error response formats specified for all failure modes? [Completeness]
- [ ] CHK002 - Are rate limiting requirements quantified with specific thresholds? [Clarity, Gap]
- [ ] CHK003 - Are authentication requirements consistent across all endpoints? [Consistency]
- [ ] CHK004 - Are retry/timeout requirements defined for external dependencies? [Coverage, Gap]
- [ ] CHK005 - Is API versioning strategy documented? [Gap]
- [ ] CHK006 - Are request/response schemas defined for all endpoints? [Completeness, Spec §API]
- [ ] CHK007 - Is pagination specified for list endpoints? [Coverage, Spec §API]
- [ ] CHK008 - Are idempotency requirements defined for mutation operations? [Gap]
```

#### Security Requirements (`security.md`)

```markdown
## Security Requirements Quality

- [ ] CHK001 - Are authentication requirements specified for all protected resources? [Coverage]
- [ ] CHK002 - Are data protection requirements defined for sensitive information? [Completeness]
- [ ] CHK003 - Is the threat model documented and requirements aligned? [Traceability, Gap]
- [ ] CHK004 - Are security failure/breach response requirements defined? [Exception Flow, Gap]
- [ ] CHK005 - Are JWT expiration and refresh requirements quantified? [Clarity, Spec §Auth]
- [ ] CHK006 - Is input sanitization required for all user inputs? [Consistency]
- [ ] CHK007 - Are CORS policies specified for cross-origin requests? [Coverage, Gap]
- [ ] CHK008 - Is password hashing algorithm and cost factor specified? [Clarity, Spec §Auth]
```

#### Performance Requirements (`performance.md`)

```markdown
## Performance Requirements Quality

- [ ] CHK001 - Are performance requirements quantified with specific metrics? [Clarity]
- [ ] CHK002 - Are performance targets defined for all critical user journeys? [Coverage]
- [ ] CHK003 - Are performance requirements under different load conditions specified? [Completeness]
- [ ] CHK004 - Can performance requirements be objectively measured? [Measurability]
- [ ] CHK005 - Are degradation requirements defined for high-load scenarios? [Edge Case, Gap]
- [ ] CHK006 - Is caching strategy specified with TTL values? [Clarity, Gap]
- [ ] CHK007 - Are database query performance requirements defined? [Coverage, Spec §NFR]
- [ ] CHK008 - Is AI response timeout specified with fallback behavior? [Edge Case, Spec §AI]
```

#### UX Requirements (`ux.md`)

```markdown
## UX Requirements Quality

- [ ] CHK001 - Are visual hierarchy requirements defined with measurable criteria? [Clarity, Spec §FR-1]
- [ ] CHK002 - Is the number and positioning of UI elements explicitly specified? [Completeness, Spec §FR-1]
- [ ] CHK003 - Are interaction state requirements (hover, focus, active) consistently defined? [Consistency]
- [ ] CHK004 - Are accessibility requirements specified for all interactive elements? [Coverage, Gap]
- [ ] CHK005 - Is fallback behavior defined when images fail to load? [Edge Case, Gap]
- [ ] CHK006 - Are loading state requirements defined for asynchronous operations? [Completeness, Gap]
- [ ] CHK007 - Can "prominent display" be objectively measured? [Measurability, Spec §FR-4]
- [ ] CHK008 - Are mobile breakpoint requirements defined for responsive layouts? [Coverage, Gap]
```

### 8. Traceability Requirements

**Minimum 80%** of items MUST include traceability:

- Reference spec section: `[Spec §X.Y]`
- Gap marker: `[Gap]`
- Ambiguity: `[Ambiguity]`
- Conflict: `[Conflict]`
- Assumption: `[Assumption]`

**If no ID system exists**:
- [ ] CHK001 - Is a requirement & acceptance criteria ID scheme established? [Traceability, Gap]

### 9. Content Consolidation

**Soft cap**: If raw candidate items > 40:
- Prioritize by risk/impact
- Merge near-duplicates
- If >5 low-impact edge cases: Create one item: "Are edge cases X, Y, Z addressed? [Coverage]"

### 10. Write Checklist File

```markdown
specs/N-feature/checklists/[domain].md
```

Preserve template structure:
- H1 title
- Meta section (purpose, created, feature, focus, depth, audience)
- Category sections with `##` headings
- Checklist items with globally incrementing IDs (CHK001, CHK002, ...)

### 11. Report Completion

```text
✅ Checklist created

Path: [FEATURE_DIR/checklists/[domain].md]
Items: N checklist items

## Summary

Focus areas: [Selected focus areas]
Depth: [Standard/Lightweight/Formal]
Audience: [Author/Reviewer/QA]
Explicit must-haves: [User-specified items]

## Breakdown

| Category | Item Count |
|----------|------------|
| Completeness | N |
| Clarity | N |
| Consistency | N |
| Coverage | N |
| Edge Cases | N |
| NFR | N |

Next steps:
- Review checklist items
- Run /qwen:analyze for cross-artifact consistency
- Proceed to /qwen:tasks or /qwen:implement
```

## Anti-Patterns (What NOT to Do)

**❌ WRONG** (Implementation testing):
```markdown
- [ ] Verify API returns 200 status
- [ ] Test error handling works
- [ ] Confirm button click navigates correctly
- [ ] Check database saves record
```

**✅ CORRECT** (Requirements quality):
```markdown
- [ ] Are success response codes specified for all endpoints? [Completeness]
- [ ] Are error handling requirements defined for all failure modes? [Coverage]
- [ ] Are navigation requirements clear for all clickable elements? [Clarity]
- [ ] Are data persistence requirements specified? [Completeness]
```

**Key Difference**:
- Wrong: "Does it work?" (implementation test)
- Correct: "Is it specified?" (requirements test)

## Context

$ARGUMENTS

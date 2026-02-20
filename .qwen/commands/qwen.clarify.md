---
description: Resolve spec ambiguities with max 5 targeted questions (AI Study Planner adapted)
est_time: 3-5 min
stage: Specification
handoffs:
  - label: Create Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Detect and resolve ambiguities in feature spec before technical planning. Record clarifications directly in spec file.

**Run BEFORE** `/qwen:plan`. Skip only for exploratory spikes (warn about rework risk).

## Execution Steps

### 1. Check Prerequisites

Run from repo root:
```bash
# Check if .specify script exists
if [ -f ".specify/scripts/bash/check-prerequisites.sh" ]; then
  .specify/scripts/bash/check-prerequisites.sh --json --paths-only
else
  # Fallback: manual check
  echo "Manual check: Ensure spec.md exists in current feature directory"
fi
```

For single quotes in args: Use `'"'"'` escape or double-quotes.

Set paths:
- `SPEC_FILE` - Current feature spec.md
- `FEATURE_DIR` - Parent directory of spec.md

**Abort** if spec.md missing: "Run `/qwen:specify` first"

### 2. Load Spec File

Read `SPEC_FILE`. Perform structured ambiguity scan:

**Taxonomy Categories**:

| Category | Check For | Status |
|----------|-----------|--------|
| **Functional Scope** | Core goals, out-of-scope, user roles | Clear/Partial/Missing |
| **Data Model** | Entities, relationships, uniqueness | Clear/Partial/Missing |
| **UX Flow** | User journeys, error states, loading | Clear/Partial/Missing |
| **Performance** | Latency, throughput targets | Clear/Partial/Missing |
| **Scalability** | Horizontal/vertical limits | Clear/Partial/Missing |
| **Reliability** | Uptime, recovery expectations | Clear/Partial/Missing |
| **Observability** | Logging, metrics, tracing | Clear/Partial/Missing |
| **Security** | AuthN/Z, data protection | Clear/Partial/Missing |
| **Integration** | External services, failure modes | Clear/Partial/Missing |
| **Edge Cases** | Negative scenarios, rate limiting | Clear/Partial/Missing |
| **Constraints** | Technical limits, tradeoffs | Clear/Partial/Missing |
| **Terminology** | Canonical terms, no synonyms | Clear/Partial/Missing |
| **Acceptance** | Testable criteria, DoD | Clear/Partial/Missing |

Mark each category: **Clear** (sufficient), **Partial** (needs work), **Missing** (absent)

### 3. Generate Question Queue

Create prioritized queue (max 5 questions) using:

**Priority Formula**: `(Impact × Uncertainty) / Effort`

**Impact Levels**:
- **Critical**: Blocks architecture, security, compliance
- **High**: Affects data modeling, major UX flows
- **Medium**: Influences task breakdown, testing strategy
- **Low**: Style, wording, minor implementation details

**Selection Rules**:
- Max 1 question per category (ensure breadth)
- Exclude answered questions (check `## Clarifications` section)
- Exclude questions answerable by industry standard
- Exclude plan-level execution details

**AI Study Planner Context**:
Prioritize clarifications for:
- Microservice boundaries (which service owns what)
- Async vs sync operations (BullMQ queues vs direct HTTP)
- AI interaction patterns (streaming vs batch)
- Data consistency requirements (eventual vs strong)

### 4. Sequential Questioning Loop

**Present ONE question at a time**:

#### Multiple-Choice Format:

```markdown
## Question [N]: [Topic]

**Context**: [Quote relevant spec section from §X.Y]

**What we need to know**: [Specific question]

**Recommended**: Option [X] - [1-2 sentence reasoning based on best practices]

| Option | Description |
|--------|-------------|
| A | [Clear, mutually exclusive option A] |
| B | [Clear, mutually exclusive option B] |
| C | [Clear, mutually exclusive option C] |
| Short | Provide different answer (<=5 words) |

**Your choice**: Reply with letter (A/B/C), "recommended", or custom answer
```

#### Short-Answer Format:

```markdown
## Question [N]: [Topic]

**Context**: [Quote relevant spec section]

**What we need to know**: [Specific question]

**Suggested**: [Your proposed answer] - [Brief reasoning]

**Your choice**: Reply with "suggested" or provide own answer (<=5 words)
```

**After User Response**:
- If "recommended"/"suggested": Use your recommendation
- If letter (A/B/C): Map to corresponding option
- If custom: Validate <=5 words, ask for clarification if ambiguous

**Record Answer**: Store in working memory (don't write to disk yet)

**Continue** to next question OR stop when:
- All critical ambiguities resolved
- User signals completion ("done", "good", "stop")
- 5 questions reached

### 5. Incremental Spec Updates

**After EACH accepted answer**:

1. **Ensure `## Clarifications` section exists**:
   - Create after Overview/Context section if missing
   - Add `### Session YYYY-MM-DD` subheading for today

2. **Append bullet**:
   ```markdown
   - Q: [question] → A: [final answer]
   ```

3. **Integrate into appropriate section**:

   | Answer Type | Update Location |
   |-------------|-----------------|
   | Functional | Functional Requirements |
   | User roles | User Stories / Actors |
   | Data entities | Data Model (add fields/types) |
   | Performance | Non-Functional Requirements |
   | Edge case | Edge Cases / Error Handling |
   | Terminology | Normalize across spec (add "formerly X" if needed) |

4. **Replace contradictory text**: Remove obsolete ambiguous statements

5. **Save spec file** (atomic overwrite after each integration)

**Example Integration**:

Before:
```markdown
## Functional Requirements
- FR-3: System sends notifications to users
```

After clarification "Email only, within 5 seconds":
```markdown
## Functional Requirements
- FR-3: System sends email notification to user within 5 seconds of trigger event
```

### 6. Validation

**After Each Write**:
- Clarifications section has exactly one bullet per answer
- No duplicate bullets
- Updated sections contain no lingering vague placeholders
- No contradictory earlier statements remain
- Markdown structure valid

**Final Pass**:
- Total asked questions ≤ 5
- Terminology consistent across all updated sections
- All `[NEEDS CLARIFICATION]` markers resolved (or explicitly deferred)

### 7. Write Updated Spec

Overwrite `SPEC_FILE` with integrated clarifications.

Preserve formatting:
- No reordering of unrelated sections
- Heading hierarchy intact
- Single blank line between sections
- No trailing whitespace

### 8. Report Completion

```text
✅ Clarifications session complete

Questions asked: N/5
Spec updated: [path]
Sections touched: [list names]

## Coverage Summary

| Category | Status |
|----------|--------|
| Functional Scope | Resolved |
| Data Model | Clear |
| Security | Deferred (better suited for planning) |
| Performance | Clear |
| Edge Cases | Outstanding (low impact) |

## Recommendations

[If CRITICAL/High remain]: Run `/qwen:clarify` again before `/qwen:plan`
[If all resolved]: Ready for `/qwen:plan`

Next command: /qwen:plan
```

## Behavior Rules

- **Max 5 questions total** (retries for same question don't count)
- **One question at a time** (never reveal future questions)
- **Respect early termination**: "stop", "done", "proceed" signals
- **No speculative tech questions**: Unless blocks functional clarity
- **If no ambiguities**: "No critical ambiguities detected. Proceed to `/qwen:plan`"
- **If spec missing**: "Run `/qwen:specify` first"

## AI Study Planner Specifics

**Common Clarification Topics**:

1. **Service Boundaries**:
   - "Should user authentication be in User Service or separate Auth Service?"
   - "Does AI schedule generation call external APIs directly or via gateway?"

2. **Data Consistency**:
   - "Should study plan updates be synchronous (immediate) or async (eventual consistency)?"
   - "What's the source of truth for session state?"

3. **AI Integration**:
   - "Should Gemini AI calls be streaming or batch?"
   - "What's the fallback if AI service times out?"

4. **Caching Strategy**:
   - "Should user profiles be cached in Redis? For how long?"
   - "What invalidates the cache?"

## Context

$ARGUMENTS

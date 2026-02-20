---
description: Create/update project constitution from principle inputs (AI Study Planner adapted)
est_time: 5-10 min
stage: Governance
handoffs:
  - label: Build Specification
    agent: speckit.specify
    prompt: Implement feature based on updated constitution
    send: false
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Create or update project constitution at `.specify/memory/constitution.md`. Propagate amendments to dependent templates.

**Note**: Constitution is a TEMPLATE with placeholder tokens (`[PROJECT_NAME]`, `[PRINCIPLE_1_NAME]`). Your job: (a) collect/derive concrete values, (b) fill template precisely, (c) propagate amendments.

## Execution Steps

### 1. Load Existing Constitution

Check if `.specify/memory/constitution.md` exists.

**If not exists**:
- Copy from `.specify/templates/constitution-template.md` (if exists)
- Or create from scratch using structure below

**If exists**:
- Read current content
- Identify all placeholder tokens: `[ALL_CAPS_IDENTIFIER]`

### 2. Collect/Derive Placeholder Values

**From User Input** (conversation):
- Use values explicitly supplied by user

**From Repo Context**:
- `PROJECT_NAME`: From package.json or README
- `CURRENT_DATE`: Today's date (YYYY-MM-DD)
- `VERSION`: From package.json or last constitution version

**Infer from Existing Content**:
- If updating, preserve existing values unless user specifies change
- For governance dates:
  - `RATIFICATION_DATE`: Original adoption date (TODO if unknown)
  - `LAST_AMENDED_DATE`: Today if changes made, else keep previous

**Version Bump Logic**:
```
MAJOR: Backward incompatible (principle removals, redefinitions)
MINOR: New principle added, materially expanded guidance
PATCH: Clarifications, wording, typo fixes
```

If version bump type ambiguous, propose reasoning before finalizing.

### 3. Draft Updated Constitution

**Replace every placeholder** with concrete text (no bracketed tokens left unless intentionally retained—justify any left).

**Structure**:

```markdown
# Constitution: [PROJECT_NAME]

**Version**: [MAJOR.MINOR.PATCH]
**Ratified**: [YYYY-MM-DD]
**Last Amended**: [YYYY-MM-DD]

---

## Preamble

[Brief statement of project values and guiding philosophy]

---

## Principles

### [PRINCIPLE_1_NAME]

**Type**: MUST | SHOULD

[Non-negotiable rules as paragraph or bullet list]

**Rationale**: [Why this principle matters]

---

### [PRINCIPLE_2_NAME]

**Type**: MUST | SHOULD

[Non-negotiable rules]

**Rationale**: [Why this principle matters]

---

## Governance

### Amendment Procedure

[How to propose, discuss, and adopt constitutional changes]

### Versioning Policy

[Semantic versioning rules for constitution itself]

### Compliance Review

[How to verify adherence to principles]

---

## Sync Impact

**Last Updated**: [DATE]
**Changed By**: [Command/User]

### Modified Principles
- [Old title → New title if renamed]

### Added Sections
- [New section names]

### Removed Sections
- [Removed section names]

### Templates Requiring Updates
- ✅ `.specify/templates/spec-template.md`
- ⚠️ `.specify/templates/plan-template.md` (pending)
- ✅ `.specify/templates/tasks-template.md`

### Follow-up TODOs
- [TODO(FIELD_NAME): explanation for any intentionally deferred placeholders]
```

### 4. Consistency Propagation Checklist

**Read and Validate**:

1. **`.specify/templates/plan-template.md`**:
   - Check "Constitution Check" section aligns with updated principles
   - Update if constitution adds/removes mandatory sections

2. **`.specify/templates/spec-template.md`**:
   - Ensure scope/requirements alignment with new principles
   - Update if constitution mandates new sections

3. **`.specify/templates/tasks-template.md`**:
   - Ensure task categorization reflects new principles
   - Add/remove principle-driven task types (observability, versioning, testing)

4. **`.specify/templates/commands/*.md`** (including this file):
   - Verify no outdated references remain
   - Update generic guidance if needed

5. **Runtime Guidance** (`README.md`, `docs/quickstart.md`, `QWEN.md`):
   - Update references to changed principles

**For Each Template**:
- Mark as `✅ updated` (if auto-updated or no change needed)
- Mark as `⚠ pending` (if manual review required)
- Create follow-up TODO if intentionally deferred

### 5. AI Study Planner Constitution (Reference)

```markdown
# Constitution: AI Study Planner

**Version**: 1.0.0
**Ratified**: 2026-02-19
**Last Amended**: 2026-02-19

---

## Preamble

The AI Study Planner is a microservices application that generates personalized, AI-powered study schedules. We prioritize developer experience, type safety, and service decoupling to enable rapid, reliable development.

---

## Principles

### 1. Schema-First Design

**Type**: MUST

All inbound data must be validated with Zod schemas before use. TypeScript types are inferred from schemas, not manually defined.

**Rationale**: Ensures runtime type safety, reduces bugs, and provides single source of truth for data shapes.

---

### 2. Service Decoupling

**Type**: MUST

Services must NOT import code from other services. Inter-service communication occurs via HTTP through the NGINX gateway only.

**Rationale**: Enables independent deployment, testing, and scaling of services. Prevents tight coupling and circular dependencies.

---

### 3. TypeScript Strict Mode

**Type**: MUST

All TypeScript code must use `strict: true` in tsconfig.json. Use of `any` type is prohibited. Prefer `unknown` over `any` when type is truly uncertain.

**Rationale**: Catches type errors at compile time, improves IDE support, and documents intent.

---

### 4. Logging Standards

**Type**: MUST

Use structured loggers (`winston`, `@gauravsharmacode/neat-logger`) for all logging. Direct `console.*` calls are prohibited.

**Rationale**: Enables centralized log aggregation, filtering, and monitoring in production.

---

### 5. Containerization

**Type**: MUST

All services must support one-command deployment via Docker Compose. Development and production environments use identical container configurations.

**Rationale**: Ensures environment parity, simplifies onboarding, and enables reproducible builds.

---

### 6. Error Handling

**Type**: MUST

All errors must be wrapped in typed error classes (`HttpError` with statusCode, code, message). Stack traces and secrets must never leak to client responses.

**Rationale**: Provides consistent error responses, aids debugging, and prevents information disclosure.

---

### 7. Testing

**Type**: SHOULD

All business logic should have unit tests. All HTTP endpoints should have integration tests. External dependencies (DB, AI, Redis) must be mocked.

**Rationale**: Catches regressions, documents behavior, and enables confident refactoring.

---

## Governance

### Amendment Procedure

1. **Proposal**: Open GitHub issue with proposed change and rationale
2. **Discussion**: Minimum 48-hour discussion period for feedback
3. **Approval**: Requires consensus from project maintainers
4. **Implementation**: Update constitution, propagate to templates, increment version
5. **Communication**: Announce changes in project changelog

### Versioning Policy

This constitution follows semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Backward incompatible changes (principle removals, redefinitions)
- **MINOR**: New principles added, materially expanded guidance
- **PATCH**: Clarifications, wording, typo fixes

### Compliance Review

Run `/qwen:analyze` before implementation to verify constitutional compliance. Address CRITICAL violations before proceeding.

---

## Sync Impact

**Last Updated**: 2026-02-19
**Changed By**: Initial constitution

### Modified Principles
- (None - initial version)

### Added Sections
- All sections (initial version)

### Removed Sections
- (None - initial version)

### Templates Requiring Updates
- ⚠️ `.specify/templates/spec-template.md` (pending)
- ⚠️ `.specify/templates/plan-template.md` (pending)
- ⚠️ `.specify/templates/tasks-template.md` (pending)
- ⚠️ `.qwen/commands/*.md` (pending)

### Follow-up TODOs
- (None)
```

### 6. Validation Before Final Output

**Checklist**:
- [ ] No remaining unexplained bracket tokens (`[ALL_CAPS]`)
- [ ] Version line matches sync impact report
- [ ] Dates in ISO format (YYYY-MM-DD)
- [ ] Principles are declarative, testable, free of vague language
- [ ] MUST/SHOULD used appropriately (MUST = non-negotiable, SHOULD = recommended)
- [ ] Templates flagged for manual follow-up listed

### 7. Write Constitution

Overwrite `.specify/memory/constitution.md` with completed content.

**Preserve formatting**:
- Single blank line between sections
- No trailing whitespace
- Consistent heading hierarchy

### 8. Output Final Summary

```text
✅ Constitution updated

Version: [old] → [new] ([bump rationale])

## Files Updated

✅ `.specify/memory/constitution.md` - Main constitution file

## Templates Flagged for Follow-up

⚠️ `.specify/templates/spec-template.md` - Manual review required
⚠️ `.specify/templates/plan-template.md` - Manual review required
⚠️ `.specify/templates/tasks-template.md` - Manual review required

## Suggested Commit Message

```
docs: amend constitution to v[VERSION] ([bump rationale])

- [Principle 1 change]
- [Principle 2 change]
- Templates updated: [list]
```

## Next Steps

1. Review flagged templates
2. Update template references to new principles
3. Commit changes with suggested message
4. Run `/qwen:specify` for next feature (will use updated constitution)
```

## Behavior Rules

- **Do NOT create new template**: Always operate on existing `.specify/memory/constitution.md`
- **Respect user partial updates**: If user supplies only one principle revision, still perform full validation
- **Insert TODO for missing info**: `TODO(FIELD_NAME): explanation` for truly unknown values
- **Include TODOs in Sync Impact Report**: Under deferred items

## Context

$ARGUMENTS

# Qwen Commands - AI Study Planner

Custom command workflows for the AI Study Planner project, adapted from Speckit methodology.

## Command Catalog

| Command | Purpose | Stage | Est. Time |
|---------|---------|-------|-----------|
| `/qwen:specify` | Generate feature spec from description | Specification | 5-10 min |
| `/qwen:clarify` | Resolve spec ambiguities (max 5 questions) | Specification | 3-5 min |
| `/qwen:plan` | Create technical implementation plan | Planning | 5-8 min |
| `/qwen:tasks` | Generate dependency-ordered task list | Task Breakdown | 3-5 min |
| `/qwen:checklist` | Create "unit tests for requirements" | Quality Gate | 2-4 min |
| `/qwen:analyze` | Cross-artifact consistency analysis | Quality Gate | 5-7 min |
| `/qwen:implement` | Execute tasks phase-by-phase | Implementation | 15-60 min |
| `/qwen:constitution` | Update project constitution | Governance | 5-10 min |

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    FEATURE DEVELOPMENT FLOW                      │
└─────────────────────────────────────────────────────────────────┘

/qwen:specify ──→ spec.md
     ↓
/qwen:clarify ──→ spec.md (updated with clarifications)
     ↓
/qwen:plan ─────→ plan.md, data-model.md, contracts/
     ↓
/qwen:tasks ────→ tasks.md
     ↓              ↓
/qwen:checklist ─→ checklists/*.md
     ↓              ↓
/qwen:analyze ───→ Analysis Report
     ↓
/qwen:implement ─→ Working Feature
```

## Command Usage

### `/qwen:specify <feature-description>`

**Purpose**: Create technology-agnostic feature specification

**Example**:
```
/qwen:specify I want to add email notifications when study sessions are completed
```

**Output**:
- Creates feature branch: `N-feature-name`
- Generates `specs/N-feature-name/spec.md`
- Creates initial quality checklist

**Guidelines**:
- Focus on WHAT users need, not HOW to implement
- Max 3 `[NEEDS CLARIFICATION]` markers
- Success criteria must be measurable and technology-agnostic

---

### `/qwen:clarify`

**Purpose**: Ask targeted questions to resolve spec ambiguities

**Behavior**:
- Asks max 5 questions (one at a time)
- Each question has multiple-choice options + short answer
- Updates spec.md incrementally after each answer
- Creates `## Clarifications` section with session log

**Example Interaction**:
```
## Question 1: Notification Delivery

**Context**: Spec §FR-3 mentions "send notifications"

**What we need to know**: Which notification channels are required?

**Recommended**: Option B - Email only (MVP approach)

| Option | Description | Implications |
|--------|-------------|--------------|
| A | Email + SMS | Higher complexity, cost |
| B | Email only | Faster MVP, lower cost |
| C | In-app only | Requires WebSocket infrastructure |
| Short | Custom answer | Provide your own |

Your choice: _[Wait for response]_
```

---

### `/qwen:plan`

**Purpose**: Create technical implementation plan from spec

**Prerequisites**: `spec.md` complete, no `[NEEDS CLARIFICATION]` markers

**Output**:
- `plan.md` - Architecture, tech stack, file structure
- `data-model.md` - Entities, relationships (if data involved)
- `contracts/` - API specifications (if applicable)
- `research.md` - Technical decisions and alternatives

**Constitution Check**: Validates plan against project constitution principles

---

### `/qwen:tasks`

**Purpose**: Generate executable task list organized by user story

**Prerequisites**: `plan.md`, `spec.md` complete

**Task Format** (STRICT):
```text
- [ ] T001 [P?] [US?] Description with file path
```

**Components**:
- Checkbox: `- [ ]`
- Task ID: `T001`, `T002`, ...
- `[P]`: Parallelizable (optional)
- `[US1]`: User story label (for story phases only)
- Description: Clear action with exact file path

**Phase Structure**:
1. **Setup** - Project initialization
2. **Foundational** - Blocking prerequisites
3. **User Stories** - One phase per story (P1, P2, P3...)
4. **Polish** - Cross-cutting concerns

---

### `/qwen:checklist <domain>`

**Purpose**: Create "unit tests for requirements" (NOT implementation tests)

**Example**:
```
/qwen:checklist api
```

**Output**: `checklists/<domain>.md`

**Correct Items** (testing requirements quality):
- ✅ "Are error response formats specified for all failure modes? [Completeness]"
- ✅ "Is 'fast loading' quantified with specific thresholds? [Clarity]"

**Incorrect Items** (testing implementation):
- ❌ "Verify API returns 200 status"
- ❌ "Test error handling works"

---

### `/qwen:analyze`

**Purpose**: Non-destructive cross-artifact consistency analysis

**Prerequisites**: `spec.md`, `plan.md`, `tasks.md` all present

**Detection Passes**:
- **Duplication**: Near-duplicate requirements
- **Ambiguity**: Vague adjectives without metrics
- **Underspecification**: Missing objects or outcomes
- **Constitution Alignment**: Violations of MUST principles
- **Coverage Gaps**: Requirements without tasks
- **Inconsistency**: Terminology drift, conflicting requirements

**Output**: Markdown report with findings table (max 50 findings)

**Severity Levels**:
- **CRITICAL**: Constitution violations, missing core artifacts
- **HIGH**: Conflicting requirements, untestable criteria
- **MEDIUM**: Terminology drift, missing NFR coverage
- **LOW**: Style improvements

---

### `/qwen:implement`

**Purpose**: Execute tasks from `tasks.md` phase-by-phase

**Prerequisites**: 
- `tasks.md` complete
- All checklists in `checklists/` marked complete (or user override)

**Behavior**:
1. Validates checklist completion status
2. Verifies project setup (ignore files, dependencies)
3. Executes tasks in dependency order
4. Marks tasks as `[X]` upon completion
5. Reports progress after each phase

**Error Handling**:
- Halts on sequential task failure
- Continues with parallel tasks on failure
- Provides contextual error messages

---

### `/qwen:constitution`

**Purpose**: Update project constitution from principle inputs

**Output**: `.specify/memory/constitution.md`

**Features**:
- Interactive principle collection
- Semantic versioning (MAJOR.MINOR.PATCH)
- Sync impact report for dependent templates
- Governance section with amendment procedure

---

## Project Constitution

All commands must respect the AI Study Planner constitution:

### Core Principles

1. **Schema-First Design**: Zod schemas before implementation
2. **Service Decoupling**: No cross-service imports, HTTP via NGINX only
3. **TypeScript Strict Mode**: No `any`, no unchecked indexed access
4. **Logging Standards**: Use `logWithMeta` or `winston`, never `console.*`
5. **Containerization**: Docker support mandatory for all services

### Quality Gates

- Specs must be technology-agnostic
- Tasks must include file paths
- Checklists test requirements, not implementation
- Analysis runs before implementation

---

## File Structure

```
.qwen/
├── commands/
│   ├── README.md                 # This file
│   ├── speckit.specify.md        # Specification workflow
│   ├── speckit.clarify.md        # Clarification workflow
│   ├── speckit.plan.md           # Planning workflow
│   ├── speckit.tasks.md          # Task generation
│   ├── speckit.checklist.md      # Checklist generation
│   ├── speckit.analyze.md        # Analysis workflow
│   ├── speckit.implement.md      # Implementation execution
│   └── speckit.constitution.md   # Constitution management
└── context/
    └── project-context.md        # Qwen-specific context
```

---

## Best Practices

### Before Running Commands

1. **Ensure clean working directory**: `git status`
2. **Check branch**: Should be `dev` or feature branch
3. **Verify prerequisites**: Each command lists requirements

### During Execution

1. **Review before committing**: Commands modify multiple files
2. **Respect question limits**: Max 5 clarifications per session
3. **Complete quality gates**: Don't skip checklists

### After Completion

1. **Run validation**: `/qwen:analyze` before final commit
2. **Update documentation**: Ensure README reflects changes
3. **Commit with conventional messages**: `feat:`, `fix:`, `chore:`

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Command not found | Ensure `.qwen/commands/` exists |
| Prerequisites missing | Run suggested prerequisite command |
| Checklist fails | Review spec for vague requirements |
| Task format invalid | Check format: checkbox, ID, [P], [US], path |
| Analysis reports CRITICAL | Resolve before `/qwen:implement` |

### Getting Help

- Review this README for command-specific guidance
- Check `QWEN.md` for project conventions
- Run `/qwen:analyze` to identify spec issues

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-19 | Initial adaptation from Speckit |

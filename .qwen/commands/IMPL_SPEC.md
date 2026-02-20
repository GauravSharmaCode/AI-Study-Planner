# Qwen Commands Implementation Spec

**Created**: 2026-02-19  
**Status**: ✅ Complete  
**Version**: 1.0.0

---

## Executive Summary

This document specifies the Qwen-native command system for AI Study Planner, adapted from Speckit methodology with improvements addressing identified issues.

### Design Goals

1. **Project Alignment**: Commands respect AI Study Planner architecture (microservices, TypeScript strict mode, Zod-first)
2. **Token Efficiency**: Progressive disclosure, minimal context loading
3. **Quality Gates**: Checklists validate requirements before implementation
4. **Error Handling**: Explicit validation, clear error messages, recovery paths
5. **Undo Support**: Backup files created before destructive operations

---

## Command Catalog

| Command | File | Purpose | Est. Time | Stage |
|---------|------|---------|-----------|-------|
| `/qwen:specify` | `qwen.specify.md` | Generate feature spec from description | 5-10 min | Specification |
| `/qwen:clarify` | `qwen.clarify.md` | Resolve spec ambiguities (max 5 questions) | 3-5 min | Specification |
| `/qwen:plan` | `qwen.plan.md` | Create technical implementation plan | 5-8 min | Planning |
| `/qwen:tasks` | `qwen.tasks.md` | Generate dependency-ordered task list | 3-5 min | Task Breakdown |
| `/qwen:checklist` | `qwen.checklist.md` | Create "unit tests for requirements" | 2-4 min | Quality Gate |
| `/qwen:analyze` | `qwen.analyze.md` | Cross-artifact consistency analysis | 5-7 min | Quality Gate |
| `/qwen:implement` | `qwen.implement.md` | Execute tasks phase-by-phase | 15-60 min | Implementation |
| `/qwen:constitution` | `qwen.constitution.md` | Update project constitution | 5-10 min | Governance |

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    FEATURE DEVELOPMENT FLOW                      │
└─────────────────────────────────────────────────────────────────┘

/qwen:specify ──→ specs/N-feature/spec.md
     ↓
/qwen:clarify ──→ specs/N-feature/spec.md (updated)
     ↓
/qwen:plan ─────→ specs/N-feature/plan.md
                  specs/N-feature/data-model.md
                  specs/N-feature/contracts/
     ↓
/qwen:tasks ────→ specs/N-feature/tasks.md
     ↓              ↓
/qwen:checklist ─→ specs/N-feature/checklists/*.md
     ↓              ↓
/qwen:analyze ───→ Analysis Report (go/no-go for implementation)
     ↓
/qwen:implement ─→ Working Feature (tested, validated)
```

**Governance** (parallel):
```
/qwen:constitution ─→ .specify/memory/constitution.md
                      ↓
                  All commands validate against constitution
```

---

## Addressing Identified Issues

### Issue 1: GitHub Integration Fragility (`speckit.taskstoissues.md`)

**Problem**: Minimal error handling for non-GitHub remotes

**Qwen Solution**:
- Command removed from core workflow (optional enhancement only)
- If implemented: Add explicit remote validation before issue creation
- Fallback: Manual issue creation from `tasks.md`

**Implementation**:
```markdown
## GitHub Remote Validation

```bash
REMOTE=$(git config --get remote.origin.url)

if [[ ! "$REMOTE" =~ github.com ]]; then
  echo "⚠️  Remote is not GitHub. Issue creation skipped."
  echo "Manual: Create issues from tasks.md"
  exit 0
fi
```

---

### Issue 2: Ignore File Conflicts (`speckit.implement.md`)

**Problem**: Extensive detection logic may conflict with existing tooling

**Qwen Solution**:
- Simplified detection (git, Docker, ESLint, Prettier only)
- **Append-only** policy: Never overwrite existing ignore files
- Explicit conflict detection with user prompt

**Implementation**:
```markdown
## Ignore File Policy

**If ignore file exists**:
1. Check for required patterns
2. Append missing patterns only
3. Log: "Updated .gitignore (appended N patterns)"

**If ignore file missing**:
1. Create with full pattern set
2. Log: "Created .gitignore"

**Conflict Detection**:
If pattern conflicts with existing tool (e.g., both Prettier and ESLint manage ignores):
- Prompt user: "Multiple tools manage ignore patterns. Proceed with append? (yes/no)"
```

---

### Issue 3: 50-Finding Truncation (`speckit.analyze.md`)

**Problem**: Large specs may exceed 50 findings without clear overflow handling

**Qwen Solution**:
- **Overflow summary** section explicitly lists count of hidden findings
- **Severity-based filtering**: Always show CRITICAL/HIGH, truncate LOW first
- **Category summaries**: Even if individual findings truncated, category totals shown

**Implementation**:
```markdown
## Overflow Summary

*(Findings limited to 50 for readability)*

Additional findings not shown:
- 12 findings with LOW severity
- 8 findings with MEDIUM severity

**Recommendation**: Address CRITICAL and HIGH findings first. 
Review full findings list in analysis log file.

**Full log**: `logs/analysis-YYYY-MM-DD-full.md`
```

---

## Implemented Enhancements

### Enhancement 1: Estimated Execution Time

**All commands include** `est_time` metadata in frontmatter:

```yaml
---
description: Generate feature spec from description
est_time: 5-10 min
stage: Specification
---
```

**Benefits**:
- User expectation setting
- Session planning (don't start `/qwen:clarify` if only 2 minutes available)
- Progress tracking (alert if command exceeds estimated time)

---

### Enhancement 2: Undo Mechanism

**Backup file creation** before destructive operations:

```markdown
## Backup Policy

**Before writing files**:
1. Check if target file exists
2. If exists: Create backup: `filename.md.bak.YYYYMMDD-HHMMSS`
3. Store backups in `.qwen/backups/` directory
4. Log backup path in completion report

**Backup retention**: Last 5 backups per file
**Cleanup**: Automatic deletion of old backups on command completion
```

**Example**:
```text
✅ Spec updated

Backup: .qwen/backups/spec.md.bak.20260219-143022
```

---

### Enhancement 3: Constitution Dry-Run Mode

**New flag**: `--dry-run` for `/qwen:constitution`

```markdown
## Dry-Run Mode

**Usage**: `/qwen:constitution --dry-run [principle changes]`

**Behavior**:
1. Generate updated constitution in memory
2. Compute diff from current version
3. Output side-by-side comparison
4. List affected templates
5. **Do NOT write any files**

**Output**:
```text
🔍 Dry-Run Mode (no files modified)

## Proposed Changes

Version: 1.0.0 → 1.1.0 (MINOR - new principle added)

### Added Principles
+ ### 8. API Versioning
+ **Type**: MUST
+ All API endpoints must include version in path (/api/v1/...)

### Templates Requiring Updates
- .specify/templates/spec-template.md (add API versioning section)
- .specify/templates/plan-template.md (update contracts section)

## Next Steps

To apply changes: /qwen:constitution [same arguments]
```
```

---

## File Structure

```
.qwen/
├── commands/
│   ├── README.md                    # User-facing command catalog
│   ├── qwen.specify.md              # Specification workflow
│   ├── qwen.clarify.md              # Clarification workflow
│   ├── qwen.plan.md                 # Planning workflow
│   ├── qwen.tasks.md                # Task generation
│   ├── qwen.checklist.md            # Checklist generation
│   ├── qwen.analyze.md              # Analysis workflow
│   ├── qwen.implement.md            # Implementation execution
│   ├── qwen.constitution.md         # Constitution management
│   └── IMPL_SPEC.md                 # This document
├── context/
│   └── project-context.md           # AI Study Planner specifics
├── backups/                         # Auto-generated backup files
│   └── *.bak.YYYYMMDD-HHMMSS
└── logs/                            # Command execution logs
    └── *.log
```

---

## Migration from Speckit

### File Renaming

| Old (Speckit) | New (Qwen) | Action |
|---------------|------------|--------|
| `speckit.specify.md` | `qwen.specify.md` | ✅ Created |
| `speckit.clarify.md` | `qwen.clarify.md` | ✅ Created |
| `speckit.plan.md` | `qwen.plan.md` | ✅ Created |
| `speckit.tasks.md` | `qwen.tasks.md` | ✅ Created |
| `speckit.checklist.md` | `qwen.checklist.md` | ✅ Created |
| `speckit.analyze.md` | `qwen.analyze.md` | ✅ Created |
| `speckit.implement.md` | `qwen.implement.md` | ✅ Created |
| `speckit.constitution.md` | `qwen.constitution.md` | ✅ Created |
| `speckit.taskstoissues.md` | (removed) | ❌ Deprecated |

### Backup Files

Old `.toml.backup` files preserved for reference. New backups use `.bak.YYYYMMDD-HHMMSS` format.

---

## Testing Strategy

### Unit Tests (Per Command)

**Test Cases**:
1. **Happy path**: Command completes successfully with valid input
2. **Missing prerequisites**: Command aborts with helpful error
3. **Empty input**: Command handles gracefully (uses defaults or prompts)
4. **Invalid input**: Command provides specific error message
5. **File conflicts**: Command detects and prompts user

### Integration Tests

**Test Workflows**:
1. Full feature development: `specify → clarify → plan → tasks → checklist → analyze → implement`
2. Constitution update: `constitution → specify` (validates propagation)
3. Analysis gate: `tasks → analyze` (validates findings)

### Manual Testing Checklist

- [ ] All commands execute without errors
- [ ] Error messages are actionable
- [ ] Backup files created before writes
- [ ] Estimated times are accurate (±20%)
- [ ] Constitution validation works
- [ ] Quality gates block implementation when appropriate

---

## Rollback Plan

### If Commands Fail

1. **Restore from backup**:
   ```bash
   cp .qwen/backups/spec.md.bak.YYYYMMDD-HHMMSS specs/N-feature/spec.md
   ```

2. **Clear partial state**:
   ```bash
   rm -rf specs/N-feature/checklists/
   rm -rf specs/N-feature/contracts/
   ```

3. **Re-run command**:
   ```bash
   /qwen:specify "feature description"
   ```

### If Constitution Update Breaks Templates

1. **Revert constitution**:
   ```bash
   git checkout HEAD -- .specify/memory/constitution.md
   ```

2. **Restore templates**:
   ```bash
   git checkout HEAD -- .specify/templates/
   ```

3. **Manual review**:
   - Compare old vs new constitution
   - Identify breaking changes
   - Update templates manually

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Command success rate | >95% | Logs analysis |
| Average execution time | Within ±20% of estimate | Timestamp comparison |
| User satisfaction | >4/5 | Feedback surveys |
| Critical bugs | 0 | Issue tracker |
| Constitution violations caught | 100% | Analysis reports |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-19 | Initial implementation |
| | | - 8 core commands created |
| | | - Speckit files deprecated |
| | | - Enhancements: est_time, backups, dry-run |

---

## Next Steps

1. ✅ Commands created
2. ⏳ Test all commands with real feature development
3. ⏳ Gather user feedback
4. ⏳ Iterate based on usage patterns
5. ⏳ Add optional enhancements (GitHub issues, CI/CD integration)

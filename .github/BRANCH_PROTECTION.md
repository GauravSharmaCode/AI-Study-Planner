# Branch Protection Configuration

This document describes the required GitHub branch protection settings for the AI Study Planner repository.

## Overview

- **`main` branch**: Protected - requires CI to pass before merging
- **`dev` branch**: CI runs but does not block merges

## GitHub Settings Configuration

### Main Branch Protection (`main`)

Navigate to: **Settings → Branches → Add branch protection rule**

Configure for branch pattern: `main`

**Required settings:**

- [x] **Require a pull request before merging**
  - [x] Require approvals: 1 (optional, adjust as needed)
  - [x] Dismiss stale pull request approvals when new commits are pushed

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - Select required status checks:
    - `build-and-test (18.x)`
    - `build-and-test (20.x)`

- [x] **Require conversation resolution before merging**

- [x] **Do not allow bypassing the above settings**

### Dev Branch Settings (`dev`)

Navigate to: **Settings → Branches → Add branch protection rule**

Configure for branch pattern: `dev`

**Recommended settings (minimal protection, CI runs but doesn't block):**

- [x] **Require a pull request before merging** (optional)
  - This allows team collaboration while not blocking on CI

- [ ] **Require status checks to pass before merging** - UNCHECKED
  - This ensures CI runs but doesn't block merges

- [x] **Allow force pushes** (optional, for development flexibility)
- [x] **Allow deletions** (optional)

## How It Works

1. **On Push/PR to `main`**: CI runs and MUST pass before merging is allowed
2. **On Push/PR to `dev`**: CI runs and reports status, but merges are allowed regardless of CI result
3. **CI failures on `dev`**: Will be visible in PR checks but won't prevent merging

## Workflow Configuration

The CI workflow (`.github/workflows/ci.yml`) triggers on:

- Push to `main` or `dev`
- Pull requests targeting `main` or `dev`

## Branch Protection Rules Summary

| Branch | CI Runs | Blocks Merge on Failure | PR Required |
| ------ | ------- | ----------------------- | ----------- |
| `main` | ✅ Yes  | ✅ Yes                  | ✅ Yes      |
| `dev`  | ✅ Yes  | ❌ No                   | ⚙️ Optional |

## Setting Up via GitHub CLI (optional)

```bash
# For main branch (requires GitHub CLI: gh)
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["build-and-test (18.x)","build-and-test (20.x)"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"required_approving_review_count":1}'

# For dev branch (minimal protection)
gh api repos/:owner/:repo/branches/dev/protection \
  --method PUT \
  --field required_status_checks=null \
  --field enforce_admins=false \
  --field required_pull_request_reviews=null
```

## Important Notes

1. **Default branch**: According to `AGENTS.md`, the default branch is `dev`, not `main`
2. **PR targets**: Always PR to `dev`, not `main`
3. **Merging to main**: Should only happen from `dev` via PR with passing CI

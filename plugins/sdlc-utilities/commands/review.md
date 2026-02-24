---
description: Run multi-dimension code review on the current branch using project-defined review dimensions
allowed-tools: [Read, Glob, Grep, Bash, Skill]
argument-hint: "[--base <branch>] [--dimensions <name,...>] [--dry-run]"
---

# /review Command

Run a multi-dimension code review on the current branch. Loads project review dimensions
from `.claude/review-dimensions/`, matches them to changed files, dispatches parallel
review subagents, deduplicates findings, and posts a consolidated PR comment.

## Usage

- `/sdlc:review` — Full review using all matching dimensions
- `/sdlc:review --base develop` — Diff against `develop` instead of auto-detected base
- `/sdlc:review --dimensions security-review,api-review` — Run only named dimensions
- `/sdlc:review --dry-run` — Show the review plan without dispatching subagents

## Workflow

### Step 0: Parse Arguments

Check `$ARGUMENTS` for flags:

- `--base <branch>` present → record the base branch value
- `--dimensions <name,...>` present → record the dimension filter list
- `--dry-run` present → record the dry-run flag

### Step 1: Validate Git State

Confirm the working directory is inside a git repository:

```bash
git rev-parse --is-inside-work-tree
git branch --show-current
```

Check for uncommitted changes:

```bash
git status --porcelain
```

If there are uncommitted changes, warn the user before continuing:

```text
Warning: you have uncommitted changes. They will NOT be included in the review diff.
Commit or stash them first if you want them included. Continue anyway? (yes/no)
```

### Step 2: Delegate to Skill

Invoke the `reviewing-changes` skill, passing all parsed flags:

- `--base <branch>` if provided
- `--dimensions <name,...>` if provided
- `--dry-run` if set

The skill handles everything from here: dimension discovery, validation, file matching,
parallel review dispatch, deduplication, and PR comment posting.

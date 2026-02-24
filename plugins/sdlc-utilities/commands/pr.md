---
description: Create or update a pull request with an auto-generated description from commits and diffs
allowed-tools: [Read, Glob, Grep, Bash, Skill]
argument-hint: "[--draft] [--update] [--base <branch>]"
---

# /pr Command

Create or update a pull request on the current branch with a description
auto-generated from commit history and diffs. Uses the Conventional PR format.

Auto-detects whether a PR already exists: if one does, updates it; otherwise
creates a new one.

## Usage

- `/pr` — Auto-detect: create a new PR or update the existing one
- `/pr --draft` — Create a draft PR (new PRs only)
- `/pr --update` — Force update mode (error if no PR exists for this branch)
- `/pr --base develop` — Target a specific base branch

## Workflow

### Step 0: Parse Arguments

Check `$ARGUMENTS` for flags:

- `--draft` present → set draft mode on
- `--update` present → set update mode on (force update; error if no PR exists)
- `--base <branch>` present → use that as the base branch
- No arguments → auto-detect base branch, auto-detect create/update mode

### Step 1: Validate Git State

Confirm the working directory is in a valid state:

```bash
# Confirm inside a git repo
git rev-parse --is-inside-work-tree

# Get current branch
git branch --show-current
```

If on `main` or `master`, stop immediately and tell the user:

```text
You are on the main/master branch. Switch to a feature branch before creating a PR.
```

Check for uncommitted changes:

```bash
git status --porcelain
```

If there are uncommitted changes, warn the user before continuing:

```text
Warning: you have uncommitted changes. They will NOT be included in the PR.
Commit or stash them first if you want them included. Continue anyway? (yes/no)
```

### Step 2: Delegate to Skill

Invoke the `creating-pull-requests` skill, passing:

- The `--draft` flag if set
- The `--update` flag if set
- The `--base <branch>` value if provided

The skill handles everything from here: base branch detection, remote state,
PR mode detection, description generation, user review, and PR creation or update.

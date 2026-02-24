---
description: Create a pull request with an auto-generated description from commits and diffs
allowed-tools: [Read, Glob, Grep, Bash, Skill]
argument-hint: "[--draft] [--base <branch>]"
---

# /pr Command

Create a pull request on the current branch with a description auto-generated
from commit history and diffs. Uses the Conventional PR format.

## Usage

- `/pr` — Create a PR against the auto-detected base branch
- `/pr --draft` — Create a draft PR
- `/pr --base develop` — Create a PR targeting a specific base branch

## Workflow

### Step 0: Parse Arguments

Check `$ARGUMENTS` for flags:

- `--draft` present → set draft mode on
- `--base <branch>` present → use that as the base branch
- No arguments → auto-detect base branch, non-draft mode

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
- The `--base <branch>` value if provided

The skill handles everything from here: base branch detection, remote state,
existing PR check, description generation, user review, and PR creation.

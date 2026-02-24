---
description: Create a pull request with an auto-generated description from commits and diffs
allowed-tools: [Read, Glob, Grep, Bash, Skill]
argument-hint: "[--draft] [--base <branch>]"
---

# /pr Command

Create a pull request on the current branch with a description auto-generated
from commit history and diffs. Uses the Conventional PR format (What/Why/How/Testing).

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

```
You are on the main/master branch. Switch to a feature branch before creating a PR.
```

Check for uncommitted changes:

```bash
git status --porcelain
```

If there are uncommitted changes, warn the user before continuing:

```
Warning: you have uncommitted changes. They will NOT be included in the PR.
Commit or stash them first if you want them included. Continue anyway? (yes/no)
```

### Step 2: Determine Base Branch

If `--base` was provided, use that value. Otherwise, auto-detect:

```bash
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'
```

Fall back to `main` if detection returns nothing. Then verify the branch exists:

```bash
git rev-parse --verify origin/<base-branch> 2>/dev/null && echo "ok" || echo "not found"
```

If the base branch does not exist on the remote, ask the user which branch to target.

### Step 3: Check Remote State

Check if the current branch is pushed and up to date:

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{upstream} 2>/dev/null
git status -sb
```

If no upstream tracking branch exists, push the branch:

```bash
git push -u origin $(git branch --show-current)
```

If the local branch is ahead of the remote, push the latest commits:

```bash
git push
```

### Step 4: Check for Existing PR

Before creating, check if a PR already exists for this branch:

```bash
gh pr view --json number,title,url,state 2>/dev/null
```

If an open PR exists, present it to the user:

```
A pull request already exists for this branch:
  #<number>: <title>
  <url>

Would you like to update its description instead? (yes/no)
```

If yes → generate the description (Step 5), then update using `gh pr edit --body "<body>"`.
If no → stop and let the user decide.

### Step 5: Generate PR Description

Load the `creating-pull-requests` skill and use it to analyze the branch
commits and diff against the base branch, then generate the PR title and
description in the Conventional PR format.

Pass the base branch name so the skill knows what to compare against.

### Step 6: Present for Review

Show the generated title and description to the user:

```
PR Title: <title>

PR Description:
─────────────────────────────────────────────
<description>
─────────────────────────────────────────────

Create this PR? (yes / edit / cancel)
  yes    — create the PR as shown
  edit   — tell me what to change
  cancel — abort without creating
```

If the user chooses `edit`, ask what to change, regenerate, and present again.
Wait for explicit `yes` before creating.

### Step 7: Create the PR

Create the PR using the GitHub CLI:

```bash
gh pr create --title "<title>" --body "<body>" [--draft]
```

After successful creation, display the PR URL:

```
Pull request created: <url>
```

**If `gh` is unavailable or fails**, display the error and show a fallback:

```
The GitHub CLI (gh) could not create the PR. You can:
  1. Install gh: https://cli.github.com/
  2. Authenticate: gh auth login
  3. Create the PR manually — here is your generated description to copy:

Title: <title>

<description>
```

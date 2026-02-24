---
name: creating-pull-requests
description: >-
  Use this skill when creating a pull request, writing a PR description, or
  generating PR content from commits and diffs. Triggers on "create PR",
  "open pull request", "write PR description", "PR summary", "conventional PR
  format", "what/why/how testing template", or when asked to describe changes
  for a pull request.
model: inherit
---

# Creating Pull Requests

Generate well-structured pull request descriptions from git history and diffs
using the Conventional PR format (What / Why / How / Testing).

## When to Use This Skill

- Creating a new pull request on any branch
- Writing or rewriting a PR description
- Summarizing branch changes for review
- When a command or workflow needs PR description generation

## Conventional PR Template

Every PR description follows this four-section structure:

```
## What

[1-3 sentence summary of WHAT changed. Name the feature, fix, or refactoring.
Reference issue/ticket numbers if available.]

## Why

[1-3 sentences explaining WHY this change is needed. What problem does it solve?
What user need, business requirement, or technical debt does it address?]

## How

[Bullet list of HOW the change was implemented. Focus on architectural decisions,
key files changed, and non-obvious approaches. Group by logical concern if the
PR touches multiple areas.]

## Testing

[How was this tested? Include: manual testing steps performed, automated tests
added/modified, edge cases considered. If no tests were added, explain why.]
```

## Workflow

### Step 1: Identify the Base Branch

Determine what branch to compare against:

```bash
# Check if current branch tracks a remote
git rev-parse --abbrev-ref --symbolic-full-name @{upstream} 2>/dev/null

# Detect the default branch
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'
```

Fall back to `main` if detection fails.

### Step 2: Gather Commit History

Collect ALL commits on this branch since it diverged from the base:

```bash
git log --oneline <base-branch>..HEAD
```

Read each commit message carefully. Look for:
- Conventional commit prefixes (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`)
- Issue/ticket references (`#123`, `JIRA-456`)
- Co-author trailers

### Step 3: Gather the Diff

Get a summary of changed files and the diff:

```bash
git diff --stat <base-branch>..HEAD
git diff <base-branch>..HEAD
```

For large diffs (>500 lines), focus on the stat summary and read key files
selectively rather than processing the entire diff.

### Step 4: Analyze and Categorize

From the commits and diff, determine:

- **What**: The primary change (feature, fix, refactor, etc.)
- **Why**: Infer from commit messages, branch name, and code context
- **How**: Group file changes by logical concern (e.g., "API changes", "UI updates")
- **Testing**: Look for test files in the diff, check for test commands in commits

### Step 5: Generate the PR Description

Fill in the Conventional PR template using the analysis from Step 4.

**What section rules:**
- Lead with the type of change (feature, fix, refactor)
- Be specific: "Add webhook retry with idempotency keys" not "Update payments"
- Include issue references if found in commits

**Why section rules:**
- Never write "because it was needed" or "to improve things"
- State the concrete problem or need
- If the why is unclear from commits, state what can be inferred and note the gap

**How section rules:**
- Use a bullet list, grouped by concern
- Mention key files only when they help the reviewer navigate
- Call out non-obvious decisions
- Omit trivial changes (import reordering, whitespace fixes)

**Testing section rules:**
- If test files appear in the diff, summarize what they cover
- If no tests are present, write "No automated tests added" and suggest what should be tested
- Include manual testing steps if the change is UI or integration-heavy

### Step 6: Generate the PR Title

Create a concise title (under 72 characters) following conventional commit style:

- `feat: add webhook retry with idempotency keys`
- `fix: resolve race condition in token refresh`
- `refactor: extract payment processing into dedicated service`

If the branch has multiple commit types, use the dominant one or the type matching the primary purpose.

## Best Practices

1. **Read ALL commits, not just the latest** — the PR is the sum of all branch work
2. **Diff is ground truth** — when commit messages and diff disagree, trust the diff
3. **Specificity over brevity** — a longer precise description beats a short vague one
4. **Group related changes** — reviewers scan by concern, not by file path
5. **Flag risks** — call out migrations, permission changes, or config changes in the How section
6. **Preserve author intent** — if commit messages express design rationale, carry it into Why/How

## DO NOT

- Write generic descriptions ("various improvements", "code cleanup")
- Include every single file in the How section — focus on meaningful changes
- Fabricate a Why when none is evident — state what you can infer and flag the gap
- Include the full diff in the PR description
- Use marketing language ("exciting new feature", "powerful enhancement")
- Skip the Testing section — always address it, even if only to say "no tests added"

## Quality Gates

Before presenting the PR description, verify:

| Gate | Check | Pass Criteria | Fail Action | Max Iterations |
|------|-------|---------------|-------------|----------------|
| Completeness | All four sections present and non-empty | What, Why, How, Testing all filled | Add missing sections | 2 |
| Specificity | What names a concrete change | No vague summaries like "various improvements" | Rewrite What with specifics from diff | 2 |
| Honesty | Why states a concrete reason | No "because it was needed" phrases | Rewrite Why from commit/branch context | 2 |
| Title length | Title is under 72 characters | `len(title) < 72` | Shorten title | 1 |
| No fabrication | All claims trace to commits or diff | Nothing invented | Remove or flag uncertain claims | 1 |

## Learning Capture

When creating pull requests, capture discoveries by appending to `.claude/learnings/log.md`.
Record entries for: repository PR conventions not covered by this skill, branch naming
patterns, CI requirements that affect PR descriptions, team-specific template preferences,
or review process quirks encountered while generating PR content.

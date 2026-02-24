---
name: creating-pull-requests
description: "Use this skill when creating or updating a pull request, updating a PR description, or generating PR content from commits and diffs. Handles the full PR workflow: base branch detection, remote sync, auto-detect create-or-update mode, description generation with plan-critique-improve-do, user review, and gh CLI execution. Triggers on: create PR, open pull request, update PR, write PR description, PR summary, or when asked to describe changes for a pull request."
---

# Creating Pull Requests

Full PR create-or-update workflow — from git state to merged description — using
an 8-section template readable by both technical and non-technical stakeholders.

## When to Use This Skill

- Creating a new pull request on any branch
- Updating an existing PR title or description
- Writing or rewriting a PR description
- Summarizing branch changes for review
- When the `/pr` command delegates here after basic validation

## PR Template

Every PR uses this 8-section flat structure. **All sections are always present.**

```markdown
## Summary
[1-3 sentence plain-language overview accessible to anyone — no jargon]

## JIRA Ticket
[Auto-detected from branch name or commit messages, e.g. PROJ-123.
"Not detected" if no ticket reference found.]

## Business Context
[Why this change is needed from a business/product perspective.
What problem or opportunity prompted it.
"N/A" only for pure internal tooling/infra with no business dimension.]

## Business Benefits
[What value this delivers — user impact, revenue, efficiency,
risk reduction, compliance, etc.
"N/A" only for pure internal tooling/infra with no business dimension.]

## Technical Design
[Architectural approach, key decisions, patterns used.
Non-obvious trade-offs or alternatives considered.]

## Technical Impact
[What systems, services, APIs, or areas are affected.
Breaking changes, migration needs, performance implications.
"N/A" if the change is fully isolated with no external impact.]

## Changes Overview
[High-level description of what changed, grouped by logical concern.
No file paths — focus on concepts and behavior changes.]

## Testing
[How this was verified: manual steps, automated tests, edge cases.
If no tests added, explain why.]
```

**Section fill rules:**

- ALL 8 sections MUST always be present — never omit one
- Fill with real content when derivable from commits, diff, or user answers
- Use **"N/A"** when a section genuinely doesn't apply (state why briefly)
- Use **"Not detected"** when detection was attempted but yielded nothing
- **Never fabricate** — if unsure, ask a clarifying question before filling
- Ask clarifying questions (especially for Business Context and Business Benefits)
  when git data alone isn't sufficient to fill the section confidently

---

## Workflow

### Step 1: Determine Base Branch

Accept a `--base <branch>` override if passed. Otherwise auto-detect:

```bash
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'
```

Fall back to `main` if detection returns nothing. Verify the branch exists:

```bash
git rev-parse --verify origin/<base-branch> 2>/dev/null && echo "ok" || echo "not found"
```

If the base branch doesn't exist on the remote, ask the user which branch to target.

### Step 2: Check Remote State

Check if the current branch is pushed and up to date:

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{upstream} 2>/dev/null
git status -sb
```

If no upstream tracking branch exists, push:

```bash
git push -u origin $(git branch --show-current)
```

If the local branch is ahead of remote, push:

```bash
git push
```

### Step 3: Detect PR Mode

```bash
gh pr view --json number,title,url,state 2>/dev/null
```

Determine the operating mode silently — no user prompt at this step:

1. **`--update` flag set + PR exists** → mode = `update`, record PR `#number` and URL
2. **`--update` flag set + no PR exists** → stop with error:
   ```text
   No existing PR found for this branch. Remove --update to create a new PR.
   ```
3. **No `--update` flag + PR exists** → mode = `update`, record PR `#number` and URL
4. **No `--update` flag + no PR exists** → mode = `create`

Carry the mode variable forward through the remaining steps.

### Step 4: Gather Commit History

```bash
git log --oneline <base-branch>..HEAD
```

Read every commit message. Look for:

- Conventional commit prefixes (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`)
- Issue/ticket references (`PROJ-123`, `#123`, `[PROJ-123]`)
- Co-author trailers

### Step 5: Gather the Diff

```bash
git diff --stat <base-branch>..HEAD
git diff <base-branch>..HEAD
```

For large diffs (>500 lines), focus on the stat summary and read key files
selectively rather than processing the entire diff.

### Step 6: Auto-detect JIRA Ticket

Scan in order:

1. **Branch name** — match `[A-Z]{2,10}-\d+` in the branch name
   (e.g., `feat/PROJ-123-description`, `PROJ-123-whatever`)
2. **Commit messages** — scan all commit messages for `[A-Z]{2,10}-\d+`,
   `[PROJ-123]`, `(PROJ-123)` patterns
3. If found → record the ticket reference(s)
4. If not found → mark as "Not detected"

### Step 7 (PLAN): Draft PR Description

Using data from Steps 4-6, draft all 8 sections of the PR template.

For each section, apply the fill rules:

- **Summary**: Plain-language, no jargon, 1-3 sentences
- **JIRA Ticket**: Use detected value or "Not detected"
- **Business Context / Benefits**: Infer from commit messages, branch name, and
  code context. If insufficient evidence, **ask the user** before writing.
  Don't guess. Acceptable question: *"What business problem does this PR solve?
  Who benefits and how?"*
- **Technical Design**: Infer from diff — architecture, patterns, key decisions
- **Technical Impact**: Identify affected systems/APIs/services from the diff
- **Changes Overview**: Group by logical concern, no file paths
- **Testing**: Summarize test coverage from diff; if none, say so explicitly

Also draft the PR title: under 72 characters, conventional commit style
(`feat:`, `fix:`, `refactor:`, etc.).

### Step 8 (CRITIQUE): Self-review the Draft

Before presenting to the user, review the draft against every quality gate:

| Gate | Check | Pass Criteria |
| ---- | ----- | ------------- |
| All sections present | All 8 sections exist with content | Real content, "N/A", or "Not detected" — never empty |
| Specificity | Summary names a concrete change | No vague summaries like "various improvements" |
| Business honesty | Business Context/Benefits are concrete or "N/A" | No "because it was needed" or invented reasons |
| No file paths | Changes Overview uses concepts only | Zero file paths in this section |
| Title length | Title under 72 characters | `len(title) < 72` |
| No fabrication | All claims traceable to commits, diff, or user input | Nothing invented |
| JIRA accuracy | JIRA value matches evidence or is "Not detected" | No guessed ticket numbers |
| Audience check | Readable by non-technical stakeholders | No unexplained jargon in Summary/Business sections |
| Documentation sync | If diff adds new commands, changes structure, renames concepts, or adds new directories/scripts: check that at least one `docs:` commit exists on this branch OR ask the user to confirm docs are updated | PR does not silently ship structural changes without a corresponding docs update |

Note every failing gate.

### Step 9 (IMPROVE): Revise Based on Critique

Fix each issue found in Step 8:

- Rewrite vague sections with specifics from the diff
- Replace invented content with "N/A" or "Not detected" plus a note
- If a business section still can't be filled confidently after revision,
  **ask the user** a targeted clarifying question and incorporate the answer
- Re-check all quality gates after revisions

Continue until all gates pass (max 2 iterations per gate).

### Step 10 (DO): Present for Review

Show the complete title and description. **Do not execute any `gh` command
before receiving explicit user approval.**

```text
PR Title: <title>

PR Description:
─────────────────────────────────────────────
<full description>
─────────────────────────────────────────────

<if mode = create>
Create this PR? (yes / edit / cancel)
  yes    — create the PR as shown
  edit   — tell me what to change
  cancel — abort without creating

<if mode = update>
Update PR #<number>? (yes / edit / cancel)
  yes    — update the PR title and description as shown
  edit   — tell me what to change
  cancel — abort without updating
```

If the user chooses `edit`, ask what to change, revise, and present again.
Loop until explicit `yes` or `cancel`.

### Step 11: Create or Update PR

**Only execute after explicit `yes` from Step 10.**

**Create mode:**

```bash
gh pr create --title "<title>" --body "<body>" [--draft]
```

**Update mode:**

```bash
gh pr edit --title "<title>" --body "<body>"
```

After success, display the PR URL:

```text
# Create mode:
Pull request created: <url>

# Update mode:
Pull request updated: <url>
```

**If `gh` is unavailable or fails**, show the error and provide a fallback:

```text
The GitHub CLI (gh) could not complete the operation. You can:
  1. Install gh: https://cli.github.com/
  2. Authenticate: gh auth login
  3. Create or update the PR manually — here is your generated description to copy:

Title: <title>

<description>
```

---

## Best Practices

1. **Read ALL commits, not just the latest** — the PR is the sum of all branch work
2. **Diff is ground truth** — when commit messages and diff disagree, trust the diff
3. **Ask rather than guess** — a clarifying question is better than fabricated content
4. **No file paths in Changes Overview** — reviewers think in concepts, not paths
5. **Flag risks** — call out migrations, permission changes, or config changes
6. **Preserve author intent** — if commit messages express design rationale, carry it into the description
7. **Trigger doc evolution after structural PRs** — if a PR adds new plugins, directories, commands, or scripts, recommend running `/aisa-evolve-target` after merge to keep skills and docs in sync with the new structure

## DO NOT

- Omit any of the 8 sections — always include all of them
- Write generic descriptions ("various improvements", "code cleanup")
- Fabricate a JIRA ticket, business reason, or technical claim
- Include file paths in the Changes Overview section
- Execute `gh pr create` or `gh pr edit` without explicit user approval
- Skip the plan-critique-improve cycle before presenting to the user

## Learning Capture

When creating pull requests, capture discoveries by appending to `.claude/learnings/log.md`.
Record entries for: repository PR conventions not covered by this skill, branch naming
patterns, CI requirements that affect PR descriptions, team-specific template preferences,
JIRA project key patterns, or review process quirks encountered while generating PR content.

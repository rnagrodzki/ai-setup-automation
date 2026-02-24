---
name: reviewing-changes
description: "Use this skill when reviewing code changes across project-defined dimensions (security, performance, docs, concurrency, etc.). Loads dimension definitions from .claude/review-dimensions/, matches them to changed files via glob patterns, dispatches parallel review subagents, deduplicates findings, and posts a consolidated PR comment. Triggers on: review changes, code review, review PR, multi-dimension review, run review."
---

# Reviewing Changes

Multi-dimension code review: load project dimensions, match to changed files,
dispatch parallel subagents, deduplicate findings, post consolidated PR comment.

Full templates (subagent prompt, comment format, example dimensions) are in
`REFERENCE.md` and `EXAMPLES.md` alongside this file. Locate them with Glob:
`**/reviewing-changes/REFERENCE.md`.

---

## Workflow

### Step 1 — Parse Arguments

Accept arguments passed from the `/sdlc:review` command or direct invocation:

- `--base <branch>` — base branch for diff (auto-detect if omitted)
- `--dimensions <name,...>` — comma-separated list to run (all matched by default)
- `--dry-run` — show review plan without dispatching subagents or posting comments

**Auto-detect base branch** (if `--base` not provided):

```bash
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'
```

If that fails, fall back to `main`, then `master`.

**Validate preconditions:**

```bash
git rev-parse --is-inside-work-tree
```

Warn (do not block) if `gh` CLI is unavailable — review can still run, posting the comment will be skipped.

---

### Step 2 — Discover and Validate Dimensions

Locate the plugin scripts directory with Glob: `**/sdlc-utilities/scripts/validate-dimensions.js`

Run the validation script:

```bash
node <plugin-scripts-path>/validate-dimensions.js --project-root . --json
```

Parse the JSON output:

- **If `.claude/review-dimensions/` is missing or empty** (zero dimensions found): stop with this message:
  ```
  No review dimensions found in .claude/review-dimensions/.
  Run /sdlc:review-init to scan your project and create tailored review dimensions.
  ```
- **If dimensions exist but all have ERRORs**: stop, show the validation output, prompt user to fix.
- **Dimensions with ERRORs**: exclude from this run, log which were excluded and why.
- **Dimensions with WARNINGs only**: include, but surface the warnings.
- **If `--dimensions` provided**: after validation, filter to only the named dimensions.

---

### Step 3 — Get Changed Files

```bash
git diff --name-only <base-branch>..HEAD
```

Collect the full list of changed files relative to the project root.

If the list is empty, inform the user: "No changed files found between this branch and `<base-branch>`."

---

### Step 4 (PLAN) — Match Dimensions to Changes

For each valid dimension:

1. Test each changed file against the dimension's `triggers` glob patterns
2. Remove any matched files that also match `skip-when` patterns
3. Record the matched file set per dimension
4. If matched files exceed the dimension's `max-files` limit: truncate to that limit and note "TRUNCATED"

Produce a **Review Plan** table:

```
| Dimension        | Matched Files | Severity | Status    |
|------------------|--------------|----------|-----------|
| security-review  | 8 files       | high     | ACTIVE    |
| code-quality     | 23 files      | medium   | ACTIVE    |
| performance      | 0 files       | medium   | SKIPPED   |
| api-review       | 55 files      | high     | TRUNCATED |
```

If `--dry-run`: present this table and stop.

---

### Step 5 (CRITIQUE) — Review the Plan

Before dispatching subagents, critique the plan:

- **Uncovered files**: are there changed files not matched by ANY dimension? List them.
- **Over-broad triggers**: any dimension matching >80% of all changed files? Flag it.
- **Subagent budget**: count active dimensions. If >8, note that prioritization will apply.
- **Trigger overlap**: any two dimensions matching identical file sets? Consider merging.

---

### Step 6 (IMPROVE) — Refine Plan

Based on critique:

- If >8 active dimensions: prioritize by (1) severity descending, (2) file count ascending. Run top 8; note any queued dimensions.
- Log uncovered files as a "No dimension covers these files" warning in the final output.

---

### Step 7 (DO) — Dispatch Parallel Subagents

For each active dimension, dispatch a subagent using the Task tool.
**Dispatch all dimensions in parallel in a single message** (multiple Task tool calls).

For each subagent, fill the prompt template from `REFERENCE.md` section 2:

- `{dimension.name}` and `{dimension.description}` from frontmatter
- `{dimension body}` — full Markdown body of the dimension file
- `{list of matched files}` — one file path per line
- `{filtered diff}` — run `git diff <base>..HEAD -- <file1> <file2> ...` for matched files
  - If `requires-full-diff: true`: include full file diff
  - Default: include only changed hunks
- `{dimension.severity}` — default severity from frontmatter

Collect all subagent results.

---

### Step 8 (CRITIQUE) — Review Results

After all subagents complete:

- **Duplicates**: same `file:line` flagged by multiple dimensions?
- **Contradictions**: two dimensions give conflicting recommendations for the same location?
- **Zero findings**: is a dimension's "no findings" credible given the diff, or did the subagent misunderstand?
- **Severity calibration**: any `info` finding that reads like `high`?

---

### Step 9 (IMPROVE) — Refine Findings

Based on critique:

- **Deduplicate**: keep the finding from the higher-severity dimension; add "Also flagged by: {other dimension}" note.
- **Contradictions**: keep both, add "Note: conflicting recommendations — manual review required."
- **Re-calibrate** any miscalibrated severities.

---

### Step 10 — Build and Post Consolidated Comment

Format the consolidated comment using the template in `REFERENCE.md` section 3.

**Compute verdict:**
- `CHANGES REQUESTED` — any `critical` finding, OR ≥ 3 `high` findings
- `APPROVED WITH NOTES` — any `high` finding, OR ≥ 5 `medium` findings
- `APPROVED` — all other cases

**Check for PR:**

```bash
gh pr view --json number,url 2>/dev/null
```

**If PR exists**: post the comment:

```bash
gh api repos/{owner}/{repo}/issues/{pr_number}/comments -f body="{comment}"
```

Get `{owner}` and `{repo}` from:

```bash
gh repo view --json owner,name
```

**If no PR exists**: present the complete review output in the terminal, then offer:
```
No PR found for branch '{branch}'.
Options:
  1. Create a draft PR to attach this review as a comment
  2. Save review to .claude/reviews/<branch>-<date>.md
  3. Keep results in terminal only (already shown above)
```

---

### Step 11 — Terminal Summary

Print summary regardless of where the comment was posted:

```
Review complete
  Dimensions run:  5 (2 skipped — no matching files)
  Total findings:  18
    critical: 1 | high: 4 | medium: 8 | low: 3 | info: 2
  Verdict: CHANGES REQUESTED
  PR comment: https://github.com/owner/repo/pull/42#issuecomment-123456
```

---

## Quality Gates

Before marking the review complete, verify:

- All active dimensions were dispatched and results collected
- Deduplication pass completed (Step 9)
- Consolidated comment contains all 4 sections: header, summary table, verdict, per-dimension details
- All findings reference a specific `file:line`
- Verdict was computed from actual severity counts (not hardcoded)

---

## Learning Capture

Log to `.claude/learnings/log.md` when:

- A dimension's `triggers` pattern causes high false-activation (many unrelated files matched) — note the pattern and actual match rate
- Changed files are consistently uncovered by any dimension — note the file pattern and potential new dimension name
- A subagent returns "No findings" on a diff that visibly contains issues — note the dimension name and what was missed
- The same `file:line` is flagged by 3+ dimensions — the dimensions likely overlap and should be refined

## See Also

- `REFERENCE.md` — dimension format spec, subagent prompt template, comment template
- `EXAMPLES.md` — 5 ready-to-use example dimension files
- `sdlc:initializing-review-dimensions` — creates tailored dimensions for a project from scratch

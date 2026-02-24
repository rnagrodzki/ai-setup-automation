# reviewing-changes — Reference

Supporting reference for the `sdlc:reviewing-changes` skill.
Contains: dimension file format spec, subagent prompt template, consolidated comment template.

See `EXAMPLES.md` (in this directory) for 5 copy-paste-ready example dimension files.

---

## 1. Dimension File Format

Each project defines review dimensions as `.md` files in `<project>/.claude/review-dimensions/`.

### Schema

```yaml
---
name: <string>              # REQUIRED. Lowercase letters, digits, hyphens. Max 64 chars. Unique.
description: <string>       # REQUIRED. What this dimension reviews. Max 256 chars.
triggers:                   # REQUIRED. Non-empty array of glob patterns. At least one pattern.
  - "**/*.pattern"
  - "**/directory/**"
skip-when:                  # OPTIONAL. Negative globs — matched files are excluded even if triggers match.
  - "**/*.md"
  - "**/testdata/**"
severity: medium            # OPTIONAL. Default: medium. One of: critical | high | medium | low | info
max-files: 100              # OPTIONAL. Default: 100. Positive integer. Files over this limit are truncated with a warning.
requires-full-diff: false   # OPTIONAL. Default: false. If true, subagent receives the full diff for matched files.
---

[Review instructions body — free-form Markdown, minimum 10 characters]
```

### Field reference

| Field | Required | Type | Default | Constraints |
|-------|----------|------|---------|-------------|
| `name` | Yes | string | — | Lowercase, digits, hyphens; max 64 chars; unique across all dimension files |
| `description` | Yes | string | — | Non-empty; max 256 chars |
| `triggers` | Yes | string[] | — | Non-empty array; each must be valid glob syntax |
| `skip-when` | No | string[] | `[]` | Each must be valid glob syntax |
| `severity` | No | string | `medium` | One of: `critical`, `high`, `medium`, `low`, `info` |
| `max-files` | No | integer | `100` | Positive integer |
| `requires-full-diff` | No | boolean | `false` | — |

### Body content

The Markdown body below the frontmatter contains the review instructions passed verbatim to the subagent.
There is no enforced section structure — the author decides what the subagent needs.

Recommended elements:
- A brief statement of the dimension's focus
- A checklist of specific things to look for
- A severity guide (what constitutes critical vs. high vs. medium for this dimension)
- Project-specific context (e.g., "This project uses Express.js — check for missing middleware")

---

## 2. Subagent Prompt Template

When the skill dispatches a review subagent for a dimension, it fills this template:

```
# Code Review: {dimension.name}

## Your Role
You are a code reviewer focused exclusively on: {dimension.description}

## Review Instructions
{dimension body — full Markdown content below the frontmatter}

## Changed Files in Your Scope
{list of matched files, one per line}

## Diff to Review
{filtered diff — only hunks from matched files}

## Default Severity
Unless the review instructions specify otherwise, classify findings as: {dimension.severity}

## Output Format
Return your findings as a structured list. Each finding MUST follow this exact format:

### Finding N
- **File**: {relative file path}
- **Line**: {line number or range, e.g., 42 or 42-48}
- **Severity**: {critical|high|medium|low|info}
- **Title**: {one-line summary, max 80 chars}
- **Description**: {what is wrong and why it matters, 1-3 sentences}
- **Suggestion**: {how to fix it, 1-3 sentences — "N/A" if no clear fix}

## Constraints
- Review ONLY the files listed above — do not read other files
- Review ONLY for the concerns described in the review instructions — stay in scope
- If you find ZERO issues, explicitly state: "No findings for this dimension."
- Do NOT fabricate issues
- Each finding must reference a specific file and line number
- Maximum 20 findings (prioritize by severity if more exist)
```

**Diff scoping:**
- When `requires-full-diff` is `false` (default): subagent receives only the diff hunks for its matched files
- When `requires-full-diff` is `true`: subagent receives the complete diff output for those files

---

## 3. Consolidated PR Comment Template

After all subagents complete and findings are deduplicated, post this as a single PR comment:

```markdown
## Code Review — {N} dimension(s), {M} finding(s)

> Automated review by `sdlc:reviewing-changes` · {date}

### Summary

| Dimension | Findings | Critical | High | Medium | Low | Info |
|-----------|----------|----------|------|--------|-----|------|
| {name} | {total} | {critical} | {high} | {medium} | {low} | {info} |
| **Total** | **{total}** | **{critical}** | **{high}** | **{medium}** | **{low}** | **{info}** |

### Verdict: {CHANGES REQUESTED | APPROVED WITH NOTES | APPROVED}

{One-sentence overall assessment}

---

### {dimension.name} — {N} finding(s)

<details>
<summary>{critical} critical · {high} high · {medium} medium · {low} low · {info} info</summary>

#### [{SEVERITY}] {title}
**File:** `{file}:{line}`
{description}
**Suggestion:** {suggestion}

</details>

---
```

**Verdict computation:**
- `CHANGES REQUESTED` — any `critical` finding, or ≥ 3 `high` findings
- `APPROVED WITH NOTES` — any `high` finding, or ≥ 5 `medium` findings
- `APPROVED` — all other cases (low/info only, or nothing)

**Deduplication rule:** When two dimensions flag the same `file:line`, keep the finding from the higher-severity dimension. Add a note: "Also flagged by: {other dimension}."

**Contradiction rule:** When two dimensions give conflicting recommendations for the same `file:line`, keep both findings and add: "Note: conflicting recommendations — manual review required."

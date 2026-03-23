---
name: aisa-audit
user-invocable: true
description: "Use this skill when you need a deep read-only review of .claude/ content accuracy. Triggers: audit AI configuration, review skills accuracy, check principle compliance, find outdated code examples, identify coverage gaps, validate skill specificity. Reports HEALTHY / NEEDS_ATTENTION / CRITICAL."
argument-hint: "[project-root-path — defaults to current directory]"
---

# AI Configuration Deep Audit

Deep review of the AI configuration for the current project. Runs mechanical verification
to report exactly what exists, what passes checks, what fails, and why. Does not
create or modify any files.

## Scope

Optional target: `$ARGUMENTS` — if provided, treat as the project root path.
If not provided, use the current working directory.

## Instructions

### Step 1 — Detect Tech Stack

Examine the project to determine its technology stack. Run the following checks in parallel:

```bash
ls package.json tsconfig.json 2>/dev/null && echo "Node.js/TypeScript detected"
ls go.mod go.sum 2>/dev/null && echo "Go detected"
ls pyproject.toml setup.py requirements.txt 2>/dev/null && echo "Python detected"
ls Cargo.toml 2>/dev/null && echo "Rust detected"
ls Makefile Taskfile.yml 2>/dev/null && echo "Build tool found"
```

Record: detected language, framework (if identifiable), and build tool.

### Step 2 — Run Mechanical Verification

Locate the verification script using `Glob` for `**/verify-setup.js`. Run both checks
below in parallel.

#### Step 2a — Health Check

```bash
node <plugin-path>/scripts/verify-setup.js health --project-root . --markdown
```

This checks (and reports PASS/FAIL per item):

- **Pass A** — every file path referenced in each skill/agent exists on disk
- **Pass G / P1** — each skill has a `## Learning Capture` section referencing `.claude/learnings/log.md`
- **Pass G / P2** — each skill has a `## Quality Gates` section with at least one gate
- **Pass G / P3** — each skill follows a Plan→Critique→Improve→Do→Critique→Improve cycle
- **Pass G / A1–A6** — each agent has valid frontmatter (`name`, `description`, `model`),
  valid built-in tools only, capability-tool consistency, a self-review step, learning capture,
  and only valid skill references
- **CLAUDE.md table diff** — skills/agents listed in CLAUDE.md match files actually on disk
- **Learnings inbox** — count of ACTIVE / PROMOTED / STALE entries

#### Step 2b — Principle Compliance Check

```bash
node <plugin-path>/scripts/verify-setup.js validate --project-root . --markdown
```

This runs the same P1–P3 and A1–A6 checks with per-item PASS/FAIL verdicts and a
proposed fix for every failure.

### Step 3 — Present Audit Report

Present the report in two clearly labeled sections.

```text
## AI Configuration Review — [project name]

Detected stack: [language], [framework], [build tool]

---

### Part 1: Mechanical Checks  (objective — verify-setup.js)

#### Health Check
[paste --markdown output from Step 2a verbatim]

#### Principle Compliance
[paste --markdown output from Step 2b verbatim]

---

### Part 2: Supplementary Observations  (LLM judgment — not mechanical)

Spot-check 2–3 items the script cannot verify:

1. **Content accuracy**: Pick 2–3 claims from CLAUDE.md (e.g. build commands, test
   commands, project conventions) and verify them against actual files/code.
   Report each as: "Checked [claim] — confirmed ✅" or "Checked [claim] — contradicts
   actual code ❌ ([what the code actually shows])"

2. **Skill specificity**: For 1–2 skills, check whether code examples reference actual
   functions/types from this project (not generic placeholders).
   Report: "Checked skill [name] — project-specific ✅" or "generic placeholders ❌"

3. **Coverage gaps**: Based on detected tech stack, note if any major area lacks a skill
   (e.g. "Go project with no testing skill detected").

---

### Overall Verdict

Script: [HEALTHY or NEEDS_ATTENTION or CRITICAL] + [COMPLIANT or HAS_ISSUES or NON_COMPLIANT]
Supplementary: [N] additional findings

### Recommendations

[high]   — [only for FAIL/CRITICAL items from the script]
[medium] — [supplementary findings or content accuracy failures]
[low]    — [nice-to-have improvements]
```

## Quality Gates

Before presenting the audit report, verify all of the following:

- [ ] Tech stack detection commands were run and results recorded
- [ ] Both `health` and `validate` script invocations completed without errors
- [ ] Every FAIL in the mechanical checks has a corresponding recommendation with priority
- [ ] Part 2 supplementary observations cover all three areas: content accuracy, skill specificity, coverage gaps
- [ ] Overall Verdict reflects the combined script output (not just one of the two checks)
- [ ] No files were created or modified during the audit

## DO NOT

- DO NOT create or modify any files — this is a read-only skill
- DO NOT attempt to fix issues found during the audit — report them and suggest the appropriate corrective skill
- DO NOT run `validate` without first running `health` — both are required for a complete picture
- DO NOT skip the supplementary observations in Part 2 — mechanical checks cannot catch semantic drift
- DO NOT classify a skill without running at least one verification command against it

## See Also

- Principle compliance failures → run `aisa-lint` (can auto-fix with approval)
- Missing or outdated skills/agents → run `aisa-update <area>`
- Full rebuild needed → run `aisa-init`

## Learning Capture

If the audit reveals systemic patterns — e.g., multiple skills missing Quality Gates, widespread
outdated code examples, or a class of coverage gaps tied to the tech stack — append entries to
`.claude/learnings/log.md` using the standard format. This signals that architect or evolver
templates may need updating.

If no new patterns are found, note explicitly: "No new systemic patterns detected in this audit run."

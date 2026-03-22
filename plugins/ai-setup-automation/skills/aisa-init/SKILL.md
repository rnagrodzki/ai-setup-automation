---
name: aisa-init
user-invocable: true
description: "Use this skill when initializing or rebuilding AI-assisted development configuration for a project. Scans the project tech stack and generates a complete .claude/ setup (CLAUDE.md, skills, agents, learnings, cache) from scratch."
argument-hint: "[specs-path]"
---

# Project Skills & Agents Architect

Build the complete `.claude/` configuration for this project from scratch.

## Quick Start

Specs location: `$ARGUMENTS` (default: `specs/` or `openspec/` — auto-detected if not specified)

## Step 0: Prerequisites — Check Existing Configuration

Before starting the pipeline, check whether an AI configuration already exists in this project.

Run the following checks:

```bash
test -f CLAUDE.md && echo "CLAUDE.md exists" || echo "CLAUDE.md missing"
test -d .claude && echo ".claude/ exists" || echo ".claude/ missing"
test -d .claude/skills && echo "skills/ exists" || echo "skills/ missing"
test -d .claude/agents && echo "agents/ exists" || echo "agents/ missing"
test -d .claude/learnings && echo "learnings/ exists" || echo "learnings/ missing"
test -d .claude/cache && echo "cache/ exists" || echo "cache/ missing"
```

**If ANY of `CLAUDE.md`, `.claude/skills/`, or `.claude/agents/` already exist**, stop and present the following choice to the user:

```text
Existing AI configuration detected:
  ✅ CLAUDE.md                  [present / missing]
  ✅ .claude/skills/            (N skills)
  ✅ .claude/agents/            (N agents)

What would you like to do?

  1. Audit  — review what exists, report gaps, suggest improvements (non-destructive)
  2. Rebuild — remove existing .claude/ and CLAUDE.md, regenerate from scratch

⚠️  Option 2 will DELETE all existing skills, agents, and learnings. This cannot be undone.
```

Wait for user choice:
- If **"audit"** (or 1): Run the audit skill (`aisa:aisa-audit`). Do NOT proceed with setup.
- If **"rebuild"** (or 2): Confirm once more, then continue to Phase 1 below.
- If **nothing exists** (fresh project): proceed directly to Phase 1 — no prompt needed.

## Instructions

Read the full pipeline specification in `REFERENCE.md` (in this skill's directory) and execute it.

The pipeline has 6 phases with 2 mandatory quality gates:

```
Phase 1 — Discovery          → scan project structure, docs/, specs/, code, learnings
Phase 2 — Architecture Design → propose skills & agents across technical/business/design
Phase 3 — Architecture Critique ← QUALITY GATE (must pass before generating)
Phase 4 — Generation          → produce all skill, agent, learnings, and CLAUDE.md files
Phase 5 — Generation Critique  ← QUALITY GATE (must pass before wiring)
Phase 6 — Wiring & Validation → write files, verify references, commit
```

## Critical Rules (from REFERENCE.md)

1. **Discover, don't assume** — every skill/agent justified by evidence in code/docs/specs
2. **Code is ground truth** — when docs and code disagree, code wins
3. **Three-dimensional domains** — evaluate technical (how), business (what/why), design (experience)
4. **Functional-first testing** — functional tests by default, mock only at lowest external boundary
5. **Specificity is #1** — "could this have been produced without analyzing THIS project?" If yes → rewrite
6. **Critique is mandatory** — never skip quality gates; a critique finding zero issues is suspicious
7. **Learning system included** — generate `.claude/learnings/` infrastructure for continuous knowledge capture

## Principle Enforcement on Generated Output

Every skill and agent you generate MUST pass the principle checklists defined in
`.claude/skills/aisa-principles/SKILL.md` (Skill Principles P1-P3, Agent Principles A1-A6).
Validate before completing Phase 5. Exception: `openspec-*` skills are exempt from Quality Gates.

If any generated file fails these checks → fix it before moving to Phase 6. Do not defer.

## Required Output Format

Every phase MUST produce a visible section header and summary before pausing or proceeding.
Use this structure (adapt content to findings):

```
## Phase 1 — Discovery Report
{project structure, tech stack, specs found, existing learnings — 4-8 lines}

[PAUSE — awaiting approval to proceed to Phase 2]

## Phase 2 — Architecture Design
{N skills proposed across technical/business/design dimensions; agents: N proposed or "none (Rule 7 not met)"}

## Phase 3 — Architecture Critique ← QUALITY GATE
### Critique Findings
{specificity check, domain coverage, principle compliance — list any issues found}
### Simulation
{pick one proposed skill, walk through a representative task to verify it adds value}
### Verdict
{PASS / FAIL with revision required}

[PAUSE] **Please review the Architecture Critique above and confirm you'd like to proceed to file generation, or request revisions.**

## Phase 4 — Generation
{list of files being generated with brief rationale for each — e.g., .claude/skills/foo/SKILL.md, .claude/agents/bar.md, .claude/learnings/log.md, CLAUDE.md}

## Phase 5 — Generation Critique ← QUALITY GATE
### Critique Findings
{principle checks P1-P3/A1-A6 per generated file; spot-check one file with verify command}
### Verdict
{PASS / FAIL}

[PAUSE — awaiting approval to proceed to Phase 6]

## Phase 6 — Wiring & Validation
{files written; references verified; commit summary}

## Learnings
{discoveries captured in .claude/learnings/log.md, or "No new patterns detected — learnings
infrastructure created for future entries"}
```

## Quality Gate

Before delivering any phase output, perform an internal verification:

- [ ] Every proposed skill is justified by evidence from the Discovery phase (no assumptions)
- [ ] Architecture Critique (Phase 3) contains specific findings — not a rubber-stamp "looks good"
- [ ] Generation Critique (Phase 5) verifies each generated file against P1-P3 / A1-A6 principles
- [ ] At least one generated skill was spot-checked with a representative task simulation
- [ ] The `## Learnings` section appears in the final output (even if it states "No new patterns detected")
- [ ] No phase was skipped — all phase headers are visible in the output

If any item fails, correct it before presenting output.

## Pause Points

After Phase 1 (Discovery Report) — present findings, wait for approval.
After Phase 3 (Architecture Critique) — present critique, wait for approval.
After Phase 5 (Generation Critique) — present quality scores, wait for approval.

## Execution Mode Recommendation

During Phase 2 (Architecture Design), assess the planned topology size and recommend an
execution mode for `aisa-sync` lifecycle. Include in CLAUDE.md if Agent Teams are warranted.

## Output

Creates:
- `.claude/skills/` — project-specific portable expertise files
- `.claude/agents/` — autonomous executor definitions
- `.claude/learnings/log.md` — learning journal
- `.claude/learnings/README.md` — learning system docs
- `.claude/cache/snapshot.json` — initial cache for incremental evolution
- `CLAUDE.md` — project configuration with spec-driven workflow

## Post-Setup Verification

After Phase 6 (Wiring & Validation) completes, run the following verification steps:

1. Locate `verify-setup.js` by searching for `**/verify-setup.js` (Glob).
2. Run health check:
   ```bash
   node <plugin-path>/scripts/verify-setup.js health --project-root . --markdown
   ```
3. Run principle compliance check:
   ```bash
   node <plugin-path>/scripts/verify-setup.js validate --project-root . --markdown
   ```
4. Present the verification report in this format:

```text
## Setup Complete — Verification Report

### Files Created
[list all files]

### Health Check
[paste output verbatim]

### Principle Compliance
[paste output verbatim]

### Overall Verdict
- Both scripts exit 0 → "Setup verified — all checks pass ✅"
- Any FAIL items → list each one explicitly

### Next Steps
- To add more skills: see docs
- If issues found: run `/aisa:aisa-lint`
- For scoped updates later: run `/aisa:aisa-update <area>`
```

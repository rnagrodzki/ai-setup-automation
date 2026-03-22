---
name: aisa-scaffolder
description: "Scan project tech stack and generate a complete .claude/ setup (CLAUDE.md, skills, agents, learnings, cache) from scratch. Use when setting up a new project or doing a full rebuild of the AI-assisted development configuration."
argument-hint: "[specs-path]"
user-invocable: false
---

# Project Skills & Agents Architect

Build the complete `.claude/` configuration for this project from scratch.

## Quick Start

Specs location: `$ARGUMENTS` (default: `specs/` or `openspec/` — auto-detected if not specified)

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
execution mode for `aisa-syncer` lifecycle. Include in CLAUDE.md if Agent Teams are warranted.

## Output

Creates:
- `.claude/skills/` — project-specific portable expertise files
- `.claude/agents/` — autonomous executor definitions
- `.claude/learnings/log.md` — learning journal
- `.claude/learnings/README.md` — learning system docs
- `.claude/cache/snapshot.json` — initial cache for incremental evolution
- `CLAUDE.md` — project configuration with spec-driven workflow

---
name: aisa-evolve-validate
description: "Validate all skills and agents against architectural principles — self-learning, Plan→Do→Critique→Improve, structural completeness. Does NOT check codebase accuracy. Use after introducing new skills/agents, or as a pre-flight check before committing."
argument-hint: "[path-to-specific-file-or-directory]"
---

# Skills & Agents Principle Validation

Validate `.claude/` skills and agents against architectural principles and workflow patterns.
Checks structural correctness and required patterns — does NOT verify content accuracy
against the codebase (that's `/aisa-evolve-health`'s job).

Use this when: new skills/agents are introduced, before committing skill changes, after manual edits,
or as a pre-flight gate in any workflow that creates/modifies `.claude/` files.

## Scope

Optional target: `$ARGUMENTS` — if provided, validate only the specified file(s) or directory.
If not provided, validate ALL skills and agents in `.claude/`.

## Instructions

Read the detailed check procedures in `REFERENCE.md` (in this skill's directory) for exact
grep patterns and validation logic. The principle definitions are in
`.claude/skills/aisa-evolve-principles/SKILL.md` (Skill P1-P3, Agent A1-A6).

### Step 1 — Inventory (Cache-Aware)

Check `.claude/cache/snapshot.json` for cached principle compliance flags:
- If cache exists: compare hashes, skip files UNCHANGED with all principle flags `true`
- Only re-validate: MODIFIED, NEW, and previously FAILED files
- Report: `"Cache hit: {N} already compliant (skipped), {N} require validation"`

If no cache or `$ARGUMENTS` targets specific files, validate everything in scope.

### Step 2 — Skill Principle Validation

For each skill (except `openspec-*`), run checks 2a-2c from REFERENCE.md:
- **2a** Self-Learning Directive (grep for `learnings/log.md` / `Learning Capture`)
- **2b** Quality Gates / Critique-Improve Cycle (grep for `Quality Gates` / `pass criteria`)
- **2c** Plan → Do → Critique → Improve pattern in workflow

### Step 3 — Agent Principle Validation

For each agent, run checks 3a-3f from REFERENCE.md:
- **3a** Frontmatter completeness (name, description, model, tools)
- **3b** Tool validity (against valid tools list in principles file)
- **3c** Capability-tool consistency
- **3d** Workflow self-review step
- **3e** Learning Capture section
- **3f** Skill references valid (files exist on disk)

### Step 4 — Report

Present using the report templates from REFERENCE.md: skill compliance table,
agent compliance table, issues table with concrete proposed fixes.

Overall status: COMPLIANT / HAS ISSUES / NON-COMPLIANT

### Step 5 — Apply Fixes (optional)

If issues found:
1. Present report and proposed fixes
2. Ask: "Apply all fixes? / Select which to apply? / Report only?"
3. If approved: apply surgically — insert missing pieces only. Use templates from
   `.claude/skills/aisa-evolve-principles/SKILL.md` for missing sections.
4. Commit: `chore: fix principle compliance in {N} skills/agents`

## Quality Gate

Before presenting the validation report, verify:
- [ ] Every skill checked for all 3 principle requirements (2a, 2b, 2c)
- [ ] Every agent checked for all 6 structural requirements (3a-3f)
- [ ] Every FAIL has a concrete proposed fix (exact content to add, not just "add this section")
- [ ] `openspec-*` skills correctly marked EXEMPT for Quality Gates

## Cache Update

After validation, update `.claude/cache/snapshot.json` with principle compliance flags
for all validated files. This allows subsequent runs to skip compliant, unchanged files.

## Learning Capture

If validation reveals systemic patterns (e.g., "all agents missing self-review", "no skills
have Quality Gates"), capture as a meta-learning entry in `.claude/learnings/log.md` — this
signals that architect or evolver templates may need updating.

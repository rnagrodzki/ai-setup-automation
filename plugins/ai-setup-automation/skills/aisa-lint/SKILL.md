---
name: aisa-lint
user-invocable: true
description: "Lint skills/agents for structural completeness and principle compliance (P1-P3, A1-A6) — does not check codebase accuracy. Use after introducing new skills/agents, or as a pre-flight check before committing."
argument-hint: "[path-to-specific-file-or-directory]"
---

# Skills & Agents Principle Validation

Validate `.claude/` skills and agents against architectural principles and workflow patterns.
Checks structural correctness and required patterns — does NOT verify content accuracy
against the codebase (that's `/aisa:aisa-inspect`'s job).

Use this when: new skills/agents are introduced, before committing skill changes, after manual edits,
or as a pre-flight gate in any workflow that creates/modifies `.claude/` files.

## Scope

Optional target: `$ARGUMENTS` — if provided, validate only the specified file(s) or directory.
If not provided, validate ALL skills and agents in `.claude/`.

## Instructions

Read the detailed check procedures in `REFERENCE.md` (in this skill's directory) for exact
grep patterns and validation logic. The principle definitions are in
`.claude/skills/aisa-principles/SKILL.md` (Skill P1-P3, Agent A1-A6).

### Step 1 — Run the Validation Script

Locate the script with `Glob` for `**/verify-setup.js`, then run:

```bash
node <plugin-path>/scripts/verify-setup.js validate --project-root . --json
```

If validating a specific file or directory, add `--target <path>`.

The script outputs JSON with:
- Skill structural checks S1 (layout), S2 (frontmatter), S3 (name), S4 (description), S5 (line count)
- Skill principle checks 2a (learning capture), 2b (quality gates), 2c (PCIDCI pattern)
- Agent checks 3a (frontmatter), 3b (tools), 3c (capability-tool warnings), 3d (self-review), 3e (learning), 3f (skill refs)
- Skill competency overlap pairs (S6 WARNING) in `skill_overlap` field
- `issues` array with proposed fixes for every failure
- `overall`: COMPLIANT / HAS_ISSUES / NON-COMPLIANT

Cache-aware: UNCHANGED files with all flags passing are skipped automatically.

### Step 2 — Review and Supplement

Use the script's JSON output as ground truth for all mechanical checks.
Focus your effort on items the script cannot evaluate mechanically:

- **2c deep check** — For any skill with `check_2c_pcidci: false`: read the workflow section and determine whether it genuinely lacks critique gates or expresses the PCIDCI pattern (plan critique + output critique) in an unconventional way.
- **3c warnings** — Review each capability-tool warning in context. These are flags for review, not hard failures — verify whether the agent actually performs the claimed capability.

### Step 3 — Agent Principle Validation (supplementary)

The script covers 3a-3f mechanically. If `$ARGUMENTS` targets a specific agent and you need
deeper analysis, cross-reference with the Agent Principle Checklist in
`.claude/skills/aisa-principles/SKILL.md` (A1-A6).

### Step 4 — Report

Present using the report templates from REFERENCE.md: skill compliance table,
agent compliance table, issues table with concrete proposed fixes.

Overall status: COMPLIANT / HAS ISSUES / NON-COMPLIANT

**MANDATORY**: Always close the report with a `## Learnings` section — this applies whether linting a single file or the full `.claude/` directory. Never omit it.

```markdown
## Learnings

{If systemic patterns were detected (e.g. "all agents missing self-review", "no skills have
Quality Gates"), summarize them here and note they have been captured in .claude/learnings/log.md.
If no new patterns were detected, explicitly state: "No new systemic patterns detected in this run."}
```

This section must always be present — it is the evidence that learning capture ran. Produce it even when the scope is a single file and no issues were found.

### Step 5 — Competency Overlap Review

Review the `skill_overlap` section of the JSON output (or "Skill Competency Overlap" section in markdown output).

For each flagged pair (overlap score ≥ 0.4):
1. Read both skills in full
2. Determine if the overlap is genuine duplication or legitimate decomposition
3. Report verdict per the template in REFERENCE.md

If genuine duplication is found:
- Identify which skill should be the "owner" of the overlapping capability
- Recommend: other skill removes the duplicated steps and delegates to the owner skill
- Propose concrete edit (which section to remove, which reference to add)

If no overlap pairs: note "No competency overlap detected ✅"

### Step 6 — Apply Fixes (optional)

If issues found:
1. Present report and proposed fixes
2. Ask: "Apply all fixes? / Select which to apply? / Report only?"
3. If approved: apply surgically — insert missing pieces only. Use templates from
   `.claude/skills/aisa-principles/SKILL.md` for missing sections.
4. Commit: `chore: fix principle compliance in {N} skills/agents`

## Quality Gate

Before presenting the validation report, verify:
- [ ] Every skill checked for structural compliance (S1-S5: layout, frontmatter, name, description, line count)
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

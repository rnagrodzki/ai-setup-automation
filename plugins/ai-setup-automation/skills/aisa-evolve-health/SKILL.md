---
name: aisa-evolve-health
description: "Quick health check of the .claude/ setup. Runs snapshot and drift audit only — no expansion, no changes unless critical issues found. Use weekly or before sprints."
---

# Skills & Agents Health Check

Lightweight verification — read-only unless critical drift is found.

## Instructions

Execute only Phase 1 (Snapshot) and Phase 2 (Drift Audit) from the Evolver pipeline
defined in `.claude/skills/aisa-evolve/REFERENCE.md`.

**Do NOT execute** Phases 3-7. This is a diagnostic, not an update cycle.

### Step 1 — Snapshot (Cache-First)

Check `.claude/cache/snapshot.json` first:
- If exists and fresh (<2 weeks) → incremental scan: hash current files, compare, only deep-read MODIFIED/NEW files
- If missing or stale → full scan: inventory all files in `.claude/skills/`, `.claude/agents/`, `CLAUDE.md`, `.claude/learnings/log.md`

Report scan mode: `"Cache hit: {N} unchanged, {N} modified, {N} new — deep-reading {N} files"` or `"No cache — full scan"`

Scan the current project for changes since the setup was last touched.

### Step 2 — Lightweight Drift Audit

This is a FAST health check, not a full audit. Run these quick passes only:

**Fast Pass A — File path verification (per skill):**
For every file path referenced in a skill, run `ls {path}`. FAIL = path doesn't exist.
This is the highest-signal, lowest-cost check.

**Fast Pass G — Workflow maturity (per skill/agent):**
Apply Skill Principles P1-P3 and Agent Principles A1-A6 from
`.claude/skills/aisa-evolve-principles/SKILL.md`. These are grep-based, fast checks.

**Fast Pass F — Code example spot-check (1 per skill, not all):**
For the single most critical code example per skill, compare against actual code.
Skip this for skills with no code examples (pure rule/convention skills).

**Checks NOT run in health mode** (save for full `/aisa-evolve`):
- Symbol verification (Pass B) — expensive grep across src
- Error code verification (Pass C) — expensive cross-reference
- Route/endpoint verification (Pass D) — needs router analysis
- Version compatibility (Pass E) — rare drift, check monthly

**CLAUDE.md quick check:**
- Skills/agents tables match actual files? (compare list vs `ls .claude/skills/ .claude/agents/`)
- Test commands still work? (run one: e.g., `go test ./... 2>&1 | head -5` or equivalent)

Classify each file: **CURRENT** / **OUTDATED** / **STALE** / **CRITICAL**

Classification guidance for workflow maturity:
- Missing self-learning directives → OUTDATED minimum
- Missing critique-improve cycle → OUTDATED minimum
- These don't escalate to CRITICAL alone, but compound with other drift signals

**Verification requirement**: Run at least one mechanical check (e.g., `ls` a referenced path, `grep` a referenced symbol) per audited skill before classifying. Do not classify a skill based on reading alone.

### Step 3 — Report

Present a concise health report:

```
## Health Check Report — {date}

### Overall: [HEALTHY / NEEDS ATTENTION / CRITICAL]

### Skills ({N} total)
✅ CURRENT: {list}
⚠️  OUTDATED: {list with one-line reason}
🗑️  STALE: {list with one-line reason}
❌ CRITICAL: {list with one-line reason — these need immediate fixes}

### Agents ({N} total)
{same format — classify as CURRENT/OUTDATED/STALE/CRITICAL}

### Principle Compliance Summary
| File | Type | Self-Learning | Quality Gates | Plan→Do→Critique→Improve | Tools Valid |
|------|------|--------------|---------------|--------------------------|-------------|
| {name} | skill/agent | ✅/❌ | ✅/❌/EXEMPT | ✅/❌ | ✅/❌/N/A |

### CLAUDE.md: [CURRENT / OUTDATED / STALE]
{one-line summary if not CURRENT}

### Learnings Inbox
- ACTIVE entries: {N} (oldest: {date})
- Recommended: {run /aisa-evolve-harvest if >10 ACTIVE entries or oldest >2 weeks}

### Recommended Actions
1. {highest priority action}
2. {next priority}
...
```

### Auto-Fix Rule

If CRITICAL drift is found (a skill states something actively wrong):

- Present the issue and ask for permission to apply a targeted fix
- If approved: fix only the CRITICAL items, commit with message `fix: correct critical skill drift in {file}`
- Do NOT fix OUTDATED or STALE items — those require the full `/aisa-evolve` cycle

## Quality Gate

Before presenting the health report, verify:

- [ ] At least one verification command (e.g., `ls`, `grep`) was run per audited skill before classifying
- [ ] Every OUTDATED classification has a stated reason grounded in a specific check result
- [ ] Recommended Actions are ordered by severity: CRITICAL → OUTDATED → STALE
- [ ] If any skill was classified without running a verification command, re-run the check before finalizing

## Cache Update

After the health report is complete, update `.claude/cache/drift-report.json` with the audit
results (status per file: CURRENT/OUTDATED/STALE/CRITICAL). This allows the next health check
or evolution run to start from a known baseline.

If files were scanned for the first time (no prior cache), also write/update `snapshot.json`
with their hashes and principle compliance flags.

## See Also

- If CRITICAL drift found → apply fix, then run `/aisa-evolve-validate` to verify principle compliance
- If >10 ACTIVE learning entries → run `/aisa-evolve-harvest`
- If significant drift across many skills → run full `/aisa-evolve`
- If OUTDATED skills need updating → run `/aisa-evolve-target <area>` for scoped fixes

## Learning Capture

If discoveries are made during the health check (e.g., undocumented pattern changes, broken conventions,
surprising drift patterns), append entries to `.claude/learnings/log.md` using the standard format.

---
description: Quick read-only drift scan — compares .claude/ skills and agents against current codebase state, reports CURRENT / OUTDATED / STALE / CRITICAL per file. Run weekly; fixes only CRITICAL issues with approval
allowed-tools: [Read, Glob, Grep, Bash, Skill, TodoWrite]
---

# /inspect Command

Quick read-only drift check of the `.claude/` setup — no changes unless critical
issues are found. Reports status of every skill, agent, and CLAUDE.md file.

## Usage

- `/aisa:inspect` — Run drift check across the full `.claude/` setup

## Workflow

Invoke the `aisa-checker` skill.

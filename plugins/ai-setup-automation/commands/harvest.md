---
description: Promote ACTIVE entries from .claude/learnings/log.md into skill gotchas, new skills, and documentation. Run when log has 10+ entries or oldest entry exceeds 2 weeks
allowed-tools: [Read, Glob, Grep, Bash, Skill, TodoWrite, Write, Edit]
---

# /harvest Command

Process ACTIVE entries in `.claude/learnings/log.md` — promotes recurring patterns into skill
gotchas, creates new skills for uncovered domains, and fills documentation gaps.

## Usage

- `/aisa:harvest` — Process all ACTIVE learning log entries

Run when the log has 10+ ACTIVE entries or the oldest entry is more than 2 weeks old.

## Workflow

Invoke the `aisa-harvester` skill.

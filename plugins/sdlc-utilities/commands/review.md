---
description: Run multi-dimension code review on the current branch using project-defined review dimensions
allowed-tools: [Glob, Bash, Skill, Agent]
argument-hint: "[--base <branch>] [--dimensions <name,...>] [--dry-run]"
---

# /review Command

Invoke the `reviewing-changes` skill, passing all `$ARGUMENTS`.

All validation (git state, base branch detection, uncommitted changes warning,
dimension discovery) is handled by the `review-prepare.js` script inside the skill.

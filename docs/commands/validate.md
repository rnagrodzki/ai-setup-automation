# `/aisa:validate` — Validate skills and agents against architectural principles

Checks every skill and agent in `.claude/` against the plugin's architectural requirements: self-learning directives, the mandatory Plan→Critique→Improve→Do→Critique→Improve cycle, structural completeness, and valid frontmatter. Does **not** check whether skill content is accurate to your codebase — use [`/aisa:audit`](audit.md) for that.

## Usage

```text
/aisa:validate
/aisa:validate <path>
```

## Flags

| Flag | Description | Default |
| --- | --- | --- |
| `<path>` | Optional path to a specific file or directory to validate | all of `.claude/` |

## Examples

```text
/aisa:validate
```

> Validates all skills and agents in `.claude/`. Prints a PASS/FAIL verdict per check for each file, with a proposed fix for every failure.

```text
/aisa:validate .claude/skills/my-new-skill/SKILL.md
```

> Validates only the specified skill file — useful after writing a new skill.

```text
/aisa:validate .claude/agents/
```

> Validates all agent files in the `agents/` directory.

## Prerequisites

- An existing `.claude/` directory with skills or agents to validate

## What It Creates / Modifies

Read-only by default. When failures are found, the command proposes fixes and asks for approval before applying any changes.

## Related Commands

- [`/aisa:audit`](audit.md) — includes validation plus LLM spot-check of content accuracy
- [`/aisa:target`](target.md) — update skills after validation reveals outdated content
- [`/aisa:evolve`](evolve.md) — full cycle that includes validation as a built-in step

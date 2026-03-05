# `/aisa:lint` — Lint skills and agents for structural completeness and principle compliance

Checks every skill and agent in `.claude/` against the plugin's architectural requirements: self-learning directives, the mandatory Plan→Critique→Improve→Do→Critique→Improve cycle, structural completeness, and valid frontmatter. Does **not** check whether skill content is accurate to your codebase — use [`/aisa:audit`](audit.md) for that.

## Usage

```text
/aisa:lint
/aisa:lint <path>
```

## Flags

| Flag | Description | Default |
| --- | --- | --- |
| `<path>` | Optional path to a specific file or directory to validate | all of `.claude/` |

## Examples

```text
/aisa:lint
```

> Validates all skills and agents in `.claude/`. Prints a PASS/FAIL verdict per check for each file, with a proposed fix for every failure.

```text
/aisa:lint .claude/skills/my-new-skill/SKILL.md
```

> Validates only the specified skill file — useful after writing a new skill.

```text
/aisa:lint .claude/agents/
```

> Validates all agent files in the `agents/` directory.

## Prerequisites

- An existing `.claude/` directory with skills or agents to validate

## What It Creates / Modifies

Read-only by default. When failures are found, the command proposes fixes and asks for approval before applying any changes.

## Related Commands

- [`/aisa:audit`](audit.md) — includes linting plus LLM spot-check of content accuracy
- [`/aisa:update`](update.md) — update skills after lint reveals outdated content
- [`/aisa:sync`](sync.md) — full cycle that includes linting as a built-in step

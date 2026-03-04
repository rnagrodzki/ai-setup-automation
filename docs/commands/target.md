# `/aisa:target` — Targeted update after a specific change

Scans only the area of the codebase that changed and updates the relevant skills and agents to match. Faster than a full [`/aisa:evolve`](evolve.md) cycle — use this immediately after shipping a feature, completing a refactor, or adding an integration.

## Usage

```text
/aisa:target <description of what changed>
```

## Flags

| Flag | Description | Default |
| --- | --- | --- |
| `<description>` | Required — plain-language description of the change | — |

## Examples

```text
/aisa:target added Stripe webhook handler for subscription cancellation
```

> Scans payment-related skills and agents, updates any that are now out of sync with the new webhook handler code.

```text
/aisa:target refactored auth module from sessions to JWT
```

> Focuses on authentication skills, updates examples, gotchas, and agent workflows that referenced session-based auth.

```text
/aisa:target new PIX payment integration
```

> Scans for PIX-related code and updates or creates the relevant payment skill.

```text
/aisa:target extracted shared validation utilities to packages/validation
```

> Updates skills that reference validation logic to point to the new shared location.

## Prerequisites

- An existing `.claude/` directory with relevant skills (run [`/aisa:setup`](setup.md) first)
- A clear description of what changed — the more specific, the tighter the scope

## What It Creates / Modifies

| Path | Description |
| --- | --- |
| `.claude/skills/**` | Updates skills relevant to the described change |
| `.claude/agents/**` | Updates agents whose workflows reference the changed area |

Does not rebuild the full cache — run [`/aisa:cache`](cache.md) if you want to capture the updated state as the new baseline.

## Related Commands

- [`/aisa:evolve`](evolve.md) — full evolution cycle when multiple areas need updating
- [`/aisa:validate`](validate.md) — check updated skills against architectural principles
- [`/aisa:postmortem`](postmortem.md) — if the change was a bug fix, encode lessons into skills

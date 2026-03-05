# `/aisa:sync` — Full sync cycle

Runs the complete 7-phase sync pipeline: snapshot the current state, detect drift between skills and the live codebase, harvest accumulated learnings, identify expansion needs, produce a prioritized change plan, critique it, then execute. User approval is required at three points — after the drift audit, after the change plan, and after critique — before proceeding.

## Usage

```text
/aisa:sync
/aisa:sync <focus-area>
```

## Flags

| Flag | Description | Default |
| --- | --- | --- |
| `<focus-area>` | Optional area to emphasize during drift analysis (e.g. `payment-integration`, `auth`) | all skills and agents |

## Examples

```text
/aisa:sync
```

> Full cycle across all skills and agents. Pauses for approval after the drift audit, the change plan, and the critique. Rebuilds the cache on completion.

```text
/aisa:sync payment-integration
```

> Same cycle, but drift analysis and expansion suggestions concentrate on payment-related skills first.

```text
/aisa:sync auth module refactor
```

> Focuses the evolution on authentication-related skills and agents.

## Prerequisites

- An existing `.claude/` directory (run [`/aisa:init`](init.md) first)
- Node.js >= 16
- Sufficient Claude context budget — full evolution on large setups consumes significant tokens; use [`/aisa:cache`](cache.md) to reduce repeat costs

## What It Creates / Modifies

| Path | Description |
| --- | --- |
| `.claude/skills/**` | Updates existing skill files where drift is detected |
| `.claude/agents/**` | Updates existing agent files |
| `.claude/learnings/log.md` | Promotes ACTIVE entries that were harvested |
| `.claude/cache/snapshot.json` | Rebuilt automatically after a successful cycle |

The command will not delete skills or agents without explicit user approval.

## Related Commands

- [`/aisa:inspect`](inspect.md) — lighter-weight read-only scan for weekly use
- [`/aisa:update`](update.md) — scoped update after a single feature or refactor (faster)
- [`/aisa:cache`](cache.md) — manually manage the snapshot cache to reduce token use
- [`/aisa:harvest`](harvest.md) — promote learnings without running a full sync cycle

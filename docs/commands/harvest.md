# `/aisa:harvest` — Promote learnings into skills

Processes ACTIVE entries in `.claude/learnings/log.md` and promotes them into permanent improvements: recurring patterns become skill gotchas, uncovered domains get new skills, and documentation gaps get filled. Run this when the log has accumulated enough raw learnings to be worth processing.

## Usage

```text
/aisa:harvest
```

## Flags

This command takes no arguments.

## Examples

```text
/aisa:harvest
```

> Reads all ACTIVE entries in `.claude/learnings/log.md`, groups them by theme, promotes recurring patterns into relevant skill files, creates new skills for uncovered areas, and marks processed entries as PROMOTED.

## Prerequisites

- An existing `.claude/learnings/log.md` with ACTIVE entries
- Recommended trigger: 10+ ACTIVE entries, or the oldest entry is more than 2 weeks old

## What It Creates / Modifies

| Path | Description |
| --- | --- |
| `.claude/skills/**` | Existing skills updated with new gotchas and patterns |
| `.claude/skills/<new-skill>/` | New skill directories created for uncovered domains |
| `.claude/learnings/log.md` | Processed entries marked as PROMOTED |

## Related Commands

- [`/aisa:postmortem`](postmortem.md) — creates learning log entries from incidents
- [`/aisa:evolve`](evolve.md) — includes harvesting as one phase of the full evolution cycle
- [`/aisa:validate`](validate.md) — check newly created or updated skills against principles

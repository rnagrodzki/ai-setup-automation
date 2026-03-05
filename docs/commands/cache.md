# `/aisa:cache` — Manage the snapshot cache

Maintains `.claude/cache/snapshot.json` — a hash of every skill and agent file. Evolution commands use this snapshot to skip unchanged files, reducing token consumption by 60–80% on repeat runs. The cache is rebuilt automatically after every full [`/aisa:sync`](sync.md) cycle; use this command to inspect or manually control it.

## Usage

```text
/aisa:cache
/aisa:cache status
/aisa:cache invalidate
```

## Flags

| Flag | Description | Default |
| --- | --- | --- |
| _(none)_ | Rebuild the cache from the current state | rebuild |
| `status` | Report cache freshness, coverage, and age | — |
| `invalidate` | Clear the cache so the next evolution does a full scan | — |

## Examples

```text
/aisa:cache
```

> Hashes all files in `.claude/skills/` and `.claude/agents/`, writes the snapshot, and reports how many files were added, updated, or unchanged.

```text
/aisa:cache status
```

> Reports: total files tracked, number modified since last snapshot, cache age, and estimated token savings on the next evolution run.

```text
/aisa:cache invalidate
```

> Deletes the snapshot. The next [`/aisa:sync`](sync.md) or [`/aisa:inspect`](inspect.md) run will do a full scan of all files.

## Prerequisites

- An existing `.claude/` directory with skills or agents to snapshot
- Node.js >= 16 (runs `cache-snapshot.js`)

## What It Creates / Modifies

| Path | Description |
| --- | --- |
| `.claude/cache/snapshot.json` | Created or updated with current file hashes |

## Related Commands

- [`/aisa:sync`](sync.md) — rebuilds the cache automatically on completion
- [`/aisa:inspect`](inspect.md) — uses the cache to skip unchanged files during drift scans

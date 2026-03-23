# `/aisa-inspect` — Quick read-only drift check

A lightweight drift scan of your `.claude/` setup. Reports a CURRENT / OUTDATED / STALE / CRITICAL status for every skill, agent, and `CLAUDE.md`. Fast enough to run weekly — uses the snapshot cache to skip unchanged files. Only fixes critical issues, and only with your permission.

## Usage

```text
/aisa-inspect
```

## Flags

This skill takes no arguments.

## Examples

```text
/aisa-inspect
```

> Scans all skills and agents, prints a per-file status table, and summarizes findings:
> - **CURRENT** — file is up to date
> - **OUTDATED** — content diverges from the codebase but is not blocking
> - **STALE** — significantly behind; schedule an update
> - **CRITICAL** — blocking issue; will prompt to fix immediately

## Prerequisites

- An existing `.claude/` directory (run [`/aisa-init`](init.md) first)
- Node.js >= 16
- `.claude/cache/snapshot.json` improves speed but is not required; the skill works without it

## What It Creates / Modifies

Read-only by default. If a CRITICAL issue is found (e.g. a broken file reference), the skill will describe the fix and ask for permission before making any change.

## Related Skills

- [`/aisa-audit`](audit.md) — deeper mechanical + LLM review with recommendations
- [`/aisa-lint`](lint.md) — structural principle compliance check (frontmatter, P1-P3, A1-A6)
- [`/aisa-sync`](sync.md) — full update cycle when inspect reveals significant drift
- [`/aisa-cache`](cache.md) — rebuild or inspect the snapshot cache used to speed up checks

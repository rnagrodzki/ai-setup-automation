# `/aisa:aisa-audit` — Deep review of existing AI configuration

Runs a read-only mechanical audit of your `.claude/` setup. It checks every skill and agent against structural and principle requirements, verifies that file references exist on disk, and spots content accuracy issues that automated scripts cannot catch. No files are created or modified.

## Usage

```text
/aisa:aisa-audit
```

## Flags

This skill takes no arguments.

## Examples

```text
/aisa:aisa-audit
```

> Prints a two-part report:
> - **Mechanical checks** — PASS/FAIL per item from `verify-setup.js` (file paths, self-learning directives, quality gates, CLAUDE.md table accuracy)
> - **Supplementary observations** — LLM spot-check of content accuracy, skill specificity, and coverage gaps
>
> Ends with an overall verdict (`HEALTHY / NEEDS_ATTENTION / CRITICAL`) and prioritized recommendations.

## Prerequisites

- An existing `.claude/` directory (run [`/aisa:aisa-init`](init.md) first if one doesn't exist)
- Node.js >= 16 (for `verify-setup.js`)

## What It Creates / Modifies

Nothing — this skill is fully read-only. To act on findings:

- Principle compliance failures → [`/aisa:aisa-lint`](lint.md) (can auto-fix with approval)
- Outdated or missing skills → [`/aisa:aisa-update`](update.md)
- Setup too far from current codebase → [`/aisa:aisa-sync`](sync.md) or [`/aisa:aisa-init`](init.md)

## Related Skills

- [`/aisa:aisa-lint`](lint.md) — structural principle compliance check with proposed fixes
- [`/aisa:aisa-inspect`](inspect.md) — lighter-weight weekly drift scan
- [`/aisa:aisa-sync`](sync.md) — full update cycle when audit reveals significant drift

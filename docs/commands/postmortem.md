# `/aisa:postmortem` — Guided incident analysis

Walks you through a structured post-mortem after a production bug, painful debugging session, failed deployment, or AI agent mistake. Gathers incident context (from your description, the conversation history, or interactive Q&A), checks recent git history for evidence, then encodes the lessons into your project's skills so the same mistake cannot recur.

## Usage

```text
/aisa:postmortem
/aisa:postmortem <incident description>
```

## Flags

| Flag | Description | Default |
| --- | --- | --- |
| `<incident description>` | Optional — describe the incident upfront to skip the Q&A | — |

## Examples

**Interactive mode — answer questions one at a time**

```text
/aisa:postmortem
```

> Checks the current conversation for incident context first. If none found, asks five questions one at a time (what happened, how discovered, how resolved, how long to diagnose, what area was affected), then confirms the summary before proceeding.

**Fast mode — description provided upfront**

```text
/aisa:postmortem webhook retry loop caused duplicate payments in checkout
```

```text
/aisa:postmortem OIDC token refresh race condition in concurrent requests
```

```text
/aisa:postmortem test suite passed but feature broke in production due to mocked repo
```

> Skips the Q&A entirely and goes straight to root cause analysis and skill update.

**After a debugging session in the same conversation**

```text
/aisa:postmortem
```

> Reads the conversation history, extracts the incident context automatically, presents a summary for your confirmation, then proceeds.

## Prerequisites

- An existing `.claude/` directory with skills (run [`/aisa:setup`](setup.md) first — the command checks for this and stops with instructions if it's missing)

## What It Creates / Modifies

| Path | Description |
| --- | --- |
| `.claude/skills/**` | Updates or creates skills with new gotchas, patterns, and preventive checks |
| `.claude/learnings/log.md` | May add a learning entry encoding the root cause |

## Related Commands

- [`/aisa:harvest`](harvest.md) — promote accumulated learning log entries into skills
- [`/aisa:target`](target.md) — if the incident revealed a code area whose skill needs updating
- [`/aisa:validate`](validate.md) — verify that newly updated skills follow architectural principles

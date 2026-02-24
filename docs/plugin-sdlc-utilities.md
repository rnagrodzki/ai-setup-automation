# Plugin: sdlc-utilities — Reference

## Overview

`sdlc-utilities` automates common SDLC tasks. It ships a smart pull request command that generates structured 8-section PR descriptions from commits and diffs — readable by both technical and non-technical stakeholders. See the [README](../README.md) for installation and quick start.

---

## `/sdlc:pr` — Smart Pull Request Creation

Analyzes all commits and the diff on your branch, then generates a structured 8-section PR description and creates the PR via the GitHub CLI. Presents the generated description for your review before creating.

### Basic Usage

```text
/sdlc:pr
```

### Example Output

Generates a title and structured description, then prompts:

```text
PR Title: feat: add webhook retry with idempotency keys

PR Description:
─────────────────────────────────────────────
## Summary
Added idempotency key validation to the webhook retry handler to prevent
duplicate payment processing on retried events.

## JIRA Ticket
PAY-142

## Business Context
Retried webhook events were being processed multiple times, causing duplicate
charges for customers at checkout.

## Business Benefits
Eliminates duplicate charge risk; reduces customer support tickets for payment
issues on retries.

## Technical Design
Use Stripe's event ID as an idempotency key, stored in a `processed_events`
table with a TTL index to bound storage growth.

## Technical Impact
New `processed_events` table migration required. Webhook handler logic changes
are backward-compatible.

## Changes Overview
- Webhook handler validates event ID before processing and records it after success
- New migration adds `processed_events` table with TTL index
- Retry deduplication test coverage added

## Testing
Automated: 4 new unit tests covering duplicate event detection, first-time
processing, expired TTL, and concurrent retry scenarios. All pass.
Manual: triggered test webhooks with repeated event IDs via Stripe CLI.
─────────────────────────────────────────────

Create this PR? (yes / edit / cancel)
```

### Flags

```text
/sdlc:pr --draft                    # create as a draft PR
/sdlc:pr --update                   # update description of an existing PR on this branch
/sdlc:pr --base develop             # target the develop branch instead of main
/sdlc:pr --draft --base release/2   # combine flags
```

### Requirements

**Requires**: `gh` CLI installed and authenticated (`gh auth login`). Falls back to showing the description for manual use if `gh` is unavailable.

---

## `sdlc:creating-pull-requests` Skill

Reusable knowledge skill that analyzes commits and diffs to generate PR descriptions in the Conventional PR format. Loaded by the `/sdlc:pr` command and available to any other command or skill that needs to produce PR content.

### Template (8 sections, always all present)

```text
## Summary          — 1-3 sentence plain-language overview, no jargon
## JIRA Ticket      — auto-detected from branch/commits, or "Not detected"
## Business Context — why this change is needed from a business perspective
## Business Benefits— value delivered: user impact, efficiency, risk reduction
## Technical Design — architecture, key decisions, trade-offs
## Technical Impact — affected systems, breaking changes, migration needs
## Changes Overview — what changed, grouped by concern (no file paths)
## Testing          — how it was verified: automated tests, manual steps
```

### Trigger Phrases

**When triggered**: "create PR", "open pull request", "update PR", "write PR description"

---
name: aisa-evolve-cache
description: Manage the .claude/cache/ snapshot for incremental skill/agent audits. Generates file hashes and drift baselines so subsequent aisa-evolve runs skip unchanged content, reducing token consumption by 60-80% on large setups. Run after any aisa-evolve cycle or manually to refresh the cache.
model: sonnet
skills: aisa-evolve-principles
argument-hint: "[rebuild|status|invalidate]"
---

# Cache Management for Incremental Evolution

Maintain `.claude/cache/` so that `aisa-evolve`, `aisa-evolve-health`, and `aisa-evolve-validate` can
skip unchanged files and focus tokens only on what actually changed since the last audit.

## Cache Structure

```
.claude/cache/
├── snapshot.json         # inventory + file hashes — WHO exists and WHAT they contain
└── drift-report.json     # last audit results per file — WHAT was their status
```

### snapshot.json

```json
{
  "generated_at": "2025-02-23T14:30:00Z",
  "generated_by": "aisa-evolve v8.0",
  "project_root_hash": "<sha256 of sorted ls -la on project root>",
  "skills": {
    "identity-coding-standards": {
      "path": ".claude/skills/identity-coding-standards.md",
      "sha256": "<hash of file content>",
      "lines": 142,
      "mtime": "2025-02-20T10:15:00Z",
      "has_quality_gates": true,
      "has_learning_capture": true,
      "has_pdci_workflow": true,
      "exempt_from_gates": false
    }
  },
  "agents": {
    "code-reviewer": {
      "path": ".claude/agents/code-reviewer.md",
      "sha256": "<hash>",
      "lines": 85,
      "mtime": "2025-02-19T08:00:00Z",
      "frontmatter_valid": true,
      "tools_valid": true,
      "has_self_review": true,
      "has_learning_capture": true
    }
  },
  "claude_md": {
    "sha256": "<hash>",
    "mtime": "2025-02-21T09:00:00Z"
  },
  "learnings_log": {
    "total_entries": 24,
    "active": 8,
    "promoted": 12,
    "stale": 4,
    "sha256": "<hash>"
  },
  "project_indicators": {
    "go_mod_hash": "<hash of go.mod if exists>",
    "package_json_hash": "<hash of package.json if exists>",
    "spec_dir_hash": "<hash of sorted ls on specs/ or openspec/>",
    "src_dir_listing_hash": "<hash of sorted find on src/ top 2 levels>"
  }
}
```

### drift-report.json

```json
{
  "generated_at": "2025-02-23T14:35:00Z",
  "generated_by": "aisa-evolve-health",
  "overall_status": "NEEDS_ATTENTION",
  "results": {
    "identity-coding-standards": {
      "status": "CURRENT",
      "passes": { "A": "PASS", "B": "PASS", "C": "PASS", "D": "N/A", "E": "PASS" },
      "notes": null
    },
    "identity-error-handling": {
      "status": "OUTDATED",
      "passes": { "A": "PASS", "B": "FAIL", "C": "PASS", "D": "N/A", "E": "PASS" },
      "notes": "Pass B: ErrorResponseFactory signature changed in v2.3"
    }
  }
}
```

## Commands

### `$ARGUMENTS` = `rebuild` (or empty)

Full rebuild of snapshot.json. Use after a complete aisa-evolve cycle or when cache is suspected stale.

```bash
# 1. Generate file hashes for all skills
for f in $(find .claude/skills -name "*.md" -not -path "*/aisa-*/REFERENCE.md" | sort); do
  sha256sum "$f"
done

# 2. Generate file hashes for all agents
for f in $(find .claude/agents -name "*.md" 2>/dev/null | sort); do
  sha256sum "$f"
done

# 3. Hash CLAUDE.md and learnings
sha256sum CLAUDE.md .claude/learnings/log.md 2>/dev/null

# 4. Hash project indicators (dependency files, spec dirs, source dirs)
sha256sum go.mod package.json 2>/dev/null
ls specs/ openspec/ 2>/dev/null | sort | sha256sum
find src/ -maxdepth 2 -type f 2>/dev/null | sort | sha256sum
```

Build the snapshot.json from these hashes.

**Principle compliance flags** — populate during full rebuild and `/aisa-evolve-validate` runs:
- For each skill: check quality gates, learning capture, PDCI workflow → store as boolean flags
- For each agent: validate frontmatter, tool validity → store validity flags
- During incremental scans: trust cached flags for hash-matching files (don't re-read to verify)
- Flags are only re-evaluated when the file hash changes or when `/aisa-evolve-validate` runs explicitly

Write to `.claude/cache/snapshot.json`.

### `$ARGUMENTS` = `status`

Report cache freshness without rebuilding:

```markdown
## Cache Status

- snapshot.json: [EXISTS / MISSING] — age: {time since generated_at}
- drift-report.json: [EXISTS / MISSING] — age: {time since generated_at}
- Skills cached: {N} / {N actual on disk} — {N} stale (hash mismatch)
- Agents cached: {N} / {N actual on disk} — {N} stale (hash mismatch)
- Project indicators: {N changed since snapshot}

### Recommendation
{FRESH — no rebuild needed / PARTIALLY STALE — incremental scan sufficient / STALE — full rebuild recommended}
```

### `$ARGUMENTS` = `invalidate`

Delete the cache files, forcing a full scan on the next aisa-evolve run:

```bash
rm -f .claude/cache/snapshot.json .claude/cache/drift-report.json
echo "Cache invalidated. Next aisa-evolve run will do a full scan."
```

## How Other Skills Use the Cache

### Incremental Scan Protocol

When any `aisa-evolve-*` skill starts, it should:

1. **Check** if `.claude/cache/snapshot.json` exists
2. If YES → **compare** current file hashes against cached hashes
3. **Categorize** each file:
   - **UNCHANGED** (hash matches) → skip deep audit, carry forward cached status
   - **MODIFIED** (hash differs) → full audit required
   - **NEW** (not in cache) → full audit required
   - **DELETED** (in cache but not on disk) → flag for removal from setup inventory
4. **Also check project indicators** — if `go.mod`, `package.json`, spec dirs, or src dirs changed → flag related skills for re-audit even if the skill file itself didn't change
5. If NO cache → fall back to full scan (no error, just slower)

### Token Savings Estimate

| Setup size | Full scan tokens | Incremental (20% changed) | Savings |
|-----------|-----------------|---------------------------|---------|
| 10 items  | ~30K            | ~10K                      | ~67%    |
| 20 items  | ~60K            | ~16K                      | ~73%    |
| 33 items  | ~100K           | ~25K                      | ~75%    |

### Cache Invalidation Triggers

The cache should be fully rebuilt when:
- `aisa-evolve` completes a full cycle (it rebuilds automatically)
- `aisa-architect` generates a new setup
- User runs `/aisa-evolve-cache rebuild`

The cache should be partially invalidated when:
- `aisa-evolve-target` updates specific skills (update only those entries)
- `aisa-evolve-harvest` promotes learnings to skills (update promoted targets)
- `aisa-evolve-postmortem` modifies skills (update modified entries)

## Auto-Rebuild After Evolution

Every `aisa-evolve` full cycle should, as its final step, rebuild the cache:

```
Phase 7 — Execute → apply approved changes
Phase 7.5 — Cache Rebuild → update .claude/cache/snapshot.json with new state
```

This ensures the NEXT evolution run starts with a fresh baseline.

## Quality Gate

Before writing snapshot.json:

- [ ] Every skill file on disk has a corresponding entry in the snapshot
- [ ] Every agent file on disk has a corresponding entry in the snapshot
- [ ] Hash values are actual sha256 sums (not placeholder strings)
- [ ] Principle compliance flags match actual file content (spot-check 3 random entries)

## Learning Capture

If cache analysis reveals patterns (e.g., "skills in domain X always drift together",
"agents drift faster than skills", "spec changes correlate with domain skill drift"),
append as learning entries to `.claude/learnings/log.md`.

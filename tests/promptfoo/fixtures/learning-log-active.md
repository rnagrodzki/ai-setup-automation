## Project: learning-log-active

The project has a `.claude/` directory with 3 skills and a populated learnings log:

```
.claude/
  skills/
    api-client/
      SKILL.md
    data-processor/
      SKILL.md
    report-generator/
      SKILL.md
  agents/
    (none)
  cache/
    snapshot.json
  learnings/
    log.md
```

### `.claude/learnings/log.md` contents:

```
## 2026-02-10 — ACTIVE — GOTCHA — api-client
When calling the API with pagination, always check for `next_cursor` in the response, not just `has_more`. Using `has_more` alone causes silent data loss on the last page.
Source: Debugging session — fixed bug in pagination loop.
```

```
## 2026-02-12 — ACTIVE — GOTCHA — api-client
Rate limiting: the API returns 429 with `Retry-After` header in seconds, NOT milliseconds. Sleeping for the raw value instead of dividing by 1000 causes 1000x longer waits.
Source: Production incident — timeout failures.
```

```
## 2026-02-15 — ACTIVE — PATTERN_DISCOVERED — data-processor
CSV files from vendor X always have a BOM character (0xEF 0xBB 0xBF) at the start. Must strip before parsing or first column name is corrupted.
Source: Data import failure debugging.
```

```
## 2026-01-20 — PROMOTED — GOTCHA — api-client
Never use `api.get()` without setting the `timeout` option — defaults to 0 (no timeout) and causes hanging requests.
Source: Legacy code review.
```

3 ACTIVE entries (2 GOTCHA for api-client, 1 PATTERN_DISCOVERED for data-processor), 1 PROMOTED entry.

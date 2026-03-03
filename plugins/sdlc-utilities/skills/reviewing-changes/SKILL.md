---
name: reviewing-changes
description: "Use this skill when reviewing code changes across project-defined dimensions (security, performance, docs, concurrency, etc.). Runs review-prepare.js to pre-compute all git data, then delegates to the review-orchestrator agent. Triggers on: review changes, code review, review PR, multi-dimension review, run review."
---

# Reviewing Changes

Pre-compute review data with a script, then delegate all orchestration to the
`review-orchestrator` agent. The agent dispatches dimension subagents, deduplicates
findings, and posts the consolidated PR comment.

---

## Step 1 — Run Preparation Script

Locate the script:

```
**/sdlc-utilities/scripts/review-prepare.js
```

Build the command from the arguments passed to this skill:

```bash
node <script-path>/review-prepare.js \
  --project-root . \
  [--base <branch>]        # include if --base was provided
  [--dimensions <names>]   # include if --dimensions was provided
  --json
```

Run the command and capture stdout as `MANIFEST_JSON`.

**On non-zero exit:**

- Exit code 1: show the stderr message to the user and stop.
- Exit code 2: show `Script error — see output above` and stop.

**Uncommitted changes warning:**

If `manifest.uncommitted_changes` is `true`, warn the user:

```
Warning: you have uncommitted changes ({dirty_files.length} files). They are NOT
included in this review diff. Commit or stash them first if you want them reviewed.
Continue? (yes/no)
```

Wait for confirmation before proceeding.

---

## Step 2 — Dry Run Check

If `--dry-run` was passed:

Format and display the review plan from the manifest:

```
Review Plan (dry run — no subagents dispatched)

  Base branch:    {manifest.base_branch}
  Changed files:  {manifest.git.changed_files.length}
  Dimensions:     {manifest.summary.active_dimensions} active, {manifest.summary.skipped_dimensions} skipped

| Dimension | Files | Severity | Status |
|-----------|-------|----------|--------|
...

Plan critique:
  - Uncovered files: {manifest.plan_critique.uncovered_files.join(', ') or "none"}
  - Over-broad:      {manifest.plan_critique.over_broad_dimensions.join(', ') or "none"}
```

Stop here.

---

## Step 3 — Spawn Orchestrator Agent

Locate the orchestrator agent definition:

```
**/sdlc-utilities/agents/review-orchestrator.md
```

Locate the reference templates:

```
**/reviewing-changes/REFERENCE.md
```

Spawn a single Agent (subagent_type: general-purpose) with the orchestrator agent's
instructions and this context embedded in the prompt:

```
MANIFEST_JSON: {the full JSON manifest from Step 1}
REFERENCE_MD_PATH: **/reviewing-changes/REFERENCE.md
```

Wait for the orchestrator to complete and return results.

---

## Step 4 — Report and Cleanup

Display the orchestrator's summary to the user.

Clean up the temp diff directory:

```bash
rm -rf {manifest.diff_dir}
```

---

## See Also

- `agents/review-orchestrator.md` — full orchestration logic
- `REFERENCE.md` — dimension format spec, subagent prompt template, comment template
- `EXAMPLES.md` — 5 ready-to-use example dimension files
- `sdlc:initializing-review-dimensions` — creates tailored dimensions for a project

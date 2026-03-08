---
name: aisa-openspec-checker
description: "Check openspec CLI availability, project initialization, and version currency. Suggests installation, initialization, or update with user confirmation."
user-invocable: false
---

# OpenSpec Checker

Lightweight diagnostic that verifies the `openspec` CLI is installed, the project is
initialized, and the CLI is up to date. Read-only unless the user approves a remediation.

## Instructions

### Step 1 — Locate and Run the Check Script

Use `Glob` to find the script:

```
Glob pattern: **/check-openspec.js
```

Once located, run:

```bash
node <script-path> --project-root . --json
```

The script performs in a single invocation:
- **CLI availability** — detects whether `openspec` is installed and resolves its version
- **Latest version lookup** — queries the npm registry for the published latest version
- **Project initialization** — checks for the `.openspec/` directory and `specs/` directory
- **Suggestion generation** — emits an ordered list of `suggestions` with `action` and `message`

Capture the JSON output for interpretation in Step 2.

### Step 2 — Interpret Results

Parse the JSON and classify the overall state into one of two categories:

| Category | Condition |
|---|---|
| **GOOD** | `cli_installed && project_initialized && update_available !== true` |
| **NEEDS_ACTION** | `!cli_installed` OR `!project_initialized` OR `update_available === true` |

> **Note:** There is no UNAVAILABLE state. Even when the CLI is not installed, the correct classification
> is NEEDS_ACTION — because a clear remediation exists (install the CLI). UNAVAILABLE would only apply
> if no remediation were possible, which is not the case here.

Map each field to a display status:

- `cli_installed: true` → CLI: installed at `cli_version`
- `cli_installed: false` → CLI: not installed
- `project_initialized: true` → Project: initialized (`openspec_dir` present)
- `project_initialized: false` → Project: not initialized
- `update_available: false` → Version: up to date
- `update_available: true` → Version: update available (`latest_version`)

If the script exits with a non-zero code or the output cannot be parsed as JSON, classify
the state as NEEDS_ACTION and surface the raw error output.

### Step 3 — Present Findings

Present a concise status report:

```
## OpenSpec Status

- CLI: ✅ v{cli_version} installed        (or ❌ not installed)
- Project: ✅ initialized                 (or ⚠️ not initialized)
- Version: ✅ up to date                  (or ⚠️ update available: {latest_version})

Overall: GOOD | NEEDS_ACTION
```

If the overall state is GOOD, stop here — no remediations are needed.

### Step 4 — Suggest Remediations with Explicit Confirmation

For each entry in `suggestions`, map the `action` field to the appropriate command and
present it to the user **before executing anything**:

| `action` value | Suggested command | Explanation |
|---|---|---|
| `install` | `npm install -g @fission-ai/openspec` | Installs the CLI globally |
| `init` | `openspec init --tools claude` | Initialises the project in the current directory |
| `update` | `npm install -g @fission-ai/openspec@latest` | Upgrades the CLI to the latest version |

Present remediations in the order returned by the script (install before init before update).

**For each suggestion, ask explicitly:**

```
### Recommended Action {N}: {action}

{message from suggestions[N].message}

Command to run:
  {command}

Proceed? (yes / no / skip)
```

Rules:
- Execute the command **only** after receiving explicit confirmation ("yes" or equivalent).
- "no" or "skip" skips that specific action and moves to the next.
- Do not batch-execute all commands at once — confirm each individually.
- After executing a command, report its stdout/stderr and whether it succeeded.

### Step 5 — Re-verify After Remediations

If any remediation was executed, re-run the check script and present an updated status
report using the same format as Step 3. This confirms the action had the intended effect.

## Quality Gate

| Trigger | Check | Pass | Fail | Max Iterations |
|---|---|---|---|---|
| Script not found | `Glob **/check-openspec.js` returns results | At least one path returned | No results — script missing | 1 |
| JSON parse failure | `JSON.parse(stdout)` succeeds | Valid JSON object | SyntaxError or empty output | 1 (surface raw error) |
| Classification mismatch | `cli_installed` field matches CLI status label | Labels consistent with JSON | Discrepancy between field and label | 1 (re-derive) |
| Remediation executed | Re-verification run after each executed action | Updated status report presented | No re-verification performed | 1 |
| User confirmation | Each suggestion confirmed before execution | Explicit "yes" received | Abort remediation; skip command | 1 |

If any gate fails its check, do not proceed to the next step — resolve the failure first.

### Post-execution Critique Checklist

After completing Steps 1-5, perform an internal critique before finalising the report:

- [ ] Did the script run without error? If not, was the error surfaced clearly?
- [ ] Is the classification (GOOD / NEEDS_ACTION) consistent with the JSON fields?
- [ ] Were all entries in `suggestions` presented to the user — none silently dropped?
- [ ] Was each executed command confirmed individually before running?
- [ ] Does the re-verification report reflect the actual post-remediation state?

If any checklist item fails, correct the gap before presenting the final output.

## Learning Capture

After completing the skill (or if an unexpected condition is encountered), append any
notable discoveries to `.claude/learnings/log.md` using the standard format:

```markdown
- [{date}] [aisa-openspec-checker] {discovery}
  context: {what triggered the discovery}
  status: ACTIVE
```

Examples of discoveries worth logging:
- The script was not found at the expected glob path
- The npm registry lookup timed out or returned an unexpected version format
- `openspec init` failed with an unexpected error message
- The `.openspec/` directory exists but `specs/` is absent (partial initialization)
- A project had `update_available: true` but `cli_version` equalled `latest_version`

Do not log routine successful runs — only log conditions that would help improve the skill
or the underlying script in the future.

## See Also

- `aisa-checker` — general health check for skills and agents
- `**/scripts/check-openspec.js` — the script this skill drives
- `.claude/learnings/log.md` — shared learnings log

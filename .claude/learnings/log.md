# Learnings Log

This is the append-only learnings log for the `ai-setup-automation` marketplace repository.
Entries flow from incidents, debugging sessions, and evolution cycles.

---

### [DOC_GAP] Documentation not updated after structural feature PRs

- **Date**: 2026-02-24
- **Session**: post-mortem
- **Discovery**: After PRs #2, #3, #4 added the `sdlc-utilities` plugin, namespace prefixes, `scripts/`, and CI enforcement, 25 specific documentation issues accumulated across 7 files. Root cause: the PR workflow (`creating-pull-requests` skill) has no quality gate checking whether structural docs (README, AGENTS.md, docs/) were updated to match code changes. `aisa-evolve-target` was never triggered post-merge despite being designed for exactly this.
- **Impact**: HIGH — misleading docs for contributors; wrong naming conventions documented; entire `scripts/` directory undocumented; outdated PR template description in README vs actual 8-section skill.
- **Action**: (1) Add "Documentation Sync" quality gate to `creating-pull-requests` skill. (2) Add Best Practice note in that skill recommending `/aisa-evolve-target` after structural changes. (3) Fix all 25 doc issues in 7 files. (4) Establish `.claude/learnings/` in this repo for future capture.
- **Status**: RESOLVED — sdlc-utilities plugin removed; action items referencing `creating-pull-requests` skill are no longer applicable. Doc issues addressed in subsequent PRs.

### [PATTERN_FAILED] Prescriptive docs written without reading actual code

- **Date**: 2026-02-24
- **Session**: post-mortem
- **Discovery**: `docs/adding-skills.md` recommends a gerund naming convention for skill directories (e.g., `writing-unit-tests`). 8 of 9 actual skills in the repo use a non-gerund prefix pattern (`aisa-init`, `aisa-evolve`, `aisa-evolve-*`). The doc was authored as prescriptive ideal without cross-referencing existing code — a violation of Behavioral Rule 2 ("code is ground truth").
- **Impact**: MEDIUM — contributors following the docs would create skills with inconsistent naming.
- **Action**: Fix `docs/adding-skills.md` to describe the actual naming pattern used. Document both the `<plugin-prefix>-<noun>` pattern (aisa skills) and the gerund pattern (sdlc skills) as context-specific conventions.
- **Status**: RESOLVED — sdlc plugin removed; `docs/adding-skills.md` updated to document the prefix pattern only.

### [DOC_GAP] scripts/ directory entirely absent from all documentation

- **Date**: 2026-02-24
- **Session**: post-mortem
- **Discovery**: `plugins/ai-setup-automation/scripts/` contains `verify-setup.js`, `cache-snapshot.js`, and a `lib/` directory with 6 modules. Not one documentation file mentions this directory. Contributors have no guidance on how to add scripts to a plugin or when to use them vs skills.
- **Impact**: HIGH — scripts are invoked by health and cache skills; undocumented maintenance risk.
- **Action**: Add `scripts/` to all structural documentation (AGENTS.md, README.md, docs/architecture.md). Consider adding `docs/adding-scripts.md` if scripts are expected to grow.
- **Status**: ACTIVE

### [GOTCHA] Large script JSON output (>65KB) breaks shell pipes — use temp file pattern

- **Date**: 2026-03-03
- **Session**: post-mortem
- **Discovery**: `pr-prepare.js` embeds full `diffContent` in its JSON output, inflating it to ~150KB for a 16-file PR. When an agent runs `node pr-prepare.js | node -e "..."` to parse the output, the pipe silently truncates at ~65KB, producing "Unterminated string in JSON at position 65342". The `pr.md` command says "capture stdout as `PR_CONTEXT_JSON`" with no guidance for large outputs, so the natural interpretation (shell pipe) fails. Workaround: write to a temp file first (`node pr-prepare.js > /tmp/pr-context-$$.json`), then read from it. Same risk applies to `review-prepare.js`.
- **Impact**: HIGH — `/sdlc:pr` fails silently on repos with large diffs; requires 3+ extra recovery steps.
- **Action**: (1) Update `pr.md` command to prescribe temp-file write pattern. (2) Add GOTCHA section to `creating-pull-requests` SKILL.md. (3) Apply same fix to `review.md` / `reviewing-changes` SKILL.md. (4) Consider adding `--output-file` flag to both scripts.
- **Status**: RESOLVED — sdlc plugin removed from repository.

### [GOTCHA] Hardcoded branch names in AGENTS.md become stale immediately

- **Date**: 2026-02-24
- **Session**: post-mortem
- **Discovery**: AGENTS.md contained `Current branch: fix/docs` and `Target merge branch: main` as hardcoded text. After merging to main, these lines became factually wrong. Branch metadata in static docs is always stale — it reflects the state at time of writing, not at time of reading.
- **Impact**: LOW — confusing to contributors and AI agents reading the file.
- **Action**: Remove hardcoded branch metadata from AGENTS.md. If branch context is needed, use git commands instead of hardcoding in docs.
- **Status**: ACTIVE

### [PATTERN_FAILED] aisa-syncer Phase 4 agent analysis silently skipped

- **Date**: 2026-03-07
- **Session**: post-mortem
- **Discovery**: `/aisa:sync` ran on an Astro/Svelte project with a blog content collection. Phase 4 proposed one skill (`sky4me-frontend`) and stopped. Phase 4.4 (Agent Gap Analysis) produced no output — not even a "none found" conclusion. The blog content domain was merged into the frontend skill instead of evaluated as a separate bounded context. Root cause: SKILL.md has no required output structure for Phase 4, so one skill candidate satisfies the phase. The Quality Gate only validates what WAS proposed, not whether Phase 4.4 was executed at all.
- **Impact**: HIGH — projects ship without agent coverage; content domains get merged into technical skills, reducing skill specificity; users have no visibility into what expansion was considered vs. skipped.
- **Action**: (1) Add required "Agent Analysis" section to Phase 4 output template in SKILL.md — must be present even if conclusion is "none". (2) Add Quality Gate: "Phase 4 includes explicit agent analysis". (3) Add Pause Point after Phase 4. (4) Require Phase 4.3 threshold evaluation to be shown in output, not just the conclusion.
- **Status**: ACTIVE

### [PATTERN_FAILED] Phase 4 Quality Gate vacuously passes when expansion is shallow

- **Date**: 2026-03-07
- **Session**: post-mortem
- **Discovery**: The aisa-syncer Quality Gate checks "new skills proposed in Phase 4 cite concrete evidence" — but if Phase 4 proposes minimal items (e.g. 1 skill, 0 agents), the gate passes trivially. It validates the quality of what WAS found but cannot detect what was MISSED. The gate is structurally blind to skipped sub-phases.
- **Impact**: HIGH — sync appears to complete successfully with a "Approved" quality gate even when Phase 4.4 was never run.
- **Action**: Rewrite Quality Gate to require proof of execution per sub-phase: "Phase 4 output includes explicit agent analysis section (even if empty with justification)".
- **Status**: ACTIVE

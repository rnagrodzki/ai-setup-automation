---
description: Incident-to-prevention pipeline — gathers context from conversation or git history, maps root causes to skill gaps, encodes lessons into .claude/ skills and learnings log
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Skill]
argument-hint: "<optional: brief incident description>"
---

# /postmortem Command

Guide a structured post-mortem after any incident — a production bug, a painful debugging
session, a failed deployment, or a mistake by an AI agent. Gathers context, checks git
history for evidence, then hands off to the `aisa-postmortem` skill to encode the
lessons into the project's skills so the same mistake can't happen again.

## Usage

- `/postmortem` — Interactive mode: answer questions one at a time to describe the incident
- `/postmortem <description>` — Fast mode: skip the Q&A and jump straight to the skill

## Workflow

### Step 1: Check Prerequisites

Verify the project has the required `.claude/` structure:

```bash
test -d .claude && echo "OK" || echo "MISSING: .claude/ directory not found"
test -d .claude/skills && echo "OK" || echo "MISSING: .claude/skills/ not found"
test -f .claude/skills/aisa-postmortem/SKILL.md && echo "OK" || echo "MISSING: aisa-postmortem skill not found"
```

If `.claude/` or the skill is missing, stop and tell the user:

```text
This project doesn't have AI skills configured yet.
Run /aisa:init first to set up the AI configuration, then come back for the post-mortem.
```

### Step 2: Gather Incident Context

**Priority order — stop at the first source that provides enough context:**

1. **Fast mode**: If the user provided `$ARGUMENTS`, use that as the incident description and skip to Step 3.

2. **Conversation-aware mode**: If `$ARGUMENTS` is empty, review the current conversation history before asking anything.
   - Look for: debugging sessions, error messages, stack traces, "it's broken", failed tests, production issues, agent mistakes, or any problem-solving discussion.
   - If you find relevant context, extract it and compose the incident description yourself. Identify: what went wrong, how it was discovered, how it was resolved (or current status), rough diagnosis time, and affected area.
   - Present a summary to the user for confirmation:

     ```text
     I found context in our conversation. Here's what I'll use for the post-mortem:

     Incident:    [what happened, from conversation]
     Discovered:  [how it was found]
     Resolution:  [how it was fixed / still open]
     Diagnosis:   [estimated time, if inferable]
     Area:        [affected part]

     Does this look right? I'll fill in any gaps below if anything is missing.
     ```

   - Then ask only for the pieces that are genuinely missing or unclear. Skip questions you can already answer from context.

3. **Interactive mode**: If the conversation has no relevant incident context, ask the following questions **one at a time** — wait for each answer before asking the next:

   1. **What happened?**
      Ask: "What went wrong? Describe the incident, bug, or painful situation you want to analyze."

   2. **How was it discovered?**
      Ask: "How did you find out? (e.g. test failure, user report, monitoring alert, code review, you noticed it yourself)"

   3. **How was it resolved?**
      Ask: "How was it fixed — or is it still open? If fixed, what was the solution?"

   4. **How long did it take to diagnose?**
      Ask: "How long did it take to identify the root cause? (rough estimate is fine)"

   5. **What area was affected?**
      Ask: "Which part of the codebase or system was involved? (e.g. a specific file, service, feature, or skill)"

### Step 3: Gather Git Context

Check recent history for evidence related to the incident:

```bash
# Recent commits that may contain the fix
git log --oneline -20

# Files changed in the last few commits
git diff HEAD~5 --stat
```

Identify any commits that look like fixes (keywords: fix, revert, hotfix, patch) and note their messages.

### Step 4: Summarize and Confirm

Present the compiled incident context back to the user:

```text
Post-Mortem Summary
───────────────────
Incident:    [what happened]
Discovered:  [how it was found]
Resolution:  [how it was fixed / still open]
Diagnosis:   [how long it took]
Area:        [affected part of the codebase]

Recent fix-looking commits:
  [list any relevant commits from git log]

Ready to run a full post-mortem analysis?
This will map root causes to skill gaps and propose updates to prevent recurrence.
(yes to continue, no to cancel)
```

Wait for explicit user confirmation before proceeding.

### Step 5: Delegate to Skill

Invoke the `aisa-postmortem` skill with the compiled incident description as the argument.
Pass the full context gathered in Steps 2–3 so the skill can begin its root cause analysis
without repeating the same questions.

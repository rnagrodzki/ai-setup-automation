## Project: drifted-setup

The project has a `.claude/` directory with the following structure:

```
.claude/
  skills/
    data-processor/
      SKILL.md     (47 lines)
    report_generator.md    <- FLAT FILE (S1 violation)
    validator/
      SKILL.md     (520 lines)  <- TOO LONG (S5 violation)
  agents/
    (none)
  cache/
    snapshot.json
  learnings/
    log.md
```

### `data-processor/SKILL.md` summary:
- Frontmatter: name: data-processor, description: "Process CSV data files for analysis", user-invocable: false
- Has `## Learning Capture` section referencing `.claude/learnings/log.md`
- Has `## Quality Gate` section
- Workflow follows PCIDCI pattern

### `report_generator.md` summary (FLAT FILE — S1 violation):
- Frontmatter: name: report_generator (has underscore — S3 violation), description: "Generate reports"
- NO `## Learning Capture` section (2a violation)
- NO `## Quality Gate` section (2b violation)
- Workflow: "Step 1: gather data. Step 2: write report. Done." — no critique (2c violation)

### `validator/SKILL.md` summary (520 lines — S5 violation):
- Frontmatter: name: validator, description: "Validate input data against rules", user-invocable: false
- Has `## Learning Capture` section
- Has `## Quality Gate` section
- Workflow has PCIDCI pattern
- Only issue: file is 520 lines (exceeds 500-line limit)

---
name: report-generator
description: "Generate structured reports from processed data"
user-invocable: false
---

# Report Generation

Generate structured markdown or JSON reports from processed data inputs.

## Workflow

Plan → critique → improve → execute → critique → improve pattern:

1. Plan the report structure
2. Critique: does the structure meet requirements?
3. Improve based on critique
4. Generate the report
5. Critique the output for completeness
6. Improve and deliver

## Quality Gate

- [ ] Report includes all required sections
- [ ] Data referenced in report matches source
- [ ] Output format matches requested type (markdown/JSON)

## Learning Capture

If report generation reveals missing data patterns or structural gaps, append to `.claude/learnings/log.md`.

---
name: data-processor
description: "Process CSV data files for analysis"
user-invocable: false
---

# Data Processing

Process CSV files and prepare structured output for downstream analysis.

## Workflow

1. Plan the processing steps
2. Critique the plan before executing
3. Improve the plan based on critique
4. Execute processing
5. Critique the output
6. Improve and deliver

## Quality Gate

- [ ] Input file exists and is valid CSV
- [ ] Output schema matches expected format
- [ ] No data loss during transformation

## Learning Capture

If processing reveals recurring data quality issues or edge cases, append findings to `.claude/learnings/log.md`.

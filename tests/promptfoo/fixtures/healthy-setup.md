## Project: healthy-setup

The project has a `.claude/` directory with the following structure:

```
.claude/
  skills/
    data-processor/
      SKILL.md     (47 lines, valid frontmatter, name: data-processor)
    report-generator/
      SKILL.md     (62 lines, valid frontmatter, name: report-generator)
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
- Has `## Quality Gate` section with checklist
- Workflow includes "critique the plan before executing" and "review output before delivering"

### `report-generator/SKILL.md` summary:
- Frontmatter: name: report-generator, description: "Generate structured reports from processed data", user-invocable: false
- Has `## Learning Capture` section referencing `.claude/learnings/log.md`
- Has `## Quality Gate` section with checklist
- Workflow follows plan → critique → improve → execute → critique → improve pattern

Both skills are in directory format (name/SKILL.md), have valid frontmatter, names are lowercase-hyphen, descriptions are under 1024 chars, and files are under 500 lines.

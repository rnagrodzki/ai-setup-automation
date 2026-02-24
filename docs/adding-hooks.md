# Adding Hooks

## Overview

Hooks run shell commands at specific points in the Claude Code lifecycle. They are
defined in `plugins/ai-setup-automation/hooks/hooks.json`.

## Hook Points

| Hook | When It Fires | Common Use Case |
|---|---|---|
| `SessionStart` | Session begins | Load context, show welcome message |
| `PreToolUse` | Before a tool runs | Validate inputs, enforce guards |
| `PostToolUse` | After a tool completes | Run linters, validate output |

## Configuration Format

Edit `plugins/ai-setup-automation/hooks/hooks.json`:

```json
{
  "hooks": {
    "<HookPoint>": [
      {
        "matcher": "<regex-pattern>",
        "hooks": [
          {
            "type": "command",
            "command": "<shell-command>"
          }
        ]
      }
    ]
  }
}
```

### Fields

| Field | Description |
|---|---|
| `matcher` | Regex matching tool names (e.g., `Edit\|Write`). Omit for hooks that always fire (e.g., `SessionStart`). |
| `type` | Always `"command"` for shell commands |
| `command` | Shell command to execute |

## Examples

### Welcome Message on Session Start

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Plugin loaded. Use /setup-ai to get started.'"
          }
        ]
      }
    ]
  }
}
```

### Lint After File Edits

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint --fix 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

### Validate Markdown After Writes

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node scripts/validate-markdown.js --changed-only 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

## Multiple Hooks in One File

You can define hooks for multiple events in a single `hooks.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          { "type": "command", "command": "echo 'Session started'" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "npm run lint --fix 2>/dev/null || true" }
        ]
      }
    ]
  }
}
```

## Tips

1. **Use `|| true`** — Prevent hook failures from blocking Claude's workflow
2. **Use `2>/dev/null`** — Suppress error output when tools are not installed
3. **Keep hooks fast** — Long-running hooks block the session; avoid slow commands
4. **Test commands manually first** — Run the command in your terminal before adding it
5. **One concern per hook** — Don't combine linting and testing in one hook entry

## Plugin Hooks vs Project Hooks

| Location | Scope |
|---|---|
| `plugins/<plugin>/hooks/hooks.json` | Applied everywhere the plugin is installed |
| `.claude/settings.json` (in a project) | Applied to that specific project only |

Plugin hooks are portable — they follow the plugin across all projects. Project-level
hooks in `settings.json` are scoped to that repo.

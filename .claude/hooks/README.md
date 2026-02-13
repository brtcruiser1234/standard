# Hooks - Auto-Validation on Edit

Automated validation hooks that catch config errors before they cause problems.

---

## What Hooks Do

Hooks execute shell commands at lifecycle events:
- **afterEdit** - After you save a file
- **beforeSave** - Before file is saved
- **beforeCommit** - Before committing to git

Think of them as automatic linters that validate your work without you having to ask.

---

## Available Hooks

### 1. **validate-yaml** (afterEdit)

**Validates YAML syntax when you edit `.yml` or `.yaml` files**

**What it catches:**
- Indentation errors (YAML is whitespace-sensitive)
- Missing colons or quotes
- Invalid structure (duplicate keys, wrong nesting)
- Invalid values

**Example:**
You edit `~/.cloudflared/config.yml` and accidentally indent a line wrong:
```yaml
ingress:
  - hostname: jazzlive.taylorshome.cc
    service: http://localhost:8888
   port: 9090  # ❌ Wrong indent!
```

**Hook catches:** `mapping values are not allowed here (line 4)`

Then you fix it, save again, and hook validates it's correct. ✅

### 2. **check-cloudflare-config** (beforeSave)

**Validates Cloudflare tunnel config syntax specifically**

**What it catches:**
- Invalid tunnel configuration
- Wrong ingress rule structure
- Missing required fields

**When it runs:**
When you edit `~/.cloudflared/config.yml`

**What it does:**
```bash
cloudflared config -c ~/.cloudflared/config.yml
```

This is the same validation cloudflared uses before starting.

### 3. **validate-modified-yaml** (beforeCommit)

**Validates all modified YAML files before git commit**

**What it prevents:**
Committing broken config files that would break services

**When it runs:**
When you run `git commit`

**What it does:**
1. Finds all `.yml`/`.yaml` files you modified
2. Validates each one
3. If any are invalid: **blocks the commit** until fixed
4. If all valid: commit proceeds

**Example:**
```bash
$ git commit -m "Update tunnel config"
# Hook runs: validates the YAML
# If bad: ❌ "YAML Syntax Error: ... - commit blocked"
# If good: ✅ Commit proceeds
```

---

## How They Work

**Hook Configuration:** `~/.claude/hooks.json`

**Validation Scripts:** `~/.claude/hooks/validate-yaml.sh`

**Execution Flow:**

```
You edit cloudflared/config.yml
         ↓
afterEdit hook triggers
         ↓
validate-yaml.sh runs
         ↓
Python/yq validates YAML
         ↓
Show result: ✓ Valid or ✗ Error with line number
         ↓
[If error: you fix and save again]
```

---

## Real-World Example

### Before Hooks (Feb 13 Problem)

You make this mistake in tunnel config:
```yaml
ingress:
  - hostname: jazzlive.taylorshome.cc
    service: http://localhost:8888  # Should be https!
```

**What happens:**
1. You commit and push
2. Cloudflared starts with broken config (no validation)
3. Users get 502 errors
4. You spend 30 minutes debugging Cloudflare tunnel connectivity
5. Finally realize: "Oh, it's http not https"

**Time wasted:** 30+ minutes

### With Hooks (New Workflow)

Same mistake, but with hooks:
```yaml
ingress:
  - hostname: jazzlive.taylorshome.cc
    service: http://localhost:8888  # Same mistake
```

**What happens:**
1. You save the file
2. **afterEdit hook runs immediately** ✅
3. You see: `✓ ~/.cloudflared/config.yml - Valid YAML`
4. But later you test and notice 502 errors
5. You read the hook output and realize config is valid YAML but service needs HTTPS
6. You check QUICK_COMMANDS.md or /tunnel skill for guidance
7. You fix to `https://localhost:8888`
8. Save again, hook validates ✅

**Time saved:** Caught the issue before commit/deploy

---

## Requirements

Hooks need either:
- **python3** (most systems have this) - validates via `yaml.safe_load()`
- **yq** (YAML command-line tool) - alternative validator

Check if you have them:
```bash
python3 -c "import yaml; print('✓ python3 yaml available')"
yq --version  # Check yq
```

If missing python3, install it:
```bash
sudo apt-get install python3  # Ubuntu/Debian
brew install python3  # macOS
```

---

## Disabling Hooks

If you need to skip validation (rarely needed):

**Skip one hook:**
```bash
# Validate manually before committing
~/.claude/hooks/validate-yaml.sh ~/.cloudflared/config.yml
git commit -m "..."  # Commit even if hook would fail
```

**Disable all hooks:**
Delete/rename `~/.claude/hooks.json`

---

## Adding New Hooks

To add validation for other file types:

1. Create script: `~/.claude/hooks/validate-xxx.sh`
2. Add to `~/.claude/hooks.json`:
```json
{
  "hooks": {
    "afterEdit": {
      "hooks": [
        {
          "name": "validate-xxx",
          "glob": "**/*.xxx",
          "command": "~/.claude/hooks/validate-xxx.sh $FILE",
          "failOnError": false
        }
      ]
    }
  }
}
```

### Ideas for Future Hooks

- **JSON validation** - Validate `teams.json` syntax
- **Shell script linting** - Check `.sh` files with `shellcheck`
- **Docker validation** - Validate `Dockerfile` with `docker build --check`
- **Environment validation** - Check `.env` for required variables
- **Git commit message** - Enforce commit message format

---

## Benefits

| Before | After |
|--------|-------|
| Discover config errors in production | Catch errors immediately on save |
| 30min debugging sessions | Fix caught before commit |
| Broken deploys from config typos | All committed configs guaranteed valid |
| Manual validation steps | Automatic validation |

---

## Configuration Reference

**File:** `~/.claude/hooks.json`

**Hook Events:**
- `afterEdit` - File saved in editor
- `beforeSave` - Before file writes to disk
- `beforeCommit` - Before git commit

**Hook Fields:**
- `name` - Hook identifier
- `glob` - Files to match (e.g., `**/*.yml`)
- `command` - Command to run (`$FILE` = filename)
- `failOnError` - true = block save/commit on error
- `description` - What the hook does

---

## Troubleshooting

**Hook not running:**
- Check file matches glob pattern
- Verify hook.json syntax: `python3 -m json.tool ~/.claude/hooks.json`
- Ensure script is executable: `chmod +x ~/.claude/hooks/validate-yaml.sh`

**Hook running but not validating:**
- Check python3/yq installed
- Test manually: `~/.claude/hooks/validate-yaml.sh ~/.cloudflared/config.yml`
- Check script permissions: `ls -la ~/.claude/hooks/`

**False positives:**
Some YAML is valid but questionable. Hooks only catch syntax errors, not logic errors.

---

**Created:** 2026-02-13
**Status:** Active
**Files:** validate-yaml.sh, hooks.json

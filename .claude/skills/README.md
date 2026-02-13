# Custom Skills

Reusable prompt templates for infrastructure work. Invoked with `/skillname` in Claude Code.

---

## Available Skills

### `/tunnel` - Cloudflare Tunnel Setup

Configure Cloudflare Tunnels safely with protocol validation and best practices.

**Use cases:**
- Adding new tunnel routes
- Debugging tunnel connection issues
- Validating HTTP vs HTTPS protocols
- Generating tunnel configs

**Key benefits:**
- Enforces protocol best practices (HTTPS for web services)
- Checks for existing credentials before asking
- Validates DNS record configuration
- Orders ingress rules correctly

**Example:**
```
/tunnel Add route for new app on port 9000
```

---

### `/migrate` - Docker App Migration

Systematically migrate containerized applications between machines.

**Use cases:**
- Moving apps from Unraid to local machine
- Cloning services to new hardware
- Setting up backups/redundancy
- Consolidating infrastructure

**Key benefits:**
- Handles port configuration updates
- Manages Cloudflare routing updates
- Validates dependencies
- Generates step-by-step migration plan

**Example:**
```
/migrate Jazz-Stats from Unraid to local (port 8888)
```

---

### `/debug` - Infrastructure Troubleshooting

Systematically diagnose infrastructure issues layer-by-layer.

**Use cases:**
- Service not responding
- Port conflicts
- DNS resolution failures
- Tunnel disconnection
- Application errors

**Key benefits:**
- Checks constraints first (no remote SSH, no sudo)
- Diagnoses by layer (process → port → service → API → tunnel → DNS)
- Provides quick diagnostic scripts
- References known issues from DEBUGGING_LOG.md

**Example:**
```
/debug Jazz-Stats returns 502 error
```

---

## How to Use

### In Claude Code

Simply type the skill name as a slash command:

```
/tunnel Configure new app on port 9000

/debug Why is nhlteams.taylorshome.cc down?

/migrate Move NHL Tracker to another machine
```

Claude will load the skill's guidance and apply best practices to your request.

### What the Skills Do

1. **Encode best practices** from successful infrastructure work
2. **Prevent common mistakes** (like using HTTP for services that need HTTPS)
3. **Check constraints first** (remind Claude it can't SSH to remote machines)
4. **Reference related files** (DEBUGGING_LOG.md, QUICK_COMMANDS.md, etc.)
5. **Provide diagnostic workflows** (step-by-step troubleshooting)

### Skill Structure

Each skill is a `.md` file containing:
- **When to use** - appropriate use cases
- **Constraints & best practices** - what to check first
- **Workflow** - step-by-step process
- **Example invocations** - how to call the skill
- **Key commands** - copy-paste ready commands
- **Related files** - references to documentation
- **Common issues** - known problems and solutions

---

## Creating New Skills

To add a new skill:

1. Create directory: `.claude/skills/skillname/`
2. Create file: `SKILL.md`
3. Structure it like the existing skills (When to Use → Constraints → Workflow → Examples → Commands)
4. Reference related files and documentation
5. Include real examples from your work

---

## Skill Philosophy

Skills are **constraints + workflows + examples** encoded from real experience. They:

- ✅ Prevent repetition (don't re-explain setup each chat)
- ✅ Prevent mistakes (encode lessons learned)
- ✅ Save context (reference files instead of explaining)
- ✅ Speed up work (pre-validated approaches)
- ❌ Don't replace thinking (they're guidance, not automation)

---

## Skills Created

- **tunnel** - Created Feb 13 during Cloudflare migration
- **migrate** - Created Feb 13 during Unraid→Local app migration
- **debug** - Created Feb 13 to systematize troubleshooting

All encode lessons from the intensive infrastructure day on 2026-02-13.

---

## Next Skills to Consider

- `/docker` - Containerization & deployment
- `/api` - Setting up API proxies
- `/backup` - Backup and recovery procedures
- `/monitor` - Setting up monitoring/alerting

---

**Last Updated:** 2026-02-13
**Total Skills:** 3
**Context Saved:** ~500 tokens per skill invocation vs. manual explanation

# CLAUDE.md - Project Context & Guidelines

This file provides guidance to Claude Code (and other Claude instances) when working on this repository.

---

## Project Overview

**Repository:** https://github.com/brtcruiser1234/standard/
**Owner:** Brandon Taylor (brandon@nettaylor.com)
**Created:** 2026-02-13

This repository contains two sports statistics web applications:
1. **Jazz-Stats** - Utah Jazz NBA game dashboard
2. **NHL Team Tracker** - Multi-team NHL statistics platform

Both applications are currently running locally and exposed via Cloudflare Tunnel.

---

## Key Context

### User Preferences & Workflow

- **Parallel Processing:** User prefers tasks run in parallel using multiple agents when possible
- **Communication Style:** Direct and concise; skip unnecessary explanations
- **Commitment Style:** Create NEW commits, never amend existing ones (preserves git history)
- **Co-authored Commits:** Do NOT add "Co-Authored-By" lines to commits unless explicitly requested
- **Planning:** Use EnterPlanMode for non-trivial implementation tasks
- **Documentation:** Proactively document decisions and setup in this file

### Infrastructure

**Local Machine:**
- OS: Linux (Ubuntu 24.04)
- User: brandon
- Home: /home/brandon
- Working Directory: /home/brandon (git repo root)

**Running Applications:**
- Jazz-Stats: `http://localhost:8888` (port 8888)
- NHL Tracker: `http://localhost:3050` (port 3050)
- SSH Tunnel: `localhost:9090`

**Public Access (Cloudflare):**
- Jazz-Stats: `https://jazzlive.taylorshome.cc`
- NHL Tracker: `https://nhlteams.taylorshome.cc`
- Tunnel: m900-ssh (ID: 4afbda9b-6542-4b5b-8e49-128ec7c20ed7)

**Cloudflare Credentials:**
- Email: brandon@nettaylor.com
- API Token: `4fDKE7Aq-u80sFLTHfTkDhkQujSnHbBgsBvXRIvq` (stored in ~/.env)
- Zone ID: 944c6fa922334d8c290328d58c276fee
- Account Tag: f564d1bba763e069b63f7ebf3481a2b5

### SSH/SCP Access

**Unraid Server:**
- IP: 10.1.10.193
- User: root
- Method: SSH key (`~/.ssh/unraid_key`)
- Apps Running: None currently (migrated to local machine)
- Note: Cannot SSH interactively, only SCP for file transfer

### Process Management

**Running Servers:**
```bash
# Check status
ps aux | grep -E "npm|node|cloudflared" | grep -v grep

# Start Jazz-Stats
cd /home/brandon/jazz-stats && PORT=8888 npm start &

# Start NHL Tracker
cd /home/brandon/nhl-team-tracker && PORT=3050 npm start &

# Start Cloudflared
/home/brandon/bin/cloudflared tunnel --config ~/.cloudflared/config.yml run &

# View logs
tail -f /tmp/jazz-stats.log
tail -f /tmp/nhl-tracker.log
tail -f /tmp/cloudflared.log
```

**Log Files:**
- Jazz-Stats: `/tmp/jazz-stats.log`
- NHL Tracker: `/tmp/nhl-tracker.log`
- Cloudflared: `/tmp/cloudflared.log`

---

## Application Architecture

### Jazz-Stats (Port 8888)

**Purpose:** Real-time Utah Jazz NBA game dashboard

**Key Files:**
- `jazz-stats/server.js` (110 lines) - Express backend
- `jazz-stats/utah-jazz.html` (2,400+ lines HTML/CSS/JS) - Frontend
- `jazz-stats/package.json` - Dependencies

**Data Sources:**
- ESPN API: `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/`
- NBA Stats API: `https://stats.nba.com/stats/`

**Key Constants:**
- `JAZZ_TEAM_ID = '26'` (ESPN)
- `JAZZ_NBA_TEAM_ID = '1610612762'` (NBA Stats)

**Update Interval:** 15 seconds (during live games)

### NHL Team Tracker (Port 3050)

**Purpose:** Multi-team NHL statistics platform with dynamic theming

**Key Files:**
- `nhl-team-tracker/server.js` (570 lines) - Express + WebSocket backend
- `nhl-team-tracker/game-stats.html` (459KB) - Main dashboard
- `nhl-team-tracker/index.html` (11KB) - Team selector
- `nhl-team-tracker/teams.json` - All 32 NHL teams config

**Data Source:**
- NHL API: `https://api-web.nhle.com/`

**Architecture:**
- WebSocket pub/sub system with team "rooms"
- One polling timer per team (shared across clients)
- Dynamic polling: 5s (LIVE), 1m (pregame), 5m (default)

**Team Selection:**
- Priority: URL parameter > localStorage > redirect to selector
- Persistence: localStorage key `selectedTeam`

**Theming:**
- All 82+ CSS color references use CSS variable `--mammoth-blue`
- Updated dynamically to selected team's primary color
- No page refresh required

---

## Important Notes

### Migration from Unraid (2026-02-13)

Both applications were previously running on Unraid server (10.1.10.193). Today they were:
1. Copied to local machine via SCP
2. Updated `server.js` files to support PORT environment variable
3. Started locally on ports 8888 and 3050
4. DNS records updated to point to local machine's Cloudflare tunnel
5. Old Unraid tunnel routes still exist (nhllive.taylorshome.cc, nhl.taylorshome.cc pointing to old tunnel)
   - Consider cleanup if no longer needed

### Cloudflare Tunnel Setup

**Config File:** `~/.cloudflared/config.yml`

**Current Ingress Rules:**
```yaml
ingress:
  - hostname: jazzlive.taylorshome.cc
    service: http://localhost:8888
  - hostname: nhlteams.taylorshome.cc
    service: http://localhost:3050
  - hostname: m900.taylorshome.cc
    service: https://localhost:9090
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

**Credentials:** `~/.cloudflared/4afbda9b-6542-4b5b-8e49-128ec7c20ed7.json`

**Restart Command:**
```bash
killall cloudflared
/home/brandon/bin/cloudflared tunnel --config ~/.cloudflared/config.yml run > /tmp/cloudflared.log 2>&1 &
```

### Environment Variables

**Location:** `~/.env`

```bash
export CLOUDFLARE_EMAIL="brandon@nettaylor.com"
export CLOUDFLARE_API_TOKEN="4fDKE7Aq-u80sFLTHfTkDhkQujSnHbBgsBvXRIvq"
export CLOUDFLARE_API_KEY="fc7165c47548662f22050e114ce492a430252"
```

Load with: `source ~/.env`

---

## Common Tasks

### Deploy Changes to Production

**Jazz-Stats:**
```bash
cd /home/brandon/jazz-stats
# Edit files, then:
PORT=8888 npm start
# Changes are instant (hot reload not available, restart required)
```

**NHL Tracker:**
```bash
cd /home/brandon/nhl-team-tracker
# Edit files, then:
PORT=3050 npm start
# For frontend changes, restart to refresh static files
```

### Update DNS Records

Use Cloudflare API:
```bash
source ~/.env
curl -X GET "https://api.cloudflare.com/client/v4/zones/944c6fa922334d8c290328d58c276fee/dns_records" \
  -H "X-Auth-Email: ${CLOUDFLARE_EMAIL}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}"
```

### Check Application Status

```bash
# All running processes
ps aux | grep -E "npm|node|cloudflared" | grep -v grep

# Check port listening
lsof -i :8888,:3050,:9090

# Verify DNS resolution
dig jazzlive.taylorshome.cc
dig nhlteams.taylorshome.cc
```

### Restart All Services

```bash
killall node cloudflared 2>/dev/null || true
sleep 2
cd /home/brandon/jazz-stats && PORT=8888 npm start > /tmp/jazz-stats.log 2>&1 &
cd /home/brandon/nhl-team-tracker && PORT=3050 npm start > /tmp/nhl-tracker.log 2>&1 &
/home/brandon/bin/cloudflared tunnel --config ~/.cloudflared/config.yml run > /tmp/cloudflared.log 2>&1 &
```

---

## Known Issues & Workarounds

### Issue 1: Port Already in Use
**Symptom:** "Address already in use 0.0.0.0:8888" or "0.0.0.0:3050"
**Solution:**
```bash
killall node
# Wait 2 seconds
npm start (from correct directory)
```

### Issue 2: Cloudflare Error 1016 (Origin DNS error)
**Symptom:** "Cloudflare is currently unable to resolve your requested domain"
**Causes:**
- DNS records not properly configured in Cloudflare
- Tunnel not connected to Cloudflare edge
- Local services not responding

**Solution:**
1. Verify tunnel is running: `ps aux | grep cloudflared`
2. Verify local servers respond: `curl http://localhost:8888`
3. Check tunnel logs: `tail /tmp/cloudflared.log`
4. Restart tunnel if needed
5. DNS may take a moment to propagate (TTL 1)

### Issue 3: WebSocket Connection Errors (NHL Tracker)
**Symptom:** Game data not updating in real-time
**Solution:**
1. Check if server is running: `ps aux | grep "3050"`
2. Restart NHL Tracker: `cd /home/brandon/nhl-team-tracker && PORT=3050 npm start`
3. Check browser console for errors
4. Verify network connection is stable

---

## File Structure

```
/home/brandon/
├── APPS_DOCUMENTATION.md        # Comprehensive app documentation
├── CLAUDE.md                     # This file
├── jazz-stats/
│   ├── server.js               # Express backend
│   ├── utah-jazz.html          # Frontend (HTML/CSS/JS)
│   ├── package.json            # Dependencies
│   ├── Dockerfile              # Container definition
│   ├── docker-compose.yml      # Docker Compose config
│   ├── setup-unraid.sh         # Unraid deployment
│   └── README.md               # Quick start guide
│
├── nhl-team-tracker/
│   ├── server.js               # Express + WebSocket backend
│   ├── game-stats.html         # Main dashboard
│   ├── index.html              # Team selector
│   ├── teams.json              # NHL teams config
│   ├── package.json            # Dependencies
│   ├── CLAUDE.md               # Project history & fixes
│   ├── Dockerfile              # Container definition
│   ├── docker-compose.yml      # Docker Compose config
│   └── deploy.sh               # Deployment script
│
├── .env                         # Cloudflare credentials
├── .gitignore                  # Git ignore rules
├── .cloudflared/               # Cloudflare tunnel config
│   ├── config.yml              # Tunnel ingress rules
│   └── *.json                  # Credentials
│
└── bin/
    └── cloudflared             # Cloudflared binary

```

---

## Version Information

**Current State:** 2026-02-13
- Both applications successfully migrated from Unraid to local machine
- Running on localhost with ports 8888 and 3050
- Exposed via Cloudflare Tunnel at taylorshome.cc domain
- Complete documentation in APPS_DOCUMENTATION.md
- Source code backed up in GitHub repository

**Node.js Version:** 18.19.1
**Cloudflared Version:** 2026.2.0

---

## Important Reminders

1. **Always use `source ~/.env`** before running Cloudflare API commands
2. **Create NEW commits, never amend** - preserves git history
3. **No co-authored lines** in commits unless explicitly requested
4. **Run parallel tasks with agents** - user prefers efficiency
5. **Unraid tunnel still has old routes** - consider cleanup if apps stay local
6. **WebSocket is resource-efficient** - one timer per team in NHL Tracker, not per client
7. **CSS variables for theming** - no re-renders needed when switching teams in NHL Tracker

---

**Last Updated:** 2026-02-13 by Claude Haiku 4.5
**Status:** Active development
**Contact:** brandon@nettaylor.com

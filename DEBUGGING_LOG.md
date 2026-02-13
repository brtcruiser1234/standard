# Debugging & Issue Log

Running log of issues encountered, their solutions, and current status.

---

## Feb 13 - Application Migration from Unraid to Local Machine

### Issue: Applications Inaccessible After Migration
**Date:** 2026-02-13 18:00 UTC
**Status:** ✅ RESOLVED

**Problem:**
- Jazz-Stats and NHL Team Tracker copied from Unraid (10.1.10.193) to local machine
- Both servers started but Error 1016 (DNS error) returned from Cloudflare

**Root Cause:**
1. server.js files hardcoded PORT to 3000 (didn't respect PORT env variable)
2. DNS records created but Cloudflare tunnel not restarted to pick up new config
3. Tunnel was still trying to route with old configuration

**Solution:**
1. Updated server.js in both apps to support `PORT=8888` and `PORT=3050` env variables
   - Changed: `const PORT = 3000;` → `const PORT = process.env.PORT || 3000;`
2. Created DNS CNAME records pointing both domains to tunnel endpoint:
   - jazzlive.taylorshome.cc → 4afbda9b-6542-4b5b-8e49-128ec7c20ed7.cfargotunnel.com
   - nhlteams.taylorshome.cc → 4afbda9b-6542-4b5b-8e49-128ec7c20ed7.cfargotunnel.com
3. Restarted cloudflared tunnel with updated config
4. Allowed DNS to propagate (TTL 1, resolved within seconds)

**Verification:**
```bash
curl http://localhost:8888 | head  # ✅ Returns Jazz-Stats HTML
curl http://localhost:3050 | head  # ✅ Returns NHL Tracker HTML
https://jazzlive.taylorshome.cc   # ✅ Accessible
https://nhlteams.taylorshome.cc   # ✅ Accessible
```

**Files Modified:**
- jazz-stats/server.js (line 7)
- nhl-team-tracker/server.js (line 9)
- ~/.cloudflared/config.yml (added two ingress rules)

---

## Feb 13 - Unraid Tunnel Cleanup Pending

**Date:** 2026-02-13 18:15 UTC
**Status:** ⏳ PENDING

**Issue:**
Old DNS records still pointing to Unraid tunnel (80236b61-f9d7-4774-9f35-d86e7a3e8701.cfargotunnel.com):
- nhllive.taylorshome.cc
- nhl.taylorshome.cc

**Action Required:**
Decide whether to keep these for fallback or delete them to avoid confusion.

**Decision:** [To be determined by user]

**Related Files:**
- Unraid tunnel still has old routing rules
- Unraid apps no longer running (migrated to local)

---

## Known Working Configurations

### Jazz-Stats (Port 8888)
- ✅ Server: Express + ESPN/NBA Stats API proxies
- ✅ Frontend: Vanilla JS, HTML/CSS
- ✅ Data: Real-time NBA game stats
- ✅ Update interval: 15 seconds during live games
- ✅ Responsive: Mobile, tablet, desktop, TV
- ✅ Deployment: Docker available

### NHL Team Tracker (Port 3050)
- ✅ Server: Express + WebSocket pub/sub
- ✅ Frontend: Vanilla JS with dynamic team theming
- ✅ Data: NHL API real-time stats
- ✅ Teams: All 32 NHL teams supported
- ✅ Persistence: localStorage for team selection
- ✅ Polling: 5s (live), 1m (pregame), 5m (default)
- ✅ Responsive: Mobile, tablet, desktop, TV
- ✅ Deployment: Docker available

### Cloudflare Tunnel
- ✅ Tunnel ID: 4afbda9b-6542-4b5b-8e49-128ec7c20ed7
- ✅ Tunnel Name: m900-ssh
- ✅ Account: f564d1bba763e069b63f7ebf3481a2b5
- ✅ DNS: Both domains resolving correctly
- ✅ SSH: m900.taylorshome.cc on port 22
- ✅ Status: 4 active connections to Cloudflare edge

---

## Troubleshooting Quick Reference

### Jazz-Stats Not Responding

```bash
# Check if running
ps aux | grep "jazz-stats"

# Check port
lsof -i :8888

# Check logs
tail -f /tmp/jazz-stats.log

# Restart
cd /home/brandon/jazz-stats && PORT=8888 npm start
```

### NHL Tracker WebSocket Not Connecting

```bash
# Check server
curl http://localhost:3050

# Check port
lsof -i :3050

# Browser console for errors
# Expected: WebSocket connects to ws://localhost:3050 (or wss:// via tunnel)

# Restart server
cd /home/brandon/nhl-team-tracker && PORT=3050 npm start

# Check logs
tail -f /tmp/nhl-tracker.log
```

### Cloudflare Tunnel Not Connecting

```bash
# Check process
ps aux | grep cloudflared

# Check logs
tail -f /tmp/cloudflared.log

# Expected: "Registered tunnel connection" messages, 4 connections to edge

# Restart
killall cloudflared
/home/brandon/bin/cloudflared tunnel --config ~/.cloudflared/config.yml run &
```

### DNS Not Resolving

```bash
# Test resolution
dig jazzlive.taylorshome.cc
dig nhlteams.taylorshome.cc

# Expected: CNAME → 4afbda9b-6542-4b5b-8e49-128ec7c20ed7.cfargotunnel.com

# If failing:
source ~/.env
# List DNS records (see QUICK_COMMANDS.md)
```

---

## Session Notes

### Session 1: Migration & Setup (Feb 13)
- ✅ Copied both apps from Unraid via SCP
- ✅ Updated server.js for PORT env variable
- ✅ Started both services locally
- ✅ Created DNS records in Cloudflare
- ✅ Restarted Cloudflared tunnel
- ✅ Verified both apps accessible
- ✅ Created APPS_DOCUMENTATION.md
- ✅ Created CLAUDE.md
- ✅ Pushed source code to GitHub
- ✅ Created QUICK_COMMANDS.md
- ✅ Created DEBUGGING_LOG.md

**Status:** ✅ ALL APPLICATIONS LIVE AND ACCESSIBLE

---

## Future Improvements

- [ ] Consider cleaning up old Unraid DNS records (nhllive.*, nhl.*)
- [ ] Monitor Cloudflare tunnel stability over time
- [ ] Document performance metrics (response times, update latency)
- [ ] Set up monitoring/alerting for service health
- [ ] Consider automatic restart script on reboot

---

**Last Updated:** 2026-02-13 18:30 UTC
**Status:** All systems operational ✅

# Quick Commands Reference

Quick access to common commands for maintaining both applications.

---

## Start All Services

```bash
# Jazz-Stats (port 8888)
cd /home/brandon/jazz-stats && PORT=8888 npm start &

# NHL Team Tracker (port 3050)
cd /home/brandon/nhl-team-tracker && PORT=3050 npm start &

# Cloudflared Tunnel
/home/brandon/bin/cloudflared tunnel --config ~/.cloudflared/config.yml run &

# All three (from anywhere)
cd /home/brandon/jazz-stats && PORT=8888 npm start > /tmp/jazz-stats.log 2>&1 &
cd /home/brandon/nhl-team-tracker && PORT=3050 npm start > /tmp/nhl-tracker.log 2>&1 &
/home/brandon/bin/cloudflared tunnel --config ~/.cloudflared/config.yml run > /tmp/cloudflared.log 2>&1 &
```

---

## Check Status

```bash
# All running processes
ps aux | grep -E "npm|node|cloudflared" | grep -v grep

# Ports listening
lsof -i :8888,:3050,:9090

# Check if services responding
curl -s http://localhost:8888 | head -5
curl -s http://localhost:3050 | head -5

# DNS verification
dig jazzlive.taylorshome.cc
dig nhlteams.taylorshome.cc
```

---

## View Logs

```bash
# Jazz-Stats
tail -f /tmp/jazz-stats.log

# NHL Tracker
tail -f /tmp/nhl-tracker.log

# Cloudflared
tail -f /tmp/cloudflared.log

# All logs (new terminal for each)
tail -f /tmp/jazz-stats.log & tail -f /tmp/nhl-tracker.log & tail -f /tmp/cloudflared.log
```

---

## Restart Individual Services

```bash
# Restart Jazz-Stats
killall npm 2>/dev/null || true
sleep 1
cd /home/brandon/jazz-stats && PORT=8888 npm start > /tmp/jazz-stats.log 2>&1 &

# Restart NHL Tracker
killall npm 2>/dev/null || true
sleep 1
cd /home/brandon/nhl-team-tracker && PORT=3050 npm start > /tmp/nhl-tracker.log 2>&1 &

# Restart Cloudflared
killall cloudflared 2>/dev/null || true
sleep 2
/home/brandon/bin/cloudflared tunnel --config ~/.cloudflared/config.yml run > /tmp/cloudflared.log 2>&1 &
```

---

## Restart All Services

```bash
killall node cloudflared 2>/dev/null || true
sleep 2
cd /home/brandon/jazz-stats && PORT=8888 npm start > /tmp/jazz-stats.log 2>&1 &
cd /home/brandon/nhl-team-tracker && PORT=3050 npm start > /tmp/nhl-tracker.log 2>&1 &
/home/brandon/bin/cloudflared tunnel --config ~/.cloudflared/config.yml run > /tmp/cloudflared.log 2>&1 &
echo "All services started. Check logs with: tail -f /tmp/*.log"
```

---

## Cloudflare API Commands

```bash
# Load credentials first
source ~/.env

# List all DNS records
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/944c6fa922334d8c290328d58c276fee/dns_records" \
  -H "X-Auth-Email: ${CLOUDFLARE_EMAIL}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" | jq '.result[] | {name, type, content}'

# Get specific record
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/944c6fa922334d8c290328d58c276fee/dns_records?name=jazzlive.taylorshome.cc" \
  -H "X-Auth-Email: ${CLOUDFLARE_EMAIL}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" | jq '.'

# Update DNS record (replace RECORD_ID)
curl -X PUT "https://api.cloudflare.com/client/v4/zones/944c6fa922334d8c290328d58c276fee/dns_records/RECORD_ID" \
  -H "X-Auth-Email: ${CLOUDFLARE_EMAIL}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"type":"CNAME","name":"jazzlive","content":"4afbda9b-6542-4b5b-8e49-128ec7c20ed7.cfargotunnel.com","ttl":1,"proxied":true}'
```

---

## File Transfer to Unraid

```bash
# Copy to Unraid
scp -i ~/.ssh/unraid_key file.txt root@10.1.10.193:/path/to/destination/

# Recursive copy
scp -r -i ~/.ssh/unraid_key /local/directory root@10.1.10.193:/remote/path/

# Copy from Unraid
scp -i ~/.ssh/unraid_key root@10.1.10.193:/remote/file.txt /local/path/
```

---

## Git Operations

```bash
# Check status
git status

# Add and commit
git add .
git commit -m "Your message here"

# Push to GitHub
git push

# View recent commits
git log --oneline -5

# Add remote (if needed)
git remote add origin https://github.com/brtcruiser1234/standard/
```

---

## Common Issues & Quick Fixes

```bash
# Port already in use
lsof -i :8888
kill -9 <PID>

# Port 3050 in use
lsof -i :3050
kill -9 <PID>

# Cloudflare tunnel not connecting
# Check: tail -f /tmp/cloudflared.log
# Restart: killall cloudflared && /home/brandon/bin/cloudflared tunnel --config ~/.cloudflared/config.yml run &

# WebSocket connection failing (NHL Tracker)
# Check server: curl http://localhost:3050
# Restart: killall npm && cd /home/brandon/nhl-team-tracker && PORT=3050 npm start

# DNS not resolving
dig jazzlive.taylorshome.cc
# If failing, check CLOUDFLARE DNS records: source ~/.env && curl ... (see above)
```

---

## Environment Variables

```bash
# Load Cloudflare credentials
source ~/.env

# Check what's loaded
echo $CLOUDFLARE_EMAIL
echo $CLOUDFLARE_API_TOKEN
echo $CLOUDFLARE_API_KEY
```

---

**See CLAUDE.md for detailed context and DEBUGGING_LOG.md for troubleshooting history.**

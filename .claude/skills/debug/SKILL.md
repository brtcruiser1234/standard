# /debug - Infrastructure Troubleshooting

Systematically diagnose and fix infrastructure issues.

## When to Use

- Service not responding
- Port conflicts
- DNS not resolving
- Cloudflare tunnel disconnected
- Application errors

## Constraints & Best Practices

1. **Check Limitations First**
   - Claude Code cannot SSH into remote machines
   - Cannot use sudo directly
   - Cannot make outbound network connections
   - Generate commands for you to run, don't try to execute remotely

2. **Diagnosis Order**
   - Process running? → Port listening? → Service responding? → Logs show errors?
   - One layer at a time (bottom-up)

3. **Information Gathering**
   - Always ask for error messages (full output, not summary)
   - Check logs first: `/tmp/*.log`
   - Provide relevant config files if applicable

4. **Documentation**
   - Update DEBUGGING_LOG.md with findings
   - Record root cause and solution
   - Note if it's a known issue

## Workflow

1. **Scope** the problem
   - Which component? (Jazz-Stats, NHL Tracker, Cloudflare, Unraid?)
   - When did it start?
   - What changed?
   - Errors seen where? (browser, logs, terminal?)

2. **Check Status** by layer

   **Layer 1: Process**
   ```bash
   ps aux | grep -E "npm|node|cloudflared" | grep -v grep
   ```
   If no process: start it

   **Layer 2: Port**
   ```bash
   lsof -i :8888  # or 3050, 9090, etc.
   ```
   If port not listening: process crashed, check logs
   If port in use by wrong process: kill it

   **Layer 3: Local Connectivity**
   ```bash
   curl http://localhost:8888
   ```
   If 200 response: service working
   If connection refused: port not listening (see Layer 2)
   If HTML returned: frontend loaded

   **Layer 4: API Connectivity** (if applicable)
   ```bash
   curl http://localhost:8888/api/endpoint
   ```
   If proxy works: backend connected to external API
   If error: check proxy code or external API status

   **Layer 5: Cloudflare Tunnel**
   ```bash
   ps aux | grep cloudflared
   tail -f /tmp/cloudflared.log
   ```
   If not running: start it
   If running but errors: check logs for specific error

   **Layer 6: DNS**
   ```bash
   dig jazzlive.taylorshome.cc
   ```
   If CNAME doesn't resolve: DNS record missing or wrong
   If resolves but 502 error: tunnel not connected (see Layer 5)

   **Layer 7: Public URL**
   ```bash
   curl https://jazzlive.taylorshome.cc
   ```
   If connection refused: check DNS
   If 502/503: check tunnel connection
   If 200 but wrong content: check routing rules

3. **Investigate** deeper
   - Read full error logs (not just summary)
   - Check application code if needed
   - Search DEBUGGING_LOG.md for similar issues
   - Look for common patterns (port conflicts, missing env vars, etc.)

4. **Fix** based on root cause
   - Restart service: `killall npm && cd /path && PORT=XXXX npm start &`
   - Restart tunnel: `killall cloudflared && /home/brandon/bin/cloudflared ...`
   - Update config files (YAML, env vars)
   - Fix code and redeploy

5. **Verify** fix works
   - Retest all layers above where issue was
   - Test public URL if it was a routing/DNS issue
   - Check logs for new errors
   - Document solution in DEBUGGING_LOG.md

## Example Invocations

```
/debug Jazz-Stats returns 502 error
/debug Port 8888 already in use
/debug nhlteams.taylorshome.cc DNS not resolving
/debug Cloudflare tunnel keeps disconnecting
/debug NHL Tracker WebSocket connection failing
```

## Quick Diagnostic Scripts

```bash
# All-in-one health check
echo "=== Processes ===" && \
ps aux | grep -E "npm|node|cloudflared" | grep -v grep && \
echo "=== Ports ===" && \
lsof -i :8888,:3050,:9090 && \
echo "=== Local Tests ===" && \
curl -s http://localhost:8888 | head -3 && \
curl -s http://localhost:3050 | head -3 && \
echo "=== Tunnel ===" && \
ps aux | grep cloudflared | grep -v grep && \
echo "=== DNS ===" && \
dig jazzlive.taylorshome.cc | grep CNAME
```

## Common Issues & Solutions

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| "Address already in use" | Old process still running | `killall npm` then restart |
| Connection refused on localhost:PORT | Service not running | Check logs, verify PORT env var |
| 502 error on public URL | Tunnel not connected | Check `ps aux \| grep cloudflared` and logs |
| DNS not resolving | DNS record missing/wrong | Check Cloudflare dashboard, verify CNAME |
| Service crashes on start | Dependency missing or port conflict | Check logs, verify npm install, check lsof |
| WebSocket connection fails | Tunnel not allowing WebSocket | Verify tunnel config includes service |

## Related Files

- **QUICK_COMMANDS.md** - Status checks, restart commands
- **DEBUGGING_LOG.md** - Past issues and solutions
- **CLAUDE.md** - Environment setup, constraints
- **APPS_DOCUMENTATION.md** - App architecture for deep debugging

## When to Escalate

- Issue not in DEBUGGING_LOG.md or QUICK_COMMANDS.md
- Requires code changes beyond config
- Needs investigation of external APIs (ESPN, NHL, etc.)
- Involves Unraid or remote machine administration

---

*This skill encodes systematic troubleshooting approach from Feb 13 infrastructure work.*

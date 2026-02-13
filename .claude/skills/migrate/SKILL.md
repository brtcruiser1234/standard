# /migrate - Docker App Migration

Systematically migrate containerized applications between machines.

## When to Use

- Moving apps from Unraid to local machine (or vice versa)
- Cloning existing services to new hardware
- Setting up redundant/backup instances
- Consolidating infrastructure

## Constraints & Best Practices

1. **Connectivity**
   - Cannot SSH directly to remote machines
   - Can only SCP files to/from remote
   - Generate scripts for remote execution, not direct commands

2. **Port Configuration**
   - Respect PORT environment variable in server files
   - Check `server.js` for hardcoded ports: change `const PORT = 3000` to `const PORT = process.env.PORT || 3000`
   - Verify new port doesn't conflict: `lsof -i :PORT`

3. **Cloudflare Routing**
   - Update DNS records to point to new machine's tunnel
   - Update tunnel ingress rules with new local ports
   - Restart tunnel after config changes

4. **Data & State**
   - Both apps are stateless (no databases)
   - localStorage persists only in browser (team selection in NHL Tracker)
   - No persistent storage migration needed

5. **Dependencies**
   - Run `npm install` after copying
   - Check package.json for exact versions
   - Node.js v18+ required

## Workflow

1. **Inventory** source application
   - Identify all files needed (server.js, HTML, config, etc.)
   - List dependencies
   - Check for hardcoded ports or paths
   - Document current port mappings

2. **Prepare** destination
   - Verify destination machine has Node.js installed
   - Choose destination port (avoid conflicts)
   - Ensure destination has network access for APIs

3. **Copy** application files
   - Use SCP for remote machines: `scp -r -i ~/.ssh/key app user@host:/path/`
   - Copy to local: `cp -r source dest`
   - Preserve file permissions: `chmod +x scripts`

4. **Update** configuration
   - Modify server.js to support PORT env variable
   - Update any hardcoded localhost references
   - Check for API endpoints that need updating

5. **Install** dependencies
   - Run `npm install` in app directory
   - Verify all packages installed: `npm list`
   - Check for outdated packages: `npm outdated`

6. **Test** locally
   - Start service: `PORT=XXXX npm start`
   - Check logs for errors
   - Verify API connectivity: `curl http://localhost:PORT`
   - Test key features (load page, fetch data, etc.)

7. **Update** tunnel routing
   - Add new ingress rule in `~/.cloudflared/config.yml`
   - Create/update DNS record pointing to new machine
   - Restart cloudflared tunnel
   - Verify public URL accessible

8. **Verify** full connectivity
   - Test from public URL (https://domain.com)
   - Check browser DevTools for errors
   - Monitor logs for issues
   - Document in DEBUGGING_LOG.md

## Example Invocations

```
/migrate Jazz-Stats from Unraid to local (port 8888)
/migrate NHL Tracker to backup machine
/migrate new-app from GitHub to port 9000
```

## Key Commands

```bash
# Copy app from remote
scp -r -i ~/.ssh/unraid_key root@10.1.10.193:/mnt/user/appdata/jazz-stats ./

# Copy app to remote
scp -r -i ~/.ssh/key ./app user@host:/destination/

# Install dependencies
cd /path/to/app && npm install

# Test locally
PORT=8888 npm start

# Check for port conflicts
lsof -i :8888

# Update cloudflared config
nano ~/.cloudflared/config.yml
# Then restart:
killall cloudflared && sleep 2 && /home/brandon/bin/cloudflared tunnel --config ~/.cloudflared/config.yml run &

# Verify DNS
dig newdomain.taylorshome.cc

# Test public URL
curl https://newdomain.taylorshome.cc
```

## Related Files

- **QUICK_COMMANDS.md** - Service startup commands
- **CLAUDE.md** - Environment constraints, SSH/SCP details
- **DEBUGGING_LOG.md** - Past migrations and lessons learned

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port already in use | `lsof -i :PORT` then `kill -9 PID` |
| npm install fails | Check Node.js version: `node -v` (need v18+) |
| Server doesn't start | Check logs, verify PORT env var is set |
| API calls fail | Verify backend proxy endpoints exist (e.g., `/api/*`) |
| Cloudflare Error 1016 | DNS record missing or tunnel not connected |

---

*This skill encodes the Feb 13 Jazz-Stats + NHL Tracker migration from Unraid.*

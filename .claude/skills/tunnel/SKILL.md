# /tunnel - Cloudflare Tunnel Setup

Safely configure Cloudflare Tunnels with protocol validation and best practices.

## When to Use

- Setting up new tunnel routes
- Debugging tunnel connection issues
- Validating tunnel protocols (HTTP vs HTTPS)
- Generating tunnel config for services

## Constraints & Best Practices

1. **Protocol Rules**
   - Web services (Cockpit, dashboards): Always use HTTPS
   - APIs: Use HTTPS unless internal-only
   - SSH: Cannot be proxied through HTTP tunnels (use Tailscale instead)
   - Raw TCP: Not supported by Cloudflare Tunnel

2. **Configuration**
   - Check for existing Cloudflare credentials in `~/.env` before asking user
   - Validate tunnel ID and account tag exist
   - Order ingress rules: specific hostname rules FIRST, catch-all LAST
   - Always include `http_status:404` as fallback

3. **DNS**
   - DNS records must be CNAME pointing to tunnel's cfargotunnel.com endpoint
   - Set TTL to 1 (automatic) for testing, 300+ for production
   - Verify DNS resolves with `dig domain.com`

4. **Limitations**
   - Cannot proxy raw SSH (port 22) - use Tailscale or VPN
   - All traffic is HTTPS encrypted end-to-end
   - Maximum ingress rules: typically 50 per tunnel

## Workflow

1. **Discover** current tunnel setup
   - Check `~/.cloudflared/config.yml` for existing rules
   - List existing DNS records with API
   - Identify conflicts or duplicates

2. **Validate** desired configuration
   - Check protocol requirements (HTTP vs HTTPS)
   - Verify port is listening locally
   - Confirm DNS record doesn't already exist

3. **Generate** updated config
   - Add new ingress rule(s) in correct order
   - Include origRequest settings if needed (noTLSVerify for self-signed, etc.)
   - Preserve fallback rule

4. **Test** locally before restarting
   - `cloudflared config -c ~/.cloudflared/config.yml` (validates syntax)
   - Restart tunnel: `killall cloudflared && /home/brandon/bin/cloudflared tunnel --config ~/.cloudflared/config.yml run &`
   - Wait 10-15 seconds for connections to stabilize
   - Verify with `dig domain.name` and `curl https://domain.name`

5. **Document** in DEBUGGING_LOG.md
   - What rule was added
   - Why (service, purpose)
   - Status and verification command

## Example Invocations

```
/tunnel Add route for port 9000 (new app)
/tunnel Debug why jazzlive.taylorshome.cc returns 502
/tunnel Validate config.yml syntax
/tunnel List all current ingress rules
```

## Key Commands

```bash
# Load credentials
source ~/.env

# Validate config syntax
cloudflared config -c ~/.cloudflared/config.yml

# Check tunnel status
ps aux | grep cloudflared

# Restart tunnel
killall cloudflared && sleep 2 && /home/brandon/bin/cloudflared tunnel --config ~/.cloudflared/config.yml run &

# Test DNS
dig jazzlive.taylorshome.cc

# Test HTTPS connection
curl -v https://jazzlive.taylorshome.cc

# View tunnel logs
tail -f /tmp/cloudflared.log
```

## Related Files

- **Config:** `~/.cloudflared/config.yml`
- **Credentials:** `~/.cloudflared/4afbda9b-6542-4b5b-8e49-128ec7c20ed7.json`
- **Reference:** See CLAUDE.md → Cloudflare Configuration section
- **Commands:** See QUICK_COMMANDS.md → Cloudflare API Commands

---

*This skill encodes best practices learned Feb 13 during migration from Unraid.*

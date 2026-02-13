# Utah Jazz Stats - WORKING ESPN VERSION ✅

## ✅ What Works Now

This simplified version focuses on **what ESPN's API allows reliably**:

- ✅ **Today's live game** with scores and logos
- ✅ **Recent & upcoming games** (last 5 + next 5)
- ✅ **Auto-refresh** every 30 seconds
- ✅ **Quick links** to ESPN and NBA.com for full stats/standings
- ✅ **No more 403 errors!**

## 🎯 Why This Version?

ESPN's API has restrictions on certain endpoints (like standings). This version uses only the **most reliable endpoints**:

1. **Scoreboard** - Today's games ✅ Works perfectly
2. **Team Schedule** - Jazz schedule ✅ Works perfectly  
3. **External Links** - For full stats/standings ✅ Always available

Result: **No more errors, reliable data!**

## 🚀 Quick Setup

### 1. Stop Old Container (if running)
```bash
docker stop utah-jazz-stats
docker rm utah-jazz-stats
```

### 2. Upload Files to unRAID
Upload these files to `/mnt/user/appdata/jazz-stats/`:
- `utah-jazz.html` (updated)
- `server.js`
- `package.json`
- `Dockerfile`
- `setup-unraid.sh`

### 3. Run Setup Script
```bash
cd /mnt/user/appdata/jazz-stats
./setup-unraid.sh
```

### 4. Access Your Dashboard
```
http://YOUR-UNRAID-IP:8888
```

## 📊 What You'll See

### Today's Game Card
- **Live scores** (updates every 30 seconds during games)
- **Team logos** from ESPN
- **Win/Loss indicator** for completed games
- **Live indicator** for games in progress
- **Game time** for upcoming games
- **Team records** (W-L)

### Recent & Upcoming Schedule
- **Last 5 games** with results (W/L scores)
- **Next 5 games** with dates and times
- **Home/Away indicator** (vs/@ opponent)
- **Today/Tomorrow** labels for easy scanning

### Quick Links
Direct links to:
- ESPN's full Jazz stats page
- Official Utah Jazz website
- Full season schedule on ESPN
- NBA standings

## 🔧 How It Works

```
Browser → Your Server (port 8888) → ESPN API → Display
```

**ESPN Endpoints Used:**
- Scoreboard: `scoreboard` (today's games)
- Schedule: `teams/26/schedule` (Jazz full schedule)

These are ESPN's **most open and reliable endpoints**!

## 🏀 Go Jazz!

Access at: `http://YOUR-UNRAID-IP:8888`

Enjoy reliable, error-free Jazz stats! 🎉

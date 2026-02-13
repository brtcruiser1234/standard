# Applications Documentation

This document provides comprehensive documentation for both web applications currently running on this machine.

---

## Table of Contents

1. [Jazz-Stats (Utah Jazz NBA Dashboard)](#jazz-stats-application)
2. [NHL Team Tracker](#nhl-team-tracker-application)

---

## Jazz-Stats Application

**URL:** https://jazzlive.taylorshome.cc
**Local:** http://localhost:8888
**Port:** 8888 (container: 3000)

### Overview

Jazz-Stats is a specialized **real-time NBA game dashboard** focused exclusively on Utah Jazz games. It's a full-stack web application combining a Node.js/Express backend with a sophisticated, responsive HTML/CSS/JavaScript frontend.

### Key Features

- **Live Game Dashboard** - Real-time score display with team logos, current quarter, game clock
- **Automatic Updates** - Auto-refreshes every 15 seconds during live games
- **Quarter-by-Quarter Scores** - Displays scores for each quarter and overtime periods
- **Live Lineups** - Shows 5 on-court players with headshots, jersey numbers, points
- **Play-by-Play Feed** - Latest 2 plays in mini view; full history in detailed tab
- **Box Score** - Complete player statistics (MIN, PTS, REB, AST, FG, 3PT, FT, STL, BLK, TO, PF)
- **Team Statistics** - Head-to-head comparison stats for both teams
- **Schedule Management** - Shows upcoming games with dates, times, countdown timers
- **Game History** - Displays most recent completed game with result
- **TV Mode** - Full-screen, tabs-hidden display mode for wall-mounted monitors
- **Responsive Design** - Works seamlessly on mobile, tablet, and desktop (6 breakpoints)

### Data Sources

**Primary: ESPN API**
- Base: `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/`
- Endpoints: `scoreboard`, `summary?event={gameId}`, `teams/{teamId}/schedule`

**Secondary: NBA Stats API**
- Base: `https://stats.nba.com/stats/`
- Endpoints: `scoreboardV2`, `gamerotation`
- Uses custom headers for authentication mimicry

### Technology Stack

| Technology | Purpose |
|-----------|---------|
| **HTML5** | Structure with semantic markup |
| **CSS3** | 2,400+ lines: dark theme, animations, responsive design |
| **JavaScript (Vanilla)** | ~850 lines of async/await logic, no frameworks |
| **Google Fonts** | Orbitron font for scoreboard aesthetic |
| **ESPN CDN** | Team logos and assets |

### Architecture

```
Server (Node.js/Express) - 110 lines
├── GET / → Serve utah-jazz.html
├── GET /api/* → ESPN API proxy
└── GET /nba/* → NBA Stats API proxy

Frontend
├── HTML: Semantic markup with responsive meta tags
├── CSS: Dark theme (#0a0a0a) with accent color (#F9A01B Jazz gold)
└── JavaScript: Modular functions, polling, DOM manipulation
```

### Key JavaScript Functions

- `loadGameData()` - Fetches today's games, finds Jazz game, renders scoreboard
- `renderScoreboard(event)` - Generates HTML for main display
- `loadLineupData()` - Fetches player stats and rotation data
- `loadMiniPlayByPlay()` - Fetches latest 2 plays
- `startAutoRefresh()` - Sets 15-second polling interval during live games
- `toggleTvMode()` - Fullscreen display mode

### Data Processing

**Game State Detection:**
- `"pre"` → Upcoming game
- `"in"` → Live game
- `"post"` → Completed game

**Player Stats Array Mapping:**
- Index 0: MIN, 1: PTS, 2: AST, 3: FG, 4: FT, 5: REB, 6: OFF, 7: TO, 8: STL, 9: BLK, 12: PF

### Visual Design

- **Theme:** Dark futuristic aesthetic
- **Primary Color:** #0a0a0a (pure black) background
- **Accent:** #F9A01B (Jazz gold)
- **Live Status:** Red gradient (#c41e3a)
- **Responsive Breakpoints:** <380px, 380-599px, 600-767px, 768-999px, 1000-1399px, 1400px+

### Performance Notes

- Lazy loads detailed stats (only when tab clicked)
- Caches team logos from ESPN CDN
- Minimizes API calls (6 main requests on load)
- 15-second auto-refresh (reasonable polling)

### Deployment

```bash
# Development
npm install
node server.js

# Docker
docker run -p 8888:3000 utah-jazz-stats

# Environment
PORT=8888 npm start
```

---

## NHL Team Tracker Application

**URL:** https://nhlteams.taylorshome.cc
**Local:** http://localhost:3050
**Port:** 3050 (container: 3000)

### Overview

NHL Team Tracker is a **real-time NHL game statistics and live game monitoring dashboard** supporting all 32 NHL teams. Users select their favorite team and view comprehensive game data, standings, roster information, and playoff brackets with dynamic team-based theming.

### Key Features

#### Team Selection & Navigation
- Landing page displays all 32 teams organized by conference and division
- Click team → saved to localStorage → redirects to game stats
- "Change Team" button for switching teams
- Persistent selection across browser sessions

#### Game Monitoring Pages
- **Scoreboard** - Real-time game score, time remaining, period info, goals/assists
- **Statistics** - Player performance stats, shot counts, advanced metrics
- **Standings** - League standings with team records
- **Roster** - Complete team roster with player details
- **Playoff Bracket** - Playoff seeding and matchups
- **Game News** - Pregame previews and game articles (during FUT/PRE states)

#### Live Features
- **Play-by-Play Events** - Goals, penalties, assists, event timeline
- **Goal Videos** - Embedded video highlights via Brightcove player
- **Shot Chart** - Visual ice rink display with shot locations and types
- **Penalty Box** - Real-time penalty tracking with player headshots
- **NHL Ticker** - Around-the-league scoreboard showing all games
- **TV Mode** - Fullscreen-optimized display for broadcast viewing
- **Dynamic Team Theming** - All UI elements color-coded to selected team
- **Responsive Design** - Optimized for mobile, tablet, desktop, TV viewing

### Data Sources (NHL Official API)

Base: `https://api-web.nhle.com/`

**Key Endpoints:**

| Endpoint | Purpose |
|----------|---------|
| `/v1/club-schedule-season/{TEAM}/now` | Team's current season schedule |
| `/v1/roster/{TEAM}/current` | Team's current roster |
| `/v1/gamecenter/{gameId}/landing` | Game summary with scoring, penalties |
| `/v1/gamecenter/{gameId}/boxscore` | Detailed player-by-game statistics |
| `/v1/gamecenter/{gameId}/play-by-play` | Event timeline (goals, penalties, etc.) |
| `/v1/gamecenter/{gameId}/right-rail` | Team stats (hits, power play %, faceoff %) |
| `/v1/gamecenter/{gameId}/content` | Game news and articles |
| `/v1/standings/now` | League standings |
| `/v1/score/now` | All games today |
| `/v1/schedule/{YYYY-MM-DD}` | Games and video highlights by date |

### Technology Stack

| Technology | Purpose |
|-----------|---------|
| **HTML5** | Semantic markup with meta tags for social sharing |
| **CSS3** | CSS Custom Properties for dynamic theming, flexbox/grid, animations |
| **JavaScript (Vanilla)** | ES6+ (async/await, destructuring), no frameworks, ~10KB |
| **localStorage API** | Team selection persistence across sessions |
| **Fetch API** | HTTP requests to backend proxy |

### Architecture

```
Frontend (Vanilla JS, Single-Page Application)
├── index.html: Team Selector (32 teams by conference/division)
└── game-stats.html: Main dashboard (459KB HTML/CSS/JS)

Backend (Node.js + Express) - 570 lines
├── GET / → Serve index.html (team selector)
├── GET /api/* → NHL API proxy (https://api-web.nhle.com/)
└── WebSocket server: Real-time data distribution with pub/sub

Data Files
├── teams.json: 32 NHL teams (abbrev, id, colors, divisions)
└── package.json: Dependencies (express, cors, node-fetch, ws)

NHL Official API
└── https://api-web.nhle.com/ (all game data, schedules, stats)
```

### Team Data Structure (`teams.json`)

```json
{
  "abbrev": "BOS",           // 3-letter abbreviation
  "id": 6,                   // NHL team ID
  "name": "Boston Bruins",   // Full official name
  "city": "Boston",          // City name
  "teamName": "Bruins",      // Team nickname
  "color": "#FFB81C",        // Primary team color (hex)
  "division": "Atlantic",    // Division name
  "conference": "Eastern"    // Conference name
}
```

### Team Selection & Persistence

**Priority Chain:**
1. **URL Parameter** (highest) - `?team=BOS`
2. **localStorage** - Saved team from previous session
3. **Fallback** - Redirect to team selector

**Workflow:**
1. User visits root URL → serves `index.html` (team selector)
2. Clicks team card → saves abbreviation to `localStorage['selectedTeam']`
3. Redirects to `game-stats.html?team=BOS`
4. Page loads → parses URL, loads teams.json, applies team theming
5. Future visits → checks localStorage, auto-loads saved team

**Change Team Button:**
```javascript
// Shows confirmation → clears localStorage → redirects to selector
localStorage.removeItem('selectedTeam');
window.location.href = '/';
```

### WebSocket Implementation

**Architecture:**
- Server-side pub/sub system with team "rooms"
- One polling timer per team (not per client)
- Broadcasts cached data to all subscribers
- Dynamic polling intervals based on game state

**Polling Intervals:**
| Game State | Interval | Use Case |
|-----------|----------|----------|
| LIVE/CRIT | 5 seconds | Game actively playing |
| FUT/PRE | 1 minute | Pre-game |
| OFF/FINAL/None | 5 minutes | Post-game or no game |

**Connection Flow:**
1. Client connects → sends `{ type: 'subscribe', team: 'BOS', teamId: 6 }`
2. Server adds client to `teamRooms.get('BOS')`
3. Server sends cached data immediately
4. Server starts polling (if first client for team)
5. Broadcasts new data every N seconds
6. Client closes → removed from room
7. If no clients remain → polling stops

**Data Broadcasted:**
```javascript
{
  type: 'gameData',
  data: {
    team: 'BOS',
    timestamp: 1707753600000,
    scheduleData: { games: [...] },
    gameData: { /* full game info */ },
    gameState: 'LIVE',
    isPreGame: false
  }
}
```

### Game Selection Logic

`findTodaysOrLastGame()` intelligently selects which game to display:

1. **Priority 1:** Live game (LIVE/CRIT state) - always shown if happening now
2. **Priority 2:** Today's game that started/finished (LIVE/CRIT/OFF/FINAL only)
3. **Priority 3:** Upcoming game within 6 hours of start (FUT/PRE) - pregame mode
4. **Priority 4:** Last finished game (OFF state) - shown while waiting

### Dynamic Team Theming

**Updates Applied:**
- Page title: `"Boston Bruins - Live Stats"`
- Favicon: Team logo SVG
- Meta tags: OG image/title for social sharing
- CSS color variable `--mammoth-blue` → team's primary color
- All 82+ CSS references using variable updated dynamically
- Shot chart, penalty box, scoreboard, all themed to team color

### Key JavaScript Functions

- `initializeTeam()` - Loads teams.json, sets up team-specific data
- `fetchGameData()` - Gets schedule, finds today's game, starts polling
- `updateScoreboard()` - Renders live game information
- `fetchRoster()` - Loads and displays team roster
- `renderPlayByPlay()` - Shows game events in timeline
- `updateGoalVideos()` - Fetches and embeds goal highlight videos
- `updatePenaltyBoxes()` - Tracks active penalties in real-time
- `changeTeam()` - Clears localStorage and returns to selector
- WebSocket handlers - Subscribe/unsubscribe from team data streams

### Responsive Design

**Breakpoints:**
- Mobile: < 480px
- Tablet: 480px - 768px
- Desktop: 768px - 1200px
- Large Desktop: > 1200px
- TV Mode: Full-screen, hidden tabs, maximized display

### Performance Optimizations

- Lazy loads detailed stats (only when tab clicked)
- Caches data in memory and localStorage
- One polling timer per team, broadcasts to all clients
- WebSocket for efficient real-time updates
- CSS variables for instant theme changes (no re-renders)
- Minimizes API calls with intelligent caching

### Deployment

```bash
# Development
npm install
node server.js

# Docker
docker run -p 3050:3000 nhl-team-tracker

# Environment
PORT=3050 npm start
```

---

## Deployment & Access

Both applications are running on this machine and exposed via Cloudflare Tunnel:

### Local Access
- Jazz-Stats: `http://localhost:8888`
- NHL Tracker: `http://localhost:3050`

### Public Access (via Cloudflare Tunnel)
- Jazz-Stats: `https://jazzlive.taylorshome.cc`
- NHL Tracker: `https://nhlteams.taylorshome.cc`

### Cloudflare Configuration

**Tunnel:** m900-ssh (ID: 4afbda9b-6542-4b5b-8e49-128ec7c20ed7)

**DNS Records:**
| Domain | Type | Target |
|--------|------|--------|
| jazzlive.taylorshome.cc | CNAME | 4afbda9b-6542-4b5b-8e49-128ec7c20ed7.cfargotunnel.com |
| nhlteams.taylorshome.cc | CNAME | 4afbda9b-6542-4b5b-8e49-128ec7c20ed7.cfargotunnel.com |

**Config File:** `~/.cloudflared/config.yml`

---

## Maintenance & Updates

### Server Management

**View Logs:**
```bash
tail -f /tmp/jazz-stats.log
tail -f /tmp/nhl-tracker.log
tail -f /tmp/cloudflared.log
```

**Restart Services:**
```bash
killall node
cd /home/brandon/jazz-stats && PORT=8888 npm start &
cd /home/brandon/nhl-team-tracker && PORT=3050 npm start &
/home/brandon/bin/cloudflared tunnel --config ~/.cloudflared/config.yml run &
```

**Check Running Processes:**
```bash
ps aux | grep -E "npm|node|cloudflared" | grep -v grep
```

### Database/Configuration

- **Jazz-Stats:** No database, stateless application
- **NHL Tracker:**
  - `teams.json` - Team configuration (update if teams change)
  - `localStorage` - Client-side team selection (no server persistence)

### Monitoring

- **Port 8888:** Jazz-Stats Express server
- **Port 3050:** NHL Tracker Express + WebSocket server
- **Port 9090:** SSH tunnel (via cloudflared)
- **Cloudflared:** Manages tunnel connections to Cloudflare edge

---

## Dependencies

### Jazz-Stats

```json
{
  "express": "~4.18.2",
  "cors": "~2.8.5",
  "node-fetch": "~2.7.0"
}
```

### NHL Team Tracker

```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "node-fetch": "^2.7.0",
  "ws": "^8.x.x"
}
```

---

## Notes for Future Instances

- Both applications are **stateless** - no database, data persisted only in browser
- API proxies in backend **bypass CORS** - browsers can't directly call external APIs
- WebSocket system in NHL Tracker is **resource-efficient** - one timer per team, shared across clients
- Team theming uses **CSS variables** for instant switching without re-renders
- Both use **public APIs** requiring no authentication
- Responsive design supports **6+ device sizes** from small phones to large TV displays

---

**Last Updated:** 2026-02-13
**Location:** /home/brandon (Local Machine)
**Status:** Running and accessible via Cloudflare Tunnel

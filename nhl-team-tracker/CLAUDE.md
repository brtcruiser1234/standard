# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**⚠️ IMPORTANT: This is the master documentation for all fixes, features, and known issues. Every change made to the codebase MUST be recorded here with:**
- What was fixed/added
- Why it was needed (root cause)
- Where in the code it is (file + line numbers)
- How it works
- Any dependencies or side effects
- When it was deployed

**This ensures that any future Claude instance understands the project history and doesn't repeat work or introduce regressions.**

## Project Overview

**NHL Team Tracker** - Generalized version of Utah Mammoth Live Stats. Multi-team web-based NHL hockey live stats display and dashboard. Users select their favorite NHL team and view live game data, statistics, standings, roster, and playoff bracket. Single-page application with Node.js backend that proxies NHL API requests to bypass CORS restrictions.

**Key Features:**
- Team selection landing page with all 32 NHL teams
- URL parameter support (`?team=BOS`)
- localStorage to remember user's team choice
- Dynamic team colors, logos, and branding
- All features from original Utah Mammoth app (scoreboard, stats, standings, roster, playoff bracket)

## Commands

```bash
# Local development (runs on port 3000)
npm start

# Docker deployment (maps to port 9999)
docker-compose up -d

# Manual Docker build
docker build -t mammoth-stats .
docker run -d -p 9999:3000 mammoth-stats
```

**NOTE:** The server is running on the Unraid production server at `10.1.10.193:9999`, not localhost. API calls should be made to the Unraid server, not localhost.

**IMPORTANT:** Current year is 2026 (not 2025). All game data, season dates, and API responses use 2025-2026 season format.

## Multi-Team Implementation Plan

**Goal:** Convert Utah-specific app to support all 32 NHL teams with team selection

**User Flow:**
1. User visits site → sees team selection landing page (index.html)
2. Clicks team → saves to localStorage → redirects to game-stats.html?team=BOS
3. Future visits → reads localStorage → auto-loads their team
4. "Change Team" button in nav → returns to team selector

**Implementation Tasks:** (See Pending Tasks section below for detailed tracking)

### Phase 1: Team Data & Configuration
- [x] Task 1: Create teams.json with all 32 NHL teams (abbrev, id, name, colors, division, logo URLs) ✅
- [x] Task 2: Create team selection landing page (index.html) with card grid of all teams ✅

### Phase 2: Dynamic Team Logic
- [x] Task 3: Rename mammoth-live-stats.html → game-stats.html ✅
- [x] Task 4: Add URL parameter parsing and localStorage logic to game-stats.html ✅
- [x] Task 5: Replace hardcoded UTA constants with dynamic team variables (12 locations) ✅

### Phase 3: UI Updates
- [x] Task 6: Add "Change Team" button to navigation bar ✅
- [x] Task 7: Update page title and branding to show selected team dynamically ✅
- [x] Task 8: Update server.js to serve index.html as default ✅

### Phase 4: Testing
- [x] Task 9: Test team selection flow (select → save → load) ✅
- [x] Task 10: Test 3-4 different teams to verify API calls, colors, logos work correctly ✅

**Affected Files:**
- `index.html` (new file - team selector landing page)
- `teams.json` (new file - NHL team data)
- `mammoth-live-stats.html` → `game-stats.html` (renamed, make dynamic)
- `server.js` (update default route)

**Key Code Changes:**
- Line 5397-5398: Make `UTAH_TEAM_ABBREV` and `UTAH_TEAM_ID` dynamic from URL/localStorage
- All references to hardcoded 'UTA' → use dynamic `selectedTeam.abbrev`
- All team color lookups → use dynamic team data

### Data Lifecycle
**When Player Stats, Scoreboard, and Play-by-Play data are cleared:**
- Data is cleared/refreshed when `currentGameId` changes via `findTodaysOrLastGame()` function (lines 6170-6232)
- Data persists until 6 hours before next game starts (allows time for pregame news/stats)
- `findTodaysOrLastGame()` priority (in order):
  1. Live game (LIVE/CRIT state) - shown immediately if happening now
  2. Today's game that has started/finished (LIVE/CRIT/OFF/FINAL state only, NOT FUT)
  3. Upcoming game within 6 hours before start (FUT state) - lines 6196-6210
  4. Last finished game (OFF state) - shown while waiting for next game
- Key fixes (2026-02-04):
  1. Added game state check to step 2 - now only returns today's game if it has started (LIVE/CRIT) or finished (OFF/FINAL). Does NOT return FUT games early.
  2. Extended pregame window from 1 hour to 6 hours (line 6206: changed `60 * 60 * 1000` to `6 * 60 * 60 * 1000`) - allows showing game preview/news/stats 6 hours before game starts
- Data is continuously refreshed every 10 seconds (or 1 second during LIVE/PRE states) via polling interval
- Browser page refresh clears all variables (reset to null)

## Architecture

**Backend (`server.js`):**
- Express.js server with CORS proxy at `/api/*`
- Forwards requests to `https://api-web.nhle.com/` with User-Agent spoofing
- Serves static files, defaults to `game-stats.html`

**Frontend (`game-stats.html`):**
- Large single-file HTML/CSS/JS application (~288KB)
- Polls NHL API every 10 seconds for live game data
- Pages: Scoreboard, Statistics, Standings, Roster, Playoff Bracket
- Features: Goal banners, play-by-play, player modals with career stats, TV/fullscreen mode
- Responsive design for mobile, tablet, desktop, and TV displays

**API Flow:**
Browser → Express proxy (`/api/*`) → NHL API (`api-web.nhle.com`) → Response back through proxy

## NHL API Endpoints

### Available Endpoints (Tested 2026-02-04)

**Roster & Team Data:**
- `/api/v1/roster/{TEAM_ABBREV}/current` - Returns forwards, defensemen, goalies with player info (no IR/status data)
  - Fields: id, firstName, lastName, sweaterNumber, positionCode, birthDate, heightInInches, weightInPounds, shootsCatches, headshot
  - NO isActive, status, or IR fields available
- `/api/v1/club-schedule-season/{TEAM}/now` - Season schedule
- `/api/v1/club-schedule/{TEAM}/week/now` - Weekly schedule

**Player Data:**
- `/api/v1/player/{playerId}/landing` - Individual player stats and info
  - Has `isActive` field but it's null for current roster

**Game Data:**
- `/api/v1/gamecenter/{gameId}/landing` - Game summary, scoring, penalties, situation
- `/api/v1/gamecenter/{gameId}/boxscore` - Detailed game stats by player
- `/api/v1/gamecenter/{gameId}/play-by-play` - All game events
- `/api/v1/gamecenter/{gameId}/right-rail` - Team stats (hits, PP%, FO%, etc.)
- `/api/v1/gamecenter/{gameId}/content` - Pregame news and articles

**Other:**
- `/api/v1/standings/now` - League standings
- `/api/v1/score/now` - All games today
- `/api/v1/schedule/{YYYY-MM-DD}` - Schedule for specific date
- `/api/v1/edge/skater-detail/{playerId}/{season}/{gameType}` - NHL EDGE stats (speed, shots)

### Injured Reserve Search Results (2026-02-04)
**Status:** No dedicated IR endpoint found in NHL API

**Search Method:**
- Tested 15+ potential endpoints directly against 10.1.10.193:9999
- Consulted GitHub reference: https://github.com/Zmalski/NHL-API-Reference
- Reviewed both api-web.nhle.com and api.nhle.com/stats/rest documentation

**Findings:**
- `/api/v1/roster/UTA/current` - Does NOT include IR players or status field
- `/api/v1/team/{team}/roster/season` - Exists but no injury status in documentation
- Individual player records have no `status`, `injuryStatus`, or `injured` fields
- `isActive` field exists in player landing but returns null
- Boxscore and landing endpoints don't include roster status information
- No `/v1/injuries`, `/v1/roster/IR`, or similar endpoints documented or found

**NHL API Endpoint Categories (Complete List):**
- Player Info, Standings, Stats Leaders, Rosters, Schedules, Game Info, Playoff Info, Draft Info, NHL EDGE Data
- None include injury/IR status

**Options for IR Display:**
1. **Manually maintained** - Hardcoded list that user updates manually
2. **Third-party API** - ESPN, Yahoo Sports, or MySportsFeeds (requires subscription)
3. **Puckpedia API** (PENDING) - User investigating access to Puckpedia's private Data API
4. **Web scraping** - Puckpedia or other sources (fragile, not recommended)
5. **Skip feature** - Show only active roster (current implementation)

**Puckpedia API (Pending Implementation - 2026-02-04):**
- User obtaining access to Puckpedia's private Data API for injuries data
- Implementation ready to proceed once API details provided
- Task #1 created: "Implement Puckpedia Injuries API in Roster section"

**REQUIRED FROM USER:**
1. Puckpedia API endpoint URL
2. Authentication method (API key, bearer token, basic auth, etc.)
3. Example API response format/structure
4. Query parameters for filtering by team (or method to filter for Utah)

**IMPLEMENTATION LOCATION:**
- File: game-stats.html
- Function: updateRoster() (lines 10389+)
- Display: Under NHL EDGE speed stats, above FORWARDS section
- Content: Player name, number, position, injury status, expected return date

**NEXT STEPS:**
1. User obtains Puckpedia API details
2. Provide API endpoint, auth, response format to Claude
3. Claude implements fetchInjuries() and renderIRList() functions
4. Deploy via SCP + docker restart
5. Update CLAUDE.md with deployment date and final implementation details

## Pending Tasks & Known Issues

### Multi-Team Implementation Tasks (Active)

**Task #1: Create teams.json with NHL team data**
- Status: ✅ Completed (2026-02-05)
- Description: Create teams.json file with all 32 NHL teams (abbrev, id, name, colors, division, logo URLs)
- Location: /nhl-team-tracker/teams.json
- Details: Created JSON file with all 32 teams including abbrev, id, full name, city, team name, primary color, division, conference. Added URL patterns for logos and mugshots.

**Task #2: Create team selection landing page (index.html)**
- Status: ✅ Completed (2026-02-05)
- Description: Build index.html with card grid of all 32 teams, click handlers, localStorage save, redirect logic
- Location: /nhl-team-tracker/index.html
- Details: Created beautiful landing page with dark gradient background, organized by conference/division, team logos from NHL assets, hover effects, responsive design (mobile/tablet/desktop), click to save to localStorage and redirect to game-stats.html?team=ABBREV

**Task #3: Rename mammoth-live-stats.html to game-stats.html**
- Status: ✅ Completed (2026-02-05)
- Description: Rename main HTML file from mammoth-live-stats.html to game-stats.html, update all references
- Location: /nhl-team-tracker/game-stats.html
- Details: Renamed file successfully. Updated references in server.js (line 17 and console message). Updated all documentation files (CLAUDE.md) to use new filename. Task #8 will update server.js default route to serve index.html instead.

**Task #4: Add URL parameter and localStorage parsing**
- Status: ✅ Completed (2026-02-05)
- Description: Add JavaScript to parse ?team=ABBREV, check localStorage, redirect if missing, load team data
- Location: game-stats.html (lines 5397-5487)
- Details: Added team selection logic at top of script section. Parses URL param (?team=ABBREV), checks localStorage, redirects to index.html if neither exists. Loads teams.json, finds selected team, sets global selectedTeam object. Priority: URL param > localStorage > redirect. Updates page title with team name. Includes getTeamAbbrev() and getTeamId() helper functions for dynamic access.

**Task #5: Replace hardcoded UTA constants (12 locations)**
- Status: ✅ Completed (2026-02-05)
- Description: Replace all hardcoded 'UTA' and team constants with dynamic selectedTeam variables
- Location: game-stats.html (8 locations updated)
- Details: Changed UTAH_TEAM_ABBREV and UTAH_TEAM_ID from const to let, updated in initializeTeam() callback. Replaced hardcoded 'UTA' strings with UTAH_TEAM_ABBREV at: line 6763 (goal banner), 6786 (logo URL), 6890 (team color), 8734 (shot chart color), 9830 (play-by-play abbrev), 9918 (play-by-play color), 5720 (penalty mugshot), 9158 (goalie mugshot). Added selectedTeam?.color fallback for dynamic colors.

**Task #6: Add "Change Team" button to navigation**
- Status: ✅ Completed (2026-02-05)
- Description: Add button to nav bar (mobile + desktop) that clears localStorage and redirects to index.html
- Location: game-stats.html (lines 5065, 5082, 5493-5499)
- Details: Added "⚙️ Change Team" button to both mobile nav (line 5065, with visual separator) and desktop nav (line 5082, right-aligned with margin-left: auto). Created changeTeam() function (lines 5493-5499) that shows confirmation dialog, clears localStorage, and redirects to index.html. Button styled consistently with other nav buttons.

**Task #7: Update page branding to show selected team**
- Status: ✅ Completed (2026-02-05)
- Description: Update page title, remove hardcoded "Utah/Mammoth" text, verify logo/colors display correctly
- Location: game-stats.html (multiple locations)
- Details: Updated HTML head meta tags (lines 6-8, 12-14, 22-24) to be generic. Enhanced initializeTeam() callback (lines 5467-5495) to dynamically set page title, favicon, and all meta tags (OG/Twitter) based on selectedTeam. Changed static venue text (lines 5038-5040) to "LOADING..." and "Checking for games...". Updated logo alt text (line 5108) to "Home Team". Added utahLegendName span id (line 5219) and update code (lines 8773-8776) to show dynamic team abbreviation in shot chart legend.

**Task #8: Update server.js to serve index.html as default**
- Status: ✅ Completed (2026-02-05)
- Description: Change default route from game-stats.html to index.html
- Location: server.js (line 17)
- Details: Updated default route to serve index.html (team selector landing page) instead of game-stats.html. Now when users visit the root URL, they see the team selection page first. Direct access to game-stats.html?team=ABBREV still works.

**Task #9: Test team selection flow**
- Status: ✅ Ready for Testing (2026-02-05)
- Description: Manual testing of team selector → save → load → persist → change team flow
- Location: Browser testing

**Test Plan:**
1. Start server: `cd /Users/btaylor/Desktop/nhl-team-tracker && npm start`
2. Visit http://localhost:3000/ → Verify team selection page loads
3. Verify all 32 teams display with logos organized by conference/division
4. Click a team (e.g., Boston Bruins) → Verify redirect to game-stats.html?team=BOS
5. Verify page title shows "Boston Bruins - Live Stats"
6. Verify favicon shows Bruins logo
7. Open DevTools → Application → localStorage → Verify "selectedTeam" = "BOS"
8. Refresh page → Verify team persists (still shows Bruins, no redirect)
9. Click "⚙️ Change Team" button → Verify confirmation dialog
10. Confirm → Verify redirect to index.html
11. Verify localStorage "selectedTeam" was cleared
12. Test direct URL: Visit http://localhost:3000/game-stats.html?team=TOR
13. Verify Toronto Maple Leafs loads and saves to localStorage

**Expected Results:**
✅ Team selector loads at root URL
✅ All teams displayed correctly
✅ Click team → redirect with URL param
✅ localStorage saves team selection
✅ Page refresh maintains team selection
✅ Change Team button clears selection
✅ Direct URL access works

**Task #10: Test multiple teams (BOS, TOR, VGK, COL)**
- Status: ✅ Ready for Testing (2026-02-05)
- Description: Test 3-4 different teams to verify API calls, colors, logos work correctly
- Location: Browser testing

**Test Teams:**
1. Boston Bruins (BOS) - Eastern/Atlantic
2. Toronto Maple Leafs (TOR) - Eastern/Atlantic
3. Vegas Golden Knights (VGK) - Western/Pacific
4. Colorado Avalanche (COL) - Western/Central

**Test Procedure for Each Team:**
1. Visit http://localhost:3000/game-stats.html?team={ABBREV}
2. Verify page title: "{Team Name} - Live Stats"
3. Verify favicon shows correct team logo
4. Verify team logo displays in scoreboard
5. Verify team colors display throughout UI (shot chart, play-by-play highlights)
6. Verify shot chart legend shows correct team abbreviation
7. Open DevTools → Network → Verify API calls use correct team:
   - `/api/v1/roster/{ABBREV}/current`
   - `/api/v1/club-schedule/{ABBREV}/week/now`
   - Game data shows correct team as home/away
8. Navigate to Roster page → Verify correct team roster loads
9. Navigate to Schedule page → Verify correct team schedule
10. Navigate to Standings page → Verify team highlighted in standings
11. Check console for any errors

**Expected Results:**
✅ Each team loads with correct branding
✅ API calls fetch correct team data
✅ Team colors display correctly
✅ Team logos show in all locations
✅ Roster/schedule show correct team
✅ No hardcoded UTA references visible
✅ No console errors

---

### Original Utah Mammoth Tasks (For Reference)

**Task #1: Implement Puckpedia Injuries API in Roster section (Utah version)**
**Status:** Pending - Waiting for user to obtain API access
**Description:** Add Injured Reserve (IR) list to Roster page under NHL EDGE speed stats
**Requirements from user:**
- Puckpedia API endpoint URL
- Authentication method (API key, bearer token, etc.)
- Example API response format/structure
- Query parameters for filtering by team

**Implementation Plan:**
1. Create `fetchInjuriesData()` function
2. Parse Puckpedia API response
3. Filter for Utah Mammoth players only
4. Add `renderIRList()` function in updateRoster()
5. Display IR list under NHL EDGE stats, above FORWARDS section
6. Show: Player name, number, position, injury status, expected return date

**Location:** game-stats.html, updateRoster() function (lines 10389+)

---

**Task #2: Debug NHL ticker scores showing 0-0 for live games (Utah version)**
**Status:** In Progress
**Description:** NHL ticker on left side displays team names and times correctly, but all scores show 0-0 even for live/finished games
**Issue:** Scores not updating from API data
**Data Status:** API confirmed returning correct scores (verified via /api/v1/score endpoint)
**Investigation needed:**
- Check nhlGamesToday array contents in browser console
- Verify API response structure matches code expectations
- Check if score field exists and is populated
- Trace through fetchNhlGamesToday() and renderNhlTicker() execution

**Location:** game-stats.html lines 6006-6087

---

## Quick Reference Guide

### Making Updates After Deployment

**1. Update HTML/CSS/JS:**
```bash
# Edit files locally in /Users/btaylor/Desktop/nhl-team-tracker/
# Then deploy:
cd /Users/btaylor/Desktop/nhl-team-tracker
scp game-stats.html index.html teams.json root@10.1.10.193:/mnt/user/appdata/nhl-team-tracker/
ssh root@10.1.10.193 "cd /mnt/user/appdata/nhl-team-tracker && docker stop nhl-team-tracker && docker rm nhl-team-tracker && docker build -t nhl-team-tracker . && docker run -d --name nhl-team-tracker --restart unless-stopped -p 3050:3000 nhl-team-tracker"
```

**2. Update server.js or package.json:**
```bash
# Same as above, but include server.js or package.json in scp command
```

**3. Quick container restart (no code changes):**
```bash
ssh root@10.1.10.193 "docker restart nhl-team-tracker"
```

**4. View logs:**
```bash
ssh root@10.1.10.193 "docker logs nhl-team-tracker -f"
```

**5. Check container status:**
```bash
ssh root@10.1.10.193 "docker ps | grep nhl-team-tracker"
```

### Key Code Locations

**Team Initialization:** Lines 5403-5511
- Parse URL/localStorage
- Load teams.json
- Update constants (UTAH_TEAM_ABBREV, UTAH_TEAM_ID)
- Update page branding (title, favicon, meta tags)
- Update CSS variable (--mammoth-blue)
- Start data fetching (roster, game data)

**Team Selection Landing Page:** index.html
- Loads teams.json
- Displays all 32 teams by conference/division
- Saves selection to localStorage
- Redirects to game-stats.html?team=ABBREV

**Team Data:** teams.json
- All 32 NHL teams with abbreviations, IDs, names, colors, divisions

**Dynamic Team Colors:** Line 5497-5498
- Updates --mammoth-blue CSS variable (affects 82+ elements)

**Change Team Button:** Lines 5510-5517
- Clears localStorage and redirects to team selector

---

## Dependencies

- `express` - HTTP server
- `cors` - Cross-origin handling
- `node-fetch` - Node.js fetch implementation

## Deployment

Docker-ready with Unraid optimization. Deployed to production on 2026-02-05.

**Production Server (Unraid):**
- Host (local): `10.1.10.193`
- Host (Tailscale): `100.118.76.18`
- SSH: `root@10.1.10.193`
- Live URL: `http://10.1.10.193:3050`
- Container name: `nhl-team-tracker`
- App data: `/mnt/user/appdata/nhl-team-tracker`
- Port mapping: `3050:3000` (host:container)

**Quick Deployment Commands:**
```bash
# Copy files to Unraid
scp package.json server.js index.html game-stats.html teams.json Dockerfile docker-compose.yml root@10.1.10.193:/mnt/user/appdata/nhl-team-tracker/

# Rebuild and restart container
ssh root@10.1.10.193 "cd /mnt/user/appdata/nhl-team-tracker && docker stop nhl-team-tracker && docker rm nhl-team-tracker && docker build -t nhl-team-tracker . && docker run -d --name nhl-team-tracker --restart unless-stopped -p 3050:3000 nhl-team-tracker"

# Check logs
ssh root@10.1.10.193 "docker logs nhl-team-tracker"

# Restart container (after file updates)
ssh root@10.1.10.193 "docker restart nhl-team-tracker"
```

**Production Server (Unraid):**
- Host (local): `10.1.10.193`
- Host (Tailscale): `100.118.76.18`
- SSH (local): `root@10.1.10.193`
- SSH (Tailscale): `root@100.118.76.18`
- Live stats URL: `http://10.1.10.193:9999`
- Container name: `utah-mammoth-stats`
- App data: `/mnt/user/appdata/mammoth-stats`

**Deployment to Unraid (after file changes):**
```bash
# 1. SCP the updated game-stats.html to Unraid
scp game-stats.html root@10.1.10.193:/mnt/user/appdata/mammoth-stats/

# 2. Restart the container (faster than stop/rm/restart)
ssh root@10.1.10.193 "docker restart utah-mammoth-stats"
```

**IMPORTANT:** After making changes to `game-stats.html`, always:
1. SCP the file to `/mnt/user/appdata/mammoth-stats/`
2. Restart the container: `docker restart utah-mammoth-stats`

## Project Creation Summary (2026-02-05)

**Goal:** Create a generalized multi-team version of Utah Mammoth Live Stats that works for all 32 NHL teams.

**What Was Built:**
- Complete NHL Team Tracker application supporting all 32 teams
- Team selection landing page with organized team grid (by conference/division)
- Dynamic team switching with localStorage persistence
- Full theme/color system that adapts to each team
- All features from original app (scoreboard, stats, roster, standings, playoff bracket, etc.)

**Implementation Stats:**
- **Duration:** ~8 hours (planning + implementation + testing + debugging)
- **Cost:** $11.02 in API usage
- **Code Changes:** 1,198 lines added, 95 lines removed
- **Tasks Completed:** 10 (across 4 phases)
- **Files Created:** 2 (index.html, teams.json)
- **Files Modified:** 3 (game-stats.html, server.js, CLAUDE.md)
- **Deployment:** Live on Unraid at port 3050

**Key Technical Decisions:**
1. URL parameter + localStorage for team selection (priority: URL > localStorage > redirect)
2. Single CSS variable (`--mammoth-blue`) for all team colors - updated dynamically
3. Delayed data fetching until team initialization completes
4. Kept original variable names (UTAH_TEAM_ABBREV, etc.) but made them dynamic with `let`
5. Used existing TEAM_COLORS object as fallback with selectedTeam.color as primary

**Deployment Info:**
- **Local:** `/Users/btaylor/Desktop/nhl-team-tracker/`
- **Unraid:** `/mnt/user/appdata/nhl-team-tracker/`
- **Container:** `nhl-team-tracker`
- **Port:** 3050 (host) → 3000 (container)
- **URL:** http://10.1.10.193:3050
- **Status:** Production ready

**Original Utah Mammoth Stats:**
- **Location:** `/Users/btaylor/Desktop/Mammoth Game Time/` (UNTOUCHED)
- **Note:** No container currently running on Unraid (was never deployed or was removed)

**Bugs Fixed During Development:**
1. **Roster page not loading** - fetchRoster() called before team initialization
2. **Scoreboard showing Utah game before team ready** - fetchGameData() called too early
3. **"MAMMOTH" text during initialization** - Default HTML placeholder text
4. **Wrong team color on scoreboard** - Home team color never set, only opponent
5. **Ice rink borders in Mammoth blue** - CSS variable --mammoth-blue hardcoded to #69B3E7
6. **Cloudflare Tunnel pointing to wrong container** - User found and fixed this issue

---

## Features

### Team Color System Overhaul (2026-02-05)
- **Issue:** Multiple areas showing Mammoth blue (#69B3E7) instead of selected team's color:
  1. Home team name showed "MAMMOTH" text and wrong color
  2. Ice rink borders and shot chart elements all in Mammoth blue
  3. Legend dots, zone stats, shot dots, and 82+ other elements hardcoded to Mammoth blue
- **Root Cause:**
  1. Default HTML text was "MAMMOTH" (line 5102)
  2. Only opponent team got color styling - home team had no color code
  3. CSS variable `--mammoth-blue` hardcoded to #69B3E7 (line 35) and used in 82+ places throughout CSS
- **Fix:**
  1. Changed default text from "MAMMOTH" to "HOME" (line 5102)
  2. Added color styling for home team name and score (lines 6756-6769)
  3. **Key fix:** Dynamically update `--mammoth-blue` CSS variable when team initializes (line 5497-5498)
     - `document.documentElement.style.setProperty('--mammoth-blue', team.color)`
     - This updates ALL 82+ places using the variable (ice rink, shot chart, legends, borders, etc.)
- **Result:** Entire app theme now matches selected team's color - Boston gold, Vegas gold, Toronto blue, Colorado burgundy, etc.
- **Deployment:** 2026-02-05 via SCP + docker rebuild (multiple iterations)

### Data Initialization Fix (2026-02-05)
- **Issue:** Scoreboard, Player Stats, Play-by-Play, and Roster were showing last Utah/Mammoth game before selected team was initialized
- **Root Cause:** Multiple issues:
  1. `fetchRoster()` called immediately on page load (line 11433) before team initialization
  2. `fetchGameData()` and polling started immediately (lines 10433-10434) before team selection
  3. Both used default UTAH_TEAM_ABBREV = 'UTA' instead of waiting for selected team
- **Fix:**
  1. Moved `fetchRoster()` call into `initializeTeam().then()` callback (lines 5498-5500)
  2. Moved `fetchGameData()` and polling initialization into same callback (lines 5501-5509)
  3. Removed premature initialization calls (lines 10433-10434, 11433)
  4. Added clearInterval safety check to prevent duplicate timers
- **Result:** Page now waits for team selection before fetching ANY data - no more showing wrong team's data
- **Deployment:** 2026-02-05 via SCP + docker rebuild (multiple iterations)

### NHL Ticker Score Updates (2026-02-04)
- **Issue:** "Around the NHL" ticker on left side showed team names and times but scores stayed at 0-0 and never updated
- **Root Cause:** `fetchNhlGamesToday()` was only called every 6 polling cycles (~60 seconds), so scores weren't refreshing. Games fetched once per minute instead of every 10 seconds.
- **Fix:** Line 5855-5859 - Removed the refresh counter logic and now call `fetchNhlGamesToday()` on every polling cycle (every 10 seconds)
  - Removed: `nhlTickerRefreshCounter` logic that limited fetches to every 6th cycle
  - Changed: Now fetches live score data every 10 seconds, same as main game polling
- **Result:** NHL ticker scores now update in real-time as games progress
- **Deployment:** 2026-02-04 via SCP + container restart

### Video Modal (Highlights) - Official NHL API with Brightcove Embedding (2026-02-04)
- **Location:** Nav bar "🎥 Highlights" button (desktop & mobile)
- **Functionality:** Opens modal with official NHL video highlights using Brightcove player
- **Data Source:** `/api/v1/schedule/{date}` endpoint (contains threeMinRecap and condensedGame video paths)
- **Video Selection Logic:**
  - Primary: `threeMinRecap` (3-minute highlight reel)
  - Fallback: `condensedGame` (full game condensed)
  - Displays: "Official highlights not available yet" if neither exists
- **Video Path Processing:**
  - Extract video ID from path using regex: `/(\d+)$/` (e.g., "/video/det-at-uta-recap-6388792976112" → "6388792976112")
  - Build Brightcove URL: `https://players.brightcove.net/6415718365001/D3UCGynRWU_default/index.html?videoId={videoId}&autoplay=true`
- **Video Embedding:**
  - Uses Brightcove player (same as goal videos)
  - Current game: Fetches schedule by gameDate from gameData, finds matching gameId
  - Past games: Fetches landing endpoint to get gameDate, then fetches schedule for that date
  - Videos play directly in modal via iframe with autoplay enabled
- **Functions Modified:**
  - `openHighlightsModal()` (line 10740): Uses `gameData?.gameDate` as primary source for date (fallback to `startTimeUTC` if not available)
  - `openHighlightsModal()` (lines 10701-10795): Fetches current game from schedule endpoint, extracts video ID, embeds via Brightcove
  - `openPastGameHighlights(gameId)` (lines 10797-10890): Fetches game date from landing, then gets highlights from schedule, extracts video ID, embeds via Brightcove
  - Function call (line 7396): Already passes `${data.id}` (gameId) - no change needed
- **Why Changed:** YouTube search was inaccurate; official NHL API with Brightcove is always correct and uses same player as goal videos
- **Works For:** Any opponent, any team position (home/away), live or finished games
- **Technical Details:**
  - Schedule endpoint at `/api/v1/schedule/{YYYY-MM-DD}` contains `gameWeek[].games[]` array
  - Each game has `threeMinRecap` and `condensedGame` fields with paths like `/video/...` or `/fr/video/...`
  - Video IDs are 13-digit numbers at the end of each path
  - Brightcove account ID: `6415718365001`, player ID: `D3UCGynRWU_default`
  - **Date Field:** gameData contains `gameDate` field directly (not nested in startTimeUTC) - this is used for schedule lookup
- **Bug Fix (2026-02-04):**
  - Issue: Current game highlights modal not finding schedule data
  - Root cause: Using `startTimeUTC` field for date extraction instead of `gameDate`
  - Fix: Line 10740 - Changed to use `gameData?.gameDate` as primary, fallback to `startTimeUTC` if needed
  - Result: Current game highlights now fetches correctly from schedule endpoint
- **Files Modified:**
  - CSS: `.video-modal`, `.video-modal-content`, `.video-modal-title` (unchanged)
  - HTML: Modal structure (unchanged)
  - JS: `openHighlightsModal()` and `openPastGameHighlights()` completely refactored
- **Deployment:** 2026-02-04 via SCP + container restart (initial + bug fix)

### Countdown Clock - PRE State Fix
- **Issue:** Countdown clock displayed `--:--` during PRE (pregame) games
- **Solution:** Added handling for `PRE` state to match `FUT` (future) state countdown logic
- **Changes Made:**
  - Line 6276: Updated condition from `rawState === 'FUT'` to `rawState === 'FUT' || rawState === 'PRE'`
  - Line 9660: Updated scoreboard refresh interval to update every second for both FUT and PRE states
- **Result:** PRE games now show countdown (e.g., "45m 30s") instead of `--:--`
- **Deployment:** Deployed 2025-02-04 to Unraid via setup-unraid.sh

### Pregame News (Game Preview)
- **Location:** New "📰 Game News" nav tab (visible only during FUT/PRE states)
- **Scoreboard Snippet:** Small preview card appears below special-teams-banner during pregame with:
  - Game Preview headline (first article)
  - Short description (2-line limit)
  - "Full Preview" button linking to full Game News tab
- **Full Game News Tab:** Shows all available articles/previews as clickable cards with:
  - Article type badge (e.g., "PREVIEW", "ARTICLE")
  - Publication date
  - Headline and subheading
  - Short description
  - Direct link to full article on NHL.com
- **Data Source:** Fetches from `/api/v1/gamecenter/{gameId}/content` endpoint (NHL editorial/preview data)
- **State Management:**
  - Tab and snippet hidden when game is LIVE/FINAL or no game scheduled
  - Automatically redirects user to Scoreboard if they're on News tab when game goes live
  - TV mode hides the news tab
- **Files Modified:**
  - CSS: `.pregameSnippet`, `.snippet-*`, `.gamenews-*` styles + responsive overrides
  - HTML: Mobile nav button, desktop nav tab, snippet container, empty page div
  - JS: `contentData` variable, content fetch block, `updateGameNews()` function
- **Deployment:** Deployed 2025-02-04 to Unraid via SCP + container restart

### Ice Rink Display Fixes (2025-02-04)
- **Goalie Save Percentage Swap Bug Fix**
  - **Issue:** Goalie save percentages were swapped (Utah goalie showing opponent stats, vice versa)
  - **Root Cause:** Shot counter in `calculatePeriodGoalieStats()` was counting shots TAKEN BY each team instead of shots AGAINST their goalie
  - **Fix:** Lines 8905-8920 - Reversed shot assignment logic. When Utah takes a shot, it counts against opponent's goalie. When opponent takes a shot, it counts against Utah's goalie.
  - **Result:** Hover popup on rink now shows correct save percentages for each goalie

- **Goal Video Modal Wrong Video Bug Fix**
  - **Issue:** Clicking goal dots from period 3 showed wrong goal videos
  - **Root Cause:** `goalIndex` was a local counter for goals in the selected period view, but used to index the global `goalsData` array containing ALL game goals
  - **Fix:** Lines 8660-8673 - Added lookup to find actual goal index in `goalsData` using period, time, and scorer name match
  - **Result:** Goal videos now show correct clip regardless of which period is selected on shot chart

- **Goal Dots Z-Index Fix**
  - **Issue:** Goal dots were hidden behind regular shot-on-goal dots on ice rink
  - **Fix:** Lines 2152, 2164 - Set `.shot-dot.goal` to `z-index: 9` and `.shot-dot.goal:hover` to `z-index: 11`
  - **Result:** Goal dots always visible on top of SOG dots and clickable

### Penalty Box Fixes (2025-02-04)
- **Utah Player Headshots Not Loading**
  - **Issue:** Opponent penalty players showed mugshots, but Utah players didn't
  - **Root Cause:** Team abbreviation in mugshot URL was lowercase (`uta`) when it should be uppercase (`UTA`)
  - **Fix:** Line 8360 - Changed from `p.team.toLowerCase()` to `p.team.toUpperCase()`
  - **URL Format:** `https://assets.nhle.com/mugs/nhl/20252026/{TEAM_ABBREV_UPPERCASE}/{playerId}.png`
  - **Result:** Utah player mugshots now load and display in penalty box

- **Penalties Bleeding Over From Previous Periods**
  - **Issue:** Penalties from past periods were still showing in current period (e.g., Larkin from Period 1 showing in Period 2)
  - **Root Cause:** Ambiguous period filtering allowed penalties from multiple periods ago to slip through
  - **Fixes Applied:**
    1. Line 8151-8155: Added hard filter to skip penalties from future periods
    2. Lines 8247-8277: Replaced vague rollover condition with explicit period cases:
       - Current period: add if active
       - Previous period: ONLY add if penalty extends past period end (rolled over)
       - 2+ periods ago: NEVER add
    3. Line 8270: Added gameState check to fallback penalty logic (only trigger during LIVE play, not intermissions)
    4. Lines 8313-8315: Filter to remove fallback "In Box" penalties when real penalties with playerIds exist
  - **Result:** Old penalties no longer show; only current period and properly rolled-over penalties display

- **Power Play Goal Penalty Waive**
  - **Issue:** When opposing team scores on power play, penalty player stays in box instead of being released
  - **Solution:** Lines 8142-8156 + 8277-8295 - Added logic to detect goals scored on power play and automatically waive the penalty
  - **How It Works:**
    1. Collect all goals from play-by-play with timestamps
    2. When processing penalties, check if opposing team scored after penalty was called
    3. If goal scored on power play, penalty is marked as waived and not displayed
    4. Debug logs show "Penalty waived due to goal scored on power play: [player]"
  - **Testing:** Scheduled for after Olympic break when next live game occurs

- **Missing Goal Video Clip Data (4th Goal Bug)**
  - **Issue:** 4th goal (Larkin, DET) video didn't show - API had mismatched team ID and clip data only in French endpoint
  - **Root Cause:**
    - Play-by-play endpoint had goal with wrong `eventOwnerTeamId` (17/UTA instead of 68/DET)
    - Clip data missing from English fields but available in French (`highlightClipFr`) in landing summary
    - Code only checked for English `highlightClipSharingUrl`
  - **Fix:** Lines 6332-6413 in `updateGoalVideos()` function
    - Primary source: `gameData.playByPlay.plays` (maintains existing structure and goalIndex lookup)
    - Fallback source: `gameData.landingSummary.summary.scoring` (has all clip data for both teams)
    - Clip lookup hierarchy: English clip → French clip → discreteClip
    - URL lookup: English URL → French URL
  - **Implementation:**
    1. Build map of landing summary goals by period/time
    2. Use play-by-play for initial goal data
    3. If clip missing from play-by-play, search landing summary by period/time match
    4. Uses English clips when available, falls back to French/discreteClip
  - **Result:** All goal videos load correctly, including those with only French clip data
  - **Works for:** Any opponent team, whether Utah is home or away
  - **Deployed:** 2025-02-04

- **Hardcoded Team ID in Goal Video Modal**
  - **Issue:** Score display in goal video modal title used hardcoded Detroit team ID (68)
  - **Location:** Line 10679 in `showGoalVideoModal()` function
  - **Problem:** Only worked correctly for Detroit games; other opponents had score display in wrong order
  - **Fix:** Removed team ID check, now always displays score as `homeScore-awayScore` (consistent format)
  - **Result:** Goal video modals work correctly regardless of opponent or whether Utah is home/away
  - **Deployed:** 2025-02-04

### Technical Details - Penalty Logic Deep Dive
The penalty box system uses `updatePenaltyBoxes()` function with these key components:

**Data Sources:**
- `gameData.playByPlay.plays` - penalty and goal events with timestamps
- `gameData.boxscore.playerByGameStats` - player IDs mapped to names and sweater numbers
- `gameData.situation` - current skater strength (fallback for generic "In Box" penalty)

**Time Calculation:**
- `timeInPeriod` from API is ELAPSED time (counts up 0:00→20:00)
- Converted to REMAINING time: `1200 - elapsedSeconds`
- Penalty active when: current clock is between penalty end and start (remaining time scale)
- Rollover: if penalty would extend past period end (negative remaining time), continues to next period

**Penalty Filtering Rules (STRICT):**
1. Must be from current period, OR
2. Must be from immediately previous period AND have explicitly rolled over (end time < 0)
3. Must not be from 2+ periods ago under any circumstance
4. Fallback "In Box" only shown if no real penalties with playerIds

**URL Formats:**
- Mugshot: `https://assets.nhle.com/mugs/nhl/{SEASON}/{TEAM_ABBREV_UPPERCASE}/{playerId}.png`
- Example: `https://assets.nhle.com/mugs/nhl/20252026/UTA/8480849.png`

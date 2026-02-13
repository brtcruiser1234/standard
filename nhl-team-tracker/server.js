const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Team rooms: Map of team abbreviation -> Set of WebSocket clients
const teamRooms = new Map();

// Team data cache: Map of team abbreviation -> cached game data
const teamDataCache = new Map();

// Team polling timers: Map of team abbreviation -> interval timer
const teamPollingTimers = new Map();

// Refresh intervals
const REFRESH_INTERVAL_LIVE = 5000; // 5 seconds - during live games
const REFRESH_INTERVAL_PREGAME = 60000; // 1 minute - within 6 hours of game
const REFRESH_INTERVAL_DEFAULT = 300000; // 5 minutes - no active game

// Enable CORS for all routes
app.use(cors());

// Serve static files (this folder)
app.use(express.static(__dirname));

// Default route - serve team selector landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// YouTube search endpoint
app.get('/search-youtube', async (req, res) => {
    try {
        const query = req.query.q;
        console.log('YouTube search requested for:', query);

        if (!query) {
            console.log('Error: Missing query parameter');
            return res.status(400).json({ error: 'Missing query parameter: q' });
        }

        const YOUTUBE_API_KEY = 'AIzaSyD0P9bUQOMq64lAX-dp57Fw_0YTNftLioA';
        // Search without channel filter first - NHL might not be the only source
        // Try multiple search formats for better matching
        let youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&order=relevance&key=${YOUTUBE_API_KEY}`;

        console.log('Calling YouTube API with query:', query);
        const response = await fetch(youtubeUrl);
        const data = await response.json();

        console.log('YouTube API response status:', response.status);
        console.log('YouTube API response data:', JSON.stringify(data).substring(0, 500));

        if (!data.items || data.items.length === 0) {
            console.log('No videos found');
            return res.json({ videoId: null, message: 'No videos found' });
        }

        const videoId = data.items[0].id.videoId;
        console.log('Found video ID:', videoId);
        res.json({ videoId, title: data.items[0].snippet.title });
    } catch (error) {
        console.error('YouTube search error:', error);
        res.status(500).json({ error: 'Failed to search YouTube', details: error.message });
    }
});

// Proxy endpoint for NHL API (keep for fallback and non-polled endpoints)
app.get('/api/*', async (req, res) => {
    try {
        // Remove /api prefix and build NHL API URL
        const apiPath = req.url.replace('/api/', '');
        const nhlApiUrl = `https://api-web.nhle.com/${apiPath}`;

        console.log(`Proxying request to: ${nhlApiUrl}`);

        const response = await fetch(nhlApiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            redirect: 'follow'
        });

        const contentType = response.headers.get('content-type');
        const text = await response.text();

        // Check if response is JSON
        if (contentType && contentType.includes('application/json')) {
            try {
                const data = JSON.parse(text);
                res.json(data);
            } catch (e) {
                console.error(`Failed to parse JSON from ${nhlApiUrl}:`, text.substring(0, 200));
                res.status(response.status).json({ error: 'Invalid JSON from NHL API' });
            }
        } else {
            console.error(`Non-JSON response from ${nhlApiUrl}. Status: ${response.status}, Content-Type: ${contentType}`);
            console.error(`Response body: ${text.substring(0, 500)}`);
            res.status(response.status).json({ error: 'Non-JSON response from NHL API', contentType });
        }
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch from NHL API', details: error.message });
    }
});

// Helper function to fetch from NHL API
async function fetchNhlApi(endpoint) {
    const url = `https://api-web.nhle.com/${endpoint}`;
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            redirect: 'follow'
        });

        if (!response.ok) {
            console.error(`NHL API error for ${endpoint}: ${response.status}`);
            return null;
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            console.error(`Non-JSON response from ${endpoint}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error.message);
        return null;
    }
}

// Helper functions for date handling (matching frontend logic)
function getLocalMidnightFromYMD(ymd) {
    const parts = String(ymd).split('-').map(Number);
    if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) return null;
    const [year, month, day] = parts;
    return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function getGameDayDate(game) {
    if (game?.gameDate) {
        const gameDateStr = String(game.gameDate);
        if (/^\d{4}-\d{2}-\d{2}$/.test(gameDateStr)) {
            return getLocalMidnightFromYMD(gameDateStr);
        }

        const parsed = new Date(gameDateStr);
        if (!Number.isNaN(parsed.getTime())) {
            parsed.setHours(0, 0, 0, 0);
            return parsed;
        }
    }

    if (game?.startTimeUTC) {
        const parsed = new Date(game.startTimeUTC);
        if (!Number.isNaN(parsed.getTime())) {
            parsed.setHours(0, 0, 0, 0);
            return parsed;
        }
    }

    return null;
}

function getGameStartDate(game) {
    if (game?.startTimeUTC) {
        const parsed = new Date(game.startTimeUTC);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    if (game?.gameDate) {
        const gameDateStr = String(game.gameDate);
        if (/^\d{4}-\d{2}-\d{2}$/.test(gameDateStr)) {
            return getLocalMidnightFromYMD(gameDateStr);
        }

        const parsed = new Date(gameDateStr);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    return null;
}

function getTodayLocalMidnight() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

// Find today's or last game for a team (matches frontend logic exactly)
async function findTodaysOrLastGame(scheduleData, teamAbbrev) {
    try {
        const now = new Date();
        const today = getTodayLocalMidnight();

        if (scheduleData && scheduleData.games) {
            // 1) If there's a live game, always pick it.
            const liveGame = scheduleData.games.find(g => g.gameState === 'LIVE' || g.gameState === 'CRIT');
            if (liveGame) {
                console.log(`[${teamAbbrev}] Found live game: ${liveGame.id}`);
                return liveGame.id;
            }

            // 2) If there's a game today that has started or is live, pick it.
            for (const game of scheduleData.games) {
                const gameDay = getGameDayDate(game);
                if (gameDay && gameDay.getTime() === today.getTime()) {
                    // Only return if game has started (LIVE/CRIT) or finished (OFF/FINAL)
                    // Don't return FUT games - those get handled in step 3 (within 6 hours check)
                    if (game.gameState === 'LIVE' || game.gameState === 'CRIT' || game.gameState === 'OFF' || game.gameState === 'FINAL') {
                        console.log(`[${teamAbbrev}] Found today's game: ${game.id}`);
                        return game.id;
                    }
                }
            }

            // 3) If the next game is within 6 hours, switch early (pre-game mode).
            const upcoming = scheduleData.games
                .filter(g => g.gameState === 'FUT')
                .map(g => ({ game: g, start: getGameStartDate(g) }))
                .filter(x => x.start)
                .sort((a, b) => a.start.getTime() - b.start.getTime());

            if (upcoming.length > 0) {
                const next = upcoming[0];
                const msUntil = next.start.getTime() - now.getTime();
                if (msUntil <= 6 * 60 * 60 * 1000 && msUntil >= -6 * 60 * 60 * 1000) {
                    // allow switching 6 hours before game and slightly after puck drop too, until live state arrives
                    console.log(`[${teamAbbrev}] Switching to next game (within 6 hours): ${next.game.id}`);
                    return next.game.id;
                }
            }

            // 4) Otherwise show the last finished game.
            const pastGames = scheduleData.games
                .filter(g => {
                    const gameStart = getGameStartDate(g);
                    return gameStart && gameStart < now && g.gameState === 'OFF';
                })
                .sort((a, b) => {
                    const aStart = getGameStartDate(a);
                    const bStart = getGameStartDate(b);
                    return (bStart?.getTime() || 0) - (aStart?.getTime() || 0);
                });

            if (pastGames.length > 0) {
                console.log(`[${teamAbbrev}] Using last game: ${pastGames[0].id}`);
                return pastGames[0].id;
            }
        }

        return null;
    } catch (error) {
        console.error(`[${teamAbbrev}] Error finding game:`, error);
        return null;
    }
}

// Fetch all game data for a team
async function fetchTeamGameData(teamAbbrev, teamId) {
    console.log(`[${teamAbbrev}] Fetching game data...`);

    const data = {
        team: teamAbbrev,
        timestamp: Date.now(),
        scheduleData: null,
        nhlGamesToday: null,
        gameData: null,
        rightRailData: null,
        contentData: null,
        standingsData: null,
        gameState: null,
        isPreGame: false
    };

    try {
        // Fetch schedule
        data.scheduleData = await fetchNhlApi(`v1/club-schedule-season/${teamAbbrev}/now`);

        // Fetch NHL games today for ticker
        data.nhlGamesToday = await fetchNhlApi('v1/score/now');

        // Find which game to show
        const gameId = await findTodaysOrLastGame(data.scheduleData, teamAbbrev);

        // Detect if we're in pregame mode (within 6 hours of next game)
        if (data.scheduleData?.games) {
            const now = new Date();
            const upcoming = data.scheduleData.games
                .filter(g => g.gameState === 'FUT' || g.gameState === 'PRE')
                .map(g => ({ game: g, start: getGameStartDate(g) }))
                .filter(x => x.start)
                .sort((a, b) => a.start.getTime() - b.start.getTime());

            if (upcoming.length > 0) {
                const next = upcoming[0];
                const msUntil = next.start.getTime() - now.getTime();
                if (msUntil <= 6 * 60 * 60 * 1000 && msUntil >= 0) {
                    data.isPreGame = true;
                }
            }
        }

        if (gameId) {
            console.log(`[${teamAbbrev}] Fetching data for game ${gameId}`);

            // Try game-story endpoint
            let gameData = await fetchNhlApi(`v1/wsc/game-story/${gameId}`);

            if (gameData) {
                // Check if we need boxscore data
                const hasStoryPlayers = Array.isArray(gameData?.players?.skaters) && gameData.players.skaters.length > 0;
                if (!hasStoryPlayers) {
                    const boxscore = await fetchNhlApi(`v1/gamecenter/${gameId}/boxscore`);
                    if (boxscore) {
                        if (boxscore.playerByGameStats) {
                            gameData.playerByGameStats = boxscore.playerByGameStats;
                        }
                        if (!gameData.teams && boxscore.homeTeam && boxscore.awayTeam) {
                            gameData.teams = {
                                home: { ...boxscore.homeTeam, stats: {} },
                                away: { ...boxscore.awayTeam, stats: {} }
                            };
                        }
                    }
                }
            } else {
                // Fallback to boxscore + landing
                const boxscore = await fetchNhlApi(`v1/gamecenter/${gameId}/boxscore`);
                const landing = await fetchNhlApi(`v1/gamecenter/${gameId}/landing`);

                if (boxscore) {
                    gameData = {
                        game: {
                            gameId: gameId,
                            gameState: landing?.gameState || boxscore.gameState
                        },
                        teams: {
                            home: { ...boxscore.homeTeam, stats: {} },
                            away: { ...boxscore.awayTeam, stats: {} }
                        },
                        playerByGameStats: boxscore.playerByGameStats
                    };
                }
            }

            // Fetch right-rail (team stats)
            data.rightRailData = await fetchNhlApi(`v1/gamecenter/${gameId}/right-rail`);

            // Fetch landing (goals, penalties, situation)
            const landing = await fetchNhlApi(`v1/gamecenter/${gameId}/landing`);
            if (landing && gameData) {
                gameData.landingSummary = landing.summary;
                gameData.situation = landing.situation;
                gameData.clock = landing.clock || gameData.clock;
            }

            // Fetch play-by-play
            const playByPlay = await fetchNhlApi(`v1/gamecenter/${gameId}/play-by-play`);
            if (playByPlay && gameData) {
                gameData.playByPlay = playByPlay;
            }

            // Fetch pregame content
            data.contentData = await fetchNhlApi(`v1/gamecenter/${gameId}/content`);

            data.gameData = gameData;
            data.gameState = gameData?.gameState || gameData?.game?.gameState;
        }

        // Fetch standings
        data.standingsData = await fetchNhlApi('v1/standings/now');

        console.log(`[${teamAbbrev}] Data fetch complete. Game state: ${data.gameState || 'NONE'}`);
        return data;

    } catch (error) {
        console.error(`[${teamAbbrev}] Error fetching game data:`, error);
        return data;
    }
}

// Start polling for a team
function startTeamPolling(teamAbbrev, teamId) {
    // Don't start if already polling
    if (teamPollingTimers.has(teamAbbrev)) {
        console.log(`[${teamAbbrev}] Already polling`);
        return;
    }

    console.log(`[${teamAbbrev}] Starting polling`);

    // Initial fetch
    fetchAndBroadcast(teamAbbrev, teamId);

    // Start polling
    const timer = setInterval(async () => {
        const data = await fetchAndBroadcast(teamAbbrev, teamId);

        // Adjust polling interval based on game state
        if (data) {
            const isLive = data.gameState === 'LIVE' || data.gameState === 'CRIT';
            const isPregame = data.isPreGame;

            let desiredInterval;
            if (isLive) {
                desiredInterval = REFRESH_INTERVAL_LIVE; // 5 seconds during live games
            } else if (isPregame) {
                desiredInterval = REFRESH_INTERVAL_PREGAME; // 1 minute before game
            } else {
                desiredInterval = REFRESH_INTERVAL_DEFAULT; // 5 minutes otherwise
            }

            // If interval needs to change, restart timer
            const timer = teamPollingTimers.get(teamAbbrev);
            if (timer && timer._interval !== desiredInterval) {
                const intervalName = isLive ? 'LIVE (5s)' : isPregame ? 'PREGAME (1m)' : 'DEFAULT (5m)';
                console.log(`[${teamAbbrev}] Adjusting polling interval to ${intervalName}`);
                clearInterval(timer);
                const newTimer = setInterval(() => fetchAndBroadcast(teamAbbrev, teamId), desiredInterval);
                newTimer._interval = desiredInterval;
                teamPollingTimers.set(teamAbbrev, newTimer);
            }
        }
    }, REFRESH_INTERVAL_DEFAULT);

    timer._interval = REFRESH_INTERVAL_DEFAULT;
    teamPollingTimers.set(teamAbbrev, timer);
}

// Stop polling for a team
function stopTeamPolling(teamAbbrev) {
    const timer = teamPollingTimers.get(teamAbbrev);
    if (timer) {
        console.log(`[${teamAbbrev}] Stopping polling`);
        clearInterval(timer);
        teamPollingTimers.delete(teamAbbrev);
        teamDataCache.delete(teamAbbrev);
    }
}

// Fetch data and broadcast to team room
async function fetchAndBroadcast(teamAbbrev, teamId) {
    const data = await fetchTeamGameData(teamAbbrev, teamId);
    teamDataCache.set(teamAbbrev, data);
    broadcastToTeam(teamAbbrev, { type: 'gameData', data });
    return data;
}

// Broadcast message to all clients in a team room
function broadcastToTeam(teamAbbrev, message) {
    const clients = teamRooms.get(teamAbbrev);
    if (!clients || clients.size === 0) return;

    const json = JSON.stringify(message);
    let sentCount = 0;

    clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(json);
            sentCount++;
        }
    });

    if (sentCount > 0) {
        console.log(`[${teamAbbrev}] Broadcast to ${sentCount} client(s)`);
    }
}

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    let subscribedTeam = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());

            if (data.type === 'subscribe' && data.team) {
                const teamAbbrev = data.team.toUpperCase();
                const teamId = data.teamId || null;

                console.log(`Client subscribing to team: ${teamAbbrev}`);

                // Unsubscribe from previous team if any
                if (subscribedTeam) {
                    const oldClients = teamRooms.get(subscribedTeam);
                    if (oldClients) {
                        oldClients.delete(ws);

                        // Stop polling if no more clients
                        if (oldClients.size === 0) {
                            teamRooms.delete(subscribedTeam);
                            stopTeamPolling(subscribedTeam);
                        }
                    }
                }

                // Subscribe to new team
                subscribedTeam = teamAbbrev;

                // Create room if doesn't exist
                if (!teamRooms.has(teamAbbrev)) {
                    teamRooms.set(teamAbbrev, new Set());
                }

                // Add client to room
                teamRooms.get(teamAbbrev).add(ws);

                // Send cached data immediately if available
                const cachedData = teamDataCache.get(teamAbbrev);
                if (cachedData) {
                    ws.send(JSON.stringify({ type: 'gameData', data: cachedData }));
                }

                // Start polling if this is first client for this team
                if (teamRooms.get(teamAbbrev).size === 1) {
                    startTeamPolling(teamAbbrev, teamId);
                }

                console.log(`[${teamAbbrev}] Client count: ${teamRooms.get(teamAbbrev).size}`);
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');

        // Remove from team room
        if (subscribedTeam) {
            const clients = teamRooms.get(subscribedTeam);
            if (clients) {
                clients.delete(ws);

                // Stop polling if no more clients
                if (clients.size === 0) {
                    teamRooms.delete(subscribedTeam);
                    stopTeamPolling(subscribedTeam);
                }

                console.log(`[${subscribedTeam}] Client count: ${clients.size}`);
            }
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`NHL Team Tracker Server running on http://0.0.0.0:${PORT}`);
    console.log(`WebSocket server enabled`);
    console.log(`Access from your network at http://YOUR-SERVER-IP:${PORT}`);
});

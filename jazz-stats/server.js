const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files (this folder)
app.use(express.static(__dirname));

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'utah-jazz.html'));
});

// Proxy endpoint for ESPN API
app.get('/api/*', async (req, res) => {
    try {
        // Remove /api prefix
        const endpoint = req.url.replace('/api/', '');

        // Build ESPN API URL
        const espnApiUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/${endpoint}`;

        console.log(`Proxying ESPN request to: ${espnApiUrl}`);

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
        };

        const response = await fetch(espnApiUrl, { headers });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`ESPN API Error (${response.status}):`, errorText);
            return res.status(response.status).json({
                error: 'ESPN API request failed',
                status: response.status,
                details: errorText
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch from ESPN API', details: error.message });
    }
});

// Proxy endpoint for NBA Stats API (stats.nba.com)
// This API requires specific headers to bypass their protection
app.get('/nba/*', async (req, res) => {
    try {
        // Remove /nba prefix
        const endpoint = req.url.replace('/nba/', '');

        // Build NBA Stats API URL
        const nbaApiUrl = `https://stats.nba.com/stats/${endpoint}`;

        console.log(`Proxying NBA Stats request to: ${nbaApiUrl}`);

        // NBA Stats API requires these specific headers
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Origin': 'https://www.nba.com',
            'Referer': 'https://www.nba.com/',
            'x-nba-stats-origin': 'stats',
            'x-nba-stats-token': 'true',
            'Connection': 'keep-alive',
            'Host': 'stats.nba.com'
        };

        const response = await fetch(nbaApiUrl, {
            headers,
            timeout: 10000
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`NBA Stats API Error (${response.status}):`, errorText.substring(0, 500));
            return res.status(response.status).json({
                error: 'NBA Stats API request failed',
                status: response.status,
                details: errorText.substring(0, 500)
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('NBA Stats Proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch from NBA Stats API', details: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Utah Jazz Stats Server running on http://0.0.0.0:${PORT}`);
    console.log(`Using ESPN's free public API - no authentication required!`);
    console.log(`Access from your network at http://YOUR-SERVER-IP:${PORT}`);
});

const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3060;
const PI_HOST = '10.1.10.52';
const PI_PORT = 80;

// Serve radar.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'radar.html'));
});

// Proxy aircraft data from Pi
app.get('/data/aircraft.json', (req, res) => {
  const options = {
    hostname: PI_HOST,
    port: PI_PORT,
    path: '/tar1090/data/aircraft.json',
    method: 'GET',
    timeout: 3000,
  };

  const piReq = http.request(options, (piRes) => {
    res.setHeader('Content-Type', 'application/json');
    piRes.pipe(res);
  });

  piReq.on('error', (err) => {
    console.error('Pi fetch error:', err.message);
    res.status(502).json({ error: 'Cannot reach Pi', aircraft: [] });
  });

  piReq.on('timeout', () => {
    piReq.destroy();
    res.status(504).json({ error: 'Pi timeout', aircraft: [] });
  });

  piReq.end();
});

app.listen(PORT, () => {
  console.log(`Flight radar running on http://localhost:${PORT}`);
});

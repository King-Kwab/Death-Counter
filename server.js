const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Data Persistence ──────────────────────────────────────────────────────────

const DATA_FILE = path.join(__dirname, 'data.json');

function getDefaultData() {
  const players = {};
  for (const id of Object.keys(config.players)) {
    players[id] = { sessionDeaths: 0, totalDeaths: 0 };
  }
  return { players };
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      // Ensure all players exist in loaded data
      const defaults = getDefaultData();
      for (const id of Object.keys(defaults.players)) {
        if (!parsed.players[id]) {
          parsed.players[id] = defaults.players[id];
        }
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error loading data, using defaults:', err.message);
  }
  return getDefaultData();
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data:', err.message);
  }
}

let data = loadData();
saveData(data); // ensure file exists on first run

// ─── Helpers ────────────────────────────────────────────────────────────────────

function buildPublicState() {
  const players = {};
  for (const [id, playerConfig] of Object.entries(config.players)) {
    const counts = data.players[id] || { sessionDeaths: 0, totalDeaths: 0 };
    players[id] = {
      name: playerConfig.name,
      avatar: playerConfig.avatar,
      sessionDeaths: counts.sessionDeaths,
      totalDeaths: counts.totalDeaths,
    };
  }
  return { players };
}

function authenticatePlayer(playerId, apiKey) {
  const player = config.players[playerId];
  if (!player) return false;
  return player.apiKey === apiKey;
}

function authenticateAdmin(apiKey) {
  return apiKey === config.adminKey;
}

// ─── REST API ───────────────────────────────────────────────────────────────────

// Get all counters (public, no auth)
app.get('/api/counters', (req, res) => {
  res.json(buildPublicState());
});

// Increment a player's death count
app.post('/api/death/:playerId', (req, res) => {
  const { playerId } = req.params;
  const apiKey = req.headers['x-api-key'] || req.body.apiKey;

  if (!config.players[playerId]) {
    return res.status(404).json({ error: 'Player not found' });
  }

  if (!authenticatePlayer(playerId, apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Increment both session and total
  data.players[playerId].sessionDeaths += 1;
  data.players[playerId].totalDeaths += 1;
  saveData(data);

  const publicState = buildPublicState();

  // Emit real-time update to all dashboard clients
  io.emit('death', {
    playerId,
    playerName: config.players[playerId].name,
    sessionDeaths: data.players[playerId].sessionDeaths,
    totalDeaths: data.players[playerId].totalDeaths,
    allPlayers: publicState.players,
  });

  console.log(
    `💀 ${config.players[playerId].name} died! ` +
    `(Session: ${data.players[playerId].sessionDeaths} / Total: ${data.players[playerId].totalDeaths})`
  );

  res.json({
    success: true,
    playerId,
    sessionDeaths: data.players[playerId].sessionDeaths,
    totalDeaths: data.players[playerId].totalDeaths,
  });
});

// Reset session counters (admin only) — keeps total deaths intact
app.post('/api/reset-session', (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.body.apiKey;

  if (!authenticateAdmin(apiKey)) {
    return res.status(401).json({ error: 'Invalid admin key' });
  }

  for (const id of Object.keys(data.players)) {
    data.players[id].sessionDeaths = 0;
  }
  saveData(data);

  const publicState = buildPublicState();
  io.emit('reset-session', publicState);

  console.log('🔄 Session counters reset by admin');
  res.json({ success: true, message: 'Session counters reset', ...publicState });
});

// Full reset — resets both session AND total (admin only)
app.post('/api/reset-all', (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.body.apiKey;

  if (!authenticateAdmin(apiKey)) {
    return res.status(401).json({ error: 'Invalid admin key' });
  }

  for (const id of Object.keys(data.players)) {
    data.players[id].sessionDeaths = 0;
    data.players[id].totalDeaths = 0;
  }
  saveData(data);

  const publicState = buildPublicState();
  io.emit('reset-all', publicState);

  console.log('🗑️  All counters fully reset by admin');
  res.json({ success: true, message: 'All counters reset', ...publicState });
});

// ─── Socket.IO ──────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`🔌 Dashboard client connected (${socket.id})`);

  // Send current state on connect
  socket.emit('init', buildPublicState());

  socket.on('disconnect', () => {
    console.log(`❌ Dashboard client disconnected (${socket.id})`);
  });
});

// ─── Start Server ───────────────────────────────────────────────────────────────

const PORT = process.env.PORT || config.port;

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  💀  DEATH COUNTER SERVER  💀');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Dashboard:  http://localhost:${PORT}`);
  console.log(`  API:        http://localhost:${PORT}/api/counters`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('  Players:');
  for (const [id, p] of Object.entries(config.players)) {
    const d = data.players[id];
    console.log(`    ${p.name} (${id}): ${d.sessionDeaths}/${d.totalDeaths}`);
  }
  console.log('');
});

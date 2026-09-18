# 💀 Death Counter — Shared Multi-Streamer Dashboard

A real-time shared death counter for multiple streamers. Each player increments their own counter via an OBS hotkey, and all counters update live on a single beautiful dashboard.

![Dashboard Preview](docs/preview.png)

## Features

- **4 independent death counters** — each player can only increment their own
- **Dual counter display** — Session Deaths / Total Deaths
- **Real-time updates** via WebSocket (Socket.IO)
- **Death animations** — card flash, number pop, skull burst particles
- **Admin panel** — reset session counters or all counters
- **Persistent storage** — counters survive server restarts
- **API key authentication** — each player has a unique key
- **OBS scripts** — Python & Lua hotkey scripts included
- **Deploy anywhere** — Render, Glitch, Railway, or self-host

---

## Quick Start (Local)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your own API keys:

```env
PLAYER1_KEY=your-secret-key-for-player1
PLAYER2_KEY=your-secret-key-for-player2
PLAYER3_KEY=your-secret-key-for-player3
PLAYER4_KEY=your-secret-key-for-player4
ADMIN_KEY=your-admin-secret-key
```

### 3. Configure player names

Edit `config.js` and update the `name` fields:

```js
players: {
  player1: { name: 'YourName', avatar: '/avatars/player1.png', ... },
  ...
}
```

### 4. Add avatar images (optional)

Place avatar images in `public/avatars/`:
- `public/avatars/player1.png`
- `public/avatars/player2.png`
- `public/avatars/player3.png`
- `public/avatars/player4.png`

If no avatar is found, a fallback initial will be shown.

### 5. Start the server

```bash
npm start
```

Open **http://localhost:3000** to see the dashboard.

---

## Testing with curl / PowerShell

```bash
# Increment player1's death counter
curl -X POST http://localhost:3000/api/death/player1 -H "x-api-key: p1-change-me-abc123"

# View all counters
curl http://localhost:3000/api/counters

# Reset session counters (admin)
curl -X POST http://localhost:3000/api/reset-session -H "x-api-key: admin-change-me-xyz999"

# Reset all counters (admin)
curl -X POST http://localhost:3000/api/reset-all -H "x-api-key: admin-change-me-xyz999"
```

**PowerShell equivalent:**

```powershell
# Increment player1
Invoke-RestMethod -Uri "http://localhost:3000/api/death/player1" -Method POST -Headers @{"x-api-key"="p1-change-me-abc123"}

# View counters
Invoke-RestMethod -Uri "http://localhost:3000/api/counters"
```

---

## OBS Script Setup

Each player installs one of the provided scripts in OBS:

### Python Script (`obs-scripts/death_counter_remote.py`)

1. In OBS, go to **Tools → Scripts**
2. Click **+** and select `death_counter_remote.py`
3. Fill in the fields:
   - **Server URL**: Your deployed URL (e.g., `https://your-app.onrender.com`)
   - **Player ID**: Your assigned ID (`player1`, `player2`, etc.)
   - **API Key**: Your secret key from `.env`
4. Go to **Settings → Hotkeys**, find **"Increment Death Counter"**, and assign a key

### Lua Script (`obs-scripts/death_counter_remote.lua`)

Same setup process — just select the `.lua` file instead. Uses `curl` under the hood.

---

## Deploying to Render (Free)

1. Push your code to a GitHub/GitLab repo
2. Go to [render.com](https://render.com) and create a **New Web Service**
3. Connect your repo
4. Render will auto-detect `render.yaml` — it will set up the service
5. In the Render dashboard, go to **Environment** and set your API keys
6. Your dashboard will be live at `https://your-app.onrender.com`

> **Note:** On the free tier, Render spins down after 15 minutes of inactivity. The first request after idle will take ~30 seconds to wake up. For always-on, use the paid tier ($7/mo).

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/counters` | None | Get all player counters |
| `POST` | `/api/death/:playerId` | `x-api-key` (player) | Increment a player's death count |
| `POST` | `/api/reset-session` | `x-api-key` (admin) | Reset all session counters to 0 |
| `POST` | `/api/reset-all` | `x-api-key` (admin) | Reset all counters (session + total) |

---

## Project Structure

```
death-counter/
├── server.js           # Express + Socket.IO server
├── config.js           # Player names, avatars, API keys
├── data.json           # Persistent counter data (auto-generated)
├── package.json
├── .env                # Secret keys (not committed)
├── .env.example        # Template for .env
├── render.yaml         # Render deployment config
├── public/
│   ├── index.html      # Dashboard page
│   ├── style.css       # Styles & animations
│   ├── app.js          # Client-side logic
│   └── avatars/        # Player avatar images
└── obs-scripts/
    ├── death_counter_remote.py   # Python OBS script
    └── death_counter_remote.lua  # Lua OBS script
```

---

## License

MIT

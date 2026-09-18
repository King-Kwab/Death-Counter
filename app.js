/* ═══════════════════════════════════════════════════════════════════════════════
   DEATH COUNTER — CLIENT APP
   Socket.IO client, DOM rendering, animations, admin controls
   ═══════════════════════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  // ─── DOM References ─────────────────────────────────────────────────────────
  const playersGrid = document.getElementById('playersGrid');
  const totalSessionEl = document.getElementById('totalSession');
  const totalAllTimeEl = document.getElementById('totalAllTime');
  const connectionStatus = document.getElementById('connectionStatus');
  const statusText = connectionStatus.querySelector('.status-text');
  const adminToggle = document.getElementById('adminToggle');
  const adminDropdown = document.getElementById('adminDropdown');
  const adminKeyInput = document.getElementById('adminKeyInput');
  const btnResetSession = document.getElementById('btnResetSession');
  const btnResetAll = document.getElementById('btnResetAll');

  // ─── State ──────────────────────────────────────────────────────────────────
  let players = {};

  // ─── Background Particles ──────────────────────────────────────────────────
  function createBackgroundParticles() {
    const container = document.getElementById('bgParticles');
    const count = 30;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'bg-particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDuration = (8 + Math.random() * 15) + 's';
      particle.style.animationDelay = (Math.random() * 10) + 's';
      particle.style.width = (2 + Math.random() * 3) + 'px';
      particle.style.height = particle.style.width;
      particle.style.background = Math.random() > 0.5
        ? 'var(--accent-crimson)'
        : 'var(--accent-purple)';
      container.appendChild(particle);
    }
  }

  // ─── Render Player Cards ───────────────────────────────────────────────────
  function renderPlayers(playersData) {
    players = playersData;
    playersGrid.innerHTML = '';

    for (const [id, player] of Object.entries(playersData)) {
      const card = document.createElement('div');
      card.className = 'player-card';
      card.id = `card-${id}`;
      card.innerHTML = `
        <div class="player-avatar">
          <img
            src="${player.avatar}"
            alt="${player.name}"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          />
          <div class="player-avatar-fallback" style="display:none;">
            ${player.name.charAt(0).toUpperCase()}
          </div>
        </div>
        <div class="player-info">
          <div class="player-name">${player.name}</div>
        </div>
        <div class="death-stats">
          <div class="death-display">
            <span class="death-session" id="session-${id}">${player.sessionDeaths}</span>
            <span class="death-separator">/</span>
            <span class="death-total" id="total-${id}">${player.totalDeaths}</span>
          </div>
          <div class="death-labels">
            <span class="death-label">Session</span>
            <span class="death-label" style="margin-left: 10px;">Total</span>
          </div>
        </div>
      `;
      playersGrid.appendChild(card);
    }

    updateCombinedTotals();
  }

  // ─── Update Combined Totals ────────────────────────────────────────────────
  function updateCombinedTotals() {
    let session = 0;
    let allTime = 0;
    for (const p of Object.values(players)) {
      session += p.sessionDeaths;
      allTime += p.totalDeaths;
    }
    animateNumber(totalSessionEl, parseInt(totalSessionEl.textContent) || 0, session);
    animateNumber(totalAllTimeEl, parseInt(totalAllTimeEl.textContent) || 0, allTime);
  }

  // ─── Animate Number Counter ────────────────────────────────────────────────
  function animateNumber(el, from, to) {
    if (from === to) {
      el.textContent = to;
      return;
    }
    const duration = 400;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(from + (to - from) * eased);
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }

  // ─── Death Animation ──────────────────────────────────────────────────────
  function triggerDeathAnimation(playerId) {
    const card = document.getElementById(`card-${playerId}`);
    if (!card) return;

    // Flash animation on card
    card.classList.remove('death-flash');
    void card.offsetWidth; // reflow to restart animation
    card.classList.add('death-flash');
    setTimeout(() => card.classList.remove('death-flash'), 1000);

    // Pop animation on session number
    const sessionEl = document.getElementById(`session-${playerId}`);
    if (sessionEl) {
      sessionEl.classList.remove('death-pop');
      void sessionEl.offsetWidth;
      sessionEl.classList.add('death-pop');
      setTimeout(() => sessionEl.classList.remove('death-pop'), 500);
    }

    // Pop animation on total number
    const totalEl = document.getElementById(`total-${playerId}`);
    if (totalEl) {
      totalEl.classList.remove('death-pop');
      void totalEl.offsetWidth;
      totalEl.classList.add('death-pop');
      setTimeout(() => totalEl.classList.remove('death-pop'), 500);
    }

    // Skull burst particles
    spawnSkullBurst(card);
  }

  // ─── Skull Burst Effect ────────────────────────────────────────────────────
  function spawnSkullBurst(card) {
    const skulls = ['💀', '☠️', '🦴'];
    const count = 6;

    for (let i = 0; i < count; i++) {
      const skull = document.createElement('span');
      skull.className = 'skull-burst';
      skull.textContent = skulls[Math.floor(Math.random() * skulls.length)];

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const distance = 60 + Math.random() * 50;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const rot = (Math.random() - 0.5) * 360;

      skull.style.setProperty('--tx', tx + 'px');
      skull.style.setProperty('--ty', ty + 'px');
      skull.style.setProperty('--rot', rot + 'deg');
      skull.style.left = '50%';
      skull.style.top = '40%';

      card.appendChild(skull);
      setTimeout(() => skull.remove(), 1100);
    }
  }

  // ─── Update Single Player ──────────────────────────────────────────────────
  function updatePlayer(playerId, sessionDeaths, totalDeaths) {
    if (players[playerId]) {
      players[playerId].sessionDeaths = sessionDeaths;
      players[playerId].totalDeaths = totalDeaths;
    }

    const sessionEl = document.getElementById(`session-${playerId}`);
    const totalEl = document.getElementById(`total-${playerId}`);

    if (sessionEl) {
      animateNumber(sessionEl, parseInt(sessionEl.textContent) || 0, sessionDeaths);
    }
    if (totalEl) {
      animateNumber(totalEl, parseInt(totalEl.textContent) || 0, totalDeaths);
    }

    updateCombinedTotals();
  }

  // ─── Toast Notifications ──────────────────────────────────────────────────
  let toastTimeout;
  function showToast(message, type = 'success') {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    clearTimeout(toastTimeout);
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ─── Admin Panel ──────────────────────────────────────────────────────────
  adminToggle.addEventListener('click', () => {
    adminDropdown.classList.toggle('open');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!document.getElementById('adminPanel').contains(e.target)) {
      adminDropdown.classList.remove('open');
    }
  });

  btnResetSession.addEventListener('click', async () => {
    const key = adminKeyInput.value.trim();
    if (!key) {
      showToast('Enter admin key first', 'error');
      return;
    }
    try {
      const res = await fetch('/api/reset-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      });
      const data = await res.json();
      if (res.ok) {
        showToast('🔄 Session counters reset!', 'success');
        adminDropdown.classList.remove('open');
      } else {
        showToast(data.error || 'Reset failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  });

  btnResetAll.addEventListener('click', async () => {
    const key = adminKeyInput.value.trim();
    if (!key) {
      showToast('Enter admin key first', 'error');
      return;
    }
    if (!confirm('⚠️ This will reset ALL death counts (session AND total) for every player. Are you sure?')) {
      return;
    }
    try {
      const res = await fetch('/api/reset-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      });
      const data = await res.json();
      if (res.ok) {
        showToast('🗑️ All counters reset!', 'success');
        adminDropdown.classList.remove('open');
      } else {
        showToast(data.error || 'Reset failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  });

  // ─── Socket.IO Connection ─────────────────────────────────────────────────
  const socket = io();

  socket.on('connect', () => {
    connectionStatus.className = 'connection-status connected';
    statusText.textContent = 'Connected';
  });

  socket.on('disconnect', () => {
    connectionStatus.className = 'connection-status disconnected';
    statusText.textContent = 'Disconnected';
  });

  // Initial state from server
  socket.on('init', (state) => {
    renderPlayers(state.players);
  });

  // Real-time death event
  socket.on('death', (event) => {
    updatePlayer(event.playerId, event.sessionDeaths, event.totalDeaths);
    triggerDeathAnimation(event.playerId);
  });

  // Session reset
  socket.on('reset-session', (state) => {
    renderPlayers(state.players);
    showToast('🔄 Session counters have been reset', 'success');
  });

  // Full reset
  socket.on('reset-all', (state) => {
    renderPlayers(state.players);
    showToast('🗑️ All counters have been reset', 'success');
  });

  // ─── Init ─────────────────────────────────────────────────────────────────
  createBackgroundParticles();
})();

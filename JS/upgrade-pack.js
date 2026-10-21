/* ==========================================================================
   Null_X Upgrade Pack  v1.0
   --------------------------------------------------------------------------
   Everything here is additive. It does not modify main.js; it reads the game
   list that main.js already builds and wraps window.launchGame() so it can
   remember what you played.

   Features
   1. Command palette (Ctrl/Cmd + K) - search every game, run quick actions
   2. Keyboard shortcuts sheet (press ?)
   3. XP + levels with a chip in the top bar
   4. 17 unlockable achievements with pop-ups and confetti
   5. Personal stats (games played, unique games, play time, favorites, streak)
   6. Daily check-in streak bonus
   7. "Continue playing" row on the home screen + a daily pick with bonus XP
   8. Six colour themes for the site
   9. Back-to-top button

   Load with:  <script src="JS/upgrade-pack.js?v=1" defer></script>
   ========================================================================== */
(function () {
  'use strict';

  if (window.__nxUpgradeLoaded) return;
  window.__nxUpgradeLoaded = true;

  var KEY = {
    xp: 'nxup_xp',
    stats: 'nxup_stats',
    ach: 'nxup_ach',
    streak: 'nxup_streak',
    theme: 'nxup_theme',
    play: 'nxup_play',
    help: 'nxup_help_seen'
  };

  /* ------------------------------------------------------------------ */
  /* Storage helpers                                                     */
  /* ------------------------------------------------------------------ */
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null || raw === undefined || raw === '') return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* private mode / storage full - ignore */ }
  }

  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }

  function num(value, fallback) {
    var n = Number(value);
    return isFinite(n) ? n : fallback;
  }

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */
  var savedStats = read(KEY.stats, {}) || {};

  var state = {
    xp: num(read(KEY.xp, 0), 0),
    theme: read(KEY.theme, 'purple'),
    helpSeen: !!read(KEY.help, false),
    stats: {
      launches: num(savedStats.launches, 0),
      playMs: num(savedStats.playMs, 0),
      favs: num(savedStats.favs, 0),
      bestStreak: num(savedStats.bestStreak, 0),
      unique: (savedStats.unique && typeof savedStats.unique === 'object') ? savedStats.unique : {},
      perGame: (savedStats.perGame && typeof savedStats.perGame === 'object') ? savedStats.perGame : {},
      history: Array.isArray(savedStats.history) ? savedStats.history : [],
      nightOwl: !!savedStats.nightOwl,
      earlyBird: !!savedStats.earlyBird,
      usedPalette: !!savedStats.usedPalette,
      themeChanged: !!savedStats.themeChanged
    },
    ach: read(KEY.ach, {}) || {},
    streak: read(KEY.streak, { day: '', count: 0 }) || { day: '', count: 0 }
  };

  if (!state.ach || typeof state.ach !== 'object' || Array.isArray(state.ach)) state.ach = {};
  if (!state.streak || typeof state.streak !== 'object') state.streak = { day: '', count: 0 };

  function saveStats() { write(KEY.stats, state.stats); }

  /* ------------------------------------------------------------------ */
  /* Game list (read-only view of what main.js already has)              */
  /* ------------------------------------------------------------------ */
  var gameCache = { list: [], byId: {} };

  function refreshGames() {
    var list = [];
    try {
      if (typeof _0xData !== 'undefined' && Array.isArray(_0xData)) list = _0xData.slice();
    } catch (e) { /* main.js not loaded yet */ }

    if (!list.length && Array.isArray(window.__nxGridSource)) {
      list = window.__nxGridSource.slice();
    }

    if (!list.length) {
      var cards = document.querySelectorAll('.game-card[data-game-id]');
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var h3 = card.querySelector('h3');
        var img = card.querySelector('img');
        list.push({
          id: card.getAttribute('data-game-id'),
          title: h3 ? h3.textContent : 'Game',
          image: img ? img.getAttribute('src') : '',
          desc: ''
        });
      }
    }

    var byId = {};
    var clean = [];
    for (var j = 0; j < list.length; j++) {
      var g = list[j] || {};
      if (g.id === undefined || g.id === null) continue;
      var entry = {
        id: String(g.id),
        title: String(g.title || 'Game'),
        image: String(g.image || ''),
        desc: String(g.desc || '')
      };
      clean.push(entry);
      byId[entry.id] = entry;
    }
    gameCache = { list: clean, byId: byId };
    return gameCache;
  }

  function gameById(id) {
    if (!gameCache.list.length) refreshGames();
    return gameCache.byId[String(id)] || null;
  }

  /* ------------------------------------------------------------------ */
  /* Level maths                                                         */
  /*   Level 1 at 0 XP, level 2 at 100, 3 at 400, 4 at 900, 5 at 1600...  */
  /* ------------------------------------------------------------------ */
  function xpForLevel(level) {
    return 100 * Math.pow(Math.max(1, level) - 1, 2);
  }

  function levelInfo(xp) {
    xp = Math.max(0, num(xp, 0));
    var level = 1;
    while (level < 99 && xp >= xpForLevel(level + 1)) level++;
    var base = xpForLevel(level);
    var next = xpForLevel(level + 1);
    var span = Math.max(1, next - base);
    var into = xp - base;
    return {
      level: level,
      xp: xp,
      into: into,
      need: Math.max(0, next - xp),
      pct: Math.max(0, Math.min(100, (into / span) * 100))
    };
  }

  /* ------------------------------------------------------------------ */
  /* Achievements                                                        */
  /* ------------------------------------------------------------------ */
  var ACHIEVEMENTS = [
    { id: 'first_launch', icon: '🎮', title: 'Press Start', desc: 'Launch your first game', xp: 20,
      test: function () { return state.stats.launches >= 1; } },
    { id: 'launch_5', icon: '🔥', title: 'Warmed Up', desc: 'Launch 5 games', xp: 25,
      test: function () { return state.stats.launches >= 5; } },
    { id: 'launch_10', icon: '⚡', title: 'Regular', desc: 'Launch 10 games', xp: 30,
      test: function () { return state.stats.launches >= 10; } },
    { id: 'launch_25', icon: '🕹️', title: 'Arcade Rat', desc: 'Launch 25 games', xp: 50,
      test: function () { return state.stats.launches >= 25; } },
    { id: 'launch_50', icon: '👾', title: 'No-Life Legend', desc: 'Launch 50 games', xp: 80,
      test: function () { return state.stats.launches >= 50; } },
    { id: 'unique_10', icon: '🧭', title: 'Explorer', desc: 'Play 10 different games', xp: 40,
      test: function () { return Object.keys(state.stats.unique).length >= 10; } },
    { id: 'unique_25', icon: '🗺️', title: 'Cartographer', desc: 'Play 25 different games', xp: 70,
      test: function () { return Object.keys(state.stats.unique).length >= 25; } },
    { id: 'favorite_1', icon: '⭐', title: 'Collector', desc: 'Favorite your first game', xp: 15,
      test: function () { return state.stats.favs >= 1; } },
    { id: 'favorite_5', icon: '💜', title: 'Curator', desc: 'Favorite 5 games', xp: 30,
      test: function () { return state.stats.favs >= 5; } },
    { id: 'streak_3', icon: '📅', title: 'On a Roll', desc: 'Visit 3 days in a row', xp: 40,
      test: function () { return state.streak.count >= 3; } },
    { id: 'streak_7', icon: '🏆', title: 'Week Warrior', desc: 'Visit 7 days in a row', xp: 90,
      test: function () { return state.streak.count >= 7; } },
    { id: 'night_owl', icon: '🌙', title: 'Night Owl', desc: 'Start a game between midnight and 4 AM', xp: 30,
      test: function () { return !!state.stats.nightOwl; } },
    { id: 'early_bird', icon: '🌅', title: 'Early Bird', desc: 'Start a game between 5 AM and 8 AM', xp: 30,
      test: function () { return !!state.stats.earlyBird; } },
    { id: 'play_1h', icon: '⏱️', title: 'One More Game', desc: 'Play for 1 hour in total', xp: 60,
      test: function () { return state.stats.playMs >= 60 * 60 * 1000; } },
    { id: 'level_5', icon: '🚀', title: 'Rising Star', desc: 'Reach level 5', xp: 50,
      test: function () { return levelInfo(state.xp).level >= 5; } },
    { id: 'power_user', icon: '⌨️', title: 'Power User', desc: 'Open the command palette', xp: 20,
      test: function () { return !!state.stats.usedPalette; } },
    { id: 'makeover', icon: '🎨', title: 'Makeover', desc: 'Change the site colour theme', xp: 20,
      test: function () { return !!state.stats.themeChanged; } }
  ];

  var checking = false;

  function checkAchievements() {
    if (checking) return;
    checking = true;

    var unlocked = [];
    for (var pass = 0; pass < 4; pass++) {
      var found = false;
      for (var i = 0; i < ACHIEVEMENTS.length; i++) {
        var a = ACHIEVEMENTS[i];
        if (state.ach[a.id]) continue;
        var ok = false;
        try { ok = !!a.test(); } catch (e) { ok = false; }
        if (!ok) continue;
        state.ach[a.id] = Date.now();
        state.xp += a.xp;
        unlocked.push(a);
        found = true;
      }
      if (!found) break;
    }

    if (unlocked.length) {
      write(KEY.ach, state.ach);
      write(KEY.xp, state.xp);
      updateLevelChip();
      unlocked.forEach(function (a, index) {
        setTimeout(function () {
          toast(a.icon, 'Achievement unlocked: ' + a.title, a.desc, '+' + a.xp + ' XP');
          confetti();
        }, index * 450);
      });
      setDockDot(true);
      renderDashboardIfOpen();
    }

    checking = false;
  }

  /* ------------------------------------------------------------------ */
  /* Toast + confetti                                                    */
  /* ------------------------------------------------------------------ */
  var toastHost = null;

  function ensureToastHost() {
    if (toastHost && document.body.contains(toastHost)) return toastHost;
    toastHost = document.getElementById('nxup-toasts');
    if (!toastHost) {
      toastHost = document.createElement('div');
      toastHost.id = 'nxup-toasts';
      toastHost.setAttribute('role', 'status');
      toastHost.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastHost);
    }
    return toastHost;
  }

  function toast(icon, title, message, meta) {
    var host = ensureToastHost();
    var el = document.createElement('div');
    el.className = 'nxup-toast';

    var iconEl = document.createElement('span');
    iconEl.className = 'nxup-toast-icon';
    iconEl.textContent = icon || '✨';
    el.appendChild(iconEl);

    var text = document.createElement('span');
    var t = document.createElement('span');
    t.className = 'nxup-toast-title';
    t.textContent = String(title || '');
    text.appendChild(t);
    if (message) {
      var m = document.createElement('span');
      m.className = 'nxup-toast-msg';
      m.textContent = String(message);
      text.appendChild(m);
    }
    el.appendChild(text);

    if (meta) {
      var xpEl = document.createElement('span');
      xpEl.className = 'nxup-toast-xp';
      xpEl.textContent = String(meta);
      el.appendChild(xpEl);
    }

    function dismiss() {
      if (!el.parentNode) return;
      el.classList.add('nxup-out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
    }

    el.addEventListener('click', dismiss);
    host.appendChild(el);

    while (host.children.length > 4) host.removeChild(host.firstChild);
    setTimeout(dismiss, 4400);
    return el;
  }

  function confetti() {
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    } catch (e) {}

    var canvas = document.getElementById('nxup-confetti');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'nxup-confetti';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.appendChild(canvas);
    }

    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;

    var w = window.innerWidth || 1024;
    var h = window.innerHeight || 768;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var colors = ['#8b00ff', '#c084fc', '#ffd166', '#00d97e', '#ff2d55', '#00c2ff'];
    var parts = [];
    for (var i = 0; i < 90; i++) {
      parts.push({
        x: w * 0.5 + (Math.random() - 0.5) * w * 0.55,
        y: h * 0.32,
        vx: (Math.random() - 0.5) * 10,
        vy: Math.random() * -9 - 3,
        g: 0.28 + Math.random() * 0.18,
        size: 4 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        color: colors[i % colors.length]
      });
    }

    var start = (window.performance && performance.now) ? performance.now() : Date.now();

    function frame(now) {
      var t = now || Date.now();
      ctx.clearRect(0, 0, w, h);
      for (var k = 0; k < parts.length; k++) {
        var p = parts[k];
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (t - start < 1750) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, w, h);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    }

    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------ */
  /* Level chip / dock                                                   */
  /* ------------------------------------------------------------------ */
  var chipEl = null;
  var dockDot = null;

  function updateLevelChip() {
    if (!chipEl) return;
    var info = levelInfo(state.xp);
    var lvl = chipEl.querySelector('.nxup-chip-level');
    var fill = chipEl.querySelector('.nxup-chip-fill');
    if (lvl) lvl.textContent = 'LVL ' + info.level;
    if (fill) fill.style.width = info.pct.toFixed(1) + '%';
    chipEl.title = 'Level ' + info.level + ' · ' + info.xp + ' XP' +
      (info.need ? ' · ' + info.need + ' XP to level ' + (info.level + 1) : ' · max level');
    chipEl.setAttribute('aria-label', chipEl.title + '. Open stats.');
  }

  function setDockDot(on) {
    if (!dockDot) return;
    dockDot.style.display = on ? 'block' : 'none';
  }

  function buildLevelChip() {
    var statsBar = document.querySelector('.top-bar-stats');
    if (!statsBar || document.getElementById('nxup-level-chip')) {
      chipEl = document.getElementById('nxup-level-chip');
      updateLevelChip();
      return;
    }
    chipEl = document.createElement('button');
    chipEl.type = 'button';
    chipEl.id = 'nxup-level-chip';
    chipEl.innerHTML =
      '<span class="nxup-chip-level">LVL 1</span>' +
      '<span class="nxup-chip-bar"><span class="nxup-chip-fill"></span></span>';
    chipEl.addEventListener('click', function () { openDashboard('overview'); });
    statsBar.appendChild(chipEl);
    updateLevelChip();
  }

  function buildDock() {
    if (document.getElementById('nxup-dock')) return;

    var dock = document.createElement('div');
    dock.id = 'nxup-dock';
    dock.setAttribute('role', 'toolbar');
    dock.setAttribute('aria-label', 'Site tools');

    var paletteBtn = document.createElement('button');
    paletteBtn.type = 'button';
    paletteBtn.className = 'nxup-dock-btn nxup-cmd';
    paletteBtn.id = 'nxup-open-palette';
    paletteBtn.title = 'Search games & commands (Ctrl+K)';
    paletteBtn.setAttribute('aria-label', 'Search games and commands');
    paletteBtn.textContent = '⌘K';
    paletteBtn.addEventListener('click', function () { openPalette(); });

    var dashBtn = document.createElement('button');
    dashBtn.type = 'button';
    dashBtn.className = 'nxup-dock-btn';
    dashBtn.id = 'nxup-open-dash';
    dashBtn.title = 'Stats & achievements';
    dashBtn.setAttribute('aria-label', 'Open stats and achievements');
    dashBtn.textContent = '🏆';
    dockDot = document.createElement('span');
    dockDot.className = 'nxup-dot';
    dockDot.style.display = 'none';
    dockDot.setAttribute('aria-hidden', 'true');
    dashBtn.appendChild(dockDot);
    dashBtn.addEventListener('click', function () { openDashboard('overview'); });

    var themeBtn = document.createElement('button');
    themeBtn.type = 'button';
    themeBtn.className = 'nxup-dock-btn';
    themeBtn.id = 'nxup-open-themes';
    themeBtn.title = 'Change colour theme';
    themeBtn.setAttribute('aria-label', 'Change colour theme');
    themeBtn.textContent = '🎨';
    themeBtn.addEventListener('click', function () { openDashboard('themes'); });

    var topBtn = document.createElement('button');
    topBtn.type = 'button';
    topBtn.className = 'nxup-dock-btn';
    topBtn.id = 'nxup-top';
    topBtn.title = 'Back to top';
    topBtn.setAttribute('aria-label', 'Back to top');
    topBtn.textContent = '↑';
    topBtn.addEventListener('click', scrollToTop);

    dock.appendChild(paletteBtn);
    dock.appendChild(dashBtn);
    dock.appendChild(themeBtn);
    dock.appendChild(topBtn);
    document.body.appendChild(dock);
  }

  /* ------------------------------------------------------------------ */
  /* Scroll helpers                                                      */
  /* ------------------------------------------------------------------ */
  function scrollBox() {
    var main = document.querySelector('.main-content');
    if (main) {
      try {
        var st = window.getComputedStyle(main);
        if (st && (st.overflowY === 'auto' || st.overflowY === 'scroll')) return main;
      } catch (e) {}
    }
    return null;
  }

  function scrollTopValue() {
    var box = scrollBox();
    if (box) return box.scrollTop || 0;
    return window.scrollY || document.documentElement.scrollTop || 0;
  }

  function scrollToTop() {
    var box = scrollBox();
    if (box && typeof box.scrollTo === 'function') {
      box.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function wireBackToTop() {
    var btn = document.getElementById('nxup-top');
    if (!btn) return;

    function sync() {
      var over = scrollTopValue() > 380;
      btn.classList.toggle('nxup-show', over);
      btn.tabIndex = over ? 0 : -1;
    }

    var box = scrollBox();
    if (box) box.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    sync();
  }

  /* ------------------------------------------------------------------ */
  /* Themes                                                             */
  /* ------------------------------------------------------------------ */
  var THEMES = {
    purple: { name: 'Null Purple', accent: '#8b00ff', hover: '#a033ff', bg: '#120024', sidebar: '#1a0033', border: '#3b1d70', text: '#e8e0ff', muted: '#b39ddb' },
    cyan:   { name: 'Cyber Cyan',  accent: '#00c2ff', hover: '#38d6ff', bg: '#04121c', sidebar: '#062033', border: '#114a63', text: '#e0f6ff', muted: '#93c9dd' },
    crimson:{ name: 'Crimson',     accent: '#ff2d55', hover: '#ff5c7c', bg: '#1a0410', sidebar: '#26061a', border: '#6b1730', text: '#ffe6ec', muted: '#d19aa9' },
    emerald:{ name: 'Emerald',     accent: '#00d97e', hover: '#33e69a', bg: '#04170f', sidebar: '#06241a', border: '#12603f', text: '#e2fff2', muted: '#93ccb0' },
    gold:   { name: 'Gold',        accent: '#f5b301', hover: '#ffc633', bg: '#161103', sidebar: '#221a05', border: '#6b530f', text: '#fff6dc', muted: '#d3bd85' },
    mono:   { name: 'Mono Chrome', accent: '#c9c9d4', hover: '#e6e6ef', bg: '#0b0b0f', sidebar: '#14141a', border: '#33333d', text: '#f2f2f6', muted: '#a0a0ad' }
  };

  function applyTheme(id, opts) {
    opts = opts || {};
    var theme = THEMES[id] || THEMES.purple;
    var root = document.documentElement;
    var style = root.style;

    style.setProperty('--accent', theme.accent);
    style.setProperty('--accent-hover', theme.hover);
    style.setProperty('--bg-dashboard', theme.bg);
    style.setProperty('--bg-sidebar', theme.sidebar);
    style.setProperty('--border-color', theme.border);
    style.setProperty('--text-main', theme.text);
    style.setProperty('--text-muted', theme.muted);
    style.setProperty('--bg-gradient', 'linear-gradient(135deg,' + theme.sidebar + ',' + theme.bg + ')');

    try { root.setAttribute('data-nxup-theme', id in THEMES ? id : 'purple'); } catch (e) {}

    state.theme = (id in THEMES) ? id : 'purple';
    write(KEY.theme, state.theme);

    var buttons = document.querySelectorAll('.nxup-theme');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.toggle('nxup-active', buttons[i].getAttribute('data-theme') === state.theme);
    }

    if (!opts.silent) {
      state.stats.themeChanged = true;
      saveStats();
      addXp(10);
      toast('🎨', 'Theme changed: ' + theme.name, 'Saved for next time', '+10 XP');
      checkAchievements();
    }
  }

  function addXp(amount) {
    amount = num(amount, 0);
    if (!amount) return;
    state.xp += amount;
    write(KEY.xp, state.xp);
    updateLevelChip();
  }

  /* ------------------------------------------------------------------ */
  /* Launch tracking                                                     */
  /* ------------------------------------------------------------------ */
  var PALETTE_XP_DONE = false;

  function recordLaunch(id) {
    id = String(id);
    var game = gameById(id);
    var now = Date.now();
    var hour = new Date().getHours();
    var st = state.stats;

    st.launches = num(st.launches, 0) + 1;
    var isNew = !st.unique[id];
    st.unique[id] = num(st.unique[id], 0) + 1;

    var rec = st.perGame[id];
    if (!rec || typeof rec !== 'object') rec = st.perGame[id] = { title: id, image: '', count: 0, ms: 0 };
    rec.count = num(rec.count, 0) + 1;
    rec.lastPlayed = now;
    if (game) {
      rec.title = game.title;
      if (game.image) rec.image = game.image;
    }

    if (hour < 4) st.nightOwl = true;
    if (hour >= 5 && hour < 8) st.earlyBird = true;

    var history = Array.isArray(st.history) ? st.history : [];
    history = history.filter(function (h) { return h && String(h.id) !== id; });
    history.unshift({ id: id, title: rec.title, image: rec.image, ts: now });
    st.history = history.slice(0, 12);

    saveStats();
    write(KEY.play, { id: id, ts: now });

    if (isNew) {
      addXp(25);
      toast('🎮', 'New game: ' + rec.title, 'First time playing this one', '+25 XP');
    } else {
      addXp(10);
    }

    var pick = dailyPick();
    var today = dayKey(new Date());
    if (pick && String(pick.id) === id && state.stats.dailyPickDay !== today) {
      state.stats.dailyPickDay = today;
      saveStats();
      addXp(20);
      toast('🎯', "Today's pick played", '+20 XP bonus', '+20 XP');
    }

    checkAchievements();
    renderDailyPick();
    renderRail();
  }

  function hookLaunch() {
    if (typeof window.launchGame !== 'function') return false;
    if (window.launchGame.__nxupHooked) return true;

    var original = window.launchGame;
    var wrapped = function (gameId) {
      try { recordLaunch(gameId); } catch (e) {}
      return original.apply(this, arguments);
    };
    wrapped.__nxupHooked = true;

    try {
      window.launchGame = wrapped;
    } catch (e) {
      return false;
    }
    return true;
  }

  function launchGameSafe(id) {
    id = String(id);
    if (typeof window.launchGame === 'function') {
      try {
        window.launchGame(id);
        return true;
      } catch (e) {}
    }
    var card = document.querySelector('.game-card[data-game-id="' + id.replace(/"/g, '\\"') + '"]');
    if (card) {
      card.click();
      return true;
    }
    toast('⚠️', 'Could not open that game', 'Reload the page and try again');
    return false;
  }

  function randomGame() {
    var list = gameCache.list.length ? gameCache.list : refreshGames().list;
    if (!list.length) return false;
    var lastId = state.stats.history[0] ? String(state.stats.history[0].id) : '';
    var pool = list.filter(function (g) { return g.id !== lastId; });
    if (!pool.length) pool = list;
    return launchGameSafe(pool[Math.floor(Math.random() * pool.length)].id);
  }

  function creditPlayTime() {
    var session = read(KEY.play, null);
    if (!session || !session.ts) return;
    remove(KEY.play);

    var delta = Date.now() - num(session.ts, 0);
    if (delta < 15000 || delta > 6 * 60 * 60 * 1000) return;

    var capped = Math.min(delta, 4 * 60 * 60 * 1000);
    state.stats.playMs = num(state.stats.playMs, 0) + capped;

    var rec = state.stats.perGame[String(session.id)];
    if (rec && typeof rec === 'object') rec.ms = num(rec.ms, 0) + capped;
    saveStats();
  }

  /* ------------------------------------------------------------------ */
  /* Daily streak + favorites                                            */
  /* ------------------------------------------------------------------ */
  function dayKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function syncStreak() {
    var today = dayKey(new Date());
    if (state.streak.day === today) return;

    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var count = state.streak.day === dayKey(yesterday) ? num(state.streak.count, 0) + 1 : 1;

    state.streak = { day: today, count: count };
    state.stats.bestStreak = Math.max(num(state.stats.bestStreak, 0), count);
    write(KEY.streak, state.streak);
    saveStats();

    addXp(25);
    toast('🔥', 'Day ' + count + ' streak', 'Come back tomorrow for +25 XP', '+25 XP');
    checkAchievements();
  }

  function syncFavorites() {
    var list = [];
    try {
      var parsed = JSON.parse(localStorage.getItem('nullx_favorites_arr') || '[]');
      if (Array.isArray(parsed)) list = parsed;
    } catch (e) {}
    var count = list.length;
    var previous = num(state.stats.favs, 0);

    if (count === previous) return;

    state.stats.favs = count;
    saveStats();

    if (count > previous) {
      var gained = count - previous;
      addXp(5 * gained);
      toast('⭐', gained === 1 ? 'Favorite added' : gained + ' favorites added', 'Saved in your library', '+' + (5 * gained) + ' XP');
    }
    checkAchievements();
  }

  /* ------------------------------------------------------------------ */
  /* Continue playing rail                                               */
  /* ------------------------------------------------------------------ */
  var railEl = null;

  function buildRail() {
    if (document.getElementById('nxup-rail')) { railEl = document.getElementById('nxup-rail'); return; }

    var anchor = document.querySelector('.random-section');
    if (!anchor || !anchor.parentNode) return;

    railEl = document.createElement('section');
    railEl.id = 'nxup-rail';
    railEl.setAttribute('aria-label', 'Continue playing');

    var daily = document.createElement('div');
    daily.className = 'nxup-daily';
    daily.id = 'nxup-daily';
    railEl.appendChild(daily);

    var head = document.createElement('div');
    head.className = 'nxup-rail-head';

    var title = document.createElement('h3');
    title.className = 'nxup-rail-title';
    title.innerHTML = '<i class="fas fa-clock-rotate-left" aria-hidden="true"></i> Continue playing';
    head.appendChild(title);

    var clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'nxup-link';
    clear.id = 'nxup-rail-clear';
    clear.textContent = 'Clear';
    clear.addEventListener('click', function () {
      state.stats.history = [];
      saveStats();
      renderRail();
      toast('🧹', 'Continue playing cleared', 'It will fill up again as you play');
    });
    head.appendChild(clear);

    railEl.appendChild(head);

    var list = document.createElement('div');
    list.className = 'nxup-rail-list';
    railEl.appendChild(list);

    anchor.parentNode.insertBefore(railEl, anchor);
    renderDailyPick();
    renderRail();
    updateRailVisibility();

    try {
      var observer = new MutationObserver(updateRailVisibility);
      var hero = document.getElementById('heroSection');
      if (hero) observer.observe(hero, { attributes: true, attributeFilter: ['style', 'class'] });
      observer.observe(anchor, { attributes: true, attributeFilter: ['style', 'class'] });
    } catch (e) {}
  }

  function dailyPick() {
    var list = gameCache.list.length ? gameCache.list : refreshGames().list;
    if (!list.length) return null;
    var key = dayKey(new Date());
    var hash = 0;
    for (var i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % 100000;
    return list[hash % list.length];
  }

  function renderDailyPick() {
    var box = document.getElementById('nxup-daily');
    if (!box) return;
    var game = dailyPick();
    if (!game) { box.style.display = 'none'; return; }

    box.style.display = 'flex';
    box.innerHTML = '';

    var thumb = document.createElement('div');
    thumb.className = 'nxup-daily-thumb';
    if (game.image) {
      var img = document.createElement('img');
      img.src = game.image;
      img.alt = '';
      img.loading = 'lazy';
      thumb.appendChild(img);
    } else {
      thumb.textContent = String(game.title || '?').substring(0, 2).toUpperCase();
    }
    box.appendChild(thumb);

    var playedToday = state.stats.dailyPickDay === dayKey(new Date());

    var text = document.createElement('div');
    text.className = 'nxup-daily-text';
    var small = document.createElement('small');
    small.textContent = playedToday ? "Today's pick · bonus collected" : "Today's pick · +20 XP bonus";
    var strong = document.createElement('strong');
    strong.textContent = game.title;
    text.appendChild(small);
    text.appendChild(strong);
    box.appendChild(text);

    var play = document.createElement('button');
    play.type = 'button';
    play.className = 'nxup-daily-play';
    play.textContent = playedToday ? 'Play again' : 'Play';
    play.setAttribute('aria-label', 'Play ' + game.title);
    play.addEventListener('click', function () { launchGameSafe(game.id); });
    box.appendChild(play);
  }

  function renderRail() {
    if (!railEl) return;
    var list = railEl.querySelector('.nxup-rail-list');
    if (!list) return;

    list.innerHTML = '';
    var history = Array.isArray(state.stats.history) ? state.stats.history : [];

    history.slice(0, 12).forEach(function (item) {
      if (!item || !item.id) return;
      var game = gameById(item.id);
      var title = (game && game.title) || item.title || String(item.id);
      var image = (game && game.image) || item.image || '';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nxup-rail-item';
      btn.title = 'Play ' + title;
      btn.setAttribute('aria-label', 'Play ' + title);

      if (image) {
        var img = document.createElement('img');
        img.src = image;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('error', function () {
          img.style.display = 'none';
          btn.insertBefore(fallback(title), btn.firstChild);
        });
        btn.appendChild(img);
      } else {
        btn.appendChild(fallback(title));
      }

      var label = document.createElement('span');
      label.textContent = title;
      btn.appendChild(label);

      btn.addEventListener('click', function () { launchGameSafe(item.id); });
      list.appendChild(btn);
    });

    updateRailVisibility();
  }

  function fallback(title) {
    var el = document.createElement('div');
    el.className = 'nxup-rail-fallback';
    el.textContent = String(title || '?').substring(0, 2).toUpperCase();
    return el;
  }

  function updateRailVisibility() {
    if (!railEl) return;
    var history = Array.isArray(state.stats.history) ? state.stats.history : [];
    var hero = document.getElementById('heroSection');
    var random = document.querySelector('.random-section');
    var homeVisible = !hero || hero.style.display !== 'none';
    var randomVisible = !random || random.style.display !== 'none';
    var show = (history.length > 0 || !!dailyPick()) && homeVisible && randomVisible;
    railEl.classList.toggle('nxup-visible', show);
  }

  /* ------------------------------------------------------------------ */
  /* Dialogs                                                             */
  /* ------------------------------------------------------------------ */
  var openDialogs = [];
  var bodyOverflowBefore = '';

  function lockBody(lock) {
    if (lock) {
      if (!openDialogs.length) {
        bodyOverflowBefore = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
    } else if (!openDialogs.length) {
      document.body.style.overflow = bodyOverflowBefore || '';
    }
  }

  function openDialog(el, focusTarget) {
    if (!el) return;
    if (openDialogs.indexOf(el) !== -1) return;
    el.classList.add('nxup-open');
    openDialogs.push(el);
    lockBody(true);
    var target = focusTarget || el.querySelector('input, button');
    if (target && typeof target.focus === 'function') {
      setTimeout(function () { try { target.focus(); } catch (e) {} }, 30);
    }
  }

  function closeDialog(el) {
    if (!el) return;
    el.classList.remove('nxup-open');
    var i = openDialogs.indexOf(el);
    if (i !== -1) openDialogs.splice(i, 1);
    lockBody(false);
  }

  function closeTopDialog() {
    if (!openDialogs.length) return false;
    closeDialog(openDialogs[openDialogs.length - 1]);
    return true;
  }

  function dialogShell(id, titleText, bodyHtml) {
    var modal = document.createElement('div');
    modal.className = 'nxup-modal';
    modal.id = id;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', titleText);
    modal.innerHTML = bodyHtml;
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeDialog(modal);
    });
    document.body.appendChild(modal);
    return modal;
  }

  /* ------------------------------------------------------------------ */
  /* Dashboard: stats, achievements, themes                              */
  /* ------------------------------------------------------------------ */
  var dashEl = null;
  var dashTab = 'overview';

  function buildDashboard() {
    if (document.getElementById('nxup-dash')) { dashEl = document.getElementById('nxup-dash'); return; }

    dashEl = dialogShell('nxup-dash', 'Your progress',
      '<div class="nxup-card">' +
        '<div class="nxup-head">' +
          '<h2>Your progress</h2>' +
          '<button type="button" class="nxup-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="nxup-tabs" role="tablist" aria-label="Progress sections">' +
          '<button type="button" class="nxup-tab nxup-active" data-tab="overview" role="tab">Overview</button>' +
          '<button type="button" class="nxup-tab" data-tab="achievements" role="tab">Achievements</button>' +
          '<button type="button" class="nxup-tab" data-tab="themes" role="tab">Themes</button>' +
        '</div>' +
        '<div class="nxup-body nxup-active" data-panel="overview"></div>' +
        '<div class="nxup-body" data-panel="achievements"></div>' +
        '<div class="nxup-body" data-panel="themes"></div>' +
      '</div>');

    dashEl.querySelector('.nxup-close').addEventListener('click', function () { closeDialog(dashEl); });

    var tabs = dashEl.querySelectorAll('.nxup-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function () {
        dashTab = this.getAttribute('data-tab');
        showDashTab(dashTab);
      });
    }

    renderDashboard();
    showDashTab(dashTab);
  }

  function showDashTab(name) {
    if (!dashEl) return;
    dashTab = name;
    var tabs = dashEl.querySelectorAll('.nxup-tab');
    for (var i = 0; i < tabs.length; i++) {
      var isActive = tabs[i].getAttribute('data-tab') === name;
      tabs[i].classList.toggle('nxup-active', isActive);
      tabs[i].setAttribute('aria-selected', isActive ? 'true' : 'false');
    }
    var panels = dashEl.querySelectorAll('.nxup-body[data-panel]');
    for (var j = 0; j < panels.length; j++) {
      panels[j].classList.toggle('nxup-active', panels[j].getAttribute('data-panel') === name);
    }
    if (name === 'achievements') setDockDot(false);
  }

  function openDashboard(tab) {
    if (!dashEl) buildDashboard();
    if (!dashEl) return;
    showDashTab(tab || dashTab || 'overview');
    if (dashTab === 'achievements') setDockDot(false);
    openDialog(dashEl, dashEl.querySelector('.nxup-close'));
  }

  function renderDashboardIfOpen() {
    if (dashEl && openDialogs.indexOf(dashEl) !== -1) renderDashboard();
  }

  function esc(text) {
    return String(text === undefined || text === null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatTime(ms) {
    ms = num(ms, 0);
    if (ms < 60000) return '—';
    var mins = Math.round(ms / 60000);
    if (mins < 60) return mins + 'm';
    var hours = Math.floor(mins / 60);
    var rest = mins % 60;
    return hours + 'h' + (rest ? ' ' + rest + 'm' : '');
  }

  function renderDashboard() {
    if (!dashEl) return;
    var info = levelInfo(state.xp);
    var st = state.stats;
    var unlocked = Object.keys(state.ach).length;
    var total = ACHIEVEMENTS.length;

    var overview = dashEl.querySelector('[data-panel="overview"]');
    if (overview) {
      var topGames = Object.keys(st.perGame).map(function (id) {
        var rec = st.perGame[id] || {};
        return {
          id: id,
          title: rec.title || (gameById(id) && gameById(id).title) || id,
          count: num(rec.count, 0),
          ms: num(rec.ms, 0)
        };
      }).sort(function (a, b) { return b.count - a.count; }).slice(0, 6);

      var max = topGames.reduce(function (m, g) { return Math.max(m, g.count); }, 1);

      var barsHtml = topGames.length
        ? topGames.map(function (g) {
            return '<div class="nxup-bar-row">' +
              '<span class="nxup-name" title="' + esc(g.title) + '">' + esc(g.title) + '</span>' +
              '<span class="nxup-bar-track"><span style="width:' + Math.max(6, Math.round((g.count / max) * 100)) + '%"></span></span>' +
              '<span class="nxup-bar-meta">' + g.count + '× · ' + formatTime(g.ms) + '</span>' +
            '</div>';
          }).join('')
        : '<p class="nxup-muted">No games yet. Launch one and it will show up here.</p>';

      overview.innerHTML =
        '<div class="nxup-hero">' +
          '<div class="nxup-hero-badge"><small>Level</small><strong>' + info.level + '</strong></div>' +
          '<div class="nxup-hero-main">' +
            '<h3>' + info.xp + ' XP total</h3>' +
            '<div class="nxup-progress"><span style="width:' + info.pct.toFixed(1) + '%"></span></div>' +
            '<div class="nxup-muted">' + (info.need ? info.need + ' XP to level ' + (info.level + 1) : 'Max level reached') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="nxup-stats">' +
          '<div class="nxup-stat"><b>' + st.launches + '</b><span>Games launched</span></div>' +
          '<div class="nxup-stat"><b>' + Object.keys(st.unique).length + '</b><span>Different games</span></div>' +
          '<div class="nxup-stat"><b>' + formatTime(st.playMs) + '</b><span>Time played</span></div>' +
          '<div class="nxup-stat"><b>' + st.favs + '</b><span>Favorites</span></div>' +
          '<div class="nxup-stat"><b>' + state.streak.count + '</b><span>Day streak</span></div>' +
          '<div class="nxup-stat"><b>' + st.bestStreak + '</b><span>Best streak</span></div>' +
          '<div class="nxup-stat"><b>' + unlocked + ' / ' + total + '</b><span>Achievements</span></div>' +
        '</div>' +
        '<h3 class="nxup-subhead">Most played</h3>' +
        '<div class="nxup-bars">' + barsHtml + '</div>';
    }

    var achPanel = dashEl.querySelector('[data-panel="achievements"]');
    if (achPanel) {
      var cards = ACHIEVEMENTS.map(function (a) {
        var unlockedAt = state.ach[a.id];
        var when = unlockedAt ? new Date(unlockedAt) : null;
        var dateText = when && !isNaN(when.getTime())
          ? when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          : '';
        return '<div class="nxup-ach' + (unlockedAt ? ' nxup-unlocked' : '') + '">' +
          '<span class="nxup-ach-icon" aria-hidden="true">' + a.icon + '</span>' +
          '<span class="nxup-ach-text">' +
            '<b>' + esc(a.title) + '</b>' +
            '<small>' + esc(a.desc) + '</small>' +
            '<em>' + (unlockedAt ? 'Unlocked ' + esc(dateText) : '+' + a.xp + ' XP · locked') + '</em>' +
          '</span>' +
        '</div>';
      }).join('');

      achPanel.innerHTML =
        '<p class="nxup-muted" style="margin-bottom:10px">' + unlocked + ' of ' + total + ' unlocked. They pop up while you browse.</p>' +
        '<div class="nxup-ach-grid">' + cards + '</div>';
    }

    var themePanel = dashEl.querySelector('[data-panel="themes"]');
    if (themePanel && !themePanel.dataset.built) {
      themePanel.dataset.built = '1';
      themePanel.innerHTML =
        '<p class="nxup-muted" style="margin-bottom:10px">Pick a colour for the site. It is saved in this browser.</p>' +
        '<div class="nxup-themes">' +
          Object.keys(THEMES).map(function (id) {
            var t = THEMES[id];
            return '<button type="button" class="nxup-theme' + (state.theme === id ? ' nxup-active' : '') + '" data-theme="' + id + '">' +
              '<span class="nxup-swatch" style="background:' + t.accent + '"></span>' + esc(t.name) +
            '</button>';
          }).join('') +
        '</div>' +
        '<p class="nxup-hint">Most of the site changes colour right away. Some inside-game screens and the built-in game player keep their own colours.</p>';

      var themeButtons = themePanel.querySelectorAll('.nxup-theme');
      for (var i = 0; i < themeButtons.length; i++) {
        themeButtons[i].addEventListener('click', function () {
          applyTheme(this.getAttribute('data-theme'));
        });
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Keyboard shortcuts sheet                                            */
  /* ------------------------------------------------------------------ */
  var shortcutsEl = null;

  function buildShortcuts() {
    if (document.getElementById('nxup-shortcuts')) { shortcutsEl = document.getElementById('nxup-shortcuts'); return; }

    var rows = [
      ['Ctrl / ⌘ + K', 'Search every game and run commands'],
      ['/', 'Jump to the search box'],
      ['Alt + R', 'Open a random game'],
      ['?', 'Show this shortcuts list'],
      ['Esc', 'Close any panel'],
      ['Enter / Space', 'Open the focused game card'],
      ['In a game: right-click Back To Home', 'Move the button anywhere'],
      ['In a game: Alt + H', 'Shrink Back To Home to a small icon']
    ];

    shortcutsEl = dialogShell('nxup-shortcuts', 'Keyboard shortcuts',
      '<div class="nxup-card">' +
        '<div class="nxup-head"><h2>Keyboard shortcuts</h2>' +
          '<button type="button" class="nxup-close" aria-label="Close">&times;</button></div>' +
        '<div class="nxup-body">' +
          '<div class="nxup-keys">' +
            rows.map(function (r) {
              return '<div class="nxup-key-row"><span class="nxup-kbd">' + esc(r[0]) + '</span><span>' + esc(r[1]) + '</span></div>';
            }).join('') +
          '</div>' +
          '<p class="nxup-hint">Tip: press Ctrl / ⌘ + K anywhere to search the whole library by typing a few letters.</p>' +
        '</div>' +
      '</div>');

    shortcutsEl.querySelector('.nxup-close').addEventListener('click', function () { closeDialog(shortcutsEl); });
  }

  function openShortcuts() {
    if (!shortcutsEl) buildShortcuts();
    if (!shortcutsEl) return;
    openDialog(shortcutsEl, shortcutsEl.querySelector('.nxup-close'));
    state.helpSeen = true;
    write(KEY.help, true);
  }

  /* ------------------------------------------------------------------ */
  /* Command palette                                                     */
  /* ------------------------------------------------------------------ */
  var paletteEl = null;
  var paletteInput = null;
  var paletteListEl = null;
  var paletteItems = [];
  var paletteIndex = 0;

  function buildPalette() {
    if (document.getElementById('nxup-palette-modal')) {
      paletteEl = document.getElementById('nxup-palette-modal');
      paletteInput = document.getElementById('nxup-palette-input');
      paletteListEl = document.getElementById('nxup-palette-list');
      return;
    }

    paletteEl = dialogShell('nxup-palette-modal', 'Search games and commands',
      '<div class="nxup-palette">' +
        '<input id="nxup-palette-input" type="text" role="combobox" aria-expanded="true" ' +
          'aria-controls="nxup-palette-list" aria-autocomplete="list" autocomplete="off" spellcheck="false" ' +
          'placeholder="Search games, or type a command…">' +
        '<div class="nxup-palette-list" id="nxup-palette-list" role="listbox" aria-label="Results"></div>' +
        '<div class="nxup-palette-foot">' +
          '<span><kbd class="nxup-kbd">↑</kbd><kbd class="nxup-kbd">↓</kbd> move</span>' +
          '<span><kbd class="nxup-kbd">Enter</kbd> open</span>' +
          '<span><kbd class="nxup-kbd">Esc</kbd> close</span>' +
        '</div>' +
      '</div>');

    paletteInput = document.getElementById('nxup-palette-input');
    paletteListEl = document.getElementById('nxup-palette-list');

    paletteInput.addEventListener('input', function () {
      renderPalette(paletteInput.value);
    });

    paletteInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        movePalette(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        movePalette(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        runPaletteSelection();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeDialog(paletteEl);
      }
    });
  }

  function paletteActions() {
    return [
      { type: 'action', icon: '🎲', title: 'Random game', sub: 'Play something unexpected', run: function () { randomGame(); } },
      { type: 'action', icon: '📊', title: 'Open my stats', sub: 'Games played, time played, favourites', run: function () { openDashboard('overview'); } },
      { type: 'action', icon: '🏆', title: 'Open achievements', sub: 'See what you have unlocked', run: function () { openDashboard('achievements'); } },
      { type: 'action', icon: '🎨', title: 'Change colour theme', sub: 'Purple, cyan, crimson, emerald, gold, mono', run: function () { openDashboard('themes'); } },
      { type: 'action', icon: '⌨️', title: 'Keyboard shortcuts', sub: 'Every shortcut in one place', run: function () { openShortcuts(); } },
      { type: 'action', icon: '⭐', title: 'Go to favorites', sub: 'Your starred games', run: function () { var b = document.getElementById('nav-favorites'); if (b) b.click(); } },
      { type: 'action', icon: '🕹️', title: 'Browse all games', sub: 'Open the full library', run: function () { var b = document.getElementById('nav-games'); if (b) b.click(); } }
    ];
  }

  function fuzzyScore(query, text) {
    if (!query) return 1;
    var q = query.toLowerCase();
    var t = String(text || '').toLowerCase();
    if (!t) return 0;
    if (t === q) return 120;
    if (t.indexOf(q) === 0) return 100;
    var wordStart = t.indexOf(' ' + q);
    if (wordStart !== -1) return 90;
    if (t.indexOf(q) !== -1) return 70;
    var pos = 0;
    var hits = 0;
    for (var i = 0; i < q.length; i++) {
      var at = t.indexOf(q.charAt(i), pos);
      if (at === -1) return 0;
      pos = at + 1;
      hits++;
    }
    return 20 + Math.min(20, hits);
  }

  function buildResults(query) {
    var q = String(query || '').trim();
    var results = [];

    var actions = paletteActions();
    for (var i = 0; i < actions.length; i++) {
      var a = actions[i];
      var s = fuzzyScore(q, a.title + ' ' + a.sub);
      if (q && !s) continue;
      results.push({ kind: 'action', score: s + (q ? 0 : 30), action: a });
    }

    var games = gameCache.list.length ? gameCache.list : refreshGames().list;
    var gameHits = [];
    for (var j = 0; j < games.length; j++) {
      var g = games[j];
      var gs = fuzzyScore(q, g.title);
      if (!gs && q) gs = fuzzyScore(q, g.desc) * 0.4;
      if (!gs) continue;
      gameHits.push({ kind: 'game', score: gs, game: g });
    }
    gameHits.sort(function (a, b) { return b.score - a.score; });

    if (!q) {
      var recent = (Array.isArray(state.stats.history) ? state.stats.history : []).slice(0, 4).map(function (h) {
        return { kind: 'game', score: 1, game: gameById(h.id) || { id: h.id, title: h.title, image: h.image, desc: '' } };
      });
      results = recent.concat(results);
    } else {
      results = gameHits.slice(0, 10).concat(results);
    }

    return results.slice(0, 14);
  }

  function renderPalette(query) {
    if (!paletteListEl) return;
    paletteItems = buildResults(query);
    paletteIndex = 0;

    if (!paletteItems.length) {
      paletteListEl.innerHTML = '<div class="nxup-empty">No match for “' + esc(query) + '”.</div>';
      return;
    }

    paletteListEl.innerHTML = paletteItems.map(function (item, i) {
      if (item.kind === 'game') {
        var thumb = item.game.image
          ? '<img class="nxup-result-thumb" src="' + esc(item.game.image) + '" alt="">'
          : '<span class="nxup-result-icon">' + esc(String(item.game.title || '?').substring(0, 2).toUpperCase()) + '</span>';
        return '<div class="nxup-result' + (i === 0 ? ' nxup-sel' : '') + '" role="option" aria-selected="' + (i === 0) + '" data-index="' + i + '">' +
          thumb +
          '<span class="nxup-result-text"><span class="nxup-result-title">' + esc(item.game.title) + '</span>' +
          '<span class="nxup-result-sub">' + esc(String(item.game.desc || 'Game').substring(0, 80)) + '</span></span>' +
          '<span class="nxup-result-tag">Play</span>' +
        '</div>';
      }
      return '<div class="nxup-result' + (i === 0 ? ' nxup-sel' : '') + '" role="option" aria-selected="' + (i === 0) + '" data-index="' + i + '">' +
        '<span class="nxup-result-icon">' + esc(item.action.icon) + '</span>' +
        '<span class="nxup-result-text"><span class="nxup-result-title">' + esc(item.action.title) + '</span>' +
        '<span class="nxup-result-sub">' + esc(item.action.sub) + '</span></span>' +
        '<span class="nxup-result-tag">Action</span>' +
      '</div>';
    }).join('');

    var rows = paletteListEl.querySelectorAll('.nxup-result');
    for (var i = 0; i < rows.length; i++) {
      rows[i].addEventListener('click', function () {
        paletteIndex = Number(this.getAttribute('data-index')) || 0;
        runPaletteSelection();
      });
      rows[i].addEventListener('mousemove', function () {
        var idx = Number(this.getAttribute('data-index')) || 0;
        if (idx !== paletteIndex) setPaletteIndex(idx, false);
      });
    }
  }

  function setPaletteIndex(index, scroll) {
    if (!paletteItems.length) return;
    paletteIndex = (index + paletteItems.length) % paletteItems.length;
    var rows = paletteListEl.querySelectorAll('.nxup-result');
    for (var i = 0; i < rows.length; i++) {
      var active = i === paletteIndex;
      rows[i].classList.toggle('nxup-sel', active);
      rows[i].setAttribute('aria-selected', active ? 'true' : 'false');
      if (active && scroll !== false && typeof rows[i].scrollIntoView === 'function') {
        rows[i].scrollIntoView({ block: 'nearest' });
      }
    }
  }

  function movePalette(delta) {
    setPaletteIndex(paletteIndex + delta, true);
  }

  function runPaletteSelection() {
    var item = paletteItems[paletteIndex];
    if (!item) return;
    closeDialog(paletteEl);
    setTimeout(function () {
      if (item.kind === 'game') launchGameSafe(item.game.id);
      else if (item.action && typeof item.action.run === 'function') item.action.run();
    }, 20);
  }

  function openPalette() {
    if (!paletteEl) buildPalette();
    if (!paletteEl) return;
    openDialogs.slice().forEach(function (el) {
      if (el !== paletteEl) closeDialog(el);
    });
    refreshGames();
    if (paletteInput) paletteInput.value = '';
    renderPalette('');
    openDialog(paletteEl, paletteInput);
    state.stats.usedPalette = true;
    saveStats();
    checkAchievements();
  }

  /* ------------------------------------------------------------------ */
  /* Global keyboard                                                     */
  /* ------------------------------------------------------------------ */
  function isTypingTarget(el) {
    if (!el || !el.tagName) return false;
    var tag = el.tagName.toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable === true;
  }

  function wireKeyboard() {
    document.addEventListener('keydown', function (e) {
      var typing = isTypingTarget(e.target);

      if ((e.ctrlKey || e.metaKey) && !e.altKey && String(e.key).toLowerCase() === 'k') {
        e.preventDefault();
        if (paletteEl && openDialogs.indexOf(paletteEl) !== -1) closeDialog(paletteEl);
        else openPalette();
        return;
      }

      if (typing) return;

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        openShortcuts();
        return;
      }

      if (e.key === '/') {
        var search = document.getElementById('searchBar');
        if (search) {
          e.preventDefault();
          search.focus();
          try { search.select(); } catch (err) {}
        }
        return;
      }

      if (e.altKey && !e.ctrlKey && !e.metaKey && String(e.key).toLowerCase() === 'r') {
        e.preventDefault();
        randomGame();
        return;
      }

      if (e.key === 'Escape') {
        if (closeTopDialog()) e.preventDefault();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Stylesheet guard: load the CSS even if the <link> was forgotten      */
  /* ------------------------------------------------------------------ */
  function ensureStyles() {
    if (document.querySelector('link[data-nxup-style]')) return;
    var existing = document.querySelector('link[href*="upgrade-pack.css"]');
    if (existing) {
      existing.setAttribute('data-nxup-style', '');
      return;
    }
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'CSS/upgrade-pack.css';
    link.setAttribute('data-nxup-style', '');
    document.head.appendChild(link);
  }

  /* ------------------------------------------------------------------ */
  /* Init                                                                */
  /* ------------------------------------------------------------------ */
  function boot() {
    if (document.getElementById('nxup-dock')) return;

    ensureStyles();
    refreshGames();

    // 1. Restore saved theme before anything is painted twice.
    applyTheme(state.theme, { silent: true });

    // 2. Credit the last play session, then daily streak + favorites.
    try { creditPlayTime(); } catch (e) {}
    try { syncStreak(); } catch (e) {}
    try { syncFavorites(); } catch (e) {}

    // 3. UI
    buildLevelChip();
    buildDock();
    buildRail();
    buildDashboard();
    buildShortcuts();
    buildPalette();
    wireBackToTop();
    wireKeyboard();

    // 4. Remember launches (main.js defines launchGame as a global function).
    var tries = 0;
    (function waitForLaunch() {
      if (hookLaunch() || tries++ > 40) return;
      setTimeout(waitForLaunch, 250);
    })();

    // 5. Favorites can change while the page is open (right-click menu).
    setInterval(function () {
      if (document.hidden) return;
      try { syncFavorites(); } catch (e) {}
    }, 3000);
    window.addEventListener('focus', function () {
      try { syncFavorites(); } catch (e) {}
    });

    // 6. First-time visitors get a small hello instead of a silent feature.
    if (!state.helpSeen) {
      setTimeout(function () {
        toast('👋', 'New here? Press Ctrl + K', 'Search any game instantly. Press ? for shortcuts.', '');
      }, 1600);
    }

    checkAchievements();
    updateLevelChip();
    updateRailVisibility();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Small public handle so future scripts / the console can poke at it.
  window.NXUpgrade = {
    version: '1.0.0',
    openPalette: openPalette,
    openDashboard: openDashboard,
    openShortcuts: openShortcuts,
    applyTheme: applyTheme,
    state: state,
    achievements: ACHIEVEMENTS
  };
})();

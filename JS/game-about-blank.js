/* Launch games in a top-level about:blank tab.
   Some managed browsers only allow iframes when the top document is about:blank.
   We open the blank tab, capture main.js's existing game shell instead of
   letting it replace the home page, then rebuild the shell with DOM nodes
   (document.write would give the tab the opener's URL again). */
(function () {
  'use strict';

  if (window.__nxGameAboutBlank) return;
  window.__nxGameAboutBlank = true;

  /* These games must run as a real top-level page, not in the popup shell. */
  var DIRECT_GAMES = {
    undead_corridor: '/Games/undead-corridor/index.html?direct=2'
  };

  /* Loading-screen controller (v2).
     The shell's inline loader hides the overlay on the iframe's HTML load
     event, which is long before a Unity/WebGL game is playable. This controller
     takes over the live overlay after the shell script has run, keeps it up
     until the game frame is actually ready, drives a real ETA from the game's
     own progress (or the previous load time), and rotates the fun facts. */
  function installLoadingController(popup, doc) {
    if (!popup || !doc) return;
    var overlay = doc.getElementById('intro-overlay');
    var frame = doc.getElementById('nx-game-frame');
    if (!overlay || !frame) return;

    function swap(el) {
      if (!el || !el.parentNode) return el;
      var clone = el.cloneNode(true);
      el.parentNode.replaceChild(clone, el);
      return clone;
    }
    var fill = swap(doc.getElementById('prog-fill'));
    var mbEl = swap(doc.getElementById('prog-mb'));
    var pctEl = swap(doc.getElementById('prog-pct'));
    var etaEl = swap(doc.getElementById('prog-eta'));
    var factEl = swap(doc.getElementById('fun-fact'));

    var nowMs = function () {
      try { return popup.performance.now(); } catch (e) { return Date.now(); }
    };
    var started = nowMs();
    var ready = false;
    var finished = false;
    var phase = 'Connecting…';
    var currentPct = null;
    var lastPctAt = started;
    var maxBytes = 0;
    var lastByteAt = started;
    var pctSamples = [];
    var byteSamples = [];
    var consecutive = 0;
    var frameLoaded = false;
    var frameLoadAt = 0;
    var crossSettleStarted = false;
    var sameOrigin = null;
    var modernUnity = false;
    var statsKey = '';
    var prior = null;

    var STATS_KEY = 'nx_load_stats_v2';
    var stats = {};
    try { stats = JSON.parse(localStorage.getItem(STATS_KEY) || '{}') || {}; } catch (e) { stats = {}; }

    function computeSameOrigin() {
      try {
        var s = frame.src;
        if (!s || s === 'about:blank') return null;
        return new URL(s, location.href).origin === location.origin;
      } catch (e) { return null; }
    }
    function ensureKey() {
      if (statsKey) return;
      try {
        var u = new URL(frame.src, location.href);
        if (!u.href || u.href.indexOf('about:blank') === 0) return;
        statsKey = u.origin + u.pathname;
        prior = stats[statsKey] || null;
      } catch (e) {}
    }

    /* ---------- fun facts ---------- */
    var FACTS = [
      "The first browser game is often credited to 1990s Java applets — no App Store required.",
      "2048 was made in a weekend and still gets millions of plays.",
      "Many 'HTML5 games' are just one index.html and a pile of JS — like this one.",
      "Chromebooks hate huge Unity WebGL builds. Patience is a skill unlock.",
      "about:blank is empty on purpose — it is a blank canvas for cloaked launches.",
      "Your download speed is the real final boss right now.",
      "Slope is basically endless falling with extra steps.",
      "If a game is over 50 MB, grab a snack. We will wait.",
      "Fun factception: this fun fact is loading while the game loads.",
      "GitHub Pages has no loading bar API — we built our own.",
      "The Nx logo is not a Windows error. Probably.",
      "Unblocked does not mean instant. Physics still applies to bandwidth."
    ];
    var lastFact = '';
    try { lastFact = localStorage.getItem('nx_last_fact_v2') || ''; } catch (e) {}
    for (var fi = FACTS.length - 1; fi > 0; fi--) {
      var fj = Math.floor(Math.random() * (fi + 1));
      var ft = FACTS[fi]; FACTS[fi] = FACTS[fj]; FACTS[fj] = ft;
    }
    if (FACTS.length > 1 && FACTS[0] === lastFact) {
      var fswap = 1 + Math.floor(Math.random() * (FACTS.length - 1));
      var ftmp = FACTS[0]; FACTS[0] = FACTS[fswap]; FACTS[fswap] = ftmp;
    }
    var factIdx = 0;
    var factTimer = null;
    function showFact() {
      if (!factEl) return;
      var text = FACTS[factIdx % FACTS.length];
      /* Remember the first fact of this launch only, so the next launch
         always opens on a different one even after several rotations. */
      if (factIdx === 0) {
        lastFact = text;
        try { localStorage.setItem('nx_last_fact_v2', text); } catch (e) {}
      }
      factEl.style.opacity = '1';
      factEl.innerHTML = '<strong>Fun fact:</strong> ' + text;
      factIdx++;
    }
    if (factEl) {
      factEl.style.opacity = '1';
      showFact();
      factTimer = popup.setInterval(function () {
        factEl.style.opacity = '0';
        popup.setTimeout(function () { showFact(); }, 280);
      }, 4500);
    }

    /* ---------- readiness + progress ---------- */
    function visible(el, win) {
      try {
        var cs = win.getComputedStyle(el);
        if (!cs || cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
        var r = el.getBoundingClientRect();
        return r.width > 2 && r.height > 2;
      } catch (e) { return false; }
    }
    function unityProgress(d) {
      try {
        var bar = d.querySelector('#unity-progress-bar-full');
        if (!bar) {
          /* Unity 4.x template: .progress > .full width is the percentage. */
          var u4full = d.querySelector('.progress .full');
          if (u4full) {
            var track4 = u4full.parentElement;
            var bw4 = u4full.getBoundingClientRect().width;
            var tw4 = track4 ? track4.getBoundingClientRect().width : 0;
            if (tw4 > 0) return Math.max(0, Math.min(99.5, (bw4 / tw4) * 100));
            var w4 = parseFloat(u4full.style.width || '');
            if (isFinite(w4) && w4 >= 0) return Math.max(0, Math.min(99.5, w4));
          }
          /* Custom loaders that print "102.00 / 160.54 MB" (Brotato). */
          var status = d.querySelector('#status');
          if (status) {
            var m = /(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*MB/i.exec(status.textContent || '');
            if (m) {
              var loaded = parseFloat(m[1]), total = parseFloat(m[2]);
              if (total > 0 && isFinite(loaded)) return Math.max(0, Math.min(99.5, loaded / total * 100));
            }
          }
          return null;
        }
        var w = parseFloat(bar.style.width || '');
        if (!(w >= 0)) {
          var track = bar.parentElement;
          var bw = bar.getBoundingClientRect().width;
          var tw = track ? track.getBoundingClientRect().width : 0;
          w = tw > 0 ? (bw / tw) * 100 : 0;
        }
        if (!isFinite(w) || w < 0) return null;
        return Math.max(0, Math.min(99.5, w));
      } catch (e) { return null; }
    }
    function readBytes() {
      try {
        var win = frame.contentWindow;
        var perf = win.performance;
        if (!perf || !perf.getEntriesByType) return 0;
        var total = 0;
        var res = perf.getEntriesByType('resource');
        for (var i = 0; i < res.length; i++) total += (res[i].transferSize || res[i].encodedBodySize || 0);
        var nav = perf.getEntriesByType('navigation');
        if (nav && nav[0]) total += (nav[0].transferSize || nav[0].encodedBodySize || 0);
        return total;
      } catch (e) { return 0; }
    }
    function blockingLoader(d, win) {
      try {
        var vw = win.innerWidth || d.documentElement.clientWidth || 0;
        var vh = win.innerHeight || d.documentElement.clientHeight || 0;
        var unityBar = d.querySelector('#unity-loading-bar');
        if (unityBar && visible(unityBar, win)) return true;

        /* Unity 4.x templates (Slope and friends) use a .progress bar plus a
           .logo in the same container, and hide both when loading completes. */
        var u4 = d.querySelector('.progress');
        var u4logo = d.querySelector('.logo');
        if (u4 && u4logo && u4.parentElement === u4logo.parentElement && (visible(u4, win) || visible(u4logo, win))) return true;

        var nodes = d.querySelectorAll('[id*="loading" i],[class*="loading" i],[id*="loader" i],[class*="loader" i],[id*="preload" i],[class*="preload" i],[id*="splash" i],[class*="splash" i]');
        for (var i = 0; i < nodes.length; i++) {
          var el = nodes[i];
          if (!visible(el, win)) continue;
          var r = el.getBoundingClientRect();
          if (vw && vh && r.width >= vw * 0.45 && r.height >= vh * 0.45) return true;
        }

        var bars = d.querySelectorAll('[role="progressbar"]');
        for (var b = 0; b < bars.length; b++) {
          if (!visible(bars[b], win)) continue;
          if (vw && bars[b].getBoundingClientRect().width >= vw * 0.3) return true;
        }

        /* Custom loaders often expose only a status line (Brotato's #status). */
        var labels = d.querySelectorAll('[id*="status" i],[class*="status" i],[id*="loading" i],[class*="loading" i],[id*="preload" i],[class*="preload" i],[id*="splash" i],[class*="splash" i]');
        for (var l = 0; l < labels.length; l++) {
          var lab = labels[l];
          if (!visible(lab, win)) continue;
          var txt = (lab.textContent || '').replace(/\s+/g, ' ').trim();
          if (txt && txt.length < 120 && /(loading|downloading|preparing|initializing|compiling|please wait|starting up)/i.test(txt) && !/(complete|ready|loaded|finished)/i.test(txt)) {
            if (vw && lab.getBoundingClientRect().width >= vw * 0.25) return true;
          }
        }
      } catch (e) {}
      return false;
    }
    function isReady(d, t) {
      try {
        if (!d || d.readyState !== 'complete') return false;
        var win = d.defaultView || frame.contentWindow;
        if (!win) return false;
        var canvas = d.querySelector('canvas');
        if (canvas && (!canvas.width || !canvas.height)) return false;
        if (blockingLoader(d, win)) return false;
        /* Give plain HTML5 pages a moment after their load event before
           dropping the overlay, instead of hiding on the first empty body. */
        var unityish = d.querySelector('#unity-loading-bar, #unity-progress-bar-full, .progress, .logo');
        if (!unityish && frameLoadAt && t - frameLoadAt < 1200) return false;
        return !!canvas || !!d.body;
      } catch (e) { return false; }
    }

    function trackPct(p, t) {
      if (p == null) return;
      if (currentPct == null || p > currentPct + 0.05) lastPctAt = t;
      currentPct = Math.max(currentPct || 0, p);
      pctSamples.push({ t: t, v: currentPct });
      if (pctSamples.length > 80) pctSamples.shift();
    }
    function trackBytes(b, t) {
      if (!b || b < 1) return;
      if (b > maxBytes) { maxBytes = b; lastByteAt = t; }
      byteSamples.push({ t: t, v: b });
      if (byteSamples.length > 40) byteSamples.shift();
    }
    function fmtEta(sec) {
      if (!isFinite(sec) || sec < 0) return '--';
      if (sec < 1.5) return '<2s';
      if (sec < 60) return Math.ceil(sec) + 's';
      var m = Math.floor(sec / 60);
      var s = Math.ceil(sec % 60);
      return m + 'm ' + s + 's';
    }
    function etaSeconds(t) {
      if (ready) return 0;
      var elapsed = (t - started) / 1000;
      /* The previous completed load for this game is the most honest clock:
         a cached Unity build can hit 90% in two seconds and then spend
         several more compiling. Progress is only a fallback while we have
         no history, or once the previous duration has run out. */
      var base = prior && prior.ms ? prior.ms / 1000 - elapsed : null;
      var stalled = currentPct != null && currentPct >= 80 && (t - lastPctAt) > 2000;
      var p = null;

      if (currentPct != null && currentPct > 0.5) {
        if (currentPct >= 95) {
          p = 2;
        } else {
          var cutoff = t - 12000, first = null, last = null;
          for (var i = 0; i < pctSamples.length; i++) {
            var s = pctSamples[i];
            if (s.t >= cutoff) { if (!first) first = s; last = s; }
          }
          if (first && last && last.t - first.t > 900 && last.v > first.v + 0.1) {
            var rate = (last.v - first.v) / ((last.t - first.t) / 1000);
            if (rate > 0.02) p = Math.max(0.5, (100 - currentPct) / rate);
          }
          if (p == null && currentPct > 2) {
            p = Math.max(0.5, elapsed * (100 - currentPct) / currentPct);
          }
        }
        if (stalled) p = null;
      }

      if (p == null && !stalled && prior && prior.bytes > 1048576 && maxBytes > 0) {
        var total = Math.max(prior.bytes, maxBytes);
        var rem = total - maxBytes;
        if (rem > 0) {
          var bcut = t - 12000, bf = null, bl = null;
          for (var j = 0; j < byteSamples.length; j++) {
            var bs = byteSamples[j];
            if (bs.t >= bcut) { if (!bf) bf = bs; bl = bs; }
          }
          if (bf && bl && bl.t - bf.t > 900 && bl.v > bf.v) {
            var brate = (bl.v - bf.v) / ((bl.t - bf.t) / 1000);
            if (brate > 2000) p = Math.max(0.5, rem / brate);
          }
          if (p == null && elapsed > 2) p = Math.max(0.5, elapsed * rem / maxBytes);
        }
      }

      /* Unity's bar sits near 90% while it compiles. Without a previous
         duration, reserve a short finishing window instead of claiming 2s. */
      if (p != null && !stalled && currentPct != null && currentPct >= 80 && currentPct < 98) {
        var tail = Math.max(3, Math.min(8, ((lastPctAt - started) / 1000) * 0.9));
        p = Math.max(p, tail);
      }

      /* First-ever modern Unity load: the bar hits 90% long before the build
         finishes compiling. Scale a conservative estimate by how much was
         downloaded instead of promising 3 seconds and missing by 10+. */
      if (!prior && modernUnity && currentPct != null && currentPct >= 80) {
        var dlNow = Math.max(0.5, (lastByteAt - started) / 1000);
        var mbNow = maxBytes / 1048576;
        var firstFloor = mbNow > 1 ? Math.min(15, Math.max(5, mbNow * 0.5 + 3)) : Math.min(15, Math.max(6, dlNow * 6));
        p = Math.max(p || 0, firstFloor);
        stalled = false;
      }

      if (base != null) {
        if (base > 0.8) return base;
        if (p != null && !stalled) return Math.max(2, p);
        return 2;
      }
      /* First ever load: the download just finished, so use how long the
         bytes took as a conservative estimate for the compile tail. */
      if (stalled && currentPct != null && currentPct >= 80) {
        var dl = Math.max(0, (lastByteAt - started) / 1000);
        return Math.max(3, Math.min(12, dl * 2));
      }
      if (p != null) {
        if (elapsed < 2 && p < 4) return null;
        return Math.max(0.5, p);
      }
      return null;
    }
    function fraction(t) {
      if (ready) return 100;
      if (currentPct != null) return Math.min(99, currentPct);
      if (prior && prior.bytes > 1048576 && maxBytes > 0) return Math.min(95, maxBytes / prior.bytes * 100);
      return null;
    }
    function render() {
      if (finished) return;
      var t = nowMs();
      var frac = fraction(t);
      if (fill) fill.style.width = (frac == null ? Math.min(90, (t - started) / 500) : frac) + '%';
      if (pctEl) pctEl.textContent = ready ? '100%' : (frac == null ? '…' : Math.floor(frac) + '%');
      if (mbEl) {
        if (ready) mbEl.textContent = 'Ready';
        else if (maxBytes > 0 && prior && prior.bytes > 0) mbEl.textContent = (maxBytes / 1048576).toFixed(1) + ' / ' + (Math.max(prior.bytes, maxBytes) / 1048576).toFixed(1) + ' MB';
        else mbEl.textContent = phase;
      }
      if (etaEl) {
        if (ready) etaEl.textContent = 'Done';
        else {
          var e = etaSeconds(t);
          etaEl.textContent = e == null ? 'ETA calculating…' : 'ETA ' + fmtEta(e);
        }
      }
    }

    /* The shell hides the overlay on iframe load; veto that until we are ready. */
    var mo = null;
    try {
      mo = new popup.MutationObserver(function () {
        if (!ready && overlay.classList.contains('hide')) overlay.classList.remove('hide');
      });
      mo.observe(overlay, { attributes: true, attributeFilter: ['class'] });
    } catch (e) {}
    overlay.classList.remove('hide');

    function saveStats(durMs) {
      try {
        ensureKey();
        if (!statsKey) return;
        var prev = stats[statsKey] || {};
        var dur = Math.max(1, durMs);
        stats[statsKey] = {
          ms: prev.ms ? Math.round(prev.ms * 0.65 + dur * 0.35) : Math.round(dur),
          bytes: Math.max(prev.bytes || 0, maxBytes || 0),
          at: Date.now()
        };
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
      } catch (e) {}
    }
    function finishWhenReady(t) {
      if (ready) return;
      ready = true;
      if (mo) { try { mo.disconnect(); } catch (e) {} }
      if (factTimer) { try { popup.clearInterval(factTimer); } catch (e) {} }
      currentPct = 100;
      render();
      /* Modern Unity draws its own splash/advice screen after the loader
         disappears; keep our overlay a little longer so the first thing the
         player sees is the actual menu, not another loading screen. */
      var settle = 600;
      try {
        var settleDoc = frame.contentDocument;
        if (settleDoc) {
          if (settleDoc.querySelector('#unity-loading-bar')) settle = 3000;
          else if (!settleDoc.querySelector('#unity-progress-bar-full, .progress, .logo')) settle = 2200;
        }
      } catch (e) { settle = 2200; }
      popup.setTimeout(function () {
        overlay.classList.add('hide');
        finished = true;
        saveStats(nowMs() - started);
        if (pollTimer) { try { popup.clearInterval(pollTimer); } catch (e) {} }
      }, settle);
    }
    function startCrossSettle() {
      if (crossSettleStarted) return;
      crossSettleStarted = true;
      ensureKey();
      var wait = prior && prior.ms ? Math.min(20000, Math.max(5000, prior.ms * 0.9)) : 5000;
      popup.setTimeout(function () { finishWhenReady(nowMs()); }, wait);
    }

    frame.addEventListener('load', function () {
      frameLoaded = true;
      frameLoadAt = nowMs();
      var so = computeSameOrigin();
      if (so === false) { phase = 'Starting game…'; startCrossSettle(); }
      else { phase = 'Starting game…'; }
    });

    var pollTimer = popup.setInterval(function () {
      if (finished) return;
      var t = nowMs();
      ensureKey();
      var so = computeSameOrigin();
      if (so === false) {
        sameOrigin = false;
        if (frameLoaded || (t - started) > 6000) startCrossSettle();
      } else if (so === true) {
        sameOrigin = true;
        var d = null;
        try { d = frame.contentDocument; } catch (e) { d = null; }
        if (d) {
          if (d.readyState === 'complete') {
            if (d.querySelector('#unity-loading-bar')) modernUnity = true;
            var p = unityProgress(d);
            if (p != null) trackPct(p, t);
            var b = readBytes();
            if (b > 0) trackBytes(b, t);
            if (isReady(d, t)) {
              consecutive++;
              if (consecutive >= 3) finishWhenReady(t);
            } else {
              consecutive = 0;
            }
          }
        } else if (frameLoaded && t - started > 2500) {
          /* Same-origin URL but an opaque document (sandbox/CSP). */
          startCrossSettle();
        }
      }
      render();
      if (!ready && t - started > 100000) {
        overlay.classList.add('hide');
        finished = true;
        if (pollTimer) { try { popup.clearInterval(pollTimer); } catch (e) {} }
        if (factTimer) { try { popup.clearInterval(factTimer); } catch (e) {} }
        if (mo) { try { mo.disconnect(); } catch (e) {} }
      }
    }, 350);

    render();
  }

  function renderShell(popup, popupDoc, shell) {
    var parsed = new DOMParser().parseFromString(shell, 'text/html');
    popupDoc.title = parsed.title || 'Game';

    var i;
    for (i = 0; i < parsed.head.childNodes.length; i++) {
      var headNode = parsed.head.childNodes[i];
      if (headNode.nodeType === 1 || headNode.nodeType === 3) {
        popupDoc.head.appendChild(popupDoc.importNode(headNode, true));
      }
    }

    var scripts = [];
    for (i = 0; i < parsed.body.childNodes.length; i++) {
      var bodyNode = parsed.body.childNodes[i];
      if (bodyNode.nodeType === 1 && bodyNode.tagName === 'SCRIPT') {
        scripts.push(bodyNode.textContent);
        continue;
      }
      popupDoc.body.appendChild(popupDoc.importNode(bodyNode, true));
    }

    /* The back button normally replaces this tab with the home page. Since the
       game lives in its own tab, closing it returns to the home page already
       open behind it. */
    popupDoc.addEventListener('click', function (event) {
      var target = event.target && event.target.closest
        ? event.target.closest('#nx-back-btn, #err-home')
        : null;
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      try { popup.close(); } catch (e) {}
    }, true);

    for (i = 0; i < scripts.length; i++) {
      var script = popupDoc.createElement('script');
      script.textContent = scripts[i];
      popupDoc.body.appendChild(script);
    }

    try { installLoadingController(popup, popupDoc); } catch (e) {}

    try { popup.focus(); } catch (e) {}
  }

  function directSrc(gameId) {
    var game = null;
    try {
      if (typeof _0xData !== 'undefined' && Array.isArray(_0xData)) {
        game = _0xData.find(function (g) { return g && String(g.id) === String(gameId); });
      }
    } catch (e) {}
    if (!game || !game.url) return null;
    var raw = String(game.url);
    if (/^https?:\/\//i.test(raw)) return raw;
    var root = (location.origin || 'https://glaxyias.github.io').replace(/\/$/, '') + '/';
    return root + raw.replace(/^\.\.\//, '').replace(/^\//, '');
  }

  function install() {
    if (typeof window.launchGame !== 'function') return false;
    if (window.launchGame.__nxGameAboutBlank) return true;

    var original = window.launchGame;

    window.launchGame = function (gameId) {
      if (DIRECT_GAMES[String(gameId)]) {
        window.location.href = (location.origin || 'https://glaxyias.github.io') + DIRECT_GAMES[String(gameId)];
        return;
      }

      var useIframe = true;
      try {
        useIframe = window.localStorage.getItem('nx_use_iframe') !== 'false';
      } catch (e) {}

      if (!useIframe) return original.apply(this, arguments);

      var popup = null;
      try {
        popup = window.open('about:blank', '_blank');
      } catch (e) {}
      if (!popup || !popup.document) {
        try { if (popup) popup.close(); } catch (e) {}
        var direct = directSrc(gameId);
        if (direct) { window.location.assign(direct); return; }
        return original.apply(this, arguments);
      }

      var popupDoc;
      try {
        popupDoc = popup.document;
      } catch (e) {
        try { popup.close(); } catch (err) {}
        return original.apply(this, arguments);
      }

      var shell = '';
      var wrote = false;
      var doc = document;
      var nativeOpen = doc.open;
      var nativeWrite = doc.write;
      var nativeClose = doc.close;
      var nativeClearInterval = window.clearInterval;
      var nativeClearTimeout = window.clearTimeout;

      function restore() {
        doc.open = nativeOpen;
        doc.write = nativeWrite;
        doc.close = nativeClose;
        window.clearInterval = nativeClearInterval;
        window.clearTimeout = nativeClearTimeout;
      }

      try {
        doc.open = function () { return doc; };
        doc.write = function (chunk) {
          wrote = true;
          shell += String(chunk);
        };
        doc.close = function () {};
        /* The shell normally clears every timer on the old page because that
           page was being replaced. The home page stays open now, so keep its
           clock and other timers alive. */
        window.clearInterval = function () {};
        window.clearTimeout = function () {};
        original.call(this, gameId);
      } catch (e) {
        restore();
        try { popup.close(); } catch (err) {}
        return;
      }
      restore();

      if (!wrote || !shell) {
        try { popup.close(); } catch (e) {}
        return;
      }

      try {
        renderShell(popup, popupDoc, shell);
      } catch (e) {
        try { popup.close(); } catch (err) {}
      }
    };

    window.launchGame.__nxGameAboutBlank = true;
    return true;
  }

  if (!install()) {
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      if (install() || tries > 100) clearInterval(timer);
    }, 50);
  }
})();

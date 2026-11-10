/*
 * Null X - Terms of Service gate
 * ---------------------------------------------------------------------------
 * Blocks the page with the full Terms of Service until the visitor has
 * scrolled all the way to the bottom and pressed "I agree".
 *
 * - The terms themselves are read from TOS/TOS.html (single source of truth),
 *   so editing that page updates the gate everywhere.
 * - Acceptance is remembered in localStorage, so the gate appears once.
 * - Bump TOS_VERSION below whenever the terms change; everyone is then asked
 *   to read and accept the new version again.
 * - Load on any page with: <script src=".../JS/tos-gate.js"></script>
 */
(function () {
  'use strict';

  if (window.__nxTosGateLoaded) return;
  window.__nxTosGateLoaded = true;

  /* Bump this when TOS/TOS.html changes. */
  var TOS_VERSION = '1';

  var ACCEPT_KEY = 'nullx_tos_' + TOS_VERSION;
  /* Older gate used a checkbox and wrote these; honour them once. */
  var LEGACY_KEYS = ['nullx_tos_ack', 'nullx_tos_v1_guest'];
  var LEGACY_PREFIX = 'nullx_tos_v1_';
  var BOTTOM_SLACK = 24; /* px of tolerance for zoom / rounding */

  var overlay = null;
  var panel = null;
  var scroller = null;
  var agreeBtn = null;
  var hintEl = null;
  var barEl = null;
  var reachedEnd = false;
  var termsReady = false;
  var previousOverflow = '';

  /* ------------------------------------------------------------------ store */

  function memoryStore() {
    var data = {};
    return {
      getItem: function (k) {
        return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null;
      },
      setItem: function (k, v) { data[k] = String(v); },
      removeItem: function (k) { delete data[k]; }
    };
  }

  var store = (function () {
    var probe = '__nx_tos_probe__';
    try {
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return window.localStorage;
    } catch (e) {}
    try {
      window.sessionStorage.setItem(probe, '1');
      window.sessionStorage.removeItem(probe);
      return window.sessionStorage;
    } catch (e) {}
    /* Private mode / storage disabled: remember for this page only. */
    return memoryStore();
  })();

  function rememberAccepted() {
    try { store.setItem(ACCEPT_KEY, '1'); } catch (e) {}
  }

  function hasAccepted() {
    try {
      if (store.getItem(ACCEPT_KEY) === '1') return true;

      for (var i = 0; i < LEGACY_KEYS.length; i++) {
        var legacy = store.getItem(LEGACY_KEYS[i]);
        if (legacy === '1' || legacy === 'true') {
          rememberAccepted();
          return true;
        }
      }

      if (typeof store.length === 'number' && typeof store.key === 'function') {
        for (var j = 0; j < store.length; j++) {
          var key = store.key(j);
          var value = key ? store.getItem(key) : null;
          if (key && key.indexOf(LEGACY_PREFIX) === 0 && (value === '1' || value === 'true')) {
            rememberAccepted();
            return true;
          }
        }
      }
    } catch (e) {}
    return false;
  }

  /* -------------------------------------------------------------- url helpers */

  function scriptUrl() {
    try {
      if (document.currentScript && document.currentScript.src) return document.currentScript.src;
      var tags = document.getElementsByTagName('script');
      for (var i = tags.length - 1; i >= 0; i--) {
        if (/tos-gate\.js(\?|$)/.test(tags[i].src || '')) return tags[i].src;
      }
    } catch (e) {}
    return '';
  }

  function tosUrl() {
    var src = scriptUrl();
    try {
      return new URL('../TOS/TOS.html', src).href;
    } catch (e) {
      var marker = src.indexOf('/JS/');
      if (marker > -1) return src.slice(0, marker) + '/TOS/TOS.html';
      return 'TOS/TOS.html';
    }
  }

  /* ------------------------------------------------------------------- styles */

  function ensureStyles() {
    if (document.getElementById('nx-tos-gate-style')) return;

    var css = [
      'html.nx-tos-locked,html.nx-tos-locked body{overflow:hidden !important}',

      '#nx-tos-gate{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;',
      'justify-content:center;padding:16px;background:rgba(6,3,14,.94);',
      '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);',
      "font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;color:#fff;line-height:1.5}",

      '#nx-tos-gate *{box-sizing:border-box}',

      '#nx-tos-gate .nx-tos-panel{display:flex;flex-direction:column;width:100%;max-width:780px;',
      'max-height:92vh;background:#12091c;border:1px solid #8b00ff;border-radius:16px;overflow:hidden;',
      'box-shadow:0 24px 80px rgba(0,0,0,.8),0 0 42px rgba(139,0,255,.35);outline:none}',

      '#nx-tos-gate .nx-tos-head{display:flex;align-items:flex-start;justify-content:space-between;',
      'gap:14px;padding:18px 22px 14px;border-bottom:1px solid rgba(139,0,255,.3);flex-shrink:0}',

      '#nx-tos-gate .nx-tos-head h2{margin:0;font-size:1.2rem;font-weight:800;letter-spacing:.01em;color:#fff}',

      '#nx-tos-gate .nx-tos-sub{margin:5px 0 0;font-size:.8rem;color:#b0a8c0;max-width:52ch}',

      '#nx-tos-gate .nx-tos-link{color:#d8b4fe;font-size:.78rem;font-weight:600;text-decoration:underline;',
      'white-space:nowrap;flex-shrink:0}',

      '#nx-tos-gate .nx-tos-progress{height:3px;background:rgba(139,0,255,.18);flex-shrink:0}',
      '#nx-tos-gate .nx-tos-progress span{display:block;height:100%;width:0;',
      'background:linear-gradient(90deg,#f97316,#fbbf24);transition:width .12s linear}',

      '#nx-tos-gate .nx-tos-scroll{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;',
      'padding:18px 22px 22px;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;',
      'scrollbar-width:thin;scrollbar-color:rgba(249,115,22,.45) transparent}',

      '#nx-tos-gate .nx-tos-body h2{display:flex;align-items:center;gap:8px;font-size:1rem;',
      'font-weight:800;color:#fbbf24;margin:0 0 10px;line-height:1.35}',

      '#nx-tos-gate .nx-tos-body p{margin:0 0 10px;color:#fed7aa;font-size:.93rem;line-height:1.65}',

      '#nx-tos-gate .nx-tos-body ul{margin:6px 0 10px 1.2rem;padding:0}',
      '#nx-tos-gate .nx-tos-body li{margin:0 0 6px;color:#fed7aa;font-size:.93rem;line-height:1.6}',
      '#nx-tos-gate .nx-tos-body li::marker{color:#fbbf24}',
      '#nx-tos-gate .nx-tos-body strong{color:#fff7ed;font-weight:700}',
      '#nx-tos-gate .nx-tos-body a{color:#fcd34d}',

      '#nx-tos-gate .nx-tos-body .nx-tos-section{margin:0 0 12px;padding:15px 16px 6px;',
      'background:rgba(255,255,255,.03);border:1px solid rgba(249,115,22,.2);',
      'border-left:3px solid #f97316;border-radius:12px}',

      '#nx-tos-gate .nx-tos-body .section-icon{color:#f97316;font-size:.95rem}',
      '#nx-tos-gate .nx-tos-body .copy-link-btn{display:none !important}',

      '#nx-tos-gate .nx-tos-loading{margin:0;color:#b0a8c0;font-size:.9rem}',

      '#nx-tos-gate .nx-tos-foot{display:flex;align-items:center;justify-content:space-between;gap:14px;',
      'padding:14px 22px;border-top:1px solid rgba(139,0,255,.3);background:rgba(10,4,22,.9);flex-shrink:0}',

      '#nx-tos-gate .nx-tos-hint{margin:0;font-size:.8rem;color:#b0a8c0;font-weight:600}',
      '#nx-tos-gate .nx-tos-hint-done{color:#fbbf24}',
      '#nx-tos-gate .nx-tos-hint-warn{color:#fca5a5}',

      '#nx-tos-gate .nx-tos-actions{display:flex;align-items:center;gap:10px;flex-shrink:0}',

      '#nx-tos-gate .nx-tos-btn{border-radius:999px;padding:11px 20px;font-size:.85rem;font-weight:800;',
      'font-family:inherit;cursor:pointer;border:1px solid transparent;transition:transform .18s ease,',
      'box-shadow .18s ease,opacity .18s ease}',

      '#nx-tos-gate .nx-tos-decline{background:transparent;border-color:rgba(176,168,192,.35);color:#b0a8c0}',
      '#nx-tos-gate .nx-tos-decline:hover{color:#fff;border-color:rgba(255,255,255,.5)}',

      '#nx-tos-gate .nx-tos-agree{background:#2a1b40;color:#7c6f91;cursor:not-allowed;border-color:rgba(139,0,255,.25)}',

      '#nx-tos-gate .nx-tos-agree.nx-tos-ready{background:linear-gradient(135deg,#f97316,#fbbf24);',
      'color:#12091c;cursor:pointer;box-shadow:0 6px 22px rgba(251,191,36,.4);border-color:transparent}',

      '#nx-tos-gate .nx-tos-agree.nx-tos-ready:hover{transform:translateY(-1px) scale(1.02);',
      'box-shadow:0 8px 28px rgba(251,191,36,.55)}',

      '#nx-tos-gate .nx-tos-btn:focus-visible,#nx-tos-gate .nx-tos-link:focus-visible,',
      '#nx-tos-gate .nx-tos-scroll:focus-visible{outline:2px solid #fbbf24;outline-offset:2px}',

      '#nx-tos-gate .nx-tos-panel.nx-tos-shake{animation:nx-tos-shake .4s ease}',
      '@keyframes nx-tos-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}',
      '40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(3px)}}',

      '@media (prefers-reduced-motion:reduce){#nx-tos-gate *{animation:none !important;transition:none !important}}',

      '@media (max-width:600px){',
      '#nx-tos-gate{padding:8px}',
      '#nx-tos-gate .nx-tos-panel{max-height:100vh;border-radius:12px}',
      '#nx-tos-gate .nx-tos-head{padding:14px 15px 12px;flex-wrap:wrap;gap:8px}',
      '#nx-tos-gate .nx-tos-head h2{font-size:1.05rem}',
      '#nx-tos-gate .nx-tos-scroll{padding:14px 15px 18px}',
      '#nx-tos-gate .nx-tos-foot{flex-direction:column;align-items:stretch;padding:12px 15px;gap:10px}',
      '#nx-tos-gate .nx-tos-hint{text-align:center}',
      '#nx-tos-gate .nx-tos-actions{width:100%}',
      '#nx-tos-gate .nx-tos-btn{flex:1 1 0;padding:11px 12px}',
      '}'
    ].join('');

    var style = document.createElement('style');
    style.id = 'nx-tos-gate-style';
    style.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(style);
  }

  /* -------------------------------------------------------------------- markup */

  function buildOverlay() {
    var termsUrl = tosUrl();

    overlay = document.createElement('div');
    overlay.id = 'nx-tos-gate';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'nx-tos-title');
    overlay.innerHTML =
      '<div class="nx-tos-panel" role="document" tabindex="-1">' +
        '<div class="nx-tos-head">' +
          '<div>' +
            '<h2 id="nx-tos-title">Terms of Service</h2>' +
            '<p class="nx-tos-sub">Read through the terms below. The agree button unlocks ' +
              'once you reach the end.</p>' +
          '</div>' +
          '<a class="nx-tos-link" href="' + termsUrl + '" target="_blank" rel="noopener">' +
            'Open in new tab</a>' +
        '</div>' +
        '<div class="nx-tos-progress" aria-hidden="true"><span></span></div>' +
        '<div class="nx-tos-scroll" tabindex="0" aria-label="Terms of Service text">' +
          '<div class="nx-tos-body">' +
            '<p class="nx-tos-loading">Loading the Terms of Service&hellip;</p>' +
          '</div>' +
        '</div>' +
        '<div class="nx-tos-foot">' +
          '<p class="nx-tos-hint" id="nx-tos-hint">Scroll to the bottom to continue.</p>' +
          '<div class="nx-tos-actions">' +
            '<button type="button" class="nx-tos-btn nx-tos-decline">Decline</button>' +
            '<button type="button" class="nx-tos-btn nx-tos-agree" disabled>' +
              'I agree to the Terms of Service</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    (document.body || document.documentElement).appendChild(overlay);

    panel = overlay.querySelector('.nx-tos-panel');
    scroller = overlay.querySelector('.nx-tos-scroll');
    agreeBtn = overlay.querySelector('.nx-tos-agree');
    hintEl = overlay.querySelector('.nx-tos-hint');
    barEl = overlay.querySelector('.nx-tos-progress span');

    scroller.addEventListener('scroll', refresh);
    window.addEventListener('resize', refresh);

    agreeBtn.addEventListener('click', accept);
    overlay.querySelector('.nx-tos-decline').addEventListener('click', decline);

    /* Lock background scrolling while the gate is open. */
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.classList.add('nx-tos-locked');
    document.documentElement.style.overflow = 'hidden';

    try { panel.focus(); } catch (e) {}
  }

  /* --------------------------------------------------------------- terms text */

  function renderTerms(html) {
    var body = overlay && overlay.querySelector('.nx-tos-body');
    if (!body) return false;

    var doc = new DOMParser().parseFromString(html, 'text/html');
    var source = doc.getElementById('sections-container');
    if (!source || !source.querySelector('.section-card')) return false;

    var cards = source.querySelectorAll('.section-card');
    if (!cards.length) return false;

    var frag = document.createDocumentFragment();

    for (var i = 0; i < cards.length; i++) {
      var copy = cards[i].cloneNode(true);

      copy.removeAttribute('id');
      copy.removeAttribute('data-search');

      var withIds = copy.querySelectorAll('[id]');
      for (var j = 0; j < withIds.length; j++) withIds[j].removeAttribute('id');

      var buttons = copy.querySelectorAll('.copy-link-btn');
      for (var b = buttons.length - 1; b >= 0; b--) {
        if (buttons[b].parentNode) buttons[b].parentNode.removeChild(buttons[b]);
      }

      var section = document.createElement('div');
      section.className = 'nx-tos-section';
      section.appendChild(copy);
      frag.appendChild(section);
    }

    body.innerHTML = '';
    body.appendChild(frag);
    termsReady = true;
    reachedEnd = false;
    return true;
  }

  function renderFallback() {
    var body = overlay && overlay.querySelector('.nx-tos-body');
    if (!body) return;
    var url = tosUrl();
    body.innerHTML =
      '<p><strong>The full terms could not be loaded on this page.</strong> ' +
      'You can read them in full here: ' +
      '<a href="' + url + '" target="_blank" rel="noopener">Terms of Service</a>.</p>' +
      '<p>Pressing the agree button confirms that you accept the Terms of Service.</p>';
    termsReady = true;
    reachedEnd = false;
  }

  function loadTerms() {
    var url = tosUrl();
    var finished = false;

    function finish(ok, html) {
      if (finished) return;
      finished = true;
      if (!ok || !renderTerms(html)) renderFallback();
      refresh();
      /* Re-measure after fonts / layout settle. */
      setTimeout(refresh, 60);
      setTimeout(refresh, 400);
    }

    try {
      if (typeof window.fetch === 'function') {
        window.fetch(url, { credentials: 'same-origin' })
          .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.text();
          })
          .then(function (html) { finish(true, html); })
          .catch(function () { finish(false); });
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onload = function () {
          finish(xhr.status >= 200 && xhr.status < 300, xhr.responseText);
        };
        xhr.onerror = function () { finish(false); };
        xhr.send();
      }
    } catch (e) {
      finish(false);
    }

    /* Never leave the visitor stuck on a spinner. */
    setTimeout(function () { finish(false); }, 15000);
  }

  /* ----------------------------------------------------------------- scroll UI */

  function refresh() {
    if (!overlay || !scroller || !agreeBtn) return;

    /* Until the terms are on screen there is nothing to scroll, so the gate
       must stay locked (measuring the loading state would look "at bottom"). */
    if (!termsReady) {
      agreeBtn.disabled = true;
      agreeBtn.classList.remove('nx-tos-ready');
      if (hintEl) {
        hintEl.textContent = 'Loading the Terms of Service...';
        hintEl.classList.remove('nx-tos-hint-done');
      }
      return;
    }

    var max = scroller.scrollHeight - scroller.clientHeight;
    var atBottom = max <= 0 ||
      scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - BOTTOM_SLACK;

    if (atBottom) reachedEnd = true;

    if (barEl) {
      var pct = max <= 0 ? 100 : Math.min(100, Math.max(0, (scroller.scrollTop / max) * 100));
      barEl.style.width = pct.toFixed(1) + '%';
    }

    agreeBtn.disabled = !reachedEnd;
    agreeBtn.classList.toggle('nx-tos-ready', reachedEnd);
    hintEl.classList.toggle('nx-tos-hint-done', reachedEnd);

    if (!reachedEnd) {
      hintEl.textContent = 'Scroll to the bottom to continue.';
    } else {
      hintEl.textContent = 'End of the Terms of Service reached.';
    }
  }

  /* ------------------------------------------------------------------ actions */

  function accept() {
    if (!reachedEnd) {
      hintEl.textContent = 'Scroll to the bottom of the Terms of Service first.';
      hintEl.classList.add('nx-tos-hint-warn');
      setTimeout(function () {
        if (hintEl) hintEl.classList.remove('nx-tos-hint-warn');
      }, 1600);
      return;
    }

    rememberAccepted();
    close();
  }

  function decline() {
    if (!hintEl) return;
    hintEl.textContent = 'You must accept the Terms of Service to keep using Null X.';
    hintEl.classList.add('nx-tos-hint-warn');
    panel.classList.remove('nx-tos-shake');
    /* Force reflow so the animation can replay. */
    void panel.offsetWidth;
    panel.classList.add('nx-tos-shake');
  }

  function close() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
    panel = null;
    scroller = null;
    agreeBtn = null;
    hintEl = null;
    barEl = null;
    document.documentElement.classList.remove('nx-tos-locked');
    document.documentElement.style.overflow = previousOverflow;
  }

  function open() {
    if (overlay || hasAccepted()) return;
    ensureStyles();
    buildOverlay();
    loadTerms();
    refresh();
  }

  /* Accepting in another tab (e.g. the TOS page) dismisses this one too. */
  try {
    window.addEventListener('storage', function (event) {
      if (!overlay) return;
      if (event && event.key && event.key !== ACCEPT_KEY) return;
      if (hasAccepted()) close();
    });
    document.addEventListener('visibilitychange', function () {
      if (overlay && hasAccepted()) close();
    });
    window.addEventListener('focus', function () {
      if (overlay && hasAccepted()) close();
    });
  } catch (e) {}

  /* --------------------------------------------------------------------- boot */

  function boot() {
    if (hasAccepted()) return;
    open();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.__nxTosGate = {
    version: TOS_VERSION,
    hasAccepted: hasAccepted,
    accept: accept,
    open: open,
    close: close
  };
})();

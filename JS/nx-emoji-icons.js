/* Null X icon layer.
   Replaces the handful of emoji the UI still ships with Google Material
   Symbols SVGs, and opens the Canvas app on Ctrl+Shift+P. The same file is
   injected into same-origin game iframes so the shortcut and the icon swap
   also work while a game has focus. */
(function () {
  if (window.__nxEmojiIcons) return;
  window.__nxEmojiIcons = true;

  var SELF = document.currentScript;
  var ROOT = window.location.origin + '/';
  try {
    if (SELF && SELF.src) ROOT = SELF.src.replace(/JS\/nx-emoji-icons\.js.*$/, '');
  } catch (e) {}
  if (ROOT.charAt(ROOT.length - 1) !== '/') ROOT += '/';

  var isTop = true;
  try { isTop = window.top === window.self; } catch (e) { isTop = false; }

  function hideDevTools() {
    try {
      var s = document.createElement('style');
      s.id = 'nx-hide-devtools';
      s.textContent = '#nx-trigger,#nx-hud,#nx-inspector-overlay,#nx-toast-wrap,#nx-matrix-canvas{display:none!important;visibility:hidden!important;pointer-events:none!important}';
      (document.head || document.documentElement).appendChild(s);
    } catch (e) {}
  }
  hideDevTools();

  /* Google Material Symbols (filled) path data, 24px viewBox. */
  var PATHS = {
    close: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    star: 'M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
    check: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    error: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
    notifications: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
    image: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
    campaign: 'M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z',
    chat_bubble: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
    edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    download: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
    sync: 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
    check_circle: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    cancel: 'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z',
    gps_fixed: 'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z',
    palette: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
    visibility_off: 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z',
    attach_file: 'M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z'
  };

  var MAP = {};
  MAP['\u{1F4AC}'] = 'chat_bubble';
  MAP['\u270F'] = 'edit';
  MAP['\u2715'] = 'close';
  MAP['\u{1F514}'] = 'notifications';
  MAP['\u{1F4F7}'] = 'image';
  MAP['\u{1F4E2}'] = 'campaign';
  MAP['\u2605'] = 'star';
  MAP['\u26A0'] = 'warning';
  MAP['\u2713'] = 'check';
  MAP['\u2714'] = 'check';
  MAP['\u2717'] = 'close';
  MAP['\u274C'] = 'cancel';
  MAP['\u2B07'] = 'download';
  MAP['\u{1F504}'] = 'sync';
  MAP['\u2705'] = 'check_circle';
  MAP['\u{1F3AF}'] = 'gps_fixed';

  var EMOJI_RE = /([\u{1F4AC}\u270F\u2715\u{1F514}\u{1F4F7}\u{1F4E2}\u2605\u26A0\u2713\u2714\u2717\u274C\u2B07\u{1F504}\u2705\u{1F3AF}])\uFE0F?/gu;

  /* Noto emoji images used by chat settings and the attach buttons. */
  var NOTO = {
    '1f3a8': 'palette',
    '1f514': 'notifications',
    '1f575': 'visibility_off',
    '1f5bc': 'image',
    '1f4ac': 'chat_bubble',
    '1f4ce': 'attach_file'
  };

  function svgIcon(name, cls, size) {
    var d = PATHS[name];
    if (!d) return null;
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('fill', 'currentColor');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    s.setAttribute('class', 'nx-emoji-ico' + (cls ? ' ' + cls : ''));
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.display = 'inline-block';
    s.style.verticalAlign = 'middle';
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    s.appendChild(p);
    return s;
  }

  function replaceNotoImages(root) {
    var scope = root && root.querySelectorAll ? root : document;
    if (!scope.querySelectorAll) return;
    var imgs = scope.querySelectorAll('img[src*="notoemoji"]');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      var m = /notoemoji\/latest\/([0-9a-f]+)\/emoji\.svg/i.exec(img.src || '');
      var name = m && NOTO[m[1]];
      if (!name) continue;
      var svg = svgIcon(name, img.className, 18);
      if (svg && img.parentNode) img.parentNode.replaceChild(svg, img);
    }
  }

  function icon(name, size) {
    var d = PATHS[name];
    if (!d) return '';
    var s = size || 16;
    return '<svg class="nx-emoji-ico" width="' + s + '" height="' + s +
      '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"' +
      ' style="width:1em;height:1em;vertical-align:-0.125em;display:inline-block;margin:0 .05em;">' +
      '<path d="' + d + '"></path></svg>';
  }

  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1, OPTION: 1, CODE: 1, PRE: 1, SVG: 1 };

  function shouldSkip(node) {
    var el = node.parentNode;
    for (var i = 0; el && i < 8; i++, el = el.parentNode) {
      if (el.nodeType !== 1) continue;
      if (SKIP_TAGS[el.tagName]) return true;
      if (el.isContentEditable) return true;
      if (el.classList && el.classList.contains('nx-emoji-ico')) return true;
    }
    return false;
  }

  function replaceNode(node) {
    var text = node.nodeValue;
    if (!text) return;
    EMOJI_RE.lastIndex = 0;
    if (!EMOJI_RE.test(text)) return;
    EMOJI_RE.lastIndex = 0;

    var frag = document.createDocumentFragment();
    var last = 0;
    var m;
    while ((m = EMOJI_RE.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      var markup = icon(MAP[m[1]]);
      if (markup) {
        var holder = document.createElement('span');
        holder.innerHTML = markup;
        frag.appendChild(holder.firstChild);
      } else {
        frag.appendChild(document.createTextNode(m[0]));
      }
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    if (node.parentNode) node.parentNode.replaceChild(frag, node);
  }

  var queue = [];
  var scheduled = false;

  function flush() {
    scheduled = false;
    var items = queue.slice();
    queue.length = 0;
    for (var i = 0; i < items.length; i++) walk(items[i]);
  }

  function schedule(root) {
    if (!root) return;
    queue.push(root);
    if (scheduled) return;
    scheduled = true;
    if (window.requestAnimationFrame) window.requestAnimationFrame(flush);
    else setTimeout(flush, 30);
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 1 || root.nodeType === 9) replaceNotoImages(root);
    if (root.nodeType === 3) {
      if (!shouldSkip(root)) replaceNode(root);
      return;
    }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1 && root.classList && root.classList.contains('nx-emoji-ico')) return;
    if (root.nodeType === 1 && SKIP_TAGS[root.tagName]) return;

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var batch = [];
    var n;
    while ((n = walker.nextNode())) batch.push(n);
    for (var i = 0; i < batch.length; i++) {
      if (!shouldSkip(batch[i])) replaceNode(batch[i]);
    }
  }

  function startObserver() {
    try {
      var obs = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var m = muts[i];
          if (m.type === 'characterData') {
            schedule(m.target);
          } else {
            for (var j = 0; j < m.addedNodes.length; j++) {
              var node = m.addedNodes[j];
              if (node.nodeType === 1 && node.classList && node.classList.contains('nx-emoji-ico')) continue;
              schedule(node);
            }
          }
        }
      });
      obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    } catch (e) {}
  }

  /* ---------------------------------------------------------------- Canvas */

  var overlayId = 'nx-canvas-overlay';

  function closeCanvas() {
    var el = document.getElementById(overlayId);
    if (!el) return;
    try { if (el.open && el.close) el.close(); } catch (e) {}
    el.remove();
  }

  function mountCanvasDocument(html, host) {
    var parse = new DOMParser().parseFromString(html, 'text/html');
    var shadow = host.attachShadow({ mode: 'open' });
    var css = '';
    var styles = parse.querySelectorAll('style');
    for (var i = 0; i < styles.length; i++) css += styles[i].textContent + '\n';
    css = css.replace(/:root/g, ':host').replace(/(^|[},])\s*body\s*\{/g, '$1:host{');
    var styleEl = document.createElement('style');
    styleEl.textContent = css;
    shadow.appendChild(styleEl);
    var body = document.createElement('div');
    body.className = 'nx-canvas-body';
    var kids = Array.prototype.slice.call(parse.body.childNodes);
    for (var j = 0; j < kids.length; j++) {
      var node = kids[j];
      if (node.nodeType === 1 && node.tagName === 'SCRIPT') continue;
      body.appendChild(document.importNode(node, true));
    }
    shadow.appendChild(body);
    var scriptText = '';
    var scripts = parse.querySelectorAll('script');
    for (var k = 0; k < scripts.length; k++) {
      if (!scripts[k].src) scriptText += scripts[k].textContent + '\n';
    }
    var scoped = {
      getElementById: function (id) {
        var el = shadow.getElementById ? shadow.getElementById(id) : null;
        return el || shadow.querySelector('#' + id);
      },
      querySelector: function (sel) { return shadow.querySelector(sel); },
      querySelectorAll: function (sel) { return shadow.querySelectorAll(sel); },
      createElement: function (tag) { return document.createElement(tag); },
      createElementNS: function (ns, tag) { return document.createElementNS(ns, tag); },
      createTextNode: function (t) { return document.createTextNode(t); },
      createDocumentFragment: function () { return document.createDocumentFragment(); },
      addEventListener: function () { return document.addEventListener.apply(document, arguments); },
      removeEventListener: function () { return document.removeEventListener.apply(document, arguments); },
      body: body,
      documentElement: host,
      head: shadow,
      readyState: 'complete'
    };
    new Function('document', 'window', scriptText)(scoped, window);
  }

  function mountCanvas() {
    var style = document.getElementById('nx-canvas-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'nx-canvas-style';
      style.textContent =
        '#' + overlayId + '{position:fixed!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important;' +
        'max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;' +
        'background:#08080f!important;color:#fff;overflow:hidden;}' +
        '#' + overlayId + '::backdrop{background:#08080f!important;}' +
        '#' + overlayId + ' #nx-canvas-host{position:absolute!important;left:0!important;top:0!important;width:100%!important;' +
        'height:100%!important;overflow:auto;background:#f7f8f9;z-index:1;}' +
        '#' + overlayId + ' .nx-canvas-status{position:absolute;left:0;top:0;width:100%;height:100%;display:flex;' +
        'align-items:center;justify-content:center;flex-direction:column;gap:12px;color:#cfc9da;' +
        'font:600 15px/1.4 system-ui,-apple-system,sans-serif;text-align:center;padding:24px;z-index:2;pointer-events:none;}' +
        '#' + overlayId + ' .nx-canvas-status a{color:#c08bff;pointer-events:auto;}' +
        '#nx-canvas-close{position:absolute;top:12px;right:14px;z-index:3;width:40px;height:40px;' +
        'border-radius:10px;border:1px solid rgba(255,255,255,.22);background:rgba(8,8,15,.72);' +
        'color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;}' +
        '#nx-canvas-close:hover{background:#8b00ff;border-color:#8b00ff;}';
      (document.head || document.documentElement).appendChild(style);
    }
    var wrap = document.createElement('dialog');
    wrap.id = overlayId;
    wrap.setAttribute('aria-label', 'Canvas');
    wrap.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:#08080f;color:#fff;overflow:hidden;';
    wrap.innerHTML =
      '<div class="nx-canvas-status" id="nx-canvas-status">' +
      '<span id="nx-canvas-msg">Loading Canvas…</span>' +
      '<a href="' + ROOT + 'Canvas/index.html" target="_blank" rel="noopener">Open in a new tab</a></div>' +
      '<button id="nx-canvas-close" type="button" aria-label="Close canvas">' + icon('close', 20) + '</button>' +
      '<div id="nx-canvas-host"></div>';
    (document.documentElement || document.body).appendChild(wrap);
    try {
      if (typeof wrap.showModal === 'function') wrap.showModal();
      else wrap.setAttribute('open', '');
    } catch (e) { wrap.setAttribute('open', ''); }
    wrap.addEventListener('cancel', function (e) { e.preventDefault(); closeCanvas(); });
    var btn = document.getElementById('nx-canvas-close');
    if (btn) btn.addEventListener('click', closeCanvas);
    var host = document.getElementById('nx-canvas-host');
    var status = document.getElementById('nx-canvas-status');
    function failStatus() {
      var msg = document.getElementById('nx-canvas-msg');
      if (msg) msg.textContent = 'Canvas did not load.';
    }
    if (!window.fetch) {
      failStatus();
      return;
    }
    fetch(ROOT + 'Canvas/index.html', { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (html) {
        try {
          mountCanvasDocument(html, host);
          if (status) status.style.display = 'none';
        } catch (e) { failStatus(); }
      })
      .catch(function () { failStatus(); });
    setTimeout(function () {
      if (!status || status.style.display === 'none') return;
      var msg = document.getElementById('nx-canvas-msg');
      if (msg && msg.textContent === 'Loading Canvas…') msg.textContent = 'Canvas is taking longer than expected.';
    }, 8000);
  }

  function showCanvas() {
    if (!isTop || !document.body) return;
    if (document.getElementById(overlayId)) return;
    mountCanvas();
  }

  function openCanvas() {
    if (!isTop || !document.body) return;
    if (document.getElementById(overlayId)) {
      closeCanvas();
      return;
    }
    mountCanvas();
  }

  window.nxOpenCanvas = openCanvas;
  window.nxCloseCanvas = closeCanvas;
  window.__nxCanvasInjectFrame = injectFrame;

  function injectFrame(frame) {
    // Hook the frame's own keyboard first: key events never reach the parent
    // document while a game has focus, and this also covers pages whose CSP
    // blocks the injected script below.
    try {
      var win = frame.contentWindow;
      if (win && !win.__nxCanvasKeyHook) {
        win.__nxCanvasKeyHook = true;
        win.addEventListener('keydown', onKey, true);
      }
    } catch (e) {}
    try {
      var doc = frame.contentDocument;
      if (!doc || !doc.documentElement) return;
      if (doc.querySelector('script[data-nx-emoji-icons]')) return;
      var s = doc.createElement('script');
      s.src = ROOT + 'JS/nx-emoji-icons.js';
      s.setAttribute('data-nx-emoji-icons', '1');
      (doc.head || doc.documentElement).appendChild(s);
    } catch (e) {}
  }

  function scanFrames() {
    var frames = document.querySelectorAll('iframe');
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      if (!f.__nxFrameLoadHooked) {
        f.__nxFrameLoadHooked = true;
        f.addEventListener('load', function () { injectFrame(this); });
      }
      injectFrame(f);
    }
  }

  function startFrameWatcher() {
    scanFrames();
    try {
      var obs = new MutationObserver(function () { scanFrames(); });
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  function onKey(e) {
    var key = e.key || '';
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'P' || key === 'p')) {
      e.preventDefault();
      e.stopPropagation();
      if (isTop) openCanvas();
      else {
        try { window.top.postMessage({ type: 'nx-open-canvas' }, '*'); } catch (err) {}
      }
      return;
    }
    if (isTop && key === 'Escape') closeCanvas();
  }

  document.addEventListener('keydown', onKey, true);

  if (isTop) {
    window.addEventListener('message', function (e) {
      if (e && e.data && e.data.type === 'nx-open-canvas') showCanvas();
    });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startFrameWatcher);
    else startFrameWatcher();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      walk(document.body);
      startObserver();
    });
  } else {
    walk(document.body);
    startObserver();
  }
})();

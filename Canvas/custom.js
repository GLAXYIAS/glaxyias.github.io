/* Canvas enhancements: card customization and the Studio library.
   Loaded by JS/nx-emoji-icons.js after the single-file Canvas app has been
   mounted in its shadow root. Canvas/index.html stays untouched for the
   import workflow. */
(function () {
  'use strict';

  var doc = document;
  var root = (typeof shadow !== 'undefined' && shadow) ? shadow : document;
  var cardsEl = doc.getElementById('cards');
  if (!cardsEl) return;

  var CUSTOM_KEY = 'nxCanvasCardCustom_v1';
  var ORDER_KEY = 'nxCanvasCardOrder_v1';
  var custom = load(CUSTOM_KEY, {});
  var order = load(ORDER_KEY, []);
  if (!custom || typeof custom !== 'object' || Array.isArray(custom)) custom = {};
  if (!Array.isArray(order)) order = [];

  var PALETTE = [
    '#b23a1c', '#e0223a', '#c01f72', '#8a3e9c', '#5b3f9e',
    '#1e3b74', '#21618c', '#1367b0', '#13807b', '#15825a',
    '#0e8a4f', '#8f7a14', '#a85b1c', '#c65c19', '#c23a86'
  ];

  var DOTS_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' +
    '<circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="19" r="2"></circle></svg>';

  var MOVE_DOWN_SVG = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 4v8a3 3 0 0 0 3 3h11"></path><path d="M14 11l4 4-4 4"></path><path d="M3 20h8"></path></svg>';

  var MOVE_BOTTOM_SVG = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 4v12a3 3 0 0 0 3 3h11"></path><path d="M14 15l4 4-4 4"></path><path d="M3 20h8"></path></svg>';

  var menu = null;
  var menuState = null;
  var toastTimer = null;

  function load(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function save(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function normalizeHex(value) {
    var v = String(value || '').trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(v)) {
      v = v.charAt(0) + v.charAt(0) + v.charAt(1) + v.charAt(1) + v.charAt(2) + v.charAt(2);
    }
    return /^[0-9a-f]{6}$/i.test(v) ? '#' + v.toLowerCase() : '';
  }

  function style() {
    if (doc.getElementById('nx-canvas-custom-css')) return;
    var el = doc.createElement('style');
    el.id = 'nx-canvas-custom-css';
    el.textContent = [
      '.nx-card-dots{position:absolute;top:8px;right:8px;z-index:3;width:28px;height:28px;border-radius:50%;border:1px solid rgba(0,0,0,.14);background:rgba(255,255,255,.94);color:#33424d;display:flex;align-items:center;justify-content:center;padding:0;box-shadow:0 1px 3px rgba(0,0,0,.16);opacity:.92;line-height:0}',
      '.nx-card-dots:hover{background:#fff;opacity:1}',
      '.nx-card-tint{position:absolute;inset:0;z-index:1;pointer-events:none;transition:opacity .15s}',
      '.nx-card-menu{position:fixed;z-index:90;width:262px;background:#fff;border:1px solid #cbd3d8;box-shadow:0 10px 30px rgba(0,0,0,.24);color:#2b3a45;font:14px/1.35 Arial,Helvetica,sans-serif}',
      '.nx-cm-tabs{display:flex;align-items:stretch;border-bottom:1px solid #d7dde1;background:#fff}',
      '.nx-cm-tab{border:0;background:transparent;padding:11px 16px;font-size:14px;color:#31424e;position:relative}',
      '.nx-cm-tab.active{font-weight:600;box-shadow:inset 0 0 0 1px #cbd3d8;border-bottom:2px solid #fff;margin-bottom:-1px;background:#fff}',
      '.nx-cm-close{margin-left:auto;border:0;background:transparent;padding:0 12px;font-size:20px;line-height:1;color:#3a4a55}',
      '.nx-cm-panel{padding:14px 16px 16px}',
      '.nx-cm-panel[hidden]{display:none!important}',
      '.nx-cm-label{font-weight:700;font-size:13px;margin-bottom:8px}',
      '.nx-cm-nick{width:100%;padding:8px 10px;border:1px solid #b9c3ca;border-radius:3px;font-size:14px;box-sizing:border-box;background:#fff;color:#2b3a45}',
      '.nx-cm-swatches{display:grid;grid-template-columns:repeat(5,28px);gap:10px 14px;margin:14px 0 10px}',
      '.nx-cm-swatch{width:28px;height:28px;border:0;padding:0;border-radius:1px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.1);position:relative}',
      '.nx-cm-swatch.selected{box-shadow:inset 0 0 0 2px #fff,0 0 0 2px #455a64}',
      '.nx-cm-hexrow{display:flex;align-items:center;gap:10px;margin-top:6px}',
      '.nx-cm-preview{width:28px;height:28px;border-radius:2px;border:1px solid #c7cdd1;flex:0 0 auto;background:transparent}',
      '.nx-cm-hex{flex:1;min-width:0;padding:7px 9px;border:1px solid #b9c3ca;border-radius:3px;font-size:14px;text-transform:uppercase;background:#fff;color:#2b3a45}',
      '.nx-cm-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}',
      '.nx-cm-btn{padding:7px 13px;border:1px solid #cbd3d8;background:#fff;border-radius:3px;color:#2b3a45}',
      '.nx-cm-btn.primary{background:#0b5a9c;border-color:#0b5a9c;color:#fff}',
      '.nx-cm-btn:hover{filter:brightness(.97)}',
      '.nx-cm-move{display:flex;align-items:center;gap:12px;width:100%;border:0;background:#fff;padding:10px 2px;text-align:left;color:#2b3a45;font-size:15px}',
      '.nx-cm-move:hover{background:#f3f6f8}',
      '.nx-cm-move[disabled]{opacity:.4;cursor:default}',
      '.nx-cm-move svg{flex:0 0 auto}',
      '.nx-canvas-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#26343d;color:#fff;padding:10px 16px;border-radius:4px;font:13px Arial,Helvetica,sans-serif;z-index:100;box-shadow:0 4px 18px rgba(0,0,0,.3);opacity:0;pointer-events:none;transition:opacity .15s}',
      '.nx-canvas-toast.show{opacity:1}',

      '#nx-studio{position:fixed;left:54px;top:0;right:0;bottom:0;background:#fff;z-index:26;display:none;flex-direction:column;color:#2f3b46;font:14px/1.4 Arial,Helvetica,sans-serif}',
      '#nx-studio.open{display:flex}',
      '.nx-st-top{display:flex;align-items:center;gap:24px;height:64px;padding:0 26px;border-bottom:1px solid #e5e8ea;background:#fff;flex:0 0 auto;overflow-x:auto}',
      '.nx-st-brand{display:flex;align-items:center;color:#53646f;flex:0 0 auto}',
      '.nx-st-tabs{display:flex;align-items:stretch;height:64px;gap:24px}',
      '.nx-st-tab{border:0;background:none;padding:0 2px;font-size:14px;color:#33424d;border-bottom:3px solid transparent;height:64px;white-space:nowrap}',
      '.nx-st-tab.active{border-bottom-color:#2f3b46;font-weight:600}',
      '.nx-st-tab:hover{color:#0b5a9c}',
      '.nx-st-scroll{flex:1;overflow:auto;padding:26px 30px 40px}',
      '.nx-st-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap}',
      '.nx-st-head h1{font-size:32px;font-weight:500;margin:0;color:#24323d}',
      '.nx-st-tools{margin-left:auto;display:flex;align-items:center;gap:10px;flex-wrap:wrap}',
      '.nx-st-icon{width:36px;height:36px;border:1px solid transparent;background:transparent;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#3f4e59;padding:0}',
      '.nx-st-icon:hover{background:#f0f2f3;border-color:#e3e6e8}',
      '.nx-st-btn{height:36px;padding:0 14px;border:1px solid #c6ced4;background:#fff;border-radius:3px;font-size:14px;color:#2f3b46;display:inline-flex;align-items:center;justify-content:center;gap:7px;white-space:nowrap}',
      '.nx-st-btn:hover{background:#f5f7f8}',
      '.nx-st-primary{background:#0069aa;border-color:#0069aa;color:#fff}',
      '.nx-st-primary:hover{background:#005a92}',
      '.nx-st-grid{display:grid;grid-template-columns:236px minmax(0,1fr);gap:26px;margin-top:26px;align-items:start}',
      '.nx-st-side{min-width:0}',
      '.nx-st-sort-label{display:block;font-size:13px;font-weight:600;margin-bottom:7px;color:#2f3b46}',
      '.nx-st-sort{width:100%;height:36px;border:1px solid #c6ced4;border-radius:3px;background:#fff;padding:0 8px;color:#2f3b46}',
      '.nx-st-tree{margin-top:16px;display:flex;flex-direction:column;gap:4px}',
      '.nx-st-tree-item{display:flex;align-items:center;gap:8px;border:0;background:transparent;padding:8px 10px;border-radius:3px;text-align:left;color:#0b5a9c;font-size:14px;width:100%}',
      '.nx-st-tree-item:hover{background:#eef4f9}',
      '.nx-st-tree-item.active{background:#0b5a9c;color:#fff;font-weight:600}',
      '.nx-st-tree-item svg{flex:0 0 auto}',
      '.nx-st-tree-item .nx-st-plus{margin-left:auto;font-size:18px;line-height:1}',
      '.nx-st-pane{border:1px solid #dfe4e7;background:#fff;min-height:470px;display:flex;flex-direction:column;min-width:0}',
      '.nx-st-pane-head{padding:9px 14px;background:#f0f2f3;border-bottom:1px solid #e1e5e8;font-size:13px;font-weight:600}',
      '.nx-st-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:22px}',
      '.nx-st-empty[hidden]{display:none!important}',
      '.nx-st-empty h2{font-size:20px;margin:8px 0 6px;font-weight:600;color:#24323d}',
      '.nx-st-empty p{font-size:14px;color:#4b5a64;margin:0 0 18px}',
      '.nx-st-illustration{width:min(330px,100%);height:auto}',
      '.nx-st-list{display:flex;flex-direction:column}',
      '.nx-st-list[hidden]{display:none!important}',
      '.nx-st-item{display:flex;align-items:center;gap:14px;padding:12px 16px;border-bottom:1px solid #eef0f1}',
      '.nx-st-thumb{width:76px;height:46px;background:#26343d;border-radius:3px;display:flex;align-items:center;justify-content:center;color:#fff;flex:0 0 auto;overflow:hidden}',
      '.nx-st-meta{min-width:0;flex:1}',
      '.nx-st-name{font-size:14px;font-weight:600;color:#24323d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px}',
      '.nx-st-sub{font-size:12px;color:#65747d}',
      '.nx-st-play,.nx-st-remove{height:30px;padding:0 10px;border:1px solid #c6ced4;background:#fff;border-radius:3px;font-size:12px;color:#2f3b46}',
      '.nx-st-remove{color:#8a2f2f;border-color:#dcc6c6}',
      '.nx-st-player{position:fixed;inset:0;background:rgba(10,15,20,.72);z-index:120;display:flex;align-items:center;justify-content:center;padding:20px}',
      '.nx-st-player-box{width:min(760px,100%);background:#0c1116;border-radius:6px;padding:12px;position:relative}',
      '.nx-st-player video{width:100%;max-height:70vh;background:#000;display:block}',
      '.nx-st-player .nx-st-player-close{position:absolute;right:-8px;top:-8px;width:32px;height:32px;border-radius:50%;border:1px solid #fff;background:#1d2a33;color:#fff;font-size:18px;line-height:1}',
      '@media(max-width:760px){#nx-studio{left:54px}.nx-st-top{padding:0 16px;gap:16px}.nx-st-scroll{padding:18px}.nx-st-head h1{font-size:26px}.nx-st-tools{margin-left:0;width:100%}.nx-st-grid{grid-template-columns:1fr;gap:18px}.nx-st-pane{min-height:380px}.nx-st-empty{padding:16px}.nx-cm-swatches{gap:8px 12px}}'
    ].join('\n');
    (doc.head || doc.documentElement).appendChild(el);
  }

  function notify(message) {
    var el = doc.getElementById('nx-canvas-toast');
    if (!el) {
      el = doc.createElement('div');
      el.id = 'nx-canvas-toast';
      el.className = 'nx-canvas-toast';
      doc.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  function cardNodes() {
    return Array.prototype.slice.call(cardsEl.querySelectorAll('.card'));
  }

  function originalTitle(card) {
    return card.getAttribute('data-nx-orig') || '';
  }

  function applyOrder() {
    if (!order.length) return;
    var nodes = cardNodes();
    if (!nodes.length) return;
    var map = {};
    for (var i = 0; i < nodes.length; i++) {
      var key = originalTitle(nodes[i]);
      if (key && !map[key]) map[key] = nodes[i];
    }
    var desired = [];
    var used = {};
    for (var j = 0; j < order.length; j++) {
      var t = order[j];
      if (map[t] && !used[t]) {
        desired.push(map[t]);
        used[t] = true;
      }
    }
    for (var k = 0; k < nodes.length; k++) {
      var nk = originalTitle(nodes[k]);
      if (!used[nk]) {
        desired.push(nodes[k]);
        used[nk] = true;
      }
    }
    var currentSeq = nodes.map(originalTitle).join('\u0001');
    var wantedSeq = desired.map(originalTitle).join('\u0001');
    if (currentSeq === wantedSeq) return;
    for (var m = 0; m < desired.length; m++) cardsEl.appendChild(desired[m]);
  }

  function syncCard(card, key) {
    var data = custom[key] || {};
    var title = card.querySelector('.card-title');
    var label = data.nickname || key;
    if (title && title.textContent !== label) title.textContent = label;

    var image = card.querySelector('.card-image');
    if (image) {
      var tint = image.querySelector('.nx-card-tint');
      if (!tint) {
        tint = doc.createElement('span');
        tint.className = 'nx-card-tint';
        image.insertBefore(tint, image.firstChild);
      }
      tint.style.background = data.color || 'transparent';
      tint.style.opacity = data.color ? '.30' : '0';
    }

    var btn = card.querySelector('.nx-card-dots');
    if (!btn && image) {
      btn = doc.createElement('button');
      btn.type = 'button';
      btn.className = 'nx-card-dots';
      btn.title = 'Customize card';
      btn.innerHTML = DOTS_SVG;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleMenu(card, btn);
      });
      image.appendChild(btn);
    }
    if (btn) btn.setAttribute('aria-label', 'Customize ' + label);
  }

  function enhanceCards() {
    var nodes = cardNodes();
    for (var i = 0; i < nodes.length; i++) {
      var card = nodes[i];
      if (!card.getAttribute('data-nx-orig')) {
        var titleEl = card.querySelector('.card-title');
        var orig = titleEl ? titleEl.textContent.trim() : '';
        if (orig) card.setAttribute('data-nx-orig', orig);
      }
      if (originalTitle(card)) syncCard(card, originalTitle(card));
    }
    applyOrder();
    if (menuState && menuState.card && !menuState.card.isConnected) closeMenu();
  }

  cardsEl.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('.nx-card-dots')) return;
    var card = e.target && e.target.closest ? e.target.closest('.card') : null;
    if (!card) return;
    var key = originalTitle(card);
    var data = custom[key];
    var name = (data && data.nickname) || key;
    setTimeout(function () {
      var view = doc.getElementById('viewCourse');
      var title = doc.getElementById('courseTitle');
      if (view && view.classList.contains('active') && title) title.textContent = name;
    }, 0);
  }, true);

  function setMenuFlag(value) {
    try { window.__nxCanvasMenuOpen = !!value; } catch (e) {}
  }

  function positionMenu() {
    if (!menu || !menuState) return;
    var rect = menuState.anchor.getBoundingClientRect();
    var width = menu.offsetWidth || 262;
    var height = menu.offsetHeight || 330;
    var left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
    var top = rect.bottom + 8;
    if (top + height > window.innerHeight - 8) top = Math.max(8, rect.top - height - 8);
    menu.style.left = Math.round(left) + 'px';
    menu.style.top = Math.round(top) + 'px';
  }

  function closeMenu() {
    if (menu && menu.parentNode) menu.parentNode.removeChild(menu);
    menu = null;
    menuState = null;
    setMenuFlag(false);
  }

  function toggleMenu(card, anchor) {
    if (menu && menuState && menuState.card === card) {
      closeMenu();
      return;
    }
    openMenu(card, anchor);
  }

  function openMenu(card, anchor) {
    closeMenu();
    var key = originalTitle(card);
    var data = custom[key] || {};
    var state = {
      card: card,
      key: key,
      anchor: anchor,
      nickname: data.nickname || key,
      color: data.color || ''
    };
    menuState = state;

    var swatches = PALETTE.map(function (c) {
      var selected = c.toLowerCase() === String(state.color).toLowerCase();
      return '<button type="button" class="nx-cm-swatch' + (selected ? ' selected' : '') +
        '" data-color="' + c + '" style="background:' + c + '" aria-label="Color ' + c + '"></button>';
    }).join('');

    menu = doc.createElement('div');
    menu.className = 'nx-card-menu';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-label', 'Customize card');
    menu.innerHTML =
      '<div class="nx-cm-tabs">' +
        '<button type="button" class="nx-cm-tab active" data-tab="color">Color</button>' +
        '<button type="button" class="nx-cm-tab" data-tab="move">Move</button>' +
        '<button type="button" class="nx-cm-close" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="nx-cm-panel" data-panel="color">' +
        '<div class="nx-cm-label">Nickname</div>' +
        '<input class="nx-cm-nick" maxlength="60" value="' + esc(state.nickname) + '" aria-label="Nickname">' +
        '<div class="nx-cm-swatches">' + swatches + '</div>' +
        '<div class="nx-cm-hexrow">' +
          '<span class="nx-cm-preview" style="background:' + (state.color || 'transparent') + '"></span>' +
          '<input class="nx-cm-hex" maxlength="7" value="' + esc(state.color ? state.color.toUpperCase() : '') + '" aria-label="Hex color">' +
        '</div>' +
        '<div class="nx-cm-actions">' +
          '<button type="button" class="nx-cm-btn" data-act="cancel">Cancel</button>' +
          '<button type="button" class="nx-cm-btn primary" data-act="apply">Apply</button>' +
        '</div>' +
      '</div>' +
      '<div class="nx-cm-panel" data-panel="move" hidden>' +
        '<button type="button" class="nx-cm-move" data-move="down">' + MOVE_DOWN_SVG + 'Move down</button>' +
        '<button type="button" class="nx-cm-move" data-move="bottom">' + MOVE_BOTTOM_SVG + 'Move to bottom</button>' +
      '</div>';

    doc.body.appendChild(menu);
    setMenuFlag(true);

    var tabs = menu.querySelectorAll('.nx-cm-tab');
    var panels = menu.querySelectorAll('.nx-cm-panel');
    var nick = menu.querySelector('.nx-cm-nick');
    var hexInput = menu.querySelector('.nx-cm-hex');
    var preview = menu.querySelector('.nx-cm-preview');
    var swatchEls = menu.querySelectorAll('.nx-cm-swatch');
    var nodes = cardNodes();
    var index = nodes.indexOf(card);
    var downBtn = menu.querySelector('[data-move="down"]');
    var bottomBtn = menu.querySelector('[data-move="bottom"]');
    if (downBtn) downBtn.disabled = index < 0 || index >= nodes.length - 1;
    if (bottomBtn) bottomBtn.disabled = index < 0 || index >= nodes.length - 1;

    function paintColor(value, updateInput) {
      state.color = value || '';
      preview.style.background = state.color || 'transparent';
      if (updateInput) hexInput.value = state.color ? state.color.toUpperCase() : '';
      for (var i = 0; i < swatchEls.length; i++) {
        swatchEls[i].classList.toggle('selected', swatchEls[i].getAttribute('data-color').toLowerCase() === String(state.color).toLowerCase());
      }
    }

    for (var t = 0; t < tabs.length; t++) {
      tabs[t].addEventListener('click', function () {
        var name = this.getAttribute('data-tab');
        for (var a = 0; a < tabs.length; a++) tabs[a].classList.toggle('active', tabs[a] === this);
        for (var b = 0; b < panels.length; b++) panels[b].hidden = panels[b].getAttribute('data-panel') !== name;
        positionMenu();
      });
    }

    menu.querySelector('.nx-cm-close').addEventListener('click', closeMenu);
    menu.querySelector('[data-act="cancel"]').addEventListener('click', closeMenu);

    for (var s = 0; s < swatchEls.length; s++) {
      swatchEls[s].addEventListener('click', function () {
        paintColor(this.getAttribute('data-color'), true);
      });
    }

    hexInput.addEventListener('input', function () {
      var raw = this.value.trim();
      var normalized = normalizeHex(raw);
      if (normalized && (raw.length === 7 || raw.length === 4)) {
        state.color = normalized;
        preview.style.background = normalized;
        for (var i = 0; i < swatchEls.length; i++) {
          swatchEls[i].classList.toggle('selected', swatchEls[i].getAttribute('data-color').toLowerCase() === normalized);
        }
      }
    });

    menu.querySelector('[data-act="apply"]').addEventListener('click', function () {
      var raw = hexInput.value.trim();
      var color = raw ? normalizeHex(raw) : '';
      if (raw && !color) {
        notify('Enter a valid hex color.');
        hexInput.focus();
        return;
      }
      var nickname = nick.value.trim();
      if (!nickname) {
        notify('Give the card a nickname first.');
        nick.focus();
        return;
      }
      custom[state.key] = { nickname: nickname, color: color };
      save(CUSTOM_KEY, custom);
      syncCard(state.card, state.key);
      closeMenu();
      notify('Card updated.');
    });

    if (downBtn) downBtn.addEventListener('click', function () { moveCard('down'); });
    if (bottomBtn) bottomBtn.addEventListener('click', function () { moveCard('bottom'); });

    positionMenu();
    nick.focus();
    nick.select();
  }

  function moveCard(where) {
    if (!menuState) return;
    var nodes = cardNodes();
    var index = nodes.indexOf(menuState.card);
    if (index < 0) return;
    if (where === 'down') {
      if (index >= nodes.length - 1) return;
      cardsEl.insertBefore(nodes[index + 1], nodes[index]);
    } else if (where === 'bottom') {
      if (index >= nodes.length - 1) return;
      cardsEl.appendChild(menuState.card);
    } else {
      return;
    }
    order = cardNodes().map(originalTitle);
    save(ORDER_KEY, order);
    closeMenu();
    notify('Card moved.');
  }

  function onKey(e) {
    if (e.key !== 'Escape' && e.keyCode !== 27) return;
    if (studioPlayer) {
      closePlayer();
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (menu) {
      closeMenu();
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (studioOpen()) {
      closeStudio();
      e.preventDefault();
      e.stopPropagation();
    }
  }

  /* ------------------------------------------------------------ Studio */

  var studio = null;
  var studioItems = [];
  var studioLibrary = 'My Library';
  var studioPlayer = null;
  var studioSort = 'recent';

  function studioOpen() {
    return !!(studio && studio.classList.contains('open'));
  }

  function studioSVG() {
    return '<svg class="nx-st-illustration" viewBox="0 0 330 230" fill="none" aria-hidden="true">' +
      '<ellipse cx="165" cy="120" rx="125" ry="82" stroke="#8a969e" stroke-width="1.5" stroke-dasharray="3 5"></ellipse>' +
      '<g transform="rotate(-27 162 55)">' +
        '<rect x="114" y="33" width="96" height="46" rx="4" fill="#fff" stroke="#4b5a64" stroke-width="2"></rect>' +
        '<path d="M114 47h96" stroke="#4b5a64" stroke-width="2"></path>' +
        '<path d="M120 37l15 10M138 37l15 10M156 37l15 10M174 37l15 10M192 37l11 7" stroke="#4b5a64" stroke-width="3"></path>' +
      '</g>' +
      '<g transform="rotate(-16 91 130)">' +
        '<rect x="44" y="99" width="94" height="62" rx="8" fill="#bfe3f3" stroke="#4b5a64" stroke-width="2"></rect>' +
        '<path d="M77 118l23 12-23 12z" fill="#fff" stroke="#4b5a64" stroke-width="2"></path>' +
        '<circle cx="57" cy="111" r="4" fill="#fff" stroke="#4b5a64" stroke-width="2"></circle>' +
      '</g>' +
      '<g>' +
        '<rect x="231" y="92" width="48" height="40" rx="5" fill="#8fbf63" stroke="#4b5a64" stroke-width="2"></rect>' +
        '<rect x="239" y="84" width="28" height="12" rx="3" fill="#739c52" stroke="#4b5a64" stroke-width="2"></rect>' +
        '<circle cx="255" cy="112" r="12" fill="#7ea7c9" stroke="#4b5a64" stroke-width="2"></circle>' +
        '<circle cx="255" cy="112" r="6" fill="#d7eaf5"></circle>' +
        '<path d="M231 124l-14 16h60l-10-16" fill="#8fbf63" stroke="#4b5a64" stroke-width="2"></path>' +
        '<rect x="216" y="139" width="66" height="8" rx="4" fill="#6f8f53" stroke="#4b5a64" stroke-width="2"></rect>' +
      '</g>' +
      '<g>' +
        '<circle cx="168" cy="172" r="23" fill="#9aa5ad" stroke="#4b5a64" stroke-width="2"></circle>' +
        '<circle cx="168" cy="172" r="10" fill="#d9dee2" stroke="#4b5a64" stroke-width="2"></circle>' +
        '<circle cx="168" cy="172" r="4" fill="#2f3b46"></circle>' +
        '<path d="M154 191h28l6 14h-40z" fill="#7b8790" stroke="#4b5a64" stroke-width="2"></path>' +
        '<circle cx="194" cy="192" r="3" fill="#c0392b"></circle>' +
      '</g>' +
      '<g stroke="#4b5a64" stroke-width="2" fill="#fff">' +
        '<rect x="106" y="152" width="40" height="30" rx="3" transform="rotate(-15 126 167)"></rect>' +
        '<path d="M110 158l8 5M118 155l8 5M126 152l8 5"></path>' +
      '</g>' +
    '</svg>';
  }

  function buildStudio() {
    studio = doc.createElement('div');
    studio.id = 'nx-studio';
    studio.innerHTML =
      '<div class="nx-st-top">' +
        '<div class="nx-st-brand" aria-hidden="true">' +
          '<svg width="38" height="30" viewBox="0 0 38 30" fill="none">' +
            '<rect x="3" y="2" width="32" height="26" rx="3" stroke="#4c5d68" stroke-width="2"></rect>' +
            '<rect x="3" y="2" width="9" height="26" fill="#dfe5e9"></rect>' +
            '<rect x="26" y="2" width="9" height="26" fill="#dfe5e9"></rect>' +
            '<path d="M15 10l8 5-8 5z" fill="#4c5d68"></path>' +
            '<path d="M6 6h3M6 12h3M6 18h3M6 24h3M29 6h3M29 12h3M29 18h3M29 24h3" stroke="#4c5d68" stroke-width="2"></path>' +
          '</svg>' +
        '</div>' +
        '<div class="nx-st-tabs">' +
          '<button type="button" class="nx-st-tab active" data-st-tab="library">My Library</button>' +
          '<button type="button" class="nx-st-tab" data-st-tab="settings">Settings</button>' +
        '</div>' +
      '</div>' +
      '<div class="nx-st-scroll">' +
        '<div class="nx-st-head">' +
          '<h1>My Library</h1>' +
          '<div class="nx-st-tools">' +
            '<button type="button" class="nx-st-icon" data-st-action="help" aria-label="Help" title="Help">' +
              '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"></circle><path d="M9.6 9.2a2.6 2.6 0 1 1 3.4 2.5c-.7.3-1 .8-1 1.5v.4"></path><circle cx="12" cy="17.2" r="1" fill="currentColor" stroke="none"></circle></svg>' +
            '</button>' +
            '<button type="button" class="nx-st-icon" data-st-action="search" aria-label="Search" title="Search">' +
              '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="M15.5 15.5L21 21"></path></svg>' +
            '</button>' +
            '<button type="button" class="nx-st-btn" data-st-action="filter">Filter</button>' +
            '<button type="button" class="nx-st-btn nx-st-primary" data-st-action="create"><span style="font-size:18px;line-height:1">+</span> Create <span style="font-size:11px">&#9662;</span></button>' +
          '</div>' +
        '</div>' +
        '<div class="nx-st-grid">' +
          '<aside class="nx-st-side">' +
            '<label class="nx-st-sort-label" for="nx-st-sort">Sort Collections by</label>' +
            '<select class="nx-st-sort" id="nx-st-sort">' +
              '<option value="recent">Date: Most recent on top</option>' +
              '<option value="oldest">Date: Oldest on top</option>' +
              '<option value="name">Name: A to Z</option>' +
            '</select>' +
            '<div class="nx-st-tree">' +
              '<button type="button" class="nx-st-tree-item active" data-lib="My Library">' +
                '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"></path></svg>' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"></path></svg>' +
                'My Library <span class="nx-st-plus">+</span>' +
              '</button>' +
              '<button type="button" class="nx-st-tree-item" data-lib="Shared Library">' +
                '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 18l6-6-6-6z"></path></svg>' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"></path></svg>' +
                'Shared Library' +
              '</button>' +
              '<button type="button" class="nx-st-tree-item" data-lib="Archive">' +
                '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 18l6-6-6-6z"></path></svg>' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16v3H4z"></path><path d="M5 10v9h14v-9"></path><path d="M9 14h6"></path></svg>' +
                'Archive' +
              '</button>' +
            '</div>' +
          '</aside>' +
          '<section class="nx-st-pane">' +
            '<div class="nx-st-pane-head" id="nx-st-pane-head">My Library</div>' +
            '<div class="nx-st-empty" id="nx-st-empty">' +
              studioSVG() +
              '<h2>Nothing here yet!</h2>' +
              '<p>Add some videos to your collection.</p>' +
              '<button type="button" class="nx-st-btn nx-st-primary" id="nx-st-add"><span style="font-size:18px;line-height:1">+</span> Add Videos</button>' +
            '</div>' +
            '<div class="nx-st-list" id="nx-st-list" hidden></div>' +
          '</section>' +
        '</div>' +
      '</div>' +
      '<input type="file" id="nx-st-file" accept="video/*" multiple hidden>';

    doc.body.appendChild(studio);

    var file = studio.querySelector('#nx-st-file');
    studio.querySelector('#nx-st-add').addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () {
      var files = this.files || [];
      var added = 0;
      for (var i = 0; i < files.length; i++) {
        var f = files[i];
        if (f.type && f.type.indexOf('video/') !== 0) continue;
        studioItems.push({
          name: f.name || 'Untitled video',
          size: f.size || 0,
          date: Date.now(),
          url: window.URL.createObjectURL(f)
        });
        added++;
      }
      this.value = '';
      if (added) {
        renderStudio();
        notify(added === 1 ? 'Video added to My Library.' : added + ' videos added to My Library.');
      } else {
        notify('Choose a video file.');
      }
    });

    var tree = studio.querySelectorAll('[data-lib]');
    for (var t = 0; t < tree.length; t++) {
      tree[t].addEventListener('click', function () {
        studioLibrary = this.getAttribute('data-lib');
        for (var i = 0; i < tree.length; i++) tree[i].classList.toggle('active', tree[i] === this);
        renderStudio();
      });
    }

    studio.querySelector('#nx-st-sort').addEventListener('change', function () {
      studioSort = this.value;
      renderStudio();
    });

    var actions = studio.querySelectorAll('[data-st-action]');
    for (var a = 0; a < actions.length; a++) {
      actions[a].addEventListener('click', function () {
        var action = this.getAttribute('data-st-action');
        if (action === 'search') notify('Search is not available yet.');
        else if (action === 'filter') notify('Filters are not available yet.');
        else if (action === 'create') notify('Create is not available yet.');
        else notify('Studio help is not available yet.');
      });
    }

    var tabs = studio.querySelectorAll('[data-st-tab]');
    for (var b = 0; b < tabs.length; b++) {
      tabs[b].addEventListener('click', function () {
        if (this.getAttribute('data-st-tab') === 'settings') {
          notify('Studio settings are not available yet.');
        }
      });
    }
  }

  function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return Math.round(bytes / 1024) + ' KB';
    return bytes + ' B';
  }

  function renderStudio() {
    if (!studio) return;
    var paneHead = studio.querySelector('#nx-st-pane-head');
    var empty = studio.querySelector('#nx-st-empty');
    var list = studio.querySelector('#nx-st-list');
    var add = studio.querySelector('#nx-st-add');
    paneHead.textContent = studioLibrary;

    var mine = studioLibrary === 'My Library';
    var items = mine ? studioItems.slice() : [];
    if (studioSort === 'oldest') items.sort(function (a, b) { return a.date - b.date; });
    else if (studioSort === 'name') items.sort(function (a, b) { return a.name.localeCompare(b.name); });
    else items.sort(function (a, b) { return b.date - a.date; });

    if (!items.length) {
      empty.hidden = false;
      list.hidden = true;
      list.innerHTML = '';
      var h2 = empty.querySelector('h2');
      var p = empty.querySelector('p');
      if (h2) h2.textContent = mine ? 'Nothing here yet!' : 'This collection is empty.';
      if (p) p.textContent = mine ? 'Add some videos to your collection.' : 'Videos in this collection will appear here.';
      if (add) add.style.display = mine ? '' : 'none';
      return;
    }

    empty.hidden = true;
    list.hidden = false;
    list.innerHTML = '';
    if (add) add.style.display = 'none';

    for (var i = 0; i < items.length; i++) {
      (function (item) {
        var row = doc.createElement('div');
        row.className = 'nx-st-item';
        row.innerHTML =
          '<div class="nx-st-thumb"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg></div>' +
          '<div class="nx-st-meta"><div class="nx-st-name">' + esc(item.name) + '</div>' +
            '<div class="nx-st-sub">' + esc(formatSize(item.size)) + (item.size ? ' &middot; ' : '') + esc(new Date(item.date).toLocaleDateString()) + '</div></div>' +
          '<button type="button" class="nx-st-play">Play</button>' +
          '<button type="button" class="nx-st-remove">Remove</button>';
        row.querySelector('.nx-st-play').addEventListener('click', function () { playStudioItem(item); });
        row.querySelector('.nx-st-remove').addEventListener('click', function () {
          var at = studioItems.indexOf(item);
          if (at >= 0) studioItems.splice(at, 1);
          try { window.URL.revokeObjectURL(item.url); } catch (e) {}
          renderStudio();
          notify('Video removed.');
        });
        list.appendChild(row);
      })(items[i]);
    }
  }

  function playStudioItem(item) {
    closePlayer();
    var player = doc.createElement('div');
    player.className = 'nx-st-player';
    player.innerHTML =
      '<div class="nx-st-player-box">' +
        '<button type="button" class="nx-st-player-close" aria-label="Close player">&times;</button>' +
        '<video controls autoplay playsinline></video>' +
      '</div>';
    player.querySelector('video').src = item.url;
    player.querySelector('.nx-st-player-close').addEventListener('click', closePlayer);
    player.addEventListener('click', function (e) { if (e.target === player) closePlayer(); });
    doc.body.appendChild(player);
    studioPlayer = player;
  }

  function closePlayer() {
    if (!studioPlayer) return;
    var video = studioPlayer.querySelector('video');
    if (video) { video.pause(); video.removeAttribute('src'); try { video.load(); } catch (e) {} }
    if (studioPlayer.parentNode) studioPlayer.parentNode.removeChild(studioPlayer);
    studioPlayer = null;
  }

  function openStudio() {
    if (!studio) buildStudio();
    studio.classList.add('open');
    try { window.__nxCanvasStudioOpen = true; } catch (e) {}
    var hits = doc.querySelectorAll('.sidebar-hit');
    for (var i = 0; i < hits.length; i++) hits[i].classList.remove('active');
    var studioHit = doc.querySelector('.sidebar-hit.studio');
    if (studioHit) studioHit.classList.add('active');
    renderStudio();
  }

  function closeStudio() {
    if (!studio) return;
    studio.classList.remove('open');
    try { window.__nxCanvasStudioOpen = false; } catch (e) {}
    var studioHit = doc.querySelector('.sidebar-hit.studio');
    if (studioHit) studioHit.classList.remove('active');
    closePlayer();
  }

  /* Sidebar capture: Studio opens the library, any other destination closes it
     and lets the Canvas app handle the click normally. */
  root.addEventListener('click', function (e) {
    var hit = e.target && e.target.closest ? e.target.closest('.sidebar-hit') : null;
    if (!hit) {
      var onAnchor = menuState && menuState.anchor && menuState.anchor.contains(e.target);
      if (menu && !onAnchor && !menu.contains(e.target)) closeMenu();
      return;
    }
    if (menu) closeMenu();
    var nav = hit.getAttribute('data-nav');
    if (nav === 'Studio') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      openStudio();
      return;
    }
    if (studioOpen()) closeStudio();
  }, true);

  root.addEventListener('keydown', onKey, true);
  window.addEventListener('scroll', function () { if (menu) closeMenu(); }, true);
  window.addEventListener('resize', function () { if (menu) closeMenu(); });

  style();
  enhanceCards();
  try {
    var observer = new MutationObserver(function () { enhanceCards(); });
    observer.observe(cardsEl, { childList: true });
  } catch (e) {}

  try {
    window.__nxCanvasMenuOpen = false;
    window.__nxCanvasStudioOpen = false;
  } catch (e) {}
})();

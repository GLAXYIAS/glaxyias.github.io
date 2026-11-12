/* Canvas dashboard enhancements: covers, view switcher, new dashboard,
   and the Courses drawer. Loaded after Canvas/custom.js. */
(function () {
  'use strict';

  var doc = document;
  var root = (typeof shadow !== 'undefined' && shadow) ? shadow : document;
  var cardsEl = doc.getElementById('cards');
  if (!cardsEl) return;

  var MODE_KEY = 'nxCanvasDashMode_v1';
  var OVERLAY_KEY = 'nxCanvasColorOverlay_v1';
  var mode = 'card';
  var colorOn = true;
  try {
    var savedMode = window.localStorage.getItem(MODE_KEY);
    if (savedMode === 'list' || savedMode === 'card') mode = savedMode;
    if (window.localStorage.getItem(OVERLAY_KEY) === '0') colorOn = false;
  } catch (e) {}

  var dashMenu = null;
  var dashMenuAnchor = null;
  var coursesOpen = false;
  var newDashOpen = false;
  var coursesPanel = null;
  var newDash = null;
  var coverCache = {};

  var DOTS_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle></svg>';
  var CHECK_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>';
  var CLOSE_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
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
    clearTimeout(window.__nxDashToast);
    window.__nxDashToast = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  function save(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) {}
  }

  function syncFlag() {
    try {
      window.__nxCanvasMenuOpen = !!(dashMenu || coursesOpen || newDashOpen ||
        (root.querySelector && root.querySelector('.nx-card-menu')));
    } catch (e) {}
  }

  function injectStyle() {
    if (doc.getElementById('nx-dashboard-css')) return;
    var el = doc.createElement('style');
    el.id = 'nx-dashboard-css';
    el.textContent = [
      '.nx-dash-tools{display:flex;align-items:center;gap:12px;margin-left:auto;padding-left:18px;flex-shrink:0}',
      '.nx-switch-btn{height:38px;padding:0 14px;border:1px solid #c7cdd1;background:#fff;border-radius:3px;color:#2f3b46;font-size:12px;line-height:1.15;white-space:nowrap}',
      '.nx-switch-btn:hover{background:#f2f5f7}',
      '.nx-dash-dots{width:52px;height:38px;border:1px solid #0b5a9c;border-radius:3px;background:#fff;color:#0b5a9c;display:flex;align-items:center;justify-content:center;padding:0}',
      '.nx-dash-dots:hover{background:#eef5fa}',
      '.nx-has-tools{height:auto!important;min-height:85px;flex-wrap:wrap;padding:12px 0;gap:10px}',
      '#cards.nx-list-view{display:flex;flex-direction:column;gap:14px}',
      '#cards.nx-list-view .card{display:flex;height:118px}',
      '#cards.nx-list-view .card-image{width:190px;height:100%;flex:0 0 auto}',
      '#cards.nx-list-view .card-body{flex:1;min-width:0;padding:13px 18px}',
      '#cards.nx-list-view .card-title{font-size:16px}',
      '#cards.nx-color-off .nx-card-tint{opacity:0!important}',
      '.nx-card-image-cover{background-size:cover!important;background-position:center!important}',
      '.nx-dash-menu{position:fixed;width:242px;background:#fff;border:1px solid #cbd3d8;box-shadow:0 8px 24px rgba(0,0,0,.23);z-index:92;color:#2f3b46;font:14px/1.35 Arial,Helvetica,sans-serif}',
      '.nx-dm-head{padding:12px 16px 10px;border-bottom:1px solid #dce2e6;font-weight:600;font-size:15px}',
      '.nx-dm-item{display:flex;align-items:center;gap:10px;width:100%;border:0;background:#fff;padding:10px 16px;text-align:left;font-size:14px;color:#2f3b46}',
      '.nx-dm-item:hover{background:#eef3f7}',
      '.nx-dm-item.checked{background:#e8f1f8}',
      '.nx-dm-check{width:18px;height:18px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;color:#0b5a9c}',
      '.nx-dm-item:last-child{border-bottom:0}',
      '.nx-recent-strip{margin:18px 0 0;background:#fff;border:1px solid #d9e0e4;border-radius:5px;padding:14px 18px}',
      '.nx-recent-strip h3{margin:0 0 8px;font-size:14px;color:#33424d}',
      '.nx-recent-strip ul{margin:0;padding:0;list-style:none;font-size:13px;color:#4f606b}',
      '.nx-recent-strip li{padding:4px 0;border-bottom:1px solid #edf0f2}',
      '.nx-recent-strip li:last-child{border-bottom:0}',
      '.nx-recent-strip a{color:#0b5a9c;text-decoration:underline}',
      '#nx-courses-panel{position:fixed;left:54px;top:0;bottom:0;width:390px;max-width:calc(100vw - 54px);background:#fff;z-index:29;box-shadow:5px 0 24px rgba(0,0,0,.18);display:none;flex-direction:column;color:#2f3b46;font:14px/1.4 Arial,Helvetica,sans-serif}',
      '#nx-courses-panel.open{display:flex}',
      '.nx-cp-head{display:flex;align-items:center;justify-content:space-between;padding:22px 24px 16px;border-bottom:1px solid #e2e7ea;flex:0 0 auto}',
      '.nx-cp-head h2{font-size:25px;font-weight:500;margin:0;color:#273843}',
      '.nx-cp-close{width:38px;height:38px;border:1px solid #0b5a9c;border-radius:3px;background:#fff;color:#0b5a9c;display:flex;align-items:center;justify-content:center;padding:0}',
      '.nx-cp-close:hover{background:#eef5fa}',
      '.nx-cp-allpad{padding:16px 24px 6px;flex:0 0 auto}',
      '.nx-cp-all{display:inline-block;color:#0b5a9c;font-size:17px;text-decoration:none;background:none;border:0;padding:4px 0}',
      '.nx-cp-list{overflow:auto;padding:0 24px 24px}',
      '.nx-cp-item{display:block;width:100%;border:0;border-bottom:1px solid #e8edef;background:#fff;text-align:left;padding:16px 0;color:#0b5a9c}',
      '.nx-cp-item:last-child{border-bottom:0}',
      '.nx-cp-item:hover .nx-cp-name{text-decoration:underline}',
      '.nx-cp-name{font-size:16px;margin-bottom:7px}',
      '.nx-cp-meta{font-size:12px;color:#65747d;line-height:1.45}',
      '.nx-cp-empty{padding:20px 0;color:#65747d;font-size:13px}',
      '.nx-cp-x{display:flex;align-items:center;justify-content:center}',

      '#nx-new-dash{position:fixed;left:54px;top:0;right:0;bottom:0;background:#fff;z-index:24;display:none;overflow:auto;color:#2f3b46;font:14px/1.45 Arial,Helvetica,sans-serif}',
      '#nx-new-dash.open{display:block}',
      '.nx-nd-inner{max-width:1120px;margin:0 auto;padding:30px 32px 50px}',
      '.nx-nd-top{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}',
      '.nx-nd-top h1{font-size:36px;font-weight:500;margin:0;color:#26353f}',
      '.nx-nd-old{height:40px;padding:0 14px;border:1px solid #c7cdd1;background:#fff;border-radius:3px;color:#2f3b46;font-size:13px;white-space:nowrap}',
      '.nx-nd-old:hover{background:#f4f6f8}',
      '.nx-nd-tabs{display:flex;margin-top:30px;border-bottom:1px solid #dce2e6;gap:28px}',
      '.nx-nd-tab{border:0;background:none;padding:0 0 13px;font-size:15px;color:#33424d;border-bottom:3px solid transparent;margin-bottom:-1px}',
      '.nx-nd-tab.active{border-bottom-color:#0b5a9c;color:#26353f;font-weight:600}',
      '.nx-nd-tab:hover{color:#0b5a9c}',
      '.nx-nd-card{margin-top:36px;background:#fff;border:1px solid #dce2e6;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,.16);padding:26px 30px}',
      '.nx-nd-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}',
      '.nx-nd-card-head h2{font-size:27px;font-weight:500;margin:0;color:#26353f}',
      '.nx-nd-summary{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#2f3b46}',
      '.nx-nd-summary input{position:absolute;opacity:0;pointer-events:none}',
      '.nx-nd-track{width:46px;height:26px;border-radius:14px;background:#0a8f08;position:relative;cursor:pointer;flex:0 0 auto}',
      '.nx-nd-track::after{content:"";position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .15s}',
      '.nx-nd-summary input:not(:checked)+.nx-nd-track{background:#9aa5ad}',
      '.nx-nd-summary input:not(:checked)+.nx-nd-track::after{left:23px}',
      '.nx-nd-filters{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:24px}',
      '.nx-nd-field label{display:block;font-size:13px;font-weight:600;margin-bottom:6px}',
      '.nx-nd-field select{width:100%;height:38px;border:1px solid #b9c3ca;border-radius:3px;background:#fff;padding:0 8px;font-size:14px;color:#2f3b46}',
      '.nx-nd-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:22px}',
      '.nx-nd-stat{background:#f7f8f9;min-height:108px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px}',
      '.nx-nd-stat strong{font-size:27px;font-weight:500}',
      '.nx-nd-stat span{font-size:13px}',
      '.nx-nd-stat.due strong{color:#0b5a9c}.nx-nd-stat.due span{color:#0b5a9c}',
      '.nx-nd-stat.missing strong{color:#b3261e}.nx-nd-stat.missing span{color:#b3261e}',
      '.nx-nd-stat.submitted strong{color:#2e7d32}.nx-nd-stat.submitted span{color:#2e7d32}',
      '.nx-nd-assignment{display:flex;align-items:center;gap:16px;margin-top:24px;padding-top:4px;flex-wrap:wrap}',
      '.nx-nd-assign-icon{width:62px;height:62px;border-radius:4px;background:#e8f4fb;display:flex;align-items:center;justify-content:center;color:#0b5a9c;flex:0 0 auto}',
      '.nx-nd-assign-main{flex:1;min-width:180px}',
      '.nx-nd-assign-main h3{font-size:15px;margin:0 0 7px;color:#26353f;font-weight:600}',
      '.nx-nd-assign-main p{margin:0;color:#65747d;font-size:12px;line-height:1.45}',
      '.nx-nd-assign-main a{color:#0b5a9c;text-decoration:underline;cursor:pointer}',
      '.nx-nd-due{background:#e8f4fb;color:#33424d;border-radius:3px;padding:8px 10px;font-size:12px;display:flex;align-items:center;gap:7px}',
      '.nx-nd-course-wrap{margin-top:26px}',
      '.nx-nd-course-wrap h2{font-size:23px;font-weight:500;margin:0 0 12px}',
      '.nx-nd-course-list{border-top:1px solid #e4e9ec}',
      '.nx-nd-course-item{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #e8edef;background:#fff;padding:15px 0;color:#0b5a9c}',
      '.nx-nd-course-item:hover .nx-cp-name{text-decoration:underline}',
      '.nx-nd-course-name{font-size:16px;margin-bottom:5px}',
      '.nx-nd-course-meta{font-size:12px;color:#65747d;line-height:1.45}',

      '@media(max-width:760px){.nx-dash-tools{width:100%;padding-left:0}.nx-switch-btn{flex:1}.nx-nd-inner{padding:20px 18px 36px}.nx-nd-top h1{font-size:28px}.nx-nd-card{padding:20px 18px;margin-top:24px}.nx-nd-filters{grid-template-columns:1fr;gap:12px}.nx-nd-stats{grid-template-columns:1fr;gap:10px}.nx-nd-assignment{align-items:flex-start}.nx-cp-head{padding:18px 18px 14px}.nx-cp-list{padding:0 18px 20px}.nx-cp-allpad{padding:14px 18px 4px}#nx-courses-panel{width:calc(100vw - 54px)}}'
    ].join('\n');
    (doc.head || doc.documentElement).appendChild(el);
  }

  function removeOverlayClose() {
    try {
      var x = window.document.getElementById('nx-canvas-close');
      if (x) x.remove();
    } catch (e) {}
  }

  /* ------------------------------------------------------------- covers */

  var COVERS = {
    spanish: { a: '#0e7c6b', b: '#24a37d', text: '#ffffff', accent: '#ffd166', label: '¡BIENVENIDOS!', sub: 'SPANISH 1' },
    science: { a: '#0b2420', b: '#1d4a3c', text: '#eafff2', accent: '#a7e3a0', label: 'ADVANCED', sub: 'SCIENCE' },
    english: { a: '#f6ecd8', b: '#e6cfa8', text: '#5b3b22', accent: '#b8865a', label: 'ENGLISH', sub: 'LANGUAGE ARTS' },
    pe: { a: '#6cc4ef', b: '#2d7fb8', text: '#ffffff', accent: '#ffd166', label: 'PHYSICAL', sub: 'EDUCATION' },
    georgia: { a: '#173d2b', b: '#3b6b4a', text: '#ffffff', accent: '#f2a65a', label: 'GEORGIA', sub: 'STUDIES' },
    math: { a: '#f7b8c8', b: '#ef8eaa', text: '#402433', accent: '#ffffff', label: 'MATH', sub: '8TH GRADE' },
    tech: { a: '#1f3a5f', b: '#0b5a9c', text: '#ffffff', accent: '#7fd1ff', label: 'TECHNOLOGY', sub: '' },
    generic: { a: '#4b3b8f', b: '#7b5cd6', text: '#ffffff', accent: '#e0c3ff', label: 'COURSE', sub: '' }
  };

  function coverKind(title) {
    var t = String(title || '').toLowerCase();
    if (t.indexOf('spanish') >= 0) return 'spanish';
    if (t.indexOf('science') >= 0) return 'science';
    if (t.indexOf('language arts') >= 0 || t.indexOf('english') >= 0) return 'english';
    if (t.indexOf('physical ed') >= 0 || /(^|\s)pe(\s|$)/.test(t)) return 'pe';
    if (t.indexOf('georgia') >= 0) return 'georgia';
    if (t.indexOf('math') >= 0) return 'math';
    if (t.indexOf('technology') >= 0) return 'tech';
    return 'generic';
  }

  function coverFor(title) {
    var kind = coverKind(title);
    if (coverCache[kind]) return coverCache[kind];
    var th = COVERS[kind] || COVERS.generic;
    var label = th.label;
    var sub = th.sub;
    if (kind === 'generic') {
      label = String(title || 'COURSE').toUpperCase();
      if (label.length > 22) label = label.slice(0, 21) + '…';
      sub = 'COURSE';
    }
    var labelSize = label.length > 17 ? 38 : (label.length > 11 ? 48 : 60);
    var art = '';
    if (kind === 'spanish') {
      art = '<circle cx="520" cy="70" r="62" fill="' + th.accent + '" opacity=".62"></circle>' +
        '<circle cx="590" cy="215" r="42" fill="#ffffff" opacity=".16"></circle>' +
        '<circle cx="460" cy="220" r="9" fill="' + th.accent + '"></circle>' +
        '<circle cx="392" cy="74" r="6" fill="#ff6b35"></circle>' +
        '<circle cx="550" cy="165" r="7" fill="#ffd166"></circle>' +
        '<rect x="480" y="135" width="16" height="9" rx="2" fill="#ffffff" opacity=".45" transform="rotate(22 488 139)"></rect>';
    } else if (kind === 'science') {
      art = '<circle cx="505" cy="82" r="38" stroke="' + th.accent + '" stroke-width="4" fill="none" opacity=".62"></circle>' +
        '<circle cx="505" cy="82" r="10" fill="' + th.accent + '" opacity=".6"></circle>' +
        '<path d="M540 180l30-54h18l-29 37h24l-32 62h-11l20-38z" fill="' + th.accent + '" opacity=".55"></path>' +
        '<path d="M465 210l55-100" stroke="#ffffff" stroke-width="2" opacity=".3"></path>';
    } else if (kind === 'english') {
      art = '<rect x="470" y="65" width="120" height="22" rx="3" fill="' + th.accent + '" opacity=".65" transform="rotate(-4 530 76)"></rect>' +
        '<rect x="462" y="93" width="128" height="22" rx="3" fill="#9f6b45" opacity=".55" transform="rotate(3 526 104)"></rect>' +
        '<rect x="476" y="121" width="105" height="22" rx="3" fill="' + th.accent + '" opacity=".8" transform="rotate(-2 528 132)"></rect>' +
        '<path d="M490 150h70" stroke="#8a5a35" stroke-width="2" opacity=".3"></path>';
    } else if (kind === 'pe') {
      art = '<circle cx="520" cy="120" r="54" fill="#ffffff" opacity=".3"></circle>' +
        '<path d="M476 91c24 24 44 52 56 82M492 78c16 30 22 60 18 86M558 92c-18 24-28 50-32 76" stroke="#ffffff" stroke-width="3" fill="none" opacity=".7"></path>' +
        '<circle cx="465" cy="190" r="22" fill="' + th.accent + '" opacity=".6"></circle>';
    } else if (kind === 'georgia') {
      art = '<circle cx="530" cy="120" r="58" fill="' + th.accent + '" opacity=".82"></circle>' +
        '<path d="M516 70c8-18 26-22 38-12-8 14-20 19-38 12z" fill="#6aa84f" opacity=".8"></path>' +
        '<path d="M530 62v24" stroke="#6aa84f" stroke-width="4"></path>' +
        '<circle cx="580" cy="205" r="39" fill="#ffffff" opacity=".12"></circle>';
    } else if (kind === 'math') {
      art = '<text x="500" y="98" font-family="Arial" font-size="58" font-weight="700" fill="#ffffff" opacity=".6">+</text>' +
        '<text x="575" y="180" font-family="Arial" font-size="54" font-weight="700" fill="#ffffff" opacity=".5">÷</text>' +
        '<path d="M480 205h110" stroke="#ffffff" stroke-width="3" opacity=".5"></path>' +
        '<circle cx="505" cy="212" r="5" fill="#ffffff" opacity=".6"></circle>' +
        '<circle cx="530" cy="212" r="5" fill="#ffffff" opacity=".6"></circle>';
    } else if (kind === 'tech') {
      art = '<path d="M470 90h60v45h45v55h40" stroke="' + th.accent + '" stroke-width="3" fill="none" opacity=".6"></path>' +
        '<circle cx="470" cy="90" r="7" fill="' + th.accent + '"></circle>' +
        '<circle cx="615" cy="190" r="7" fill="' + th.accent + '"></circle>' +
        '<rect x="490" y="180" width="60" height="42" rx="5" stroke="#ffffff" stroke-width="2" fill="none" opacity=".35"></rect>';
    } else {
      art = '<circle cx="520" cy="120" r="70" fill="#ffffff" opacity=".12"></circle>' +
        '<circle cx="580" cy="200" r="36" fill="' + th.accent + '" opacity=".3"></circle>';
    }
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + th.a + '"></stop><stop offset="1" stop-color="' + th.b + '"></stop></linearGradient></defs>' +
      '<rect width="640" height="300" fill="url(#g)"></rect>' +
      '<circle cx="70" cy="265" r="95" fill="#ffffff" opacity=".08"></circle>' +
      '<circle cx="610" cy="25" r="85" fill="#ffffff" opacity=".07"></circle>' +
      art +
      '<text x="38" y="164" font-family="Arial Black, Arial, sans-serif" font-size="' + labelSize + '" font-weight="900" fill="' + th.text + '">' + esc(label) + '</text>' +
      (sub ? '<text x="41" y="202" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="3" fill="' + th.text + '" opacity=".78">' + esc(sub) + '</text>' : '') +
      '</svg>';
    coverCache[kind] = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    return coverCache[kind];
  }

  function enhanceCovers() {
    var nodes = cardsEl.querySelectorAll('.card');
    for (var i = 0; i < nodes.length; i++) {
      var card = nodes[i];
      var image = card.querySelector('.card-image');
      if (!image) continue;
      if (image.style.backgroundImage) continue;
      if (!image.classList.contains('no-image')) continue;
      var titleEl = card.querySelector('.card-title');
      var title = titleEl ? titleEl.textContent.trim() : '';
      var textNodes = [];
      for (var j = 0; j < image.childNodes.length; j++) {
        var child = image.childNodes[j];
        if (child.nodeType === 3 && child.nodeValue && child.nodeValue.trim()) textNodes.push(child);
      }
      for (var k = 0; k < textNodes.length; k++) image.removeChild(textNodes[k]);
      image.classList.remove('no-image');
      image.classList.add('nx-card-image-cover');
      image.style.backgroundImage = 'url("' + coverFor(title) + '")';
      image.setAttribute('data-nx-cover', coverKind(title));
    }
  }

  /* --------------------------------------------------------- dashboard UI */

  function buildToolbar() {
    if (doc.getElementById('nx-switch-new')) return;
    var header = doc.querySelector('#viewDash .header');
    if (!header) return;
    header.classList.add('nx-has-tools');
    var tools = doc.createElement('div');
    tools.className = 'nx-dash-tools';
    tools.innerHTML =
      '<button type="button" class="nx-switch-btn" id="nx-switch-new">Switch to new dashboard view</button>' +
      '<button type="button" class="nx-dash-dots" id="nx-dash-dots" aria-label="Dashboard options" title="Dashboard options">' + DOTS_SVG + '</button>';
    header.appendChild(tools);
    doc.getElementById('nx-switch-new').addEventListener('click', function () {
      openNewDash();
    });
    doc.getElementById('nx-dash-dots').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (dashMenu) closeDashMenu();
      else openDashMenu(this);
    });
  }

  function applyMode() {
    cardsEl.classList.toggle('nx-list-view', mode === 'list');
  }

  function applyOverlay() {
    cardsEl.classList.toggle('nx-color-off', !colorOn);
  }

  function menuItem(checked, label, attrs) {
    return '<button type="button" class="nx-dm-item' + (checked ? ' checked' : '') + '" ' + attrs + '>' +
      '<span class="nx-dm-check">' + (checked ? CHECK_SVG : '') + '</span>' + label + '</button>';
  }

  function openDashMenu(anchor) {
    closeDashMenu();
    dashMenuAnchor = anchor;
    dashMenu = doc.createElement('div');
    dashMenu.className = 'nx-dash-menu';
    dashMenu.innerHTML =
      '<div class="nx-dm-head">Dashboard View</div>' +
      menuItem(mode === 'card', 'Card View', 'data-dm="card"') +
      menuItem(mode === 'list', 'List View', 'data-dm="list"') +
      menuItem(!!doc.getElementById('nx-recent-strip'), 'Recent Activity', 'data-dm="recent"') +
      menuItem(colorOn, 'Color Overlay', 'data-dm="overlay"');
    doc.body.appendChild(dashMenu);

    var rect = anchor.getBoundingClientRect();
    var width = 242;
    var left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
    dashMenu.style.left = Math.round(left) + 'px';
    dashMenu.style.top = Math.round(rect.bottom + 6) + 'px';

    var items = dashMenu.querySelectorAll('[data-dm]');
    for (var i = 0; i < items.length; i++) {
      items[i].addEventListener('click', function () {
        var action = this.getAttribute('data-dm');
        if (action === 'card' || action === 'list') {
          mode = action;
          save(MODE_KEY, mode);
          applyMode();
          closeDashMenu();
          notify(mode === 'list' ? 'List view enabled.' : 'Card view enabled.');
        } else if (action === 'overlay') {
          colorOn = !colorOn;
          save(OVERLAY_KEY, colorOn ? '1' : '0');
          applyOverlay();
          closeDashMenu();
          notify(colorOn ? 'Color overlay on.' : 'Color overlay off.');
        } else if (action === 'recent') {
          toggleRecent();
          closeDashMenu();
        }
      });
    }
    syncFlag();
  }

  function closeDashMenu() {
    if (dashMenu && dashMenu.parentNode) dashMenu.parentNode.removeChild(dashMenu);
    dashMenu = null;
    dashMenuAnchor = null;
    syncFlag();
  }

  function toggleRecent() {
    var existing = doc.getElementById('nx-recent-strip');
    if (existing) {
      existing.parentNode.removeChild(existing);
      notify('Recent activity hidden.');
      return;
    }
    var strip = doc.createElement('div');
    strip.id = 'nx-recent-strip';
    strip.className = 'nx-recent-strip';
    var items = doc.querySelectorAll('#todoList .todo-item');
    var rows = '';
    for (var i = 0; i < items.length && i < 4; i++) {
      var link = items[i].querySelector('a');
      var small = items[i].querySelector('small');
      rows += '<li>' + (link ? link.textContent : 'Activity') + (small ? ' <span style="color:#7a8993">— ' + small.innerText.replace(/\s+/g, ' ') + '</span>' : '') + '</li>';
    }
    strip.innerHTML = '<h3>Recent Activity</h3>' + (rows ? '<ul>' + rows + '</ul>' : '<div style="font-size:13px;color:#65747d">No recent activity.</div>');
    var header = doc.querySelector('#viewDash .header');
    if (header && header.parentNode) header.parentNode.insertBefore(strip, header.nextSibling);
    notify('Recent activity shown.');
  }

  /* ------------------------------------------------------------ new dash */

  function profileName() {
    try {
      var raw = window.localStorage.getItem('canvasDashProfile_v3');
      if (raw) {
        var p = JSON.parse(raw);
        if (p && p.name && p.name.trim()) return p.name.trim();
      }
    } catch (e) {}
    var pf = doc.getElementById('pfName');
    if (pf && pf.textContent.trim() && pf.textContent.trim() !== 'Student') return pf.textContent.trim();
    return 'Student';
  }

  function courseData(card) {
    var titleEl = card.querySelector('.card-title');
    var subs = card.querySelectorAll('.card-sub');
    return {
      title: titleEl ? titleEl.textContent.trim() : 'Course',
      subtitle: subs[0] ? subs[0].textContent.trim() : '',
      school: subs[1] ? subs[1].textContent.trim() : ''
    };
  }

  function openCourse(card) {
    closeCourses();
    closeNewDash();
    if (card && card.click) card.click();
  }

  function courseButtons(container, compact) {
    container.innerHTML = '';
    var cards = cardsEl.querySelectorAll('.card');
    if (!cards.length) {
      container.innerHTML = '<div class="nx-cp-empty">No courses yet.</div>';
      return;
    }
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        var d = courseData(card);
        var btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = compact ? 'nx-nd-course-item' : 'nx-cp-item';
        btn.innerHTML =
          '<div class="' + (compact ? 'nx-nd-course-name' : 'nx-cp-name') + '">' + esc(d.title) + '</div>' +
          '<div class="' + (compact ? 'nx-nd-course-meta' : 'nx-cp-meta') + '">' +
            (d.subtitle ? esc(d.subtitle) + '<br>' : '') +
            (d.school ? esc(d.school) : '') +
          '</div>';
        btn.addEventListener('click', function () { openCourse(card); });
        container.appendChild(btn);
      })(cards[i]);
    }
  }

  function buildCoursesPanel() {
    if (coursesPanel) return;
    coursesPanel = doc.createElement('aside');
    coursesPanel.id = 'nx-courses-panel';
    coursesPanel.setAttribute('aria-label', 'Courses');
    coursesPanel.innerHTML =
      '<div class="nx-cp-head"><h2>Courses</h2><button type="button" class="nx-cp-close" aria-label="Close courses">' + CLOSE_SVG + '</button></div>' +
      '<div class="nx-cp-allpad"><button type="button" class="nx-cp-all">All Courses</button></div>' +
      '<div class="nx-cp-list" id="nx-cp-list"></div>';
    doc.body.appendChild(coursesPanel);
    coursesPanel.querySelector('.nx-cp-close').addEventListener('click', closeCourses);
    coursesPanel.querySelector('.nx-cp-all').addEventListener('click', function () {
      closeCourses();
      var d = doc.querySelector('.sidebar-hit.dashboard');
      if (d) d.click();
    });
  }

  function openCourses() {
    buildCoursesPanel();
    closeDashMenu();
    courseButtons(doc.getElementById('nx-cp-list'), false);
    coursesPanel.classList.add('open');
    coursesOpen = true;
    syncFlag();
  }

  function closeCourses() {
    if (!coursesPanel) return;
    coursesPanel.classList.remove('open');
    coursesOpen = false;
    syncFlag();
  }

  function buildNewDash() {
    if (newDash) return;
    newDash = doc.createElement('div');
    newDash.id = 'nx-new-dash';
    newDash.innerHTML =
      '<div class="nx-nd-inner">' +
        '<div class="nx-nd-top"><h1>Hello, <span id="nx-nd-name">Student</span>!</h1>' +
          '<button type="button" class="nx-nd-old" id="nx-nd-old">Switch to old dashboard view</button></div>' +
        '<div class="nx-nd-tabs">' +
          '<button type="button" class="nx-nd-tab active" data-nd-tab="dashboard">Dashboard</button>' +
          '<button type="button" class="nx-nd-tab" data-nd-tab="courses">Courses</button>' +
        '</div>' +
        '<div class="nx-nd-pane" data-nd-pane="dashboard">' +
          '<div class="nx-nd-card">' +
            '<div class="nx-nd-card-head"><h2>Course work</h2>' +
              '<label class="nx-nd-summary"><input type="checkbox" id="nx-nd-summary" checked><span class="nx-nd-track"></span>Show summary counts</label>' +
            '</div>' +
            '<div class="nx-nd-filters">' +
              '<div class="nx-nd-field"><label for="nx-nd-course">Course filter:</label><select id="nx-nd-course"><option>All Courses</option></select></div>' +
              '<div class="nx-nd-field"><label for="nx-nd-status">Submission status:</label><select id="nx-nd-status"><option>Not submitted</option><option>Submitted</option><option>Missing</option><option>All</option></select></div>' +
            '</div>' +
            '<div class="nx-nd-stats" id="nx-nd-stats">' +
              '<div class="nx-nd-stat due"><strong>1</strong><span>Due</span></div>' +
              '<div class="nx-nd-stat missing"><strong>10</strong><span>Missing</span></div>' +
              '<div class="nx-nd-stat submitted"><strong>101</strong><span>Submitted</span></div>' +
            '</div>' +
            '<div class="nx-nd-assignment">' +
              '<div class="nx-nd-assign-icon"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M8 7h8M8 11h8M8 15h5"></path><path d="M15 18l2 2 4-4" stroke-width="2"></path></svg></div>' +
              '<div class="nx-nd-assign-main"><h3>DW.1 Your Daily Warm-Up Google Doc</h3>' +
                '<p>Q2 Marketing 8th Grade (Harden) &nbsp;|&nbsp; <a id="nx-nd-goto">Go to course</a></p><p>100 pts</p></div>' +
              '<div class="nx-nd-due"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M8 3v4M16 3v4M3 10h18"></path></svg>12/16/2026 04:00 PM</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="nx-nd-pane" data-nd-pane="courses" hidden>' +
          '<div class="nx-nd-course-wrap"><h2>Courses</h2><div class="nx-nd-course-list" id="nx-nd-course-list"></div></div>' +
        '</div>' +
      '</div>';
    doc.body.appendChild(newDash);

    newDash.querySelector('#nx-nd-old').addEventListener('click', closeNewDash);
    newDash.querySelector('#nx-nd-summary').addEventListener('change', function () {
      var stats = newDash.querySelector('#nx-nd-stats');
      if (stats) stats.hidden = !this.checked;
    });

    var tabs = newDash.querySelectorAll('[data-nd-tab]');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function () {
        var tab = this.getAttribute('data-nd-tab');
        for (var j = 0; j < tabs.length; j++) tabs[j].classList.toggle('active', tabs[j] === this);
        var panes = newDash.querySelectorAll('[data-nd-pane]');
        for (var k = 0; k < panes.length; k++) panes[k].hidden = panes[k].getAttribute('data-nd-pane') !== tab;
        if (tab === 'courses') courseButtons(newDash.querySelector('#nx-nd-course-list'), true);
      });
    }

    var goto = newDash.querySelector('#nx-nd-goto');
    if (goto) goto.addEventListener('click', openCourses);

    var select = newDash.querySelector('#nx-nd-course');
    var cards = cardsEl.querySelectorAll('.card');
    for (var c = 0; c < cards.length; c++) {
      var d = courseData(cards[c]);
      var opt = doc.createElement('option');
      opt.textContent = d.title;
      select.appendChild(opt);
    }
  }

  function openNewDash() {
    buildNewDash();
    closeDashMenu();
    closeCourses();
    var name = newDash.querySelector('#nx-nd-name');
    if (name) name.textContent = profileName();
    newDash.classList.add('open');
    newDashOpen = true;
    var activeTab = newDash.querySelector('.nx-nd-tab[data-nd-tab="dashboard"]');
    if (activeTab) activeTab.click();
    syncFlag();
  }

  function closeNewDash() {
    if (!newDash) return;
    newDash.classList.remove('open');
    newDashOpen = false;
    syncFlag();
  }

  /* --------------------------------------------------------------- events */

  function onKey(e) {
    if (e.key !== 'Escape' && e.keyCode !== 27) return;
    if (dashMenu) {
      closeDashMenu();
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (coursesOpen) {
      closeCourses();
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (newDashOpen) {
      closeNewDash();
      e.preventDefault();
      e.stopPropagation();
    }
  }

  root.addEventListener('click', function (e) {
    var hit = e.target && e.target.closest ? e.target.closest('.sidebar-hit') : null;
    if (hit) {
      var nav = hit.getAttribute('data-nav');
      if (nav === 'Courses') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (coursesOpen) closeCourses();
        else openCourses();
        return;
      }
      if (nav === 'Studio') {
        closeCourses();
        closeDashMenu();
        return;
      }
      if (nav === 'Dashboard' && newDashOpen) closeNewDash();
      closeCourses();
      closeDashMenu();
      return;
    }

    if (dashMenu && !dashMenu.contains(e.target) && !(dashMenuAnchor && dashMenuAnchor.contains(e.target))) closeDashMenu();
    if (coursesOpen && coursesPanel && !coursesPanel.contains(e.target)) closeCourses();
  }, true);

  doc.addEventListener('keydown', onKey, true);
  window.addEventListener('resize', function () { if (dashMenu) closeDashMenu(); });

  removeOverlayClose();
  injectStyle();
  buildToolbar();
  applyMode();
  applyOverlay();
  enhanceCovers();

  try {
    var observer = new MutationObserver(function () { enhanceCovers(); });
    observer.observe(cardsEl, { childList: true });
  } catch (e) {}

  syncFlag();
})();

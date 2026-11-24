// Master Dynamic Theme Switcher Engine
// Keeps data-theme, theme-* body classes, and storage keys in sync.
// Also guards against debug.js leaking --nx-* vars onto :root.

function nxScopeDebugStyles() {
  const style = document.getElementById('nx-v102-styles');
  if (!style || !style.textContent) return;
  if (style.dataset.nxScoped === '1') return;
  // Debug menu used to inject :root{--nx-accent:...} which overwrote site theme colors.
  // Scope those variables to the debug UI only.
  style.textContent = style.textContent.replace(
    /:root\s*\{(--nx-[^}]+)\}/,
    '#nx-hud,#nx-trigger,#nx-inspector-overlay,#nx-toast-wrap,#nx-matrix-canvas,.nx-toast-wrap{$1}'
  );
  style.dataset.nxScoped = '1';
  // Clear any leaked inline/custom props on the document root
  const root = document.documentElement;
  ['--nx-bg','--nx-panel','--nx-border','--nx-accent','--nx-text','--nx-muted','--nx-danger','--nx-warning','--nx-success'].forEach(function (v) {
    root.style.removeProperty(v);
  });
}

window.applyTheme = function(themeName) {
  const name = themeName || 'default';

  nxScopeDebugStyles();

  // Remove previous theme-* classes
  const classesToRemove = Array.from(document.body.classList).filter(cls =>
    cls.startsWith('theme-')
  );
  classesToRemove.forEach(cls => document.body.classList.remove(cls));

  // Apply class for themes.css selectors that use body.theme-*
  if (name && name !== 'default') {
    document.body.classList.add('theme-' + name);
  }

  // Apply data-theme for themes.css selectors that use [data-theme="..."]
  document.documentElement.setAttribute('data-theme', name);
  document.body.setAttribute('data-theme', name);

  // Keep all historical storage keys in sync so settings/debug/newsettings agree
  localStorage.setItem('nullx-theme', name);
  localStorage.setItem('selectedTheme', name);
  localStorage.setItem('nxos_theme', name);
};

document.addEventListener('DOMContentLoaded', () => {
  // Run guard early and keep watching in case debug injects styles later
  nxScopeDebugStyles();
  try {
    const mo = new MutationObserver(function () { nxScopeDebugStyles(); });
    mo.observe(document.head || document.documentElement, { childList: true, subtree: true });
  } catch (e) {}

  const savedTheme =
    localStorage.getItem('selectedTheme') ||
    localStorage.getItem('nullx-theme') ||
    localStorage.getItem('nxos_theme') ||
    'default';

  window.applyTheme(savedTheme);

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.theme-card, .theme-option');
    if (card) {
      const selectedTheme = card.getAttribute('data-theme') || card.dataset.theme;
      if (selectedTheme) window.applyTheme(selectedTheme);
    }
  });

  // Replace Terminal sidebar entry with Calculator (no Terminal pages)
  const navTerm = document.getElementById('nav-terminal');
  if (navTerm) {
    navTerm.id = 'nav-calculator';
    navTerm.innerHTML = '<i class="fas fa-calculator" style="margin-right: 8px;"></i>Calculator';
    navTerm.onclick = function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (typeof clearAllViews === 'function') clearAllViews();
      if (typeof updateNavActiveState === 'function') updateNavActiveState('nav-calculator');
      else {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        navTerm.classList.add('active');
      }
      let sec = document.getElementById('calculatorSection') || document.getElementById('terminalSection');
      if (sec) {
        sec.id = 'calculatorSection';
        sec.style.setProperty('display', 'block', 'important');
        sec.innerHTML =
          '<h2 style="margin-top:0;color:#fff;font-family:sans-serif;">Calculator</h2>' +
          '<iframe src="calculator/index.html" title="Calculator" ' +
          'style="width:100%;height:calc(100vh - 160px);min-height:520px;border:1px solid rgba(255,138,0,0.35);' +
          'border-radius:8px;background:#000;"></iframe>';
      }
    };
  }
});


// Load full lockscreen hook (Alt+L / Ctrl+L -> Lockscreen/Lockscreen.html)
(function loadNxLockHook() {
  if (document.querySelector('script[data-nx-lock-hook]')) return;
  var s = document.createElement('script');
  s.src = (function () {
    try {
      return new URL('/JS/nx-lock-hook.js', window.location.origin).href;
    } catch (e) {
      return '/JS/nx-lock-hook.js';
    }
  })();
  s.setAttribute('data-nx-lock-hook', '1');
  (document.head || document.documentElement).appendChild(s);
})();

/* Site extras: the extra Settings themes plus the System News styles.
   Injected here (before the news markup is parsed) so a missing stylesheet
   can never leave the news feed rendered as a block at the page bottom. */
(function () {
  if (document.getElementById('nx-site-extras')) return;
  var css = `
/* ==========================================================
   SETTINGS CATALOG THEMES (previously missing their CSS)
   ========================================================== */
[data-theme="crimson"], body.theme-crimson {
  --bg-dashboard: #0d0606;
  --bg-sidebar: #1a0a0a;
  --accent-color: #ff3b3b;
  --accent-hover: #ff6666;
  --border-color: rgba(255, 59, 59, 0.22);
  --text-main: #fff2f2;
  --text-muted: #a88080;
}
[data-theme="purple"], body.theme-purple {
  --bg-dashboard: #0b0813;
  --bg-sidebar: #130d22;
  --accent-color: #8b00ff;
  --accent-hover: #a033ff;
  --border-color: rgba(139, 0, 255, 0.18);
  --text-main: #ffffff;
  --text-muted: #8d84a0;
}
[data-theme="cyan"], body.theme-cyan {
  --bg-dashboard: #041018;
  --bg-sidebar: #071b26;
  --accent-color: #00f2ff;
  --accent-hover: #66f7ff;
  --border-color: rgba(0, 242, 255, 0.2);
  --text-main: #e8fdff;
  --text-muted: #7fa8ad;
}
[data-theme="emerald"], body.theme-emerald {
  --bg-dashboard: #04140c;
  --bg-sidebar: #072115;
  --accent-color: #00ff88;
  --accent-hover: #55ffaa;
  --border-color: rgba(0, 255, 136, 0.2);
  --text-main: #eafff4;
  --text-muted: #7bab93;
}
[data-theme="rose"], body.theme-rose {
  --bg-dashboard: #1a0a12;
  --bg-sidebar: #260f1b;
  --accent-color: #ff5ca8;
  --accent-hover: #ff8cc4;
  --border-color: rgba(255, 92, 168, 0.22);
  --text-main: #fff0f7;
  --text-muted: #b08092;
}

/* ==========================================================
   NEW THEMES PACK
   ========================================================== */
[data-theme="sakura"], body.theme-sakura {
  --bg-dashboard: #1a0f13;
  --bg-sidebar: #241419;
  --accent-color: #ff8fb1;
  --accent-hover: #ffb3cb;
  --border-color: rgba(255, 143, 177, 0.22);
  --text-main: #fff2f6;
  --text-muted: #b08d99;
}
[data-theme="abyss"], body.theme-abyss {
  --bg-dashboard: #03060f;
  --bg-sidebar: #070d1c;
  --accent-color: #2f7fff;
  --accent-hover: #66a3ff;
  --border-color: rgba(47, 127, 255, 0.22);
  --text-main: #eaf1ff;
  --text-muted: #7a8fad;
}
[data-theme="ember"], body.theme-ember {
  --bg-dashboard: #160a04;
  --bg-sidebar: #221006;
  --accent-color: #ff6b35;
  --accent-hover: #ff8f61;
  --border-color: rgba(255, 107, 53, 0.22);
  --text-main: #fff1e8;
  --text-muted: #b08a76;
}
[data-theme="mint"], body.theme-mint {
  --bg-dashboard: #04120f;
  --bg-sidebar: #071f1a;
  --accent-color: #4fffc4;
  --accent-hover: #8cffd8;
  --border-color: rgba(79, 255, 196, 0.22);
  --text-main: #e9fff9;
  --text-muted: #7bada2;
}
[data-theme="nebula"], body.theme-nebula {
  --bg-dashboard: #08030f;
  --bg-sidebar: #100619;
  --accent-color: #b26bff;
  --accent-hover: #c99aff;
  --border-color: rgba(178, 107, 255, 0.22);
  --text-main: #f4ecff;
  --text-muted: #9480ad;
}
[data-theme="vapor"], body.theme-vapor {
  --bg-dashboard: #0f0416;
  --bg-sidebar: #190726;
  --accent-color: #ff77e1;
  --accent-hover: #ffa8ec;
  --border-color: rgba(255, 119, 225, 0.22);
  --text-main: #fdeeff;
  --text-muted: #a97ab0;
}
[data-theme="honey"], body.theme-honey {
  --bg-dashboard: #141004;
  --bg-sidebar: #1f1a07;
  --accent-color: #ffc93c;
  --accent-hover: #ffd970;
  --border-color: rgba(255, 201, 60, 0.22);
  --text-main: #fff9e8;
  --text-muted: #ab9c74;
}
[data-theme="obsidian"], body.theme-obsidian {
  --bg-dashboard: #060608;
  --bg-sidebar: #0d0d12;
  --accent-color: #9b8cff;
  --accent-hover: #b6aaff;
  --border-color: rgba(155, 140, 255, 0.2);
  --text-main: #f1f0ff;
  --text-muted: #85849c;
}

/* ==========================================================
   SYSTEM NEWS (top-bar button + modal)
   These rules used to live inside the anti-host lock page's
   markup, so on the real site the feed rendered as an
   unstyled block at the bottom of the page.
   ========================================================== */
#system-news-modal {
  position: fixed;
  inset: 0;
  z-index: 200000;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.84);
  backdrop-filter: blur(8px);
  box-sizing: border-box;
}
#system-news-modal.show { display: flex !important; }
#system-news-modal .snm-box {
  width: min(520px, 100%);
  max-height: min(80vh, 640px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #0a0a0a;
  border: 1px solid #e07a00;
  border-radius: 14px;
  box-shadow: 0 0 40px rgba(255, 138, 0, 0.3);
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
}
#system-news-modal .snm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 138, 0, 0.35);
  flex-shrink: 0;
}
#system-news-modal .snm-header h3 { margin: 0; font-size: 1.1rem; color: #fff; }
#system-news-modal .snm-close {
  background: transparent;
  border: none;
  color: #aaa;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 6px;
}
#system-news-modal .snm-close:hover { color: #fff; }
#system-news-modal .snm-feed {
  overflow-y: auto;
  padding: 14px 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
#system-news-modal .news-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 138, 0, 0.25);
  border-radius: 10px;
  padding: 12px 14px;
}
#system-news-modal .news-tag {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #f59e0b;
  margin-bottom: 6px;
}
#system-news-modal .news-card p { margin: 0 0 8px; color: #e6c4a0; font-size: 0.9rem; line-height: 1.45; }
#system-news-modal .news-date { font-size: 0.75rem; color: #888; }

#system-news-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 9px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 138, 0, 0.45);
  background: rgba(255, 138, 0, 0.12);
  color: #f0922a;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
#system-news-btn:hover {
  background: rgba(255, 138, 0, 0.26);
  border-color: #e07a00;
  box-shadow: 0 0 14px rgba(255, 138, 0, 0.35);
}
#system-news-btn:focus-visible { outline: 2px solid #f59e0b; outline-offset: 2px; }
#system-news-btn .news-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4444;
  margin-right: 6px;
  box-shadow: 0 0 8px #ff4444;
  vertical-align: middle;
}

/* Favorite marker as a Google star SVG instead of a text glyph. */
.game-card.is-favorite::before {
  content: '';
  width: 16px;
  height: 16px;
  position: absolute;
  top: 10px;
  right: 15px;
  z-index: 5;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffd700'%3E%3Cpath d='M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'/%3E%3C/svg%3E") center/contain no-repeat;
}
`;
  var style = document.createElement('style');
  style.id = 'nx-site-extras';
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
})();

/* ---------------------------------------------------------------------------
   Lock screen: show the signed-in user's profile picture on the lock overlay
   instead of the generic person icon. Falls back to imgs/newpfp.png.
   --------------------------------------------------------------------------- */
(function () {
  if (window.__nxLockPfpLoaded) return;
  window.__nxLockPfpLoaded = true;

  var API = 'https://apithingy.jlsniperelite4.workers.dev';
  var DEFAULT_PFP = 'https://glaxyias.github.io/imgs/newpfp.png';
  var LEGACY_PFP = /\/imgs\/Screenshot(?:%20|\s|\+)2026-09-26(?:%20|\s|\+)15\.55\.05\.png$/i;

  function currentUser() {
    try { return (localStorage.getItem('chatUser') || '').trim(); } catch (e) { return ''; }
  }

  function cleanPfp(url) {
    if (!url) return '';
    var s = String(url).trim();
    if (!s || LEGACY_PFP.test(s)) return '';
    return s;
  }

  function apply() {
    var overlay = document.getElementById('pin-lock-overlay');
    if (!overlay) return;
    var icon = overlay.querySelector('.nx-user-icon');
    if (!icon) return;

    var img = overlay.querySelector('img.nx-lock-pfp');
    if (!img) {
      img = document.createElement('img');
      img.className = 'nx-user-icon nx-lock-pfp';
      img.alt = 'User icon';
      img.style.cssText = 'object-fit:cover;border-radius:50%;display:none;background:#1a1024;';
      img.addEventListener('load', function () {
        icon.style.display = 'none';
        img.style.display = 'block';
      });
      img.addEventListener('error', function () {
        img.remove();
        icon.style.display = '';
      });
      icon.parentNode.insertBefore(img, icon.nextSibling);
    }

    var name = currentUser();
    if (img.dataset.nxPfpFor === name && img.getAttribute('src')) return;
    img.dataset.nxPfpFor = name;

    var cached = '';
    try {
      var hit = JSON.parse(localStorage.getItem('nx_lock_pfp') || 'null');
      if (hit && hit.u === name) cached = cleanPfp(hit.url);
    } catch (e) {}
    img.src = cached || DEFAULT_PFP;

    if (!name) return;
    fetch(API + '/user-roles?username=' + encodeURIComponent(name), {
      headers: { 'Content-Type': 'application/json' }
    })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (row) {
        var url = cleanPfp(row && row.pfp_url) || DEFAULT_PFP;
        if (url === img.src) return;
        img.src = url;
        try {
          if (url.length < 200000) {
            localStorage.setItem('nx_lock_pfp', JSON.stringify({ u: name, url: url }));
          }
        } catch (e) {}
      })
      .catch(function () {});
  }

  function watch() {
    apply();
    try {
      var obs = new MutationObserver(function () {
        if (document.getElementById('pin-lock-overlay')) apply();
      });
      obs.observe(document.body, { childList: true });
    } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();
})();

/* Load the material-icon layer (emoji -> Google SVGs, Ctrl+Shift+P canvas,
   and the same shortcut inside same-origin game frames). */
(function loadNxEmojiIcons() {
  if (document.querySelector('script[data-nx-emoji-icons]')) return;
  var s = document.createElement('script');
  s.src = (function () {
    try { return new URL('/JS/nx-emoji-icons.js', window.location.origin).href; }
    catch (e) { return '/JS/nx-emoji-icons.js'; }
  })();
  s.setAttribute('data-nx-emoji-icons', '1');
  (document.head || document.documentElement).appendChild(s);
})();

/* Background picker used by the Settings page/modal. */
(function () {
  var PALETTES = {
    purple: { bg: '#000000', sidebar: '#000000', accent: '#e07a00', hover: '#f59e0b', border: '#e07a00', text: '#f0922a', muted: '#b86a12' },
    cyan:   { bg: '#04121c', sidebar: '#062033', accent: '#00c2ff', hover: '#38d6ff', border: '#114a63', text: '#e0f6ff', muted: '#93c9dd' },
    crimson:{ bg: '#1a0410', sidebar: '#26061a', accent: '#ff2d55', hover: '#ff5c7c', border: '#6b1730', text: '#ffe6ec', muted: '#d19aa9' },
    emerald:{ bg: '#04170f', sidebar: '#06241a', accent: '#00d97e', hover: '#33e69a', border: '#12603f', text: '#e2fff2', muted: '#93ccb0' },
    gold:   { bg: '#161103', sidebar: '#221a05', accent: '#f5b301', hover: '#ffc633', border: '#6b530f', text: '#fff6dc', muted: '#d3bd85' },
    mono:   { bg: '#0b0b0f', sidebar: '#14141a', accent: '#c9c9d4', hover: '#e6e6ef', border: '#33333d', text: '#f2f2f6', muted: '#a0a0ad' }
  };

  var CHOICES = [
    { key: 'purple', site: 'default', name: 'Null Orange', desc: 'Pitch black with darker orange outlines' },
    { key: 'cyan', site: 'cyan', name: 'Cyber Cyan', desc: 'Deep blue-black with cyan accents' },
    { key: 'crimson', site: 'crimson', name: 'Crimson', desc: 'Dark red surfaces with crimson accents' },
    { key: 'emerald', site: 'emerald', name: 'Emerald', desc: 'Forest black with emerald accents' },
    { key: 'gold', site: 'gold', name: 'Gold', desc: 'Warm black with gold accents' },
    { key: 'mono', site: 'mono', name: 'Mono Chrome', desc: 'Black and grey with no colour tint' }
  ];

  function storedTheme() {
    try {
      var raw = localStorage.getItem('nxup_theme');
      if (raw) {
        var parsed = JSON.parse(raw);
        if (typeof parsed === 'string' && parsed) return parsed;
      }
    } catch (e) {}
    var selected = '';
    try { selected = localStorage.getItem('selectedTheme') || ''; } catch (e) {}
    if (selected === 'default' || !selected) return 'purple';
    return PALETTES[selected] ? selected : 'purple';
  }

  function ensureBackgroundPicker() {
    if (document.getElementById('nx-bg-modal')) return;
    var cards = CHOICES.map(function (item) {
      return '<button type="button" class="nx-bg-choice" data-bg-key="' + item.key + '" data-bg-site="' + item.site + '" data-bg-name="' + item.name + '" data-bg-desc="' + item.desc + '" aria-pressed="false" onclick="nxChooseBackground(this)">' +
        '<img src="/Settings/previews/' + item.key + '.svg" alt="' + item.name + ' dashboard preview" loading="lazy">' +
        '<span class="nx-bg-choice-copy"><strong>' + item.name + '</strong><small>' + item.desc + '</small></span>' +
        '<span class="nx-bg-tick" aria-hidden="true">&check;</span>' +
      '</button>';
    }).join('');
    var modal = document.createElement('div');
    modal.id = 'nx-bg-modal';
    modal.className = 'nx-bg-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML =
      '<div class="nx-bg-panel" role="dialog" aria-modal="true" aria-labelledby="nx-bg-title">' +
        '<header class="nx-bg-head"><div><h2 id="nx-bg-title">Choose a background</h2><p>Real previews of the dashboard. Pick one and it applies immediately.</p></div>' +
        '<button type="button" class="nx-bg-close" aria-label="Close background picker" onclick="nxCloseBackgroundPicker()">&times;</button></header>' +
        '<div class="nx-bg-grid">' + cards + '</div>' +
        '<footer class="nx-bg-foot"><span>Your choice is saved for this browser.</span><button type="button" onclick="nxCloseBackgroundPicker()">Done</button></footer>' +
      '</div>';
    modal.addEventListener('click', function (event) {
      if (event.target === modal) window.nxCloseBackgroundPicker();
    });
    document.body.appendChild(modal);
  }

  function syncCurrent(choice) {
    if (!choice) return;
    var name = choice.getAttribute('data-bg-name') || 'Background';
    var desc = choice.getAttribute('data-bg-desc') || '';
    var image = choice.querySelector('img');
    var nameEl = document.getElementById('nxbgCurrentName');
    var descEl = document.getElementById('nxbgCurrentDesc');
    var imageEl = document.getElementById('nxbgCurrentPreview');
    if (nameEl && nameEl.textContent !== name) nameEl.textContent = name;
    if (descEl && descEl.textContent !== desc) descEl.textContent = desc;
    if (imageEl && image && imageEl.getAttribute('src') !== image.getAttribute('src')) imageEl.src = image.src;
    var choices = document.querySelectorAll('.nx-bg-choice');
    for (var i = 0; i < choices.length; i++) {
      var active = choices[i] === choice;
      choices[i].classList.toggle('nx-active', active);
      choices[i].setAttribute('aria-pressed', active ? 'true' : 'false');
    }
  }

  window.nxInitBackgroundPicker = function (scope) {
    var root = scope || document;
    if (!root.querySelector('.nx-bg-current')) return;
    ensureBackgroundPicker();
    var choices = document.querySelectorAll('.nx-bg-choice');
    if (!choices.length) return;
    var key = storedTheme();
    var selected = document.querySelector('.nx-bg-choice[data-bg-key="' + key + '"]') || choices[0];
    syncCurrent(selected);
  };

  window.nxOpenBackgroundPicker = function () {
    ensureBackgroundPicker();
    var modal = document.getElementById('nx-bg-modal');
    if (!modal) return;
    window.nxInitBackgroundPicker(document);
    modal.classList.add('nx-open');
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('nx-bg-open');
    var close = modal.querySelector('.nx-bg-close');
    if (close) close.focus();
  };

  window.nxCloseBackgroundPicker = function () {
    var modal = document.getElementById('nx-bg-modal');
    if (!modal) return;
    modal.classList.remove('nx-open');
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('nx-bg-open');
  };

  window.nxChooseBackground = function (choice) {
    if (!choice) return;
    var key = choice.getAttribute('data-bg-key') || 'purple';
    var site = choice.getAttribute('data-bg-site') || 'default';
    var palette = PALETTES[key] || PALETTES.purple;
    try {
      localStorage.setItem('nxup_theme', JSON.stringify(key));
      localStorage.setItem('selectedTheme', site);
      localStorage.setItem('nullx-theme', site);
      localStorage.setItem('nxos_theme', site);
    } catch (e) {}
    if (typeof window.applyTheme === 'function') window.applyTheme(site);
    var root = document.documentElement;
    root.setAttribute('data-nxup-theme', key);
    root.style.setProperty('--bg-dashboard', palette.bg);
    root.style.setProperty('--bg-sidebar', palette.sidebar);
    root.style.setProperty('--accent', palette.accent);
    root.style.setProperty('--accent-color', palette.accent);
    root.style.setProperty('--accent-hover', palette.hover);
    root.style.setProperty('--border-color', palette.border);
    root.style.setProperty('--text-main', palette.text);
    root.style.setProperty('--text-muted', palette.muted);
    root.style.setProperty('--bg-gradient', 'linear-gradient(135deg,' + palette.sidebar + ',' + palette.bg + ')');
    syncCurrent(choice);
  };

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') window.nxCloseBackgroundPicker();
  });

  function initWhenReady() {
    if (document.querySelector('.nx-bg-current')) window.nxInitBackgroundPicker(document);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initWhenReady);
  else setTimeout(initWhenReady, 0);
  try {
    var observer = new MutationObserver(function () {
      if (!document.querySelector('.nx-bg-current')) return;
      observer.disconnect();
      window.nxInitBackgroundPicker(document);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } catch (e) {}
})();

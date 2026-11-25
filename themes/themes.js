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

  // The background picker below owns the full 44-theme catalog. Let it apply
  // the palette (including the dashboard CSS variables) so every theme choice
  // is visible everywhere instead of only being written to localStorage.
  if (window.NXThemes && typeof window.NXThemes.apply === 'function') {
    window.NXThemes.apply(name, { persist: true });
    return;
  }

  // Fallback used only before the picker script has evaluated.
  const classesToRemove = Array.from(document.body.classList).filter(cls =>
    cls.startsWith('theme-')
  );
  classesToRemove.forEach(cls => document.body.classList.remove(cls));
  if (name && name !== 'default') {
    document.body.classList.add('theme-' + name);
  }
  document.documentElement.setAttribute('data-theme', name);
  document.body.setAttribute('data-theme', name);
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
/* The animated palettes are driven from themes.js now; disable the old
   body-level keyframes so they cannot overwrite the inline variables. */
body.theme-rgb, body.theme-matrix, body.theme-neon, body.theme-surge,
body.theme-void, body.theme-aether, body.theme-inferno, body.theme-cryo,
body.theme-techno { animation: none !important; }

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
  background: var(--bg-sidebar, #0a0a0a);
  border: 1px solid var(--accent-color, #e07a00);
  border-radius: 14px;
  box-shadow: 0 0 40px color-mix(in srgb, var(--accent-color, #e07a00) 30%, transparent);
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
}
#system-news-modal .snm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color, rgba(255, 138, 0, 0.35));
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
  border: 1px solid var(--border-color, rgba(255, 138, 0, 0.25));
  border-radius: 10px;
  padding: 12px 14px;
}
#system-news-modal .news-tag {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent-color, #f59e0b);
  margin-bottom: 6px;
}
#system-news-modal .news-card p { margin: 0 0 8px; color: var(--text-muted, #e6c4a0); font-size: 0.9rem; line-height: 1.45; }
#system-news-modal .news-date { font-size: 0.75rem; color: #888; }

#system-news-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 9px 14px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--accent-color, #e07a00) 45%, transparent);
  background: color-mix(in srgb, var(--accent-color, #e07a00) 12%, transparent);
  color: var(--accent-color, #f0922a);
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
#system-news-btn:hover {
  background: color-mix(in srgb, var(--accent-color, #e07a00) 26%, transparent);
  border-color: var(--accent-color, #e07a00);
  box-shadow: 0 0 14px color-mix(in srgb, var(--accent-color, #e07a00) 35%, transparent);
}
#system-news-btn:focus-visible { outline: 2px solid var(--accent-hover, #f59e0b); outline-offset: 2px; }
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
  var FEATURED = [
    { key: 'purple', site: 'default', name: 'Null Orange', desc: 'Pitch black with darker orange outlines', preview: '/Settings/previews/purple.svg' },
    { key: 'cyan', site: 'cyan', name: 'Cyber Cyan', desc: 'Deep blue-black with cyan accents', preview: '/Settings/previews/cyan.svg' },
    { key: 'crimson', site: 'crimson', name: 'Crimson', desc: 'Dark red surfaces with crimson accents', preview: '/Settings/previews/crimson.svg' },
    { key: 'emerald', site: 'emerald', name: 'Emerald', desc: 'Forest black with emerald accents', preview: '/Settings/previews/emerald.svg' },
    { key: 'gold', site: 'gold', name: 'Gold', desc: 'Warm black with gold accents', preview: '/Settings/previews/gold.svg' },
    { key: 'mono', site: 'mono', name: 'Mono Chrome', desc: 'Black and grey with no colour tint', preview: '/Settings/previews/mono.svg' }
  ];

  var PALETTES = {
    purple: { bg: '#000000', sidebar: '#000000', accent: '#e07a00', hover: '#f59e0b', border: '#e07a00', text: '#f0922a', muted: '#b86a12' },
    cyan:   { bg: '#04121c', sidebar: '#062033', accent: '#00c2ff', hover: '#38d6ff', border: '#114a63', text: '#e0f6ff', muted: '#93c9dd' },
    crimson:{ bg: '#1a0410', sidebar: '#26061a', accent: '#ff2d55', hover: '#ff5c7c', border: '#6b1730', text: '#ffe6ec', muted: '#d19aa9' },
    emerald:{ bg: '#04170f', sidebar: '#06241a', accent: '#00d97e', hover: '#33e69a', border: '#12603f', text: '#e2fff2', muted: '#93ccb0' },
    gold:   { bg: '#161103', sidebar: '#221a05', accent: '#f5b301', hover: '#ffc633', border: '#6b530f', text: '#fff6dc', muted: '#d3bd85' },
    mono:   { bg: '#0b0b0f', sidebar: '#14141a', accent: '#c9c9d4', hover: '#e6e6ef', border: '#33333d', text: '#f2f2f6', muted: '#a0a0ad' }
  };

  /* Every classic background that used to sit on the Settings page, restored.
     [key, name, description, page bg, sidebar bg, accent, hover, border, text, muted] */
  var CLASSIC = [
    ['midnight', 'Midnight', 'Pitch black with grey borders and white text', '#000000,#0a0a0a,#444444,#666666,#333333,#ffffff,#aaaaaa'],
    ['vampire', 'Vampire Red', 'Dark red surfaces with a blood-red accent', '#0d0202,#160505,#ff0000,#ff3333,#5a1010,#ffffff,#aa8888'],
    ['ocean', 'Ocean Deep', 'Deep blue-black with an ocean-blue accent', '#020b14,#051425,#0088ff,#33a2ff,#123a5c,#e6f3ff,#739ec6'],
    ['forest', 'Forest Druid', 'Forest-black with a druid-green accent', '#030c05,#08170b,#00cc44,#22ff66,#124a26,#ebf7ed,#7da683'],
    ['cyberpunk', 'Cyberpunk 2077', 'Neon yellow and cyan on a purple-black page', '#1c0024,#001219,#fcee0a,#ffff55,#00f0ff,#00f0ff,#fcee0a'],
    ['toxic', 'Toxic Waste', 'Swamp black with a toxic acid-green accent', '#0f1402,#192104,#a3ff00,#b8ff33,#334d00,#f0ffdb,#8b9973'],
    ['solar', 'Solar Flare', 'Blackened orange with a solar flare accent', '#140700,#240d02,#ff5500,#ff7733,#5c2000,#fff0e6,#c49980'],
    ['ice', 'Ice Blizzard', 'Frosty blue-black with a bright ice accent', '#0f191c,#17272c,#00f3ff,#66f7ff,#1e5f66,#e6fdff,#8ca3a6'],
    ['arcade', '80s Arcade', 'Retro purple with hot pink and cyan neon', '#120421,#21022b,#ff007f,#ff3399,#390099,#00ffff,#9e0059'],
    ['bubblegum', 'Bubblegum', 'Pastel bubblegum pinks on a dark plum page', '#261c21,#3d2b34,#ffb7b2,#ffc6ff,#ffc6ff,#fff0f5,#b5839c'],
    ['desert', 'Desert Strike', 'Sand-black with a desert gold accent', '#14120c,#211e14,#d4af37,#e5c158,#4a422d,#f5f2eb,#8f866e'],
    ['royal', 'Royal Luxury', 'Dark violet with royal gold trim', '#0f0314,#1b0a24,#ffd700,#fff066,#4d4100,#ffffff,#b386cc'],
    ['ghost', 'Ghostly', 'Slate black with a ghostly grey-blue accent', '#11161a,#1d242a,#708090,#93a3b1,#2a3138,#f0f4f8,#546573'],
    ['espresso', 'Cocoa Espresso', 'Cocoa-black with a warm espresso accent', '#0f0b08,#1c140f,#875c36,#a67649,#3b2a1e,#fcf8f5,#9c8473'],
    ['copper', 'Chrono Copper', 'Dark bronze with a chrono-copper accent', '#140d0a,#241610,#b87333,#cd7f32,#4d2f23,#faebd7,#947161'],
    ['eclipse', 'Crimson Eclipse', 'Near-black with a crimson eclipse accent', '#050508,#101017,#800020,#990026,#33141c,#f5e6e8,#7a6366'],
    ['cotton', 'Cotton Candy', 'Navy-black with a soft cotton-candy accent', '#121a24,#1b2836,#84dcc6,#ffa6c9,#ffa6c9,#ffffff,#a5b3c2'],
    ['moonlight', 'Moonlight', 'Midnight blue with a moonlit steel accent', '#080a0f,#101420,#7b92b5,#9cb2d6,#2a3445,#f0f4fa,#616f85'],
    ['amber', 'Amber Steampunk', 'Steampunk black with an amber glow', '#120d06,#1f160b,#ffbf00,#ffd04d,#402d14,#fff7e6,#948269'],
    ['rgb', 'Fading RGB', 'Pitch black with a cycling rainbow accent', '#030303,#0f0f0f,#ff0000,#ff5555,#222222,#ffffff,#777777'],
    ['matrix', 'Matrix Rain', 'Black with digital green rain text', '#000000,#050a05,#00ff00,#55ff55,#003300,#00ff00,#004400'],
    ['neon', 'Neon Pulse', 'Black with pulsing neon cyan and pink', '#020005,#090314,#00ffef,#ff007f,#00ffef,#ffffff,#625073'],
    ['cosmic', 'Cosmic Void', 'Void black with a cosmic violet accent', '#05010a,#0b0414,#7f00ff,#b266ff,#34115c,#e6d7ff,#8c6fa8'],
    ['magma', 'Magma Core', 'Charcoal black with a molten magma accent', '#1a0a00,#260f02,#ff3b00,#ff6a33,#5c1a00,#ffe6d9,#b38a7a'],
    ['glacial', 'Glacial Shard', 'Frozen black with a glacial blue accent', '#0a1116,#122028,#7fe9ff,#b3f4ff,#1f4d5c,#e9fcff,#9bb3b8'],
    ['titanium', 'Industrial Titanium', 'Industrial black with titanium silver', '#0c0c0e,#161618,#c0c0c0,#e0e0e0,#3a3a3a,#f5f5f5,#8c8c8c'],
    ['aurora', 'Aurora Sky', 'Night-black with an aurora green accent', '#050a12,#0c1520,#00ffa6,#66ffcc,#0d4d3d,#eafff7,#7fb3a3'],
    ['starforge', 'Starforge', 'Deep-space black with a hot pink accent', '#0a0014,#140024,#ff00c8,#ff4dd9,#4d1145,#f7e6ff,#a66fb3'],
    ['lab', 'Laboratory Sterile', 'Clinical black with a sterile blue-white accent', '#0d0f12,#181b20,#c8e6ff,#e1f3ff,#39434d,#f5faff,#9aa6b3'],
    ['dragon', 'Dragon Scale', 'Dark scale black with dragon red', '#0b0f08,#141c10,#cc0000,#ff3333,#4d1a1a,#f7e6e6,#a67a7a'],
    ['storm', 'Stormfront', 'Storm-cloud black with a lightning blue accent', '#0a0d12,#141820,#7fb2ff,#a6caff,#2a3d5c,#eaf1ff,#8c9bb3'],
    ['chrome', 'Chrome Mirror', 'Mirror black with polished chrome', '#0c0c0c,#1a1a1a,#d9d9d9,#ffffff,#3d3d3d,#f2f2f2,#a6a6a6'],
    ['surge', 'Electric Surge', 'Electric black with a pulsing blue surge', '#02040a,#060b14,#00aaff,#33cfff,#0d334d,#e6f7ff,#7fa3c2'],
    ['void', 'Void Ripple', 'Void black with a rippling violet accent', '#050007,#0a0010,#5500ff,#7f33ff,#2b0d5c,#f0e6ff,#8c6fa8'],
    ['aether', 'Aether Flow', 'Dark teal-black with an aether glow', '#0a0f12,#101820,#66ffe0,#b3fff2,#1f4d47,#eafff7,#9bb3b8'],
    ['inferno', 'Inferno Breath', 'Charred black with a flickering inferno accent', '#140600,#240a02,#ff3300,#ff7733,#5c1a00,#ffe6d9,#b38a7a'],
    ['cryo', 'Cryo Pulse', 'Frozen blue-black with a cryo pulse', '#0b1418,#132228,#00eaff,#99faff,#0d4d5c,#e6fdff,#8ca3a6'],
    ['techno', 'Technomorph', 'Circuit black with a sweeping green accent', '#040d08,#0a1a11,#00ff88,#55ffcc,#0d4d2a,#e6fff5,#7fb3a3']
  ];

  var CHOICES = FEATURED.slice();

  CLASSIC.forEach(function (row) {
    var c = row[3].split(',');
    PALETTES[row[0]] = {
      bg: c[0], sidebar: c[1], accent: c[2], hover: c[3],
      border: c[4], text: c[5], muted: c[6]
    };
    CHOICES.push({ key: row[0], site: row[0], name: row[1], desc: row[2] });
  });

  var THEME_BY_KEY = {};
  CHOICES.forEach(function (item) { THEME_BY_KEY[item.key] = item; });

  /* ------------------------------------------------------------------
     Animated backgrounds. themes.css used to animate the palette custom
     properties on <html>/<body>, but applyThemeKey writes those properties
     inline with !important, which freezes the animation. Drive the same
     colours from a timer so RGB, Matrix, Neon, Surge, Void, Aether,
     Inferno, Cryo and Techno keep moving even after a background tab
     throttles requestAnimationFrame.
     ------------------------------------------------------------------ */
  var THEME_ANIMATIONS = {
    rgb: { duration: 12000, linear: true, frames: [
      { at: 0.00, accent: '#ff0000', hover: '#ff5555' },
      { at: 0.17, accent: '#ff8800', hover: '#ffa333' },
      { at: 0.33, accent: '#ffff00', hover: '#ffff55' },
      { at: 0.50, accent: '#00ff00', hover: '#55ff55' },
      { at: 0.67, accent: '#00ffff', hover: '#55ffff' },
      { at: 0.83, accent: '#0000ff', hover: '#5555ff' },
      { at: 1.00, accent: '#ff0000', hover: '#ff5555' }
    ] },
    matrix: { duration: 4000, frames: [
      { at: 0.00, text: '#00ff00' },
      { at: 0.50, text: '#33ff33' },
      { at: 1.00, text: '#00ff00' }
    ] },
    neon: { duration: 3000, frames: [
      { at: 0.00, border: 'rgba(0, 255, 239, 0.4)' },
      { at: 0.50, border: 'rgba(0, 255, 239, 0.9)' },
      { at: 1.00, border: 'rgba(0, 255, 239, 0.4)' }
    ] },
    surge: { duration: 3000, frames: [
      { at: 0.00, accent: '#00aaff', hover: '#33cfff' },
      { at: 0.50, accent: '#0088ff', hover: '#55d4ff' },
      { at: 1.00, accent: '#00aaff', hover: '#33cfff' }
    ] },
    void: { duration: 5000, linear: true, frames: [
      { at: 0.00, accent: '#5500ff' },
      { at: 0.25, accent: '#330088' },
      { at: 0.50, accent: '#110033' },
      { at: 0.75, accent: '#330088' },
      { at: 1.00, accent: '#5500ff' }
    ] },
    aether: { duration: 6000, frames: [
      { at: 0.00, accent: '#66ffe0' },
      { at: 0.50, accent: '#99ffea' },
      { at: 1.00, accent: '#66ffe0' }
    ] },
    inferno: { duration: 1800, frames: [
      { at: 0.00, accent: '#ff3300' },
      { at: 0.40, accent: '#ff5500' },
      { at: 0.60, accent: '#ff2200' },
      { at: 1.00, accent: '#ff3300' }
    ] },
    cryo: { duration: 3500, frames: [
      { at: 0.00, accent: '#00eaff' },
      { at: 0.50, accent: '#66f7ff' },
      { at: 1.00, accent: '#00eaff' }
    ] },
    techno: { duration: 4000, linear: true, frames: [
      { at: 0.00, accent: '#00ff88' },
      { at: 0.33, accent: '#00ffaa' },
      { at: 0.66, accent: '#00ffcc' },
      { at: 1.00, accent: '#00ff88' }
    ] }
  };
  var themeAnimKey = null;
  var themeAnimTimer = 0;

  function parseNxColor(value) {
    var s = String(value || '').trim();
    var m;
    if (s.charAt(0) === '#') {
      if (s.length === 4) {
        s = '#' + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2) + s.charAt(3) + s.charAt(3);
      }
      m = /^#([0-9a-f]{6})$/i.exec(s);
      if (!m) return null;
      var n = parseInt(m[1], 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
    }
    m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(s);
    if (!m) return null;
    return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), m[4] === undefined ? 1 : parseFloat(m[4])];
  }

  function mixNxColor(a, b, t) {
    var ca = parseNxColor(a);
    var cb = parseNxColor(b);
    if (!ca || !cb) return t < 0.5 ? a : b;
    var r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
    var g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
    var bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
    var al = Math.round((ca[3] + (cb[3] - ca[3]) * t) * 1000) / 1000;
    if (al >= 1) {
      var hex = ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
      return '#' + hex;
    }
    return 'rgba(' + r + ', ' + g + ', ' + bl + ', ' + al + ')';
  }

  function animationFrameValues(def, progress) {
    var frames = def.frames;
    var prev = frames[0];
    var next = frames[frames.length - 1];
    for (var i = 1; i < frames.length; i++) {
      if (progress <= frames[i].at) { next = frames[i]; break; }
      prev = frames[i];
    }
    var span = next.at - prev.at;
    var t = span > 0 ? (progress - prev.at) / span : 0;
    if (!def.linear) t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    var out = {};
    ['accent', 'hover', 'border', 'text'].forEach(function (prop) {
      if (prev[prop] === undefined && next[prop] === undefined) return;
      var from = prev[prop] !== undefined ? prev[prop] : next[prop];
      var to = next[prop] !== undefined ? next[prop] : prev[prop];
      out[prop] = mixNxColor(from, to, t);
    });
    return out;
  }

  function stopThemeAnimation() {
    themeAnimKey = null;
    if (themeAnimTimer) {
      clearInterval(themeAnimTimer);
      themeAnimTimer = 0;
    }
  }

  function startThemeAnimation(key) {
    stopThemeAnimation();
    var def = THEME_ANIMATIONS[key];
    if (!def) return;
    var reduced = false;
    try {
      reduced = !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {}
    if (reduced) return;
    themeAnimKey = key;
    var root = document.documentElement;
    var start = (window.performance && performance.now) ? performance.now() : Date.now();
    function tick() {
      if (themeAnimKey !== key) return;
      var now = (window.performance && performance.now) ? performance.now() : Date.now();
      var elapsed = now - start;
      var progress = (((elapsed % def.duration) + def.duration) % def.duration) / def.duration;
      var values = animationFrameValues(def, progress);
      if (values.accent) {
        root.style.setProperty('--accent', values.accent, 'important');
        root.style.setProperty('--accent-color', values.accent, 'important');
        root.style.setProperty('--nxup-accent', values.accent, 'important');
      }
      if (values.hover) root.style.setProperty('--accent-hover', values.hover, 'important');
      if (values.border) {
        root.style.setProperty('--border-color', values.border, 'important');
        root.style.setProperty('--nxup-line', values.border, 'important');
      }
      if (values.text) root.style.setProperty('--text-main', values.text, 'important');
    }
    tick();
    themeAnimTimer = setInterval(tick, 50);
  }

  function canonicalKey(value) {
    if (!value) return 'purple';
    if (value === 'default') return 'purple';
    return THEME_BY_KEY[value] ? value : 'purple';
  }

  /* One saved choice, read by the Settings picker and the dashboard. */
  function storedTheme() {
    var fromPicker = null;
    try {
      var raw = localStorage.getItem('nxup_theme');
      if (raw) {
        var parsed = JSON.parse(raw);
        if (typeof parsed === 'string' && THEME_BY_KEY[parsed]) fromPicker = parsed;
      }
    } catch (e) {}
    var fromSite = null;
    try {
      var selected = localStorage.getItem('selectedTheme') || '';
      if (selected && selected !== 'default' && THEME_BY_KEY[selected]) fromSite = selected;
    } catch (e) {}
    /* Older builds could leave nxup_theme at the orange default while the
       Settings picker had already saved a real background. Prefer whichever
       choice is not the default. */
    if (fromPicker && fromPicker !== 'purple') return fromPicker;
    if (fromSite) return fromSite;
    return fromPicker || 'purple';
  }

  function ensurePickerStyles() {
    if (document.getElementById('nx-bg-modal-css')) return;
    if (document.querySelector('link[href*="backgrounds.css"]')) return;
    var style = document.createElement('style');
    style.id = 'nx-bg-modal-css';
    style.textContent =
      '.nx-bg-modal{display:none;position:fixed;inset:0;z-index:2147483600;padding:20px;align-items:center;justify-content:center;background:rgba(0,0,0,.84);backdrop-filter:blur(8px);box-sizing:border-box}' +
      '.nx-bg-modal.nx-open{display:flex}html.nx-bg-open,html.nx-bg-open body{overflow:hidden!important}' +
      '.nx-bg-panel{width:min(980px,100%);max-height:min(88vh,780px);display:flex;flex-direction:column;overflow:hidden;border:1px solid #e07a00;border-radius:16px;background:#000;color:#f0922a;box-shadow:none}' +
      '.nx-bg-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px 20px 14px;border-bottom:1px solid #e07a00}' +
      '.nx-bg-head h2{margin:0;color:#f0922a;font-size:1.16rem}.nx-bg-head p{margin:5px 0 0;color:#b86a12;font-size:.8rem;line-height:1.45}' +
      '.nx-bg-close{flex:0 0 auto;width:34px!important;height:34px;padding:0!important;font-size:1.3rem!important;line-height:1!important;border:1px solid #e07a00!important;border-radius:8px!important;background:#000!important;color:#f0922a!important;cursor:pointer}' +
      '.nx-bg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(235px,1fr));gap:14px;padding:18px 20px 20px;overflow-y:auto}' +
      '.nx-bg-choice{position:relative;display:block!important;width:100%;padding:0!important;overflow:visible;border:1px solid #e07a00!important;border-radius:10px!important;background:#000!important;color:#f0922a!important;text-align:left!important;cursor:pointer;font:inherit}' +
      '.nx-bg-choice img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:9px 9px 0 0;border-bottom:1px solid #e07a00;background:#050505}' +
      '.nx-bg-choice-copy{display:block;padding:10px 12px 11px}.nx-bg-choice-copy strong{display:block;color:#f0922a;font-size:.9rem;line-height:1.25}' +
      '.nx-bg-choice-copy small{display:block;margin-top:3px;color:#b86a12;font-size:.72rem;line-height:1.35}' +
      '.nx-bg-tick{position:absolute;top:9px;right:9px;display:none;width:22px;height:22px;align-items:center;justify-content:center;border:1px solid #e07a00;border-radius:50%;background:#000;color:#f0922a;font-size:.75rem;font-weight:900}' +
      '.nx-bg-choice.nx-active{border-color:#f59e0b!important}.nx-bg-choice.nx-active .nx-bg-tick{display:inline-flex}' +
      '.nx-bg-choice:hover{border-color:#f59e0b!important}.nx-bg-choice:hover img{opacity:.92}' +
      '.nx-bg-foot{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 20px;border-top:1px solid #e07a00;color:#b86a12;font-size:.78rem}' +
      '.nx-bg-foot button{flex:0 0 auto;border:1px solid #e07a00!important;border-radius:8px!important;background:#000!important;color:#f0922a!important;padding:8px 14px;cursor:pointer;font:inherit}' +
      '@media(max-width:620px){.nx-bg-grid{grid-template-columns:1fr;padding:14px 16px 16px}.nx-bg-head,.nx-bg-foot{padding-left:16px;padding-right:16px}.nx-bg-foot{flex-direction:column;align-items:stretch}}';
    (document.head || document.documentElement).appendChild(style);
  }

  function syncActive(key) {
    var item = THEME_BY_KEY[key] || THEME_BY_KEY.purple;
    var nameEl = document.getElementById('nxbgCurrentName');
    var descEl = document.getElementById('nxbgCurrentDesc');
    var imageEl = document.getElementById('nxbgCurrentPreview');
    if (nameEl) nameEl.textContent = item.name;
    if (descEl) descEl.textContent = item.desc;
    var choices = document.querySelectorAll('.nx-bg-choice');
    for (var i = 0; i < choices.length; i++) {
      var active = choices[i].getAttribute('data-bg-key') === key;
      choices[i].classList.toggle('nx-active', active);
      choices[i].setAttribute('aria-pressed', active ? 'true' : 'false');
      if (active && imageEl) {
        var img = choices[i].querySelector('img');
        if (img) imageEl.src = img.src;
      }
    }
  }

  /* Apply a theme for real: inline !important wins over CSS/black-orange.css,
     which used to force the dashboard back to orange on every load. */
  function applyThemeKey(key, opts) {
    opts = opts || {};
    key = canonicalKey(key);
    var item = THEME_BY_KEY[key] || THEME_BY_KEY.purple;
    var p = PALETTES[key] || PALETTES.purple;
    var site = key === 'purple' ? 'default' : key;
    var root = document.documentElement;

    root.setAttribute('data-theme', site);
    root.setAttribute('data-nxup-theme', key);
    root.setAttribute('data-nx-theme', key);

    try {
      var classes = [];
      for (var c = 0; c < document.body.classList.length; c++) {
        var cls = document.body.classList[c];
        if (cls.indexOf('theme-') !== 0) classes.push(cls);
      }
      document.body.className = classes.join(' ');
      if (site !== 'default') document.body.classList.add('theme-' + site);
      document.body.setAttribute('data-theme', site);
    } catch (e) {}

    var vars = {
      '--bg-dashboard': p.bg,
      '--bg-sidebar': p.sidebar,
      '--container-bg': p.sidebar,
      '--bg-gradient': 'linear-gradient(135deg,' + p.sidebar + ',' + p.bg + ')',
      '--accent': p.accent,
      '--accent-color': p.accent,
      '--accent-hover': p.hover,
      '--border-color': p.border,
      '--text-main': p.text,
      '--text-muted': p.muted,
      '--nxup-bg': p.bg,
      '--nxup-panel': p.sidebar,
      '--nxup-line': p.border,
      '--nxup-accent': p.accent,
      '--nxup-muted': p.muted
    };
    Object.keys(vars).forEach(function (name) {
      root.style.setProperty(name, vars[name], 'important');
    });
    try {
      document.body.style.setProperty('background-color', p.bg, 'important');
      document.body.style.setProperty('background-image', 'none', 'important');
    } catch (e) {}

    /* Keep the animated palettes moving on top of the inline !important vars. */
    startThemeAnimation(key);

    if (opts.persist !== false) {
      try {
        localStorage.setItem('nxup_theme', JSON.stringify(key));
        localStorage.setItem('selectedTheme', site);
        localStorage.setItem('nullx-theme', site);
        localStorage.setItem('nxos_theme', site);
      } catch (e) {}
    }

    syncActive(key);
    try {
      window.dispatchEvent(new CustomEvent('nx-theme-change', {
        detail: { key: key, name: item.name, palette: p }
      }));
    } catch (e) {}
    return key;
  }

  function previewFor(item) {
    if (item.preview) return item.preview;
    var p = PALETTES[item.key] || PALETTES.purple;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">' +
      '<rect width="320" height="200" fill="' + p.bg + '"/>' +
      '<rect x="14" y="16" width="54" height="168" rx="6" fill="' + p.sidebar + '" stroke="' + p.border + '"/>' +
      '<rect x="80" y="16" width="226" height="26" rx="6" fill="' + p.sidebar + '" stroke="' + p.border + '"/>' +
      '<rect x="80" y="54" width="108" height="62" rx="6" fill="' + p.sidebar + '" stroke="' + p.border + '"/>' +
      '<rect x="198" y="54" width="108" height="62" rx="6" fill="' + p.sidebar + '" stroke="' + p.border + '"/>' +
      '<rect x="80" y="130" width="226" height="10" rx="5" fill="' + p.border + '"/>' +
      '<rect x="80" y="150" width="168" height="10" rx="5" fill="' + p.muted + '"/>' +
      '<circle cx="41" cy="40" r="9" fill="' + p.accent + '"/>' +
      '<rect x="25" y="62" width="32" height="6" rx="3" fill="' + p.accent + '"/>' +
      '<rect x="25" y="77" width="24" height="6" rx="3" fill="' + p.muted + '"/>' +
      '<rect x="80" y="186" width="90" height="6" rx="3" fill="' + p.accent + '"/>' +
      '</svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  function buildCards() {
    return CHOICES.map(function (item) {
      return '<button type="button" class="nx-bg-choice" data-bg-key="' + item.key + '" data-bg-site="' + item.site + '" data-bg-name="' + item.name + '" data-bg-desc="' + item.desc + '" aria-pressed="false" onclick="nxChooseBackground(this)">' +
        '<img src="' + previewFor(item) + '" alt="' + item.name + ' background preview" loading="lazy">' +
        '<span class="nx-bg-choice-copy"><strong>' + item.name + '</strong><small>' + item.desc + '</small></span>' +
        '<span class="nx-bg-tick" aria-hidden="true">&check;</span>' +
      '</button>';
    }).join('');
  }


  function ensureBackgroundPicker() {
    ensurePickerStyles();
    var existing = document.getElementById('nx-bg-modal');
    if (existing) {
      var grid = existing.querySelector('.nx-bg-grid');
      if (grid && grid.getAttribute('data-count') !== String(CHOICES.length)) {
        grid.innerHTML = buildCards();
        grid.setAttribute('data-count', String(CHOICES.length));
      }
      return;
    }
    var modal = document.createElement('div');
    modal.id = 'nx-bg-modal';
    modal.className = 'nx-bg-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML =
      '<div class="nx-bg-panel" role="dialog" aria-modal="true" aria-labelledby="nx-bg-title">' +
        '<header class="nx-bg-head"><div><h2 id="nx-bg-title">Choose a background</h2><p>All ' + CHOICES.length + ' dashboard backgrounds, including every classic one. Pick one and it applies immediately.</p></div>' +
        '<button type="button" class="nx-bg-close" aria-label="Close background picker" onclick="nxCloseBackgroundPicker()">&times;</button></header>' +
        '<div class="nx-bg-grid" data-count="' + CHOICES.length + '">' + buildCards() + '</div>' +
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
    if (nameEl) nameEl.textContent = name;
    if (descEl) descEl.textContent = desc;
    if (imageEl && image) imageEl.src = image.src;
    var choices = document.querySelectorAll('.nx-bg-choice');
    for (var i = 0; i < choices.length; i++) {
      var active = choices[i] === choice;
      choices[i].classList.toggle('nx-active', active);
      choices[i].setAttribute('aria-pressed', active ? 'true' : 'false');
    }
  }

  window.nxInitBackgroundPicker = function (scope) {
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
    var key = canonicalKey(choice.getAttribute('data-bg-key'));
    /* The dashboard upgrade pack awards the theme XP/toast; on Settings we
       apply the same shared choice directly. */
    if (window.NXUpgrade && typeof window.NXUpgrade.applyTheme === 'function') {
      window.NXUpgrade.applyTheme(key);
    } else {
      applyThemeKey(key);
    }
  };

  window.NXThemes = {
    version: '2.0.0',
    list: CHOICES,
    palettes: PALETTES,
    current: storedTheme,
    get: function (key) { return THEME_BY_KEY[canonicalKey(key)]; },
    apply: applyThemeKey,
    choose: function (key) { return applyThemeKey(canonicalKey(key)); },
    openPicker: function () { window.nxOpenBackgroundPicker(); }
  };

  /* Restore the saved background immediately, before the first paint. */
  try { applyThemeKey(storedTheme(), { persist: true }); } catch (e) {}

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') window.nxCloseBackgroundPicker();
  });

  var initialized = false;
  function initWhenReady() {
    if (initialized) return;
    if (!document.querySelector('.nx-bg-current')) return;
    initialized = true;
    window.nxInitBackgroundPicker(document);
    syncActive(storedTheme());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initWhenReady);
  else setTimeout(initWhenReady, 0);
  try {
    var observer = new MutationObserver(function () {
      if (!initialized) initWhenReady();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } catch (e) {}
})();

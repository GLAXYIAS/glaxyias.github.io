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
          'style="width:100%;height:calc(100vh - 160px);min-height:520px;border:1px solid rgba(139,0,255,0.35);' +
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
  background: rgba(5, 2, 12, 0.82);
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
  background: #12091c;
  border: 1px solid #8b00ff;
  border-radius: 14px;
  box-shadow: 0 0 40px rgba(139, 0, 255, 0.35);
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
}
#system-news-modal .snm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(139, 0, 255, 0.35);
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
  border: 1px solid rgba(139, 0, 255, 0.25);
  border-radius: 10px;
  padding: 12px 14px;
}
#system-news-modal .news-tag {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #b056ff;
  margin-bottom: 6px;
}
#system-news-modal .news-card p { margin: 0 0 8px; color: #d4cce0; font-size: 0.9rem; line-height: 1.45; }
#system-news-modal .news-date { font-size: 0.75rem; color: #888; }

#system-news-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 9px 14px;
  border-radius: 8px;
  border: 1px solid rgba(139, 0, 255, 0.45);
  background: rgba(139, 0, 255, 0.12);
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
#system-news-btn:hover {
  background: rgba(139, 0, 255, 0.26);
  border-color: #8b00ff;
  box-shadow: 0 0 14px rgba(139, 0, 255, 0.35);
}
#system-news-btn:focus-visible { outline: 2px solid #b056ff; outline-offset: 2px; }
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

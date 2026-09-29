// --- CONFIGURATION: Turso via Vercel API (replaces Supabase) ---
const TURSO_API_BASE = 'https://apithingy.jlsniperelite4.workers.dev';
const TURSO_HEADERS = { 'Content-Type': 'application/json' };

/** Cloudflare may return { success, users/messages } or a raw array */
function unwrapList(data, key) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data[key])) return data[key];
    if (data && Array.isArray(data.data)) return data.data;
    return [];
}
function unwrapOne(data, key) {
    if (!data || typeof data !== 'object') return data;
    if (Array.isArray(data)) return data[0] || null;
    if (data[key] && Array.isArray(data[key])) return data[key][0] || null;
    if (data.user) return data.user;
    if (data.id !== undefined || data.username !== undefined) return data;
    return data;
}


// --- ONLINE STATUS TRACKING (mouse movement) ---
let lastMouseActivity = Date.now();
let userActivityTrackingInterval = null;

function trackUserActivity() {
    lastMouseActivity = Date.now();
}

// Add mouse move listener globally to track activity
document.addEventListener('mousemove', trackUserActivity);
document.addEventListener('keypress', trackUserActivity);
document.addEventListener('click', trackUserActivity);

function isBannedFlag(val) {
  if (val === true || val === 1 || val === "1") return true;
  if (val == null) return false;
  const s = String(val).toLowerCase().trim();
  return s === "true" || s === "1" || s === "yes";
}
function isAdminFlag(val) {
  if (val === true || val === 1 || val === "1") return true;
  if (val == null) return false;
  const s = String(val).toLowerCase().trim();
  return s === "true" || s === "1" || s === "yes";
}
function isAdminRoleTag(tag) {
  if (!tag) return false;
  const s = String(tag).toLowerCase().trim();
  return s === "admin" || s === "owner" || s === "mod" || s === "moderator" || s === "staff";
}
function isAdminProfile(profile) {
  if (!profile) return false;
  return isAdminFlag(profile.is_admin) || isAdminRoleTag(profile.role_tag);
}



async function patchUserRoleByUsername(username, fields) {
  const clean = String(username || '').replace(/^@/, '').trim();
  if (!clean) throw new Error('username required');

  // PATCH API now accepts username in the query OR body
  const res = await fetch(`${TURSO_API_BASE}/user-roles?username=${encodeURIComponent(clean)}`, {
    method: 'PATCH',
    headers: TURSO_HEADERS,
    body: JSON.stringify({ username: clean, ...fields })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || ('HTTP ' + res.status));
  }
  return res;
}


/** Thin helpers matching old Supabase response shapes where practical */
async function tursoGet(path) {
  const res = await fetch(`${TURSO_API_BASE}${path}`, { headers: TURSO_HEADERS });
  return res;
}
async function tursoJson(path, options = {}) {
  const res = await fetch(`${TURSO_API_BASE}${path}`, {
    headers: { ...TURSO_HEADERS, ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => null);
  return { res, data };
}

const DEFAULT_PFP = "https://null-x-team.github.io/imgs/download.jpeg";
let allUsers = [];
let lastMessageTime = 0;

// --- BROWSER NOTIFICATIONS ---
const NOTIF_PREF_KEY = 'nullchat_notifications';
let knownMessageIds = new Set();
let knownPmIds = new Set();
let notificationsReady = false;

function notificationsEnabled() {
    return localStorage.getItem(NOTIF_PREF_KEY) === 'granted'
        && typeof Notification !== 'undefined'
        && Notification.permission === 'granted';
}

function showChatNotification(title, body, tag) {
    if (!notificationsEnabled()) return;
    try {
        // Don't notify if the tab is focused
        if (!document.hidden && document.hasFocus()) return;
        const n = new Notification(title, {
            body: body || '',
            icon: 'https://null-x-team.github.io/imgs/download.jpeg',
            tag: tag || 'nullchat',
            renotify: true
        });
        n.onclick = () => {
            window.focus();
            n.close();
        };
        setTimeout(() => n.close(), 8000);
    } catch (e) {
        console.warn('Notification failed:', e);
    }
}

function promptEnableNotifications() {
    // Only ask once (unless they chose "ask later")
    const pref = localStorage.getItem(NOTIF_PREF_KEY);
    if (pref === 'granted' || pref === 'denied') return;
    if (typeof Notification === 'undefined') return;

    // If already granted at browser level, just save preference
    if (Notification.permission === 'granted') {
        localStorage.setItem(NOTIF_PREF_KEY, 'granted');
        notificationsReady = true;
        return;
    }
    if (Notification.permission === 'denied') {
        localStorage.setItem(NOTIF_PREF_KEY, 'denied');
        return;
    }

    // Show custom modal
    const existing = document.getElementById('notif-prompt-modal');
    if (existing) return;

    const modal = document.createElement('div');
    modal.id = 'notif-prompt-modal';
    modal.innerHTML = `
      <div class="notif-prompt-backdrop"></div>
      <div class="notif-prompt-card">
        <div class="notif-prompt-icon">🔔</div>
        <h2>Enable chat notifications?</h2>
        <p>Get notified when someone messages you in <strong>general</strong> or sends you a <strong>PM</strong>, even if this tab is in the background.</p>
        <div class="notif-prompt-actions">
          <button type="button" id="notif-allow-btn" class="notif-btn-primary">Enable notifications</button>
          <button type="button" id="notif-later-btn" class="notif-btn-secondary">Not now</button>
          <button type="button" id="notif-never-btn" class="notif-btn-ghost">Never ask again</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('notif-allow-btn').onclick = async () => {
        try {
            const result = await Notification.requestPermission();
            if (result === 'granted') {
                localStorage.setItem(NOTIF_PREF_KEY, 'granted');
                notificationsReady = true;
                showChatNotification('Notifications enabled', 'You will be notified about new chat messages and PMs.', 'nullchat-setup');
            } else {
                localStorage.setItem(NOTIF_PREF_KEY, 'denied');
            }
        } catch (e) {
            console.warn(e);
            localStorage.setItem(NOTIF_PREF_KEY, 'denied');
        }
        modal.remove();
    };
    document.getElementById('notif-later-btn').onclick = () => {
        // Ask again next session
        modal.remove();
    };
    document.getElementById('notif-never-btn').onclick = () => {
        localStorage.setItem(NOTIF_PREF_KEY, 'denied');
        modal.remove();
    };
}


let chatPollingInterval = null; 
let heartbeatInterval = null;
let pmPollingInterval = null;
let lastFetchedMessagesHash = null; // Track message hash to prevent re-renders

// Track active menu state
let selectedChatUser = { username: '', handler: '' };
let selectedMessageId = null; // Track for right-click message menu

// Track the live authorization status dynamically from Supabase
let currentUserIsAdmin = false;
let myUsernameGlobal = '';
let myHandleGlobal = '';

// PM state
let pmConversations = {};      // handle -> { otherHandle, otherUsername, messages: [], unread: 0 }
let activePmHandle = null;     // handle of the conversation currently open
let pendingImageDataUrl = null;      // staged image for main chat
let pendingPmImageDataUrl = null;    // staged image for PM thread
let suppressPmRefresh = false;       // guards against the poller clobbering a just-opened conversation

// Image marker used to embed an attached image inside a text message row
const IMG_MARKER = "[[IMG]]";

function usernameToHandle(username) {
    return '@' + String(username).toLowerCase().replace(/\s+/g, '_');
}

function renderMessageBody(content) {
    if (typeof content === 'string' && content.startsWith(IMG_MARKER)) {
        const url = content.slice(IMG_MARKER.length);
        // Escape for use inside HTML attribute; open in same-tab lightbox
        const safeUrl = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        return `<img src="${safeUrl}" class="chat-attached-image" data-full-src="${safeUrl}" onclick="window.openImageLightbox(this.getAttribute('data-full-src') || this.src)" alt="attachment" title="Click to enlarge">`;
    }
    return content;
}

// ==========================================================================
// RIGHT-CLICK MESSAGE MENU (edit, delete, recall)
// ==========================================================================
window.openMessageMenu = function(event, messageId, messageUsername) {
    // Only allow user to right-click their own messages
    if (messageUsername !== myUsernameGlobal) return;
    
    event.preventDefault();
    event.stopPropagation();
    selectedMessageId = messageId;

    const menu = document.getElementById('message-context-menu');
    if (!menu) return;

    let posX = event.clientX;
    let posY = event.clientY;
    const menuWidth = 180;
    const menuHeight = 120;
    
    if (posX + menuWidth > window.innerWidth) posX = window.innerWidth - menuWidth - 10;
    if (posY + menuHeight > window.innerHeight) posY = window.innerHeight - menuHeight - 10;
    
    menu.style.left = `${posX}px`;
    menu.style.top = `${posY}px`;
    menu.classList.remove('hidden');
};

document.addEventListener('click', (e) => {
    const menu = document.getElementById('message-context-menu');
    if (menu && !e.target.closest('#message-context-menu')) {
        menu.classList.add('hidden');
    }
});

window.editMessage = async function() {
    const input = document.getElementById('message-input');
    if (!input) return;
    // Populate input with message to edit (you'd need to fetch the message first)
    input.focus();
};

window.deleteMessage = async function(messageId) {
    if (!confirm("Delete this message?")) return;
    try {
        await fetch(`${TURSO_API_BASE}/messages`, {
            method: 'PATCH',
            headers: TURSO_HEADERS,
            body: JSON.stringify({ id: messageId, content: "Message Was Deleted By Owner" })
        });
        window.refreshChatMessages?.();
    } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete message.");
    }
};

window.recallMessage = async function(messageId) {
    if (!confirm("Recall this message? (Remove from everyone's view)")) return;
    try {
        await fetch(`${TURSO_API_BASE}/messages`, {
            method: 'DELETE',
            headers: TURSO_HEADERS,
            body: JSON.stringify({ id: messageId })
        });
        window.refreshChatMessages?.();
    } catch (err) {
        console.error("Recall failed:", err);
        alert("Failed to recall message.");
    }
};

// ==========================================================================
// IMAGE LIGHTBOX (enlarge + zoom + pan)
// ==========================================================================
(function initImageLightbox() {
    let scale = 1;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let originPanX = 0;
    let originPanY = 0;

    function els() {
        return {
            overlay: document.getElementById('image-lightbox'),
            img: document.getElementById('lightbox-img'),
            stage: document.getElementById('lightbox-stage'),
            label: document.getElementById('lightbox-zoom-label'),
            backdrop: document.querySelector('#image-lightbox .image-lightbox-backdrop'),
            btnIn: document.getElementById('lightbox-zoom-in'),
            btnOut: document.getElementById('lightbox-zoom-out'),
            btnReset: document.getElementById('lightbox-zoom-reset'),
            btnClose: document.getElementById('lightbox-close'),
        };
    }

    function applyTransform() {
        const { img, label } = els();
        if (!img) return;
        img.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
        if (label) label.textContent = Math.round(scale * 100) + '%';
    }

    function setZoom(next) {
        scale = Math.min(8, Math.max(0.25, next));
        // Keep pan reasonable when zooming out a lot
        if (scale <= 1) {
            panX = 0;
            panY = 0;
        }
        applyTransform();
    }

    window.openImageLightbox = function (src) {
        if (!src) return;
        const { overlay, img } = els();
        if (!overlay || !img) return;
        scale = 1;
        panX = 0;
        panY = 0;
        img.src = src;
        applyTransform();
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    function closeLightbox() {
        const { overlay, img } = els();
        if (!overlay) return;
        overlay.classList.add('hidden');
        if (img) img.src = '';
        document.body.style.overflow = '';
        scale = 1;
        panX = 0;
        panY = 0;
    }

    function bindOnce() {
        const { overlay, stage, img, backdrop, btnIn, btnOut, btnReset, btnClose } = els();
        if (!overlay || overlay.dataset.bound === '1') return;
        overlay.dataset.bound = '1';

        if (btnClose) btnClose.addEventListener('click', closeLightbox);
        if (backdrop) backdrop.addEventListener('click', closeLightbox);
        if (btnIn) btnIn.addEventListener('click', () => setZoom(scale * 1.25));
        if (btnOut) btnOut.addEventListener('click', () => setZoom(scale / 1.25));
        if (btnReset) btnReset.addEventListener('click', () => { scale = 1; panX = 0; panY = 0; applyTransform(); });

        // Wheel zoom (centered roughly on cursor relative to stage)
        if (stage) {
            stage.addEventListener('wheel', (e) => {
                e.preventDefault();
                const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
                setZoom(scale * factor);
            }, { passive: false });

            stage.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                originPanX = panX;
                originPanY = panY;
                stage.classList.add('is-dragging');
                e.preventDefault();
            });
        }

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panX = originPanX + (e.clientX - startX);
            panY = originPanY + (e.clientY - startY);
            applyTransform();
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            const { stage: s } = els();
            if (s) s.classList.remove('is-dragging');
        });

        // Touch: pinch zoom + single-finger pan
        let lastTouchDist = null;
        let lastTouchMid = null;
        if (stage) {
            stage.addEventListener('touchstart', (e) => {
                if (e.touches.length === 2) {
                    const [a, b] = e.touches;
                    lastTouchDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
                    lastTouchMid = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
                } else if (e.touches.length === 1) {
                    isDragging = true;
                    startX = e.touches[0].clientX;
                    startY = e.touches[0].clientY;
                    originPanX = panX;
                    originPanY = panY;
                }
            }, { passive: true });

            stage.addEventListener('touchmove', (e) => {
                if (e.touches.length === 2 && lastTouchDist != null) {
                    e.preventDefault();
                    const [a, b] = e.touches;
                    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
                    const factor = dist / lastTouchDist;
                    lastTouchDist = dist;
                    setZoom(scale * factor);
                } else if (e.touches.length === 1 && isDragging) {
                    e.preventDefault();
                    panX = originPanX + (e.touches[0].clientX - startX);
                    panY = originPanY + (e.touches[0].clientY - startY);
                    applyTransform();
                }
            }, { passive: false });

            stage.addEventListener('touchend', () => {
                lastTouchDist = null;
                isDragging = false;
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const { overlay: o } = els();
                if (o && !o.classList.contains('hidden')) {
                    closeLightbox();
                }
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindOnce);
    } else {
        bindOnce();
    }
})();


// ==========================================================================
// LOCAL CHAT SETTINGS SYSTEM (theme / cloak / background / message style)
// ==========================================================================
const SETTINGS_KEYS = {
    theme: 'nullchat_theme',
    cloakEnabled: 'nullchat_cloak_enabled',
    cloakType: 'nullchat_cloak_type',
    bgType: 'nullchat_bg_type',       // 'none' | 'upload' | 'preset'
    bgValue: 'nullchat_bg_value',     // data URL or preset key
    bgOverlay: 'nullchat_bg_overlay',
    bubbleStyle: 'nullchat_bubble_style',
};

// Expanded cloak library — uses Google's public favicon service so every
// entry gets a real icon without needing to host our own image assets.
function faviconFor(domain) {
    return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
}

const CLOAK_PRESETS = {
    docs:        { title: 'Google Docs',                domain: 'docs.google.com' },
    classroom:   { title: 'Home',                        domain: 'classroom.google.com' },
    drive:       { title: 'My Drive - Google Drive',     domain: 'drive.google.com' },
    mail:        { title: 'Inbox (2) - Gmail',           domain: 'mail.google.com' },
    slides:      { title: 'Google Slides',               domain: 'slides.google.com' },
    sheets:      { title: 'Google Sheets',                domain: 'sheets.google.com' },
    canvas:      { title: 'Dashboard',                    domain: 'instructure.com' },
    canva:       { title: 'Home - Canva',                 domain: 'canva.com' },
    m365:        { title: 'M365 Copilot',                 domain: 'microsoft365.com' },
    noredink:    { title: 'Student Home | NoRedInk',      domain: 'noredink.com' },
    ixl:         { title: 'IXL | Math, Language Arts',    domain: 'ixl.com' },
    khan:        { title: 'Khan Academy',                 domain: 'khanacademy.org' },
    quizlet:     { title: 'Quizlet - Flashcards',         domain: 'quizlet.com' },
    desmos:      { title: 'Desmos | Graphing Calculator', domain: 'desmos.com' },
    kahoot:      { title: 'Kahoot!',                      domain: 'kahoot.it' },
    nearpod:     { title: 'Nearpod',                      domain: 'nearpod.com' },
    edpuzzle:    { title: 'Edpuzzle',                     domain: 'edpuzzle.com' },
    schoology:   { title: 'Schoology',                    domain: 'schoology.com' },
    blackboard:  { title: 'Blackboard',                   domain: 'blackboard.com' },
    coursera:    { title: 'Coursera | Online Courses',    domain: 'coursera.org' },
    edx:         { title: 'edX',                          domain: 'edx.org' },
    duolingo:    { title: 'Duolingo',                     domain: 'duolingo.com' },
    codeorg:     { title: 'Code.org',                     domain: 'code.org' },
    grammarly:   { title: 'Grammarly',                    domain: 'grammarly.com' },
    wolfram:     { title: 'Wolfram|Alpha',                domain: 'wolframalpha.com' },
    notion:      { title: 'Notion',                       domain: 'notion.so' },
    quizizz:     { title: 'Quizizz',                      domain: 'quizizz.com' },
    zearn:       { title: 'Zearn Math',                   domain: 'zearn.org' },
    newsela:     { title: 'Newsela',                      domain: 'newsela.com' },
    commonlit:   { title: 'CommonLit',                    domain: 'commonlit.org' },
};

// Preset backgrounds (CSS-only, no image hosting needed)
const PRESET_BACKGROUNDS = {
    none:       { label: 'None',        css: '' },
    dusk:       { label: 'Dusk',        css: 'linear-gradient(135deg, #1e1613, #3a2418, #1e1613)' },
    midnight:   { label: 'Midnight',    css: 'linear-gradient(135deg, #0b0e18, #1a2340, #0b0e18)' },
    forest:     { label: 'Forest',      css: 'linear-gradient(135deg, #0d1f14, #1c3d24, #0d1f14)' },
    ember:      { label: 'Ember',       css: 'radial-gradient(circle at 30% 20%, #4a1610, #140f0d 70%)' },
    violet:     { label: 'Violet Haze', css: 'linear-gradient(135deg, #1a0f2e, #3d1f5c, #1a0f2e)' },
    ocean:      { label: 'Ocean',       css: 'linear-gradient(135deg, #061a24, #0d3a52, #061a24)' },
    sunrise:    { label: 'Sunrise',     css: 'linear-gradient(135deg, #3d1a0f, #a35a2c, #3d1a0f)' },
    grid:       { label: 'Grid Lines',  css: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 40px), #140f0d' },
};

function applyTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    document.querySelectorAll('.theme-swatch').forEach(sw => {
        sw.classList.toggle('active-swatch', sw.getAttribute('data-theme') === themeName);
    });
    localStorage.setItem(SETTINGS_KEYS.theme, themeName);
}

function applyCloak(enabled, type) {
    const preset = CLOAK_PRESETS[type] || CLOAK_PRESETS.docs;
    const titleEl = document.getElementById('page-title');
    const favicon = document.getElementById('dynamic-favicon');

    if (enabled) {
        if (titleEl) titleEl.textContent = preset.title;
        if (favicon) favicon.href = faviconFor(preset.domain);
    } else {
        if (titleEl) titleEl.textContent = 'NULL Grades';
        if (favicon) favicon.href = 'data:,';
    }

    const label = document.getElementById('cloak-toggle-label');
    if (label) label.textContent = enabled ? `Cloak Enabled (${preset.title})` : 'Cloak Disabled';
}

function populateCloakSelect() {
    const select = document.getElementById('cloak-disguise-select');
    if (!select) return;
    select.innerHTML = Object.keys(CLOAK_PRESETS).map(key =>
        `<option value="${key}">${CLOAK_PRESETS[key].title}</option>`
    ).join('');
}

function populatePresetBackgrounds() {
    const row = document.getElementById('preset-bg-row');
    if (!row) return;
    row.innerHTML = Object.keys(PRESET_BACKGROUNDS).map(key => {
        const preset = PRESET_BACKGROUNDS[key];
        const bgCss = preset.css ? `background: ${preset.css};` : 'background: #2a1f1a; border: 1px dashed rgba(255,255,255,0.2) !important;';
        return `<div class="preset-bg-swatch" data-preset="${key}" style="${bgCss}"><span>${preset.label}</span></div>`;
    }).join('');

    row.querySelectorAll('.preset-bg-swatch').forEach(sw => {
        sw.addEventListener('click', () => {
            const key = sw.getAttribute('data-preset');
            if (key === 'none') {
                localStorage.removeItem(SETTINGS_KEYS.bgType);
                localStorage.removeItem(SETTINGS_KEYS.bgValue);
                applyBackground(null, null);
            } else {
                localStorage.setItem(SETTINGS_KEYS.bgType, 'preset');
                localStorage.setItem(SETTINGS_KEYS.bgValue, key);
                const overlay = parseInt(document.getElementById('bg-overlay-range')?.value || '70');
                applyBackground('preset', key, overlay);
            }
        });
    });
}

function applyBackground(type, value, overlayPercent) {
    const layer = document.getElementById('custom-bg-layer');
    const dropzone = document.getElementById('bg-upload-dropzone');
    const dzText = document.getElementById('bg-upload-text');

    document.querySelectorAll('.preset-bg-swatch').forEach(sw => {
        sw.classList.toggle('active-preset', type === 'preset' && sw.getAttribute('data-preset') === value);
    });

    if (!type || !value) {
        layer.style.display = 'none';
        layer.style.backgroundImage = '';
        document.body.classList.remove('has-custom-bg');
        if (dropzone) dropzone.classList.remove('has-image');
        if (dzText) dzText.textContent = 'Click to choose an image, or drag one here';
        return;
    }

    layer.style.display = 'block';
    const ov = (overlayPercent ?? 70) / 100;
    layer.style.setProperty('--bg-overlay-alpha', ov);
    document.documentElement.style.setProperty('--panel-bg-alpha', Math.max(0.18, ov * 0.55).toFixed(3));
    document.body.classList.add('has-custom-bg');

    if (type === 'upload') {
        layer.style.backgroundImage = `url(${value})`;
        if (dropzone) dropzone.classList.add('has-image');
        if (dzText) dzText.textContent = 'Custom background active — click to change';
    } else if (type === 'preset') {
        const preset = PRESET_BACKGROUNDS[value];
        layer.style.backgroundImage = preset ? preset.css : '';
        if (dropzone) dropzone.classList.remove('has-image');
        if (dzText) dzText.textContent = 'Click to choose an image, or drag one here';
    }
}

function applyBubbleStyle(styleName) {
    document.querySelectorAll('.bubble-style-option').forEach(opt => {
        opt.classList.toggle('selected-style', opt.getAttribute('data-style') === styleName);
    });
    localStorage.setItem(SETTINGS_KEYS.bubbleStyle, styleName);
    document.querySelectorAll('.my-bubble-color').forEach(bubble => {
        bubble.className = bubble.className.replace(/style-\S+/g, '').trim();
        if (styleName !== 'default') bubble.classList.add(`style-${styleName}`);
    });
}

function getSavedBubbleStyle() {
    return localStorage.getItem(SETTINGS_KEYS.bubbleStyle) || 'default';
}

function loadAllSettings() {
    populateCloakSelect();
    populatePresetBackgrounds();

    const savedTheme = localStorage.getItem(SETTINGS_KEYS.theme) || 'amber';
    applyTheme(savedTheme);

    const cloakEnabled = localStorage.getItem(SETTINGS_KEYS.cloakEnabled) === 'true';
    const cloakType = localStorage.getItem(SETTINGS_KEYS.cloakType) || 'docs';
    const cloakToggle = document.getElementById('toggle-chat-cloak');
    const cloakSelect = document.getElementById('cloak-disguise-select');
    if (cloakToggle) cloakToggle.checked = cloakEnabled;
    if (cloakSelect) cloakSelect.value = cloakType;
    applyCloak(cloakEnabled, cloakType);

    const savedBgType = localStorage.getItem(SETTINGS_KEYS.bgType);
    const savedBgValue = localStorage.getItem(SETTINGS_KEYS.bgValue);
    const savedOverlay = parseInt(localStorage.getItem(SETTINGS_KEYS.bgOverlay) || '70');
    const overlayRange = document.getElementById('bg-overlay-range');
    if (overlayRange) overlayRange.value = savedOverlay;
    applyBackground(savedBgType, savedBgValue, savedOverlay);

    applyBubbleStyle(getSavedBubbleStyle());
}

function initSettingsPanelBindings() {
    document.querySelectorAll('.theme-swatch').forEach(sw => {
        sw.addEventListener('click', () => applyTheme(sw.getAttribute('data-theme')));
    });

    const cloakToggle = document.getElementById('toggle-chat-cloak');
    const cloakSelect = document.getElementById('cloak-disguise-select');
    if (cloakToggle) {
        cloakToggle.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            const type = cloakSelect ? cloakSelect.value : 'docs';
            localStorage.setItem(SETTINGS_KEYS.cloakEnabled, enabled ? 'true' : 'false');
            applyCloak(enabled, type);
        });
    }
    if (cloakSelect) {
        cloakSelect.addEventListener('change', (e) => {
            localStorage.setItem(SETTINGS_KEYS.cloakType, e.target.value);
            const enabled = cloakToggle ? cloakToggle.checked : false;
            applyCloak(enabled, e.target.value);
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Prefer closing the image lightbox if it is open
            const lb = document.getElementById('image-lightbox');
            if (lb && !lb.classList.contains('hidden')) return;
            const cloakEnabled = localStorage.getItem(SETTINGS_KEYS.cloakEnabled) === 'true';
            if (cloakEnabled) window.location.href = 'https://docs.google.com';
        }
    });

    const bgInput = document.getElementById('bg-file-input');
    const removeBgBtn = document.getElementById('remove-bg-btn');
    const overlayRange = document.getElementById('bg-overlay-range');

    if (bgInput) {
        bgInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) { alert('Please choose a valid image file.'); return; }
            const reader = new FileReader();
            reader.onload = (evt) => {
                const dataUrl = evt.target.result;
                try {
                    localStorage.setItem(SETTINGS_KEYS.bgType, 'upload');
                    localStorage.setItem(SETTINGS_KEYS.bgValue, dataUrl);
                } catch (err) {
                    alert('That image is too large to save locally. Try a smaller/compressed image.');
                    return;
                }
                const overlay = overlayRange ? parseInt(overlayRange.value) : 70;
                applyBackground('upload', dataUrl, overlay);
            };
            reader.readAsDataURL(file);
        });
    }

    if (removeBgBtn) {
        removeBgBtn.addEventListener('click', () => {
            localStorage.removeItem(SETTINGS_KEYS.bgType);
            localStorage.removeItem(SETTINGS_KEYS.bgValue);
            applyBackground(null, null);
            if (bgInput) bgInput.value = '';
        });
    }

    if (overlayRange) {
        overlayRange.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            localStorage.setItem(SETTINGS_KEYS.bgOverlay, val);
            const layer = document.getElementById('custom-bg-layer');
            const ov = val / 100;
            if (layer) layer.style.setProperty('--bg-overlay-alpha', ov);
            document.documentElement.style.setProperty('--panel-bg-alpha', Math.max(0.18, ov * 0.55).toFixed(3));
        });
    }

    document.querySelectorAll('.bubble-style-option').forEach(opt => {
        opt.addEventListener('click', () => applyBubbleStyle(opt.getAttribute('data-style')));
    });
}

// ==========================================================================
// IMAGE ATTACHMENT HELPERS (shared by main chat + PMs)
// ==========================================================================
function readImageAsDataUrl(file, callback) {
    if (!file.type.startsWith('image/')) { alert('Please choose a valid image file.'); return; }
    if (file.size > 1.5 * 1024 * 1024) { alert('Please choose an image smaller than 1.5MB.'); return; }
    const reader = new FileReader();
    reader.onload = (evt) => callback(evt.target.result);
    reader.readAsDataURL(file);
}

function initImageAttachUI() {
    // Main chat attach
    const attachBtn = document.getElementById('attach-image-btn');
    const attachInput = document.getElementById('attach-image-input');
    const previewBar = document.getElementById('image-preview-bar');
    const previewThumb = document.getElementById('image-preview-thumb');
    const cancelBtn = document.getElementById('cancel-image-btn');

    if (attachBtn && attachInput) {
        attachBtn.addEventListener('click', () => attachInput.click());
        attachInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            readImageAsDataUrl(file, (dataUrl) => {
                pendingImageDataUrl = dataUrl;
                previewThumb.src = dataUrl;
                previewBar.classList.remove('hidden');
            });
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            pendingImageDataUrl = null;
            attachInput.value = '';
            previewBar.classList.add('hidden');
        });
    }

    // PM thread attach
    const pmAttachBtn = document.getElementById('pm-attach-image-btn');
    const pmAttachInput = document.getElementById('pm-attach-image-input');
    const pmPreviewBar = document.getElementById('pm-image-preview-bar');
    const pmPreviewThumb = document.getElementById('pm-image-preview-thumb');
    const pmCancelBtn = document.getElementById('pm-cancel-image-btn');

    if (pmAttachBtn && pmAttachInput) {
        pmAttachBtn.addEventListener('click', () => pmAttachInput.click());
        pmAttachInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            readImageAsDataUrl(file, (dataUrl) => {
                pendingPmImageDataUrl = dataUrl;
                pmPreviewThumb.src = dataUrl;
                pmPreviewBar.classList.remove('hidden');
            });
        });
    }
    if (pmCancelBtn) {
        pmCancelBtn.addEventListener('click', () => {
            pendingPmImageDataUrl = null;
            pmAttachInput.value = '';
            pmPreviewBar.classList.add('hidden');
        });
    }
}

// Globally scoped Quick Reply utility handler
window.mentionUser = function(rawEncodedName) {
    const input = document.getElementById('message-input');
    if (!input) return;
    
    const targetName = decodeURIComponent(rawEncodedName).trim();
    if (input.value.includes(`@${targetName}`)) return;
    
    input.value = input.value ? `${input.value.trim()} @${targetName} ` : `@${targetName} `;
    input.focus();
    
    const counter = document.getElementById('char-counter');
    if (counter) {
        const len = input.value.length;
        counter.textContent = `${len} / 1200`;
    }
};

// --- USER CONTEXT MENU LOGIC ---
window.openUserMenu = function(event, targetUsername) {
    event.preventDefault();
    event.stopPropagation();

    selectedChatUser = { 
        username: targetUsername, 
        handler: usernameToHandle(targetUsername)
    };

    const menu = document.getElementById('chat-user-menu');
    const usernameEl = document.getElementById('menu-username');
    const handlerEl = document.getElementById('menu-handler');

    if (usernameEl) usernameEl.textContent = selectedChatUser.username;
    if (handlerEl) handlerEl.textContent = selectedChatUser.handler;

    if (menu) {
        let posX = event.clientX;
        let posY = event.clientY;
        const menuWidth = 220;
        const menuHeight = 180;
        if (posX + menuWidth > window.innerWidth) posX = window.innerWidth - menuWidth - 10;
        if (posY + menuHeight > window.innerHeight) posY = window.innerHeight - menuHeight - 10;
        menu.style.left = `${posX}px`;
        menu.style.top = `${posY}px`;
        menu.classList.remove('hidden');
    }
};

document.addEventListener('click', (e) => {
    const menu = document.getElementById('chat-user-menu');
    if (menu && !e.target.closest('#chat-user-menu') && !e.target.closest('.chat-clickable')) {
        menu.classList.add('hidden');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const profileBtn = document.getElementById('menu-btn-profile');
    const pmBtn = document.getElementById('menu-btn-pm');
    const friendBtn = document.getElementById('menu-btn-friend');
    const blockBtn = document.getElementById('menu-btn-block');

    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            if (selectedChatUser.username) {
                window.location.href = `../profile/profile.html?user=${encodeURIComponent(selectedChatUser.username)}`;
            }
            document.getElementById('chat-user-menu')?.classList.add('hidden');
        });
    }

    if (pmBtn) {
        pmBtn.addEventListener('click', () => {
            document.getElementById('chat-user-menu')?.classList.add('hidden');
            if (selectedChatUser.username && window.switchTab) {
                window.switchTab('pms');
                window.openPmWithUser?.(selectedChatUser.username);
            }
        });
    }

    if (friendBtn) {
        friendBtn.addEventListener('click', () => {
            alert(`Friend request sent to ${selectedChatUser.username}!`);
            document.getElementById('chat-user-menu')?.classList.add('hidden');
        });
    }

    if (blockBtn) {
        blockBtn.addEventListener('click', () => {
            if (!selectedChatUser.username) return;
            if (confirm(`Are you sure you want to block ${selectedChatUser.username}? You won't see their messages in chat.`)) {
                let blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '[]');
                if (!blockedUsers.includes(selectedChatUser.username)) {
                    blockedUsers.push(selectedChatUser.username);
                    localStorage.setItem('blockedUsers', JSON.stringify(blockedUsers));
                }
                alert(`User blocked successfully.`);
                document.getElementById('chat-user-menu')?.classList.add('hidden');
                if (window.refreshChatMessages) window.refreshChatMessages();
            }
        });
    }

    loadAllSettings();
    initSettingsPanelBindings();
    initImageAttachUI();

    // New PM modal open/close
    const newPmBtn = document.getElementById('new-pm-btn');
    const modal = document.getElementById('new-pm-modal');
    const closeModalBtn = document.getElementById('close-new-pm-modal');
    const searchInput = document.getElementById('pm-user-search-input');

    if (newPmBtn && modal) {
        newPmBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            if (searchInput) { searchInput.value = ''; searchInput.focus(); }
            renderPmUserSearchResults('');
        });
    }
    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }
    if (modal) {
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
    }
    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderPmUserSearchResults(e.target.value));
    }
});

function renderPmUserSearchResults(term) {
    const container = document.getElementById('pm-user-search-results');
    if (!container) return;
    const lower = term.trim().toLowerCase();

    const results = allUsers.filter(u => {
        if (u.username === myUsernameGlobal) return false;
        const handle = usernameToHandle(u.username);
        return !lower || u.username.toLowerCase().includes(lower) || handle.includes(lower);
    }).slice(0, 30);

    if (results.length === 0) {
        container.innerHTML = `<p class="pm-empty-hint">No matching users found.</p>`;
        return;
    }

    container.innerHTML = results.map(u => `
        <div class="pm-user-result-item" data-username="${u.username.replace(/"/g, '&quot;')}">
            <img src="${u.pfp_url || DEFAULT_PFP}" alt="">
            <div>
                <div class="pmr-name">${u.username}</div>
                <div class="pmr-handle">${usernameToHandle(u.username)}</div>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.pm-user-result-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const username = item.getAttribute('data-username');
            window.startNewPm(username);
        });
    });
}

window.startNewPm = function(username) {
    suppressPmRefresh = true;
    document.getElementById('new-pm-modal')?.classList.add('hidden');
    if (window.switchTab) window.switchTab('pms');
    window.openPmWithUser?.(username);
    setTimeout(() => { suppressPmRefresh = false; }, 500);
};

// Global initialization hook exposed directly to main.js router
window.initializeChatEngine = async function() {
    const user = localStorage.getItem('chatUser');
    
    if (!user) {
        window.location.href = "../Login/login.html";
        return;
    }

    myUsernameGlobal = user;
    myHandleGlobal = usernameToHandle(user);
    if (localStorage.getItem(NOTIF_PREF_KEY) === 'granted' && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        notificationsReady = true;
    }

    if (chatPollingInterval) clearInterval(chatPollingInterval);
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (pmPollingInterval) clearInterval(pmPollingInterval);
    if (userActivityTrackingInterval) clearInterval(userActivityTrackingInterval);

    try {
        const verifyRes = await fetch(`${TURSO_API_BASE}/users`, {
            headers: TURSO_HEADERS
        });
        const verifyData = await verifyRes.json();
        const verifyList = unwrapList(verifyData, 'users');

        const userExists = verifyList.some(u => u.username && u.username.trim().toLowerCase() === user.trim().toLowerCase());
        if (!userExists) {
            localStorage.removeItem('chatUser');
            localStorage.clear();
            window.location.href = "../Login/login.html";
            return;
        }
    } catch (authError) {
        console.error("Security handshake failed:", authError);
    }

    // --- IMPROVED ONLINE/OFFLINE TRACKING (mouse movement based) ---
    async function executePresenceHeartbeat() {
        try {
            // Calculate if user is "online" based on mouse activity
            const timeSinceLastActivity = Date.now() - lastMouseActivity;
            const isCurrentlyActive = timeSinceLastActivity < 5 * 60 * 1000; // 5 minutes
            
            // Only update if active
            if (isCurrentlyActive) {
                await fetch(`${TURSO_API_BASE}/user-roles?username=${encodeURIComponent(user)}`, {
                    method: 'PATCH',
                    headers: TURSO_HEADERS,
                    body: JSON.stringify({ last_seen: new Date().toISOString() })
                });
            }
        } catch (e) { console.error("Heartbeat sync lost:", e); }
    }
    
    executePresenceHeartbeat();
    heartbeatInterval = setInterval(executePresenceHeartbeat, 15000); // Check every 15 seconds

    try {
        const banRes = await fetch(`${TURSO_API_BASE}/user-roles`, {
            headers: TURSO_HEADERS
        });
        const banData = await banRes.json();
        
        if (banData && Array.isArray(banData)) {
            const profile = banData.find(r => r.username && r.username.trim().toLowerCase() === user.trim().toLowerCase());
            
            if (profile) {
                currentUserIsAdmin = isAdminProfile(profile);

                if (isBannedFlag(profile.is_banned)) {
                    alert("This account has been permanently banned from the server.");
                    localStorage.removeItem('chatUser');
                    window.location.href = "../Login/login.html";
                    return;
                }
                if (profile.temp_ban_until) {
                    const expiryTime = new Date(profile.temp_ban_until).getTime();
                    if (expiryTime > Date.now()) {
                        alert(`You are temporarily banned until: ${new Date(profile.temp_ban_until).toLocaleString()}`);
                        localStorage.removeItem('chatUser');
                        window.location.href = "../Login/login.html";
                        return;
                    }
                }
                
                const systemFooterAvatar = document.getElementById('current-user-avatar');
                if (systemFooterAvatar) systemFooterAvatar.src = profile.pfp_url || DEFAULT_PFP;
            }
        }
    } catch (banCheckErr) {
        console.error("Ban check failed:", banCheckErr);
    }

    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) usernameDisplay.textContent = user;
    
    if (currentUserIsAdmin) {
        const adminTab = document.getElementById('admin-tab');
        if (adminTab) adminTab.style.display = 'block';
        const pmTab = document.getElementById('pm-tab');
        if (pmTab) pmTab.style.display = 'block';
    }

    const msgContainer = document.getElementById('chat-messages');

    // --- TAB NAVIGATION UPDATE ---
    window.switchTab = (target) => {
        ['chat-view', 'rules-view', 'admin-panel-view', 'users-view', 'private-messages-view', 'settings-view', 'pms-view'].forEach(v => {
            const el = document.getElementById(v);
            if (el) el.style.display = 'none';
        });
        
        document.querySelectorAll('.channel').forEach(c => c.classList.remove('active'));
        
        if (target === 'general' || target === 'dev-logs') {
            const chatView = document.getElementById('chat-view');
            if (chatView) chatView.style.display = 'flex';
            const tabId = target === 'general' ? 'chan-general' : 'chan-dev';
            const tabEl = document.getElementById(tabId);
            if (tabEl) tabEl.classList.add('active');
        } 
        else if (target === 'admin') {
            const adminView = document.getElementById('admin-panel-view');
            if (adminView) adminView.style.display = 'block';
            const adminTab = document.getElementById('admin-tab');
            if (adminTab) adminTab.classList.add('active');
            fetchAllUsers();
        } 
        else if (target === 'private-messages') {
            const pmView = document.getElementById('private-messages-view');
            if (pmView) pmView.style.display = 'block';
            const pmTab = document.getElementById('pm-tab');
            if (pmTab) pmTab.classList.add('active');
            fetchAdminPrivateMessages();
        }
        else if (target === 'settings') {
            const settingsView = document.getElementById('settings-view');
            if (settingsView) settingsView.style.display = 'block';
            const settingsTab = document.getElementById('chan-settings');
            if (settingsTab) settingsTab.classList.add('active');
        }
        else if (target === 'pms') {
            const pmsView = document.getElementById('pms-view');
            if (pmsView) pmsView.style.display = 'block';
            const pmsTab = document.getElementById('chan-pms');
            if (pmsTab) pmsTab.classList.add('active');
            if (allUsers.length === 0) fetchAllUsers();
            fetchMyPrivateConversations();
            if (pmPollingInterval) clearInterval(pmPollingInterval);
            pmPollingInterval = setInterval(fetchMyPrivateConversations, 4000);
        }
        else {
            const viewId = target + '-view';
            const v = document.getElementById(viewId);
            if (v) v.style.display = 'block';
            
            const tabId = 'chan-' + target;
            const t = document.getElementById(tabId);
            if (t) t.classList.add('active');
            
            if (target === 'users') fetchAllUsers();
        }

        // Stop PM polling when leaving the PMs tab to save requests
        if (target !== 'pms' && pmPollingInterval) {
            clearInterval(pmPollingInterval);
            pmPollingInterval = null;
        }
    };

    function updateAdminUserDatalist() {
        const datalist = document.getElementById('admin-user-suggestions');
        if (!datalist) return;
        datalist.innerHTML = allUsers.map(u => `<option value="${u.username}">`).join('');
        ['warn-search', 'ban-search', 'temp-ban-search', 'role-tag-search'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.setAttribute('list', 'admin-user-suggestions');
                input.oninput = (e) => {
                    if (e.target.value.startsWith('@')) e.target.value = e.target.value.replace(/^@+/, '');
                };
            }
        });
    }

    // --- ADMIN MASTER PM LOG ---
    window.fetchAdminPrivateMessages = async function() {
        const container = document.getElementById('admin-pm-container');
        if (!container || !currentUserIsAdmin) return;

        try {
            const res = await fetch(`${TURSO_API_BASE}/private-messages`, {
                headers: TURSO_HEADERS
            });
            const pmData = await res.json();

            if (!pmData || pmData.length === 0) {
                container.innerHTML = '<p style="color:var(--text-muted); text-align:center;">No private messages found in database.</p>';
                return;
            }

            container.innerHTML = pmData.map(pm => {
                const time = new Date(pm.created_at).toLocaleString();
                return `
                    <div style="border-bottom: 1px solid var(--border-soft); padding: 10px 0; display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <div style="font-size: 12px; color: var(--accent);">
                                <strong>${pm.sender_handle}</strong> → <strong>${pm.recipient_handle}</strong>
                                <span style="color: var(--text-muted); margin-left: 8px;">${time}</span>
                                ${pm.is_read ? '' : '<span style="color:#ff4444; margin-left:8px;">UNREAD</span>'}
                            </div>
                            <div style="color: #e0e0e0; margin-top: 4px; font-size: 14px;">
                                ${renderMessageBody(pm.content)}
                            </div>
                        </div>
                        <button style="background: #ff4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer;" 
                                onclick="deletePrivateMsg('${pm.id}')">
                            Delete
                        </button>
                    </div>
                `;
            }).join('');
        } catch (err) {
            console.error("Failed to load PM log:", err);
            container.innerHTML = '<p style="color:#ff4444;">Error fetching private messages.</p>';
        }
    };

    window.deletePrivateMsg = async (id) => {
        if (!confirm("Are you sure you want to delete this private message?")) return;
        try {
            await fetch(`${TURSO_API_BASE}/private-messages`, {
                method: 'DELETE',
                headers: TURSO_HEADERS
            });
            fetchAdminPrivateMessages();
        } catch (e) { console.error("Deletion failed:", e); }
    };

    // ==========================================================================
    // REAL 1:1 PRIVATE MESSAGING (uses the private_messages table directly)
    // Columns: id, sender_handle, recipient_handle, content, created_at, is_read
    // ==========================================================================
    async function fetchMyPrivateConversations() {
        if (suppressPmRefresh) return;
        try {
            const partners = new Set();
            (allUsers || []).forEach(u => {
                if (u && u.username && u.username !== myUsernameGlobal) partners.add(u.username);
            });
            if (activePmHandle) {
                const uname = String(activePmHandle).replace(/^@/, '');
                if (uname) partners.add(uname);
            }
            const all = [];
            await Promise.all([...partners].map(async (otherUser) => {
                try {
                    const url = `${TURSO_API_BASE}/private-messages?sender_username=${encodeURIComponent(myUsernameGlobal)}&recipient_username=${encodeURIComponent(otherUser)}`;
                    const r = await fetch(url, { headers: TURSO_HEADERS });
                    if (!r.ok) return;
                    const rows = await r.json();
                    if (Array.isArray(rows)) all.push(...rows);
                } catch (e) { /* skip partner */ }
            }));
            all.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

            const freshConversations = {};
            all.forEach(msg => {
                const isMine = msg.sender_handle === myHandleGlobal || msg.sender_username === myUsernameGlobal;
                const otherHandle = isMine
                    ? (msg.recipient_handle || ('@' + String(msg.recipient_username || '').toLowerCase().replace(/\s+/g, '_')))
                    : (msg.sender_handle || ('@' + String(msg.sender_username || '').toLowerCase().replace(/\s+/g, '_')));
                if (!freshConversations[otherHandle]) {
                    freshConversations[otherHandle] = { otherHandle, otherUsername: handleToDisplayUsername(otherHandle), messages: [], unread: 0 };
                }
                freshConversations[otherHandle].messages.push(msg);
                if (!isMine && !msg.is_read) {
                    freshConversations[otherHandle].unread++;
                    // Browser notification for new PM (skip first seed pass)
                    if (msg.id && notificationsReady && knownPmIds.size > 0 && !knownPmIds.has(msg.id)) {
                        const who = msg.sender_username || otherHandle || 'Someone';
                        const preview = String(msg.content || '').replace(/^\[\[IMG\]\].*/, '[Image]').slice(0, 120);
                        showChatNotification('PM from ' + who, preview || 'New private message', 'pm-' + msg.id);
                    }
                    if (msg.id) knownPmIds.add(msg.id);
                } else if (msg.id) {
                    knownPmIds.add(msg.id);
                }
            });

            if (activePmHandle && !freshConversations[activePmHandle] && pmConversations[activePmHandle]) {
                freshConversations[activePmHandle] = pmConversations[activePmHandle];
            }

            pmConversations = freshConversations;

            renderPmConversationList();
            updatePmUnreadBadge();

            if (activePmHandle && pmConversations[activePmHandle]) {
                renderPmThread(activePmHandle);
            }
        } catch (err) {
            console.error("Failed to fetch private conversations:", err);
        }
    }

    function handleToDisplayUsername(handle) {
        const match = allUsers.find(u => usernameToHandle(u.username) === handle);
        return match ? match.username : handle.replace('@', '');
    }

    function pfpForHandle(handle) {
        const match = allUsers.find(u => usernameToHandle(u.username) === handle);
        return match ? (match.pfp_url || DEFAULT_PFP) : DEFAULT_PFP;
    }

    function updatePmUnreadBadge() {
        const totalUnread = Object.values(pmConversations).reduce((sum, c) => sum + c.unread, 0);
        const badge = document.getElementById('pm-unread-badge');
        if (badge) {
            if (totalUnread > 0) {
                badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    function renderPmConversationList() {
        const list = document.getElementById('pm-convo-list');
        if (!list) return;

        const convos = Object.values(pmConversations).sort((a, b) => {
            const aLast = a.messages[a.messages.length - 1];
            const bLast = b.messages[b.messages.length - 1];
            if (!aLast && !bLast) return 0;
            if (!aLast) return -1;
            if (!bLast) return 1;
            return new Date(bLast.created_at) - new Date(aLast.created_at);
        });

        if (convos.length === 0) {
            list.innerHTML = `<p class="pm-empty-hint">No conversations yet. Click "+ New PM" to message someone.</p>`;
            return;
        }

        list.innerHTML = convos.map(c => {
            const lastMsg = c.messages[c.messages.length - 1];
            const previewText = !lastMsg
                ? 'Say hello!'
                : (lastMsg.content.startsWith(IMG_MARKER)
                    ? '📷 Image'
                    : lastMsg.content);
            const isActive = c.otherHandle === activePmHandle;
            return `
                <div class="pm-convo-item ${isActive ? 'active-convo' : ''}" data-handle="${c.otherHandle.replace(/"/g, '&quot;')}">
                    <img src="${pfpForHandle(c.otherHandle)}" alt="">
                    <div class="pm-convo-text">
                        <div class="pm-convo-name">${c.otherUsername}</div>
                        <div class="pm-convo-preview">${previewText}</div>
                    </div>
                    ${c.unread > 0 ? '<div class="pm-unread-dot"></div>' : ''}
                </div>
            `;
        }).join('');

        list.querySelectorAll('.pm-convo-item').forEach(item => {
            item.addEventListener('click', () => {
                window.openPmConversation(item.getAttribute('data-handle'));
            });
        });
    }

    async function markConversationRead(otherHandle) {
        const convo = pmConversations[otherHandle];
        if (!convo || convo.unread === 0) return;
        try {
            const unread = (convo.messages || []).filter(m => !m.is_read && m.sender_username !== myUsernameGlobal && m.sender_handle !== myHandleGlobal);
            await Promise.all(unread.map(async (m) => {
                const id = m.id || m.ID;
                if (!id) return;
                await fetch(`${TURSO_API_BASE}/private-messages`, {
                    method: 'PATCH',
                    headers: TURSO_HEADERS,
                    body: JSON.stringify({ id })
                });
            }));
            convo.unread = 0;
            updatePmUnreadBadge();
        } catch (e) { console.error("Failed marking conversation read:", e); }
    }

    function renderPmThread(otherHandle) {
        const convo = pmConversations[otherHandle];
        const threadMessages = document.getElementById('pm-thread-messages');
        const threadTitle = document.getElementById('pm-thread-title');
        const threadForm = document.getElementById('pm-thread-form');
        if (!threadMessages) return;

        if (threadTitle) threadTitle.textContent = convo ? convo.otherUsername : otherHandle.replace('@', '');
        if (threadForm) threadForm.classList.remove('hidden');

        if (!convo || convo.messages.length === 0) {
            threadMessages.innerHTML = `<p class="pm-empty-hint">Send your first message below to start the conversation.</p>`;
            return;
        }

        threadMessages.innerHTML = convo.messages.map(msg => {
            const isMine = msg.sender_handle === myHandleGlobal;
            const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const bubbleExtra = isMine && getSavedBubbleStyle() !== 'default' ? ` style-${getSavedBubbleStyle()}` : '';
            return `
                <div class="message-wrapper ${isMine ? 'my-message-wrapper' : 'other-message-wrapper'}">
                    <img src="${pfpForHandle(isMine ? myHandleGlobal : otherHandle)}" class="chat-pfp" alt="">
                    <div class="message-content-node">
                        <div class="message-meta-header">
                            <span><strong>${isMine ? 'You' : convo.otherUsername}</strong></span>
                            <span class="message-timestamp">${time}</span>
                        </div>
                        <div class="message-text-bubble ${isMine ? 'my-bubble-color' : 'other-bubble-color'}${bubbleExtra}">
                            ${renderMessageBody(msg.content)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        threadMessages.scrollTop = threadMessages.scrollHeight;
    }

    window.openPmConversation = function(otherHandle) {
        activePmHandle = otherHandle;
        renderPmConversationList();
        renderPmThread(otherHandle);
        markConversationRead(otherHandle);
    };

    window.openPmWithUser = function(username) {
        const handle = usernameToHandle(username);
        if (!pmConversations[handle]) {
            pmConversations[handle] = { otherHandle: handle, otherUsername: username, messages: [], unread: 0 };
        }
        activePmHandle = handle;
        renderPmConversationList();
        renderPmThread(handle);
    };

    async function sendPrivateMessage(content) {
        if (!activePmHandle) return;
        try {
            const convo = pmConversations[activePmHandle];
            const recipientUsername = (convo && convo.otherUsername)
                ? convo.otherUsername
                : String(activePmHandle).replace(/^@/, '');
            const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : ('pm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10));
            const createdAt = new Date().toISOString();
            const res = await fetch(`${TURSO_API_BASE}/private-messages`, {
                method: 'POST',
                headers: TURSO_HEADERS,
                body: JSON.stringify({
                    id: id,
                    sender_username: myUsernameGlobal,
                    recipient_username: recipientUsername,
                    content: content,
                    is_read: 0,
                    created_at: createdAt
                })
            });
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                console.error("PM API error:", res.status, errBody);
                throw new Error(errBody.error || ('HTTP ' + res.status));
            }
            if (!pmConversations[activePmHandle]) {
                pmConversations[activePmHandle] = {
                    otherHandle: activePmHandle,
                    otherUsername: recipientUsername,
                    messages: [],
                    unread: 0
                };
            }
            pmConversations[activePmHandle].messages.push({
                id: id,
                sender_username: myUsernameGlobal,
                recipient_username: recipientUsername,
                content: content,
                is_read: 0,
                created_at: createdAt
            });
            renderPmThread(activePmHandle);
            renderPmConversationList();
            await fetchMyPrivateConversations();
        } catch (err) {
            console.error("Failed to send private message:", err);
            alert("Could not send that message. Please try again.");
        }
    }

    const pmForm = document.getElementById('pm-thread-form');
    if (pmForm) {
        pmForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('pm-message-input');
            const val = input.value.trim();

            if (pendingPmImageDataUrl) {
                const imgPayload = IMG_MARKER + pendingPmImageDataUrl;
                pendingPmImageDataUrl = null;
                document.getElementById('pm-attach-image-input').value = '';
                document.getElementById('pm-image-preview-bar')?.classList.add('hidden');
                await sendPrivateMessage(imgPayload);
            }

            if (val) {
                input.value = '';
                await sendPrivateMessage(val);
            }
        });
    }

    // --- USER DIRECTORY ---
    async function fetchAllUsers() {
        try {
            const usersRes = await fetch(`${TURSO_API_BASE}/users`, {
                headers: TURSO_HEADERS
            });
            const usersDataRaw = await usersRes.json();
            const usersData = unwrapList(usersDataRaw, 'users');

            const rolesRes = await fetch(`${TURSO_API_BASE}/user-roles`, {
                headers: TURSO_HEADERS
            });
            const rolesDataRaw = await rolesRes.json();
            const rolesData = unwrapList(rolesDataRaw, 'roles').length
                ? unwrapList(rolesDataRaw, 'roles')
                : (Array.isArray(rolesDataRaw) ? rolesDataRaw : (rolesDataRaw && rolesDataRaw.username ? [rolesDataRaw] : []));

            const uniqueNames = [...new Set(usersData.map(u => u.username))].filter(name => name != null);
            
            allUsers = uniqueNames.map(name => {
                const foundProfile = rolesData.find(r => r.username === name);
                const checkAdminStatus = foundProfile ? foundProfile.is_admin : false;
                return {
                    username: name,
                    pfp_url: foundProfile ? foundProfile.pfp_url : DEFAULT_PFP,
                    role_tag: foundProfile ? foundProfile.role_tag : 'User',
                    last_seen: foundProfile ? foundProfile.last_seen : null,
                    is_banned: isBannedFlag(foundProfile && foundProfile.is_banned),
                    is_admin: isAdminProfile(foundProfile)
                };
            });
            
            renderUserDirectory();
            updateAdminUserDatalist();

            if (currentUserIsAdmin) {
                renderAdminStats();
                renderAdminUserTable();
            }
        } catch (err) { console.error("Could not fetch user database collection:", err); }
    }

    function renderUserDirectory(filterTerm = "") {
        const listContainer = document.getElementById('user-list-display');
        if (!listContainer) return;
        const filtered = allUsers.filter(u => u.username.toLowerCase().includes(filterTerm.toLowerCase()));
        
        listContainer.innerHTML = filtered.map(u => {
            const displayTag = isAdminProfile(u) ? (u.role_tag || 'ADMIN') : (u.role_tag || 'User');
            let onlineDot = "rgba(160, 146, 141, 0.4)";
            let statusLabel = "OFFLINE";
            if (u.last_seen) {
                const diff = Date.now() - new Date(u.last_seen).getTime();
                // Updated: 5 minutes instead of old hardcoded value
                if (diff < 5 * 60 * 1000) { onlineDot = "#22c55e"; statusLabel = "ONLINE"; }
            }

            return `
                <div class="admin-card" style="text-align:center; position: relative;">
                    <div style="position: absolute; top: 10px; right: 10px; font-size: 9px; font-weight: bold; color: ${onlineDot}; border: 1px solid ${onlineDot}; padding: 1px 4px; border-radius: 3px;">
                        ${statusLabel}
                    </div>
                    <img class="avatar chat-clickable" src="${u.pfp_url || DEFAULT_PFP}" style="margin: 0 auto 10px; width:50px; height:50px; display:block; object-fit:cover; border-radius:50%; border: 2px solid ${onlineDot};" onclick="openUserMenu(event, '${u.username}')">
                    <span class="chat-clickable" style="color:white; font-weight:bold; cursor:pointer;" onclick="openUserMenu(event, '${u.username}')">
                        ${u.username}
                    </span>
                    <div style="font-size:11px; color:var(--text-muted); margin-top:5px; text-transform:uppercase;">[${displayTag}]</div>
                </div>
            `;
        }).join('');
    }

    // --- ADMIN: STATS ROW ---
    function renderAdminStats() {
        const row = document.getElementById('admin-stats-row');
        if (!row) return;
        const total = allUsers.length;
        const bannedCount = allUsers.filter(u => u.is_banned).length;
        const adminCount = allUsers.filter(u => isAdminProfile(u)).length;
        const onlineCount = allUsers.filter(u => u.last_seen && (Date.now() - new Date(u.last_seen).getTime() < 5 * 60 * 1000)).length;

        row.innerHTML = `
            <div class="admin-stat-card"><div class="stat-value">${total}</div><div class="stat-label">Total Users</div></div>
            <div class="admin-stat-card stat-good"><div class="stat-value">${onlineCount}</div><div class="stat-label">Online Now</div></div>
            <div class="admin-stat-card"><div class="stat-value">${adminCount}</div><div class="stat-label">Admins</div></div>
            <div class="admin-stat-card stat-danger"><div class="stat-value">${bannedCount}</div><div class="stat-label">Banned</div></div>
        `;
    }

    // --- ADMIN: QUICK USER MANAGEMENT TABLE ---
    function renderAdminUserTable(filterTerm = "") {
        const table = document.getElementById('admin-user-table');
        if (!table) return;
        const filtered = allUsers.filter(u => u.username.toLowerCase().includes(filterTerm.toLowerCase()));

        if (filtered.length === 0) {
            table.innerHTML = `<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:20px 0;">No users match that search.</p>`;
            return;
        }

        table.innerHTML = filtered.map(u => {
            let onlineDot = "rgba(160, 146, 141, 0.4)";
            if (u.last_seen && (Date.now() - new Date(u.last_seen).getTime() < 5 * 60 * 1000)) onlineDot = "#22c55e";
            const tagLabel = isAdminProfile(u) ? (u.role_tag || 'ADMIN') : (u.role_tag || 'User');
            const banLabel = u.is_banned ? `<span style="color:#ff4444; font-weight:bold;"> · BANNED</span>` : '';
            const safeName = u.username.replace(/'/g, "\\'");

            return `
                <div class="admin-user-row">
                    <img src="${u.pfp_url || DEFAULT_PFP}" style="border: 2px solid ${onlineDot};" alt="">
                    <div class="aur-name">
                        <strong>${u.username}</strong>
                        <span>[${tagLabel}]${banLabel}</span>
                    </div>
                    <div class="aur-actions">
                        <button class="aur-btn warn" onclick="quickAdminAction('warn', '${safeName}')">Warn</button>
                        ${u.is_banned
                            ? `<button class="aur-btn unban" onclick="quickAdminAction('unban', '${safeName}')">Unban</button>`
                            : `<button class="aur-btn ban" onclick="quickAdminAction('ban', '${safeName}')">Ban</button>`
                        }
                        <button class="aur-btn promote" onclick="quickAdminAction('${isAdminProfile(u) ? 'demote' : 'promote'}', '${safeName}')">${isAdminProfile(u) ? 'Demote' : 'Promote'}</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    window.quickAdminAction = async (action, username) => {
        let reason = "";
        if (action === 'warn' || action === 'ban') {
            reason = prompt(`Reason for ${action === 'warn' ? 'warning' : 'banning'} ${username}:`, "") || "";
            if (reason === null) return;
        }
        if ((action === 'promote' || action === 'demote') && !confirm(`${action === 'promote' ? 'Grant' : 'Remove'} admin privileges for ${username}?`)) return;

        let data = { last_action_reason: reason, last_action_type: action };
        if (action === 'ban') data.is_banned = true;
        else if (action === 'unban') { data.is_banned = false; data.warned = false; data.temp_ban_until = null; }
        else if (action === 'warn') data.warned = true;
        else if (action === 'promote') data.is_admin = true;
        else if (action === 'demote') data.is_admin = false;

        try {
            const res = await patchUserRoleByUsername(username, data);
            if (!res.ok) throw new Error(await res.text());

            const target = allUsers.find(u => u.username === username);
            if (target) {
                if (action === 'ban') target.is_banned = true;
                if (action === 'unban') target.is_banned = false;
                if (action === 'promote') target.is_admin = true;
                if (action === 'demote') target.is_admin = false;
            }
            renderAdminStats();
            renderAdminUserTable(document.getElementById('admin-quick-search')?.value || "");
        } catch (err) {
            console.error("Quick action failed:", err);
            alert("Action failed. Check console for details.");
        }
    };

    const quickSearchInput = document.getElementById('admin-quick-search');
    if (quickSearchInput) quickSearchInput.oninput = (e) => renderAdminUserTable(e.target.value);

    // --- ADMIN: BROADCAST ANNOUNCEMENT ---
    window.sendBroadcast = async () => {
        const textEl = document.getElementById('broadcast-text');
        const text = textEl ? textEl.value.trim() : '';
        if (!text) return alert("Write an announcement message first.");

        try {
            await fetch(`${TURSO_API_BASE}/messages`, {
                method: 'POST',
                headers: TURSO_HEADERS,
                body: JSON.stringify({ username: `📢 ${user}`, content: `[ANNOUNCEMENT] ${text}` })
            });
            textEl.value = '';
            alert("Announcement posted to # general.");
            fetchMessages();
        } catch (err) {
            console.error("Broadcast failed:", err);
            alert("Failed to post announcement.");
        }
    };

    // --- ADMIN: SET CUSTOM ROLE TAG ---
    window.setRoleTag = async () => {
        let target = document.getElementById('role-tag-search').value.trim();
        const tag = document.getElementById('role-tag-value').value.trim();
        if (target.startsWith('@')) target = target.substring(1);
        if (!target) return alert("Enter a username.");
        if (!tag) return alert("Enter a role tag value.");

        try {
            const res = await patchUserRoleByUsername(target, { role_tag: tag });
            if (!res.ok) throw new Error(await res.text());
            alert(`Role tag "${tag}" applied to ${target}.`);
            fetchAllUsers();
        } catch (err) {
            console.error("Role tag update failed:", err);
            alert("Failed to set role tag.");
        }
    };

    // --- ADMIN: EXPORT USER DATA ---
    window.exportUserData = () => {
        const dataStr = JSON.stringify(allUsers, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    // --- MESSAGE ENGINE (MAIN CHAT) WITH ANTI-FLICKER OPTIMIZATION ---
    async function fetchMessages() {
        if (!document.getElementById('chat-messages')) {
            clearInterval(chatPollingInterval);
            clearInterval(heartbeatInterval);
            return;
        }
        try {
            const mRes = await fetch(`${TURSO_API_BASE}/messages?limit=200`, { 
                headers: TURSO_HEADERS
            });
            const rRes = await fetch(`${TURSO_API_BASE}/user-roles`, { 
                headers: TURSO_HEADERS
            });
            const messagesRaw = await mRes.json();
            const messages = Array.isArray(messagesRaw) ? messagesRaw : (messagesRaw && messagesRaw.messages) ? messagesRaw.messages : [];
            const rolesRaw = await rRes.json();
            const roles = Array.isArray(rolesRaw) ? rolesRaw : (rolesRaw ? [rolesRaw] : []);

            // Calculate a hash of current messages to avoid re-rendering if nothing changed
            const currentHash = JSON.stringify(messages.map(m => m.id));
            if (currentHash === lastFetchedMessagesHash) {
                return; // No new messages, skip re-render
            }
            // Notify about brand-new messages from other people
            if (knownMessageIds.size > 0) {
                messages.forEach(msg => {
                    if (!msg || !msg.id) return;
                    if (knownMessageIds.has(msg.id)) return;
                    const fromMe = msg.username && msg.username.trim().toLowerCase() === myUsernameGlobal.trim().toLowerCase();
                    if (!fromMe && msg.content !== "Message Was Deleted By Owner") {
                        const preview = String(msg.content || '').replace(/^\[\[IMG\]\].*/, '[Image]').slice(0, 120);
                        showChatNotification(msg.username || 'Someone', preview || 'New message in general chat', 'general-' + msg.id);
                    }
                });
            }
            // Seed / update known ids
            messages.forEach(msg => { if (msg && msg.id) knownMessageIds.add(msg.id); });

            lastFetchedMessagesHash = currentHash;

            const activeHeaderSpan = document.getElementById('room-status-indicator');
            if (activeHeaderSpan && roles) {
                const selfCheck = roles.find(r => r.username === user);
                if (selfCheck) {
                    activeHeaderSpan.textContent = "ONLINE";
                    activeHeaderSpan.style.color = "#22c55e";
                }
            }

            const isAtBottom = msgContainer.scrollHeight - msgContainer.scrollTop <= msgContainer.clientHeight + 100;
            const blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '[]');
            const myBubbleStyle = getSavedBubbleStyle();

            msgContainer.innerHTML = '';
            messages.forEach(msg => {
                if (blockedUsers.includes(msg.username)) return;

                const isDel = msg.content === "Message Was Deleted By Owner";
                const role = roles && roles.find ? roles.find(r => r.username === msg.username) : null;
                const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                const userPfp = role && role.pfp_url ? role.pfp_url : DEFAULT_PFP;
                const evaluatedRole = role && role.role_tag ? role.role_tag : 'User';
                const isMsgSenderAdmin = isAdminProfile(role);
                
                let tag = "";
                if (isMsgSenderAdmin || isAdminRoleTag(evaluatedRole)) {
                    tag = `<span class="badge admin-badge">ADMIN</span>`;
                } else if (evaluatedRole && evaluatedRole.toLowerCase() !== 'user') {
                    tag = `<span class="badge custom-badge">[${evaluatedRole.toUpperCase()}]</span>`;
                }

                let senderStatusColor = "transparent";
                if (role && role.last_seen) {
                    if (Date.now() - new Date(role.last_seen).getTime() < 5 * 60 * 1000) senderStatusColor = "#22c55e";
                }

                const isMine = msg.username === user;
                const bubbleExtraClass = (isMine && myBubbleStyle !== 'default') ? ` style-${myBubbleStyle}` : '';
                const isAnnouncement = typeof msg.content === 'string' && msg.content.startsWith('[ANNOUNCEMENT]');
                const bodyHtml = isAnnouncement
                    ? `<strong style="color:#3aa0ff;">📢 ${msg.content.replace('[ANNOUNCEMENT]', '').trim()}</strong>`
                    : renderMessageBody(msg.content);

                const div = document.createElement('div');
                div.className = `message-wrapper ${isMine ? 'my-message-wrapper' : 'other-message-wrapper'}`;
                
                div.innerHTML = `
                    <img src="${userPfp}" class="chat-pfp chat-clickable" alt="Avatar" style="border: 2px solid ${senderStatusColor};" onclick="openUserMenu(event, '${msg.username}')">
                    <div class="message-content-node">
                        <div class="message-meta-header">
                            <span class="chat-username-link chat-clickable" onclick="openUserMenu(event, '${msg.username}')">
                                <strong>${msg.username}</strong>
                            </span>
                            <span style="font-size:10px; color:var(--accent); cursor:pointer; margin-left:4px;" onclick="window.mentionUser('${encodeURIComponent(msg.username)}')">[reply]</span>
                            ${tag}
                            <span class="message-timestamp">${time}</span>
                        </div>
                        <div class="message-text-bubble ${isMine ? 'my-bubble-color' : 'other-bubble-color'}${bubbleExtraClass}" style="${isDel ? 'font-style:italic; opacity:0.5;' : ''}" oncontextmenu="openMessageMenu(event, '${msg.id}', '${msg.username}')">
                            ${bodyHtml}
                        </div>
                         ${(currentUserIsAdmin && !isDel) ? `<button style="background:none; color:red; font-size:10px; padding:0; margin-top:5px; cursor:pointer; width:auto; display:block;" onclick="deleteMsg('${msg.id}')">Delete</button>` : ""}
                    </div>
                `;
                msgContainer.appendChild(div);
            });

            if (isAtBottom) msgContainer.scrollTop = msgContainer.scrollHeight;
        } catch (e) { console.error(e); }
    }

    window.refreshChatMessages = fetchMessages;

    const msgInput = document.getElementById('message-input');
    const charCounter = document.getElementById('char-counter');
    if (msgInput && charCounter) {
        msgInput.oninput = (e) => {
            const len = e.target.value.length;
            charCounter.textContent = `${len} / 1200`;
            if (len >= 230) charCounter.style.color = "#ff4444";
            else if (len >= 200) charCounter.style.color = "var(--accent)";
            else charCounter.style.color = "var(--text-muted)";
        };
    }

    async function sendPlainMessage(content) {
        await fetch(`${TURSO_API_BASE}/messages`, {
            method: 'POST',
            headers: TURSO_HEADERS,
            body: JSON.stringify({ username: user, content })
        });
    }

    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        chatForm.onsubmit = async (e) => {
            e.preventDefault();
            const now = Date.now();
            const input = document.getElementById('message-input');

            if (!currentUserIsAdmin) {
                // Active spam penalty (30s)
                if (window._chatPenaltyUntil && now < window._chatPenaltyUntil) {
                    const left = Math.ceil((window._chatPenaltyUntil - now) / 1000);
                    return alert("Spam cooldown active. Wait " + left + " more seconds.");
                }
                // Normal minimum gap: 5 seconds
                if (now - lastMessageTime < 5000) {
                    window._chatPenaltyUntil = now + 30000; // 30 second penalty
                    return alert("Please wait at least 5 seconds between messages. You tried too fast — wait 30 seconds.");
                }
            }

            const val = input.value.trim();
            const hasImage = !!pendingImageDataUrl;

            if (!val && !hasImage) return;
            if (val.length > 1200) return alert(`Your message is too long (${val.length}/1200 characters). Please shorten it.`);

            input.disabled = true;

            try {
                if (val && typeof filterBadWords === 'function') {
                    const cleanText = filterBadWords(val);
                    if (cleanText !== val) {
                        alert("Message blocked by filter! Please remove inappropriate language before sending.");
                        input.disabled = false;
                        input.focus();
                        return;
                    }
                }

                lastMessageTime = now;

                if (hasImage) {
                    const imgPayload = IMG_MARKER + pendingImageDataUrl;
                    pendingImageDataUrl = null;
                    document.getElementById('attach-image-input').value = '';
                    document.getElementById('image-preview-bar')?.classList.add('hidden');
                    await sendPlainMessage(imgPayload);
                }

                if (val) {
                    input.value = "";
                    if (charCounter) charCounter.textContent = "0 / 1200";
                    await sendPlainMessage(val);
                }

                lastFetchedMessagesHash = null; // Reset hash to force refresh after sending
                fetchMessages().then(() => { msgContainer.scrollTop = msgContainer.scrollHeight; });
            } catch (err) {
                console.error("Message send failed:", err);
                alert("Database connection failed.");
            } finally {
                input.disabled = false;
                input.focus();
            }
        };
    }

    window.adminExecute = async (action) => {
        let target = document.getElementById(action === 'warn' ? 'warn-search' : 'ban-search').value.trim();
        const reason = document.getElementById(action === 'warn' ? 'warn-reason' : 'ban-reason').value.trim();
        const cat = document.getElementById('ban-category')?.value || 'Both';

        if (!target) return alert("Enter a username.");
        if (target.startsWith('@')) target = target.substring(1);

        let data = { last_action_reason: reason, last_action_type: action, last_action_category: cat };
        if (action === 'ban') { data.is_banned = true; }
        else if (action === 'unban') { data.is_banned = false; data.warned = false; data.temp_ban_until = null; }
        else if (action === 'warn') data.warned = true;

        try {
            const res = await patchUserRoleByUsername(target, data);
            if (!res.ok) throw new Error(await res.text());
            alert("Action completed successfully!");
            fetchAllUsers();
        } catch (err) {
            console.error("Database update failed:", err);
            alert("Failed to update user. Check console for details.");
        }
    };

    window.executeTempBan = async () => {
        let target = document.getElementById('temp-ban-search').value.trim();
        if (target.startsWith('@')) target = target.substring(1);
        if (!target) return alert("Enter a username.");
        
        const durationInput = document.getElementById('temp-ban-duration').value;
        const duration = parseInt(durationInput);
        if (isNaN(duration) || duration <= 0) return alert("Please enter a valid number of minutes for the ban duration!");
        
        const reason = document.getElementById('temp-ban-reason').value.trim();
        const expiry = new Date(); 
        expiry.setMinutes(expiry.getMinutes() + duration);

        try {
            const res = await patchUserRoleByUsername(target, {
                last_action_type: 'temp_ban',
                last_action_reason: reason,
                last_action_category: 'Temp Ban',
                temp_ban_until: expiry.toISOString(),
                is_banned: false
            });
            if (!res.ok) throw new Error(await res.text());
            alert("Temporary ban applied successfully!");
            fetchAllUsers();
        } catch (err) {
            console.error("Temp ban failed:", err);
            alert("Failed to apply temp ban. Check console for details.");
        }
    };

    window.deleteMsg = async (id) => {
        await fetch(`${TURSO_API_BASE}/messages`, { 
            method: 'PATCH', 
            headers: TURSO_HEADERS, 
            body: JSON.stringify({ content: "Message Was Deleted By Owner" })
        });
        lastFetchedMessagesHash = null; // Force refresh
        fetchMessages();
    };

    const dirSearch = document.getElementById('directory-search');
    if (dirSearch) dirSearch.oninput = (e) => renderUserDirectory(e.target.value);


    // Ask about notifications after login (once)
    setTimeout(() => promptEnableNotifications(), 800);

    chatPollingInterval = setInterval(fetchMessages, 3000);
    fetchMessages().then(() => { msgContainer.scrollTop = msgContainer.scrollHeight; });
};

if (document.getElementById('chat-messages')) {
    window.initializeChatEngine();
}

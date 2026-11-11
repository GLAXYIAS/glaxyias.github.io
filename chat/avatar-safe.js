/*
 * Chat history window fix (loaded before chat.js in chat.html).
 *
 * The messages API only honours `limit`: order/offset/after are ignored and
 * rows come back oldest-first. chat.js asked for limit=200, so as soon as the
 * table passed 200 rows every new message was written to Turso but fell
 * outside the returned window - it looked like messages vanished even though
 * they were stored. Widen the window to 1000 rows so new messages come back.
 */
(function () {
  "use strict";
  if (window.__nxMessageWindowFix) return;
  window.__nxMessageWindowFix = true;
  var nativeFetch = window.fetch;
  if (typeof nativeFetch !== "function") return;
  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    if (url.indexOf("/messages?limit=200") !== -1) {
      return nativeFetch.call(this, url.replace("/messages?limit=200", "/messages?limit=1000"), init);
    }
    return nativeFetch.call(this, input, init);
  };
})();

/*
 * Chat profanity guard: the CDN filter wipes any field it flags when the
 * field is committed (Enter/blur). That erased the whole message before the
 * writer could fix the flagged word. Swallow that change event for the chat
 * boxes, and keep a safety net: if a wipe still happens, put the text back
 * once the filter has counted the violation. Its submit/Enter guards still
 * block sending until the text is clean.
 */
(function () {
  "use strict";
  var IDS = { "message-input": 1, "pm-message-input": 1 };
  function isChatField(el) { return !!(el && el.id && IDS[el.id]); }

  var lastGood = new WeakMap();

  document.addEventListener("input", function (event) {
    var el = event.target;
    if (!isChatField(el)) return;
    if (el.value) lastGood.set(el, { value: el.value, violations: el.__bwViolationCount || 0 });
  }, true);

  function restore(el) {
    var snap = lastGood.get(el);
    if (!snap || !snap.value || el.value !== "") return;
    var now = el.__bwViolationCount || 0;
    if (now <= snap.violations) return; // manual clear or a normal send
    el.value = snap.value;
    try { el.focus(); el.setSelectionRange(snap.value.length, snap.value.length); } catch (e) {}
  }

  window.addEventListener("change", function (event) {
    var el = event.target;
    if (!isChatField(el)) return;
    setTimeout(function () { restore(el); }, 60);
    event.stopPropagation();
  }, true);
})();

/*
 * Chat Look: extra appearance controls added to the Chat Settings view.
 * Message size, bubble roundness, spacing, compact padding and timestamps,
 * saved in localStorage under nullchat_look.
 */
(function () {
  "use strict";
  var KEY = "nullchat_look";
  var DEFAULTS = { font: 14, radius: 12, gap: 15, compact: false, times: true };

  function read() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "{}");
      return Object.assign({}, DEFAULTS, raw || {});
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function apply(v) {
    var root = document.documentElement;
    root.style.setProperty("--nx-chat-font", v.font + "px");
    root.style.setProperty("--nx-chat-radius", v.radius + "px");
    root.style.setProperty("--nx-chat-gap", v.gap + "px");
    document.body.classList.toggle("nx-chat-compact", !!v.compact);
    document.body.classList.toggle("nx-chat-hide-time", !v.times);
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
    var f = document.getElementById("nx-look-font"); if (f) f.value = v.font;
    var r = document.getElementById("nx-look-radius"); if (r) r.value = v.radius;
    var g = document.getElementById("nx-look-gap"); if (g) g.value = v.gap;
    var fv = document.getElementById("nx-look-font-val"); if (fv) fv.textContent = v.font + "px";
    var rv = document.getElementById("nx-look-radius-val"); if (rv) rv.textContent = v.radius + "px";
    var gv = document.getElementById("nx-look-gap-val"); if (gv) gv.textContent = v.gap + "px";
    var c = document.getElementById("nx-look-compact"); if (c) c.checked = !!v.compact;
    var t = document.getElementById("nx-look-time"); if (t) t.checked = v.times !== false;
  }

  function injectCss() {
    if (document.getElementById("nx-chat-look-css")) return;
    var s = document.createElement("style");
    s.id = "nx-chat-look-css";
    s.textContent = [
      ".message-text-bubble{font-size:var(--nx-chat-font,14px)!important;border-radius:var(--nx-chat-radius,12px)!important;}",
      ".messages-container{gap:var(--nx-chat-gap,15px)!important;}",
      ".nx-chat-compact .messages-container{padding:10px 12px!important;}",
      ".nx-chat-compact .message-wrapper{gap:8px!important;}",
      ".nx-chat-compact .message-text-bubble{padding:8px 12px!important;}",
      ".nx-chat-hide-time .message-timestamp{display:none!important;}",
      ".nx-look-row{display:flex;align-items:center;gap:10px;justify-content:space-between;margin:10px 0;font-size:13px;color:var(--text-muted);}",
      ".nx-look-row input[type=range]{flex:1;max-width:220px;accent-color:var(--accent);}",
      ".nx-look-row output{min-width:42px;text-align:right;color:var(--accent);font-size:12px;}"
    ].join("");
    (document.head || document.documentElement).appendChild(s);
  }

  function build() {
    injectCss();
    var grid = document.querySelector(".settings-grid");
    if (!grid || document.getElementById("nx-chat-look-card")) return;
    var card = document.createElement("div");
    card.className = "settings-card";
    card.id = "nx-chat-look-card";
    card.style.gridColumn = "span 2";
    card.innerHTML = [
      "<h3>\uD83C\uDF9B\uFE0F Chat Look</h3>",
      "<p class=\"settings-desc\">Fine-tune the message area. Saved to this browser.</p>",
      "<div class=\"nx-look-row\"><span>Message size</span><input type=\"range\" id=\"nx-look-font\" min=\"12\" max=\"20\" step=\"1\"><output id=\"nx-look-font-val\"></output></div>",
      "<div class=\"nx-look-row\"><span>Bubble roundness</span><input type=\"range\" id=\"nx-look-radius\" min=\"2\" max=\"22\" step=\"1\"><output id=\"nx-look-radius-val\"></output></div>",
      "<div class=\"nx-look-row\"><span>Message spacing</span><input type=\"range\" id=\"nx-look-gap\" min=\"6\" max=\"24\" step=\"1\"><output id=\"nx-look-gap-val\"></output></div>",
      "<div class=\"settings-toggle-row\" style=\"margin-top:10px;\"><label class=\"switch\"><input type=\"checkbox\" id=\"nx-look-compact\"><span class=\"slider\"></span></label><span>Compact padding</span></div>",
      "<div class=\"settings-toggle-row\" style=\"margin-top:10px;\"><label class=\"switch\"><input type=\"checkbox\" id=\"nx-look-time\"><span class=\"slider\"></span></label><span>Show timestamps</span></div>"
    ].join("");
    grid.appendChild(card);

    apply(read());

    ["font", "radius", "gap"].forEach(function (k) {
      var el = document.getElementById("nx-look-" + k);
      if (el) el.addEventListener("input", function () {
        var next = read();
        next[k] = parseInt(el.value, 10);
        apply(next);
      });
    });
    var c = document.getElementById("nx-look-compact");
    if (c) c.addEventListener("change", function () { var n = read(); n.compact = c.checked; apply(n); });
    var t = document.getElementById("nx-look-time");
    if (t) t.addEventListener("change", function () { var n = read(); n.times = t.checked; apply(n); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();

/**
 * Avatar safety net for the chat page (loaded before chat.js in chat.html).
 *
 * Saving a profile without uploading a picture used to store this placeholder as
 * the user's pfp_url:
 *
 *   https://glaxyias.github.io/imgs/Screenshot 2026-09-26 15.55.05.png
 *
 * That file was never committed, so GitHub Pages answers it with its 404 page
 * and every <img> pointing at it renders as the browser's broken-image icon with
 * the alt text "Avatar" — which is what users were seeing as their profile
 * picture. profile/profile.js no longer writes that URL, but the rows already in
 * the database still carry it (and an uploaded image can also fail to decode).
 *
 * This module keeps the display side safe: when an avatar image fails to load it
 * is swapped for the real default (imgs/newpfp.png), then for an inline
 * placeholder, so a dead URL can never show a broken image again.
 */
(function () {
  'use strict';

  var DEFAULT_PFP = 'https://glaxyias.github.io/imgs/newpfp.png';

  var PLACEHOLDER_PFP =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">' +
        '<rect width="80" height="80" fill="#2a1f1a"/>' +
        '<circle cx="40" cy="30" r="13" fill="#a08a7e"/>' +
        '<path d="M40 46c-13 0-22 8-22 19v15h44V65c0-11-9-19-22-19z" fill="#a08a7e"/>' +
        '</svg>'
    );

  // Avatars only; every other image on the page keeps its normal behaviour.
  var AVATAR_SELECTOR = [
    '.chat-pfp',
    '#current-user-avatar',
    '.admin-card img',
    '.admin-user-row img',
    '.pm-convo-item img',
    '.pm-user-result-item img',
    '.nx-mention-item img'
  ].join(',');

  function isAvatar(img) {
    try {
      return img.matches(AVATAR_SELECTOR);
    } catch (e) {
      return false;
    }
  }

  function swapAvatar(img) {
    var attempt = img.dataset.avatarFallback || '0';
    if (attempt === '0') {
      img.dataset.avatarFallback = '1';
      img.src = DEFAULT_PFP;
      return;
    }
    img.onerror = null;
    img.dataset.avatarFallback = '2';
    img.src = PLACEHOLDER_PFP;
  }

  // Image errors do not bubble, but they are observable during the capture phase.
  document.addEventListener(
    'error',
    function (event) {
      var img = event.target;
      if (!img || img.tagName !== 'IMG' || !isAvatar(img)) return;
      swapAvatar(img);
    },
    true
  );

  // The chat header avatar is hard-coded as http:// and is blocked as mixed
  // content on the https site; upgrade it so the signed-in user's avatar loads.
  function upgradeInsecureAvatars() {
    var imgs = document.querySelectorAll('img[src^="http://glaxyias.github.io/"]');
    for (var i = 0; i < imgs.length; i++) {
      imgs[i].src = imgs[i].src.replace(/^http:\/\//i, 'https://');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', upgradeInsecureAvatars);
  } else {
    upgradeInsecureAvatars();
  }

  // This file is loaded by chat.html before chat.js, and the chat page does not
  // carry the Terms of Service script tag, so boot the site-wide gate here.
  // See /JS/tos-gate.js.
  (function loadTosGate() {
    if (window.__nxTosGateLoaded) return;
    if (document.querySelector('script[src*="tos-gate.js"]')) return;
    var script = document.createElement('script');
    script.src = '../JS/tos-gate.js';
    (document.head || document.documentElement).appendChild(script);
  })();

  // Material-icon layer: emoji -> Google SVGs plus Ctrl+Shift+P for Canvas.
  (function loadNxEmojiIcons() {
    if (document.querySelector('script[data-nx-emoji-icons]')) return;
    var script = document.createElement('script');
    script.src = '../JS/nx-emoji-icons.js';
    script.setAttribute('data-nx-emoji-icons', '1');
    (document.head || document.documentElement).appendChild(script);
  })();
})();

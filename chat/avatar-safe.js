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
})();

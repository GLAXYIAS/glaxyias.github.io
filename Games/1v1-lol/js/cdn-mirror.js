// CDN mirror for embedders whose players cannot download from our CDN (2026-09-24).
//
// WHY: the game payloads (WebGL.data 128 MB, WebGL.wasm 63 MB) and the addressables bundles (63 MB) come from
// cdn.1v1lolreloaded.com, which is behind Cloudflare. Cloudflare is throttled in Russia: the small game page gets
// through, the big files do not, so players of the Russian site 1v1lol.ru (which frames our /index.html) could not
// load the game. That site's own server (Selectel, Russia) now carries a copy of those files, and this script makes
// the page fetch them from there — ONLY when the page is opened from that site.
//
// HOW: one wrapper around window.fetch. Both the Unity loader (Build/*) and UnityWebRequest (bundles) download through
// fetch in this build (loader fetchWithProgress / framework _JS_WebRequest_Create), so nothing else needs hooking.
// A request to <CDN_BASE>Build/… or <CDN_BASE>WebGL/… is sent to <mirror>/<same path> instead; any failure (network,
// HTTP error) falls back to the original CDN URL, so a stale or broken mirror never costs more than the CDN would.
//
// SECURITY: WebGL.framework.js and WebGL.wasm are code that runs on OUR origin. They are taken from the mirror only if
// their SHA-256 equals the value build-prod.js baked in below; otherwise the CDN copy is used. So even a compromised
// mirror cannot run code here. WebGL.data and the bundles are asset data and are not hashed (hashing 128 MB would
// double the peak memory on phones). The mirror host comes from the fixed MIRRORS table, never from the URL.

(function () {
  'use strict';

  // ↓ Patched by build-prod.js (4.46 block). Unpatched (local dev, no CDN) → the placeholder stays and this is inert.
  var CDN_BASE = "https://cdn.1v1lolreloaded.com/";
  var CODE_SHA256 = {"Build/WebGL.framework.js.c0de4610.unityweb":"2b62ca2583cef63914636f4a6de22866152cae9490b8475372d84406956678ff","Build/WebGL.wasm.c0de4610.unityweb":"5b46c2fab82fc30b3091193cf2645a35da33cda2978bc53b0ffe6273487c0ab3"};

  // Embedder host → mirror base. Only hosts listed here can switch the download source.
  var MIRRORS = {
    '1v1lol.ru': 'https://1v1lol.ru/cdn446/',
  };

  function hostOf(u) {
    try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) { return ''; }
  }

  // Signals, strongest first: explicit ?cdn=<host>, the embed-gate's ?from=<host>, the framing page (document.referrer),
  // and the choice already made earlier in this tab (the frame can reload without its referrer).
  function pickMirrorHost() {
    var q = null;
    try { q = new URLSearchParams(location.search); } catch (e) {}
    var cands = [];
    if (q) { cands.push((q.get('cdn') || '').toLowerCase()); cands.push((q.get('from') || '').toLowerCase()); }
    cands.push(hostOf(document.referrer));
    try { cands.push(sessionStorage.getItem('cdnMirrorHost') || ''); } catch (e) {}
    for (var i = 0; i < cands.length; i++) {
      var h = String(cands[i] || '').replace(/^www\./, '');
      if (h === 'ru') h = '1v1lol.ru';
      if (Object.prototype.hasOwnProperty.call(MIRRORS, h)) {
        try { sessionStorage.setItem('cdnMirrorHost', h); } catch (e) {}
        return h;
      }
    }
    return '';
  }

  var host = pickMirrorHost();
  window.__cdnMirror = host;   // read by the mock (region rule) and useful in the console
  if (!host) return;
  if (!CDN_BASE || CDN_BASE.indexOf('__') === 0 || typeof window.fetch !== 'function') return;
  var MIRROR = MIRRORS[host];
  var prevFetch = window.fetch;

  function hex(buf) {
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16);
    return s;
  }
  function note(msg) { try { console.log('[cdn-mirror] ' + msg); } catch (e) {} }

  window.fetch = function (resource, init) {
    var url = (typeof resource === 'string') ? resource : (resource instanceof URL ? resource.href : '');
    if (!url || url.indexOf(CDN_BASE) !== 0) return prevFetch.apply(this, arguments);
    var rel = url.slice(CDN_BASE.length).split('?')[0].split('#')[0];
    if (!/^(Build|WebGL)\/[^\/]+$/.test(rel)) return prevFetch.apply(this, arguments);

    var expected = Object.prototype.hasOwnProperty.call(CODE_SHA256, rel) ? CODE_SHA256[rel] : '';
    var isCode = /^Build\/.*(framework|wasm|loader)/i.test(rel);
    if (isCode && !expected) return prevFetch.apply(this, arguments);   // unknown code is never taken from the mirror

    var self = this;
    var fromCdn = function (why) {
      note(rel + ' → CDN (' + why + ')');
      return prevFetch.call(self, url, init);
    };
    return prevFetch.call(self, MIRROR + rel, init).then(function (r) {
      if (r.status === 304) return r;                    // loader revalidating its IndexedDB copy
      if (!r.ok) return fromCdn('mirror HTTP ' + r.status);
      if (!expected) return r;                           // asset data: stream straight through (keeps progress)
      if (!(window.crypto && crypto.subtle)) return fromCdn('no WebCrypto');
      return r.arrayBuffer().then(function (buf) {
        return crypto.subtle.digest('SHA-256', buf).then(function (d) {
          if (hex(d) !== expected) return fromCdn('sha256 mismatch');
          note(rel + ' ← mirror (sha256 ok)');
          return new Response(buf, { status: 200, statusText: 'OK', headers: r.headers });
        });
      });
    }, function () {
      return fromCdn('mirror unreachable');
    });
  };
  note('active: ' + host + ' → ' + MIRROR);
})();

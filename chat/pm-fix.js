/**
 * PM fix: Cloudflare worker returns {success, messages} and 500s on query filters.
 * chat.js expected a raw array and used ?sender_username=&recipient_username=.
 * Patch fetch so /private-messages always works for the existing PM code.
 */
(function () {
  'use strict';
  if (window.__PM_FETCH_PATCHED) return;
  window.__PM_FETCH_PATCHED = true;

  var origFetch = window.fetch.bind(window);
  var cache = null;
  var cacheAt = 0;
  var CACHE_MS = 3000;

  function unwrapMessages(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.messages)) return data.messages;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  }

  async function loadAllPMs() {
    var now = Date.now();
    if (cache && now - cacheAt < CACHE_MS) return cache;
    var res = await origFetch('https://apithingy.jlsniperelite4.workers.dev/private-messages', {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('PM HTTP ' + res.status);
    var data = await res.json();
    cache = unwrapMessages(data);
    cacheAt = now;
    return cache;
  }

  window.fetch = async function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var method = ((init && init.method) || (typeof input !== 'string' && input && input.method) || 'GET').toUpperCase();

    if (method === 'GET' && url.indexOf('/private-messages') !== -1) {
      try {
        var all = await loadAllPMs();
        var out = all;
        try {
          var u = new URL(url, 'https://apithingy.jlsniperelite4.workers.dev');
          var sender = u.searchParams.get('sender_username');
          var recipient = u.searchParams.get('recipient_username');
          if (sender && recipient) {
            var s = String(sender).toLowerCase();
            var r = String(recipient).toLowerCase();
            out = all.filter(function (m) {
              var a = String(m.sender_username || '').toLowerCase();
              var b = String(m.recipient_username || '').toLowerCase();
              return (a === s && b === r) || (a === r && b === s);
            });
          } else if (sender || recipient) {
            var who = String(sender || recipient).toLowerCase();
            out = all.filter(function (m) {
              return String(m.sender_username || '').toLowerCase() === who ||
                     String(m.recipient_username || '').toLowerCase() === who;
            });
          }
        } catch (e) { /* keep full list */ }

        // chat.js does: const rows = await r.json(); if (Array.isArray(rows)) ...
        return new Response(JSON.stringify(out), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        console.error('[pm-fix] fetch patch failed', err);
        return origFetch(input, init);
      }
    }

    return origFetch(input, init);
  };

  console.log('[pm-fix] fetch patch installed');
})();

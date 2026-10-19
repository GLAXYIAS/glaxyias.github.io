/**
 * chat.js bootstrap
 * 1) Patch fetch for /private-messages (worker returns {messages} and 500s on filters)
 * 2) Load last good full chat engine from commit 7e2a695a
 */
(function () {
  'use strict';
  if (!window.__PM_FETCH_PATCHED) {
    window.__PM_FETCH_PATCHED = true;
    var origFetch = window.fetch.bind(window);
    var cache = null;
    var cacheAt = 0;
    function unwrapMessages(data) {
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.messages)) return data.messages;
      if (data && Array.isArray(data.data)) return data.data;
      return [];
    }
    async function loadAllPMs() {
      var now = Date.now();
      if (cache && now - cacheAt < 3000) return cache;
      var res = await origFetch('https://apithingy.jlsniperelite4.workers.dev/private-messages', {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('PM HTTP ' + res.status);
      cache = unwrapMessages(await res.json());
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
            }
          } catch (e) {}
          return new Response(JSON.stringify(out), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (err) {
          console.error('[pm-fix]', err);
          return origFetch(input, init);
        }
      }
      return origFetch(input, init);
    };
    console.log('[pm-fix] fetch patch ready');
  }
})();

(async function () {
  var ORIG = 'https://cdn.jsdelivr.net/gh/glaxyias/glaxyias.github.io@7e2a695a/chat/chat.js';
  try {
    var res = await fetch(ORIG);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var code = await res.text();
    var s = document.createElement('script');
    s.text = code;
    document.head.appendChild(s);
  } catch (e) {
    console.error('Failed to load base chat.js from CDN', e);
  }
})();

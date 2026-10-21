/**
 * Resilient CDN fetch for Unity / UGS games.
 */
(function () {
  'use strict';
  if (window.__nxCdnResilient) return;
  window.__nxCdnResilient = true;

  function altUrls(url) {
    var list = [url];
    var s = String(url);
    if (s.indexOf('cdn.jsdelivr.net/gh/') !== -1) {
      list.push(s.replace('cdn.jsdelivr.net/gh/', 'fastly.jsdelivr.net/gh/'));
      list.push(s.replace('cdn.jsdelivr.net/gh/', 'gcore.jsdelivr.net/gh/'));
      var m = s.match(/jsdelivr\.net\/gh\/([^/@]+)\/([^/@]+)@([^/]+)\/(.+)/);
      if (m) {
        list.push('https://raw.githubusercontent.com/' + m[1] + '/' + m[2] + '/' + m[3] + '/' + m[4]);
      }
    }
    if (s.indexOf('fastly.jsdelivr.net/gh/') !== -1) {
      list.push(s.replace('fastly.jsdelivr.net/gh/', 'cdn.jsdelivr.net/gh/'));
      list.push(s.replace('fastly.jsdelivr.net/gh/', 'gcore.jsdelivr.net/gh/'));
    }
    if (s.indexOf('gcore.jsdelivr.net/gh/') !== -1) {
      list.push(s.replace('gcore.jsdelivr.net/gh/', 'cdn.jsdelivr.net/gh/'));
      list.push(s.replace('gcore.jsdelivr.net/gh/', 'fastly.jsdelivr.net/gh/'));
    }
    var seen = {}, out = [];
    for (var i = 0; i < list.length; i++) {
      if (!seen[list[i]]) { seen[list[i]] = 1; out.push(list[i]); }
    }
    return out;
  }

  function isBadBody(buf) {
    if (!buf || buf.byteLength < 3) return true;
    var u8 = new Uint8Array(buf.slice(0, 8));
    if (u8[0] === 0x34 && u8[1] === 0x32 && u8[2] === 0x39) return true;
    if (u8[0] === 0x3c && (u8[1] === 0x21 || u8[1] === 0x68 || u8[1] === 0x48)) return true;
    return false;
  }

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  var origFetch = window.fetch.bind(window);

  window.fetch = async function (resource, options) {
    var url = typeof resource === 'string' ? resource : (resource && resource.url) || '';
    var isCdn = /jsdelivr\.net|raw\.githubusercontent\.com/i.test(url);
    if (!isCdn) return origFetch(resource, options);

    var urls = altUrls(url);
    var lastErr = null;
    for (var u = 0; u < urls.length; u++) {
      for (var attempt = 0; attempt < 3; attempt++) {
        try {
          var res = await origFetch(urls[u], options);
          if (res.status === 429) {
            lastErr = new Error('429 ' + urls[u]);
            await sleep(1200 * (attempt + 1));
            continue;
          }
          if (!res.ok) {
            lastErr = new Error('HTTP ' + res.status + ' ' + urls[u]);
            break;
          }
          var ct = (res.headers.get('content-type') || '').toLowerCase();
          if (/\.(wasm|data|gz|br|unityweb|bundle|part\d+)(\?|$)/i.test(urls[u]) ||
              ct.indexOf('octet') !== -1 || ct.indexOf('wasm') !== -1) {
            var clone = res.clone();
            var buf = await clone.arrayBuffer();
            if (isBadBody(buf)) {
              lastErr = new Error('Bad body from ' + urls[u]);
              await sleep(1200 * (attempt + 1));
              continue;
            }
            return new Response(buf, { status: 200, statusText: 'OK', headers: res.headers });
          }
          return res;
        } catch (e) {
          lastErr = e;
          await sleep(600 * (attempt + 1));
        }
      }
    }
    throw lastErr || new Error('CDN fetch failed for ' + url);
  };

  console.log('[cdn-resilient] fetch patched');
})();

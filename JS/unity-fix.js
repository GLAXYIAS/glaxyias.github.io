/**
 * Force Unity / WebGL games to open in a real tab (not the about:blank iframe).
 * Unity WebGL often fails with "Unity failed to start" inside sandboxed iframes.
 */
(function () {
  'use strict';

  var UNITY_IDS = {
    cloverpit: 1,
    'clover-pit': 1,
    'crazy-cattle-3d': 1,
    'cannon-balls-3d': 1
  };

  function isUnityGame(gameId, game) {
    if (UNITY_IDS[String(gameId || '').toLowerCase()]) return true;
    if (!game) return false;
    var blob = [game.id, game.title, game.url, game.desc].join(' ').toLowerCase();
    if (blob.indexOf('unity') !== -1) return true;
    return false;
  }

  function resolveSrc(game) {
    if (!game) return null;
    if (game.isEmbedCode && game.jsbin) return String(game.jsbin);
    var raw = String(game.url || '');
    if (/^https?:\/\//i.test(raw)) return raw;
    var root = (location.origin || 'https://glaxyias.github.io').replace(/\/$/, '') + '/';
    return root + raw.replace(/^\.\.\//, '').replace(/^\//, '');
  }

  function patch() {
    if (typeof window.launchGame !== 'function') return false;
    if (window.launchGame.__unityPatched) return true;

    var orig = window.launchGame;
    window.launchGame = function (gameId) {
      var game = null;
      try {
        if (typeof _0xData !== 'undefined' && Array.isArray(_0xData)) {
          game = _0xData.find(function (g) { return g && g.id === gameId; });
        }
      } catch (e) {}

      if (isUnityGame(gameId, game) || (game && game.noIframe)) {
        var src = resolveSrc(game) || (location.origin + '/Games/' + gameId + '/index.html');
        console.log('[unity-fix] Opening Unity game directly (no iframe):', src);
        var w = window.open(src, '_blank');
        if (!w) window.location.href = src;
        return;
      }
      return orig.apply(this, arguments);
    };
    window.launchGame.__unityPatched = true;
    console.log('[unity-fix] launchGame patched for Unity titles');
    return true;
  }

  if (!patch()) {
    var n = 0;
    var t = setInterval(function () {
      n++;
      if (patch() || n > 80) clearInterval(t);
    }, 100);
  }
})();

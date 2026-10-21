/**
 * Runtime catalog URL overrides (avoids editing huge main.js).
 */
(function () {
  'use strict';
  var OVERRIDES = {
    'ace-combat-3': 'Games/ace-combat-3/index.html',
    'acecombat3': 'Games/acecombat3/index.html'
  };

  function apply() {
    try {
      if (typeof _0xData === 'undefined' || !Array.isArray(_0xData)) return false;
      var n = 0;
      for (var i = 0; i < _0xData.length; i++) {
        var g = _0xData[i];
        if (!g || !g.id) continue;
        if (OVERRIDES[g.id]) {
          g.url = OVERRIDES[g.id];
          n++;
        }
      }
      if (n) console.log('[game-url-overrides] patched', n, 'entries');
      return true;
    } catch (e) {
      return false;
    }
  }

  if (!apply()) {
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (apply() || tries > 100) clearInterval(t);
    }, 50);
  }

  var tries2 = 0;
  var t2 = setInterval(function () {
    tries2++;
    if (typeof window.launchGame === 'function' && !window.launchGame.__urlOverridePatched) {
      var orig = window.launchGame;
      window.launchGame = function (gameId) {
        try {
          if (OVERRIDES[gameId] && typeof _0xData !== 'undefined') {
            var g = _0xData.find(function (x) { return x && x.id === gameId; });
            if (g) g.url = OVERRIDES[gameId];
          }
        } catch (e) {}
        return orig.apply(this, arguments);
      };
      window.launchGame.__urlOverridePatched = true;
      clearInterval(t2);
    }
    if (tries2 > 100) clearInterval(t2);
  }, 50);
})();

// Bootstrap: restore library from last good commit, then fix local game launcher
(function () {
  var s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/gh/GLAXYIAS/glaxyias.github.io@a0c1598b38c0a7d93d2903d1be803dedef1c8185/JS/main.js";
  s.onload = function () {
    window.launchGame = function (gameId) {
      if (typeof _0xData === "undefined") return;
      var game = null;
      for (var i = 0; i < _0xData.length; i++) {
        if (_0xData[i].id === gameId) { game = _0xData[i]; break; }
      }
      if (!game) return;

      var rootUrl = (location.origin || "https://glaxyias.github.io").replace(/\/$/, "") + "/";
      var raw = "";
      if (game.isEmbedCode && game.jsbin) raw = String(game.jsbin);
      else raw = String(game.url || "");

      var gameSrc = /^https?:\/\//i.test(raw)
        ? raw
        : rootUrl + raw.replace(/^\.\.\//, "").replace(/^\//, "");

      var safeTitle = String(game.title || "Game")
        .replace(/&/g, "&")
        .replace(/</g, "<")
        .replace(/"/g, """);
      var safeSrc = gameSrc.replace(/&/g, "&").replace(/"/g, """);

      var gameTab = window.open("about:blank", "_self");
      if (!gameTab) {
        alert("Pop-up blocked! Please allow popups to play games.");
        return;
      }

      gameTab.document.open();
      gameTab.document.write(
        "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\">" +
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
        "<title>" + safeTitle + "</title>" +
        "<style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000}" +
        "#f{position:fixed;inset:0;width:100%;height:100%;border:0;background:#000}" +
        ".back{position:fixed;top:15px;left:15px;z-index:99999999;background:#0a0a0a;color:#8b00ff;" +
        "border:2px solid #8b00ff;padding:8px 14px;font-weight:bold;border-radius:6px;" +
        "text-decoration:none;font-family:system-ui,sans-serif}" +
        "#load{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;" +
        "color:#8b00ff;font-family:system-ui,sans-serif;z-index:1;pointer-events:none}</style></head><body>" +
        "<a class=\"back\" href=\"" + rootUrl + "\">&larr; Back To Home</a>" +
        "<div id=\"load\">Loading " + safeTitle + "&hellip;</div>" +
        "<iframe id=\"f\" src=\"" + safeSrc + "\" allowfullscreen " +
        "allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; " +
        "picture-in-picture; fullscreen; gamepad; pointer-lock *\"></iframe>" +
        "<script>(function(){var f=document.getElementById(\"f\");var l=document.getElementById(\"load\");" +
        "function h(){if(l)l.style.display=\"none\";}if(f){f.addEventListener(\"load\",h);setTimeout(h,8000);}})();<\/script>" +
        "</body></html>"
      );
      gameTab.document.close();
    };
    console.log("[nx] launchGame fixed (no sandbox, resolved local paths)");
  };
  s.onerror = function () {
    console.error("[nx] Failed to load main.js from jsDelivr — hard-refresh or check network");
  };
  document.head.appendChild(s);
})();

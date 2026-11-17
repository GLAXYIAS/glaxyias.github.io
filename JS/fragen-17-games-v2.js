/* Fragen and 17-0 catalog additions. Loaded after JS/main.js. */
/* Direct launch: these two games must not sit inside the sandboxed game shell. */
(function () {
  "use strict";

  var additions = [
    {
      id: "fragen",
      title: "Fragen",
      url: "Games/fragen/index.html?v=20261117b",
      image: "Games/_covers/actual/fragen.jpg",
      desc: "Intense multiplayer FPS combat. Pick a mode, customize your arsenal, and fight solo or with friends.",
      popular: true,
      tags: ["Shooter", "Action", "Multiplayer"]
    },
    {
      id: "17_and_0",
      title: "17-0",
      url: "Games/17-and-0/index.html?v=20261117b",
      image: "Games/_covers/actual/17-and-0.png",
      desc: "Spin for an NFL franchise and era, draft legends, and simulate a perfect 17-0 season.",
      popular: true,
      tags: ["Sports", "Simulation"]
    }
  ];

  var directGames = {
    fragen: "Games/fragen/index.html?v=20261117b",
    "17_and_0": "Games/17-and-0/index.html?v=20261117b"
  };

  var installed = false;

  function install() {
    if (installed) return true;
    if (typeof _0xData === "undefined" || !Array.isArray(_0xData)) return false;

    var existing = Object.create(null);
    for (var i = 0; i < _0xData.length; i++) {
      if (_0xData[i] && _0xData[i].id != null) existing[String(_0xData[i].id)] = true;
    }

    var missing = additions.filter(function (game) {
      return !existing[String(game.id)];
    });
    for (var j = missing.length - 1; j >= 0; j--) {
      _0xData.unshift(missing[j]);
    }
    installed = true;

    bindDirectLaunch();

    if (typeof renderLibraryGrid === "function") {
      try {
        renderLibraryGrid(_0xData);
      } catch (error) {
        console.error("[Fragen catalog]", error);
      }
    }
    return true;
  }

  function bindDirectLaunch() {
    var grid = document.getElementById("gameGrid");
    if (!grid || grid.__nxFragenDirectLaunch) return;
    grid.__nxFragenDirectLaunch = true;
    grid.addEventListener("click", function (event) {
      var card = event.target && event.target.closest
        ? event.target.closest("[data-game-id]")
        : null;
      if (!card) return;
      var target = directGames[String(card.getAttribute("data-game-id"))];
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(target);
    }, true);
  }

  install();
  var tries = 0;
  var wait = setInterval(function () {
    tries++;
    if (install() || tries >= 80) clearInterval(wait);
  }, 50);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }
  window.addEventListener("load", function () {
    setTimeout(install, 50);
  });
})();

// New J-title games added from the Ultimate Game Stash document.
(function () {
  if (typeof _0xData === "undefined") return;

  var games = [
    {
      id: "jumbo-mario",
      title: "Jumbo Mario",
      url: "https://whatchamacallitexe.github.io/pack-y/jumbo-mario/",
      image: "../Games/jumbo-mario/cover.svg",
      desc: "A 40th-anniversary Super Mario fan demo packed with oversized levels and classic platforming."
    },
    {
      id: "jumping-shell",
      title: "Jumping Shell",
      url: "https://whatchamacallitexe.github.io/pack-y/jumping-shell/",
      image: "../Games/jumping-shell/cover.svg",
      desc: "Hop and drop your shell across a tricky tower of platforms in this bite-sized puzzler."
    },
    {
      id: "jetski-race",
      title: "Jetski Race",
      url: "https://whatchamacallitexe.github.io/pack-y/jetski-race/",
      image: "../Games/jetski-race/cover.svg",
      desc: "Race a jet ski across sunny island courses and chase the fastest time on the water."
    },
    {
      id: "just-hit-the-button",
      title: "Just Hit The Button",
      url: "https://whatchamacallitexe.github.io/pack-y/just-hit-the-button/",
      image: "../Games/just-hit-the-button/cover.svg",
      desc: "A fast, silly reflex game where hitting the button is the whole point."
    }
  ];

  games.forEach(function (game) {
    if (!_0xData.some(function (existing) { return existing.id === game.id; })) {
      _0xData.push(game);
    }
  });

  function refresh() {
    if (typeof renderLibraryGrid === "function") {
      try { renderLibraryGrid(_0xData); } catch (e) {}
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(refresh, 0); });
  } else {
    setTimeout(refresh, 0);
  }
  window.addEventListener("load", function () { setTimeout(refresh, 150); });
})();

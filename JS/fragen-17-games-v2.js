/* Catalog extras: direct-launch cards, imported-game filter and empty-search form. */
(function () {
  "use strict";

  var directGames = {
    fragen: "https://whatchamacallitexe.github.io/fragen/index.html",
    "17-and-0": "https://whatchamacallitexe.github.io/17-and-0/index.html",
    "ragdoll-playground": "../Games/ragdoll-playground/index.html",
    "orbit-kick": "../Games/orbit-kick/index.html"
  };

  /* ------------------------------------------------ games imported from azgames */

  var importedGames = [
    {
      id: "ragdoll-playground",
      title: "Ragdoll Playground",
      url: "../Games/ragdoll-playground/index.html",
      desc: "A physics sandbox where you fling, drop, drag and torture a helpless ragdoll across a playground full of traps, props and weapons.",
      image: "https://azgames.io/upload/cache/upload/imgs/ragdollplayground-m180x180.png",
      tags: ["Sandbox", "Casual", "Action"]
    },
    {
      id: "orbit-kick",
      title: "Orbit Kick",
      url: "../Games/orbit-kick/index.html",
      desc: "Curve, bounce and blast a football past the keeper, then spend your cash on power and bounce upgrades between shots.",
      image: "https://azgames.io/upload/cache/upload/imgs/orbitkick3-m180x180.png",
      tags: ["Sports", "Casual"]
    },
    {
      id: "1v1-lol",
      title: "1v1.LOL",
      url: "../Games/1v1-lol/index.html",
      desc: "Build, box fight and drop into battle royale in a fast browser shooter with 1v1 Clash, Zone Wars and creative mode.",
      image: "../Games/1v1-lol/cover.webp",
      tags: ["Shooter", "Multiplayer", "Action"]
    },
    {
      id: "shell-survivor",
      title: "Shell Survivor",
      url: "../Games/shell-survivor/index.html",
      desc: "Pick an egg hero, dodge ghostly axes and blast through waves of enemies in a fast, unlock-heavy survival shooter.",
      image: "https://azgames.io/upload/cache/upload/imgs/sheelsurvivor-m180x180.png",
      tags: ["Shooter", "Survival", "Action"]
    },
    {
      id: "car-destruction-king",
      title: "Car Destruction King: Mayhem",
      url: "../Games/car-destruction-king/index.html",
      desc: "Drive through hammer traps, presses and catapults, slow time for cinematic crashes and chase records across three maps.",
      image: "../Games/car-destruction-king/cover.svg",
      tags: ["Driving", "Sandbox", "Action"]
    },
    {
      id: "zombie-derby-2",
      title: "Zombie Derby Part II",
      url: "../Games/zombie-derby-2/index.html",
      desc: "Mount a minigun on a rusted monster truck and grind through zombie hordes across dusty arenas.",
      image: "../Games/zombie-derby-2/cover.svg",
      tags: ["Driving", "Action", "Survival"]
    },
    {
      id: "ragdoll-archers",
      title: "Ragdoll Archers",
      url: "../Games/ragdoll-archers/index.html",
      desc: "Physics archery with floppy stickmen: solo waves, local PvP and co-op, plus upgrade builds.",
      image: "../Games/ragdoll-archers/cover.svg",
      tags: ["Archery", "Physics", "2 Player"]
    },
    {
      id: "mr-mine",
      title: "Mr.Mine",
      url: "../Games/mr-mine/index.html",
      desc: "Dig deeper, hire managers, unlock drills and rebuild your mining empire in the long-running idle mining game.",
      image: "../Games/mr-mine/cover.svg",
      tags: ["Idle", "Mining", "Simulation"]
    }
  ];

  function addImportedGames() {
    if (typeof _0xData === "undefined" || !Array.isArray(_0xData)) return 0;
    var added = 0;
    for (var i = 0; i < importedGames.length; i++) {
      var game = importedGames[i];
      var exists = false;
      for (var j = 0; j < _0xData.length; j++) {
        if (_0xData[j] && String(_0xData[j].id) === game.id) { exists = true; break; }
      }
      if (!exists) { _0xData.push(game); added++; }
    }
    return added;
  }

  document.addEventListener("click", function (event) {
    var node = event.target;
    var card = node && node.closest ? node.closest("[data-game-id]") : null;
    if (!card) return;
    var url = directGames[String(card.getAttribute("data-game-id"))];
    if (!url) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(url);
  }, true);

  /* ------------------------------------------------- imported (non-HTML) games */

  var NON_HTML_ID = "Non-HTML";
  var NON_HTML_IDS = [
    "17-and-0",
    "build-a-17-0-team",
    "firstdown-82-0",
    "firstdown-162-0",
    "firstdown-goat",
    "fragen",
    "veck-io",
    "undead_corridor",
    "ragdoll-playground",
    "orbit-kick",
    "1v1-lol",
    "shell-survivor",
    "car-destruction-king",
    "mr-mine",
    "zombie-derby-2",
    "ragdoll-archers",
  ];

  function tagNonHtml() {
    if (typeof _0xData === "undefined" || !Array.isArray(_0xData)) return 0;
    var wanted = Object.create(null);
    for (var i = 0; i < NON_HTML_IDS.length; i++) wanted[NON_HTML_IDS[i]] = true;
    var count = 0;
    for (var j = 0; j < _0xData.length; j++) {
      var game = _0xData[j];
      if (!game || !wanted[String(game.id)]) continue;
      if (!Array.isArray(game.tags)) game.tags = [];
      if (game.tags.indexOf(NON_HTML_ID) === -1) game.tags.push(NON_HTML_ID);
      count++;
    }
    return count;
  }

  function watchBarVisibility(bar) {
    var grid = document.getElementById("gameGrid");
    if (!grid) return;
    var sync = function () {
      var showing = !!grid.style.display && grid.style.display !== "none";
      bar.style.setProperty("display", showing ? "flex" : "none", "important");
    };
    new MutationObserver(sync).observe(grid, { attributes: true, attributeFilter: ["style"] });
    sync();
  }

  function addNonHtmlFilter() {
    var bar = document.getElementById("nx-filter-bar");
    var tagSel = document.getElementById("nx-filter-tag");
    if (!bar || !tagSel) return false;
    if (document.getElementById("nx-filter-nonhtml")) return true;

    var count = 0;
    if (typeof _0xData !== "undefined" && Array.isArray(_0xData)) {
      for (var i = 0; i < _0xData.length; i++) {
        if (_0xData[i] && String(_0xData[i].id) && NON_HTML_IDS.indexOf(String(_0xData[i].id)) !== -1) count++;
      }
    }

    var option = tagSel.querySelector('option[value="' + NON_HTML_ID + '"]');
    if (!option) {
      option = document.createElement("option");
      option.value = NON_HTML_ID;
      tagSel.appendChild(option);
    }
    option.textContent = "Non-HTML games (" + count + ")";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "nx-filter-nonhtml";
    btn.setAttribute("aria-pressed", "false");
    btn.textContent = "Non-HTML games";

    var recent = document.getElementById("nx-filter-recent");
    if (recent && recent.parentNode === bar) bar.insertBefore(btn, recent);
    else bar.appendChild(btn);

    btn.addEventListener("click", function () {
      var on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      tagSel.value = on ? NON_HTML_ID : "";
      if (typeof applyLibraryFilters === "function") applyLibraryFilters();
    });

    tagSel.addEventListener("change", function () {
      btn.setAttribute("aria-pressed", tagSel.value === NON_HTML_ID ? "true" : "false");
    });

    var clear = document.getElementById("nx-filter-clear");
    if (clear) {
      clear.addEventListener("click", function () {
        btn.setAttribute("aria-pressed", "false");
      });
    }

    watchBarVisibility(bar);
    return true;
  }

  function bootImportedFilter() {
    addImportedGames();
    tagNonHtml();
    if (addNonHtmlFilter()) return;
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      addImportedGames();
      tagNonHtml();
      if (addNonHtmlFilter() || tries >= 100) clearInterval(timer);
    }, 50);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootImportedFilter);
  } else {
    bootImportedFilter();
  }

  /* ---------------------------------------------------------------- form link */

  var FORM_URL = "https://forms.gle/LD8McR66wwQtc9Nf6";
  var search = document.getElementById("searchBar");
  var grid = document.getElementById("gameGrid");
  if (!search || !grid || document.getElementById("nx-add-game-panel")) return;

  var panel = document.createElement("div");
  panel.id = "nx-add-game-panel";
  panel.setAttribute("role", "status");
  panel.setAttribute("aria-live", "polite");
  panel.style.cssText = [
    "display:none",
    "margin:0 0 18px",
    "padding:18px 20px",
    "border:1px solid rgba(216,180,254,.35)",
    "border-radius:14px",
    "background:rgba(24,14,38,.92)",
    "color:#f5e9ff",
    "font-family:inherit",
    "text-align:center",
    "box-sizing:border-box"
  ].join(";");

  var title = document.createElement("strong");
  title.style.cssText = "display:block;font-size:1.05rem;margin-bottom:6px;";

  var line = document.createElement("p");
  line.style.cssText = "margin:0 0 10px;opacity:.85;";
  line.textContent = "Want to add this game? Fill out this Google form:";

  var link = document.createElement("a");
  link.href = FORM_URL;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = FORM_URL;
  link.style.cssText = "color:#d8b4fe;font-weight:700;word-break:break-all;";

  panel.appendChild(title);
  panel.appendChild(line);
  panel.appendChild(link);
  grid.parentNode.insertBefore(panel, grid);

  var poll = 0;
  function hide() {
    clearInterval(poll);
    panel.style.display = "none";
  }

  function evaluate() {
    var query = search.value.trim();
    if (!query) return hide();
    var tries = 0;
    clearInterval(poll);
    poll = setInterval(function () {
      if (grid.querySelectorAll("[data-game-id]").length > 0) {
        hide();
        return;
      }
      if (++tries >= 20) {
        clearInterval(poll);
        title.textContent = 'No game found for "' + query + '"';
        panel.style.display = "block";
      }
    }, 50);
  }

  var timer = 0;
  search.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(evaluate, 120);
  });
  search.addEventListener("search", function () {
    clearTimeout(timer);
    evaluate();
  });
})();

/* ------------------------------------------- removed (dead) catalogue entries
   Removed 2026-11-21 after the full catalogue verification: every URL below was
   loaded in a real browser and stayed blank, and the files it needs are either
   missing from the repo or the upstream asset it loads now returns 404, so there
   is nothing to repair. They are dropped from _0xData before the grid renders. */
(function () {
  "use strict";
  if (typeof _0xData === "undefined" || !Array.isArray(_0xData)) return;

  var REMOVED_URLS = {
    "https://glaxyias.github.io/veck.io/": true,
    "https://whatchamacallitexe.github.io/fragen/index.html": true,
    "https://whatchamacallitexe.github.io/pack-a/geometry-dash/index.html": true,
    "https://whatchamacallitexe.github.io/pack-a/swingo/index.html": true,
    "https://whatchamacallitexe.github.io/pack-a/wordle-unlimited/index.html": true,
    "https://whatchamacallitexe.github.io/pack-ad/backyardsoccer/index.html": true,
    "https://whatchamacallitexe.github.io/pack-ai/elasticface/index.html": true,
    "https://whatchamacallitexe.github.io/pack-b/connect-3/index.html": true,
    "https://whatchamacallitexe.github.io/pack-b/waterworks/index.html": true,
    "https://whatchamacallitexe.github.io/pack-c/get-on-top/index.html": true,
    "https://whatchamacallitexe.github.io/pack-c/woodventure/index.html": true,
    "https://whatchamacallitexe.github.io/pack-d/blumgi-slime/index.html": true,
    "https://whatchamacallitexe.github.io/pack-e/bottle-flip/index.html": true,
    "https://whatchamacallitexe.github.io/pack-e/mario/index.html": true,
    "https://whatchamacallitexe.github.io/pack-f/save-the-doge/index.html": true,
    "https://whatchamacallitexe.github.io/pack-g/head-soccer/index.html": true,
    "https://whatchamacallitexe.github.io/pack-h/pou/index.html": true,
    "https://whatchamacallitexe.github.io/pack-i/biker-street/index.html": true,
    "https://whatchamacallitexe.github.io/pack-i/stickman-go/index.html": true,
    "https://whatchamacallitexe.github.io/pack-k/sm64land/index.html": true,
    "https://whatchamacallitexe.github.io/pack-m/ace-combat-2/index.html": true,
    "https://whatchamacallitexe.github.io/pack-m/ace-combat-3/index.html": true,
    "https://whatchamacallitexe.github.io/pack-m/achievementunlocked/index.html": true,
    "https://whatchamacallitexe.github.io/pack-m/adventneon/index.html": true,
    "https://whatchamacallitexe.github.io/pack-m/akoopasrevenge/index.html": true,
    "https://whatchamacallitexe.github.io/pack-m/angrybirdsshowdown/index.html": true,
    "https://whatchamacallitexe.github.io/pack-n/cut-the-rope/index.html": true,
    "https://whatchamacallitexe.github.io/pack-p/deadestate/index.html": true,
    "https://whatchamacallitexe.github.io/pack-t/gran-turismo-2/index.html": true,
    "https://whatchamacallitexe.github.io/pack-x/inclement-emerald/index.html": true,
    "https://whatchamacallitexe.github.io/pack-z/lego-batman/index.html": true
  };

  var removed = 0;
  for (var i = _0xData.length - 1; i >= 0; i--) {
    var game = _0xData[i];
    if (game && REMOVED_URLS[String(game.url)]) {
      _0xData.splice(i, 1);
      removed++;
    }
  }
  window.__nxRemovedGames = removed;
})();

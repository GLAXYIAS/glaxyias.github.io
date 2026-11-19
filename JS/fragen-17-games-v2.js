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
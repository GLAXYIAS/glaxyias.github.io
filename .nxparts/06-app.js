/* Null X startup screen — behaviour. Favourites and recents live in localStorage. */

(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var FAV_KEY = "nx2_favs";
  var RECENT_KEY = "nx2_recent";
  var PAGE = 24;

  var esc = function (value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  var pad = function (n, size) {
    var s = String(n);
    while (s.length < (size || 2)) s = "0" + s;
    return s;
  };

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      return fallback;
    }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* private mode */ }
  }

  function byTitle(title) {
    for (var i = 0; i < GAMES.length; i++) {
      if (GAMES[i].t === title) return GAMES[i];
    }
    return null;
  }

  var featured = ["Brotato: All Pain No Gain", "Clover Pit", "PolyTrack", "Undead Corridor", "Retro Bowl"]
    .map(byTitle).filter(Boolean);
  if (!featured.length) featured = GAMES.slice(0, 5);

  var picks = ["1v1.LOL", "PolyTrack", "Brotato: All Pain No Gain", "Moto X3M", "Clover Pit", "Slither.io"]
    .map(byTitle).filter(Boolean);

  var storedFavs = read(FAV_KEY, []);
  if (!Array.isArray(storedFavs)) storedFavs = [];
  var favs = new Set(storedFavs.filter(function (url) {
    return GAMES.some(function (g) { return g.u === url; });
  }));

  var storedRecent = read(RECENT_KEY, []);
  if (!Array.isArray(storedRecent)) storedRecent = [];
  var recent = storedRecent.filter(function (url) {
    return GAMES.some(function (g) { return g.u === url; });
  }).slice(0, 6);

  var state = { q: "", tag: "All", sort: "default", limit: PAGE, favsOnly: false, seed: 1 };

  var els = {
    statusTrack: $("#statusTrack"),
    tickerTrack: $("#tickerTrack"),
    deck: $("#deck"),
    deckTitle: $("#deckTitle"),
    deckTags: $("#deckTags"),
    deckCount: $("#deckCount"),
    heroPlay: $("#heroPlay"),
    heroDate: $("#heroDate"),
    statusClock: $("#statusClock"),
    statusBuild: $("#statusBuild"),
    bigClock: $("#bigClock"),
    bigSec: $("#bigSec"),
    bigDate: $("#bigDate"),
    batteryCells: $("#batteryCells"),
    batteryText: $("#batteryText"),
    picks: $("#picks"),
    grid: $("#grid"),
    chips: $("#chips"),
    q: $("#q"),
    sort: $("#sort"),
    shownCount: $("#shownCount"),
    totalCount: $("#totalCount"),
    more: $("#more"),
    moreLeft: $("#moreLeft"),
    empty: $("#empty"),
    emptyTitle: $("#emptyTitle"),
    emptyText: $("#emptyText"),
    reset: $("#resetFilters"),
    favNote: $("#favNote"),
    recent: $("#recent"),
    recentRow: $("#recentRow"),
    recentClear: $("#clearRecent"),
    toast: $("#toast"),
    ctx: $("#ctx"),
    whoName: $("#whoName"),
    whoHandle: $("#whoHandle"),
    whoState: $("#whoState"),
    footBuild: $("#footBuild"),
    footDate: $("#footDate"),
    statLoaded: $("#statLoaded")
  };

  var toastTimer = null;
  function toast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.remove("is-on"); }, 2400);
  }

  function remember(url) {
    recent = [url].concat(recent.filter(function (item) { return item !== url; })).slice(0, 6);
    write(RECENT_KEY, recent);
    renderRecent();
  }

  function openGame(url) {
    remember(url);
    window.location.href = url;
  }

  function renderRecent() {
    if (!els.recent || !els.recentRow) return;
    els.recentRow.innerHTML = recent.map(function (url) {
      var game = GAMES.filter(function (g) { return g.u === url; })[0];
      if (!game) return "";
      return '<a class="recent__item" href="' + esc(game.u) + '" data-url="' + esc(game.u) + '" title="' + esc(game.t) + '">' +
        '<img src="' + esc(game.i) + '" alt="" loading="lazy" width="640" height="480">' +
        '<span>' + esc(game.t) + '</span></a>';
    }).join("");
    els.recent.classList.toggle("is-on", recent.length > 0);
  }

  var deckIndex = 0;
  var deckTimer = null;

  function deckCard(game, cls) {
    var front = cls === "is-front";
    return '<a class="deck__card ' + cls + '" href="' + esc(game.u) + '" data-url="' + esc(game.u) + '"' +
      (front ? "" : ' tabindex="-1" aria-hidden="true"') + '>' +
      '<img src="' + esc(game.i) + '" alt="' + esc(game.t) + ' cover art" width="640" height="480">' +
      (front ? '<span class="deck__flag">Featured</span>' : '') +
      '</a>';
  }

  function renderDeck() {
    var total = featured.length;
    var current = featured[deckIndex % total];
    var previous = featured[(deckIndex - 1 + total) % total];
    var next = featured[(deckIndex + 1) % total];

    if (els.deck) {
      els.deck.innerHTML = deckCard(previous, "is-back") + deckCard(next, "is-mid") + deckCard(current, "is-front");
      els.deck.setAttribute("data-ghost", pad((deckIndex % total) + 1));
      els.deck.classList.remove("is-swapping");
      void els.deck.offsetWidth;
      els.deck.classList.add("is-swapping");
    }
    if (els.deckTitle) els.deckTitle.textContent = current.t;
    if (els.deckTags) els.deckTags.textContent = current.g.slice(0, 3).join(" · ");
    if (els.deckCount) els.deckCount.textContent = pad((deckIndex % total) + 1) + " / " + pad(total);
    if (els.heroPlay) {
      els.heroPlay.setAttribute("href", current.u);
      els.heroPlay.setAttribute("data-url", current.u);
    }
  }

  function stepDeck(direction) {
    deckIndex = (deckIndex + direction + featured.length) % featured.length;
    renderDeck();
    restartDeck();
  }

  function restartDeck() {
    clearInterval(deckTimer);
    deckTimer = setInterval(function () {
      if (document.hidden) return;
      deckIndex = (deckIndex + 1) % featured.length;
      renderDeck();
    }, 9000);
  }

  function renderPicks() {
    if (!els.picks) return;
    els.picks.innerHTML = picks.map(function (game, index) {
      return '<a class="pick" href="' + esc(game.u) + '" data-url="' + esc(game.u) + '">' +
        '<div class="pick__art"><img src="' + esc(game.i) + '" alt="" loading="lazy" width="640" height="480"></div>' +
        '<div class="pick__body">' +
          '<span class="pick__no">No. ' + pad(index + 1) + '</span>' +
          '<h3>' + esc(game.t) + '</h3>' +
          '<p>' + esc(game.d) + '</p>' +
          '<span class="pick__tags">' + esc(game.g.join(" · ")) + '</span>' +
        '</div></a>';
    }).join("");
  }

  var chipOrder = ["Action", "Puzzle", "Racing", "Shooter", "Casual", "Platformer", "Idle", "Sports", "Party", "Horror", "Multiplayer", "Simulation"];

  function renderChips() {
    if (!els.chips) return;
    var counts = {};
    GAMES.forEach(function (game) {
      game.g.forEach(function (tag) { counts[tag] = (counts[tag] || 0) + 1; });
    });

    var tags = chipOrder.filter(function (tag) { return counts[tag]; });
    var html = '<button class="chip' + (state.tag === "All" ? " is-on" : "") + '" type="button" aria-pressed="' + (state.tag === "All") + '" data-tag="All">All<sup>' + GAMES.length + '</sup></button>';
    html += tags.map(function (tag) {
      return '<button class="chip' + (state.tag === tag ? " is-on" : "") + '" type="button" aria-pressed="' + (state.tag === tag) + '" data-tag="' + esc(tag) + '">' +
        esc(tag) + '<sup>' + counts[tag] + '</sup></button>';
    }).join("");
    els.chips.innerHTML = html;
  }

  function setChip(tag) {
    state.tag = tag;
    $$(".chip", els.chips).forEach(function (chip) {
      var on = chip.getAttribute("data-tag") === tag;
      chip.classList.toggle("is-on", on);
      chip.setAttribute("aria-pressed", String(on));
    });
  }

  function seededShuffle(list, seed) {
    var copy = list.slice();
    var value = seed || 1;
    for (var i = copy.length - 1; i > 0; i--) {
      value = (value * 1664525 + 1013904223) % 4294967296;
      var j = value % (i + 1);
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function filteredList() {
    var query = state.q.trim().toLowerCase();
    var list = GAMES.filter(function (game) {
      if (state.favsOnly && !favs.has(game.u)) return false;
      if (state.tag !== "All" && game.g.indexOf(state.tag) === -1) return false;
      if (query) {
        var haystack = (game.t + " " + game.g.join(" ") + " " + game.d).toLowerCase();
        if (haystack.indexOf(query) === -1) return false;
      }
      return true;
    });

    if (state.sort === "az") list = list.slice().sort(function (a, b) { return a.t.localeCompare(b.t); });
    else if (state.sort === "za") list = list.slice().sort(function (a, b) { return b.t.localeCompare(a.t); });
    else if (state.sort === "random") list = seededShuffle(list, state.seed);

    return list;
  }

  function cardHTML(game, index) {
    var saved = favs.has(game.u);
    return '<article class="game" data-url="' + esc(game.u) + '">' +
      '<a class="game__hit" href="' + esc(game.u) + '" aria-label="Play ' + esc(game.t) + '">' +
        '<div class="game__art">' +
          '<img src="' + esc(game.i) + '" alt="" loading="lazy" decoding="async" width="640" height="480">' +
          '<span class="game__play">Play</span>' +
        '</div>' +
        '<div class="game__meta"><span class="game__idx">' + pad(index + 1, 3) + '</span><h3>' + esc(game.t) + '</h3></div>' +
        '<p class="game__tags">' + esc(game.g.slice(0, 2).join(" · ")) + '</p>' +
      '</a>' +
      '<button class="game__fav' + (saved ? " is-fav" : "") + '" type="button" data-url="' + esc(game.u) + '"' +
        ' aria-pressed="' + saved + '" aria-label="' + (saved ? "Remove " : "Save ") + esc(game.t) + (saved ? " from" : " to") + ' favourites">' +
        '<svg aria-hidden="true"><use href="#i-star"/></svg>' +
      '</button>' +
    '</article>';
  }

  function renderGrid(resetLimit) {
    if (!els.grid) return;
    var list = filteredList();
    if (resetLimit) state.limit = PAGE;

    var visible = list.slice(0, state.limit);
    els.grid.innerHTML = visible.map(cardHTML).join("");

    if (els.shownCount) els.shownCount.textContent = visible.length;
    if (els.totalCount) els.totalCount.textContent = list.length;

    var isEmpty = list.length === 0;
    els.empty.hidden = !isEmpty;
    els.grid.hidden = isEmpty;
    els.more.hidden = isEmpty || list.length <= visible.length;
    if (els.moreLeft) els.moreLeft.textContent = Math.max(0, list.length - visible.length) + " left";

    if (isEmpty) {
      if (state.favsOnly && favs.size === 0) {
        els.emptyTitle.textContent = "Nothing saved yet";
        els.emptyText.textContent = "Tap the star on any game and it waits for you here.";
      } else if (state.q.trim()) {
        els.emptyTitle.textContent = "No signal";
        els.emptyText.textContent = 'Nothing matches "' + state.q.trim() + '". Try a shorter word, or clear the filter.';
      } else {
        els.emptyTitle.textContent = "No signal";
        els.emptyText.textContent = "Nothing in this category. Try another one.";
      }
    }

    els.favNote.hidden = !state.favsOnly;
    if (els.reset) els.reset.textContent = state.favsOnly ? "Show everything" : "Clear filters";
  }

  function isSaved(url) { return favs.has(url); }

  function paintFavButton(button, saved) {
    button.classList.toggle("is-fav", saved);
    button.setAttribute("aria-pressed", String(saved));
    var game = GAMES.filter(function (g) { return g.u === button.getAttribute("data-url"); })[0];
    if (game) {
      button.setAttribute("aria-label", (saved ? "Remove " : "Save ") + game.t + (saved ? " from" : " to") + " favourites");
    }
  }

  function toggleFav(url) {
    var game = GAMES.filter(function (g) { return g.u === url; })[0];
    if (!game) return;

    var saved;
    if (favs.has(url)) { favs.delete(url); saved = false; }
    else { favs.add(url); saved = true; }

    write(FAV_KEY, Array.from(favs));
    $$(".game__fav").forEach(function (button) {
      if (button.getAttribute("data-url") === url) paintFavButton(button, saved);
    });

    toast(saved ? game.t + " saved" : game.t + " removed");
    if (state.favsOnly) renderGrid();
  }

  var ctxGame = null;

  function openCtx(x, y) {
    if (!els.ctx) return;
    var favLabel = els.ctx.querySelector('[data-act="fav"] span');
    if (favLabel && ctxGame) {
      favLabel.textContent = isSaved(ctxGame) ? "Remove from favourites" : "Save to favourites";
    }
    els.ctx.classList.add("is-on");
    var box = els.ctx.getBoundingClientRect();
    var left = Math.min(x, window.innerWidth - box.width - 10);
    var top = Math.min(y, window.innerHeight - box.height - 10);
    els.ctx.style.left = Math.max(10, left) + "px";
    els.ctx.style.top = Math.max(10, top) + "px";
  }

  function closeCtx() {
    if (!els.ctx) return;
    els.ctx.classList.remove("is-on");
    ctxGame = null;
  }

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function tick() {
    var now = new Date();
    var hours = pad(now.getHours());
    var minutes = pad(now.getMinutes());
    var seconds = pad(now.getSeconds());

    if (els.statusClock) els.statusClock.textContent = hours + ":" + minutes;
    if (els.bigClock) els.bigClock.textContent = hours + ":" + minutes;
    if (els.bigSec) els.bigSec.textContent = ":" + seconds;
    if (els.bigDate) els.bigDate.textContent = DAYS[now.getDay()] + ", " + now.getDate() + " " + MONTHS[now.getMonth()];
    if (els.heroDate) els.heroDate.textContent = SHORT_DAYS[now.getDay()] + " " + now.getDate() + " " + MONTHS[now.getMonth()].slice(0, 3);
  }

  function initBattery() {
    if (!els.batteryCells || !els.batteryText) return;
    if (!navigator.getBattery) {
      els.batteryText.innerHTML = "Battery <b>not reported</b>";
      return;
    }
    navigator.getBattery().then(function (battery) {
      function paint() {
        var level = Math.round(battery.level * 5);
        var cells = $$("i", els.batteryCells);
        cells.forEach(function (cell, index) {
          cell.className = index < level ? "on" + (battery.level <= 0.2 ? " low" : "") : "";
        });
        els.batteryText.innerHTML = "Battery <b>" + Math.round(battery.level * 100) + "%</b>" +
          (battery.charging ? " · charging" : "");
      }
      paint();
      battery.addEventListener("levelchange", paint);
      battery.addEventListener("chargingchange", paint);
    }).catch(function () {
      els.batteryText.innerHTML = "Battery <b>not reported</b>";
    });
  }

  function initProfile() {
    var user = null;
    try { user = localStorage.getItem("chatUser"); } catch (err) { user = null; }
    if (!user) return;
    if (els.whoName) els.whoName.textContent = user;
    if (els.whoHandle) els.whoHandle.textContent = "@" + user.toLowerCase().replace(/\s+/g, "");
    if (els.whoState) els.whoState.textContent = "signed in";
  }

  function initBuild() {
    fetch("../version.json", { cache: "no-store" })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (data) {
        if (!data || !data.version) return;
        var raw = String(data.version);
        if (els.statusBuild) els.statusBuild.textContent = raw.slice(-6);
        if (els.footBuild) els.footBuild.textContent = raw;
        var when = new Date(Number(raw));
        if (els.footDate && !isNaN(when.getTime())) {
          els.footDate.textContent = when.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        }
      })
      .catch(function () { /* version file is optional */ });
  }

  function initStrips() {
    var statusItems = [
      "Car Destruction King added",
      "1,575 games indexed",
      "Ragdoll Archers is in",
      "Theme pass shipped",
      "Ctrl + K searches every title",
      "Pack games now on GitHub"
    ];
    var double = statusItems.concat(statusItems);
    if (els.statusTrack) {
      els.statusTrack.innerHTML = double.map(function (item) {
        return "<span><i></i>" + esc(item) + "</span>";
      }).join("");
    }

    var fresh = GAMES.slice(0, 9).map(function (game) { return game.t; });
    fresh = fresh.concat(fresh);
    if (els.tickerTrack) {
      els.tickerTrack.innerHTML = fresh.map(function (title) {
        return "<span>" + esc(title) + "</span>";
      }).join("");
    }
  }

  function markActive(link) {
    $$(".rail__item").forEach(function (item) { item.classList.remove("is-active"); });
    if (link) link.classList.add("is-active");
  }

  function initEvents() {
    if (els.bigClock) tick();
    setInterval(tick, 1000);

    if (els.q) {
      var debounce = null;
      els.q.addEventListener("input", function () {
        clearTimeout(debounce);
        var value = els.q.value;
        debounce = setTimeout(function () {
          state.q = value;
          renderGrid(true);
        }, 80);
      });
    }

    if (els.chips) {
      els.chips.addEventListener("click", function (event) {
        var chip = event.target.closest(".chip");
        if (!chip) return;
        setChip(chip.getAttribute("data-tag"));
        renderGrid(true);
      });
    }

    if (els.sort) {
      els.sort.addEventListener("change", function () {
        state.sort = els.sort.value;
        if (state.sort === "random") state.seed = Date.now() % 2147483647;
        renderGrid(true);
      });
    }

    if (els.more) {
      els.more.addEventListener("click", function () {
        state.limit += PAGE;
        renderGrid();
      });
    }

    if (els.reset) {
      els.reset.addEventListener("click", function () {
        state.q = "";
        state.tag = "All";
        state.favsOnly = false;
        if (els.q) els.q.value = "";
        setChip("All");
        renderGrid(true);
      });
    }

    if (els.grid) {
      els.grid.addEventListener("click", function (event) {
        var fav = event.target.closest(".game__fav");
        if (fav) {
          event.preventDefault();
          event.stopPropagation();
          toggleFav(fav.getAttribute("data-url"));
          return;
        }
        var link = event.target.closest(".game__hit");
        if (link) remember(link.getAttribute("href"));
      });

      els.grid.addEventListener("contextmenu", function (event) {
        var card = event.target.closest(".game");
        if (!card) return;
        event.preventDefault();
        ctxGame = card.getAttribute("data-url");
        openCtx(event.clientX, event.clientY);
      });
    }

    if (els.picks) {
      els.picks.addEventListener("click", function (event) {
        var link = event.target.closest(".pick");
        if (link) remember(link.getAttribute("href"));
      });
    }

    if (els.deck) {
      els.deck.addEventListener("click", function (event) {
        var card = event.target.closest(".deck__card");
        if (card) remember(card.getAttribute("href"));
      });
    }

    if (els.heroPlay) {
      els.heroPlay.addEventListener("click", function () {
        remember(els.heroPlay.getAttribute("href"));
      });
    }

    var surprise = $("#surprise");
    if (surprise) {
      surprise.addEventListener("click", function () {
        var pool = filteredList();
        if (!pool.length) pool = GAMES;
        var pick = pool[Math.floor(Math.random() * pool.length)];
        toast("Taking you to " + pick.t);
        setTimeout(function () { openGame(pick.u); }, 320);
      });
    }

    var prev = $("#deckPrev");
    var next = $("#deckNext");
    if (prev) prev.addEventListener("click", function () { stepDeck(-1); });
    if (next) next.addEventListener("click", function () { stepDeck(1); });

    if (els.deck) {
      var deckWrap = els.deck.parentNode;
      deckWrap.addEventListener("mouseenter", function () { clearInterval(deckTimer); });
      deckWrap.addEventListener("mouseleave", restartDeck);
      deckWrap.addEventListener("focusin", function () { clearInterval(deckTimer); });
      deckWrap.addEventListener("focusout", restartDeck);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) clearInterval(deckTimer);
      else restartDeck();
    });

    if (els.recentClear) {
      els.recentClear.addEventListener("click", function () {
        recent = [];
        write(RECENT_KEY, recent);
        renderRecent();
        toast("Recents cleared");
      });
    }

    if (els.recentRow) {
      els.recentRow.addEventListener("click", function (event) {
        var item = event.target.closest(".recent__item");
        if (item) remember(item.getAttribute("href"));
      });
    }

    $$(".rail__item").forEach(function (item) {
      item.addEventListener("click", function () {
        markActive(item);
        if (item.hasAttribute("data-favs")) {
          state.favsOnly = true;
          renderGrid(true);
        } else if (item.getAttribute("data-nav") === "library") {
          state.favsOnly = false;
          renderGrid(true);
        }
      });
    });

    document.addEventListener("click", function (event) {
      if (els.ctx && !event.target.closest("#ctx")) closeCtx();
    });

    if (els.ctx) {
      els.ctx.addEventListener("click", function (event) {
        var action = event.target.closest("button");
        if (!action || !ctxGame) return;
        var url = ctxGame;

        if (action.getAttribute("data-act") === "play") {
          openGame(url);
        } else if (action.getAttribute("data-act") === "fav") {
          toggleFav(url);
          closeCtx();
        } else if (action.getAttribute("data-act") === "copy") {
          var absolute = new URL(url, window.location.href).href;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(absolute).then(function () {
              toast("Link copied");
            }).catch(function () {
              toast("Could not copy");
            });
          } else {
            toast("Copy not supported here");
          }
          closeCtx();
        } else if (action.getAttribute("data-act") === "tab") {
          window.open(url, "_blank", "noopener");
          closeCtx();
        }
      });
    }

    document.addEventListener("keydown", function (event) {
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tag);

      if ((event.key === "/" && !typing) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        if (els.q) { els.q.focus(); els.q.select(); }
        return;
      }

      if (event.key === "Escape") {
        if (els.ctx && els.ctx.classList.contains("is-on")) {
          closeCtx();
          return;
        }
        if (typing && els.q && document.activeElement === els.q) {
          els.q.value = "";
          state.q = "";
          renderGrid(true);
          els.q.blur();
        }
        return;
      }

      if (!typing && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === "r") {
        event.preventDefault();
        var pool = filteredList();
        if (!pool.length) pool = GAMES;
        var pick = pool[Math.floor(Math.random() * pool.length)];
        toast("Taking you to " + pick.t);
        setTimeout(function () { openGame(pick.u); }, 320);
      }
    });
  }

  function boot() {
    if (els.statLoaded) els.statLoaded.textContent = GAMES.length.toLocaleString("en-GB");
    if (els.q) els.q.setAttribute("placeholder", "Search " + GAMES.length + " games…");

    initStrips();
    renderPicks();
    renderChips();
    renderDeck();
    renderRecent();
    renderGrid(true);
    initProfile();
    initBattery();
    initBuild();
    tick();
    initEvents();
    restartDeck();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

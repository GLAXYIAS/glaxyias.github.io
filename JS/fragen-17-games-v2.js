/* Catalog extras: direct-launch cards and the empty-search request form. */
(function () {
  "use strict";

  var directGames = {
    fragen: "https://whatchamacallitexe.github.io/fragen/index.html",
    "17-and-0": "https://whatchamacallitexe.github.io/17-and-0/index.html"
  };

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
      tries++;
      if (grid.querySelectorAll("[data-game-id]").length > 0) {
        hide();
        return;
      }
      if (tries >= 20) {
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

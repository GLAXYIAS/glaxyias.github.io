/* Direct-launch links for Fragen and 17-0. Loaded after JS/main.js. */
/* The catalog already contains both cards, so this only redirects their clicks
   out of the iframe shell. Delegated, so it survives grid re-renders. */
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
})();

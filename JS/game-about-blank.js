/* Launch games in a top-level about:blank tab.
   Some managed browsers only allow iframes when the top document is about:blank.
   We open the blank tab, capture main.js's existing game shell instead of
   letting it replace the home page, then rebuild the shell with DOM nodes
   (document.write would give the tab the opener's URL again). */
(function () {
  'use strict';

  if (window.__nxGameAboutBlank) return;
  window.__nxGameAboutBlank = true;

  function renderShell(popup, popupDoc, shell) {
    var parsed = new DOMParser().parseFromString(shell, 'text/html');
    popupDoc.title = parsed.title || 'Game';

    var i;
    for (i = 0; i < parsed.head.childNodes.length; i++) {
      var headNode = parsed.head.childNodes[i];
      if (headNode.nodeType === 1 || headNode.nodeType === 3) {
        popupDoc.head.appendChild(popupDoc.importNode(headNode, true));
      }
    }

    var scripts = [];
    for (i = 0; i < parsed.body.childNodes.length; i++) {
      var bodyNode = parsed.body.childNodes[i];
      if (bodyNode.nodeType === 1 && bodyNode.tagName === 'SCRIPT') {
        scripts.push(bodyNode.textContent);
        continue;
      }
      popupDoc.body.appendChild(popupDoc.importNode(bodyNode, true));
    }

    /* The back button normally replaces this tab with the home page. Since the
       game lives in its own tab, closing it returns to the home page already
       open behind it. */
    popupDoc.addEventListener('click', function (event) {
      var target = event.target && event.target.closest
        ? event.target.closest('#nx-back-btn, #err-home')
        : null;
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      try { popup.close(); } catch (e) {}
    }, true);

    for (i = 0; i < scripts.length; i++) {
      var script = popupDoc.createElement('script');
      script.textContent = scripts[i];
      popupDoc.body.appendChild(script);
    }

    try { popup.focus(); } catch (e) {}
  }

  function install() {
    if (typeof window.launchGame !== 'function') return false;
    if (window.launchGame.__nxGameAboutBlank) return true;

    var original = window.launchGame;

    window.launchGame = function (gameId) {
      var useIframe = true;
      try {
        useIframe = window.localStorage.getItem('nx_use_iframe') !== 'false';
      } catch (e) {}

      if (!useIframe) return original.apply(this, arguments);

      var popup = null;
      try {
        popup = window.open('about:blank', '_blank');
      } catch (e) {}
      if (!popup || !popup.document) return original.apply(this, arguments);

      var popupDoc;
      try {
        popupDoc = popup.document;
      } catch (e) {
        try { popup.close(); } catch (err) {}
        return original.apply(this, arguments);
      }

      var shell = '';
      var wrote = false;
      var doc = document;
      var nativeOpen = doc.open;
      var nativeWrite = doc.write;
      var nativeClose = doc.close;
      var nativeClearInterval = window.clearInterval;
      var nativeClearTimeout = window.clearTimeout;

      function restore() {
        doc.open = nativeOpen;
        doc.write = nativeWrite;
        doc.close = nativeClose;
        window.clearInterval = nativeClearInterval;
        window.clearTimeout = nativeClearTimeout;
      }

      try {
        doc.open = function () { return doc; };
        doc.write = function (chunk) {
          wrote = true;
          shell += String(chunk);
        };
        doc.close = function () {};
        /* The shell normally clears every timer on the old page because that
           page was being replaced. The home page stays open now, so keep its
           clock and other timers alive. */
        window.clearInterval = function () {};
        window.clearTimeout = function () {};
        original.call(this, gameId);
      } catch (e) {
        restore();
        try { popup.close(); } catch (err) {}
        return;
      }
      restore();

      if (!wrote || !shell) {
        try { popup.close(); } catch (e) {}
        return;
      }

      try {
        renderShell(popup, popupDoc, shell);
      } catch (e) {
        try { popup.close(); } catch (err) {}
      }
    };

    window.launchGame.__nxGameAboutBlank = true;
    return true;
  }

  if (!install()) {
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      if (install() || tries > 100) clearInterval(timer);
    }, 50);
  }
})();

/* Keep the debug button available on the home screen without letting it float
   over the lock screen, Canvas, TOS, profile, or other full-screen overlays. */
(function () {
  'use strict';

  if (window.top !== window.self) return;
  if (window.__nxDebugOverlay) return;
  window.__nxDebugOverlay = true;

  /* nx-emoji-icons historically hid the whole debug panel on every page. That
     rule also hides the button, so remove it here. The observer catches it if
     the icon layer is loaded after this script. */
  function removeDevToolsHide() {
    var style = document.getElementById('nx-hide-devtools');
    if (style && style.parentNode) style.parentNode.removeChild(style);
  }
  removeDevToolsHide();
  try {
    new MutationObserver(removeDevToolsHide).observe(
      document.head || document.documentElement,
      { childList: true, subtree: true }
    );
  } catch (e) {}

  var OVERLAY_SELECTORS = [
    '#pin-lock-overlay',
    '#nx-canvas-overlay',
    '#nx-tos-gate',
    '#profile-modal.is-open',
    '.nxup-modal.nxup-open',
    '#system-news-modal.show',
    '#handlerModal:not(.hidden)',
    '#warning-modal-overlay:not(.hidden)',
    '#delete-modal-overlay',
    '#educational-cloak'
  ].join(',');

  var style = document.createElement('style');
  style.id = 'nx-debug-overlay-style';
  style.textContent =
    'html.nx-debug-suppressed #nx-trigger,' +
    'html.nx-debug-suppressed #nx-hud,' +
    'html.nx-debug-suppressed #nx-inspector-overlay,' +
    'html.nx-debug-suppressed #nx-toast-wrap,' +
    'html.nx-debug-suppressed #nx-matrix-canvas' +
    '{display:none!important;visibility:hidden!important;pointer-events:none!important}';
  (document.head || document.documentElement).appendChild(style);

  function visible(el) {
    if (!el || el.nodeType !== 1 || el.hidden) return false;
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    return el.getClientRects().length > 0;
  }

  function overlayOpen() {
    var known = document.querySelectorAll(OVERLAY_SELECTORS);
    for (var i = 0; i < known.length; i++) {
      if (visible(known[i])) return true;
    }

    var nodes = document.querySelectorAll('body > *, html > dialog[open], [role="dialog"][aria-modal="true"]');
    for (i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!el || el === document.body || el === document.documentElement) continue;
      if (el.closest && el.closest('#nx-hud, #nx-trigger, #nx-inspector-overlay, #nx-toast-wrap, #nx-matrix-canvas')) continue;
      if (!visible(el)) continue;
      var cs = getComputedStyle(el);
      if (cs.pointerEvents === 'none') continue;
      if (cs.position !== 'fixed' && cs.position !== 'absolute') continue;
      var rect = el.getBoundingClientRect();
      if (rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.9) return true;
    }
    return false;
  }

  var lastSuppressed = null;
  function sync() {
    var suppressed = overlayOpen();
    if (suppressed !== lastSuppressed) {
      lastSuppressed = suppressed;
      document.documentElement.classList.toggle('nx-debug-suppressed', suppressed);
    }
    var devtools = window.__NULLX_DEVTOOLS__;
    if (suppressed && devtools && devtools.state && devtools.state.visible) {
      try { devtools.hide(); } catch (e) {}
    }
  }

  sync();
  try {
    new MutationObserver(sync).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'open', 'aria-hidden']
    });
  } catch (e) {}
  setInterval(sync, 600);
})();

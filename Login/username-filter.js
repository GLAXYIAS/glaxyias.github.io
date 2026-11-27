/*
 * Boot script for Login/login.html.
 *
 * login.html already referenced this file, but it was never committed, so the
 * page loaded with a 404. It now boots the site-wide Terms of Service gate,
 * which blocks the page until the visitor has read the terms and agreed.
 *
 * The gate itself lives in /JS/tos-gate.js.
 */
(function () {
  'use strict';

  if (window.__nxTosGateLoaded || document.getElementById('nx-tos-gate-loader')) return;

  var script = document.createElement('script');
  script.id = 'nx-tos-gate-loader';
  script.src = '../JS/tos-gate.js';
  (document.head || document.documentElement).appendChild(script);
})();

/*
 * Profanity filter loader.
 *
 * login.html still points at its old badword.js URL on jsDelivr
 * (gh/Null-X-Team/badwordfilter) - that repository no longer exists, jsDelivr
 * answers 404 and the browser refuses the text/plain error page, so
 * window.containsBadWords was never defined and every username check was
 * skipped. Load the maintained copy instead; it exports the same
 * window.containsBadWords / window.filterBadWords API the page expects.
 */
(function () {
  'use strict';

  if (typeof window.containsBadWords === 'function') return;
  if (document.querySelector('script[data-nx-badwords]')) return;

  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/gh/glaeesas/badwordfilter@main/badword.js';
  script.setAttribute('data-nx-badwords', '1');
  (document.head || document.documentElement).appendChild(script);
})();

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

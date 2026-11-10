/*
 * Compatibility shim.
 * The real Terms of Service gate lives in JS/tos-gate.js. This file only
 * exists because an older copy of it lived here; loading either path gives
 * you the same gate.
 */
(function () {
  'use strict';

  if (window.__nxTosGateLoaded || document.getElementById('nx-tos-gate-loader')) return;

  var src = '';
  try {
    if (document.currentScript && document.currentScript.src) {
      src = document.currentScript.src;
    }
  } catch (e) {}

  var target;
  try {
    target = new URL('../JS/tos-gate.js', src || window.location.href).href;
  } catch (e) {
    target = '/JS/tos-gate.js';
  }

  var script = document.createElement('script');
  script.id = 'nx-tos-gate-loader';
  script.src = target;
  (document.head || document.documentElement).appendChild(script);
})();

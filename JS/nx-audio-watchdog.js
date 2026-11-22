/* Keep Web Audio alive after tab switches, OS audio interruptions, or
   browser/device suspend events. Unity's built-in resume loop only runs until
   the context first starts, so a later suspension can leave the game silent
   until the player happens to click or tap. */
(function () {
  'use strict';
  if (window.__nxAudioWatchdog) return;
  window.__nxAudioWatchdog = true;
  var Native = window.AudioContext || window.webkitAudioContext;
  if (!Native) return;
  var contexts = [];
  function TrackedAudioContext() {
    var ctx = (window.Reflect && Reflect.construct)
      ? Reflect.construct(Native, arguments)
      : new Native();
    contexts.push(ctx);
    return ctx;
  }
  TrackedAudioContext.prototype = Native.prototype;
  try { Object.setPrototypeOf(TrackedAudioContext, Native); } catch (e) {}
  window.AudioContext = TrackedAudioContext;
  try { window.webkitAudioContext = TrackedAudioContext; } catch (e) {}

  function resumeAll() {
    if (document.visibilityState === 'hidden') return;
    for (var i = 0; i < contexts.length; i++) {
      var ctx = contexts[i];
      try {
        if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
          var p = ctx.resume();
          if (p && typeof p.catch === 'function') p.catch(function () {});
        }
      } catch (e) {}
    }
  }
  function later() { setTimeout(resumeAll, 0); setTimeout(resumeAll, 250); }
  window.addEventListener('visibilitychange', function () {
    if (!document.hidden) later();
  }, true);
  window.addEventListener('focus', later, true);
  window.addEventListener('pageshow', later, true);
  ['pointerdown', 'mousedown', 'touchstart', 'keydown', 'click'].forEach(function (name) {
    window.addEventListener(name, resumeAll, { capture: true, passive: true });
  });
  setInterval(resumeAll, 1000);
})();

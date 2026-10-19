/* Load last-known-good chat.js, then install PM API compatibility patch */
(async function () {
  var ORIG = 'https://cdn.jsdelivr.net/gh/glaxyias/glaxyias.github.io@7e2a695a/chat/chat.js';
  try {
    var res = await fetch(ORIG);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var code = await res.text();
    var s = document.createElement('script');
    s.text = code;
    document.head.appendChild(s);
  } catch (e) {
    console.error('Failed to load base chat.js', e);
  }
})();

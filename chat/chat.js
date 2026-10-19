/* chat.js PM-fix loader — reassembles gzip payload */
(async function () {
  var n = 5;
  var b64 = '';
  for (var i = 0; i < n; i++) {
    if (typeof window['__CHAT_B64_' + i] !== 'string') {
      console.error('Missing chunk', i);
      return;
    }
    b64 += window['__CHAT_B64_' + i];
  }
  var bin = Uint8Array.from(atob(b64), function (c) { return c.charCodeAt(0); });
  var stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'));
  var text = await new Response(stream).text();
  var s = document.createElement('script');
  s.text = text;
  document.head.appendChild(s);
})().catch(function (e) {
  console.error('chat expand failed', e);
});

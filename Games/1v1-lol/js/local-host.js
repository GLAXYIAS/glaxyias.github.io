/*
 * Self-host shim for the 1v1.LOL page.
 *
 * The game build asks for its addressable bundles on the original site's CDN.
 * We host those bundles next to the page, so this wrapper rewrites the CDN
 * prefix to the local folder. It also stitches the split Unity data file back
 * together, because the 128 MB payload is stored as smaller parts in the repo.
 *
 * No ad or analytics host is touched here: the ad script and Google Tag Manager
 * are not included in this copy of the page at all.
 */
(function () {
  'use strict';

  var nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  if (!nativeFetch) return;

  var CDN_PREFIX = 'https://cdn.1v1lolreloaded.com/WebGL/';
  var LOCAL_PREFIX = 'StreamingAssets/aa/WebGL/';
  var DATA_NAME = 'Build/WebGL.data.c0de4610.unityweb';
  var parts = window.NX_1V1_DATA_PARTS || [];
  var totalSize = Number(window.NX_1V1_DATA_SIZE || 0);

  function urlOf(input) {
    if (typeof input === 'string') return input;
    if (input && typeof input.url === 'string') return input.url;
    return '';
  }

  function stitchedResponse() {
    var stream = new ReadableStream({
      start: function (controller) {
        var index = 0;
        function next() {
          if (index >= parts.length) {
            controller.close();
            return;
          }
          var partUrl = parts[index++];
          nativeFetch(partUrl).then(function (res) {
            if (!res.ok) throw new Error('Missing data part ' + partUrl + ' (' + res.status + ')');
            var reader = res.body.getReader();
            function pump() {
              reader.read().then(function (chunk) {
                if (chunk.done) {
                  next();
                  return;
                }
                controller.enqueue(chunk.value);
                pump();
              }, function (err) { controller.error(err); });
            }
            pump();
          }, function (err) { controller.error(err); });
        }
        next();
      }
    });

    var headers = { 'Content-Type': 'application/octet-stream' };
    if (totalSize > 0) headers['Content-Length'] = String(totalSize);
    return Promise.resolve(new Response(stream, { status: 200, headers: headers }));
  }

  window.fetch = function (input, init) {
    var url = urlOf(input);
    if (url.indexOf(CDN_PREFIX) === 0) {
      return nativeFetch(LOCAL_PREFIX + url.slice(CDN_PREFIX.length), init);
    }
    if (parts.length && url.indexOf(DATA_NAME) !== -1) {
      return stitchedResponse();
    }
    return nativeFetch(input, init);
  };
})();

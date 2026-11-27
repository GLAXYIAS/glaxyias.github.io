// Null-X cache-busting service worker.
// The guard posts the build id it detected; from then on this worker requests
// pages network-first and appends ?nxv=<build> to same-origin assets so the
// browser and the Pages CDN cannot hand back the previous version.
let NX_BUILD = '0';
let NX_HITS = 0;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'nx-build' && data.build) NX_BUILD = String(data.build);
  if (data.type === 'nx-build-reset') NX_BUILD = '0';
  if (data.type === 'nx-stats' && event.source && event.source.postMessage) {
    event.source.postMessage({ type: 'nx-stats', build: NX_BUILD, hits: NX_HITS });
  }
  if (event.source && event.source.postMessage) {
    event.source.postMessage({ type: 'nx-build-ack', build: NX_BUILD });
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  let url;
  try {
    url = new URL(request.url);
  } catch (err) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(() => fetch(request))
    );
    return;
  }

  NX_HITS += 1;
  if (NX_BUILD !== '0' && !url.searchParams.has('nxv')) {
    url.searchParams.set('nxv', NX_BUILD);
  }

  event.respondWith(
    fetch(url.href, { cache: 'no-store' }).catch(() => fetch(request))
  );
});

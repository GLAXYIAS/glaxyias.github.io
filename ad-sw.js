/* Ad-network blocker for the whole site.
 *
 * Served from the site root so it controls every page (a worker under /JS/ could only control
 * /JS/). Some games rebuild their page in a fresh document and re-create ad <script> tags there,
 * which an in-page blocker cannot always reach; those requests still pass through this worker.
 * Everything that is not an ad is fetched normally and never cached.
 */
var AD_HOSTS = [
  'googlesyndication.com', 'googleadservices.com', 'doubleclick.net', 'googletagmanager.com',
  'google-analytics.com', 'googletagservices.com', 'imasdk.googleapis.com', '2mdn.net',
  'adinplay.com', 'adnplay.com', 'script.ac', 'adthrive.com', 'raptive.com', 'marmalade.tv',
  'taboola.com', 'outbrain.com', 'propellerads.com', 'adsterra.com', 'exoclick.com',
  'juicyads.com', 'popads.net', 'popcash.net', 'onclickads.net', 'monetag.com', 'adcash.com',
  'tsyndicate.com', 'hilltopads.net', 'ezoic.net', 'nitropay.com', 'playwire.com',
  'venatusmedia.com', 'gamemonetize.com', 'gamedistribution.com', 'adnxs.com', 'criteo.com',
  'revcontent.com', 'mgid.com', 'scorecardresearch.com', 'quantserve.com', 'hotjar.com',
  'connect.facebook.net', 'btloader.com', 'confiant.com', 'snigelweb.com', 'freestar.com',
  'pubmatic.com', 'rubiconproject.com'
];
var AD_PATH = /\/(pagead|adsbygoogle|adserver|ads?\.js|adframe|prebid|popunder|banner-ads?)\b/i;

function isAd(url) {
  var u;
  try { u = new URL(url); } catch (e) { return false; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  var host = u.hostname.toLowerCase();
  for (var i = 0; i < AD_HOSTS.length; i++) {
    var d = AD_HOSTS[i];
    if (host === d || host.slice(-(d.length + 1)) === '.' + d) return true;
  }
  return u.hostname === self.location.hostname && AD_PATH.test(u.pathname);
}

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) { event.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET' || !isAd(request.url)) return;
  var type = request.destination || '';
  var body = type === 'script' ? '/* blocked ad script */' : '';
  event.respondWith(new Response(body, {
    status: 200,
    headers: { 'content-type': type === 'script' ? 'text/javascript' : 'text/plain' }
  }));
});

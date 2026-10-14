/*
 * adblock.js - blocks ad scripts, ad frames, ad requests and popups on your site.
 * IMPORTANT: load this as the FIRST script in <head> on every page.
 * To block more ad companies, just add their domain to the BLOCKED_DOMAINS list.
 */
(function () {
  'use strict';
  var BLOCKED_DOMAINS = [
    'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
    'adservice.google.com', 'pagead2.googlesyndication.com', 'googletagservices.com',
    'google-analytics.com', 'googletagmanager.com', '2mdn.net', 'admob.com',
    'adnxs.com', 'adsrvr.org', 'rubiconproject.com', 'pubmatic.com', 'openx.net',
    'criteo.com', 'criteo.net', 'casalemedia.com', 'indexww.com', 'smartadserver.com',
    'amazon-adsystem.com', 'advertising.com', 'adform.net', 'adition.com',
    'yieldmo.com', 'sharethrough.com', 'triplelift.com', 'media.net', 'bidswitch.net',
    'contextweb.com', 'lijit.com', 'sovrn.com', 'spotxchange.com', 'springserve.com',
    'teads.tv', 'seedtag.com', 'adcolony.com', 'applovin.com',
    'unityads.unity3d.com', 'ironsrc.com', 'supersonicads.com', 'vungle.com',
    'chartboost.com', 'inmobi.com', 'mopub.com', 'startapp.com',
    'taboola.com', 'outbrain.com', 'revcontent.com', 'mgid.com', 'zergnet.com',
    'content.ad', 'adblade.com',
    'popads.net', 'popcash.net', 'propellerads.com', 'propeller-tracking.com',
    'adsterra.com', 'exoclick.com', 'exosrv.com', 'juicyads.com', 'trafficjunky.net',
    'clickadu.com', 'hilltopads.net', 'richpush.co', 'a-ads.com', 'ad-maven.com',
    'admaven.com', 'adcash.com', 'bidvertiser.com', 'infolinks.com', 'adsco.re',
    'onclickads.net', 'monetag.com', 'galaksion.com', 'evadav.com', 'ero-advertising.com',
    'gamemonetize.com', 'gamedistribution.com', 'adinplay.com', 'playwire.com',
    'adsafeprotected.com', 'moatads.com', 'doubleverify.com',
    'scorecardresearch.com', 'quantserve.com', 'hotjar.com', 'facebook.net',
    'connect.facebook.net'
  ];
  var BLOCKED_PATTERNS = [
    /\/pagead\//i, /adsbygoogle/i, /\/adserver/i, /\/ads\.js/i, /\/adframe/i,
    /\/advert/i, /[?&]adunit/i, /\/prebid/i, /\/popunder/i, /\/banner-ads?\//i
  ];
  function isBlocked(url) {
    if (!url || typeof url !== 'string') {
      try { url = String(url && url.href ? url.href : url); } catch (e) { return false; }
    }
    if (url.indexOf('data:') === 0 || url.indexOf('blob:') === 0) return false;
    var host;
    try { host = new URL(url, location.href).hostname.toLowerCase(); } catch (e) { return false; }
    if (host === location.hostname) {
      return BLOCKED_PATTERNS.some(function (p) { return p.test(url); });
    }
    for (var i = 0; i < BLOCKED_DOMAINS.length; i++) {
      var d = BLOCKED_DOMAINS[i].split('/')[0];
      if (host === d || host.endsWith('.' + d)) return true;
    }
    return BLOCKED_PATTERNS.some(function (p) { return p.test(url); });
  }
  function nodeIsBad(node) {
    if (!node || node.nodeType !== 1) return false;
    var tag = node.tagName;
    if (tag === 'SCRIPT' || tag === 'IFRAME' || tag === 'IMG' || tag === 'EMBED' ||
        tag === 'OBJECT' || tag === 'SOURCE' || tag === 'VIDEO') {
      return isBlocked(node.src || node.getAttribute('src') || node.data || '');
    }
    if (tag === 'LINK') return isBlocked(node.href);
    if (tag === 'INS' && /adsbygoogle/.test(node.className)) return true;
    return false;
  }
  function containsBad(node) {
    if (nodeIsBad(node)) return true;
    if (node && node.querySelectorAll) {
      var kids = node.querySelectorAll('script[src],iframe[src],img[src],embed[src],object[data],link[href],ins.adsbygoogle');
      for (var i = 0; i < kids.length; i++) if (nodeIsBad(kids[i])) return true;
    }
    return false;
  }
  function wrapInsert(proto, name) {
    var original = proto[name];
    if (!original) return;
    proto[name] = function () {
      for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] && arguments[i].nodeType && containsBad(arguments[i])) {
          return arguments[i];
        }
      }
      return original.apply(this, arguments);
    };
  }
  ['appendChild', 'insertBefore', 'replaceChild'].forEach(function (n) { wrapInsert(Node.prototype, n); });
  ['append', 'prepend', 'before', 'after', 'replaceWith'].forEach(function (n) { wrapInsert(Element.prototype, n); });
  var origAdjacent = Element.prototype.insertAdjacentHTML;
  Element.prototype.insertAdjacentHTML = function (pos, html) {
    if (typeof html === 'string' && /<(script|iframe)[^>]+src=["']?([^"'\s>]+)/i.test(html)) {
      var m = html.match(/<(?:script|iframe)[^>]+src=["']?([^"'\s>]+)/i);
      if (m && isBlocked(m[1])) return;
    }
    return origAdjacent.call(this, pos, html);
  };
  if (window.fetch) {
    var origFetch = window.fetch;
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url);
      if (isBlocked(url)) return Promise.resolve(new Response('', { status: 200 }));
      return origFetch.apply(this, arguments);
    };
  }
  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    if (isBlocked(String(url))) {
      arguments[1] = 'data:,';
    }
    return origOpen.apply(this, arguments);
  };
  if (navigator.sendBeacon) {
    var origBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (url) {
      if (isBlocked(String(url))) return true;
      return origBeacon.apply(navigator, arguments);
    };
  }
  var origWindowOpen = window.open;
  window.open = function (url) {
    if (!url || isBlocked(String(url))) return null;
    if (!(window.event && window.event.isTrusted)) return null;
    return origWindowOpen.apply(window, arguments);
  };
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (a && isBlocked(a.href)) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  try {
    window.adsbygoogle = window.adsbygoogle || { push: function () {}, loaded: true };
    window.googletag = window.googletag || { cmd: [], pubads: function () { return { addEventListener: function () {}, setTargeting: function () {} }; }, enableServices: function () {}, display: function () {}, defineSlot: function () { return null; } };
    window.canRunAds = true;
  } catch (e) {}
  var css = [
    'ins.adsbygoogle', '.adsbygoogle', '[id^="google_ads"]', '[id^="div-gpt-ad"]',
    '[class*="advert"]', '[id*="advert"]', '[class*="ad-banner"]', '[id*="ad-banner"]',
    '[class*="ad-container"]', '[id*="ad-container"]', '[class*="ad-wrapper"]',
    '[class*="sponsored"]', '[class*="banner-ad"]', '[id*="banner-ad"]',
    'iframe[src*="doubleclick"]', 'iframe[src*="googlesyndication"]',
    'iframe[src*="adsterra"]', 'iframe[src*="propeller"]', 'iframe[src*="exoclick"]',
    '.taboola', '.outbrain', '[id*="taboola"]', '[id*="outbrain"]', '[data-ad-slot]'
  ].join(',') + '{display:none!important;visibility:hidden!important;height:0!important;width:0!important;pointer-events:none!important}';
  function addStyle() {
    var s = document.createElement('style');
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }
  addStyle();
  function sweep(root) {
    try {
      var found = root.querySelectorAll('script[src],iframe[src],img[src],embed[src],object[data],ins.adsbygoogle');
      for (var i = 0; i < found.length; i++) {
        if (nodeIsBad(found[i]) && found[i].parentNode) found[i].parentNode.removeChild(found[i]);
      }
    } catch (e) {}
  }
  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var added = mutations[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var n = added[j];
        if (n.nodeType !== 1) continue;
        if (nodeIsBad(n)) { if (n.parentNode) n.parentNode.removeChild(n); }
        else sweep(n);
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', function () { sweep(document); });
})();

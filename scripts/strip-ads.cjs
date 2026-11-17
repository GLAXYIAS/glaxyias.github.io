/* Make the site ad free.
 *
 * The site already ships JS/adblock.js, but no page loaded it, so the games' ad tags ran
 * unchecked. This puts the blocker first in <head> on every page, deletes the hard-coded ad
 * script tags (AdSense, AdinPlay, Cadmus, Google IMA video ads, AdThrive, pop/push networks),
 * and teaches the blocker the ad hosts it was missing plus stubs for games that expect an ad SDK.
 *
 * Idempotent: run from the repository root, safe to run again after new games are added.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const AD_HOSTS = [
  'googlesyndication', 'googleadservices', 'doubleclick', 'adsbygoogle',
  'google-analytics', 'googletagmanager', 'googletagservices',
  'adinplay', 'script\\.ac', '2mdn\\.net', 'imasdk\\.googleapis',
  'adthrive', 'raptive', 'marmalade',
  'taboola', 'outbrain', 'propellerads', 'adsterra', 'exoclick', 'popads',
  'onclickads', 'juicyads', 'adcash', 'tsyndicate', 'hilltopads', 'monetag',
  'gamemonetize', 'gamedistribution', 'playwire', 'nitropay', 'venatus', 'ezoic',
  'btloader', 'confiant', 'snigel', 'freestar', 'pubmatic', 'rubiconproject',
  'poki-sdk', 'game-cdn\\.poki', 'poki\\.com', 'crazygames', 'gdsdk',
  'tag\\.min\\.js', 'aiptag',
].join('|');
const AD_SCRIPT = new RegExp(
  '<script\\b[^>]*\\bsrc\\s*=\\s*["\'][^"\']*(?:' + AD_HOSTS + ')[^"\']*["\'][^>]*>\\s*</script>',
  'gi'
);
const BLOCKER_TAG = '<script src="/JS/adblock.js"></script>';

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

let pages = 0;
let injected = 0;
let stripped = 0;

for (const file of walk(ROOT)) {
  if (!/\.html?$/i.test(file)) continue;
  pages++;
  const before = fs.readFileSync(file, 'utf8');
  let text = before;

  const adTags = text.match(AD_SCRIPT);
  if (adTags) {
    stripped += adTags.length;
    text = text.replace(AD_SCRIPT, '');
  }

  // Pages copied from ad-heavy sites carry injected blocks that build a hidden iframe and run
  // obfuscated code inside it (popunders). Nothing legitimate uses these markers.
  const beforeInjection = text;
  text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (block) =>
    /__CF\$cv\$params|challenge-platform\/h\/b/.test(block) ? '' : block);
  if (text !== beforeInjection) stripped += 1;

  // AdInPlay runs from several small inline blocks that start the ad manager; the game glue
  // below them keeps its own script and falls back to the blocker's no-op aiptag stub.
  text = text.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (block, attrs, body) => {
    if (/\bsrc\s*=/i.test(attrs) || body.length > 6000) return block;
    if (/createUnityInstance|unityFramework|gameInstance/.test(body)) return block;
    return /\baiptag\b|aipDisplayTag/.test(body) ? '' : block;
  });

  if (!/JS\/adblock\.js/.test(text)) {
    if (/<head[^>]*>/i.test(text)) {
      text = text.replace(/<head[^>]*>/i, (m) => m + BLOCKER_TAG);
      injected++;
    } else if (/<html[^>]*>/i.test(text)) {
      text = text.replace(/<html[^>]*>/i, (m) => m + BLOCKER_TAG);
      injected++;
    } else {
      // Malformed pages with no <head> or <html> (usually a stray tag first); a script at the very
      // top still runs before everything else, so the blocker is in place either way.
      text = BLOCKER_TAG + '\n' + text;
      injected++;
    }
  }

  if (text !== before) fs.writeFileSync(file, text);
}

// Teach the blocker the hosts it was missing and cover SDK calls that games make directly.
const blockerPath = path.join(ROOT, 'JS', 'adblock.js');
if (fs.existsSync(blockerPath)) {
  let js = fs.readFileSync(blockerPath, 'utf8');
  const anchor = "'connect.facebook.net'";
  const extra = anchor + ", 'imasdk.googleapis.com', 'script.ac', 'adthrive.com', 'raptive.com'," +
    " 'adinplay.com', 'adnplay.com', 'marmalade.tv', 'btloader.com', 'confiant.com'," +
    " 'snigelweb.com', 'freestar.com', 'pubmatic.com', 'rubiconproject.com'," +
    " 'poki.com', 'poki-sdk', 'game-cdn.poki.com', 'crazygames.com', 'sdk.crazygames.com'," +
    " 'gdsdk.com', 'html5.gamedistribution.com'";
  if (!js.includes("'script.ac'")) {
    if (!js.includes(anchor)) throw new Error('adblock.js domain list changed; update strip-ads.cjs');
    js = js.replace(anchor, extra);
  }
  if (!js.includes('__adsStubbed')) {
    js += [
      '',
      '/* Stubs for games that talk to an ad SDK directly: with the SDK blocked the page must still run. */',
      '(function () {',
      '  window.__adsStubbed = true;',
      '  var AD = /(googlesyndication|googleadservices|doubleclick|adsbygoogle|google-analytics|googletagmanager|googletagservices|adinplay|script\\.ac|2mdn\\.net|imasdk\\.googleapis|adthrive|raptive|taboola|outbrain|adsterra|exoclick|popads|onclickads|juicyads|adcash|tsyndicate|hilltopads|monetag|ezoic|nitropay|playwire|venatus|btloader|confiant|snigel|freestar|pubmatic|rubiconproject|poki|crazygames|gdsdk|gamedistribution)/i;',
      '  var bad = function (url) { return !!url && AD.test(String(url)); };',
      '  // Removing an ad node later still lets its request go out, so refuse the URL up front.',
      '  [HTMLScriptElement.prototype, HTMLIFrameElement.prototype].forEach(function (proto) {',
      '    try {',
      '      var desc = Object.getOwnPropertyDescriptor(proto, "src");',
      '      if (!desc || !desc.set) return;',
      '      Object.defineProperty(proto, "src", {',
      '        configurable: true,',
      '        get: function () { return desc.get.call(this); },',
      '        set: function (value) { if (bad(value)) { this.setAttribute("data-ad-blocked", "1"); return; } desc.set.call(this, value); }',
      '      });',
      '    } catch (e) {}',
      '  });',
      '  // setAttribute("src", ...) skips the property above.',
      '  try {',
      '    var setAttr = Element.prototype.setAttribute;',
      '    Element.prototype.setAttribute = function (name, value) {',
      '      if (String(name).toLowerCase() === "src" && bad(value)) return;',
      '      return setAttr.apply(this, arguments);',
      '    };',
      '  } catch (e) {}',
      '  try {',
      '    var write = document.write.bind(document);',
      '    document.write = function (html) { if (bad(html)) return; return write(html); };',
      '  } catch (e) {}',
      '  var run = function (fn) { try { if (typeof fn === "function") fn(); } catch (e) {} };',
      '  // Game-portal SDKs: without them the game waits forever, with them it shows ads.',
      '  try {',
      '    if (!window.PokiSDK) window.PokiSDK = {',
      '      init: function () { return Promise.resolve(); },',
      '      gameLoadingFinished: function () {}, gameplayStart: function () {}, gameplayStop: function () {},',
      '      commercialBreak: function () { return Promise.resolve(true); },',
      '      rewardedBreak: function () { return Promise.resolve(true); },',
      '      displayAd: function () { return Promise.resolve(); }, destroyAd: function () {},',
      '      getLanguage: function () { return Promise.resolve("en"); },',
      '      setDebug: function () {}, captureError: function () {}',
      '    };',
      '    if (!window.gdsdk) window.gdsdk = {',
      '      showAd: function () { return Promise.resolve(); },',
      '      preloadAd: function () { return Promise.resolve(); },',
      '      canShowAd: function () { return Promise.resolve(false); },',
      '      openConsole: function () {}',
      '    };',
      '    if (!window.CrazyGames) window.CrazyGames = { SDK: {',
      '      environment: "disabled",',
      '      init: function () { return Promise.resolve(); },',
      '      game: { gameplayStart: function () {}, gameplayStop: function () {}, happytime: function () {},',
      '        inviteLink: function () { return Promise.resolve(""); }, showInviteButton: function () {}, hideInviteButton: function () {} },',
      '      ad: { requestAd: function (t, cb) { if (cb && cb.adFinished) cb.adFinished(); }, hasAdblock: function () { return Promise.resolve(false); } },',
      '      data: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },',
      '      user: { getUser: function () { return Promise.resolve(null); }, isUserAccountAvailable: false, showAuthPrompt: function () { return Promise.resolve(null); } }',
      '    } };',
      '  } catch (e) {}',
      '  try {',
      '    if (!window.aiptag) {',
      '      window.aiptag = {',
      '        cmd: { push: run, display: [], player: [] },',
      '        consents: { all: false },',
      '        adplayer: { addEventListener: function () {}, play: function () {}, pause: function () {} },',
      '        ad: { onEvent: function () {}, addEventListener: function () {}, play: function () {} }',
      '      };',
      '    } else if (window.aiptag.cmd && typeof window.aiptag.cmd.push !== "function") {',
      '      window.aiptag.cmd.push = run;',
      '    }',
      '  } catch (e) {}',
      '  var css = [".adngin", "[id^=\\"adngin\\"]", "[id*=\\"adinplay\\"]", ".ad-slot", ".ad-slot-container",',
      '    "[class*=\\"adunit\\"]", "[id*=\\"adunit\\"]", ".adsbygoogle"].join(",") +',
      '    "{display:none!important;height:0!important;width:0!important;visibility:hidden!important}";',
      '  var s = document.createElement("style");',
      '  s.textContent = css;',
      '  (document.head || document.documentElement).appendChild(s);',
      '})();',
      '',
    ].join('\n');
  }
  fs.writeFileSync(blockerPath, js);
  console.log('adblock.js updated');
}

// The root worker reaches documents rebuilt by games, which an in-page blocker misses.
const workerSrc = path.join(__dirname, 'ad-sw.js');
const workerDest = path.join(ROOT, 'ad-sw.js');
if (fs.existsSync(workerSrc) && !fs.existsSync(workerDest)) {
  fs.copyFileSync(workerSrc, workerDest);
  console.log('ad-sw.js added');
}
if (fs.existsSync(workerDest) && fs.existsSync(blockerPath)) {
  let js = fs.readFileSync(blockerPath, 'utf8');
  if (!js.includes('ad-sw.js')) {
    js += [
      '/* Register the site-wide worker so ad requests are blocked in every nested document too. */',
      '(function () {',
      '  try {',
      '    if ("serviceWorker" in navigator) {',
      '      navigator.serviceWorker.register("/ad-sw.js", { scope: "/" }).catch(function () {});',
      '    }',
      '  } catch (e) {}',
      '})();',
      '',
    ].join('\n');
    fs.writeFileSync(blockerPath, js);
    console.log('service worker registration added');
  }
}

console.log('pages:', pages, 'blocker injected:', injected, 'ad script tags removed:', stripped);

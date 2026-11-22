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

/*
 * Local, ad-free stand-in for Playgama's bridge SDK.
 *
 * The Unity build calls the bridge for storage, platform info and ad breaks.
 * This file answers those calls without loading any ad code or contacting a
 * network service. Interstitial and rewarded breaks are shown as the site's
 * placeholder ad card, then reported back to the game as completed.
 */
(function () {
  'use strict';

  var listeners = {};
  var memory = {};

  function on(name, handler) {
    (listeners[name] = listeners[name] || []).push(handler);
  }

  function emit(name, value) {
    (listeners[name] || []).forEach(function (fn) { try { fn(value); } catch (e) {} });
  }

  function toUnity(message, value) {
    if (typeof window.sendMessageToUnity === 'function') {
      window.sendMessageToUnity(message, String(value));
    }
  }

  function readStore(key) {
    try { return localStorage.getItem(key); } catch (e) { return memory[key] == null ? null : memory[key]; }
  }

  function writeStore(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { memory[key] = value; }
  }

  function adBreak(kind, done) {
    emit(kind + '_state_changed', 'opened');
    toUnity(kind === 'rewarded' ? 'OnRewardedStateChanged' : 'OnInterstitialStateChanged', 'opened');
    var finish = function () {
      emit(kind + '_state_changed', 'closed');
      toUnity(kind === 'rewarded' ? 'OnRewardedStateChanged' : 'OnInterstitialStateChanged', 'closed');
      if (advertisement[kind === 'rewarded' ? 'rewardedState' : 'interstitialState'] !== undefined) {
        advertisement[kind === 'rewarded' ? 'rewardedState' : 'interstitialState'] = 'closed';
      }
      if (typeof done === 'function') done();
      if (kind === 'rewarded' && typeof window.sendMessageToUnity === 'function') {
        window.sendMessageToUnity('OnRewardedCompleted', 'true');
      }
    };
    if (typeof window.nxShowPlaceholderAd === 'function') window.nxShowPlaceholderAd(5, finish);
    else setTimeout(finish, 100);
  }

  var advertisement = {
    interstitialState: 'closed',
    rewardedState: 'closed',
    isBannerSupported: true,
    isInterstitialSupported: true,
    isRewardedSupported: true,
    minimumDelayBetweenInterstitial: 0,
    rewardedPlacement: '',
    on: on,
    setMinimumDelayBetweenInterstitial: function () {},
    showBanner: function () { return Promise.resolve(); },
    hideBanner: function () { return Promise.resolve(); },
    checkAdBlock: function () { return Promise.resolve(false); },
    showInterstitial: function (placement) {
      return new Promise(function (resolve) { adBreak('interstitial', resolve); });
    },
    showRewarded: function (placement) {
      return new Promise(function (resolve) { adBreak('rewarded', resolve); });
    }
  };

  var bridge = {
    engine: 'unity',
    initialize: function () { return Promise.resolve(); },
    game: {
      on: on,
      visibilityState: 'visible',
      setLoadingProgress: function () {}
    },
    advertisement: advertisement,
    platform: {
      id: 'msn',
      language: 'en',
      payload: '',
      tld: 'com',
      isAudioEnabled: true,
      isGetAllGamesSupported: false,
      isGetGameByIdSupported: false,
      on: on,
      sendMessage: function () {},
      getServerTime: function () { return Promise.resolve(Date.now()); },
      getAllGames: function () { return Promise.reject(new Error('not supported')); },
      getGameById: function () { return Promise.reject(new Error('not supported')); }
    },
    player: {
      id: '',
      name: '',
      photos: [],
      extra: '',
      isAuthorizationSupported: false,
      isAuthorized: false,
      authorize: function () { return Promise.reject(new Error('not supported')); }
    },
    storage: {
      isSupported: true,
      isAvailable: true,
      defaultType: 'localStorage',
      get: function (keys) {
        var list = Array.isArray(keys) ? keys : [keys];
        var out = {};
        list.forEach(function (k) { var v = readStore(k); if (v !== null) out[k] = v; });
        return Promise.resolve(out);
      },
      set: function (data) {
        Object.keys(data || {}).forEach(function (k) { writeStore(k, data[k]); });
        return Promise.resolve();
      },
      delete: function (keys) {
        var list = Array.isArray(keys) ? keys : [keys];
        list.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
        return Promise.resolve();
      }
    },
    device: { type: 'desktop', safeArea: { top: 0, left: 0, right: 0, bottom: 0 } },
    achievements: {
      isSupported: false,
      isNativePopupSupported: false,
      isGetListSupported: false,
      unlock: function () { return Promise.reject(new Error('not supported')); },
      showNativePopup: function () { return Promise.reject(new Error('not supported')); },
      getList: function () { return Promise.reject(new Error('not supported')); }
    },
    leaderboards: {
      type: '',
      setScore: function () { return Promise.reject(new Error('not supported')); },
      getEntries: function () { return Promise.reject(new Error('not supported')); },
      showNativePopup: function () { return Promise.reject(new Error('not supported')); }
    },
    payments: {
      isSupported: false,
      purchase: function () { return Promise.reject(new Error('not supported')); },
      consumePurchase: function () { return Promise.reject(new Error('not supported')); },
      getCatalog: function () { return Promise.reject(new Error('not supported')); },
      getPurchases: function () { return Promise.reject(new Error('not supported')); }
    },
    remoteConfig: {
      isSupported: false,
      get: function () { return Promise.reject(new Error('not supported')); }
    },
    social: {
      isShareSupported: false,
      isInviteFriendsSupported: false,
      isJoinCommunitySupported: false,
      isRateSupported: false,
      isExternalLinksAllowed: false,
      isCreatePostSupported: false,
      isAddToHomeScreenSupported: false,
      isAddToFavoritesSupported: false,
      isAddToHomeScreenRewardSupported: false,
      isAddToFavoritesRewardSupported: false,
      share: function () { return Promise.reject(new Error('not supported')); },
      inviteFriends: function () { return Promise.reject(new Error('not supported')); },
      joinCommunity: function () { return Promise.reject(new Error('not supported')); },
      rate: function () { return Promise.reject(new Error('not supported')); },
      createPost: function () { return Promise.reject(new Error('not supported')); },
      addToHomeScreen: function () { return Promise.reject(new Error('not supported')); },
      addToFavorites: function () { return Promise.reject(new Error('not supported')); },
      getAddToHomeScreenReward: function () { return Promise.reject(new Error('not supported')); },
      getAddToFavoritesReward: function () { return Promise.reject(new Error('not supported')); }
    }
  };

  window.bridge = bridge;
})();

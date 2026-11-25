/* Local no-op Poki SDK for the self-hosted Stickman Battle build. */
(function () {
  var done = function () { return Promise.resolve(); };
  var rewarded = function () { return Promise.resolve(true); };
  window.PokiSDK = {
    init: done,
    gameLoadingFinished: function () {},
    gameLoadingProgress: function () {},
    gameplayStart: function () {},
    gameplayStop: function () {},
    commercialBreak: done,
    rewardedBreak: rewarded,
    customEvent: function () {},
    setDebug: function () {},
    isAdBlocked: function () { return false; }
  };
})();

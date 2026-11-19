// Extracted from index.html (4.46 JS bridges block). Loaded in-place, synchronously.
    // 4.46 web-ad bridge. The WebGL ad backend is driven by C# AdsManager — a MonoBehaviour component on
    // the persistent 'PersistantObjects' GameObject (same host as FirebaseManager, which the auth bridge
    // already SendMessages). Its callback entry points (winver AdsManager:55278-55300) are:
    //   OnWebInterstitialStarted(), OnWebInterstitialEnded("true"/"false"),
    //   OnWebRVReady(), OnWebRVStarted(), OnWebRVEnded()
    // The OLD 4.17/4.23 names (OnVideoAdClosed/OnInterstitialClosed/OnAdNotAvailable) DO NOT EXIST in 4.46,
    // so the ad-state machine never resolved → after the 1st match the post-match interstitial never "ended"
    // and the 2nd Play hung. CRITICAL: 4.46 has NO OnWebRV*Failed / *NotAvailable callback, so "no ad" can't
    // be signalled — every ad MUST resolve to Ready/Started/Ended or the game waits forever. We have no real
    // inventory, so ads "play" instantly: interstitials complete; rewarded videos are always ready & complete
    // (granting the reward). Started→Ended are split across ticks so the state machine sees both transitions.
    var ADDIAG = (localStorage.getItem('AD_DIAG') === '1'); // ad-mock diagnostics off by default; AD_DIAG=1 to enable
    // ★[CAPTURE] route ad-bridge events to the local capture-server (only when ?capture=1) so the assistant can
    // read the FULL ad flow alongside the Photon frames in capture.jsonl — diagnoses the custom-from-party stall.
    function _capLog(tag, arg) { try { if (localStorage.getItem('1v1_capture') === '1') fetch('http://localhost:19099/cap', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ src: 'ad', tag: tag, arg: (arg === undefined ? null : String(arg)), t: (window.performance ? Math.round(performance.now()) : 0) }), keepalive: true }).catch(function () {}); } catch (e) {} }
    function _adSend(method, arg) {
      _capLog('cb:' + method, arg);
      if (!window.unityInstance) { if (ADDIAG) console.log('%c[ad-mock] (no unityInstance yet) ' + method, 'color:#fa0'); return; }
      ['PersistantObjects', 'AdsManager'].forEach(function(go) {
        try {
          if (arg === undefined) window.unityInstance.SendMessage(go, method);
          else window.unityInstance.SendMessage(go, method, arg);
          if (ADDIAG) console.log('%c[ad-mock] SendMessage(' + go + ', ' + method + (arg!==undefined?(', '+arg):'') + ')', 'color:#0c8');
        } catch (e) { if (ADDIAG) console.warn('[ad-mock] SendMessage threw', go, method, e); }
      });
    }
    // ★[2026-11-12] Real ads come from js/ads.js (AdinPlay, window.aipAds) on 1v1lolreloaded.com: banner column on
    // showAds/hideAds and rewarded video in showWebRVAd below. On other hosts aipAds stays passive and these stay stubs.
    window.initBanners     = function() { if (ADDIAG) console.log('%c[ad-mock] initBanners', 'color:#fa0'); };
    window.showAds         = function() { if (ADDIAG) console.log('%c[ad-mock] showAds', 'color:#fa0'); if (window.aipAds) window.aipAds.showBanners(); };
    window.hideAds         = function() { if (ADDIAG) console.log('%c[ad-mock] hideAds', 'color:#fa0'); if (window.aipAds) window.aipAds.hideBanners(); };
    // ★2026-06-12 RV-READY FIX (guest Daily Skins "No available Ads"): the WebGL ad backend has NO
    // isWebRVAdReady JSLib export (framework imports only init/show/requestNew) — it tracks "ad loaded"
    // via an INTERNAL flag set by OnWebRVReady. LimitedLocker.WatchRv calls ShowRewardedVideo →
    // _ShowWebRVAd → showWebRVAd() DIRECTLY (no prepare), so without a prior OnWebRVReady the backend
    // toasts "No available Ads". Keep RV perpetually loaded: fire OnWebRVReady on init AND after every
    // ad ends (reload for the next show). This also makes IsRewardedVideoReady() (→ backend flag) true.
    window.initWebRVAd     = function() { if (ADDIAG) console.log('%c[ad-mock] initWebRVAd → OnWebRVReady', 'color:#fa0'); setTimeout(function(){ _adSend('OnWebRVReady'); }, 30); };
    window.isWebRVAdReady  = function() { _capLog('call:isWebRVAdReady'); if (ADDIAG) console.log('%c[ad-mock] isWebRVAdReady → true', 'color:#fa0'); return true; };
    window.prepareWebRVAd  = function() { if (ADDIAG) console.log('%c[ad-mock] prepareWebRVAd', 'color:#fa0'); setTimeout(function(){ _adSend('OnWebRVReady'); }, 30); };
    window.requestNewAd    = function() {
      _capLog('call:requestNewAd');
      // OnPlayPressed → AdsManager.TryShowingVideoAd(JoinMode) STORES the JoinMode (matchmaking) completion
      // delegate at the WebGL ad-backend's field offset 16 (func 118478) and then calls requestNewAd(). That
      // delegate is released by EXACTLY ONE event: AdsManager.OnWebInterstitialEnded (func 54637 reads offset
      // 16 and call_indirect's it — the string arg only gates Interstitial analytics, not the invoke).
      // OnWebRVEnded instead fires a DIFFERENT delegate at offset 32 (the WatchRVAd reward Action), NOT
      // JoinMode — so RV-ended alone leaves the 1st Play stalled. (Proven by WASM disassembly of the 4.46
      // WebGL build.) The RV trio below is COSMETIC: it keeps the ad_shown RV/DefaultRewardedVideo analytics
      // identical to a real session; offset-32 is null in the pre-match flow so it grants nothing. The final
      // OnWebInterstitialEnded is the LOAD-BEARING line that releases JoinMode → match search on click 1.
      if (ADDIAG) console.log('%c[ad-mock] requestNewAd → RV(cosmetic)→InterstitialEnded (release JoinMode/matchmaking)', 'color:#fa0');
      setTimeout(function(){ _adSend('OnWebRVReady'); }, 20);
      setTimeout(function(){ _adSend('OnWebRVStarted'); }, 50);
      setTimeout(function(){ _adSend('OnWebRVEnded'); }, 90);
      setTimeout(function(){ _adSend('OnWebInterstitialEnded', 'false'); }, 110); // LOAD-BEARING: offset-16 → JoinMode → matchmaking
    };
    window.showWebRVAd     = function() {
      // Every rewarded button of the client lands here (C# ShowRewardedVideo → _ShowWebRVAd; placements
      // LimitedLocker, DailySpin, DoubleXP, MysterySkin, ZombiesRespawn, ...). RVStarted → RVEnded (the GRANT: the
      // C# continuation waits for IsRewardedVideoPlaying()=false, e.g. ClaimSpinsAsGuest / ConsumeRv) → RVReady
      // reloads the next ad so a second claim gets no "No available Ads" toast.
      // ★[2026-11-12] With js/ads.js live, a real AdinPlay rewarded ad plays between Started and Ended. Ended still
      // fires on EVERY outcome (watched, closed, no fill, ad blocker, timeout): 4.46 has no ad-failure callback, so
      // anything else would hang the button (owner-approved soft gate, 2026-06-21). Ended never comes sooner than
      // 90 ms after the call, so Unity still sees Started and Ended on separate ticks.
      var t0 = Date.now();
      var end = _adOnce(function() {
        _adSend('OnWebRVEnded');
        setTimeout(function(){ _adSend('OnWebRVReady'); }, 50);   // reload for the next claim
      });
      setTimeout(function(){ _adSend('OnWebRVStarted'); }, 30);
      if (window.aipAds && window.aipAds.rewardedAvailable()) {
        if (ADDIAG) console.log('%c[ad-mock] showWebRVAd → AdinPlay rewarded', 'color:#fa0');
        window.aipAds.showRewarded(function() { setTimeout(end, Math.max(0, 90 - (Date.now() - t0))); });
        return;
      }
      if (ADDIAG) console.log('%c[ad-mock] showWebRVAd → RVStarted/RVEnded/RVReady', 'color:#fa0');
      setTimeout(end, 90);
    };
    function _adOnce(fn) { var done = false; return function() { if (done) return; done = true; fn(); }; }
    window.showInter       = function() {
      if (ADDIAG) console.log('%c[ad-mock] showInter → InterstitialStarted/Ended', 'color:#fa0');
      setTimeout(function(){ _adSend('OnWebInterstitialStarted'); }, 30);
      setTimeout(function(){ _adSend('OnWebInterstitialEnded', 'true'); }, 90);
    };

    // 4.46 auth bridge: C# FirebaseManager.OnGotWebResponse(string json) sets handler
    // .IsReady=true → WaitUntil predicate unblocks → C# auth chain resumes.
    // AuthResponse struct: { Result: int (0=Success, 1=Canceled), Response: string }
    // 2026-05-26: confirmed via SendMessage trace that only 'PersistantObjects' exists
    // as GameObject in 4.46 boot scene. FirebaseManager/FirebaseAuth/AuthManager GOs
    // do NOT exist — Unity logged "object not found" for each. Dropped to single target.
    // 2026-06-02 ROOT-CAUSE FIX (canonical guest state, fixes Daily Skins widget).
    // C# FirebaseManager.CBCDLKCDECF (IsLoggedIn) == (authToken != null/empty && authToken != "Not connected")
    //   (AFMMHDNFDIM.JEFAKPDACOH, winver:111055). The auth token == AuthResponse.Response, which the C#
    //   sets as the API client (PPLIPMHKDAL = new AFMMHDNFDIM(authResponse.Response), winver:20777).
    // The Daily Skins widget (LimitedLocker.LimitedLockerController) is GUEST-ONLY: its visibility gate
    //   HEOFAJDEGNA (winver:91264) returns false unless !CBCDLKCDECF. Coins/analytics-user-state also key
    //   off CBCDLKCDECF. Canonically a GUEST's PSF auth Response is the literal "Not connected" → JEFAKPDACOH
    //   = false → CBCDLKCDECF = false → widget shows + analytics report "Unregistered".
    // We were sending the guest uid as Response → CBCDLKCDECF = true → widget hidden, "Registered" analytics.
    // Guest detection mirrors server-mock _guestSparse (firebaseIdToken presence): guest → "Not connected",
    //   Google session → real uid (CBCDLKCDECF=true → logged-in view: coins, no Daily Skins).
    function _authResponseFor(uid) {
      try {
        var hasGoogle = !!(window.localStorage && localStorage.getItem('firebaseIdToken'));
        // Google → the real Firebase ID TOKEN (a JWT), NOT the bare uid. The logged-in path
        // (CBCDLKCDECF=true) parses AuthResponse.Response as a JWT (Split('.')[1] for the payload);
        // a bare uid has no dots → ArgumentOutOfRangeException → Loading hangs. The JWT is also
        // != "Not connected"/empty so CBCDLKCDECF stays true. (Guests send "Not connected" →
        // CBCDLKCDECF=false → JWT path skipped → no crash, which is why only Google crashed.)
        if (hasGoogle) return String(localStorage.getItem('firebaseIdToken') || uid || '');
        // ★[2026-06-29 wf5jqv7y0] CANON guest = AUTHENTICATED anonymous → CBCDLKCDECF=true → REAL nicks. Native Steam
        // guests already get a real session token (CBCDLKCDECF=true); "Not connected" was a WebGL-only approximation
        // that forced CBCDLKCDECF=false PURELY to render the WebGL Daily-Skins widget — at the cost of FAKED peer nicks
        // (the viewer launders every nick when Names is unavailable). Match the canon: return a JWT-SHAPED anonymous
        // token (NOT a bare uid — the logged-in path does Response.Split('.')[1]; a dotless value hangs Loading).
        // AFMMHDNFDIM only STORES the token (win:111067, no signature check) and the server-mock serves guest data, so
        // it need not be server-resolvable. Consequence (intended, matches native): the WebGL-only Daily-Skins widget
        // no longer shows for guests; analytics report "Anonymous". Escape hatch: localStorage.LEGACY_GUEST_NOTCONN='1'.
        if (window.localStorage && localStorage.getItem('LEGACY_GUEST_NOTCONN') === '1') return 'Not connected';
        return _mintGuestJwt(String(uid || 'guest'));
      } catch (e) { return _mintGuestJwt('guest'); }
    }
    // JWT-shaped anonymous guest token: header.payload.signature (base64url). No real signature needed — the client's
    // AFMMHDNFDIM just stores+compares it (CBCDLKCDECF = token != "Not connected"); the 3 dot-parts exist only so the
    // logged-in path's Response.Split('.')[1] payload-decode can't throw (the crash that hung Loading on a bare uid).
    function _mintGuestJwt(uid) {
      function b64url(s) { try { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); } catch (e) { return 'e30'; } }
      var hdr = b64url('{"alg":"none","typ":"JWT"}');
      var pl = b64url(JSON.stringify({ sub: uid, user_id: uid, iss: 'guest-anon', aud: '1v1', provider_id: 'anonymous', firebase: { sign_in_provider: 'anonymous' }, auth_time: 0, iat: 0, exp: 9999999999 }));
      return hdr + '.' + pl + '.guestmock';
    }
    function sendAuthResponse(uid, result, responseOverride) {
      if (!window.unityInstance) return;
      var responseStr = (responseOverride !== undefined && responseOverride !== null)
        ? String(responseOverride) : String(uid || '');
      var resp = JSON.stringify({ Result: result | 0, Response: responseStr });
      try {
        window.unityInstance.SendMessage('PersistantObjects', 'OnGotWebResponse', resp);
      } catch (e) {}
      console.log('%c[v446/auth] OnGotWebResponse → ' + resp, 'color: #0f0; font-weight: bold');
    }

    // ★[2026-08-13] SINGLE RESOLVER FOR THE ANONYMOUS IDENTITY, shared by every bridge entry point.
    // ★Why single: on boot the 4.46 client calls _CheckIfConnected, NOT signInAnonymously (measured on WebGL:
    // the log shows OnGotWebResponse but no signInAnonymously line). There are four entry points and each of
    // them used to mint its own id, which is how one player ended up with two identities.
    var _anonPending = null;   // одна попытка на загрузку страницы — параллельные вызовы ждут её же
    // ★★[2026-08-13] LEGACY GUEST MIGRATION: install:<device_id> -> a real Firebase anonymous account.
    // WHY: install_id works as a PASSWORD today - the gate at serve.js:1591 explicitly exempts the install:
    // prefix from proving identity. And the key has LEAKED: friendships stores a guest by its aid and the
    // server hands it out as UserId in friend lists (measured 2026-08-13: 475 distinct keys, 285 of them with
    // real progress). A Firebase uid is just as public, BUT useless without a Google-signed token - so the
    // move takes a guest from key-as-password to key-plus-proof.
    // ★INVARIANT: on ANY refusal or error the guest silently stays on the old scheme and loses nothing.
    //  The server itself refuses leaked keys (reason leaked); that population is handled separately.
    function _tryMigrateLegacyGuest(installId, legacyUid, cb) {
      function _stay(why) {
        try { localStorage.setItem("firebaseUid", legacyUid); localStorage.setItem("1v1_auth_provider", "anonymous"); } catch (e) {}
        console.log("%c[v446/auth] migration skipped (" + why + ") -> keeping the previous identity " + legacyUid, "color:#fa0");
        cb({ uid: legacyUid, token: "", provider: "anonymous" });
      }
      try {
        if (!(window.firebase && firebase.auth)) return _stay("SDK not loaded");
        var cur = firebase.auth().currentUser;
        // вошедшего через Google не трогаем: signInAnonymously() выкинул бы его из аккаунта
        if (cur && !cur.isAnonymous) return _stay("player signed in with Google");
        var p = (cur && cur.isAnonymous) ? Promise.resolve(cur)
              : firebase.auth().signInAnonymously().then(function (c) { return (c && c.user) || firebase.auth().currentUser; });
        p.then(function (u) {
          if (!u || !u.uid) return _stay("no anonymous account");
          return u.getIdToken().then(function (tok) {
            return fetch("/api/v446/migrate_guest", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ install_id: installId, id_token: tok })
            }).then(function (r) { return r.json(); }).then(function (j) {
              if (!j || !j.ok) return _stay((j && j.reason) || "server refused");
              try {
                localStorage.setItem("1v1_migrated", "1");
                localStorage.setItem("firebaseUid", u.uid);
                localStorage.setItem("firebaseIdToken", tok);
                localStorage.setItem("1v1_auth_provider", "anonymous");
              } catch (e) {}
              console.log("%c[v446/auth] ★MIGRATED: install:" + String(installId).slice(0, 8) + "… → " + u.uid +
                          " (строка " + j.playerId + ") — доступ теперь требует подписанного токена, а не знания ключа",
                          "color:#0f0;font-weight:bold");
              cb({ uid: u.uid, token: tok, provider: "anonymous" });
            });
          });
        }).catch(function (e) { _stay("error: " + ((e && e.code) || (e && e.message) || e)); });
      } catch (e) { _stay("exception: " + (e && e.message)); }
    }
    function _ensureAnonIdentity(cb) {
      function _legacy(why) {
        var uid = "";
        try { uid = localStorage.getItem("firebaseUid") || ""; } catch (e) {}
        if (!uid) uid = "guest-" + Math.random().toString(36).slice(2, 10);
        try { localStorage.setItem("firebaseUid", uid); localStorage.setItem("1v1_auth_provider", "anonymous"); } catch (e) {}
        if (why) console.log("%c[v446/auth] анонимный вход ОТКАТИЛСЯ на локальную личность (" + why + "): " + uid, "color:#fa0;font-weight:bold");
        return { uid: uid, token: "", provider: "anonymous" };
      }
      // ★★[2026-08-13] EXISTING-PLAYER GUARD - do not touch someone who already has an account.
      // A legacy guest keeps its progress under the install key, so handing it a brand-new canonical identity
      // would orphan that row. Such a player is served by the migration path below instead.
      try {
        var _own = localStorage.getItem("1v1_install_id") || "";
        if (_own) {
          var _legacyUid = localStorage.getItem("firebaseUid") || ("guest-" + Math.random().toString(36).slice(2, 10));
          try { localStorage.setItem("firebaseUid", _legacyUid); localStorage.setItem("1v1_auth_provider", "anonymous"); } catch (e) {}
          console.log("%c[v446/auth] existing player (install_id present) -> keeping its identity " + _legacyUid,
                      "color:#0af;font-weight:bold");
        // ★★[2026-08-13] TRY THE MIGRATION FIRST, legacy only as a fallback.
        // install_id currently works as a PASSWORD (the serve.js gate exempts the install: prefix from checks) and
        // it leaked into friend lists. Here we create a real anonymous account and ask the server to bind it to our
        // row. The server refuses leaked keys on its own (reason leaked) - those are handled separately.
        // ★Any refusal or error = silently stay on the old scheme: the guest loses NOTHING under any outcome.
        if (localStorage.getItem("1v1_migrated") !== "1") { _tryMigrateLegacyGuest(_own, _legacyUid, cb); return; }
        // уже мигрирован → дальше идём КАНОНИЧЕСКИМ путём (Firebase восстановит анонимную сессию)
        // (легаси-возврат убран: немигрированного обслуживает _tryMigrateLegacyGuest, мигрированный идёт каноном)
        }
      } catch (e) {}
      if (_anonPending) { _anonPending.then(cb); return; }
      _anonPending = new Promise(function (resolve) {
        try {
          if (!(window.firebase && firebase.auth)) return resolve(_legacy("SDK не загружен"));
          var cur = firebase.auth().currentUser;
          // ★★[2026-08-13] GOOGLE-PLAYER GUARD. signInAnonymously() REPLACES the current session in the Firebase
          // SDK: calling it for someone signed in with Google would throw them out of their account and start an
          // anonymous one. The install_id guard does not help here - a pure Google player who never was a guest has
          // no install_id at all.
          if (cur && !cur.isAnonymous) {
            return cur.getIdToken().then(function (tok) {
              try { localStorage.setItem("1v1_auth_provider", "google.com"); } catch (e) {}
              console.log("%c[v446/auth] вошедший через Google — анонимный вход НЕ трогаем: " + cur.uid, "color:#0af;font-weight:bold");
              resolve({ uid: cur.uid, token: tok, provider: "google.com" });
            }).catch(function () { resolve({ uid: cur.uid, token: "", provider: "google.com" }); });
          }
          var p = (cur && cur.isAnonymous) ? Promise.resolve(cur) :
                  firebase.auth().signInAnonymously().then(function (c) { return (c && c.user) || firebase.auth().currentUser; });
          p.then(function (u) {
            if (!u) return resolve(_legacy("нет user"));
            return u.getIdToken().then(function (tok) {
              try {
                localStorage.setItem("firebaseUid", u.uid);
                localStorage.setItem("firebaseIdToken", tok);
                localStorage.setItem("1v1_auth_provider", "anonymous");
              } catch (e) {}
              console.log("%c[v446/auth] анонимный вход: uid=" + u.uid + " token=real RS256", "color:#0f0;font-weight:bold;font-size:13px");
              resolve({ uid: u.uid, token: tok, provider: "anonymous" });
            });
          }).catch(function (e) { resolve(_legacy((e && e.code) || (e && e.message) || "ошибка")); });
        } catch (e) { resolve(_legacy("исключение: " + (e && e.message))); }
      });
      _anonPending.then(cb);
    }
    // ★[2026-08-13] REAL Firebase anonymous auth instead of a forgery.
    // BEFORE: guest- + Math.random().toString(36).slice(2,10) - our invented id (41 bits) and a token with
    // alg:none, i.e. a CLAIM rather than a proof. Everything followed from that: the server could not verify
    // the identity, the account key became install_id (a device id, not an identity), a guest got a stub with
    // an empty ServerUser.ID on the first visit, and Photon had to judge trust BY THE SHAPE of a string.
    // AFTER: firebase.auth().signInAnonymously() on the same project (test1v1lol-reloaded) as Google sign-in.
    // Verified against identitytoolkit live: anonymous auth is ENABLED and returns a 28-char base62 uid plus
    // an RS256-signed idToken carrying firebase.sign_in_provider=anonymous.
    // => serve.js verifies it through RS256+JWKS exactly as it does for native clients (uidVerified=true,
    //    uidProvider=anonymous), the canonical fbanon: bind fires, and a web guest gets the SAME kind of row
    //    as the 201 native ones.
    // ★Firebase persists the anonymous session itself (IndexedDB) and restores it on load, so from the second
    //  visit the identity is known instantly, without a network round trip.
    window.signInAnonymously = function() {
      _ensureAnonIdentity(function (ident) {
        sendAuthResponse(ident.uid, 0, ident.token || _authResponseFor(ident.uid));
      });
    };
    window.signInAnonymously_LEGACY = function() {
      var uid = (window.localStorage && localStorage.getItem('firebaseUid')) ||
                ('guest-' + Math.random().toString(36).slice(2, 10));
      if (window.localStorage) localStorage.setItem('firebaseUid', uid);
      console.log('[v446] _SignInAnonymously bridge fired, uid=' + uid);
      // Anonymous = guest → "Not connected" (when DAILY_SKINS opt-in) so CBCDLKCDECF=false.
      setTimeout(function() { sendAuthResponse(uid, 0, _authResponseFor(uid)); }, 50);
    };
    window.signInWithGoogle = function() {
      console.log('%c[v446] _SignInWithGoogle bridge fired', 'color:#0af;font-weight:bold');
      if (typeof firebaseLogin === 'function') {
        // Real Firebase Auth popup. login.js firebaseLogin('google', success, error).
        firebaseLogin('google', function(result) {
          console.log('%c[v446/auth] Google sign-in SUCCESS', 'color:#0f0;font-weight:bold', result);
          // Persist for refresh
          try {
            if (result.Uid) localStorage.setItem('firebaseUid', result.Uid);
            if (result.Token) localStorage.setItem('firebaseIdToken', result.Token);
            if (result.DisplayName) localStorage.setItem('1v1_nickname', result.DisplayName);
          } catch (_) {}
          // Send Result=0 (Success) with the Firebase ID TOKEN (JWT) as Response — NOT the bare uid.
          // The logged-in path parses Response as a JWT (Split('.')[1]); a dotless uid → ArgumentOutOfRange
          // → Loading hangs. result.Token (and the just-cached firebaseIdToken) is the real JWT.
          var _jwt = result.Token || result.token || (window.localStorage && localStorage.getItem('firebaseIdToken')) || result.Uid || '';
          sendAuthResponse(result.Uid || '', 0, _jwt);
        }, function(err) {
          console.log('%c[v446/auth] Google sign-in FAILED', 'color:#f00', err);
          // Result=1 (Cancelled/Error). C# clears spinner and stays on guest.
          sendAuthResponse('', 1);
        });
      } else {
        console.warn('[v446] firebaseLogin not defined - falling back to anonymous');
        window.signInAnonymously();
      }
    };
    window.signInSilently = function() {};
    window.signOut = function() {
      console.log('[v446] _SignOut bridge fired');
      setTimeout(function() { sendAuthResponse('', 0); }, 50);
    };
    // CheckIfConnected: 2026-05-28 #8 — was Result=1 (Cancelled). That made C# CheckIfConnected
    // return false → AppInitializer NDNPFPAFAFL=false → PhotonConnector offline-fallback
    // (AIKKNIDOABM/HandleNoNetwork, winver:42467) sets OfflineMode=true. But we're connected to
    // the Photon emulator → "Can't start OFFLINE mode while connected!" → mixed online/offline
    // state that stalls loading completion (LSM never gets localization-done). The old Result=1
    // note about Google breaking the chain applied to a cached GOOGLE credential (no server record);
    // a GUEST uid has a valid player/login stub (server-mock _buildServerUserStub). So a returning
    // guest IS connected → return Result=0 (Success) with the persisted guest uid. C# MKOFLHJKEML
    // → GetUserData → player/login → succeeds → clean ONLINE boot, no offline-fallback. The cascade
    // then fires via the success path (HDCJGIENLPB(true)) — store_products/default_products fixes cover it.
    // ★[2026-08-13] THE MAIN ENTRY POINT: this is what the 4.46 client actually calls on boot (_CheckIfConnected).
    // It used to mint an invented identity of its own; now it takes one from the single resolver, i.e. a real one.
    window.checkIfConnected = function() {
      var d = (typeof window._AUTH_DELAY_MS === 'number') ? window._AUTH_DELAY_MS : 50;
      _ensureAnonIdentity(function (ident) {
        console.log('%c[v446] _CheckIfConnected → uid=' + ident.uid + ' токен=' + (ident.token ? 'настоящий' : 'локальный'), 'color:#0f0;font-weight:bold');
        setTimeout(function () { sendAuthResponse(ident.uid, 0, ident.token || _authResponseFor(ident.uid)); }, d);
      });
    };
    window.checkIfConnected_LEGACY = function() {
      var uid = (window.localStorage && localStorage.getItem('firebaseUid')) ||
                ('guest-' + Math.random().toString(36).slice(2, 10));
      if (window.localStorage) localStorage.setItem('firebaseUid', uid);
      var d = (typeof window._AUTH_DELAY_MS === 'number') ? window._AUTH_DELAY_MS : 50;
      console.log('%c[v446] _CheckIfConnected → OnGotWebResponse(Result=0, online guest) uid=' + uid + ' in ' + d + 'ms', 'color: #0f0; font-weight: bold');
      // Guest → Response "Not connected" (CBCDLKCDECF=false → Daily Skins visible); Google → real uid.
      setTimeout(function() { sendAuthResponse(uid, 0, _authResponseFor(uid)); }, d);
    };
    // _RefreshToken — also routes through OnGotWebResponse for auth state machine.
    window.returnIdToken = function() {
      var token = (window.localStorage && localStorage.getItem('firebaseIdToken')) ||
                  'mock-id-token-' + Date.now();
      var uid = (window.localStorage && localStorage.getItem('firebaseUid')) ||
                ('guest-' + Math.random().toString(36).slice(2, 10));
      console.log('[v446] _RefreshToken → ' + token.slice(0, 30));
      // Guest → "Not connected" (keep CBCDLKCDECF=false across token refresh); Google → real uid.
      setTimeout(function() { sendAuthResponse(uid, 0, _authResponseFor(uid)); }, 50);
      return token;
    };

    // Misc bridges referenced by framework.js externs.
    window.setCOPPAFlag = function() {};
    window.setUrlPostfix = function() {};
    window.checkLegitUrl = function() { return true; };
    // Auth externs reverted to simple localStorage reads (matched original `_BISECT=''`
     // working baseline). Reading Firebase.currentUser live could be slow/null after
    // cache clear, possibly breaking C# auth state machine.
    window.getDisplayName = function() {
      try { return (localStorage.getItem('1v1_nickname')) || 'Player'; } catch (_) { return 'Player'; }
    };
    window.getEmail = function() { return ''; };
    window.getUserId = function() {
      try { return (localStorage.getItem('firebaseUid')) || ''; } catch (_) { return ''; }
    };
    window.getImageUrl = function() { return ''; };
    window.getFamilyName = function() { return ''; };
    window.getGivenName = function() { return ''; };
    window.getImageUrl = function() { return ''; };
    window.getServerAuthCode = function() { return ''; };
    window.getBrowserLanguage = function() { return 'en-US'; };
    window.getBrowserName = function() { return 'Chrome'; };
    window.getBrowserVersionString = function() { return '120'; };
    window.getOS = function() { return 'Windows'; };
    window.getGPUInfo = function() { return ''; };
    window.getClientInfo = function() { return '{}'; };
    window.getDocumentURL = function() { return location.href; };
    window.getWebPageUrl = function() { return location.href; };
    window.getLanguage = function() { return 'en'; };

    // GDPR consent — pretend granted so UI doesn't block on Usercentrics popup.
    window.UC_UI = { isInitialized: function(){return true;}, showFirstLayer: function(){}, showSecondLayer: function(){}, getServicesBaseInfo: function(){return [];}, acceptAllConsents: function(){}, getConsentsStatus: function(){return {};} };
    window.usercentrics = { updateConsents: function(){}, getConsents: function(){return [];} };

    // cpmstar ad provider stub (called by framework's banner init).
    window.cpmstarAPI = function() {};

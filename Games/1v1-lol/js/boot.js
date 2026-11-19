// Extracted from index.html (4.46 Unity boot + config block). Loaded in-place, synchronously, after WebGL.loader.js.
    var canvas = document.getElementById('unity-canvas');
    var statusEl = document.getElementById('progress-status');
    var stageEl  = document.getElementById('progress-stage');
    var progress = document.getElementById('loading-bar-fill');
    var loadingOverlay = document.getElementById('unity-loading');

    // Smooth, stage-aware loading progress. Unity's createUnityInstance(p) reflects the real download
    // (framework + wasm + the big .data) up to ~0.9, then STALLS during wasm compile/instantiate (no
    // further callback) — which made the old bar sit dead at "090%". We animate the bar toward the real
    // p; during the instantiate stall we creep slowly toward 99% (so it always shows forward motion);
    // on ready we snap to 100% and fade. Stage text mirrors the actual phase.
    var _realP = 0, _shown = 0, _loadDone = false, _lastT = 0;
    function _renderProgress(t) {
      if (!_lastT) _lastT = t;
      var dt = Math.min(64, t - _lastT); _lastT = t;
      var target;
      if (_loadDone) {
        target = 100;
      } else if (_realP >= 0.895) {
        target = Math.min(99, Math.max(_shown, 90) + 0.0045 * dt);   // wasm instantiate: slow creep
      } else {
        target = _realP * 100;                                       // real download
      }
      _shown += (target - _shown) * Math.min(1, 0.006 * dt);
      if (_loadDone && _shown > 99.6) _shown = 100;
      var pct = Math.max(0, Math.min(100, _shown));
      if (progress) progress.style.width = pct.toFixed(1) + '%';
      if (statusEl) statusEl.textContent = String(Math.round(pct)).padStart(3, '0') + '%';
      if (stageEl) stageEl.textContent = _loadDone ? 'Ready' : (_realP < 0.85 ? 'Downloading game…' : 'Initializing…');
      if (!(_loadDone && pct >= 100)) requestAnimationFrame(_renderProgress);
    }
    requestAnimationFrame(_renderProgress);
    var errorBox = document.getElementById('unity-error');

    // Unity's IN-GAME fullscreen button calls window.updateFullscreen() via the _EnableFullscreen
    // jslib plugin (analytics logs button_name=full_screen on press). The 4.23 page (test-newver10:251)
    // defined this stub; the 4.46 page rewrite under the new loader dropped it →
    // "ReferenceError: updateFullscreen is not defined" and the button did nothing. Restore it,
    // targeting the 4.46 game wrapper (#unity-container) so the canvas fills the screen in fullscreen.
    // ★[2026-11-12] Now the WHOLE document goes fullscreen. Only the fullscreen element and its subtree are drawn, so
    // with #unity-container the ads (js/ads.js banner column, the tag's rewarded/loading layers, the consent link,
    // all appended to <body>) vanished in fullscreen. #unity-container is position:fixed inset:0, so the canvas
    // still fills the screen exactly as before.
    window.updateFullscreen = function() {
      try {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          (document.exitFullscreen || document.webkitExitFullscreen).call(document);
          return;
        }
        var el = document.documentElement;
        if (!el) return;
        var req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        if (req) req.call(el).catch(function(){});
      } catch (e) {}
    };

    // Fullscreen toggle icon (top-right of the game frame) — ported from the 4.23 / 1v1lolreloaded.com page.
    // Shown during loading too. Lets players re-enter fullscreen after ESC without hunting for the in-game button.
    (function () {
      var _isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (_isIOS) return;
      var container = document.getElementById('unity-container');
      if (!container || container.querySelector('.fs-toggle')) return;
      var btn = document.createElement('button');
      btn.className = 'fs-toggle';
      btn.setAttribute('aria-label', 'Toggle fullscreen');
      btn.title = 'Toggle fullscreen';
      btn.style.cssText = 'position:absolute;top:10px;right:10px;width:36px;height:36px;padding:0;z-index:99999;background:rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.15);border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0.55;transition:opacity 0.2s,transform 0.2s;';
      btn.onmouseenter = function () { btn.style.opacity = '1'; btn.style.transform = 'scale(1.05)'; };
      btn.onmouseleave = function () { btn.style.opacity = '0.55'; btn.style.transform = 'scale(1)'; };
      var iconEnter = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9V5a2 2 0 0 1 2-2h4M21 9V5a2 2 0 0 0-2-2h-4M3 15v4a2 2 0 0 0 2 2h4M21 15v4a2 2 0 0 1-2 2h-4"/></svg>';
      var iconExit = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v4a1 1 0 0 1-1 1H3M16 3v4a1 1 0 0 0 1 1h4M8 21v-4a1 1 0 0 0-1-1H3M16 21v-4a1 1 0 0 1 1-1h4"/></svg>';
      var updateIcon = function () { btn.innerHTML = (document.fullscreenElement || document.webkitFullscreenElement) ? iconExit : iconEnter; };
      btn.onclick = function (e) { e.preventDefault(); window.updateFullscreen(); };
      document.addEventListener('fullscreenchange', updateIcon);
      document.addEventListener('webkitfullscreenchange', updateIcon);
      updateIcon();
      container.appendChild(btn);
    })();

    createUnityInstance(canvas, {
      dataUrl: 'Build/WebGL.data.c0de4610.unityweb',
      frameworkUrl: 'Build/WebGL.framework.js.c0de4610.unityweb',
      codeUrl: 'Build/WebGL.wasm.c0de4610.unityweb',
      streamingAssetsUrl: 'StreamingAssets',
      companyName: 'JustPlay.LOL',
      productName: '1v1.LOL',
      productVersion: 'v446 (NewCI/Prod/8, August 2023)',
      showBanner: function(msg, type) {
        console[type === 'error' ? 'error' : 'log']('[Unity]', type, msg);
        if (type === 'error') { errorBox.style.display = 'block'; errorBox.textContent += msg + '\n'; }
      },
    }, function(p) {
      _realP = p;   // feed the smooth, stage-aware animator (see _renderProgress above)
    }).then(function(unityInstance) {
      window.unityInstance = unityInstance;
      window.gameInstance  = unityInstance;
      _loadDone = true;   // bar animates to 100%, then the overlay fades
      setTimeout(function () {
        loadingOverlay.style.transition = 'opacity .45s ease';
        loadingOverlay.style.opacity = '0';
        setTimeout(function () { loadingOverlay.style.display = 'none'; }, 480);
      }, 420);
      console.log('[v446] Unity instance ready');

      // === SENDMESSAGE TRACE === wrap unityInstance.SendMessage to log every JS→C# call.
      // Together with [FETCH-TRACE] + [LSM] probe this gives complete visibility of what
      // our bridge does during boot. No wasm/client patches — pure JS interceptor.
      try {
        var _smT0 = performance.now();
        var _origSM = unityInstance.SendMessage.bind(unityInstance);
        unityInstance.SendMessage = function(go, method, value) {
          var t = (performance.now() - _smT0).toFixed(0);
          var v = (value == null) ? '' : (typeof value === 'string' ? value : String(value));
          var vshort = v.length > 80 ? v.slice(0,80) + '…(' + v.length + 'b)' : v;
          console.log('%c[SM] +' + t + 'ms  ' + go + '.' + method + (vshort ? '(' + vshort + ')' : '()'),
                      'color:#fc0');
          return _origSM(go, method, value);
        };
        console.log('%c[SM] SendMessage interceptor installed', 'color:#fc0');
      } catch (e) { console.warn('[SM] interceptor install failed:', e); }

      // === DLPROBE === read-only download-completion timing probe (2026-05-29).
      // Wraps Module.cachedFetch / fetchWithProgress (the loader fns the framework's
      // _JS_WebRequest_Send calls per download) to log, per *.bundle: CALL time, when the
      // download Promise RESOLVES, and (if observable) when progress hits 100%. Pure JS
      // pass-through (returns the ORIGINAL promise unchanged; logging is a side .then branch),
      // so unlike ADDR_HOOK it cannot perturb completion. Goal: disambiguate the foreground
      // stall — if RESOLVE fires promptly in foreground, the body IS delivered and the stall is
      // the post-resolve ResourceManager.Update engine tick; if RESOLVE never logs (only on
      // background), the terminal ReadableStream read is starved.
      if (!window._DIAG_OFF) try {
        var _M = unityInstance.Module;
        var _dlT0 = performance.now();
        ['cachedFetch','fetchWithProgress'].forEach(function(name){
          var orig = _M && _M[name];
          if (typeof orig !== 'function') { console.log('[DLPROBE] ' + name + ' absent, skip'); return; }
          _M[name] = function(url, init){
            var s = String(url);
            if (!/\.bundle(\?|$)/.test(s)) return orig.apply(this, arguments);
            var fn = s.split('/').pop().slice(0,38);
            var t0 = performance.now();
            // hook progress if present (init.onProgress)
            try {
              if (init && typeof init.onProgress === 'function') {
                var op = init.onProgress, hit100 = false;
                init.onProgress = function(ev){
                  try { if (!hit100 && ev && ev.total > 0 && ev.loaded >= ev.total) { hit100 = true;
                    console.log('[DLPROBE] ' + name + ' ' + fn + ' progress=100% @+' + (performance.now()-t0).toFixed(0) + 'ms'); } } catch(_){}
                  return op.apply(this, arguments);
                };
              }
            } catch(_){}
            console.log('[DLPROBE] ' + name + ' CALL ' + fn + ' @' + (t0 - _dlT0).toFixed(0));
            var r = orig.call(this, url, init);
            try { if (r && typeof r.then === 'function') r.then(
              function(v){ console.log('%c[DLPROBE] ' + name + ' RESOLVE ' + fn + ' +' + (performance.now()-t0).toFixed(0) + 'ms', 'color:#0f0'); return v; },
              function(e){ console.log('%c[DLPROBE] ' + name + ' REJECT ' + fn + ' +' + (performance.now()-t0).toFixed(0) + 'ms ' + e, 'color:#f00'); throw e; }
            ); } catch(_){}
            return r;
          };
          console.log('[DLPROBE] wrapped ' + name);
        });
      } catch (e) { console.warn('[DLPROBE] install failed:', e); }

      // === ADDRPROBE === read-only heap probe of AddressablesHandler download flags (2026-05-29).
      // Discriminates the foreground download-completion stall. DownloadAllRequiredData() spins
      // `while(!downloadHandle.IsDone){...; await Task.Yield();}` then sets DidDownloadRequiredData=true.
      // We read that bool + DidInit every 250ms, correlated with document.hidden + visibilitychange.
      // Outcomes: (A) DD stays 0 in foreground, flips 0->1 shortly AFTER backgrounding => the managed
      // completion dispatch is starved by the foreground rAF loop (not data/fetch); (C) DD flips fast
      // in foreground => loop already exited, stall is downstream. Resolution (Addressables 1.22.3,
      // il2cpp.h:150459 + workflow w07lm7baz): TypeInfo cell @0x9AB650 -> classPtr; static_fields @
      // class+92; singleton @static_fields+8; DidDownloadRequiredData @instance+8; DidInit @instance+9.
      // Live HEAP read each poll (views detach on memory growth). Pure read-only — cannot perturb.
      // 2026-05-31: enabled INDEPENDENTLY of _DIAG_OFF (own flag _ADDRPROBE) — this is read-only
      // (no fetch/function wrapping) so it is NOT a confound, and DidDownloadRequiredData is the
      // prime suspect for the LSM "Initializing locales" gate (AddressablesHandler.OnDownloadRequired
      // DataComplete is one of the LSM ready-byte events per decompiled FGPIIPIHEMJ).
      if (window._ADDRPROBE !== false) try {
        var ap_t0 = performance.now();
        var ap_n = 0, ap_lastVis = ap_t0, ap_lastDD = -2;
        // metadata-class cells: [0]=AddressablesHandler @0x9AB3D0 (CORRECTED 2026-05-31 — the old
        // 0x9AB650 gave cp=0x2000c787, out of heap range = wrong class). From decompiled
        // AddressablesHandler.DMIOJKPMICC the singleton is *(*(0x9AB3D0+0x5c)+8); DidDownloadRequired
        // Data = instance+0xc (LANNMOLOPGL returns *(this+0xc)), DidInit = instance+0xd. [1]=state
        // singleton 0x9AED98 (LSM LoadingFinished holder) for layout comparison.
        var CAND = [0x9AB3D0, 0x9AED98];
        document.addEventListener('visibilitychange', function(){
          ap_lastVis = performance.now();
          console.log('%c[ADDRPROBE] visibilitychange hidden=' + document.hidden + ' @' + (ap_lastVis-ap_t0).toFixed(0) + 'ms', 'color:#f0f;font-weight:bold');
        });
        function hx(h8, base, len){ var o=[]; for(var i=0;i<len;i+=4){ var v=((h8[base+i])|(h8[base+i+1]<<8)|(h8[base+i+2]<<16)|(h8[base+i+3]<<24))>>>0; o.push('+'+i+'=0x'+v.toString(16)); } return o.join(' '); }
        var ap_iv = setInterval(function(){
          var now = (performance.now() - ap_t0).toFixed(0);
          try {
            var M = unityInstance && unityInstance.Module;
            if (!M) { if(ap_n<2){console.log('[ADDRPROBE] no Module @'+now);ap_n++;} return; }
            var h32 = M.HEAPU32, h8 = M.HEAPU8;
            if (!h32 || !h8) { if(ap_n<2){console.log('[ADDRPROBE] no HEAPU32/U8; HEAP keys='+Object.keys(M).filter(function(k){return /HEAP/.test(k);}).join(',')+' @'+now);ap_n++;} return; }
            var HL = h32.length*4;
            // DIAGNOSTIC every ~5s (max 8): show resolution chain for both candidates + class hexdump
            if ((performance.now()-ap_t0) - ap_n*5000 > 5000 && ap_n < 8) {
              ap_n++;
              var diag = '[ADDRPROBE-DIAG#'+ap_n+'] heapLen=0x'+HL.toString(16);
              CAND.forEach(function(addr){
                var cp = h32[addr>>>2]>>>0;
                diag += ' || @0x'+addr.toString(16)+'->cp=0x'+cp.toString(16);
                if (cp>0x10000 && cp<HL){ var sf=h32[(cp+92)>>>2]>>>0; diag+=' sf+92=0x'+sf.toString(16);
                  if(sf>0x10000&&sf<HL){ var inst=h32[(sf+8)>>>2]>>>0; diag+=' inst=0x'+inst.toString(16);
                    if(inst>0x10000&&inst<HL) diag+=' DD='+h8[inst+8]+' DI='+h8[inst+9]; } }
              });
              console.log('%c'+diag, 'color:#0bf');
              var cp0=h32[CAND[0]>>>2]>>>0;
              if(cp0>0x10000&&cp0<HL) console.log('%c[ADDRPROBE-DIAG] class@0x'+cp0.toString(16)+' words +80..120: '+hx(h8,cp0+80,44), 'color:#888');
            }
            // PRIMARY read of DidDownloadRequiredData (if chain resolves)
            var cp=h32[CAND[0]>>>2]>>>0; if(cp<=0x10000||cp>=HL) return;
            var sf=h32[(cp+92)>>>2]>>>0; if(sf<=0x10000||sf>=HL) return;
            var inst=h32[(sf+8)>>>2]>>>0; if(inst<=0x10000||inst>=HL) return;
            // DidDownloadRequiredData/DidInit: il2cpp.h says +8/+9, Ghidra decompile (LANNMOLOPGL
            // returns *(this+0xc), get_DidInit writes +0xd) says +0xc/+0xd. Read BOTH; the byte that
            // flips 0->1 when the download completes is the real one.
            var dd=h8[inst+8], ddC=h8[inst+0xc];
            var sigD = dd+'/'+ddC;
            if(sigD!==ap_lastDD){
              console.log('%c[ADDRPROBE] DidDownloadRequiredData[+8]='+dd+' [+0xc]='+ddC+' DidInit[+9]='+h8[inst+9]+' [+0xd]='+h8[inst+0xd]+' hidden='+document.hidden+' (sinceVis '+(performance.now()-ap_lastVis).toFixed(0)+'ms) @'+now,
                          (dd===1||ddC===1)?'color:#0f8;font-weight:bold':'color:#f80');
              ap_lastDD=sigD;
            }
          } catch(e){ if(ap_n<2){console.log('[ADDRPROBE] err '+e+' @'+now);ap_n++;} }
        }, 250);
      } catch (e) { console.warn('[ADDRPROBE] setup failed:', e); }

      // === LSMPROBE === read-only heap probe of LoadingScreenManager wait-list (2026-05-31).
      // From the Tier-1..5 Ghidra boot-chain map: the splash gate is a dynamic List<NamedAwaitable>
      // at LSM+0x44 (NOT a fixed 5-bool gate — that model was wrong for 4.46). The boot coroutine's
      // iterator (LoadingScreenManager.AKJLHLPPAJO) logs "Waiting for <name>" per pending item, with
      // the name read from item+0x14 and the count from (LSM+0x44)+0xc. This probe resolves the LSM
      // singleton (TypeInfo @0x9AF358 -> classPtr -> static_fields@class+92 -> singleton@sf+8, same
      // chain ADDRPROBE uses for AddressablesHandler) and every 1s reads:
      //   - LSM+0x44 wait-list: List._size@+0xc, List._items@+0x8, each NamedAwaitable name @item+0x14
      //   - LSM+0x48 progress float
      // and logs the SET of pending names whenever it changes, correlated with document.hidden.
      // PURPOSE: identify EXACTLY which awaitable never completes in foreground (vs drains on minimize).
      // This is the decisive observability for splash-hang root cause — pure read-only setInterval,
      // no fetch/function wrapping (so it cannot perturb completion, unlike the gated ADDR_HOOK).
      // Independent of _DIAG_OFF (set window._LSMPROBE=false to disable). Offsets self-diagnose via
      // a periodic hexdump if the resolve chain or layout is off.
      if (window._LSMPROBE !== false) try {
        var lp_t0 = performance.now();
        var lp_n = 0, lp_lastSig = null, lp_lastVis = lp_t0;
        var LSM_TI = 0x9AF358; // LSM TypeInfo cell (script.json "Address"), same as ADDRPROBE CAND[1]
        document.addEventListener('visibilitychange', function(){
          lp_lastVis = performance.now();
        });
        function lp_h32(){ return unityInstance.Module.HEAPU32; }
        function lp_h8(){ return unityInstance.Module.HEAPU8; }
        // Compact IL2CPP System.String decoder. Layout: header(8) + _stringLength@8 + UTF16 chars@12.
        function lp_str(p){
          try {
            if (!p || p < 0x10000) return null;
            var h32 = lp_h32(), HL = h32.length*4; if (p >= HL) return null;
            var len = h32[(p+8)>>>2]>>>0; if (len <= 0 || len > 256) return null;
            var h8 = lp_h8(), base = p+12, s='';
            for (var i=0;i<len;i++){ var c = (h8[base+2*i] | (h8[base+2*i+1]<<8)); if (c<0x20||c>0x7e){ if(c===0)break; s+='?'; } else s += String.fromCharCode(c); }
            return s;
          } catch(e){ return null; }
        }
        function lp_hex(base, len){ try { var h8=lp_h8(), o=[]; for(var i=0;i<len;i+=4){ var v=((h8[base+i])|(h8[base+i+1]<<8)|(h8[base+i+2]<<16)|(h8[base+i+3]<<24))>>>0; o.push('+0x'+i.toString(16)+'=0x'+v.toString(16)); } return o.join(' '); } catch(e){ return '('+e+')'; } }
        var lp_iv = setInterval(function(){
          var now = (performance.now()-lp_t0).toFixed(0);
          try {
            var M = unityInstance && unityInstance.Module; if (!M) return;
            var h32 = M.HEAPU32, h8 = M.HEAPU8; if (!h32 || !h8) return;
            var HL = h32.length*4;
            function lp_f(p){ return (new Float32Array(new Uint32Array([h32[p>>>2]>>>0]).buffer))[0]; }
            // (A) STATE SINGLETON @ 0x9aed98 (from decompiled LSM.get_LoadingFinished/get_IsLoadingScreenOff):
            //   classCell 0x9aed98 -> classPtr; static_fields @ classPtr+0x5c -> SF;
            //   SF+4 = IsLoadingScreenOff, SF+5 = LoadingFinished, SF+6 = extra flag. Reliable.
            (function(){
              var cp=h32[0x9aed98>>>2]>>>0; if (cp<=0x10000||cp>=HL) return;
              var sf=h32[(cp+0x5c)>>>2]>>>0; if (sf<=0x10000||sf>=HL) return;
              var st='off='+h8[sf+4]+' finished='+h8[sf+5]+' f6='+h8[sf+6];
              if (st!==window.__lsmStateSig){ window.__lsmStateSig=st;
                console.log('%c[LSMPROBE/state] '+st+' hidden='+document.hidden+' @'+now,
                            h8[sf+5]?'color:#0f8;font-weight:bold':'color:#fc0'); }
            })();
            // (A2) UPSTREAM gate flags (decompiled): the 2 stuck LSM events are FirebaseManager.
            // FinishedDataFetch + AppInitializer event@+4. Watch the static fields that gate them, to
            // see WHICH flips on minimize (= the operation that completes only on focus-loss):
            //   ServerClock @0x9b06dc  SF+4 = DidInit (server time ready)   [GetUserData awaits this]
            //   AppInitializer @0x9af820 SF+0/+4/+8 = 3 event delegate ptrs (non-0 = has subscribers),
            //                             SF+0xc/+0xd = 2 bool state flags
            //   FirebaseManager @0x9ad118 SF+4 = FinishedDataFetch delegate ptr
            (function(){
              function sfOf(cell){ var cp=h32[cell>>>2]>>>0; if(cp<=0x10000||cp>=HL)return 0; var sf=h32[(cp+0x5c)>>>2]>>>0; return (sf>0x10000&&sf<HL)?sf:0; }
              var sc=sfOf(0x9b06dc), ai=sfOf(0x9af820), fb=sfOf(0x9ad118);
              var parts=[];
              if(sc) parts.push('ServerClock.DidInit='+h8[sc+4]);
              if(ai) parts.push('AppInit[evt@0='+(h32[(ai+0)>>>2]?1:0)+',evt@4='+(h32[(ai+4)>>>2]?1:0)+',evt@8='+(h32[(ai+8)>>>2]?1:0)+',b0xc='+h8[ai+0xc]+',b0xd='+h8[ai+0xd]+']');
              if(fb) parts.push('FB.FinishedDataFetch.subs='+(h32[(fb+4)>>>2]?1:0));
              // FIRSTRENDER PROBE (2026-06-02): menu header (nickname) + Sign-in CTA both blank on first
              // render, appear after one nav. Coins gate on ServerUser!=null (Ghidra PKOEAIPHLOC) → guest=
              // ServerUser-null is CANONICAL. So track when guest user-state SETTLES vs menu-show: if it
              // settles AFTER the menu scene Awakes, the panels pull stale (blank) → timing root; if before,
              // it's a blank-pull root. FB static_fields layout: SF+0=OnUserAuthorized(Action<ServerUser>),
              // SF+0x20=ServerUserChanged(Action), SF+0x24=Instance; Instance+0x30=ServerUser, Instance+0x14=
              // IsSocialLoggedIn(bool). Delegate ptr CHANGES on each (un)subscribe → reveals subscribe order.
              if(fb){ var inst=h32[(fb+0x24)>>>2]>>>0; var su=(inst>0x10000&&inst<HL)?(h32[(inst+0x30)>>>2]>>>0):0;
                parts.push('FB.[OnUserAuth=0x'+(h32[(fb+0)>>>2]>>>0).toString(16)+' ServerUserChanged=0x'+(h32[(fb+0x20)>>>2]>>>0).toString(16)+' Instance='+(inst?'set':'null')+' ServerUser='+(su?'SET':'null')+' IsSocialLoggedIn='+((inst>0x10000&&inst<HL)?h8[inst+0x14]:'?')+']'); }
              var us=parts.join(' ');
              if(us && us!==window.__upSig){ window.__upSig=us;
                console.log('%c[LSMPROBE/upstream] '+us+' hidden='+document.hidden+' @'+now,'color:#fa0'); }
            })();
            // === DSPROBE (2026-06-02) === Daily Skins (LimitedLocker.LimitedLockerController) progress via
            // il2cpp lazy-init GUARD bytes. Each method sets its own guard=1 the FIRST time it runs → tells
            // how far the controller got WITHOUT locating the instance (no heap scan). Guard addrs from Ghidra
            // bodies: 0xb27eb1=Awake(GameObject in scene?), 0xb27eb5=HLPPLPDBCAJ(init), 0xb27eb7=JNMLDJDAKFN
            // (visibility gate evaluated?), 0xb27ecf=LLHOOAGANHG(data async), 0xb27ec0=JFIHIEJNHHH(content load),
            // 0xb27ecc=KFHPKDGAPKB(per-slot product). + secondary gate byte [class 0x9ade40 .static_fields+0x1c]
            // (JNMLDJDAKFN: show only if this==0). DECISIVE: Awake=0 → widget GameObject NOT in our menu scene
            // (B, no fix via config); gate=1 but content=0 → gate returned 0 → hidden by a runtime condition
            // (A, timing/flag). Plain h8 reads, emit-on-change.
            (function(){
              function g(a){ return (a<HL)? h8[a] : -1; }
              function sfb(cell,off){ try{ var cp=h32[cell>>>2]>>>0; if(cp<=0x10000||cp>=HL) return -1; var sf=h32[(cp+0x5c)>>>2]>>>0; if(sf<=0x10000||sf>=HL) return -2; return h8[sf+off]; }catch(e){ return -3; } }
              // LimitedLocker data-holder (class 0x9b3664): LLHOOAGANHG/KFHPKDGAPKB lazily load 5 fields
              // (+4,+8,+0xc,+0x10,+0x14). 1=valid heap ptr(loaded), 0=null(not loaded). If all 0 → the daily-
              // skins data never loaded → per-slot reader has nothing to iterate → productRead=0.
              function sfw(cell,off){ try{ var cp=h32[cell>>>2]>>>0; if(cp<=0x10000||cp>=HL)return -1; var sf=h32[(cp+0x5c)>>>2]>>>0; if(sf<=0x10000||sf>=HL)return -2; var p=h32[(sf+off)>>>2]>>>0; return (p>0x10000&&p<HL)?1:(p===0?0:2); }catch(e){return -3;} }
              // instance-field byte: cell → static_fields → [SF+0]=singleton instance → byte @inst+off.
              function instb(cell,off){ try{ var cp=h32[cell>>>2]>>>0; if(cp<=0x10000||cp>=HL)return -1; var sf=h32[(cp+0x5c)>>>2]>>>0; if(sf<=0x10000||sf>=HL)return -2; var inst=h32[sf>>>2]>>>0; if(inst<=0x10000||inst>=HL)return -4; return h8[inst+off]; }catch(e){return -3;} }
              // IL2CPP array length: cell→SF→[SF+fldoff]=obj→[obj+arroff]=Il2CppArray→max_length@+0xc.
              // For LimitedLockerData (holder.sf[+0x10]): Skins(String[])@obj+8. skinsLen=arrlen(0x9b3664,0x10,8).
              function arrlen(cell,fldoff,arroff){ try{ var cp=h32[cell>>>2]>>>0; if(cp<=0x10000||cp>=HL)return -1; var sf=h32[(cp+0x5c)>>>2]>>>0; if(sf<=0x10000||sf>=HL)return -2; var obj=h32[(sf+fldoff)>>>2]>>>0; if(obj<=0x10000||obj>=HL)return -4; var arr=h32[(obj+arroff)>>>2]>>>0; if(arr<=0x10000||arr>=HL)return -5; return h32[(arr+0xc)>>>2]>>>0; }catch(e){return -3;} }
              // + IsConnected (NetworkManager.FFPPKCLILNI) breakdown — the gate returns this & it's the
              // blocker. IsConnected = reachable && NM.sf[+0xc]!=0 && offlineMgr(009afb9c).sf[+0x28]==0 &&
              // NM.sf[+4]==0. Read the 3 bytes (NM cell 0x9af5a0, offlineMgr cell 0x9afb9c): pinpoints which
              // fails. offlineMgr+0x28!=0 → OfflineMode set (offline-fallback). NM+4!=0 → disconnected.
              var sig='Awake='+g(0xb27eb1)+' init='+g(0xb27eb5)+' gate='+g(0xb27eb7)+' dataAsync='+g(0xb27ecf)+' productRead='+g(0xb27ecc)+' content='+g(0xb27ec0)+' secFlag[009ade40+0x1c]='+sfb(0x9ade40,0x1c)+' || IsConn: NM+0xc='+sfb(0x9af5a0,0xc)+' NM+4(0=conn)='+sfb(0x9af5a0,4)+' offlineMode[009afb9c+0x28]='+sfb(0x9afb9c,0x28)+' navigator.onLine='+(typeof navigator!=='undefined'?navigator.onLine:'?')+' || data[009b3664]: +4='+sfw(0x9b3664,4)+' +8='+sfw(0x9b3664,8)+' +0xc='+sfw(0x9b3664,0xc)+' +0x10='+sfw(0x9b3664,0x10)+' +0x14='+sfw(0x9b3664,0x14)+' || iterItem(eca)='+g(0xb27eca)+' iterIdx(ecb)='+g(0xb27ecb)+' popupFlag[009ab3e8.inst+0xc]='+instb(0x9ab3e8,0xc)+' || skinsLen[010.+8]='+arrlen(0x9b3664,0x10,8)+' skinsLen[010.+0xc]='+arrlen(0x9b3664,0x10,0xc)+' skinsLen[014.+8]='+arrlen(0x9b3664,0x14,8);
              if (sig!==window.__dsSig){ window.__dsSig=sig;
                console.log('%c[DSPROBE] '+sig+' @'+now,'color:#fa0;font-weight:bold'); }
            })();
            // (B) LSM MonoBehaviour ready-bytes (from decompiled FGPIIPIHEMJ event handlers): each
            // subsystem-ready event sets ONE byte. Map (setter -> offset -> subsystem cluster):
            //   +0x69 IKNEMGBKLHA, +0x6c PNLDCHECEMN, +0x6d BJLDJGDKLGN, +0x6f CCNOLPPJFJA,
            //   +0x71 MDMKOIMILNP, +0x72 BGMOELIGNIF. When ALL set → LoadingFinished. A byte still 0
            //   = the subsystem event that never fired = the splash blocker.
            // Signature: an object whose 6 ready bytes are each {0,1}, +0x44 is 0-or-heap (wait list),
            // +0x48 is a float in [0,1]. Scan metadata-cell statics until found; cache (non-moving GC).
            // FULL _did* bool block — AUTHORITATIVE field map from 4.46 il2cpp.h LoadingScreenManager_Fields,
            // CONFIRMED by Ghidra setter bodies: PNLDCHECEMN→+0x6c=_didGetPlayerInfo, BJLDJGDKLGN→+0x6d=
            // _didGetChallengesInfo, CCNOLPPJFJA→+0x6f=_didConnectToPhoton, MDMKOIMILNP→+0x71=
            // _didFinishAddressableDownload, BGMOELIGNIF→+0x72=_didInitializeLocalization.
            // 13 consecutive bools at obj+0x68..0x74 (base=0x10, _loadingJobs@+0x44): ONLY ONE non-_did bool
            // (HHCMMNOKEIC@+0x68 = APHOAKCCADB) precedes _didGetRemoteConfig@+0x69. (FIXED 2026-06-01: the
            // old array had a phantom +0x69 bool that shifted EVERY _did label down by one offset — the root
            // of the prior session's false "_didGetPlayerInfo/FB+8" chase; real stuck flag was the NEXT one.)
            var BOOLS=[[0x68,'HHCMMNOKEIC'],[0x69,'_didGetRemoteConfig'],[0x6a,'_didSignIn'],[0x6b,'_didInitFirebase'],[0x6c,'_didGetPlayerInfo'],[0x6d,'_didGetChallengesInfo'],[0x6e,'_didGetAvailableRegions'],[0x6f,'_didConnectToPhoton'],[0x70,'_didValidateRegion'],[0x71,'_didFinishAddressableDownload'],[0x72,'_didInitializeLocalization'],[0x73,'_didFinishAgeGate'],[0x74,'_didAcceptPrivacy']];
            var N2O={}; BOOLS.forEach(function(b){N2O[b[1]]=b[0];});
            var ROFF=BOOLS.map(function(b){return b[0];}), RNAME=BOOLS.map(function(b){return b[1];});
            // DETERMINISTIC instance find: 0x9aed98 is the LoadingScreenManager CLASS cell. classPtr =
            // h32[0x9aed98]. The MonoBehaviour singleton is a heap object whose obj[0] == classPtr.
            // Validate by the 14-bool block (all bytes 0x68..0x75 must be {0,1}). Cache (non-moving GC).
            if (!window.__lsmInsts) {
              var lsmCls = h32[0x9aed98>>>2]>>>0;
              if (lsmCls<=0x10000 || lsmCls>=HL) { if(lp_n<3){console.log('[LSMPROBE] LSM class cell unresolved @'+now);lp_n++;} return; }
              if (window.__lsmScanDone && (performance.now()-lp_t0) < 3500) return; // one heavy scan, then retry slowly
              window.__lsmScanDone = true;
              var hits=[];
              for (var o=0x100000; o+0x78<HL && hits.length<16; o+=4) {
                if (h32[o>>>2]>>>0 !== lsmCls) continue;
                var ok=true; for (var k=0;k<ROFF.length;k++){ if (h8[o+ROFF[k]]>1){ ok=false; break; } }
                if (ok) hits.push(o);
              }
              if (hits.length){ window.__lsmInsts=hits; window.__lsmSigs={};
                console.log('%c[LSMPROBE] located '+hits.length+' LSM instance(s) [cls=0x'+lsmCls.toString(16)+']: '+hits.map(function(h){return '0x'+h.toString(16);}).join(', ')+' @'+now,'color:#0bf;font-weight:bold'); }
              else { if(lp_n<4){console.log('[LSMPROBE] no LSM instance (cls=0x'+lsmCls.toString(16)+') found in heap @'+now);lp_n++;} return; }
            }
            // Decode _loadingJobs (LSM+0x44 = List<LoadingJob>). Each LoadingJob: header(8) +
            // LocalizedDisplayText(DefaultedLocalizedString value-type, 12B) + BoolToCheck(String*)@+0x14.
            // BoolToCheck names the exact _did* field this job's WaitUntil blocks on → the FIRST job whose
            // bool is false IS the splash blocker. We resolve that bool via N2O and read its live value.
            function lp_jobs(inst){
              var lst=h32[(inst+0x44)>>>2]>>>0; if (lst<=0x10000||lst>=HL) return null;
              var sz=h32[(lst+0xc)>>>2]>>>0, arr=h32[(lst+0x8)>>>2]>>>0;
              if (!(sz>0&&sz<64&&arr>0x10000&&arr<HL)) return (sz===0?[]:null);
              var data=arr+0x10; // IL2Cpp array data starts after 16-byte header
              // LoadingJob layout unknown a-priori (value-type inline vs class pointer). Try several
              // (stride, BoolToCheck-offset, deref?) and pick the one that resolves the MOST _did* names.
              function attempt(stride, bcOff, deref){
                var hits=0, res=[];
                for (var i=0;i<sz;i++){
                  var base=data+i*stride;
                  var obj = deref ? (h32[(base)>>>2]>>>0) : base;
                  if (deref && (obj<=0x10000||obj>=HL)){ res.push({name:'?',set:-1}); continue; }
                  var nm=lp_str(h32[((obj+bcOff))>>>2]>>>0);
                  var known=(nm!=null && N2O.hasOwnProperty(nm));
                  if (known) hits++;
                  res.push({name:nm||('@0x'+obj.toString(16)), set:known?h8[inst+N2O[nm]]:-1});
                }
                return {hits:hits, res:res};
              }
              var cands=[attempt(16,0xC,false), attempt(20,0x10,false), attempt(4,0x14,true), attempt(4,0xC,true), attempt(16,0x8,false)];
              cands.sort(function(a,b){return b.hits-a.hits;});
              return cands[0].res;
            }
            var nowMs = performance.now();
            if (!window.__lsmBeats) window.__lsmBeats={};
            window.__lsmInsts.forEach(function(inst){
              // === FORCE-PLAYERINFO === DIAGNOSTIC TEST (2026-05-31): sole stuck boot-job is
              // _didGetPlayerInfo (LSM+0x6d), set canonically by an FB_SF+4 event fired only by
              // GetPlayerFullData — never called on boot. Write the byte directly to confirm it is the
              // ONLY remaining gate (splash should fill 10%→100% and clear). NOT the ship fix. Validity-
              // gated (skip dead/reused instances whose bool block is garbage). Default ON for this test.
              if (window._FORCE_PLAYERINFO === true) {
                // DECISIVE TEST: force ALL 14 _did* bools (obj+0x68..0x75)=1 on EVERY located instance.
                // The job-loop BKNMDGDCPIH (win2023:37073) does WaitUntil(reflection-read this.<BoolToCheck>)
                // per job. If the bar advances → a missing flag was the gate. If it STAYS at 10% with every
                // flag forced on every instance → the loop is NOT reading these bytes (reflection field-name
                // mismatch, or loop runs on a non-located instance) → the real gate is elsewhere.
                var nset=0; for (var fo=0x68; fo<=0x75; fo++){ if (h8[inst+fo]!==1){ h8[inst+fo]=1; nset++; } }
                if (nset>0 && !window.__faAll){ window.__faAll=true;
                  console.log('%c[FORCE-ALL] set 14 _did* bytes(0x68-0x75)=1 on located LSM instances @'+now+' (decisive: does bar advance?)', 'color:#f0f;font-weight:bold'); }
              }
              var prog=lp_f(inst+0x48), rb=[], stuck=[];
              // LOOP-INSTANCE identifiers: real progress CGOMDNPMGNK (float @+0x5c, NOT +0x48 which is the
              // constant _startingLoadingBarValue=0.1), _canvasGroup ptr (@+0x10, visible instance non-null).
              var rprog=lp_f(inst+0x5c); var cg=h32[(inst+0x10)>>>2]>>>0; var hasCg=(cg>0x10000&&cg<HL)?1:0;
              // fillAmount = the ACTUAL visible bar. _loadingImage @LSM+0x34 (UnityEngine.UI.Image*),
              // m_FillAmount float @ Image+0x90 (confirmed by Ghidra bar-fill body: *(*(this+0x34)+0x90)).
              // barCo = bar-fill coroutine handle EDILFDLGOHM @LSM+0x60 (non-null = coroutine alive).
              // DECISIVE: realProg=1.0 & fill frozen at 0.1 across beats → bar-fill not pumping (Time/loop);
              //          realProg<1.0 → a job is stuck (BLOCKER names it). Watch fill change between beats.
              var li=h32[(inst+0x34)>>>2]>>>0; var fill=(li>0x10000&&li<HL)?lp_f(li+0x90):-1;
              var barco=h32[(inst+0x60)>>>2]>>>0; var hasBar=(barco>0x10000&&barco<HL)?1:0;
              for (var k=0;k<ROFF.length;k++){ var b=h8[inst+ROFF[k]]; if (RNAME[k].charAt(0)==='_'){ rb.push(RNAME[k].slice(4)+'='+b); if (b!==1) stuck.push(RNAME[k]); } }
              var jobs=lp_jobs(inst); var njobs=jobs?jobs.length:0;
              // First job whose bool is not set = the splash blocker (jobs run sequentially).
              var blocker='(none)', jobStr='(no-list)';
              if (jobs && jobs.length){
                jobStr=jobs.map(function(j){return (j.name.charAt(0)==='_'?j.name.slice(4):j.name)+(j.set===1?'✓':(j.set===0?'✗':'?'));}).join(' ');
                for (var ji=0;ji<jobs.length;ji++){ if (jobs[ji].set!==1){ blocker=jobs[ji].name+(jobs[ji].set===0?' (=false)':' (unresolved)'); break; } }
              }
              // The VISIBLE loop instance = one with _loadingJobs populated AND _canvasGroup non-null AND
              // real-progress (rprog) that evolves. Mark it so we know which instance's flags actually gate.
              var isLoop = (njobs>0 && hasCg) ? ' ◀LOOP' : '';
              var sig=rb.join(',')+'#rp='+rprog.toFixed(3)+'#fill='+fill.toFixed(3)+'#b='+blocker+'#cg='+hasCg+'#nj='+njobs;
              // PER-INSTANCE heartbeat (every 5s) so the active instance keeps logging through the whole
              // foreground window even when its flags don't change (needed to capture post-Accept state).
              var beat = (nowMs - (window.__lsmBeats[inst]||0)) > 5000;
              if (sig !== window.__lsmSigs[inst] || beat){ window.__lsmSigs[inst]=sig; window.__lsmBeats[inst]=nowMs;
                console.log('%c[LSMPROBE inst=0x'+inst.toString(16)+isLoop+'] realProg='+rprog.toFixed(3)+' fill='+fill.toFixed(3)+' bar='+hasBar+' startVal='+prog.toFixed(3)+' cg='+hasCg+' njobs='+njobs+' BLOCKER='+blocker+' | dids=['+rb.join(' ')+'] jobs=['+jobStr+'] hidden='+document.hidden+' @'+now,
                            stuck.length===0?'color:#0f8;font-weight:bold':'color:#fc0');
              }
            });
          } catch(e){ if(lp_n<2){console.log('[LSMPROBE] err '+e+' @'+now);lp_n++;} }
        }, 1000);
        console.log('%c[LSMPROBE] installed — watching LoadingScreenManager wait-list (LSM+0x44)', 'color:#0bf');
      } catch (e) { console.warn('[LSMPROBE] setup failed:', e); }

      // === TRPROBE === read-only heap probe of the TrophyRoad active-season gate (2026-06-06).
      // Decides why TrophyRoadScreen.DBLLLABDEHI (winver:63885) leaves the reward-tile area empty:
      // the whole populate body is gated on EEHFGFMDCJI (winver HHBBFJFCPAG, 23309-23322), set true
      // only after WaitUntil(ServerClock!=null && DidInit) + a foreach over seasons matching the time window.
      // Cells from the running dump, chain = classCell -> classPtr=HEAP32[cell] -> static_fields=HEAP32[classPtr+0x5C].
      if (window._TRPROBE !== false && (typeof localStorage==='undefined' || localStorage.TRPROBE!=='0')) try {
        var tr_t0 = performance.now(), tr_n = 0, tr_sig = null, tr_beat = 0;
        var TR_GATE = 0x9AF7F0;   // OGMOPFKFBKJ (FirebaseTrophyRoadHandler) _TypeInfo
        var TR_HOLD = 0x9AA190;   // MJBDGLDKCMJ<FirebaseTrophyRoadData> (config holder) _TypeInfo
        var TR_CLK  = 0x9B06DC;   // ServerClock _TypeInfo
        function tr_ticksToStr(loW, hiW){
          try {
            var raw = (BigInt(hiW>>>0) << 32n) | BigInt(loW>>>0);
            var ticks = raw & 0x3FFFFFFFFFFFFFFFn;          // strip DateTimeKind flag bits
            if (ticks === 0n) return 'MinValue(0)';
            var ms = ticks / 10000n;                        // ms since 0001-01-01
            var unixMs = ms - 62135596800000n;             // shift to 1970-01-01
            var n = Number(unixMs);
            if (!isFinite(n)) return 'ticks=' + ticks.toString();
            return new Date(n).toISOString() + ' (ticks=' + ticks.toString() + ')';
          } catch(e){ return 'ticks=0x' + (hiW>>>0).toString(16) + (loW>>>0).toString(16); }
        }
        var tr_iv = setInterval(function(){
          var now = (performance.now()-tr_t0).toFixed(0);
          try {
            var M = unityInstance && unityInstance.Module; if (!M) return;
            var h32 = M.HEAPU32, h8 = M.HEAPU8; if (!h32 || !h8) return;
            var HL = h32.length*4;
            function sf(cell){ var cp=h32[cell>>>2]>>>0; if(cp<=0x10000||cp>=HL)return 0;
                               var s=h32[(cp+0x5c)>>>2]>>>0; return (s>0x10000&&s<HL)?s:0; }
            var gsf = sf(TR_GATE), hsf = sf(TR_HOLD), csf = sf(TR_CLK);
            if (!gsf || !hsf || !csf){ if(tr_n<3){console.log('[TRPROBE] resolve fail gate='+gsf.toString(16)+' hold='+hsf.toString(16)+' clk='+csf.toString(16)+' @'+now);tr_n++;} return; }

            var gate = h8[gsf+0x0];
            var seasonKey = h32[(gsf+0x20)>>>2]|0;
            var seasonTiersPtr = h32[(gsf+0x18)>>>2]>>>0;          // _DCHEIDOHECE.tiers ptr (List<TrophyRoadTierData>)
            var seasonNull = (seasonTiersPtr>0x10000 && seasonTiersPtr<HL) ? 0 : 1;
            // ★ CHAIFNKIJCC.tiers.Count = List._size @ +0xc (IL2CPP List<T>: klass4+mon4+items4+_size4)
            var tiersCount = (!seasonNull) ? (h32[(seasonTiersPtr+0xc)>>>2]|0) : -1;
            var sStart = tr_ticksToStr(h32[(gsf+0x8)>>>2], h32[(gsf+0xc)>>>2]);   // season.start_date
            var sEnd   = tr_ticksToStr(h32[(gsf+0x10)>>>2], h32[(gsf+0x14)>>>2]); // season.end_date

            var ejfl = h8[hsf+0x10];                               // EJFLLDIMOFG (_OIEHKIJGOEF) = RC-ready/await gate that DBLLLABDEHI awaits
            var dict = h32[(hsf+0xc)>>>2]>>>0;                     // _GNIGMFHGDEJ@+0x8 -> .seasons@+0xC
            var seasonsCount, seasonsState;
            if (dict<=0x10000 || dict>=HL){ seasonsState='NULL(ptr=0x'+dict.toString(16)+')'; seasonsCount=-1; }
            else { var cnt=h32[(dict+0x10)>>>2]|0, fc=h32[(dict+0x18)>>>2]|0; seasonsCount=cnt-fc;
                   seasonsState=seasonsCount+' (_count='+cnt+' _freeCount='+fc+')'; }

            var clkInit = h8[csf+0x4];
            var clkInst = h32[csf>>>2]>>>0;                        // singleton @ SF+0
            var srvTime = '(no-instance)';
            if (clkInst>0x10000 && clkInst<HL) srvTime = tr_ticksToStr(h32[(clkInst+0x18)>>>2], h32[(clkInst+0x1c)>>>2]);

            var sig = 'gate='+gate+'|ejfl='+ejfl+'|seasons='+seasonsCount+'|tiers='+tiersCount+'|key='+seasonKey+'|snull='+seasonNull+'|clk='+clkInit;
            var nowMs = performance.now(), beat=(nowMs-tr_beat)>10000;
            if (sig!==tr_sig || beat){ tr_sig=sig; tr_beat=nowMs;
              console.log('%c[TRPROBE] GATE(EEHFGFMDCJI)='+gate+
                          '  ★EJFLLDIMOFG(await)='+ejfl+
                          '  seasons.count='+seasonsState+
                          '  selKey(OEMNEGFLKIN)='+seasonKey+'  CHAIFNKIJCC='+(seasonNull?'NULL':'set')+
                          '  ★tiers.Count='+tiersCount+
                          '  ServerClock.DidInit='+clkInit+
                          '  serverTimeBase='+srvTime+
                          '  season.window=['+sStart+' .. '+sEnd+')'+
                          '  hidden='+(typeof document!=='undefined'?document.hidden:'?')+' @'+now,
                          gate? 'color:#0f8;font-weight:bold' : 'color:#fc0;font-weight:bold'); }
          } catch(e){ if(tr_n<3){console.log('[TRPROBE] err '+e+' @'+now);tr_n++;} }
        }, 1000);
        console.log('%c[TRPROBE] installed — watching TrophyRoad active-season gate (EEHFGFMDCJI)','color:#0bf');
      } catch (e) { console.warn('[TRPROBE] setup failed:', e); }

      // === TRSCAN === read-only heap probe: is there a LIVE TrophyRoadScreen instance? (R1 vs R2)
      // Klass derived from nested <>c cell 0x9B4808 -> HEAP32[cell]=<>c klass -> [+0x28]=declaringType=TrophyRoadScreen klass.
      // Il2CppClass_1: name@+0x08, declaringType@+0x28, static_fields@+0x5c. Object: klass@+0, m_CachedPtr@+8, fields from +0xc.
      // TrophyRoadScreen_Fields (il2cpp.h:101385): _contentGrid@0x18, _trophyRoadTierItems(List)@0x30 (_size@+0xc), _trophyRoadTierPrefab@0x34.
      if (window._TRSCAN !== false && (typeof localStorage==='undefined' || localStorage.TRSCAN!=='0')) try {
        var trs_t0 = performance.now(), trs_done=false, trs_klass=0, trs_cur=0x10000>>>2;
        var TRS_NESTED_C = 0x9B4808, TRS_STEP = 0x40000, TRS_NAME='TrophyRoadScreen';
        function trs_cstr(h8,p){ p=p>>>0; if(p<=0x10000) return ''; var s='';
          for(var i=0;i<32;i++){ var c=h8[p+i]; if(!c) break; if(c<32||c>126) return ''; s+=String.fromCharCode(c);} return s; }
        var trs_iv = setInterval(function(){
          var now=(performance.now()-trs_t0).toFixed(0);
          try {
            var M = unityInstance && unityInstance.Module; if(!M) return;
            var h32=M.HEAPU32, h8=M.HEAPU8; if(!h32||!h8) return;
            var HL=h32.length, HLb=HL*4;
            function ok(p){ p=p>>>0; return p>0x10000 && p<HLb; }
            if (!trs_klass){
              var nk = h32[TRS_NESTED_C>>>2]>>>0;            if(!ok(nk)) return;   // <>c klass
              var sk = h32[(nk+0x28)>>>2]>>>0;               if(!ok(sk)) return;   // declaringType = screen klass
              var np = h32[(sk+0x08)>>>2]>>>0;
              var nm = ok(np) ? trs_cstr(h8,np) : '(badptr)';
              if (nm!==TRS_NAME){ console.warn('%c[TRSCAN] klass name mismatch ("'+nm+'") — build/offsets differ, abort','color:#f44'); clearInterval(trs_iv); return; }
              trs_klass = sk;
              console.log('%c[TRSCAN] TrophyRoadScreen klass=0x'+sk.toString(16)+' (via <>c.declaringType) — scanning heap for live instance','color:#0bf');
            }
            var end = Math.min(trs_cur+TRS_STEP, HL), inst=0;
            for (var w=trs_cur; w<end; w++){ if (h32[w]===trs_klass){ inst=w*4; break; } }
            trs_cur = end;
            if (!inst){
              if (trs_cur>=HL && !trs_done){ trs_done=true;
                console.log('%c[TRSCAN] INSTANCE NOT FOUND (full heap scanned). klass=0x'+trs_klass.toString(16)+
                  '\n  => R1 CONFIRMED: no live TrophyRoadScreen object exists. OnEnable/DBLLLABDEHI/DMJELOOMNMM never run.'+
                  '\n  => Reward strip + bottom bar empty because the SCREEN COMPONENT was never built into the bundle (asset gap), NOT a render bug.',
                  'color:#fc0;font-weight:bold');
                clearInterval(trs_iv);
              }
              return;
            }
            clearInterval(trs_iv); trs_done=true;
            function rd(o){ return h32[(inst+o)>>>2]>>>0; }
            var cached=rd(0x8), listPtr=rd(0x30), prefab=rd(0x34), content=rd(0x18);
            var poolSize = ok(listPtr) ? (h32[(listPtr+0xc)>>>2]|0) : -1;
            var verdict = (cached===0) ? 'R1: instance exists but m_CachedPtr=0 (Unity-destroyed) — populate never rendered'
                        : (poolSize<=0) ? 'R1: live instance but _trophyRoadTierItems._size='+poolSize+' (empty) and no AOOR => DMJELOOMNMM/foreach never ran'
                        : 'R2: pool _size='+poolSize+' tiles created — invisible => layout/prefab geometry';
            console.log('%c[TRSCAN] INSTANCE FOUND @0x'+inst.toString(16)+' klass=0x'+trs_klass.toString(16)+
              ' m_CachedPtr='+(cached?'0x'+cached.toString(16):'0(DESTROYED)')+
              ' poolSize='+poolSize+' prefab='+(ok(prefab)?'set':'NULL')+' _contentGrid='+(ok(content)?'set':'NULL')+
              '\n  '+verdict, (cached===0||poolSize<=0)?'color:#fc0;font-weight:bold':'color:#0f8;font-weight:bold');
          } catch(e){ console.log('[TRSCAN] err '+e); clearInterval(trs_iv); }
        }, 700);
        console.log('%c[TRSCAN] installed — bounded heap scan for live TrophyRoadScreen (toggle off: localStorage.TRSCAN=0)','color:#0bf');
      } catch(e){ console.warn('[TRSCAN] setup failed:', e); }

      // === FPDL-FORCE === DIAGNOSTIC TEST (2026-05-31): the splash blocker _didGetPlayerInfo (LSM+0x6d)
      // is set by FirebaseManager.FinishedDataFetch (FB_SF+4), which fires ONLY from GetPlayerFullData.
      // GetPlayerFullData runs in Connector.Start only `if (FetchPlayerDataOnNextLoad)`, which is false
      // on a fresh boot (set only after purchases) — so FinishedDataFetch never fires → splash hangs.
      // This probe writes Connector.FetchPlayerDataOnNextLoad=true continuously so Connector.Start calls
      // GetPlayerFullData on boot → fires FinishedDataFetch → should flip _didGetPlayerInfo. PURPOSE:
      // confirm the Ghidra-derived chain (one reload). Connector class cell = 0x9ac0d0 (Ghidra
      // add_OnGameStarted); static_fields = *(classPtr+0x5c); FetchPlayerDataOnNextLoad = byte @ +0xc.
      // DISABLED 2026-06-01: this whole test rests on the off-by-one mislabel "_didGetPlayerInfo @LSM+0x6d"
      // — but +0x6d is REALLY _didGetChallengesInfo (Ghidra setter BJLDJGDKLGN→+0x6d, il2cpp.h confirmed).
      // The real boot blocker was challenges (fixed via are_challenges_enabled=true), NOT player-data.
      // Forcing FetchPlayerDataOnNextLoad=true on a guest boot fetches full player data → makes the menu
      // look "logged-in" (the user's UI complaint) and is a behaviour-changing crutch. Now opt-in only.
      if (window._FORCE_FPDL === true) try {
        var ff_n = 0, ff_logged = false;
        var ff_iv = setInterval(function(){
          try {
            var M = unityInstance && unityInstance.Module; if (!M) return;
            var h32 = M.HEAPU32, h8 = M.HEAPU8; if (!h32 || !h8) return;
            var HL = h32.length*4;
            var cp = h32[0x9ac0d0>>>2]>>>0; if (cp<=0x10000||cp>=HL) return;         // Connector classPtr
            var sf = h32[(cp+0x5c)>>>2]>>>0; if (sf<=0x10000||sf>=HL) return;          // static_fields
            var off = sf + 0xc;                                                         // FetchPlayerDataOnNextLoad
            var cur = h8[off];
            h8[off] = 1;                                                                // force true
            if (!ff_logged) {
              ff_logged = true;
              console.log('%c[FPDL-FORCE] Connector classPtr=0x'+cp.toString(16)+' static_fields=0x'+sf.toString(16)+' FetchPlayerDataOnNextLoad was='+cur+' -> set 1 (IsPlayingAgain@+0xd='+h8[sf+0xd]+')', 'color:#f0f;font-weight:bold');
            }
            ff_n++;
            if (ff_n > 200) { clearInterval(ff_iv); console.log('[FPDL-FORCE] stop after '+ff_n+' writes'); }  // ~60s
          } catch(e){ if(ff_n<2){console.log('[FPDL-FORCE] err '+e);ff_n++;} }
        }, 300);
        console.log('%c[FPDL-FORCE] installed — forcing Connector.FetchPlayerDataOnNextLoad=true (test)', 'color:#f0f');
      } catch (e) { console.warn('[FPDL-FORCE] setup failed:', e); }

      // === FIRE-FB-EVENTS === WEBGL-NATIVE decisive test (2026-06-01): on the live webgl runtime, fire
      // each FirebaseManager static event delegate (FB static_fields +0x00..+0x20, skip +0x10=Dict) one at
      // a time and check whether the loop-LSM's _didGetPlayerInfo (+0x6d) flips to 1. The event that flips
      // it IS the canonical source of _didGetPlayerInfo on WEBGL (no reliance on win2023 / Ghidra ICF).
      // IL2CPP Il2CppDelegate (32-bit): +0x8 method_ptr, +0xc invoke_impl(table idx), +0x10 target,
      // +0x14 method(MethodInfo*). Multicast Action invoke: tbl.get(invoke_impl)(deleg, method).
      // DISABLED 2026-06-01: behaviour-changing (fires FB delegates + resets +0x6c byte) AND built on the
      // off-by-one "_didGetPlayerInfo @+0x6d" mislabel (+0x6d is _didGetChallengesInfo). Corrupts runtime
      // state — must stay OFF. Now opt-in only.
      if (window._FIRE_FB4 === true) try {
        setTimeout(function(){
          try {
            var M = unityInstance && unityInstance.Module; if (!M) { console.log('[FIRE-FB] no Module'); return; }
            var h32 = M.HEAPU32, h8 = M.HEAPU8, HL = h32.length*4;
            var tbl = (M.asm && M.asm.__indirect_function_table instanceof WebAssembly.Table) ? M.asm.__indirect_function_table
                    : (M.wasmTable instanceof WebAssembly.Table ? M.wasmTable : null);
            if (!tbl && M.asm) { for (var k in M.asm){ try{ if(M.asm[k] instanceof WebAssembly.Table){ tbl=M.asm[k]; break; } }catch(e){} } }
            if (!tbl) { console.warn('[FIRE-FB] no wasm table'); return; }
            // FB static_fields
            var fcp = h32[0x9ad118>>>2]>>>0; if (fcp<=0x10000||fcp>=HL){ console.warn('[FIRE-FB] FB class unresolved'); return; }
            var fb = h32[(fcp+0x5c)>>>2]>>>0; if (fb<=0x10000||fb>=HL){ console.warn('[FIRE-FB] FB static_fields unresolved'); return; }
            // loop LSM instance = located instance with _loadingJobs populated (njobs>0)
            function loopLsm(){
              var ins = window.__lsmInsts||[];
              for (var i=0;i<ins.length;i++){ var lst=h32[(ins[i]+0x44)>>>2]>>>0; var sz=(lst>0x10000&&lst<HL)?h32[(lst+0xc)>>>2]>>>0:0; if (sz>0&&sz<64) return ins[i]; }
              return ins[0]||0;
            }
            var lsm = loopLsm();
            if (!lsm){ console.warn('[FIRE-FB] no loop LSM located yet'); return; }
            var before = h8[lsm+0x6d];
            // SELF-VERIFY: reset +0x6c (_didInitFirebase, ← OnUserAuthorized=FB+0x14 per il2cpp map) to 0.
            // If firing FB+0x14 flips it back to 1 → the invoke mechanism WORKS (so _didGetPlayerInfo simply
            // is NOT an FB static event). If it stays 0 → our invoke is a no-op (wrong call convention).
            h8[lsm+0x6c] = 0;
            console.log('%c[FIRE-FB] start: loop LSM=0x'+lsm.toString(16)+' _didGetPlayerInfo(+0x6d) before='+before+' | SELF-VERIFY reset +0x6c(InitFirebase)=0 FB.sf=0x'+fb.toString(16), 'color:#0ff;font-weight:bold');
            function sfOf(cell){ var cp=h32[cell>>>2]>>>0; if(cp<=0x10000||cp>=HL)return 0; var s=h32[(cp+0x5c)>>>2]>>>0; return (s>0x10000&&s<HL)?s:0; }
            // READ-ONLY delegate-walk: walk each event's invocation list (MulticastDelegate.delegates@+0x3c,
            // entries are Delegate* with method_ptr@+0x8 = table index, m_target@+0x10). Match the table
            // index of each LSM _did setter → definitively map which event carries BJLDJGDKLGN(+0x6d).
            var TARGETS = {107483:'PNLDCHECEMN+0x6c(InitFb)',107484:'★BJLDJGDKLGN+0x6d(GetPlayerInfo)',107485:'CCNOLPPJFJA+0x6f(AvailRegions)',
              107487:'JKKLLOBBGMC+0x6b(SignIn)',107488:'IKNEMGBKLHA+0x69',107489:'MDMKOIMILNP+0x71(ValidateRegion)',
              107490:'BGMOELIGNIF+0x72(AddrDownload)',107491:'FOCONPBHDPL',107503:'COCNHCHMLAF',107504:'AGCPIIKAKPO',26292:'OBCNBMPMNHD'};
            // returns [method_ptr, m_target, delegateObjPtr] per entry (single or multicast list)
            function walkDeleg(deleg){
              var out=[]; if(deleg<=0x10000||deleg>=HL) return out;
              var arr=h32[(deleg+0x3c)>>>2]>>>0;
              if(arr>0x10000&&arr<HL){ var n=h32[(arr+0xc)>>>2]>>>0; if(n>0&&n<256){ for(var i=0;i<n;i++){ var d=h32[(arr+0x10+i*4)>>>2]>>>0; if(d>0x10000&&d<HL) out.push([h32[(d+0x8)>>>2]>>>0, h32[(d+0x10)>>>2]>>>0, d]); } return out; } }
              out.push([h32[(deleg+0x8)>>>2]>>>0, h32[(deleg+0x10)>>>2]>>>0, deleg]); return out;
            }
            // Directly invoke ONE closed delegate (entry) — its invoke_impl@+0xc with (entry) runs
            // method_ptr(m_target). Used to deliver FB+8 to the loop LSM's BJLDJGDKLGN specifically
            // (bypasses multicast partial-execution). DECISIVE: does a late delivery set +0x6d + clear splash?
            function invokeEntry(d){
              var inv=h32[(d+0xc)>>>2]>>>0; if(!(inv>0&&inv<((tbl&&tbl.length)||0))) return 'bad-inv';
              var fn; try{fn=tbl.get(inv);}catch(e){return 'getthrew';} if(typeof fn!=='function') return 'nofn';
              try{fn(d,0);return 'ok2';}catch(e1){try{fn(d);return 'ok1';}catch(e2){return 'threw';}}
            }
            // ALL event sources the LSM subscribes (from Ghidra v9 subscribe-body accessor static cells).
            // Each: [classCell, eventOffsetInStaticFields, label]. The one whose fire flips +0x6d wins.
            var SRC = [
              [0x9ad118,0x00,'FB+0'],[0x9ad118,0x04,'FB+4'],[0x9ad118,0x08,'FB+8(FinishedDataFetch)'],[0x9ad118,0x0c,'FB+0xc'],
              [0x9ad118,0x14,'FB+0x14(OnUserAuthorized)'],[0x9ad118,0x18,'FB+0x18'],[0x9ad118,0x20,'FB+0x20'],
              [0x9abde8,0x14,'ChallengesMgr+0x14'],
              [0x9af4b0,0x04,'NHGAGJMBLCP+4'],[0x9af4b0,0x00,'NHGAGJMBLCP+0'],[0x9af4b0,0x08,'NHGAGJMBLCP+8'],
              [0x9ac440,0x04,'DNJOOLIKCKH+4'],[0x9ac440,0x00,'DNJOOLIKCKH+0'],[0x9ac440,0x08,'DNJOOLIKCKH+8'],
              [0x9ab3d0,0x04,'AddrHandler+4'],
              [0x9af820,0x00,'AppInit+0'],[0x9af820,0x04,'AppInit+4'],[0x9af820,0x08,'AppInit+8'],
              [0x9a664c,0x04,'DailyRewards+4'],[0x9a664c,0x00,'DailyRewards+0']
            ];
            for (var si=0; si<SRC.length; si++){
              var cell=SRC[si][0], off=SRC[si][1], lbl=SRC[si][2];
              var sfx=sfOf(cell); if(!sfx){ console.log('[FIRE-FB]  '+lbl+' = class unresolved'); continue; }
              var deleg = h32[(sfx+off)>>>2]>>>0;
              if (deleg<=0x10000 || deleg>=HL) { console.log('[FIRE-FB]  '+lbl+' = null'); continue; }
              var entries = walkDeleg(deleg);
              // Report which known LSM setters are in this event's list + whether targeting the loop LSM.
              // ★ RUNTIME IDX SHIFT = +1 (confirmed by DIAG scan: tbl[107485] sets +0x6d). The delegate's
              // method_ptr is a runtime table idx = Ghidra/script.json idx + 1. So match TARGETS[mp-1].
              var hits=[];
              for (var ei=0; ei<entries.length; ei++){ var mp=entries[ei][0], tg=entries[ei][1];
                var nm=TARGETS[mp-1]; if(nm) hits.push(nm+(tg===lsm?'@LOOP':'@0x'+tg.toString(16))); }
              var isPlayerInfo = entries.some(function(e){return e[0]===107485 && e[1]===lsm;}); // BJLDJGDKLGN runtime idx
              console.log('%c[FIRE-FB]  '+lbl+' ('+entries.length+' subs) setters=['+hits.join(', ')+']',
                          isPlayerInfo?'color:#0f8;font-weight:bold;font-size:14px':(hits.length?'color:#0bf':'color:#777'));
              if (isPlayerInfo) {
                console.log('%c[FIRE-FB] ★★★ FOUND: _didGetPlayerInfo(BJLDJGDKLGN) is subscribed to '+lbl+' ★★★','color:#0f8;font-weight:bold;font-size:16px');
                for (var fe=0; fe<entries.length; fe++){
                  var mpx=entries[fe][0], tgx=entries[fe][1];
                  console.log('%c[FIRE-FB]    ['+fe+'] method_ptr='+mpx+' (Ghidra '+(mpx-1)+'='+(TARGETS[mpx-1]||'?')+') target=0x'+tgx.toString(16)+(tgx===lsm?'=LOOP-LSM':''),'color:#0bf');
                }
                // DIAG_CALL_BJ: directly invoke BJLDJGDKLGN's delegate-entry (its method_ptr=107484 with
                // m_target=loopLSM, method) — bypassing C# multicast iteration. DECISIVE: if +0x6d flips →
                // entry valid, multicast invoke is broken; if not → entry dead/wrong-target. Opt-in.
                if (window.localStorage && localStorage.getItem('DIAG_CALL_BJ')==='1') {
                  // RUNTIME-IDX SHIFT SCAN: Ghidra says +0x6d setter = idx 107484, but direct call didn't work
                  // → runtime table idx != script.json idx. Scan a window of idxs, call each on loopLSM, find
                  // which one flips +0x6d (and log which byte 0x68-0x75 each touches). Establishes the shift.
                  console.log('%c[FIRE-FB] ★ DIAG idx-shift scan (loopLSM=0x'+lsm.toString(16)+'): finding runtime idx that sets +0x6d (Ghidra=107484)','color:#fc0;font-weight:bold');
                  for (var ti=107478; ti<=107494; ti++){
                    var snap=[]; for (var bb=0x68; bb<=0x75; bb++) snap.push(h8[lsm+bb]);
                    var fn3; try{ fn3=tbl.get(ti); }catch(e){ continue; }
                    if (typeof fn3!=='function') continue;
                    try{ fn3(lsm,0); }catch(e1){ try{ fn3(lsm); }catch(e2){ continue; } }
                    var changed=[]; for (var bb2=0x68; bb2<=0x75; bb2++){ if (h8[lsm+bb2]!==snap[bb2-0x68]) changed.push('0x'+bb2.toString(16)+'('+snap[bb2-0x68]+'→'+h8[lsm+bb2]+')'); }
                    if (changed.length) console.log('%c[FIRE-FB]   idx '+ti+' (Ghidra '+(ti-1)+'..'+ti+') → changed bytes: '+changed.join(', '),'color:#0bf');
                    if (h8[lsm+0x6d]===1){ console.log('%c[FIRE-FB] ★★★ idx '+ti+' SETS +0x6d (_didGetPlayerInfo)! shift vs Ghidra-107484 = '+(ti-107484)+' ★★★','color:#0f8;font-weight:bold;font-size:15px'); break; }
                  }
                }
              }
            }
            console.log('%c[FIRE-FB] walk done. (if no ★FOUND: BJLDJGDKLGN is on a class not in SRC — widen search)', 'color:#fc0;font-weight:bold');
          } catch(e){ console.warn('[FIRE-FB] err', e); }
        }, 13000);
        console.log('%c[FIRE-FB] armed — will fire FB events at 13s to find _didGetPlayerInfo source (webgl-native)', 'color:#0ff');
      } catch (e) { console.warn('[FIRE-FB] setup failed:', e); }

      // === FB8-TIMELINE === periodic monitor (every 1.5s ~30s): track loop-LSM address + its +0x6d +
      // whether BJLDJGDKLGN(idx 107484) is subscribed to FB+8 targeting it, OVER TIME. Reveals whether the
      // FB+8 fire (~12.3s, GetUserData done) is MISSED due to subscribe-vs-fire race or LSM recreation.
      if (window._FB8TL === true) try {   // DISABLED 2026-06-01: read-only but noisy + built on the disproven FB+8/"+0x6d=GetPlayerInfo" off-by-one premise. Opt-in only.
        var fb8n = 0;
        var fb8iv = setInterval(function(){
          try {
            var M = unityInstance && unityInstance.Module; if (!M) return;
            var h32 = M.HEAPU32, h8 = M.HEAPU8, HL = h32.length*4;
            var fcp = h32[0x9ad118>>>2]>>>0; if (fcp<=0x10000||fcp>=HL) return;
            var fb = h32[(fcp+0x5c)>>>2]>>>0; if (fb<=0x10000||fb>=HL) return;
            var ins = window.__lsmInsts||[], lsm=0;
            for (var i=0;i<ins.length;i++){ var lst=h32[(ins[i]+0x44)>>>2]>>>0; var sz=(lst>0x10000&&lst<HL)?h32[(lst+0xc)>>>2]>>>0:0; if (sz>0&&sz<64){ lsm=ins[i]; break; } }
            var d8 = h32[(fb+0x8)>>>2]>>>0, bjOn='no', nsub=0;
            if (d8>0x10000&&d8<HL){
              var arr=h32[(d8+0x3c)>>>2]>>>0, ents=[];
              if(arr>0x10000&&arr<HL){ var n=h32[(arr+0xc)>>>2]>>>0; if(n>0&&n<256){ nsub=n; for(var j=0;j<n;j++){ var d=h32[(arr+0x10+j*4)>>>2]>>>0; if(d>0x10000&&d<HL) ents.push([h32[(d+8)>>>2]>>>0,h32[(d+0x10)>>>2]>>>0]); } } }
              else { nsub=1; ents.push([h32[(d8+8)>>>2]>>>0, h32[(d8+0x10)>>>2]>>>0]); }
              for (var e=0;e<ents.length;e++){ if(ents[e][0]===107484){ bjOn=(ents[e][1]===lsm)?'YES@LOOP':('yes@0x'+ents[e][1].toString(16)); break; } }
            }
            var d6d = lsm?h8[lsm+0x6d]:-1;
            // HDCJGIENLPB-ran probe: FB.Instance = *(fb+0x24); HGIINAACNEF(token-refresh coroutine handle)
            // = *(Instance+0x40), written by HDCJGIENLPB(0x81BAA076) JUST BEFORE the unconditional FB+8 fire.
            // If coro!=0 → HDCJGIENLPB ran (CheckIfConnected continuation executed). If 0 → it stalled after MKOFLHJKEML.
            var fbInst = h32[(fb+0x24)>>>2]>>>0; var hcoro = (fbInst>0x10000&&fbInst<HL)?(h32[(fbInst+0x40)>>>2]>>>0):0;
            var hdcRan = (hcoro>0x10000&&hcoro<HL)?1:0;
            // Detect the +0x6d flip moment + correlate with minimize (document.hidden). DECISIVE:
            // flip soon-after-restore = deferred-drain (queued fire drained); flip after long delay = offline-fallback.
            if (d6d===1 && !window.__d6dFlipped){ window.__d6dFlipped=true;
              console.log('%c[FB8-TL] ★★★ +0x6d FLIPPED to 1 at t='+Math.round(performance.now())+'ms (hidden='+document.hidden+') — FB+8 finally delivered / flag set ★★★','color:#0f8;font-weight:bold;font-size:15px'); }
            console.log('%c[FB8-TL] t='+Math.round(performance.now())+'ms hidden='+document.hidden+' +0x6d='+d6d+' HDCJGIENLPB-ran='+hdcRan+'(coro=0x'+hcoro.toString(16)+') FB+8.subs='+nsub+' BJLDJGDKLGN-on-FB8='+bjOn,
                        d6d===1?'color:#0f8;font-weight:bold':'color:#888');
            if (++fb8n > 240) clearInterval(fb8iv);   // ~6 min @1.5s — long enough to capture minimize→restore
          } catch(e){}
        }, 1500);
      } catch(e){}

      // === ADDR_HOOK === Addressables runtime function-table logging.
      // 2026-05-28 DISABLED: the trampoline-wrapping of Addressables provider/load funcs turned
      // out to be a CONFOUND — it breaks Addressables completion and hangs the boot even with
      // offers=null (0 Photon pings, never reaches MainMenu). So its "identical loads" / "localization
      // sprite" findings were artifacts of the hook itself. Gated off; re-enable only via flag for
      // narrow experiments (e.g. wrap LoadAssetAsync only, NOT providers).
      if (window._ADDR_HOOK_ENABLE) try {
        var M = unityInstance.Module;
        // Locate the wasm function Table: scan exports (Module.asm) for a WebAssembly.Table.
        var tbl = null;
        var cand = [];
        if (M && M.asm && M.asm.__indirect_function_table instanceof WebAssembly.Table) { tbl = M.asm.__indirect_function_table; }
        if (!tbl && M && M.wasmTable instanceof WebAssembly.Table) { tbl = M.wasmTable; }
        if (!tbl && M && M.asm) {
          for (var k in M.asm) { try { if (M.asm[k] instanceof WebAssembly.Table) { cand.push(k); if (!tbl) tbl = M.asm[k]; } } catch (e) {} }
        }
        // Funcref factory: Emscripten addFunction if present, else a hand-built trampoline
        // wasm module (only needs WebAssembly.Module/Instance — always available). The
        // trampoline forwards N i32 params (void return) to an imported JS function.
        var addFn = (M && M.addFunction) || (typeof addFunction !== 'undefined' ? addFunction : null);
        if (!tbl) {
          console.warn('%c[ADDR_HOOK] unavailable — no wasm Table found (candidates=[' + cand.join(',') + '])', 'color:#f80');
          console.warn('[ADDR_HOOK] Module.asm export keys: ' + (M && M.asm ? Object.keys(M.asm).slice(0,60).join(',') : 'none'));
        } else {
          console.log('%c[ADDR_HOOK] table found (size=' + tbl.length + ', via=' + (cand.length?cand.join('/'):'__indirect_function_table') + '), funcref=' + (addFn?'addFunction':'trampoline-wasm'), 'color:#0bf');
          var _aT0 = performance.now();
          var H32 = M.HEAP32 || new Int32Array(M.HEAPU8.buffer);
          var HU16 = M.HEAPU16 || new Uint16Array((M.HEAP32||M.HEAPU8).buffer);
          // Build a wasm module: (import "e" "f" (func (param i32*n)(result?))) (func (export "w") forward-to-f)
          // Supports n i32 params + optional i32 return ('viiii' -> void, 'iii' -> returns i32).
          function buildTrampoline(n, jsfn, hasRet) {
            var i32 = 0x7f;
            var typeSec = [0x01, 0x60, n]; for (var a=0;a<n;a++) typeSec.push(i32);
            if (hasRet) { typeSec.push(0x01, i32); } else { typeSec.push(0x00); }
            var importSec = [0x01, 0x01,0x65, 0x01,0x66, 0x00, 0x00]; // "e"."f" func type0
            var funcSec = [0x01, 0x00];
            var exportSec = [0x01, 0x01,0x77, 0x00, 0x01]; // "w" func index1
            var body = [0x00]; for (var b=0;b<n;b++){ body.push(0x20,b); } body.push(0x10,0x00,0x0b);
            var codeSec = [0x01, body.length].concat(body);
            function sec(id, c){ return [id, c.length].concat(c); }
            var bytes = [0x00,0x61,0x73,0x6d, 0x01,0x00,0x00,0x00]
              .concat(sec(1,typeSec)).concat(sec(2,importSec)).concat(sec(3,funcSec))
              .concat(sec(7,exportSec)).concat(sec(10,codeSec));
            var mod = new WebAssembly.Module(new Uint8Array(bytes));
            var inst = new WebAssembly.Instance(mod, { e: { f: jsfn } });
            return inst.exports.w;
          }
          function mkFuncref(fn, sig) {
            if (addFn) { var ni = addFn(fn, sig); return tbl.get(ni); }
            return buildTrampoline(sig.length - 1, fn, sig[0] !== 'v'); // 'viiii'->void, 'iii'->ret i32
          }
          // LIVE heap views — Unity swaps Module.HEAP32 on memory growth, so re-fetch each call
          // (captured views become detached/stale after growth → all reads return undefined).
          function liveH32() { return M.HEAP32; }
          function liveHU16() { return M.HEAPU16 || new Uint16Array(M.HEAP32.buffer); }
          // Best-effort IL2CPP System.String decode. Layout: header(8) + _stringLength@8 + chars@12.
          function il2str(p) {
            if (!p || p < 1024) return null;
            var h32 = liveH32(); if (p > (h32.length << 2)) return null;
            var hu16 = liveHU16();
            for (var ho = 0, offs = [8,16]; ho < offs.length; ho++) {
              try {
                var len = h32[(p + offs[ho]) >> 2];
                if (len > 0 && len < 256) {
                  var base = p + offs[ho] + 4, s = '', ok = true;
                  for (var i = 0; i < len; i++) {
                    var c = hu16[(base + 2*i) >> 1];
                    if (c < 0x20 || c > 0x7e) { ok = false; break; }
                    s += String.fromCharCode(c);
                  }
                  if (ok && s.length === len) return s;
                }
              } catch (e) {}
            }
            return null;
          }
          // Read a string field at object+off (after deref).
          function strAt(p, off) {
            try { return il2str(liveH32()[(p + off) >> 2]); } catch (e) { return null; }
          }
          // Collect decodable strings from an object: itself + pointer fields (up to `depth`
          // levels deep). Depth 2 reaches e.g. ProvideHandle -> IResourceLocation -> m_InternalId
          // (the .bundle path) and table -> shared-data -> name.
          function deepStrings(p, depth, found, seen) {
            found = found || []; seen = seen || {};
            if (!p || p < 1024 || seen[p] || found.length > 12) return found;
            seen[p] = 1;
            if (depth === undefined) depth = 2;
            var self = il2str(p); if (self && found.indexOf(self) < 0) found.push(self);
            var h = liveH32();
            for (var off = 8; off <= 72; off += 4) {
              try {
                var v = h[(p + off) >> 2];
                if (!v || v < 1024) continue;
                var s = il2str(v);
                if (s) { if (found.indexOf(s) < 0) found.push(s); }
                else if (depth > 1) deepStrings(v, depth - 1, found, seen);
              } catch (e) {}
            }
            return found;
          }
          function decodeArgs(args) {
            var out = [];
            for (var i = 0; i < args.length; i++) {
              var ss = deepStrings(args[i]);
              if (ss.length) out.push('arg' + i + '=[' + ss.join('|') + ']');
            }
            return out.length ? out.join(' ') : '(no strings; ptrs=' + Array.prototype.join.call(args, ',') + ')';
          }
          // 2026-05-28: providers (Provide/Start) are the critical bundle-load path — wrapping
          // them broke boot. Try LoadAssetAsync-only (higher level) — may survive boot and still
          // reveal the load keys for a CLEAN hang-vs-boot diff.
          // LSM_FLAG_PROBE: hook LoadingScreenManager.<ProgressLoading>b__0 (func 95214, table 107508,
          // sig 'iii' = (closure,?) -> bool), the per-frame WaitUntil predicate. arg0=closure with
          // ptr fields {job (LoadingJob), <>4__this (LSM)}. We scan the LSM object for the run of 13
          // consecutive bool bytes (HHCMMNOKEIC + 12 _did*) and report which are set/unset. Throttled
          // (heavy read every ~45 calls) to avoid per-frame timing interference. Forwards return exactly.
          var FLAG_NAMES = ['(misc)','_didGetRemoteConfig','_didSignIn','_didInitFirebase','_didGetPlayerInfo',
            '_didGetChallengesInfo','_didGetAvailableRegions','_didConnectToPhoton','_didValidateRegion',
            '_didFinishAddressableDownload','_didInitializeLocalization','_didFinishAgeGate','_didAcceptPrivacy'];
          function findBoolRun(p) {
            // scan object bytes for the longest run of {0,1} of length >=13
            try {
              var h8 = M.HEAPU8 || new Uint8Array(M.HEAP32.buffer);
              var best = null;
              for (var off = 16; off <= 300; off++) {
                var n = 0;
                while (off + n <= 300) { var b = h8[p + off + n]; if (b === 0 || b === 1) n++; else break; }
                if (n >= 13 && (!best || n > best.len)) best = { off: off, len: n };
                off += n;
              }
              if (best) { var arr = []; for (var i = 0; i < best.len; i++) arr.push(h8[p + best.off + i]); return { off: best.off, bytes: arr }; }
            } catch (e) {}
            return null;
          }
          function probeLSM(closure) {
            var h = liveH32();
            // closure ptr fields (after 8-byte header): try +8 and +12 for job & LSM
            var cands = [];
            for (var o = 8; o <= 16; o += 4) { var v = h[(closure + o) >> 2]; if (v > 1024) cands.push(v); }
            var jobName = null, lsmReport = null;
            cands.forEach(function(ptr) {
              // job: has BoolToCheck string
              var ss = deepStrings(ptr, 1);
              ss.forEach(function(s){ if (/^_did|misc/.test(s)) jobName = s; });
              // LSM: has the 13-bool run
              if (!lsmReport) { var r = findBoolRun(ptr); if (r) lsmReport = r; }
            });
            return { jobName: jobName, run: lsmReport };
          }
          var targets = [
            { idx: 107508, sig: 'iii', name: 'LSM.WaitUntil' }
          ];
          var installed = 0;
          targets.forEach(function(t) {
            try {
              var orig = tbl.get(t.idx);
              if (typeof orig !== 'function') { console.warn('[ADDR_HOOK] slot ' + t.idx + ' (' + t.name + ') not a function'); return; }
              (function(t, orig) {
                var n = 0, lastReport = null;
                var wrapped = function() {
                  try {
                    if ((n++ % 45) === 0) {
                      var pr = probeLSM(arguments[0]);
                      var rep = '';
                      if (pr.run) {
                        var parts = [];
                        for (var i = 0; i < pr.run.bytes.length && i < FLAG_NAMES.length; i++)
                          parts.push((pr.run.bytes[i] ? '1' : '0') + ':' + FLAG_NAMES[i]);
                        rep = 'flags[off' + pr.run.off + ' len' + pr.run.bytes.length + ']=' + parts.join(' ');
                      } else rep = 'no-bool-run';
                      var line = 'job=' + (pr.jobName || '?') + ' | ' + rep;
                      if (line !== lastReport) {
                        lastReport = line;
                        console.log('%c[LSM] +' + (performance.now() - _aT0).toFixed(0) + 'ms ' + line, 'color:#0bf;font-weight:bold');
                      }
                    }
                  } catch (e) {}
                  return orig.apply(null, arguments);
                };
                tbl.set(t.idx, mkFuncref(wrapped, t.sig));
              })(t, orig);
              installed++;
            } catch (e) { console.warn('[ADDR_HOOK] failed to wrap ' + t.name + ' @' + t.idx + ': ' + e.message); }
          });
          console.log('%c[ADDR_HOOK] installed ' + installed + '/' + targets.length + ' Addressables hooks', 'color:#0bf;font-weight:bold');
        }
      } catch (e) { console.warn('[ADDR_HOOK] install error:', e); }

      // === LSM_PROBE === LoadingScreenManager byte-watcher.
      // 2026-05-26 evening: DISABLED. STATIC_PTR 0x9AF358 was probing the wrong class
      // (singleton ptr returned non-zero but field reads matched static_fields layout
      // of an unrelated class, not LoadingScreenManager_Fields instance). LSM has no
      // Instance singleton pattern (it's a MonoBehaviour found via scene reference)
      // so address lookup without wasm hooks is non-trivial. Rely on SendMessage trace
      // + fetch trace + console errors for boot diagnosis instead.
      if (false) {
      // Per il2cpp.h:84321 LoadingScreenManager_Fields layout:
      //   class_meta = *(0x9AF358)
      //   singleton  = *(class_meta + 92)
      //   field offsets from singleton ptr:
      //     +8..+104 — pointers/floats/coroutines/etc (skipped)
      //     +104 HHCMMNOKEIC  bool (unknown flag, watch it too)
      //     +105.._didGetRemoteConfig         (LoadingJob #1 "Getting remote config")
      //     +106.._didSignIn                  (LoadingJob #3 "Signing in")
      //     +107.._didInitFirebase            (LoadingJob #5 "Getting data")
      //     +108.._didGetPlayerInfo           (LoadingJob #4 "Getting data")
      //     +109.._didGetChallengesInfo       (NOT in _loadingJobs)
      //     +110.._didGetAvailableRegions     (LoadingJob #6 "Getting server list")
      //     +111.._didConnectToPhoton         (LoadingJob #7 "Connecting to server")
      //     +112.._didValidateRegion          (LoadingJob #8 "Getting data")
      //     +113.._didFinishAddressableDownload (LoadingJob #9 "Downloading Assets")
      //     +114.._didInitializeLocalization  (LoadingJob #2 "Initializing locales")
      //     +115.._didFinishAgeGate           (LoadingJob #10 "Updating player information")
      //     +116.._didAcceptPrivacy           (LoadingJob #11 "Privacy Notice")
      try {
        var STATIC_PTR = 10153368;       // 0x9AF358 — LoadingScreenManager static class metadata
        var INSTANCE_OFFSET = 92;        // *(class_meta + 92) = singleton instance
        var WATCH_OFFSETS = {
          104: 'HHCMMNOKEIC',
          105: '_didGetRemoteConfig            [job1]',
          106: '_didSignIn                     [job3]',
          107: '_didInitFirebase               [job5]',
          108: '_didGetPlayerInfo              [job4]',
          109: '_didGetChallengesInfo          [not-in-jobs]',
          110: '_didGetAvailableRegions        [job6]',
          111: '_didConnectToPhoton            [job7]',
          112: '_didValidateRegion             [job8]',
          113: '_didFinishAddressableDownload  [job9]',
          114: '_didInitializeLocalization     [job2]',
          115: '_didFinishAgeGate              [job10]',
          116: '_didAcceptPrivacy              [job11]'
        };
        var t0 = performance.now();
        var lastVal = {};
        var lastInstance = 0;
        var lastSnapshot = 0;
        var snapshotCount = 0;
        function hexDump(heap8, base, len) {
          var lines = [];
          for (var i = 0; i < len; i += 16) {
            var hex = [], asc = [];
            for (var j = 0; j < 16 && i+j < len; j++) {
              var b = heap8[base + i + j];
              hex.push(b.toString(16).padStart(2,'0'));
              asc.push(b >= 32 && b < 127 ? String.fromCharCode(b) : '.');
            }
            lines.push('  +0x' + i.toString(16).padStart(3,'0') + ': ' + hex.join(' ') + '  |' + asc.join('') + '|');
          }
          return lines.join('\n');
        }
        var probeInterval = setInterval(function() {
          try {
            var heap32 = unityInstance.Module.HEAPU32;
            var heap8 = unityInstance.Module.HEAPU8;
            var classPtr = heap32[STATIC_PTR >>> 2];
            if (!classPtr) return;
            var instancePtr = heap32[(classPtr + INSTANCE_OFFSET) >>> 2];
            if (!instancePtr) return;
            var now = (performance.now() - t0).toFixed(0);
            if (instancePtr !== lastInstance) {
              console.log('%c[LSM] singleton instance ptr = 0x' + instancePtr.toString(16) +
                          ' (class meta @ 0x' + classPtr.toString(16) + ') @' + now + 'ms', 'color:#fa0');
              lastInstance = instancePtr;
              lastVal = {};
              // Log initial values + initial hex dump
              var initial = [];
              for (var off in WATCH_OFFSETS) {
                var v = heap8[instancePtr + (+off)];
                lastVal[off] = v;
                initial.push('+' + off + '(' + WATCH_OFFSETS[off] + ')=' + v);
              }
              console.log('%c[LSM] INITIAL: ' + initial.join(', '), 'color:#0af');
              console.log('%c[LSM] hex dump (first 192 bytes of instance):\n' +
                          hexDump(heap8, instancePtr, 192), 'color:#888');
            } else {
              for (var off in WATCH_OFFSETS) {
                var v = heap8[instancePtr + (+off)];
                if (lastVal[off] !== v) {
                  console.log('%c[LSM] +' + off + ' (' + WATCH_OFFSETS[off] + '): ' +
                              lastVal[off] + ' → ' + v + ' @' + now + 'ms',
                              v === 1 ? 'color:#0f8' : 'color:#f80');
                  lastVal[off] = v;
                }
              }
            }
            // Periodic snapshot every 5s (even if nothing changed)
            if (performance.now() - lastSnapshot > 5000 && snapshotCount < 12) {
              lastSnapshot = performance.now();
              snapshotCount++;
              var snap = [];
              for (var off in WATCH_OFFSETS) snap.push('+'+off+'='+heap8[instancePtr + (+off)]);
              console.log('%c[LSM] SNAPSHOT#' + snapshotCount + ' @' + now + 'ms: ' + snap.join(' '), 'color:#08f');
            }
            // Stop after 12 snapshots (~60s) — long enough to observe all flag transitions in baseline.
            if (snapshotCount >= 12) {
              clearInterval(probeInterval);
              // Final summary line: which jobs flipped vs remain stuck
              var jobs = [
                [105,'job1 _didGetRemoteConfig'],[114,'job2 _didInitializeLocalization'],
                [106,'job3 _didSignIn'],[108,'job4 _didGetPlayerInfo'],
                [107,'job5 _didInitFirebase'],[110,'job6 _didGetAvailableRegions'],
                [111,'job7 _didConnectToPhoton'],[112,'job8 _didValidateRegion'],
                [113,'job9 _didFinishAddressableDownload'],
                [115,'job10 _didFinishAgeGate'],[116,'job11 _didAcceptPrivacy']
              ];
              var doneJobs = [], stuckJobs = [];
              jobs.forEach(function(j) {
                if (lastVal[j[0]] === 1) doneJobs.push(j[1]); else stuckJobs.push(j[1]);
              });
              console.log('%c[LSM] FINAL @' + now + 'ms — DONE: ' + (doneJobs.length||'none') +
                          (doneJobs.length ? ' (' + doneJobs.join(', ') + ')' : '') +
                          ' — STUCK: ' + (stuckJobs.length||'none') +
                          (stuckJobs.length ? ' (' + stuckJobs.join(', ') + ')' : ''),
                          'color:#0f8;font-weight:bold');
            }
          } catch (e) { /* ignore — heap may be in odd state */ }
        }, 100);
      } catch (e) { console.warn('[LSM] probe setup failed:', e); }
      } // end if(false) — LSM probe disabled 2026-05-26
      // Catch any wasm/JS-level RuntimeError that follows splash dismissal
      var _startT0 = performance.now();

      // === FETCH TRACE 2026-05-26 ===
      // Ring buffer of last 200 fetch URLs with timestamps. On wasm OOB we
      // dump it so we can see the last Addressables bundle/asset URL that
      // triggered the crash. Lives only in index.html (no client/wasm patch).
      var _fetchTrace = [];
      var _origFetch = window.fetch.bind(window);
      window.fetch = function(input, init) {
        var url = typeof input === 'string' ? input : (input && input.url) || String(input);
        var t = (performance.now() - _startT0).toFixed(0);
        _fetchTrace.push({ t: t + 'ms', url: url, status: 'pending' });
        if (_fetchTrace.length > 200) _fetchTrace.shift();
        var entry = _fetchTrace[_fetchTrace.length - 1];
        return _origFetch(input, init).then(function(r) {
          entry.status = r.status;
          return r;
        }).catch(function(err) {
          entry.status = 'err:' + (err && err.message || err);
          throw err;
        });
      };
      // Also intercept XMLHttpRequest (Unity UnityWebRequest uses XHR in WebGL)
      var _origXhrOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url) {
        try {
          var t = (performance.now() - _startT0).toFixed(0);
          _fetchTrace.push({ t: t + 'ms', url: 'XHR ' + method + ' ' + String(url).slice(0, 200), status: 'opening' });
          if (_fetchTrace.length > 200) _fetchTrace.shift();
          var entry = _fetchTrace[_fetchTrace.length - 1];
          this.addEventListener('load', function() { entry.status = this.status; });
          this.addEventListener('error', function() { entry.status = 'XHR-error'; });
        } catch (_) {}
        return _origXhrOpen.apply(this, arguments);
      };
      window._fetchTrace = _fetchTrace;
      // === END FETCH TRACE ===


      // === LOG INTERCEPTOR 2026-05-26 ===
      // Ring buffer of last 500 console messages (warn/error). When OOB or
      // InvalidKey fires we dump the buffer so we can see the managed stack
      // trace Unity printed BEFORE its handler kicked in.
      var _logBuffer = [];
      var _origConsole = {
        error: console.error.bind(console),
        warn: console.warn.bind(console),
        log: console.log.bind(console)
      };
      function _pushLog(level, args) {
        try {
          var t = (performance.now() - _startT0).toFixed(0);
          var msg = '';
          for (var i = 0; i < args.length; i++) {
            var a = args[i];
            if (typeof a === 'string') msg += a;
            else { try { msg += JSON.stringify(a).slice(0, 400); } catch(_) { msg += '<obj>'; } }
            if (i < args.length - 1) msg += ' ';
          }
          _logBuffer.push({ t: t + 'ms', level: level, msg: msg.slice(0, 1500) });
          if (_logBuffer.length > 500) _logBuffer.shift();
        } catch(_) {}
      }
      // ★2026-06-10 PERF: FMOD audio spam (failed createDSP/addDSP per weapon-pickup) tanked the main thread.
      // ★ROOT: emscripten routes it via `console.WARN` (framework: var err=Module.printErr||console.warn.bind),
      // not console.error — so an error-only filter missed it. Throttle FMOD on ALL THREE console methods
      // (error/warn/log) at the outermost hook: skip _pushLog AND the slow real console after the first few.
      // FMODLOG=1 to restore. The WASM DSP attempts are unchanged; only the (expensive) JS logging is dropped.
      var _fmodN = 0, _syncfsN = 0;
      function _isFmodSpam(args) {
        var a0 = args[0];
        if (typeof a0 === 'string' && a0.indexOf('FMOD returns error code') >= 0) {
          if (++_fmodN > 3) { try { return localStorage.getItem('FMODLOG') !== '1'; } catch(e){ return true; } }
        }
        // ★2026-06-12: FS.syncfs in-flight warnings — each renders a multi-thousand-frame async rAF stack
        // with DevTools open (~288k log lines/session) → in-match jank. Same throttle (SYNCFSLOG=1 restores).
        if (typeof a0 === 'string' && a0.indexOf('FS.syncfs operations in flight') >= 0) {
          if (++_syncfsN > 2) { try { return localStorage.getItem('SYNCFSLOG') !== '1'; } catch(e){ return true; } }
        }
        return false;
      }
      console.error = function() { if (_isFmodSpam(arguments)) return; _pushLog('ERR', arguments); _origConsole.error.apply(console, arguments); };
      console.warn  = function() { if (_isFmodSpam(arguments)) return; _pushLog('WRN', arguments); _origConsole.warn.apply(console, arguments); };
      console.log   = function() { if (_isFmodSpam(arguments)) return; _pushLog('LOG', arguments); _origConsole.log.apply(console, arguments); };
      window._logBuffer = _logBuffer;
      // === END LOG INTERCEPTOR ===

      window.addEventListener('error', function(ev) {
        try {
          var msg = String((ev.error && (ev.error.stack || ev.error.message)) || ev.message || '');
          if (msg.indexOf('null function') !== -1 || msg.indexOf('RuntimeError') !== -1) {
            _origConsole.error('%c[RUNTIME-ERR] @' + (performance.now() - _startT0).toFixed(0) + 'ms: ' + msg.slice(0, 800), 'color:#f00');
            // Dump last 30 fetches
            _origConsole.error('%c[FETCH-TRACE] Last 30 of ' + _fetchTrace.length + ' requests before OOB:', 'color:#f80;font-weight:bold');
            var last = _fetchTrace.slice(-30);
            for (var i = 0; i < last.length; i++) {
              _origConsole.error('  [' + last[i].t + ' ' + last[i].status + '] ' + last[i].url);
            }
            // Dump last 50 LOG/WRN/ERR messages BEFORE OOB
            _origConsole.error('%c[LOG-BUFFER] Last 50 of ' + _logBuffer.length + ' messages before OOB:', 'color:#f80;font-weight:bold');
            var lastLogs = _logBuffer.slice(-50);
            for (var i = 0; i < lastLogs.length; i++) {
              _origConsole.error('  [' + lastLogs[i].t + ' ' + lastLogs[i].level + '] ' + lastLogs[i].msg);
            }
          }
        } catch (_) {}
      }, true);
      // === END LSM_PROBE ===

      if (typeof window.onUnityReady === 'function') window.onUnityReady();
    }).catch(function(err) {
      errorBox.style.display = 'block';
      errorBox.textContent = 'Failed to start Unity:\n' + (err.message || err);
      console.error('[v446] Unity boot failed:', err);
    });

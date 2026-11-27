/*
 * Boot script for Login/login.html.
 *
 * login.html already referenced this file, but it was never committed, so the
 * page loaded with a 404. It now boots the site-wide Terms of Service gate,
 * which blocks the page until the visitor has read the terms and agreed.
 *
 * The gate itself lives in /JS/tos-gate.js.
 */
(function () {
  'use strict';

  if (window.__nxTosGateLoaded || document.getElementById('nx-tos-gate-loader')) return;

  var script = document.createElement('script');
  script.id = 'nx-tos-gate-loader';
  script.src = '../JS/tos-gate.js';
  (document.head || document.documentElement).appendChild(script);
})();

/*
 * Profanity filter loader.
 *
 * login.html still points at its old badword.js URL on jsDelivr
 * (gh/Null-X-Team/badwordfilter) - that repository no longer exists, jsDelivr
 * answers 404 and the browser refuses the text/plain error page, so
 * window.containsBadWords was never defined and every username check was
 * skipped. Load the maintained copy instead; it exports the same
 * window.containsBadWords / window.filterBadWords API the page expects.
 */
(function () {
  'use strict';

  if (typeof window.containsBadWords === 'function') return;
  if (document.querySelector('script[data-nx-badwords]')) return;

  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/gh/glaeesas/badwordfilter@main/badword.js';
  script.setAttribute('data-nx-badwords', '1');
  (document.head || document.documentElement).appendChild(script);
})();

/*
 * Server-side login.
 *
 * login.html used to GET /users?username=... and compare the password hash in
 * the browser. That meant the API had to hand out every account's password
 * hash to anyone who asked, which is the same as handing out the password.
 *
 * /users no longer returns passwords at all, so the page's own handleLogin
 * cannot work any more. This overrides it with the server-verified flow:
 * POST /login checks the hash on the worker, returns the user plus a signed
 * 12-hour session token, and the token is stored in localStorage for
 * BAN/guard.js to attach to privileged requests.
 *
 * The page's own handleSubmit() calls the global handleLogin by name, so
 * replacing it here is enough - login.html itself stays untouched.
 */
(function () {
  'use strict';

  var DEFAULT_API = 'https://apithingy.jlsniperelite4.workers.dev';
  var installed = false;

  function apiBase() {
    try {
      if (typeof TURSO_API_BASE !== 'undefined' && TURSO_API_BASE) return TURSO_API_BASE;
    } catch (e) {}
    return DEFAULT_API;
  }

  function jsonHeaders() {
    var base = { 'Content-Type': 'application/json' };
    try {
      if (typeof headers !== 'undefined' && headers) return Object.assign({}, headers, base);
    } catch (e) {}
    return base;
  }

  function say(message, isError) {
    if (typeof showMessage === 'function') return showMessage(message, isError === true ? undefined : false);
    console.warn(message);
  }

  async function hashPassword(value) {
    try {
      if (typeof sha256Hex === 'function') return await sha256Hex(value);
    } catch (e) {}
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  // Login accepts a display name or a @handler; /login resolves display names,
  // so a handler is mapped to its account first.
  async function resolveIdentifier(username, handler) {
    var name = String(username || '').trim();
    var handle = String(handler || '').trim();
    if (name) return name;
    if (!handle) return '';
    var withAt = handle.charAt(0) === '@' ? handle : '@' + handle;
    try {
      var res = await fetch(apiBase() + '/users?handler=' + encodeURIComponent(withAt), {
        method: 'GET',
        headers: jsonHeaders()
      });
      if (res.ok) {
        var row = await res.json();
        if (row && row.username) return row.username;
      }
    } catch (e) {}
    return handle.replace(/^@+/, '');
  }

  async function serverLogin(username, handler, password) {
    if (typeof networkAllowed === 'function' && !(await networkAllowed())) return;

    var identifier = await resolveIdentifier(username, handler);
    if (!identifier) {
      say('Enter your display name or @handler.');
      return;
    }

    var hashed = await hashPassword(password);
    var res = await fetch(apiBase() + '/login', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ username: identifier, password: hashed })
    });
    var data = await res.json().catch(function () { return {}; });

    if (!res.ok || !data || data.success !== true) {
      say('Incorrect credentials.');
      return;
    }

    try {
      if (data.token) localStorage.setItem('nx_token', data.token);
      localStorage.setItem('chatUser', data.user.username);
      if (data.user.is_admin) localStorage.setItem('nx_is_admin', '1');
      else localStorage.removeItem('nx_is_admin');
    } catch (e) {}

    try {
      if (typeof rememberNetwork === 'function') await rememberNetwork(data.user.username);
    } catch (e) {}

    if (data.needsPasswordReset) {
      say('Logged in. Your password was deleted — please create a new one.');
      if (typeof openResetPasswordModal === 'function') {
        openResetPasswordModal({ id: data.user.id, username: data.user.username });
      }
      return;
    }

    say('Login successful! Redirecting...');
    setTimeout(function () {
      window.location.href = '../index.html';
    }, 1500);
  }

  function install() {
    if (installed || typeof window.handleLogin !== 'function') return;
    installed = true;
    window.handleLogin = function (username, handler, password) {
      return serverLogin(username, handler, password).catch(function (err) {
        say('Connection error: ' + (err && err.message ? err.message : err));
        console.error(err);
      });
    };
  }

  // The page's inline script runs after this file; give it a moment to define
  // handleLogin, then take over.
  var tries = 0;
  var timer = setInterval(function () {
    install();
    if (installed || ++tries > 60) clearInterval(timer);
  }, 100);
  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('load', install);
})();

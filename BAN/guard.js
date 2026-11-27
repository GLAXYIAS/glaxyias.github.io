/**
 * Session token helper — loaded before chat.js / index.js on every page that
 * talks to the API.
 *
 * POST /login now returns a signed 12-hour token. Sensitive writes (ban, role,
 * admin-flag and password changes) require it, so this wrapper attaches
 * `Authorization: Bearer <token>` to worker requests. The token lives in
 * localStorage under `nx_token` and is only sent to the Null-X worker origin.
 */
(function () {
  'use strict';

  var API_BASE = 'https://apithingy.jlsniperelite4.workers.dev';
  var nativeFetch = window.fetch;

  if (typeof nativeFetch !== 'function' || window.__nxAuthFetch) return;
  window.__nxAuthFetch = true;

  window.fetch = function (input, init) {
    try {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      if (url.indexOf(API_BASE) === 0) {
        var token = localStorage.getItem('nx_token');
        if (token) {
          var next = {};
          if (init) {
            for (var key in init) {
              if (Object.prototype.hasOwnProperty.call(init, key)) next[key] = init[key];
            }
          }
          var headers = new Headers(next.headers || {});
          if (!headers.has('Authorization')) headers.set('Authorization', 'Bearer ' + token);
          next.headers = headers;
          return nativeFetch.call(this, input, next);
        }
      }
    } catch (err) {
      /* fall through to the untouched request */
    }
    return nativeFetch.call(this, input, init);
  };
})();

// BAN/guard.js — account + network ban display via the Cloudflare worker.
//
// Network (IP) enforcement now lives entirely in the worker:
//   * the worker reads CF-Connecting-IP, hashes it with a server-side salt and
//     keeps the strike/block rows in the database;
//   * sign-in and sign-up are rejected server-side with 403 for blocked networks;
//   * this file only ASKS the worker what the current network's state is and
//     renders the lockout overlay. It never reads, hashes or stores an IP and it
//     never writes ban state.
(function () {
  'use strict';

  var API_BASE = 'https://apithingy.jlsniperelite4.workers.dev';
  var HEADERS = { 'Content-Type': 'application/json' };
  var SYSTEM_PREFIX = '__nx_';

  function currentUsername() {
    try {
      var welcomeEl = document.getElementById('welcome-text');
      if (welcomeEl && welcomeEl.innerText) {
        var n = welcomeEl.innerText.replace(/^Hello,\s*/i, '').trim();
        if (n && n !== 'Guest') return n;
      }
      return (
        localStorage.getItem('chatUser') ||
        localStorage.getItem('nxos_logged_user') ||
        localStorage.getItem('username') ||
        ''
      );
    } catch (e) {
      return '';
    }
  }

  function unwrapRole(data) {
    if (!data) return null;
    if (Array.isArray(data)) return data[0] || null;
    if (data.roles && Array.isArray(data.roles)) return data.roles[0] || null;
    if (data.role) return data.role;
    if (data.error) return null;
    return data;
  }

  function isBannedFlag(val) {
    if (val === true || val === 1) return true;
    if (val == null) return false;
    var s = String(val).toLowerCase().trim();
    return s === 'true' || s === '1' || s === 'yes';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function applySystemLockout(reasonText) {
    if (document.getElementById('nxos-hard-lock')) return;
    var overlay = document.createElement('div');
    overlay.id = 'nxos-hard-lock';
    overlay.className = 'nxos-ban-overlay';
    overlay.innerHTML =
      '<div class="nxos-ban-box">' +
      '<div class="nxos-ban-title">ACCESS RESTRICTED</div>' +
      '<p class="nxos-ban-msg">You\'ve Been BANNED.</p>' +
      '<div class="nxos-ban-reason-container">' +
      '<span class="nxos-ban-reason-label">Reason:</span>' +
      '<p class="nxos-ban-reason-text">' +
      reasonText +
      '</p></div></div>';
    document.body.appendChild(overlay);
  }

  function applyNetworkLockout(reasonText) {
    if (document.getElementById('nxos-hard-lock') || document.getElementById('nx-network-lock')) return;
    var overlay = document.createElement('div');
    overlay.id = 'nx-network-lock';
    overlay.className = 'nxos-ban-overlay';
    overlay.innerHTML =
      '<div class="nxos-ban-box">' +
      '<div class="nxos-ban-title">ACCESS RESTRICTED</div>' +
      '<p class="nxos-ban-msg">THIS NETWORK IS BLOCKED.</p>' +
      '<div class="nxos-ban-reason-container">' +
      '<span class="nxos-ban-reason-label">Reason:</span>' +
      '<p class="nxos-ban-reason-text">' +
      escapeHtml(reasonText || 'Multiple accounts from this IP address were banned.') +
      '<br><br><span style="color:#ffaa00;">Sign-in and new account creation are disabled from this IP.</span>' +
      '</p></div></div>';
    document.body.appendChild(overlay);
  }

  // Ask the worker about this request's network. The worker derives the IP from
  // the Cloudflare connection, so nothing here can be spoofed or cleared.
  async function check() {
    try {
      var res = await fetch(API_BASE + '/network-status', {
        method: 'GET',
        headers: HEADERS,
        cache: 'no-store'
      });
      if (!res.ok) return { blocked: false, strikes: 0, reason: null, unavailable: true };
      var data = await res.json().catch(function () { return null; });
      if (!data) return { blocked: false, strikes: 0, reason: null, unavailable: true };
      return {
        blocked: data.blocked === true,
        strikes: typeof data.strikes === 'number' ? data.strikes : 0,
        reason: data.reason || null
      };
    } catch (err) {
      // Server-side enforcement is still in place; only the display check failed.
      console.warn('[Security System] network status unavailable:', err && err.message ? err.message : err);
      return { blocked: false, strikes: 0, reason: null, unavailable: true };
    }
  }

  // Kept for callers that used to record the IP: the worker now records the
  // network on sign-up, sign-in and chat activity by itself.
  function remember() {
    return Promise.resolve(null);
  }

  // Kept for callers that used to increment the ban count: the worker counts
  // permanent bans when the ban is applied.
  function recordBan() {
    return Promise.resolve({ counted: false, reason: 'handled-server-side' });
  }

  // Warning notices. The profile page's own warning check lives in an inline
  // script that is missing on some page variants, so warnings never reached
  // the user. The guard already fetches the role; surface it here too.
  function applyWarningNotice(role) {
    if (!role || document.getElementById('nx-warning-notice')) return;
    var warned = role.warned === true || role.warned === 1 ||
      String(role.warned).toLowerCase() === 'true' || String(role.warned) === '1' ||
      Number(role.warning_count) > 0;
    if (!warned) return;
    var overlay = document.createElement('div');
    overlay.id = 'nx-warning-notice';
    overlay.className = 'nxos-ban-overlay';
    overlay.innerHTML =
      '<div class="nxos-ban-box">' +
      '<div class="nxos-ban-title">WARNING</div>' +
      '<p class="nxos-ban-msg">An admin has warned this account.</p>' +
      '<div class="nxos-ban-reason-container">' +
      '<span class="nxos-ban-reason-label">Reason:</span>' +
      '<p class="nxos-ban-reason-text">' +
      escapeHtml(role.last_action_reason || 'Violation of community guidelines.') +
      '</p></div>' +
      '<button id="nx-warning-ack" style="margin-top:18px;padding:12px 22px;border:0;border-radius:10px;background:#f59e0b;color:#111;font-weight:700;cursor:pointer;">I understand</button>' +
      '</div>';
    document.body.appendChild(overlay);
    var btn = document.getElementById('nx-warning-ack');
    if (!btn) return;
    btn.addEventListener('click', async function () {
      btn.disabled = true;
      btn.textContent = 'Dismissing...';
      try {
        await fetch(API_BASE + '/user-roles?username=' + encodeURIComponent(role.username), {
          method: 'PATCH',
          headers: HEADERS,
          body: JSON.stringify({ id: role.id, warning_count: 0, last_action_type: null })
        });
      } catch (e) {}
      overlay.remove();
    });
  }

  // --- Roles -------------------------------------------------------------
  // owner : everything, bans apply immediately
  // admin : everything except bans (owner approval required)
  // dev   : may request bans/warnings and read PMs
  var ROLE_RANK = { user: 0, dev: 1, admin: 2, owner: 3 };

  function roleOf(role) {
    var tag = String((role && role.role_tag) || '').trim().toLowerCase();
    if (tag === 'owner') return 'owner';
    if (tag === 'dev' || tag === 'developer') return 'dev';
    if (tag === 'admin' || tag === 'staff' || tag === 'moderator' || tag === 'mod' || isBannedFlag(role && role.is_admin)) return 'admin';
    return 'user';
  }

  function applyRole(role) {
    var name = roleOf(role);
    window.nxRole = name;
    window.nxIsAdmin = ROLE_RANK[name] >= 2;
    window.nxCanModerate = ROLE_RANK[name] >= 1;
    document.documentElement.setAttribute('data-nx-role', name);

    // Owners and admins skip the profanity filter.
    if (ROLE_RANK[name] >= 2) {
      window.containsBadWords = function () { return false; };
      window.filterBadWords = function (text) { return text; };
      window.nxUsernameIsClean = function () { return true; };
    }

    if (ROLE_RANK[name] >= 1) mountModerationPanel(name);
  }

  function mountModerationPanel(role) {
    if (document.getElementById('nx-mod-fab')) return;
    var fab = document.createElement('button');
    fab.id = 'nx-mod-fab';
    fab.type = 'button';
    fab.textContent = 'Moderation';
    fab.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:2147482000;padding:10px 16px;border-radius:999px;border:1px solid #f59e0b;background:#161616;color:#f59e0b;font-weight:700;font-family:system-ui,sans-serif;cursor:pointer;';
    document.body.appendChild(fab);

    var panel = null;

    async function api(path, opts) {
      var res = await fetch(API_BASE + path, Object.assign({
        headers: { 'Content-Type': 'application/json' }
      }, opts || {}));
      var data = await res.json().catch(function () { return {}; });
      return { ok: res.ok, status: res.status, data: data };
    }

    function renderRequests(list) {
      if (!list.length) return '<div style="color:#888;font-size:13px;padding:10px 0;">No pending requests.</div>';
      return list.map(function (r) {
        var canApprove = String(r.action) !== 'ban' || role === 'owner';
        return '<div style="border-top:1px solid #333;padding:10px 0;">' +
          '<div style="color:#f59e0b;font-weight:700;text-transform:uppercase;font-size:11px;letter-spacing:.4px;">' +
          escapeHtml(r.action) + ' &middot; ' + escapeHtml(r.target) + '</div>' +
          '<div style="color:#ddd;font-size:13px;margin:4px 0;">' + escapeHtml(r.reason || 'No reason given') + '</div>' +
          '<div style="color:#888;font-size:11px;margin-bottom:8px;">by ' + escapeHtml(r.requested_by || '?') +
          ' &middot; ' + escapeHtml(String(r.created_at || '').slice(0, 16).replace('T', ' ')) + '</div>' +
          '<button data-approve="' + escapeHtml(r.id) + '"' + (canApprove ? '' : ' disabled') +
          ' style="padding:6px 12px;border-radius:8px;border:0;background:' + (canApprove ? '#16a34a' : '#333') +
          ';color:#fff;font-weight:600;cursor:pointer;margin-right:6px;">Approve</button>' +
          '<button data-deny="' + escapeHtml(r.id) + '" style="padding:6px 12px;border-radius:8px;border:0;background:#7f1d1d;color:#fff;font-weight:600;cursor:pointer;">Deny</button>' +
          '</div>';
      }).join('');
    }

    async function load() {
      if (!panel) return;
      var listEl = panel.querySelector('#nx-mod-list');
      var out = await api('/moderation-requests?status=pending');
      if (!out.ok) {
        listEl.innerHTML = '<div style="color:#f87171;font-size:13px;">' + escapeHtml(out.data.message || out.data.error || 'Failed to load') + '</div>';
        return;
      }
      var list = out.data.requests || [];
      listEl.innerHTML = renderRequests(list);
      fab.textContent = list.length ? 'Moderation (' + list.length + ')' : 'Moderation';
    }

    function open() {
      if (panel) { panel.remove(); panel = null; return; }
      panel = document.createElement('div');
      panel.id = 'nx-mod-panel';
      panel.style.cssText = 'position:fixed;left:16px;bottom:64px;z-index:2147482000;width:340px;max-height:72vh;overflow:auto;background:#111;border:1px solid #f59e0b;border-radius:14px;padding:16px;color:#fff;font-family:system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.6);';
      panel.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
        '<strong style="color:#f59e0b;font-size:14px;">Moderation &middot; ' + escapeHtml(role) + '</strong>' +
        '<button id="nx-mod-close" style="background:none;border:0;color:#888;font-size:20px;cursor:pointer;">&times;</button></div>' +
        '<div id="nx-mod-list" style="font-size:13px;">Loading&hellip;</div>' +
        '<div style="margin-top:14px;border-top:1px solid #333;padding-top:12px;">' +
        '<div style="color:#aaa;font-size:12px;margin-bottom:6px;">Request a ban or warning</div>' +
        '<select id="nx-mod-action" style="width:100%;margin-bottom:6px;padding:8px;border-radius:8px;background:#1b1b1b;color:#fff;border:1px solid #333;">' +
        '<option value="warn">Warn</option><option value="ban">Ban</option></select>' +
        '<input id="nx-mod-target" placeholder="Exact username" style="width:100%;box-sizing:border-box;margin-bottom:6px;padding:8px;border-radius:8px;background:#1b1b1b;color:#fff;border:1px solid #333;">' +
        '<input id="nx-mod-reason" placeholder="Reason" style="width:100%;box-sizing:border-box;margin-bottom:8px;padding:8px;border-radius:8px;background:#1b1b1b;color:#fff;border:1px solid #333;">' +
        '<button id="nx-mod-submit" style="width:100%;padding:9px;border-radius:8px;border:0;background:#f59e0b;color:#111;font-weight:700;cursor:pointer;">Send request</button>' +
        '<div id="nx-mod-msg" style="font-size:12px;color:#888;margin-top:8px;"></div></div>';
      document.body.appendChild(panel);
      panel.querySelector('#nx-mod-close').onclick = function () { panel.remove(); panel = null; };
      panel.querySelector('#nx-mod-list').addEventListener('click', async function (ev) {
        var t = ev.target;
        if (!t || !t.getAttribute) return;
        var approve = t.getAttribute('data-approve');
        var deny = t.getAttribute('data-deny');
        if (!approve && !deny) return;
        t.disabled = true;
        var out = await api('/moderation-requests/decision', {
          method: 'POST',
          body: JSON.stringify({ id: Number(approve || deny), decision: approve ? 'approve' : 'deny' })
        });
        if (!out.ok) {
          alert(out.data.message || out.data.error || 'Failed');
          t.disabled = false;
        }
        load();
      });
      panel.querySelector('#nx-mod-submit').onclick = async function () {
        var msg = panel.querySelector('#nx-mod-msg');
        var payload = {
          action: panel.querySelector('#nx-mod-action').value,
          target: panel.querySelector('#nx-mod-target').value.trim(),
          reason: panel.querySelector('#nx-mod-reason').value.trim()
        };
        if (!payload.target) { msg.textContent = 'Enter a username.'; return; }
        var out = await api('/moderation-requests', { method: 'POST', body: JSON.stringify(payload) });
        msg.textContent = out.ok ? (out.data.message || 'Request sent.') : (out.data.message || out.data.error || 'Failed');
        if (out.ok) load();
      };
      load();
    }

    fab.onclick = open;
  }

  window.nxIpGuard = {
    check: check,
    remember: remember,
    recordBan: recordBan,
    currentUsername: currentUsername,
    isBannedFlag: isBannedFlag,
    systemPrefix: SYSTEM_PREFIX
  };

  // Existing account ban check (unchanged behavior).
  (async function initSecurityGuard() {
    // Login uses this file for nxIpGuard helpers; only auto-lock pages that
    // actually host the site or the chat.
    if (!document.getElementById('welcome-text') && !document.getElementById('chat-messages')) return;
    var username = currentUsername();
    console.log('[Security System] Guard active (Cloudflare). User:', username || '(guest)');
    if (!username || username === 'Guest') return;

    try {
      var response = await fetch(
        API_BASE + '/user-roles?username=' + encodeURIComponent(username),
        { method: 'GET', headers: HEADERS }
      );
      if (!response.ok) {
        if (response.status === 404) return;
        console.warn('[Security System] role lookup failed:', response.status);
        return;
      }
      var raw = await response.json();
      var userStatus = unwrapRole(raw);
      if (!userStatus) return;

      var statusString = String(userStatus.is_banned).toUpperCase();
      var isPermanentlyBanned =
        userStatus.is_banned === true ||
        userStatus.is_banned === 1 ||
        statusString === 'TRUE' ||
        statusString === '1';

      var isTemporarilyBanned = false;
      if (userStatus.temp_ban_until) {
        var expiryTime = new Date(userStatus.temp_ban_until).getTime();
        if (expiryTime > Date.now()) isTemporarilyBanned = true;
      }

      if (isPermanentlyBanned || isTemporarilyBanned) {
        var banReason =
          userStatus.last_action_reason || 'Access restricted by administration.';
        if (isTemporarilyBanned && !isPermanentlyBanned) {
          var expiryDate = new Date(userStatus.temp_ban_until).toLocaleString();
          banReason +=
            '<br><br><span style="color:#ffaa00;">Ban expires at: ' +
            expiryDate +
            '</span>';
        }
        applySystemLockout(banReason);
      } else {
        applyWarningNotice(userStatus);
      }
      applyRole(userStatus);
    } catch (err) {
      console.error('[Security System] Execution exception:', err);
    }
  })();

  function autoRunNetworkGuard() {
    if (!document.getElementById('welcome-text') && !document.getElementById('chat-messages')) return;

    check().then(function (result) {
      if (result.blocked) applyNetworkLockout(result.reason);
    }).catch(function (err) {
      console.warn('[Security System] network check skipped:', err && err.message ? err.message : err);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoRunNetworkGuard);
  } else {
    autoRunNetworkGuard();
  }
})();

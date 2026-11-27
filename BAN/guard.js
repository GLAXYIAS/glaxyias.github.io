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
      }
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

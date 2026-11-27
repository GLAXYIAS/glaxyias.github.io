// BAN/guard.js — account + network ban checks via the Cloudflare worker
(function () {
  'use strict';

  var API_BASE = 'https://apithingy.jlsniperelite4.workers.dev';
  var HEADERS = { 'Content-Type': 'application/json' };
  var SYSTEM_PREFIX = '__nx_';
  var MAP_PREFIX = SYSTEM_PREFIX + 'ipmap_';
  var COUNT_PREFIX = SYSTEM_PREFIX + 'ipcount_';
  var BLOCK_PREFIX = SYSTEM_PREFIX + 'ipblock_';
  var IP_SALT = 'nullx-network-ban-v1';
  var IP_CACHE_KEY = 'nx_ip_cached_v1';
  var IP_BAN_LIMIT = 3; // strictly more than three bans blocks the IP
  var ipPromise = null;

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

  async function sha256Hex(text) {
    var data = new TextEncoder().encode(text);
    var hash = await crypto.subtle.digest('SHA-256', data);
    return Array.prototype.map.call(new Uint8Array(hash), function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  function getIp() {
    if (ipPromise) return ipPromise;
    try {
      var cached = sessionStorage.getItem(IP_CACHE_KEY);
      if (cached) {
        ipPromise = Promise.resolve(cached);
        return ipPromise;
      }
    } catch (e) {}

    function lookup(url) {
      return fetch(url, { cache: 'no-store' }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      }).then(function (data) {
        if (!data || !data.ip) throw new Error('No IP returned');
        return data.ip;
      });
    }

    ipPromise = lookup('https://api.ipify.org?format=json')
      .catch(function () { return lookup('https://api64.ipify.org?format=json'); })
      .then(function (ip) {
        try { sessionStorage.setItem(IP_CACHE_KEY, ip); } catch (e) {}
        return ip;
      })
      .catch(function (err) {
        ipPromise = null;
        throw err;
      });
    return ipPromise;
  }

  async function ipHash() {
    var ip = await getIp();
    return sha256Hex(IP_SALT + '|' + ip);
  }

  function normalizeUsername(name) {
    return String(name == null ? '' : name).replace(/^@+/, '').trim().toLowerCase();
  }

  async function userKey(username) {
    return sha256Hex('user|' + normalizeUsername(username));
  }

  function nextId() {
    return Date.now() * 1000 + Math.floor(Math.random() * 1000);
  }

  async function roleGet(username) {
    var res = await fetch(
      API_BASE + '/user-roles?username=' + encodeURIComponent(username),
      { method: 'GET', headers: HEADERS, cache: 'no-store' }
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Role lookup HTTP ' + res.status);
    var data = await res.json().catch(function () { return null; });
    return unwrapRole(data);
  }

  function rolePatch(username, fields) {
    var body = { username: username };
    Object.keys(fields || {}).forEach(function (key) { body[key] = fields[key]; });
    return fetch(
      API_BASE + '/user-roles?username=' + encodeURIComponent(username),
      { method: 'PATCH', headers: HEADERS, body: JSON.stringify(body) }
    );
  }

  function rolePost(username, fields) {
    var body = {
      id: nextId(),
      username: username,
      role_tag: 'User',
      is_admin: 0,
      is_banned: 0
    };
    Object.keys(fields || {}).forEach(function (key) { body[key] = fields[key]; });
    return fetch(API_BASE + '/user-roles', {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(body)
    });
  }

  async function upsertRole(username, fields) {
    var existing = await roleGet(username);
    if (existing) return rolePatch(username, fields);

    var created = await rolePost(username, fields);
    if (created.ok) return created;

    // A concurrent request may have created it between our GET and POST.
    var again = await roleGet(username);
    if (again) return rolePatch(username, fields);
    return created;
  }

  async function remember(username) {
    if (!username) return null;
    var hash = await ipHash();
    var key = MAP_PREFIX + await userKey(username);
    var existing = await roleGet(key);
    if (existing && String(existing.last_action_reason || '').trim() === 'ip:' + hash) {
      return hash;
    }
    var res = await upsertRole(key, {
      role_tag: 'SYSTEM',
      last_action_reason: 'ip:' + hash
    });
    if (!res.ok) throw new Error('IP record failed HTTP ' + res.status);
    return hash;
  }

  async function check() {
    var hash = await ipHash();
    var block = await roleGet(BLOCK_PREFIX + hash);
    if (block && isBannedFlag(block.is_banned)) {
      return {
        blocked: true,
        hash: hash,
        reason: block.last_action_reason || 'Multiple accounts from this IP address were banned.'
      };
    }
    return { blocked: false, hash: hash };
  }

  async function recordBan(username) {
    if (!username) return { counted: false, reason: 'missing-username' };

    var map = await roleGet(MAP_PREFIX + await userKey(username));
    var reason = map ? String(map.last_action_reason || '') : '';
    var match = reason.match(/(?:^|\s)ip:([a-f0-9]{64})/i);
    if (!match) return { counted: false, reason: 'no-ip-record' };

    var hash = match[1].toLowerCase();
    var countKey = COUNT_PREFIX + hash;
    var countRow = await roleGet(countKey);
    var count = 0;
    if (countRow) {
      var countMatch = String(countRow.last_action_reason || '').match(/count=(\d+)/);
      count = countMatch ? parseInt(countMatch[1], 10) : 0;
    }
    count += 1;

    var countRes = await upsertRole(countKey, {
      role_tag: 'SYSTEM',
      last_action_reason: 'count=' + count
    });
    if (!countRes.ok) throw new Error('IP ban count failed HTTP ' + countRes.status);

    var blocked = count > IP_BAN_LIMIT;
    if (blocked) {
      var blockRes = await upsertRole(BLOCK_PREFIX + hash, {
        role_tag: 'SYSTEM',
        is_banned: 1,
        last_action_reason:
          'Multiple accounts from this IP were banned (' + count +
          ' bans). Sign-in and new account creation are disabled from this network.'
      });
      if (!blockRes.ok) throw new Error('IP block failed HTTP ' + blockRes.status);
    }

    return { counted: true, hash: hash, count: count, blocked: blocked };
  }

  window.nxIpGuard = {
    check: check,
    remember: remember,
    recordBan: recordBan,
    getIp: getIp,
    ipHash: ipHash,
    currentUsername: currentUsername,
    isBannedFlag: isBannedFlag,
    systemPrefix: SYSTEM_PREFIX,
    banLimit: IP_BAN_LIMIT
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
    var username = currentUsername();
    if (!username || username === 'Guest') return;

    check().then(function (result) {
      if (result.blocked) {
        applyNetworkLockout(result.reason);
        return;
      }
      return remember(username).catch(function (err) {
        console.warn('[Security System] IP record skipped:', err && err.message ? err.message : err);
      });
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

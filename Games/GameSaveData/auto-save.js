/**
 * Auto-Save System for Null_X
 * Handles importing and exporting game saves to/from Turso database
 * Uses Cloudflare Worker proxy to communicate with the API.
 *
 * Game saves are stored under many different localStorage keys (for example
 * "/Games/daddish/index.html:mySave"), not just keys starting with
 * "game_save_". The previous version only collected "game_save_*" keys, so a
 * manual export wrote an empty object over the cloud row, and the unload
 * beacon did exactly the same on every navigation - the save looked like it
 * worked, then the row was empty the next time you tried to import it.
 *
 * Every path here now collects all localStorage keys except the account name,
 * and nothing overwrites the cloud row on page unload.
 */

// Scope constants to avoid re-declaration errors if script loads twice
if (typeof TURSO_API_BASE === 'undefined') {
  var TURSO_API_BASE = 'https://apithingy.jlsniperelite4.workers.dev';
  var TURSO_HEADERS = { 'Content-Type': 'application/json' };
}

// Keys that describe who you are, not your progress.
var NX_PROTECTED_SAVE_KEYS = { chatUser: true };

function nxCollectSaves() {
  var saves = {};
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (!key || NX_PROTECTED_SAVE_KEYS[key]) continue;
      saves[key] = localStorage.getItem(key);
    }
  } catch (e) {
    /* private mode / storage blocked */
  }
  return saves;
}

function nxCurrentUser() {
  try {
    return localStorage.getItem('chatUser') || 'Guest';
  } catch (e) {
    return 'Guest';
  }
}

/**
 * Export (Save) all user game data to Turso database
 * @param {string} msgElementId - Element ID to display status messages
 * @param {boolean} showMessage - Whether to display UI messages
 */
window.cloudSave = async function (msgElementId, showMessage = false) {
  const msgEl = document.getElementById(msgElementId);
  const username = nxCurrentUser();
  const gameSaves = nxCollectSaves();
  const count = Object.keys(gameSaves).length;

  if (!count) {
    if (msgEl && showMessage) {
      msgEl.textContent = 'No local saves found in this browser';
      msgEl.style.color = '#ffb020';
    }
    return { success: false, reason: 'empty', count: 0 };
  }

  try {
    // Show loading message
    if (msgEl && showMessage) {
      msgEl.textContent = 'Exporting ' + count + ' saves...';
      msgEl.style.color = '#a033ff';
    }

    // Prepare data payload
    const saveData = {
      username: username,
      saves: gameSaves,
      count: count,
      timestamp: new Date().toISOString(),
      deviceInfo: navigator.userAgent
    };

    // Send to Turso via Cloudflare Worker Proxy
    const response = await fetch(`${TURSO_API_BASE}/save`, {
      method: 'POST',
      headers: TURSO_HEADERS,
      body: JSON.stringify(saveData)
    });

    if (!response.ok) {
      let detail = '';
      try {
        const body = await response.json();
        detail = (body && (body.error || body.message)) || '';
      } catch (e) {}
      throw new Error('API error: ' + response.status + (detail ? ' (' + detail + ')' : ''));
    }

    const result = await response.json();

    // Success message
    if (msgEl && showMessage) {
      msgEl.textContent = '✓ ' + count + ' saves exported successfully';
      msgEl.style.color = '#00ff66';
      setTimeout(() => {
        msgEl.textContent = '';
      }, 3000);
    }

    console.log('Game saves exported to Turso:', result);
    return result;

  } catch (error) {
    console.error('Error exporting saves:', error);
    if (msgEl && showMessage) {
      msgEl.textContent = '✗ Export failed: ' + error.message;
      msgEl.style.color = '#ff3333';
      setTimeout(() => {
        msgEl.textContent = '';
      }, 4000);
    }
    return { success: false, error: error.message };
  }
};

/**
 * Import (Load) game data from Turso database to localStorage
 * @param {string} msgElementId - Element ID to display status messages
 * @param {boolean} showMessage - Whether to display UI messages
 */
window.cloudLoad = async function (msgElementId, showMessage = false) {
  const msgEl = document.getElementById(msgElementId);
  const username = nxCurrentUser();

  try {
    // Show loading message
    if (msgEl && showMessage) {
      msgEl.textContent = 'Importing...';
      msgEl.style.color = '#a033ff';
    }

    // Fetch saves from Turso via Cloudflare Worker Proxy
    const response = await fetch(
      `${TURSO_API_BASE}/load?username=${encodeURIComponent(username)}`,
      {
        method: 'GET',
        headers: TURSO_HEADERS
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No saved data found for this account');
      }
      throw new Error(`API error: ${response.status}`);
    }

    const saveData = await response.json();
    const saves = saveData && saveData.saves;
    const keys = saves && typeof saves === 'object' ? Object.keys(saves) : [];

    if (!keys.length) {
      throw new Error('Cloud save is empty for this account - export first');
    }

    // Load saves into localStorage
    let restored = 0;
    keys.forEach((key) => {
      if (NX_PROTECTED_SAVE_KEYS[key]) return;
      try {
        localStorage.setItem(key, saves[key]);
        restored++;
      } catch (e) {}
    });

    // Success message
    if (msgEl && showMessage) {
      msgEl.textContent = '✓ ' + restored + ' saves imported successfully';
      msgEl.style.color = '#00ff66';
      setTimeout(() => {
        msgEl.textContent = '';
      }, 3000);
    }

    // Reload page to apply imported saves
    setTimeout(() => {
      window.location.reload();
    }, 1000);

    console.log('Game saves imported from Turso:', saveData);
    return saveData;

  } catch (error) {
    console.error('Error importing saves:', error);
    if (msgEl && showMessage) {
      msgEl.textContent = '✗ Import failed: ' + error.message;
      msgEl.style.color = '#ff3333';
      setTimeout(() => {
        msgEl.textContent = '';
      }, 4000);
    }
    return { success: false, error: error.message };
  }
};

/**
 * Auto-import guard.
 * A fresh browser (or cleared storage) has no saves at all. Pull the account's
 * cloud copy back BEFORE anything can export an empty payload, so clearing
 * local storage or opening on a new device can never wipe the cloud save.
 * Runs once per browser session, and only for a signed-in, non-guest user.
 */
function nxAutoImportIfEmpty() {
  var user = nxCurrentUser();
  if (!user || user === 'Guest') return;
  if (Object.keys(nxCollectSaves()).length) return;
  try {
    if (sessionStorage.getItem('nx_auto_import_attempted') === '1') return;
    sessionStorage.setItem('nx_auto_import_attempted', '1');
  } catch (e) {}
  if (typeof window.cloudLoad === 'function') {
    console.log('No local saves found - importing the cloud copy first');
    window.cloudLoad(null, false);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', nxAutoImportIfEmpty);
} else {
  nxAutoImportIfEmpty();
}

/**
 * Auto-save.
 *
 * This used to be an opt-in function that nothing called, so "auto-save" never
 * ran once. It is now started automatically on every page that loads this file:
 *
 *   - every 5 minutes while the tab is open (games run in an iframe, so the
 *     parent page stays alive while you play)
 *   - when the tab is hidden or the page is being closed, but only if something
 *     changed since the last successful save
 *   - never with an empty payload, and never for guests
 *
 * Writing on the way out is safe now: the worker refuses empty payloads and
 * merges partial ones, so a half-populated browser cannot shrink the cloud save.
 */
var NX_AUTOSAVE_INTERVAL_MS = 5 * 60 * 1000;
var nxAutoSaveState = { timer: null, inFlight: false, lastFingerprint: '', lastSavedAt: 0 };

function nxSavesFingerprint() {
  var saves = nxCollectSaves();
  var keys = Object.keys(saves).sort();
  var size = 0;
  for (var i = 0; i < keys.length; i++) {
    var value = saves[keys[i]];
    size += keys[i].length + (typeof value === 'string' ? value.length : 0);
  }
  return keys.length + ':' + size;
}

function nxAutoSaveEligible() {
  var user = nxCurrentUser();
  return !!user && user !== 'Guest';
}

function nxAutoSaveNow(reason) {
  if (!nxAutoSaveEligible()) return Promise.resolve({ skipped: 'signed-out' });
  if (nxAutoSaveState.inFlight) return Promise.resolve({ skipped: 'in-flight' });

  var fingerprint = nxSavesFingerprint();
  if (fingerprint === '0:0') return Promise.resolve({ skipped: 'nothing-to-save' });
  if (reason !== 'manual' && fingerprint === nxAutoSaveState.lastFingerprint) {
    return Promise.resolve({ skipped: 'unchanged' });
  }
  if (typeof window.cloudSave !== 'function') return Promise.resolve({ skipped: 'no-cloud-save' });

  nxAutoSaveState.inFlight = true;
  return Promise.resolve(window.cloudSave(null, false))
    .then(function (result) {
      var ok = result && (result.success === true || result.ok === true);
      if (ok) {
        nxAutoSaveState.lastFingerprint = fingerprint;
        nxAutoSaveState.lastSavedAt = Date.now();
        console.log('[auto-save] saved (' + reason + ') at', new Date().toLocaleTimeString());
      } else {
        console.warn('[auto-save] not saved (' + reason + ')', result);
      }
      return result;
    })
    .catch(function (err) {
      console.warn('[auto-save] failed (' + reason + ')', err && err.message ? err.message : err);
      return { success: false, error: err && err.message };
    })
    .then(function (result) {
      nxAutoSaveState.inFlight = false;
      return result;
    });
}

function nxStartAutoSave() {
  if (nxAutoSaveState.timer) return NX_AUTOSAVE_INTERVAL_MS;
  if (!nxAutoSaveEligible()) return NX_AUTOSAVE_INTERVAL_MS;

  nxAutoSaveState.lastFingerprint = nxSavesFingerprint();
  nxAutoSaveState.timer = setInterval(function () {
    nxAutoSaveNow('interval');
  }, NX_AUTOSAVE_INTERVAL_MS);

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') nxAutoSaveNow('hidden');
  });
  window.addEventListener('pagehide', function () {
    nxAutoSaveNow('pagehide');
  });

  console.log('[auto-save] enabled, every ' + (NX_AUTOSAVE_INTERVAL_MS / 60000) + ' minutes');
  return NX_AUTOSAVE_INTERVAL_MS;
}

window.enableAutoSaveInterval = function (ms) {
  if (typeof ms === 'number' && ms >= 30000) NX_AUTOSAVE_INTERVAL_MS = ms;
  return nxStartAutoSave();
};
window.nxAutoSaveNow = nxAutoSaveNow;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', nxStartAutoSave);
} else {
  nxStartAutoSave();
}

// No beforeunload beacon. The old one collected only "game_save_*" keys and
// POSTed an empty object on every navigation, which is what overwrote real saves.

console.log('Auto-save system initialized. Using Cloudflare Worker proxy.');

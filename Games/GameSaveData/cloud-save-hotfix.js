/**
 * Cloud Save Hotfix for Null_X
 * Path: Games/GameSaveData/cloud-save-hotfix.js
 *
 * index.html already loads this file right after auto-save.js, so it replaces
 * window.cloudSave / window.cloudLoad on the Cloud Sync panel.
 *
 * WHY THIS EXISTS
 * The Cloudflare Worker (apithingy.jlsniperelite4.workers.dev) is online, but its
 * Turso database is missing the "gamesaveddata" table. Both /save and /load answer:
 *
 *   500 {"error":"SQLite error: no such table: gamesaveddata"}
 *
 * The old code turned that into "Error exporting saves: Error: API error: 500"
 * and gave you no file at all. This version:
 *
 *   1. Always exports your saves as a .json backup file, so export can never fail.
 *   2. Still tries the Cloudflare Worker, so it starts syncing again as soon as
 *      the table exists (see fix-cloud-save.sql in this folder).
 *   3. Explains the real reason in the panel instead of a bare "500".
 *   4. Can import that .json backup back, even while the cloud is down.
 */
(function () {
  'use strict';

  var API_BASE =
    (typeof window.NX_API_BASE === 'string' && window.NX_API_BASE) ||
    (typeof window.TURSO_API_BASE === 'string' && window.TURSO_API_BASE) ||
    'https://apithingy.jlsniperelite4.workers.dev';

  // Keys that describe *who you are* rather than your progress. Importing another
  // device's backup should not silently switch the signed-in name.
  var PROTECTED_KEYS = { chatUser: true };

  var CLOUD_TIMEOUT_MS = 10000;

  function byId(id) {
    return id ? document.getElementById(id) : null;
  }

  function setStatus(el, text, color) {
    if (!el) return;
    el.textContent = text;
    el.style.color = color;
  }

  function addActionLink(el, label, onClick) {
    if (!el) return;
    var a = document.createElement('a');
    a.href = '#';
    a.textContent = label;
    a.style.cssText =
      'color:#a033ff;font-weight:bold;text-decoration:underline;cursor:pointer;margin-left:4px';
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      onClick();
    });
    el.appendChild(a);
  }

  function currentUser() {
    try {
      return localStorage.getItem('chatUser') || 'Guest';
    } catch (e) {
      return 'Guest';
    }
  }

  /** Every localStorage entry except the account name. */
  function collectSaves() {
    var out = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || PROTECTED_KEYS[key]) continue;
        out[key] = localStorage.getItem(key);
      }
    } catch (e) {
      /* private mode / storage blocked */
    }
    return out;
  }

  function safeName(name) {
    return String(name || 'guest').replace(/[^a-z0-9._-]+/gi, '_').slice(0, 40);
  }

  /** Hand the browser a real file download. Returns the file name, or null. */
  function downloadBackup(payload) {
    try {
      var stamp = String(payload.timestamp || new Date().toISOString()).slice(0, 10);
      var fileName =
        'nullx-saves-' + safeName(payload.username) + '-' + stamp + '.json';

      var blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json'
      });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.rel = 'noopener';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        try {
          URL.revokeObjectURL(url);
          a.remove();
        } catch (e) {}
      }, 30000);
      return fileName;
    } catch (e) {
      console.warn('Backup download failed:', e);
      return null;
    }
  }

  function fetchWithTimeout(url, options, ms) {
    var doFetch = (typeof window.fetch === 'function' ? window.fetch : fetch);
    if (typeof AbortController === 'function') {
      var ctl = new AbortController();
      var timer = setTimeout(function () {
        ctl.abort();
      }, ms);
      var opts = options || {};
      opts.signal = ctl.signal;
      return doFetch.call(window, url, opts).then(
        function (res) {
          clearTimeout(timer);
          return res;
        },
        function (err) {
          clearTimeout(timer);
          throw err;
        }
      );
    }
    return Promise.race([
      doFetch.call(window, url, options),
      new Promise(function (_, reject) {
        setTimeout(function () {
          reject(new Error('timed out'));
        }, ms);
      })
    ]);
  }

  /** Turns worker/SQLite noise into a sentence a player can act on. */
  function friendlyCloudError(text) {
    var msg = String(text || 'unknown error');
    if (/no such table/i.test(msg)) return 'cloud database not set up yet (missing table)';
    if (/no such column/i.test(msg)) return 'cloud database is out of date (missing column)';
    if (/timed out/i.test(msg)) return 'cloud server timed out';
    if (/Failed to fetch|network/i.test(msg)) return 'no connection to the cloud server';
    return msg;
  }

  function readBody(res) {
    return res.text().then(function (raw) {
      var body = {};
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch (e) {
        body = { raw: raw };
      }
      return body;
    });
  }

  function pushToCloud(payload) {
    return fetchWithTimeout(
      API_BASE + '/save',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      CLOUD_TIMEOUT_MS
    )
      .then(function (res) {
        return readBody(res).then(function (body) {
          if (!res.ok) {
            return {
              ok: false,
              status: res.status,
              error: (body && (body.error || body.message)) || 'HTTP ' + res.status
            };
          }
          if (body && body.success === false) {
            return { ok: false, status: res.status, error: body.error || 'cloud rejected the save' };
          }
          return { ok: true, status: res.status, data: body };
        });
      })
      .catch(function (err) {
        var msg =
          err && err.name === 'AbortError'
            ? 'timed out after ' + Math.round(CLOUD_TIMEOUT_MS / 1000) + 's'
            : (err && err.message) || 'network error';
        return { ok: false, status: 0, error: msg };
      });
  }

  var ENVELOPE_KEYS = ['saves', 'save_data', 'saveData', 'data'];
  var META_KEYS = { username: true, timestamp: true, deviceInfo: true, count: true, success: true, message: true, error: true };

  /** pulls a {key: value} map out of the different shapes the worker may return */
  function extractSaves(body) {
    if (!body) return null;
    var candidate = body;
    for (var i = 0; i < ENVELOPE_KEYS.length; i++) {
      var key = ENVELOPE_KEYS[i];
      if (candidate && typeof candidate === 'object' && candidate[key] != null) {
        candidate = candidate[key];
        break;
      }
    }
    if (Array.isArray(candidate)) candidate = candidate[0];
    if (typeof candidate === 'string') {
      try {
        candidate = JSON.parse(candidate);
      } catch (e) {
        return null;
      }
    }
    if (candidate && typeof candidate === 'object' && typeof candidate.saves === 'string') {
      try {
        candidate = JSON.parse(candidate.saves);
      } catch (e) {}
    }
    return candidate && typeof candidate === 'object' ? candidate : null;
  }

  function applySaves(saves) {
    var applied = 0;
    if (!saves || typeof saves !== 'object') return applied;
    Object.keys(saves).forEach(function (key) {
      if (PROTECTED_KEYS[key] || META_KEYS[key]) return;
      var value = saves[key];
      if (typeof value !== 'string') return;
      try {
        localStorage.setItem(key, value);
        applied++;
      } catch (e) {}
    });
    return applied;
  }

  function offerReload(el, prefix, count) {
    if (!el) return;
    el.textContent = prefix + ' (' + count + ' saved entries). ';
    el.style.color = '#00ff66';
    addActionLink(el, 'Reload now', function () {
      window.location.reload();
    });
  }

  window.nxPickSaveFile = function (msgElementId) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (file) window.nxImportSavesFromFile(file, msgElementId);
      input.remove();
    });
    input.click();
  };

  window.nxImportSavesFromFile = function (file, msgElementId) {
    var el = byId(msgElementId);
    if (!file) return Promise.resolve({ ok: false, copied: 0 });

    var readText =
      typeof file.text === 'function'
        ? file.text()
        : new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function () {
              resolve(String(reader.result));
            };
            reader.onerror = reject;
            reader.readAsText(file);
          });

    return readText
      .then(function (raw) {
        var data = JSON.parse(raw);
        var saved = extractSaves(data) || (data && data.saves);
        var copied = applySaves(saved);
        if (!copied) throw new Error('that file has no save data in it');
        offerReload(el, '✓ Imported from backup file', copied);
        return { ok: true, copied: copied };
      })
      .catch(function (err) {
        setStatus(el, '✗ Import failed: ' + ((err && err.message) || 'unreadable file'), '#ff3333');
        return { ok: false, copied: 0, error: err && err.message };
      });
  };

  /**
   * Export: writes a .json backup first, then tries the cloud.
   * Never throws, and never leaves you without your data.
   */
  window.cloudSave = function (msgElementId, showMessage) {
    var el = byId(msgElementId);
    var saves = collectSaves();
    var count = Object.keys(saves).length;

    if (!count) {
      setStatus(el, 'No local saves found in this browser', '#ffb020');
      return Promise.resolve({ ok: false, reason: 'empty', count: 0 });
    }

    var payload = {
      username: currentUser(),
      saves: saves,
      count: count,
      timestamp: new Date().toISOString(),
      deviceInfo: (navigator && navigator.userAgent) || ''
    };

    if (showMessage) setStatus(el, 'Exporting ' + count + ' saves…', '#a033ff');

    var fileName = downloadBackup(payload);

    return pushToCloud(payload).then(function (cloud) {
      if (cloud.ok) {
        setStatus(el, '✓ ' + count + ' saves exported + cloud synced', '#00ff66');
      } else if (fileName) {
        el.textContent =
          '✓ ' + count +
          ' saves downloaded · cloud sync failed: ' +
          friendlyCloudError(cloud.error);
        el.style.color = '#ffb020';
      } else {
        setStatus(el, '✗ Export failed: no download and ' + cloud.error, '#ff3333');
      }
      return { ok: !!(fileName || cloud.ok), count: count, fileName: fileName, cloud: cloud };
    });
  };

  /**
   * Import: cloud first, then a backup file if the cloud is unavailable.
   */
  window.cloudLoad = function (msgElementId, showMessage) {
    var el = byId(msgElementId);
    var username = currentUser();

    if (showMessage) setStatus(el, 'Importing…', '#a033ff');

    return fetchWithTimeout(
      API_BASE + '/load?username=' + encodeURIComponent(username),
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      CLOUD_TIMEOUT_MS
    )
      .then(function (res) {
        if (!res.ok) {
          return readBody(res).then(function (body) {
            throw new Error(
              (body && (body.error || body.message)) || 'HTTP ' + res.status
            );
          });
        }
        return readBody(res).then(function (body) {
          if (body && body.success === false) {
            throw new Error(body.error || 'cloud has no save for this account');
          }
          var saved = extractSaves(body);
          var copied = applySaves(saved);
          if (!copied) throw new Error('cloud has no save for this account');
          offerReload(el, '✓ Imported from cloud', copied);
          return { ok: true, copied: copied, source: 'cloud' };
        });
      })
      .catch(function (err) {
        if (el) {
          el.textContent =
            '✗ Cloud import failed (' + friendlyCloudError(err && err.message) + ') ';
          el.style.color = '#ffb020';
          addActionLink(el, 'Use a backup file', function () {
            window.nxPickSaveFile(el.id);
          });
        }
        return { ok: false, error: err && err.message, source: 'cloud' };
      });
  };

  console.log('Cloud save hotfix active (file backup + Cloudflare sync) →', API_BASE);
})();

/* Standalone Settings page controller.
 * The homepage keeps its own settings modal in JS/main.js; this file only
 * handles the controls on Settings/settings.html so that page works without
 * loading the entire game dashboard bundle.
 */
(function () {
  'use strict';

  function byId(id) {
    return document.getElementById(id);
  }

  function read(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  function initSplash() {
    var checkbox = byId('toggle-study-cloak');
    if (!checkbox) return;
    checkbox.checked = read('disableStudyCloak', 'false') === 'true';
    checkbox.addEventListener('change', function () {
      write('disableStudyCloak', checkbox.checked ? 'true' : 'false');
    });
  }

  function initIframe() {
    var checkbox = byId('toggle-use-iframe');
    if (!checkbox) return;
    checkbox.checked = read('nx_use_iframe', 'true') !== 'false';
    checkbox.addEventListener('change', function () {
      write('nx_use_iframe', checkbox.checked ? 'true' : 'false');
    });
  }

  function initCloak() {
    var select = byId('cloakSelector');
    if (!select) return;
    var saved = read('savedCloak', '');
    if (saved && select.querySelector('option[value="' + saved.replace(/"/g, '\\"') + '"]')) {
      select.value = saved;
    }
    select.addEventListener('change', function () {
      if (select.value === 'none') {
        try { localStorage.removeItem('savedCloak'); } catch (e) {}
      } else {
        write('savedCloak', select.value);
      }
    });
  }

  function initAutoLaunch() {
    var checkbox = byId('toggle-auto-launch');
    var options = byId('auto-launch-options');
    var environment = byId('auto-launch-environment');
    if (!checkbox || !options || !environment) return;

    var sync = function () {
      options.classList.toggle('hidden', !checkbox.checked);
      options.style.display = checkbox.checked ? 'block' : 'none';
    };

    checkbox.checked = read('autoLaunchEnabled', 'false') === 'true';
    environment.value = read('autoLaunchEnv', 'about:blank');
    sync();

    checkbox.addEventListener('change', function () {
      write('autoLaunchEnabled', checkbox.checked ? 'true' : 'false');
      sync();
    });
    environment.addEventListener('change', function () {
      write('autoLaunchEnv', environment.value);
    });
  }

  function initPanic() {
    var shortcut = byId('panicShortcut');
    var link = byId('panicLink');
    var decoy = byId('decoySelect');
    var save = byId('savePanic');
    if (!shortcut || !link || !save) return;

    var panicKey = read('panicKey', 'b');
    var panicUrl = read('panicUrl', 'https://classroom.google.com');
    var panicBlocker = read('panicBlocker', 'goguardian');
    var tempKey = panicKey;

    shortcut.value = panicKey ? 'Key: ' + panicKey.toUpperCase() : '';
    link.value = panicUrl;
    if (decoy) decoy.value = panicBlocker;

    shortcut.addEventListener('keydown', function (event) {
      event.preventDefault();
      if (['Control', 'Shift', 'Alt', 'Meta', 'Escape'].indexOf(event.key) !== -1) return;
      if (!event.key || event.key.length > 1) return;
      tempKey = event.key.toLowerCase();
      shortcut.value = 'Key: ' + event.key.toUpperCase();
    });

    save.addEventListener('click', function () {
      write('panicKey', tempKey || 'b');
      write('panicUrl', link.value.trim() || 'https://classroom.google.com');
      if (decoy) write('panicBlocker', decoy.value || 'goguardian');

      save.textContent = 'Saved Successfully!';
      save.style.background = '#10b981';
      setTimeout(function () {
        save.textContent = 'Save Panic Settings';
        save.style.background = '#8b00ff';
      }, 2000);
    });
  }

  function init() {
    initSplash();
    initIframe();
    initCloak();
    initAutoLaunch();
    initPanic();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

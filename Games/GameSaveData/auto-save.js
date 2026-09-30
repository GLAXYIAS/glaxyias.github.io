/**
 * Auto-Save System for Null_X
 * Handles importing and exporting game saves to/from Turso database
 * Uses Cloudflare Worker proxy to communicate with Vercel API
 */

// Scope constants to avoid re-declaration errors if script loads twice
if (typeof TURSO_API_BASE === 'undefined') {
  var TURSO_API_BASE = 'https://apithingy.jlsniperelite4.workers.dev';
  var TURSO_HEADERS = { 'Content-Type': 'application/json' };
}

/**
 * Export (Save) all user game data to Turso database
 * Collects localStorage game saves and sends to cloud
 * @param {string} msgElementId - Element ID to display status messages
 * @param {boolean} showMessage - Whether to display UI messages
 */
window.cloudSave = async function(msgElementId, showMessage = false) {
  const msgEl = document.getElementById(msgElementId);
  const username = localStorage.getItem('chatUser') || 'Guest';
  
  try {
    // Show loading message
    if (msgEl && showMessage) {
      msgEl.textContent = 'Exporting...';
      msgEl.style.color = '#a033ff';
    }

    // Collect all game saves from localStorage
    const gameSaves = {};
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith('game_save_')) {
        gameSaves[key] = localStorage.getItem(key);
      }
    }

    // Prepare data payload
    const saveData = {
      username: username,
      saves: gameSaves,
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
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();

    // Success message
    if (msgEl && showMessage) {
      msgEl.textContent = '✓ Save exported successfully';
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
  }
};

/**
 * Import (Load) game data from Turso database to localStorage
 * Retrieves user saves from cloud and loads into local storage
 * @param {string} msgElementId - Element ID to display status messages
 * @param {boolean} showMessage - Whether to display UI messages
 */
window.cloudLoad = async function(msgElementId, showMessage = false) {
  const msgEl = document.getElementById(msgElementId);
  const username = localStorage.getItem('chatUser') || 'Guest';

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

    // Load saves into localStorage
    if (saveData && saveData.saves) {
      for (let key in saveData.saves) {
        if (saveData.saves.hasOwnProperty(key)) {
          localStorage.setItem(key, saveData.saves[key]);
        }
      }
    }

    // Success message
    if (msgEl && showMessage) {
      msgEl.textContent = '✓ Save imported successfully';
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
  }
};

/**
 * Auto-save interval (optional)
 * Automatically saves game data every 5 minutes
 */
window.enableAutoSaveInterval = function() {
  setInterval(() => {
    const username = localStorage.getItem('chatUser');
    if (username && username !== 'Guest') {
      window.cloudSave(null, false);
      console.log('Auto-save triggered at', new Date().toLocaleTimeString());
    }
  }, 5 * 60 * 1000); // Every 5 minutes
};

/**
 * Sync data before leaving page
 * Ensures latest saves are uploaded when user closes window
 */
window.addEventListener('beforeunload', () => {
  const username = localStorage.getItem('chatUser');
  if (username && username !== 'Guest') {
    const gameSaves = {};
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith('game_save_')) {
        gameSaves[key] = localStorage.getItem(key);
      }
    }

    const saveData = JSON.stringify({
      username: username,
      saves: gameSaves,
      timestamp: new Date().toISOString()
    });

    // Send payload explicitly formatted as application/json
    const blob = new Blob([saveData], { type: 'application/json' });
    navigator.sendBeacon(TURSO_API_BASE + '/save', blob);
  }
});

console.log('Auto-save system initialized. Using Cloudflare Worker proxy.');

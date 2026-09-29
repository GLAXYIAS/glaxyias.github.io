(function () {
  const TOS_VERSION = 'v1';
  const TOS_PAGE = 'TOS/TOS.html';

  function tosKey(username) {
    return 'nullx_tos_' + TOS_VERSION + '_' + String(username || 'guest').toLowerCase();
  }

  function currentUser() {
    return localStorage.getItem('chatUser') || localStorage.getItem('username') || '';
  }

  function hasAgreed(username) {
    if (!username) return localStorage.getItem('nullx_tos_' + TOS_VERSION + '_guest') === '1';
    return localStorage.getItem(tosKey(username)) === '1';
  }

  function markAgreed(username) {
    localStorage.setItem(tosKey(username || 'guest'), '1');
  }

  function showModal() {
    if (document.getElementById('nx-tos-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'nx-tos-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML = `
      <div style="background:#140e24;border:2px solid #8b3dff;border-radius:16px;max-width:480px;width:100%;padding:24px;color:#fff;font-family:system-ui,sans-serif;">
        <h2 style="margin:0 0 12px;color:#fff;">Terms of Service</h2>
        <p style="color:#b3a1cf;font-size:14px;line-height:1.5;margin:0 0 16px;">
          Please review and agree to the site Terms of Service before continuing.
          <a href="${TOS_PAGE}" target="_blank" rel="noopener" style="color:#c4b5fd;">Read full TOS</a>
        </p>
        <label style="display:flex;gap:8px;align-items:flex-start;font-size:13px;color:#ddd;margin-bottom:16px;">
          <input type="checkbox" id="nx-tos-check" style="margin-top:3px;">
          <span>I have read and agree to the Terms of Service.</span>
        </label>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button id="nx-tos-decline" style="background:#251b40;color:#ccc;border:1px solid #3b2d66;border-radius:8px;padding:10px 14px;cursor:pointer;">Decline</button>
          <button id="nx-tos-agree" style="background:#8b3dff;color:#fff;border:none;border-radius:8px;padding:10px 14px;cursor:pointer;font-weight:bold;">Agree</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('nx-tos-decline').onclick = function () {
      alert('You must agree to the TOS to use this site.');
    };
    document.getElementById('nx-tos-agree').onclick = function () {
      const checked = document.getElementById('nx-tos-check').checked;
      if (!checked) { alert('Check the box to agree.'); return; }
      markAgreed(currentUser());
      overlay.remove();
    };
  }

  function gate() {
    const user = currentUser();
    if (!hasAgreed(user)) showModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', gate);
  } else {
    gate();
  }
})();

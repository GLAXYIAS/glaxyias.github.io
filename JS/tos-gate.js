(function () {
  var TOS_VERSION = "v1";
  var TOS_PAGE = "TOS/TOS.html";
  var KEY_GUEST = "nullx_tos_" + TOS_VERSION + "_guest";

  function tosKey(username) {
    return "nullx_tos_" + TOS_VERSION + "_" + String(username || "guest").toLowerCase();
  }
  function currentUser() {
    try {
      return localStorage.getItem("chatUser") || localStorage.getItem("username") || "";
    } catch (e) {
      return "";
    }
  }
  function hasAgreed(username) {
    try {
      if (!username) return localStorage.getItem(KEY_GUEST) === "1";
      return localStorage.getItem(tosKey(username)) === "1";
    } catch (e) {
      return false;
    }
  }
  function markAgreed(username) {
    try {
      localStorage.setItem(tosKey(username || "guest"), "1");
      if (!username) localStorage.setItem(KEY_GUEST, "1");
    } catch (e) {}
  }

  function showModal() {
    if (document.getElementById("nx-tos-overlay")) return;
    var overlay = document.createElement("div");
    overlay.id = "nx-tos-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.92);display:flex;" +
      "align-items:center;justify-content:center;padding:16px;font-family:system-ui,sans-serif;";
    overlay.innerHTML =
      '<div style="background:#12091c;border:2px solid #8b00ff;border-radius:16px;max-width:520px;width:100%;' +
      "padding:28px;color:#fff;box-shadow:0 0 40px rgba(139,0,255,.35);">" +
      '<h2 style="margin:0 0 10px;font-size:1.35rem;">Terms of Service</h2>' +
      '<p style="color:#b0a8c0;font-size:14px;line-height:1.55;margin:0 0 14px;">' +
      "You must agree to the Terms of Service before using Null X. " +
      '<a href="' +
      TOS_PAGE +
      '" target="_blank" rel="noopener" style="color:#c4b5fd;font-weight:600;">Read the full TOS</a>.' +
      "</p>" +
      '<label style="display:flex;gap:10px;align-items:flex-start;font-size:13px;color:#ddd;margin:0 0 18px;cursor:pointer;">' +
      '<input type="checkbox" id="nx-tos-check" style="margin-top:3px;width:16px;height:16px;flex-shrink:0;">' +
      "<span>I have read and agree to the Terms of Service.</span></label>" +
      '<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;">' +
      '<button type="button" id="nx-tos-decline" style="background:#1a1228;color:#aaa;border:1px solid #3b2d66;' +
      'border-radius:8px;padding:10px 16px;cursor:pointer;">Decline</button>' +
      '<button type="button" id="nx-tos-agree" style="background:#8b00ff;color:#fff;border:none;border-radius:8px;' +
      'padding:10px 16px;cursor:pointer;font-weight:bold;">Agree & Continue</button></div></div>';
    document.documentElement.appendChild(overlay);

    document.getElementById("nx-tos-decline").onclick = function () {
      alert("You must agree to the Terms of Service to use this site.");
    };
    document.getElementById("nx-tos-agree").onclick = function () {
      var checked = document.getElementById("nx-tos-check").checked;
      if (!checked) {
        alert("Check the box to confirm you agree.");
        return;
      }
      markAgreed(currentUser());
      overlay.remove();
    };
  }

  function gate() {
    if (!hasAgreed(currentUser())) showModal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", gate);
  } else {
    gate();
  }
  window.__nxTosGate = { hasAgreed: hasAgreed, markAgreed: markAgreed, showModal: showModal };
})();

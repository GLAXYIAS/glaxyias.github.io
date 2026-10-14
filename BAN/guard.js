// BAN/guard.js — ban checks via Cloudflare worker (same API as warnings)
(async function initSecurityGuard() {
  const API_BASE = "https://apithingy.jlsniperelite4.workers.dev";
  const HEADERS = { "Content-Type": "application/json" };

  function currentUsername() {
    try {
      const welcomeEl = document.getElementById("welcome-text");
      if (welcomeEl && welcomeEl.innerText) {
        const n = welcomeEl.innerText.replace(/^Hello,\s*/i, "").trim();
        if (n && n !== "Guest") return n;
      }
      return (
        localStorage.getItem("chatUser") ||
        localStorage.getItem("nxos_logged_user") ||
        localStorage.getItem("username") ||
        ""
      );
    } catch (e) {
      return "";
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

  function applySystemLockout(reasonText) {
    if (document.getElementById("nxos-hard-lock")) return;
    const overlay = document.createElement("div");
    overlay.id = "nxos-hard-lock";
    overlay.className = "nxos-ban-overlay";
    overlay.innerHTML =
      '<div class="nxos-ban-box">' +
      '<div class="nxos-ban-title">ACCESS RESTRICTED</div>' +
      '<p class="nxos-ban-msg">You\'ve Been BANNED.</p>' +
      '<div class="nxos-ban-reason-container">' +
      '<span class="nxos-ban-reason-label">Reason:</span>' +
      '<p class="nxos-ban-reason-text">' +
      reasonText +
      "</p></div></div>";
    document.body.appendChild(overlay);
  }

  const username = currentUsername();
  console.log("[Security System] Guard active (Cloudflare). User:", username || "(guest)");
  if (!username || username === "Guest") return;

  try {
    const response = await fetch(
      API_BASE + "/user-roles?username=" + encodeURIComponent(username),
      { method: "GET", headers: HEADERS }
    );
    if (!response.ok) {
      if (response.status === 404) return;
      console.warn("[Security System] role lookup failed:", response.status);
      return;
    }
    const raw = await response.json();
    const userStatus = unwrapRole(raw);
    if (!userStatus) return;

    const statusString = String(userStatus.is_banned).toUpperCase();
    const isPermanentlyBanned =
      userStatus.is_banned === true ||
      userStatus.is_banned === 1 ||
      statusString === "TRUE" ||
      statusString === "1";

    let isTemporarilyBanned = false;
    if (userStatus.temp_ban_until) {
      const expiryTime = new Date(userStatus.temp_ban_until).getTime();
      if (expiryTime > Date.now()) isTemporarilyBanned = true;
    }

    if (isPermanentlyBanned || isTemporarilyBanned) {
      let banReason =
        userStatus.last_action_reason || "Access restricted by administration.";
      if (isTemporarilyBanned && !isPermanentlyBanned) {
        const expiryDate = new Date(userStatus.temp_ban_until).toLocaleString();
        banReason +=
          '<br><br><span style="color:#ffaa00;">Ban expires at: ' +
          expiryDate +
          "</span>";
      }
      applySystemLockout(banReason);
    }
  } catch (err) {
    console.error("[Security System] Execution exception:", err);
  }
})();

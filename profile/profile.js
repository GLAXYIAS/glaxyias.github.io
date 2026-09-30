
// profile/profile.js — own + public profiles, robust avatars
// Routes through Cloudflare Worker for security
const CLOUDFLARE_WORKER = 'https://apithingy.jlsniperelite4.workers.dev';

const DEFAULT_PFP = 'https://glaxyias.github.io/imgs/Screenshot 2026-09-26 15.55.05.png';

const PROFILE_API_HEADERS = {
  'Content-Type': 'application/json'
};

function initialsAvatar(name) {
  const raw = (name || '?').trim() || '?';
  const parts = raw.split(/[\s._-]+/).filter(Boolean);
  let initials = parts.length >= 2
    ? (parts[0][0] + parts[1][0])
    : raw.slice(0, 2);
  initials = initials.toUpperCase();
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="#4c1d95"/><stop offset="55%" stop-color="#7c3aed"/>` +
    `<stop offset="100%" stop-color="#db2777"/></linearGradient></defs>` +
    `<rect width="128" height="128" fill="url(#g)"/>` +
    `<text x="64" y="72" text-anchor="middle" font-family="system-ui,sans-serif" font-size="48" font-weight="700" fill="#f5f3ff">${initials}</text>` +
    `</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function setAvatar(img, url, username) {
  const fallbackEl = document.getElementById('avatar-fallback');
  const safe = (url && String(url).trim()) || '';

  function showFallback() {
    if (img) {
      img.classList.add('is-hidden');
      img.removeAttribute('src');
    }
    if (fallbackEl) {
      fallbackEl.textContent = (username || '?').trim().slice(0, 2).toUpperCase() || '?';
      fallbackEl.classList.add('show');
    }
  }

  function showImage(src) {
    if (!img) return;
    img.classList.remove('is-hidden');
    if (fallbackEl) fallbackEl.classList.remove('show');
    img.onerror = function () {
      if (img.dataset.triedDefault !== '1') {
        img.dataset.triedDefault = '1';
        img.src = DEFAULT_PFP;
        return;
      }
      showFallback();
    };
    img.src = src;
  }

  if (!safe || safe === 'null' || safe === 'undefined' || safe === 'N/A') {
    showImage(DEFAULT_PFP);
    return;
  }

  if (safe.startsWith('data:') && safe.length > 1500000) {
    showImage(DEFAULT_PFP);
    return;
  }

  showImage(safe);
}

function resizeImageFile(file, maxSide, quality) {
  return new Promise(function (resolve, reject) {
    // If it's a GIF, keep it as a GIF without any modifications to preserve animation
    if (file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function () {
        // Return the raw GIF data URL so animation is preserved
        resolve(reader.result);
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = function () {
      const img = new Image();
      img.onerror = reject;
      img.onload = function () {
        let w = img.width;
        let h = img.height;
        const scale = Math.min(1, maxSide / Math.max(w, h));
        w = Math.round(w * scale);
        h = Math.round(h * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length > 900000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.55);
        }
        resolve(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

window.initProfileSystem = async () => {
  try {
    if (window.top !== window.self || document.getElementById('profileSection')) {
      document.body.classList.add('embedded-profile');
    }
  } catch (e) {}
  if (document.querySelector('.dashboard-wrapper, .main-hub, #gameGrid')) {
    document.body.classList.add('embedded-profile');
  }

  const loggedInUser = localStorage.getItem('chatUser');
  if (!loggedInUser) {
    window.location.href = '../Login/login.html';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const targetUser = (urlParams.get('user') || loggedInUser).trim();
  const isOwnProfile = targetUser.toLowerCase() === loggedInUser.toLowerCase().trim();

  const displayUsername = document.getElementById('display-username');
  const infoUsername = document.getElementById('info-username');
  const heroUsername = document.getElementById('hero-username');
  const heroHandle = document.getElementById('hero-handle');
  const heroBio = document.getElementById('hero-bio');
  const viewBioText = document.getElementById('view-bio-text');
  const joinDateEl = document.getElementById('join-date');
  const infoJoined = document.getElementById('info-joined');
  const pfpPreview = document.getElementById('pfp-preview');
  const pfpFileInput = document.getElementById('pfp-file-input');
  const bioInput = document.getElementById('bio-input');
  const saveBtn = document.getElementById('save-profile-btn');
  const statusEl = document.getElementById('save-status');
  const editSection = document.getElementById('profile-edit');
  const viewDetails = document.getElementById('profile-view-details');
  const viewingChip = document.getElementById('viewing-chip');
  const roleBadge = document.getElementById('role-badge');
  const bioCount = document.getElementById('bio-count');
  const fileNameLabel = document.getElementById('file-name-label');

  let currentPfpUrl = '';
  let pendingUploadDataUrl = '';

  function paintIdentity(name) {
    if (displayUsername) displayUsername.value = name;
    if (infoUsername) infoUsername.textContent = name;
    if (heroUsername) heroUsername.textContent = name;
    if (heroHandle) heroHandle.textContent = '@' + name;
  }

  function paintBio(text) {
    const clean = (text || '').trim();
    if (bioInput) bioInput.value = clean;
    if (bioCount) bioCount.textContent = String(clean.length);
    const display = clean || 'No bio yet.';
    if (heroBio) {
      heroBio.textContent = display;
      heroBio.classList.toggle('is-empty', !clean);
    }
    if (viewBioText) viewBioText.textContent = display;
  }

  function paintJoin(dateStr) {
    const label = dateStr || 'Unknown';
    if (joinDateEl) joinDateEl.textContent = label;
    if (infoJoined) infoJoined.textContent = label;
  }

  paintIdentity(targetUser);
  setAvatar(pfpPreview, DEFAULT_PFP, targetUser);

  if (isOwnProfile) {
    if (editSection) editSection.style.display = '';
    if (viewDetails) viewDetails.style.display = 'none';
    if (viewingChip) viewingChip.style.display = 'none';
  } else {
    if (editSection) editSection.style.display = 'none';
    if (viewDetails) viewDetails.style.display = '';
    if (viewingChip) viewingChip.style.display = '';
    if (saveBtn) saveBtn.style.display = 'none';
  }

  if (bioInput && bioCount) {
    bioInput.addEventListener('input', function () {
      bioCount.textContent = String(bioInput.value.length);
      if (isOwnProfile && heroBio) {
        const t = bioInput.value.trim();
        heroBio.textContent = t || 'No bio yet.';
        heroBio.classList.toggle('is-empty', !t);
      }
    });
  }

  const loadProfile = async () => {
    try {
      const response = await fetch(
        `${CLOUDFLARE_WORKER}/user-roles?username=${encodeURIComponent(targetUser)}`,
        { headers: PROFILE_API_HEADERS }
      );
      const data = response.ok ? await response.json() : null;

      const userResponse = await fetch(
        `${CLOUDFLARE_WORKER}/users?username=${encodeURIComponent(targetUser)}`,
        { headers: PROFILE_API_HEADERS }
      );
      const userData = userResponse.ok ? await userResponse.json() : null;

      if (data && data.username) {
        const profile = data;
        paintBio(profile.bio || '');
        currentPfpUrl = profile.pfp_url || '';
        setAvatar(pfpPreview, currentPfpUrl || DEFAULT_PFP, targetUser);

        if (profile.is_admin && roleBadge) {
          roleBadge.style.display = '';
        } else if (roleBadge) {
          roleBadge.style.display = 'none';
        }

        if (!isOwnProfile) {
          checkAndSetupAdminControls(!!profile.is_admin);
        }
      } else {
        paintBio('');
        currentPfpUrl = '';
        setAvatar(pfpPreview, DEFAULT_PFP, targetUser);
      }

      if (userData && userData.created_at) {
        const joined = new Date(userData.created_at).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        paintJoin(joined);
      } else {
        paintJoin('Unknown');
      }
    } catch (err) {
      console.error('Error loading profile details:', err);
      paintBio('');
      paintJoin('Unknown');
      setAvatar(pfpPreview, DEFAULT_PFP, targetUser);
    }
  };

  const checkAndSetupAdminControls = async (targetUserIsAdmin) => {
    try {
      const response = await fetch(
        `${CLOUDFLARE_WORKER}/user-roles?username=${encodeURIComponent(loggedInUser)}`,
        { headers: PROFILE_API_HEADERS }
      );
      const data = response.ok ? await response.json() : null;
      const meAdmin = data && data.is_admin;
      const container = document.getElementById('admin-actions-container');
      const btn = document.getElementById('toggle-admin-btn');
      const label = document.getElementById('toggle-admin-label');
      if (!meAdmin || !container || !btn) return;

      container.style.display = '';
      if (label) label.textContent = targetUserIsAdmin ? 'Remove admin status' : 'Give admin status';

      btn.onclick = async () => {
        const next = !targetUserIsAdmin;
        const roleRes = await fetch(
          `${CLOUDFLARE_WORKER}/user-roles?username=${encodeURIComponent(targetUser)}`,
          { headers: PROFILE_API_HEADERS }
        );
        if (!roleRes.ok) {
          alert('Could not load role record.');
          return;
        }
        const roleRow = await roleRes.json();
        const res = await fetch(
          `${CLOUDFLARE_WORKER}/user-roles`,
          {
            method: 'PATCH',
            headers: PROFILE_API_HEADERS,
            body: JSON.stringify({ id: roleRow.id, is_admin: next ? 1 : 0 })
          }
        );
        if (res.ok) {
          if (label) label.textContent = next ? 'Remove admin status' : 'Give admin status';
          if (roleBadge) roleBadge.style.display = next ? '' : 'none';
          targetUserIsAdmin = next;
        } else {
          alert('Could not update admin status.');
        }
      };
    } catch (e) {
      console.error(e);
    }
  };

  if (isOwnProfile && pfpFileInput) {
    pfpFileInput.addEventListener('change', async function () {
      const file = pfpFileInput.files && pfpFileInput.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        alert('Please choose an image file.');
        pfpFileInput.value = '';
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        alert('Image is too large (max 4MB before resize).');
        pfpFileInput.value = '';
        return;
      }
      try {
        if (fileNameLabel) fileNameLabel.textContent = 'Processing…';
        const dataUrl = await resizeImageFile(file, 512, 0.82);
        pendingUploadDataUrl = dataUrl;
        setAvatar(pfpPreview, dataUrl, targetUser);
        if (fileNameLabel) fileNameLabel.textContent = file.name + ' (ready)';
      } catch (err) {
        console.error(err);
        alert('Could not process that image.');
        if (fileNameLabel) fileNameLabel.textContent = 'PNG/JPG · max 1.5MB';
      }
    });
  }

  if (isOwnProfile && saveBtn) {
    saveBtn.onclick = async () => {
      const bio = bioInput ? bioInput.value.trim() : '';
      const finalPfp = pendingUploadDataUrl || currentPfpUrl || DEFAULT_PFP;

      if (statusEl) {
        statusEl.textContent = 'Saving…';
        statusEl.style.color = '#c4b5fd';
      }
      saveBtn.disabled = true;

      try {
        const roleRes = await fetch(
          `${CLOUDFLARE_WORKER}/user-roles?username=${encodeURIComponent(loggedInUser)}`,
          { headers: PROFILE_API_HEADERS }
        );
        if (!roleRes.ok) throw new Error('Role record not found.');
        const roleRow = await roleRes.json();
        const response = await fetch(
          `${CLOUDFLARE_WORKER}/user-roles`,
          {
            method: 'PATCH',
            headers: PROFILE_API_HEADERS,
            body: JSON.stringify({
              id: roleRow.id,
              bio: bio,
              pfp_url: finalPfp
            })
          }
        );

        if (response.ok) {
          currentPfpUrl = finalPfp;
          pendingUploadDataUrl = '';
          paintBio(bio);
          setAvatar(pfpPreview, currentPfpUrl, targetUser);
          if (statusEl) {
            statusEl.textContent = 'Profile updated';
            statusEl.style.color = '#4ade80';
            setTimeout(function () { statusEl.textContent = ''; }, 2800);
          }
        } else {
          const errorDetails = await response.json().catch(function () { return {}; });
          console.error('Database feedback:', errorDetails);
          throw new Error('Database refused transaction.');
        }
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = 'Error saving profile. Try a smaller image.';
          statusEl.style.color = '#ff4a4a';
        }
        console.error(err);
      } finally {
        saveBtn.disabled = false;
      }
    };
  }

  loadProfile();
};

window.initProfileSystem();

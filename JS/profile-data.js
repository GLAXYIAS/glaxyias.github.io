/**
 * Profile card controller for the home-page Profile panel.
 *
 * The card markup already lives in index.html (#profileSection). This script
 * moves it into the modal, removes the old iframe element, and fills it from the
 * same Cloudflare endpoint the profile page uses. No nested document is created.
 */
(function () {
  'use strict';

  var WORKER = 'https://apithingy.jlsniperelite4.workers.dev';
  var DEFAULT_PFP = 'imgs/newpfp.png';

  var modal = document.getElementById('profile-modal');
  var shell = modal && modal.querySelector('.profile-modal-shell');
  var section = document.getElementById('profileSection');
  if (!modal || !shell || !section) return;

  var frame = document.getElementById('profile-modal-frame');
  if (frame && frame.parentNode) frame.parentNode.removeChild(frame);

  var body = document.createElement('div');
  body.id = 'profile-modal-body';
  body.style.cssText =
    'flex:1 1 auto;min-height:0;overflow-y:auto;padding:28px 16px 48px;' +
    'display:flex;justify-content:center;align-items:flex-start;background:#0a0a0c;';
  body.appendChild(section);
  shell.appendChild(body);

  var avatar = document.getElementById('pfp-preview');
  var nameEl = document.getElementById('display-username');
  var bioEl = document.getElementById('bio-input');
  var joinedEl = document.getElementById('join-date');
  var infoUser = document.getElementById('info-username');
  var fileEl = document.getElementById('pfp-file-input');
  var saveBtn = document.getElementById('save-profile-btn');
  var statusEl = document.getElementById('save-status');
  var details = section.querySelector('.profile-details-section');
  var upload = section.querySelector('.avatar-upload-section');
  var noteEl = null;

  var roleId = null;
  var currentPfp = '';
  var pendingPfp = '';
  var loadedFor = '';

  function user() {
    try { return localStorage.getItem('chatUser') || ''; } catch (e) { return ''; }
  }

  function setStatus(text, color) {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.style.color = color || '#c4b5fd';
  }

  function initialsAvatar(name) {
    var raw = (name || '?').trim() || '?';
    var parts = raw.split(/[\s._-]+/).filter(Boolean);
    var initials = parts.length >= 2 ? parts[0][0] + parts[1][0] : raw.slice(0, 2);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#4c1d95"/><stop offset="55%" stop-color="#7c3aed"/>' +
      '<stop offset="100%" stop-color="#db2777"/></linearGradient></defs>' +
      '<rect width="128" height="128" fill="url(#g)"/>' +
      '<text x="64" y="72" text-anchor="middle" font-family="system-ui,sans-serif" font-size="48" font-weight="700" fill="#f5f3ff">' +
      initials.toUpperCase() + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function paintAvatar(url, name) {
    if (!avatar) return;
    var safe = (url == null ? '' : String(url)).trim();
    if (!safe || safe === 'null' || safe === 'undefined' || safe === 'N/A') {
      avatar.src = DEFAULT_PFP;
      return;
    }
    avatar.onerror = function () {
      avatar.onerror = null;
      avatar.src = initialsAvatar(name);
    };
    avatar.src = safe;
  }

  function renderGuest() {
    if (upload) upload.style.display = 'none';
    if (details) details.style.display = 'none';
    paintAvatar('', 'Guest');
    if (nameEl) nameEl.textContent = 'Guest';
    if (infoUser) infoUser.textContent = 'Guest';
    if (joinedEl) joinedEl.textContent = '\u2014';
    setStatus('');
    if (noteEl) return;
    noteEl = document.createElement('p');
    noteEl.id = 'profile-guest-note';
    noteEl.style.cssText = 'color:#a5a0b5;font-size:13px;line-height:1.6;margin:0;';
    noteEl.innerHTML = 'You are not signed in yet. ' +
      '<a href="Login/login.html" style="color:#b98cff;font-weight:600;">Sign in</a> to set your avatar and bio, ' +
      'or <a href="profile/profile.html" style="color:#b98cff;font-weight:600;">open the full profile page</a>.';
    var card = section.querySelector('.profile-card');
    if (card) card.appendChild(noteEl);
  }

  function renderUser(name) {
    if (upload) upload.style.display = '';
    if (details) details.style.display = '';
    if (noteEl && noteEl.parentNode) { noteEl.parentNode.removeChild(noteEl); noteEl = null; }
    if (nameEl) nameEl.textContent = name;
    if (infoUser) infoUser.textContent = name;
    paintAvatar('', name);
  }

  function resizeImage(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function () {
        if (file.type === 'image/gif') { resolve(reader.result); return; }
        var img = new Image();
        img.onerror = reject;
        img.onload = function () {
          var w = img.width;
          var h = img.height;
          var scale = Math.min(1, maxSide / Math.max(w, h));
          w = Math.round(w * scale);
          h = Math.round(h * scale);
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          var dataUrl = canvas.toDataURL('image/jpeg', quality);
          if (dataUrl.length > 900000) dataUrl = canvas.toDataURL('image/jpeg', 0.55);
          resolve(dataUrl);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function loadProfile(name) {
    if (loadedFor === name) return;
    loadedFor = name;
    setStatus('Loading\u2026', '#c4b5fd');

    fetch(WORKER + '/user-roles?username=' + encodeURIComponent(name), {
      headers: { 'Content-Type': 'application/json' }
    }).then(function (res) {
      return res.ok ? res.json() : null;
    }).then(function (role) {
      if (!role || !role.username) return;
      roleId = role.id == null ? null : role.id;
      currentPfp = role.pfp_url || '';
      paintAvatar(currentPfp, name);
      if (bioEl) bioEl.value = (role.bio || '').slice(0, 250);
      setStatus('');
    }).catch(function () {
      setStatus('Could not load profile details.', '#ff4a4a');
    });

    fetch(WORKER + '/users?username=' + encodeURIComponent(name), {
      headers: { 'Content-Type': 'application/json' }
    }).then(function (res) {
      return res.ok ? res.json() : null;
    }).then(function (data) {
      if (!data || !data.created_at || !joinedEl) return;
      var when = new Date(data.created_at);
      if (!isNaN(when.getTime())) {
        joinedEl.textContent = when.toLocaleDateString(undefined, {
          year: 'numeric', month: 'long', day: 'numeric'
        });
      }
    }).catch(function () {});
  }

  function load() {
    section.style.setProperty('display', 'block', 'important');
    var name = user();
    if (!name) {
      loadedFor = '';
      renderGuest();
      return;
    }
    renderUser(name);
    loadProfile(name);
  }

  if (fileEl) {
    fileEl.addEventListener('change', function () {
      var file = fileEl.files && fileEl.files[0];
      if (!file) return;
      if (!file.type || file.type.indexOf('image/') !== 0) {
        setStatus('Please choose an image file.', '#ff4a4a');
        fileEl.value = '';
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        setStatus('That image is too large (max 4MB).', '#ff4a4a');
        fileEl.value = '';
        return;
      }
      setStatus('Processing image\u2026', '#c4b5fd');
      resizeImage(file, 512, 0.82).then(function (dataUrl) {
        pendingPfp = dataUrl;
        paintAvatar(dataUrl, nameEl ? nameEl.textContent : '');
        setStatus('Image ready to save.', '#c4b5fd');
      }).catch(function () {
        setStatus('Could not process that image.', '#ff4a4a');
      });
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      var name = user();
      if (!name) return;

      var bio = bioEl ? bioEl.value.trim() : '';
      var finalPfp = pendingPfp || currentPfp || DEFAULT_PFP;
      saveBtn.disabled = true;
      setStatus('Saving\u2026', '#c4b5fd');

      function patch(id) {
        return fetch(WORKER + '/user-roles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: id, bio: bio, pfp_url: finalPfp })
        });
      }

      var ensureId = roleId
        ? Promise.resolve(roleId)
        : fetch(WORKER + '/user-roles?username=' + encodeURIComponent(name), {
            headers: { 'Content-Type': 'application/json' }
          }).then(function (res) {
            return res.ok ? res.json() : null;
          }).then(function (row) {
            if (!row || row.id == null) throw new Error('No profile row');
            roleId = row.id;
            return roleId;
          });

      ensureId.then(patch).then(function (res) {
        if (!res.ok) throw new Error('Save refused');
        currentPfp = finalPfp;
        pendingPfp = '';
        setStatus('Profile updated', '#4ade80');
        setTimeout(function () { setStatus(''); }, 2800);
      }).catch(function () {
        setStatus('Could not save. Try a smaller image.', '#ff4a4a');
      }).then(function () {
        saveBtn.disabled = false;
      });
    });
  }

  window.nxProfilePanel = { load: load };
})();

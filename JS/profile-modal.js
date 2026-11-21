/**
 * Home-page profile modal shell.
 *
 * Opens the panel, keeps focus contained and closes it again. The panel content
 * is the profile card already present in index.html, filled by
 * JS/profile-data.js. The old iframe that loaded profile/profile.html (and
 * bounced to the login page when signed out) is gone.
 */
(function () {
  'use strict';

  var modal = document.getElementById('profile-modal');
  var closeBtn = document.getElementById('profile-modal-close');
  if (!modal || !closeBtn) return;

  var lastFocused = null;
  var previousNavId = null;

  function isOpen() {
    return modal.classList.contains('is-open');
  }

  function setNavActive(id) {
    var items = document.querySelectorAll('.left-nav .nav-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', items[i].id === id);
    }
  }

  function setBackgroundInert(on) {
    var dashboard = document.querySelector('.dashboard');
    if (dashboard && 'inert' in dashboard) dashboard.inert = on;
  }

  function openProfileModal() {
    if (isOpen()) return;

    lastFocused = document.activeElement;
    var activeNav = document.querySelector('.left-nav .nav-item.active');
    previousNavId = (activeNav && activeNav.id) || null;

    // Fill the in-page profile card (no nested document).
    if (window.nxProfilePanel) window.nxProfilePanel.load();

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('profile-modal-open');
    setNavActive('nav-profile');
    setBackgroundInert(true);

    try {
      closeBtn.focus({ preventScroll: true });
    } catch (e) {
      closeBtn.focus();
    }
  }

  function closeProfileModal() {
    if (!isOpen()) return;

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('profile-modal-open');
    setNavActive(previousNavId || 'nav-home');
    setBackgroundInert(false);

    var back = lastFocused && document.contains(lastFocused)
      ? lastFocused
      : document.getElementById('nav-profile');
    if (back && back.focus) {
      try {
        back.focus({ preventScroll: true });
      } catch (e) {
        back.focus();
      }
    }
  }

  // Capture phase on purpose: main.js binds nav-profile with an onclick handler
  // that injects the profile page into the dashboard. Stopping the event here
  // keeps that from running.
  document.addEventListener(
    'click',
    function (e) {
      var target = e.target;
      var link =
        target && target.closest ? target.closest('#nav-profile') : null;
      if (!link) return;
      e.preventDefault();
      e.stopPropagation();
      openProfileModal();
    },
    true
  );

  closeBtn.addEventListener('click', closeProfileModal);

  modal.addEventListener('mousedown', function (e) {
    if (e.target === modal) closeProfileModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) {
      e.preventDefault();
      closeProfileModal();
    }
  });

  window.openProfileModal = openProfileModal;
  window.closeProfileModal = closeProfileModal;
})();

/**
 * Game registry patch: Melon Sandbox.
 *
 * Melon Sandbox (the official web build of Melon Playground) is served from its
 * own repository, https://github.com/GLAXYIAS/melon-sandbox, where a GitHub
 * workflow mirrors the official Unity WebGL build onto GitHub Pages. The game
 * therefore runs from GitHub instead of being embedded from melonsandbox.com.
 *
 * index.html loads this script with `defer`, so it runs after JS/main.js has
 * created _0xData and before main.js renders the grid on DOMContentLoaded.
 * Delete this block to remove the game again.
 */
(function () {
  'use strict';

  if (typeof _0xData === 'undefined' || !Array.isArray(_0xData)) return;

  var entry = {
    id: 'melon-sandbox',
    title: 'Melon Sandbox',
    url: 'https://glaxyias.github.io/melon-sandbox/',
    image: 'https://glaxyias.github.io/melon-sandbox/icon-512.png',
    desc: 'The official Melon Sandbox web build: drop melons and ragdolls into a physics playground, build contraptions, and blow everything up.',
    popular: true,
    tags: ['Sandbox', 'Simulation', 'Casual']
  };

  for (var i = 0; i < _0xData.length; i++) {
    if (_0xData[i] && _0xData[i].id === entry.id) {
      _0xData[i].url = entry.url;
      _0xData[i].image = entry.image;
      return;
    }
  }

  _0xData.unshift(entry);
})();

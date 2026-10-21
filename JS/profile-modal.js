/**
 * Home-page profile modal.
 *
 * The Profile item in the left nav used to dump the whole profile page into the
 * middle of the home page without its stylesheet, which looked squashed. It now
 * opens profile/profile.html fullscreen in an iframe, with ?embed=1 hiding that
 * page's own sidebar. The chat keeps linking to profile.html directly, so its
 * version is untouched.
 */
(function () {
  'use strict';

  var modal = document.getElementById('profile-modal');
  var frame = document.getElementById('profile-modal-frame');
  var closeBtn = document.getElementById('profile-modal-close');
  if (!modal || !frame || !closeBtn) return;

  var PROFILE_URL = 'profile/profile.html?embed=1';
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

    // Fresh load every time so a new avatar / bio is never stale.
    frame.src = PROFILE_URL + '&v=' + Date.now();

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

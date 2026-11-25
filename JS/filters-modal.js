/* Single Filters button + modal for the game library filters. */
(function () {
  var modal = null;
  var trigger = null;
  var bar = null;

  function el(id) { return document.getElementById(id); }

  function makeModal() {
    if (el('filtersModal')) return el('filtersModal');
    modal = document.createElement('div');
    modal.id = 'filtersModal';
    modal.className = 'filters-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'filtersModalTitle');
    modal.innerHTML =
      '<div class="filters-modal-card">' +
        '<div class="filters-modal-head">' +
          '<h2 class="filters-modal-title" id="filtersModalTitle">Filters</h2>' +
          '<button type="button" class="filters-modal-close" id="filtersModalClose" aria-label="Close filters">&times;</button>' +
        '</div>' +
        '<div class="filters-modal-body" id="filtersModalBody"></div>' +
        '<div class="filters-modal-foot">' +
          '<button type="button" class="filters-modal-secondary" id="filtersModalReset">Clear all</button>' +
          '<button type="button" class="filters-modal-primary" id="filtersModalApply">Show games</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    return modal;
  }

  function labelField(id, text) {
    var field = el(id);
    if (!field || !field.parentNode || field.closest('.filters-field')) return;
    var wrap = document.createElement('div');
    wrap.className = 'filters-field';
    var label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = text;
    field.parentNode.insertBefore(wrap, field);
    wrap.appendChild(label);
    wrap.appendChild(field);
  }

  function prepareBar() {
    bar = el('nx-filter-bar');
    var body = el('filtersModalBody');
    if (!bar || !body) return false;
    if (bar.parentNode !== body) body.appendChild(bar);
    bar.style.setProperty('display', 'flex', 'important');
    labelField('nx-filter-players', 'Players');
    labelField('nx-filter-genre', 'Genre');
    labelField('nx-filter-tag', 'Tag');
    labelField('nx-filter-device', 'Device');
    return true;
  }

  function activeFilters() {
    var n = 0;
    var players = el('nx-filter-players');
    var genre = el('nx-filter-genre');
    var tag = el('nx-filter-tag');
    var device = el('nx-filter-device');
    var recent = el('nx-filter-recent');
    if (players && players.value) n++;
    if (genre && genre.value) n++;
    if (tag && tag.value) n++;
    if (device && device.value) n++;
    if (recent && recent.getAttribute('aria-pressed') === 'true') n++;
    return n;
  }

  function updateBadge() {
    var badge = el('filtersBadge');
    if (!badge) return;
    var n = activeFilters();
    badge.textContent = String(n);
    badge.hidden = n === 0;
  }

  function openModal() {
    if (!prepareBar()) return;
    modal.hidden = false;
    document.body.classList.add('filters-modal-open');
    trigger.setAttribute('aria-expanded', 'true');
    updateBadge();
    var first = bar.querySelector('select');
    if (first) setTimeout(function () { first.focus(); }, 30);
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('filters-modal-open');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
  }

  function boot() {
    var host = el('gameFilterBar');
    if (!host) return;
    host.querySelectorAll('.filter-label, [data-player-filter]').forEach(function (node) {
      node.remove();
    });
    trigger = el('filtersTrigger');
    if (!trigger) {
      trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.id = 'filtersTrigger';
      trigger.className = 'filters-trigger';
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.setAttribute('aria-controls', 'filtersModal');
      trigger.innerHTML = '<span>Filters</span><span class="filters-badge" id="filtersBadge" hidden>0</span>';
      host.appendChild(trigger);
    }
    trigger.setAttribute('aria-expanded', 'false');
    modal = makeModal();
    trigger.addEventListener('click', openModal);
    el('filtersModalClose').addEventListener('click', closeModal);
    el('filtersModalApply').addEventListener('click', function () {
      if (typeof applyLibraryFilters === 'function') applyLibraryFilters({ keepLibrary: true });
      updateBadge();
      closeModal();
    });
    el('filtersModalReset').addEventListener('click', function () {
      var clear = el('nx-filter-clear');
      if (clear) clear.click();
      setTimeout(updateBadge, 0);
    });
    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeModal();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && modal && !modal.hidden) {
        event.preventDefault();
        closeModal();
      }
    });
    modal.addEventListener('change', updateBadge);
    modal.addEventListener('click', function () { setTimeout(updateBadge, 0); });

    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      if (prepareBar()) {
        clearInterval(timer);
        updateBadge();
      } else if (tries > 100) {
        clearInterval(timer);
      }
    }, 50);
    prepareBar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

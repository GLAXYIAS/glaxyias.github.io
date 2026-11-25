#!/usr/bin/env python3
import re
from pathlib import Path

root = Path('.')

# 1. One Filters button replaces the always-visible player chips.
idx = root / 'index.html'
html = idx.read_text()
pattern = re.compile(r'\n[ \t]*<div class="game-filters-container" id="gameFilterBar".*?\n[ \t]*</div>', re.S)
new_bar = '''
      <div class="game-filters-container" id="gameFilterBar" role="group" aria-label="Game filters">
        <button type="button" class="filters-trigger" id="filtersTrigger" aria-haspopup="dialog" aria-controls="filtersModal" aria-expanded="false">
          <span>Filters</span>
          <span class="filters-badge" id="filtersBadge" hidden>0</span>
        </button>
      </div>'''
html, n = pattern.subn(new_bar, html, count=1)
if n != 1:
    raise SystemExit('filter bar markup not found')

style_link = '  <link rel="stylesheet" href="CSS/style.css?v=20261125themes3">\n'
if style_link not in html:
    raise SystemExit('style link not found')
html = html.replace(style_link, style_link + '  <link rel="stylesheet" href="CSS/filters-modal.css?v=20261125filters1">\n', 1)

for old, new in [
    ('JS/main.js?v=20261125local1', 'JS/main.js?v=20261125filters1'),
    ('JS/fragen-17-games-v2.js?v=20261117b', 'JS/fragen-17-games-v2.js?v=20261125filters1'),
]:
    if old not in html:
        raise SystemExit(f'missing cache token: {old}')
    html = html.replace(old, new, 1)

fragen_tag = '    <script src="JS/fragen-17-games-v2.js?v=20261125filters1"></script>'
if fragen_tag not in html:
    raise SystemExit('fragen script tag not found')
html = html.replace(
    fragen_tag,
    fragen_tag + '\n    <script src="JS/filters-modal.js?v=20261125filters1"></script>',
    1,
)
idx.write_text(html)

# 2. Keep the filter bar usable while it lives inside the modal.
main = root / 'JS/main.js'
js = main.read_text()
old = '  const active = !!term || !!genre || !!tag || !!device || recentOnly || players !== "all";\n\n  if (!active && !keepLibrary) {'
new = '  const active = !!term || !!genre || !!tag || !!device || recentOnly || players !== "all";\n  const filtersModalOpen = !!document.querySelector(".filters-modal:not([hidden])");\n\n  if (!active && !keepLibrary && !filtersModalOpen) {'
if js.count(old) != 1:
    raise SystemExit('applyLibraryFilters block not found')
js = js.replace(old, new, 1)
old = '  const syncBar = function () {\n    bar.style.display = gridEl.style.display === "grid" ? "flex" : "none";\n  };'
new = '  const syncBar = function () {\n    if (bar.closest(".filters-modal")) { bar.style.setProperty("display", "flex", "important"); return; }\n    bar.style.display = gridEl.style.display === "grid" ? "flex" : "none";\n  };'
if js.count(old) != 1:
    raise SystemExit('syncBar block not found')
js = js.replace(old, new, 1)
main.write_text(js)

# 3. fragen's visibility watcher must not hide the bar inside the modal.
fragen = root / 'JS/fragen-17-games-v2.js'
fj = fragen.read_text()
old = '  function watchBarVisibility(bar) {\n    var grid = document.getElementById("gameGrid");\n    if (!grid) return;'
new = '  function watchBarVisibility(bar) {\n    if (bar.closest(".filters-modal")) return;\n    var grid = document.getElementById("gameGrid");\n    if (!grid) return;'
if fj.count(old) != 1:
    raise SystemExit('watchBarVisibility block not found')
fj = fj.replace(old, new, 1)
fragen.write_text(fj)
print('patched filters')

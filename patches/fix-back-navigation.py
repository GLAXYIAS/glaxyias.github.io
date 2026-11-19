import pathlib

# 1. Direct launches (iframes disabled in Settings) should add a history entry
# so the browser Back button returns to the catalogue, not a blank tab.
main = pathlib.Path('JS/main.js')
text = main.read_text(encoding='utf-8')
old_main = '    window.location.replace(gameSrc);'
assert text.count(old_main) == 1, 'replace anchor missing'
text = text.replace(old_main, '    window.location.assign(gameSrc);')
main.write_text(text, encoding='utf-8')

# 2. When popups are blocked the launcher used to document.write the game shell
# into the catalogue tab, which leaves no history entry. Navigate to the game
# directly instead, so Back returns to the catalogue.
blob = pathlib.Path('JS/game-about-blank.js')
text = blob.read_text(encoding='utf-8')

helper_anchor = '  function install() {'
assert text.count(helper_anchor) == 1, 'install anchor missing'
helper = '''  function directSrc(gameId) {
    var game = null;
    try {
      if (typeof _0xData !== 'undefined' && Array.isArray(_0xData)) {
        game = _0xData.find(function (g) { return g && String(g.id) === String(gameId); });
      }
    } catch (e) {}
    if (!game || !game.url) return null;
    var raw = String(game.url);
    if (/^https?:\\/\\//i.test(raw)) return raw;
    var root = (location.origin || 'https://glaxyias.github.io').replace(/\\/$/, '') + '/';
    return root + raw.replace(/^\\.\\.\\//, '').replace(/^\\//, '');
  }

  function install() {'''
text = text.replace(helper_anchor, helper)

old_fallback = '      if (!popup || !popup.document) return original.apply(this, arguments);'
assert text.count(old_fallback) == 1, 'popup fallback anchor missing'
new_fallback = '''      if (!popup || !popup.document) {
        try { if (popup) popup.close(); } catch (e) {}
        var direct = directSrc(gameId);
        if (direct) { window.location.assign(direct); return; }
        return original.apply(this, arguments);
      }'''
text = text.replace(old_fallback, new_fallback)
blob.write_text(text, encoding='utf-8')
print('patched back navigation')

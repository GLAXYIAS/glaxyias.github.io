import pathlib

path = pathlib.Path('JS/main.js')
lines = path.read_text(encoding='utf-8').split('\n')

i = lines.index('  function startIframe() {')
assert lines[i + 1] == '    frame.src = GAME_SRC;', lines[i + 1]
assert lines[i + 2] == "    frame.addEventListener('load', function () {", lines[i + 2]
assert lines[i + 3] == '      clearTimeout(loadTimer);'
assert lines[i + 4] == '      hideError();'
assert lines[i + 5] == '      finish();'
assert lines[i + 6] == '    });'
assert lines[i + 7] == '  }'

block = [
    '  var frameLoaded = false;',
    '  function markFrameLoaded() {',
    '    if (frameLoaded) return;',
    '    frameLoaded = true;',
    '    clearTimeout(loadTimer);',
    '    hideError();',
    '    finish();',
    '  }',
    '',
    '  function startIframe() {',
    '    /* Attach the listener before navigating the frame. On a warm cache a game',
    '       can finish loading before a listener added afterwards, which left the',
    '       loading overlay up forever when a second game was launched. */',
    "    frame.addEventListener('load', markFrameLoaded);",
    '    frame.src = GAME_SRC;',
    '',
    '    /* Safety net in case the load event is missed entirely. */',
    '    var checks = 0;',
    '    var guard = setInterval(function () {',
    '      checks++;',
    '      if (frameLoaded || checks > 60) { clearInterval(guard); return; }',
    '      try {',
    '        var doc = frame.contentDocument;',
    "        if (doc && doc.readyState === 'complete' && doc.location && doc.location.href && doc.location.href !== 'about:blank') {",
    '          clearInterval(guard);',
    '          markFrameLoaded();',
    '        }',
    '      } catch (e) { clearInterval(guard); }',
    '    }, 1000);',
    '  }',
]

lines[i:i + 8] = block
path.write_text('\n'.join(lines), encoding='utf-8')
print('patched the game shell')

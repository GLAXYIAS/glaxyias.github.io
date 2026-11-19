#!/usr/bin/env python3
"""Apply the 1v1.LOL mirror and profile-panel edits to the site checkout.

Run from the repository root (the import workflow does this). Every replacement
fails loudly instead of silently skipping, so a changed upstream file stops the
run rather than shipping a half-patched page.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent


def read(path):
    with open(path, encoding="utf-8", newline="") as handle:
        return handle.read()


def write(path, text):
    with open(path, "w", encoding="utf-8", newline="") as handle:
        handle.write(text)


def patch(relative, pairs):
    path = ROOT / relative
    text = read(path)
    for old, new in pairs:
        if old not in text:
            raise SystemExit("%s: pattern not found: %r" % (relative, old[:70]))
        text = text.replace(old, new)
    write(path, text)
    print("patched", relative)


# 1. Home page: load the controller that fills the in-page profile card.
patch(
    "index.html",
    [(
        '  <script src="JS/profile-modal.js?v=1" defer></script>',
        '  <script src="JS/profile-modal.js?v=1" defer></script>\n'
        '  <script src="JS/profile-data.js?v=1" defer></script>',
    )],
)

# 2. Modal shell: stop loading profile/profile.html in an iframe.
patch(
    "JS/profile-modal.js",
    [
        (
            "/**\n * Home-page profile modal.\n *\n * The Profile item in the left nav used to dump the whole profile page into the\n * middle of the home page without its stylesheet, which looked squashed. It now\n * opens profile/profile.html fullscreen in an iframe, with ?embed=1 hiding that\n * page's own sidebar. The chat keeps linking to profile.html directly, so its\n * version is untouched.\n */",
            "/**\n * Home-page profile modal shell.\n *\n * Opens the panel, keeps focus contained and closes it again. The panel content\n * is the profile card already present in index.html, filled by\n * JS/profile-data.js. The old iframe that loaded profile/profile.html (and\n * bounced to the login page when signed out) is gone.\n */",
        ),
        (
            "  var modal = document.getElementById('profile-modal');\n"
            "  var frame = document.getElementById('profile-modal-frame');\n"
            "  var closeBtn = document.getElementById('profile-modal-close');\n"
            "  if (!modal || !frame || !closeBtn) return;\n\n"
            "  var PROFILE_URL = 'profile/profile.html?embed=1';\n",
            "  var modal = document.getElementById('profile-modal');\n"
            "  var closeBtn = document.getElementById('profile-modal-close');\n"
            "  if (!modal || !closeBtn) return;\n\n",
        ),
        (
            "    // Fresh load every time so a new avatar / bio is never stale.\n"
            "    frame.src = PROFILE_URL + '&v=' + Date.now();",
            "    // Fill the in-page profile card (no nested document).\n"
            "    if (window.nxProfilePanel) window.nxProfilePanel.load();",
        ),
    ],
)

# 3. Catalogue: add the 1v1.LOL card and tag it as a non-HTML game.
patch(
    "JS/fragen-17-games-v2.js",
    [
        (
            '      image: "https://azgames.io/upload/cache/upload/imgs/orbitkick3-m180x180.png",\n'
            '      tags: ["Sports", "Casual"]\n'
            "    }\n"
            "  ];",
            '      image: "https://azgames.io/upload/cache/upload/imgs/orbitkick3-m180x180.png",\n'
            '      tags: ["Sports", "Casual"]\n'
            "    },\n"
            "    {\n"
            '      id: "1v1-lol",\n'
            '      title: "1v1.LOL",\n'
            '      url: "../Games/1v1-lol/index.html",\n'
            '      desc: "Build, box fight and drop into battle royale in a fast browser shooter with 1v1 Clash, Zone Wars and creative mode.",\n'
            '      image: "../Games/1v1-lol/cover.webp",\n'
            '      tags: ["Shooter", "Multiplayer", "Action"]\n'
            "    }\n"
            "  ];",
        ),
        (
            '    "ragdoll-playground",\n    "orbit-kick",\n  ];',
            '    "ragdoll-playground",\n    "orbit-kick",\n    "1v1-lol",\n  ];',
        ),
    ],
)

# 4. Game page: drop the ad/analytics tags, point the loader at local files and
#    stitch the split Unity data payload back together.
GAME_INDEX = "Games/1v1-lol/index.html"
path = ROOT / GAME_INDEX
html = read(path)

gtm = (
    '<script async src="https://www.googletagmanager.com/gtag/js?id=G-WK65K45ZPE"></script>\n'
    "<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}"
    "gtag('js',new Date());gtag('config','G-WK65K45ZPE',{cookie_flags:'SameSite=None;Secure'});</script>\n"
)
if gtm not in html:
    raise SystemExit("%s: Google Tag Manager block not found" % GAME_INDEX)
html = html.replace(gtm, "")
html = re.sub(r'\s*<script src="js/ads\.js[^"]*"></script>', "", html)

if re.search(r'<script[^>]+js/ads\.js', html):
    raise SystemExit("%s: ad script not removed" % GAME_INDEX)

config = (
    "  <script>\n"
    "    /* The Unity data payload is 128 MB, over the per-file limit for the repo, so it\n"
    "       is stored as two parts and stitched back together by js/local-host.js. */\n"
    "    window.NX_1V1_DATA_PARTS = ['Build/WebGL.data.c0de4610.unityweb.part1', 'Build/WebGL.data.c0de4610.unityweb.part2'];\n"
    "    window.NX_1V1_DATA_SIZE = 128452201;\n"
    "  </script>\n"
)
loader_tag = '  <script src="Build/WebGL.loader.js?v=a2f6fac2"></script>'
if loader_tag not in html:
    raise SystemExit("%s: loader tag not found" % GAME_INDEX)
html = html.replace(
    loader_tag, config + '  <script src="js/local-host.js"></script>\n' + loader_tag
)

html = html.replace("url('/fonts/dimbo.ttf')", "url('fonts/dimbo.ttf')")
html = html.replace("url(/fonts/blinker/blinker-600.woff2", "url(fonts/blinker/blinker-600.woff2")

write(path, html)
print("patched", GAME_INDEX)

# 5. Loader config: local build files instead of the original CDN.
patch(
    "Games/1v1-lol/js/boot.js",
    [("https://cdn.1v1lolreloaded.com/Build/", "Build/")],
)

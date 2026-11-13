#!/usr/bin/env python3
"""Add explicit filter tags to every game and wire tag filtering into main.js."""
import hashlib
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "JS" / "main.js"
COVERS = ROOT / "Games" / "_covers"

PRIMARY_RULES = [
    ("Racing", r"moto|drive|drift|truck|\bcar\b|bike|biker|jetski|snow rider|subway surf|traffic|eggy car|hill|race|racing|kart|speed trial"),
    ("Shooter", r"shoot|gun|sniper|bullet|superhot|firearm|strike force|\bgun\b"),
    ("Sports", r"baseball|basket|bowl|soccer|football|dunk|golf|tennis|boxing|volley|penalty|head soccer"),
    ("Idle", r"idle|clicker|tycoon|miner|mining|cookie|doge|bitcoin|capitalist|empire|airline|aviation|babel tower"),
    ("Horror", r"horror|backrooms|skinwalker|haunted|creepy|eerie|terrifying|literature club|dokidoki|baldi|five nights|fnaf"),
    ("Puzzle", r"puzzle|wordle|riddle|merge|2048|minesweeper|hextris|tetris|solitaire|checkers|chess|sudoku|crossword|connect 3|sort|match|slide|block"),
    ("Platformer", r"obby|parkour|platformer|vex|leap|jump|jumping|daddish|chicco|climb|mario|sonic|flappy|doodle|jetpack|duck life|learn to fly"),
    ("Strategy", r"strateg|tower defense|bloons|kingdom rush|chess|checkers|nations|ages of conflict"),
    ("Simulation", r"simulat|sandbox|townscaper|sandboxels"),
    ("Adventure", r"adventure|quest|dungeon|mystery|escape|riddle school"),
    ("Party", r"party|trivia|quiz|feud|wheel|dice|button|just hit"),
    ("Action", r"battle|arena|royale|agar|combat|brawl|fight|pirate|survival|slap|punch|knife|sword|gun mayhem|happy wheels|iron snout|volley"),
]
SECONDARY_RULES = [
    ("Multiplayer", r"\bmultiplayer\b|\b2 player\b|\btwo player\b|co-op|coop|\bversus\b|battle royale|\bio\b|\.io"),
    ("Retro", r"retro|classic|pixel|8-bit|16-bit|arcade|atari|\bnes\b|snes|sega|gameboy"),
    ("3D", r"\b3d\b"),
    ("2D", r"\b2d\b"),
    ("Fan Game", r"mario|sonic|pokemon|zelda|fan game"),
]
TAG_OVERRIDES = {
    "jumbo-mario": ["Platformer", "Retro", "Fan Game"],
    "jumping-shell": ["Platformer", "Arcade"],
    "jetski-race": ["Racing", "Sports"],
    "just-hit-the-button": ["Party", "Arcade"],
    "gl_happy_wheels": ["Racing", "Action", "Multiplayer"],
    "gl_iron_snout": ["Action", "Arcade"],
    "gl_level_devil": ["Platformer", "Puzzle"],
    "gl_n_gon": ["Arcade"],
}


def field(text, name):
    m = re.search(r'\b' + re.escape(name) + r':\s*"((?:\\.|[^"\\])*)"', text)
    if not m:
        return ""
    return m.group(1).replace('\\"', '"').replace("\\\\", "\\")


def safe_id(value):
    return re.sub(r"[^a-zA-Z0-9_-]+", "-", value).strip("-").lower() or "game"


def array_bounds(source, marker):
    start = source.index(marker) + len(marker) - 1
    return array_bounds_from(source, start)


def array_bounds_from(source, start):
    depth = 0
    quote = False
    escape = False
    for i in range(start, len(source)):
        ch = source[i]
        if quote:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                quote = False
            continue
        if ch == '"':
            quote = True
        elif ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                return start, i + 1
    raise ValueError("unclosed array")


def object_spans(block):
    spans = []
    depth = 0
    quote = False
    escape = False
    start = None
    for i, ch in enumerate(block):
        if quote:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                quote = False
            continue
        if ch == '"':
            quote = True
        elif ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and start is not None:
                spans.append((start, i + 1))
                start = None
    return spans


def infer_tags(game_id, title, desc):
    if game_id in TAG_OVERRIDES:
        return TAG_OVERRIDES[game_id]
    text = title + " " + desc
    tags = []
    for name, pattern in PRIMARY_RULES:
        if re.search(pattern, text, re.I):
            tags.append(name)
            break
    if not tags:
        tags.append("Arcade")
    for name, pattern in SECONDARY_RULES:
        if name not in tags and re.search(pattern, text, re.I):
            tags.append(name)
    return tags


def make_fallback():
    digest = hashlib.sha1(b"fallback").hexdigest()
    hue = int(digest[:4], 16) % 360
    letter = html.escape("?")
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 640">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl({hue} 52% 24%)"/><stop offset="1" stop-color="hsl({(hue+38)%360} 58% 12%)"/></linearGradient></defs>
  <rect width="480" height="640" fill="url(#g)"/>
  <circle cx="392" cy="90" r="118" fill="hsl({(hue+180)%360} 75% 62%)" opacity=".16"/>
  <circle cx="74" cy="540" r="150" fill="hsl({(hue+180)%360} 75% 62%)" opacity=".10"/>
  <text x="240" y="210" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="180" font-weight="900" fill="hsl({(hue+180)%360} 75% 62%)" opacity=".86">{letter}</text>
  <text x="240" y="574" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" letter-spacing="6" font-weight="700" fill="#ffffff" opacity=".55">NULL X</text>
</svg>
'''


def fill_tags(source, marker, label):
    start, end = array_bounds(source, marker)
    block = source[start:end]
    out = []
    cursor = 0
    added = 0
    for obj_start, obj_end in object_spans(block):
        out.append(block[cursor:obj_start])
        obj = block[obj_start:obj_end]
        if re.search(r'\btags\s*:', obj):
            out.append(obj)
        else:
            game_id = field(obj, "id")
            if not game_id:
                out.append(obj)
            else:
                tags = infer_tags(game_id, field(obj, "title") or game_id, field(obj, "desc"))
                encoded = ", ".join(f'"{t}"' for t in tags)
                close = obj.rfind("}")
                obj = obj[:close] + f", tags: [{encoded}] " + obj[close:]
                added += 1
                out.append(obj)
        cursor = obj_end
    out.append(block[cursor:])
    print(f"{label}: tagged {added} games")
    return source[:start] + "".join(out) + source[end:]


def patch_filters(source):
    replacements = [
        (
            "function getGameDevice(game) {",
            'function getGameTags(game) {\n'
            '  if (Array.isArray(game.tags) && game.tags.length) return game.tags;\n'
            '  return [getGameGenre(game)];\n'
            '}\n\n'
            "function getGameDevice(game) {",
        ),
        (
            '  const genreEl = document.getElementById("nx-filter-genre");\n'
            '  const deviceEl = document.getElementById("nx-filter-device");',
            '  const genreEl = document.getElementById("nx-filter-genre");\n'
            '  const tagEl = document.getElementById("nx-filter-tag");\n'
            '  const deviceEl = document.getElementById("nx-filter-device");',
        ),
        (
            '  const genre = genreEl ? genreEl.value : "";\n'
            '  const device = deviceEl ? deviceEl.value : "";',
            '  const genre = genreEl ? genreEl.value : "";\n'
            '  const tag = tagEl ? tagEl.value : "";\n'
            '  const device = deviceEl ? deviceEl.value : "";',
        ),
        (
            '  const active = !!term || !!genre || !!device || recentOnly;',
            '  const active = !!term || !!genre || !!tag || !!device || recentOnly;',
        ),
        (
            '  if (genre) list = list.filter(g => getGameGenre(g) === genre);\n'
            '  if (device) list = list.filter(g => getGameDevice(g) === device);',
            '  if (genre) list = list.filter(g => getGameGenre(g) === genre);\n'
            '  if (tag) list = list.filter(g => getGameTags(g).includes(tag));\n'
            '  if (device) list = list.filter(g => getGameDevice(g) === device);',
        ),
        (
            "'<select id=\"nx-filter-genre\" aria-label=\"Filter by genre\"><option value=\"\">All genres</option></select>' +\n"
            "    '<select id=\"nx-filter-device\" aria-label=\"Filter by device\"><option value=\"\">Any device</option>' +",
            "'<select id=\"nx-filter-genre\" aria-label=\"Filter by genre\"><option value=\"\">All genres</option></select>' +\n"
            "    '<select id=\"nx-filter-tag\" aria-label=\"Filter by tag\"><option value=\"\">All tags</option></select>' +\n"
            "    '<select id=\"nx-filter-device\" aria-label=\"Filter by device\"><option value=\"\">Any device</option>' +",
        ),
        (
            '  const genreSel = bar.querySelector("#nx-filter-genre");\n'
            '  const deviceSel = bar.querySelector("#nx-filter-device");',
            '  const genreSel = bar.querySelector("#nx-filter-genre");\n'
            '  const tagSel = bar.querySelector("#nx-filter-tag");\n'
            '  const deviceSel = bar.querySelector("#nx-filter-device");',
        ),
        (
            '  const genres = Array.from(new Set(_0xData.map(g => getGameGenre(g)))).sort();\n'
            '  genres.forEach(function (name) {\n'
            '    const opt = document.createElement("option");\n'
            '    opt.value = name;\n'
            '    opt.textContent = name;\n'
            '    genreSel.appendChild(opt);\n'
            '  });',
            '  const genres = Array.from(new Set(_0xData.map(g => getGameGenre(g)))).sort();\n'
            '  genres.forEach(function (name) {\n'
            '    const opt = document.createElement("option");\n'
            '    opt.value = name;\n'
            '    opt.textContent = name;\n'
            '    genreSel.appendChild(opt);\n'
            '  });\n'
            '  const tagCounts = new Map();\n'
            '  _0xData.forEach(function (game) {\n'
            '    getGameTags(game).forEach(function (name) {\n'
            '      tagCounts.set(name, (tagCounts.get(name) || 0) + 1);\n'
            '    });\n'
            '  });\n'
            '  Array.from(tagCounts.entries()).sort(function (a, b) {\n'
            '    return b[1] - a[1] || a[0].localeCompare(b[0]);\n'
            '  }).forEach(function (entry) {\n'
            '    const opt = document.createElement("option");\n'
            '    opt.value = entry[0];\n'
            '    opt.textContent = entry[0] + " (" + entry[1] + ")";\n'
            '    tagSel.appendChild(opt);\n'
            '  });',
        ),
        (
            '  genreSel.addEventListener("change", applyLibraryFilters);\n'
            '  deviceSel.addEventListener("change", applyLibraryFilters);',
            '  genreSel.addEventListener("change", applyLibraryFilters);\n'
            '  tagSel.addEventListener("change", applyLibraryFilters);\n'
            '  deviceSel.addEventListener("change", applyLibraryFilters);',
        ),
        (
            '    genreSel.value = "";\n'
            '    deviceSel.value = "";',
            '    genreSel.value = "";\n'
            '    tagSel.value = "";\n'
            '    deviceSel.value = "";',
        ),
        (
            '    if (game.image) {\n'
            '      const img = document.createElement("img");',
            '    const imageSrc = game.image || "../Games/_covers/_fallback.svg";\n'
            '    if (imageSrc) {\n'
            '      const img = document.createElement("img");',
        ),
        (
            '      img.src = String(game.image);',
            '      img.src = String(imageSrc);',
        ),
    ]
    for old, new in replacements:
        if old not in source:
            raise SystemExit("filter patch target not found: " + old[:80])
        source = source.replace(old, new, 1)
    return source


def main():
    COVERS.mkdir(parents=True, exist_ok=True)
    (COVERS / "_fallback.svg").write_text(make_fallback(), encoding="utf-8")

    source = MAIN.read_text(encoding="utf-8")
    source = fill_tags(source, "let _0xData = [", "_0xData")
    source = fill_tags(source, "const gitlabGames = [", "gitlabGames")

    j_pos = source.index("// NEW J GAMES")
    j_start, j_end = array_bounds_from(source, source.index("const games = [", j_pos) + len("const games = ") - 1)
    block = source[j_start:j_end]
    out = []
    cursor = 0
    added = 0
    for obj_start, obj_end in object_spans(block):
        out.append(block[cursor:obj_start])
        obj = block[obj_start:obj_end]
        if not re.search(r'\btags\s*:', obj):
            game_id = field(obj, "id")
            if game_id:
                tags = infer_tags(game_id, field(obj, "title") or game_id, field(obj, "desc"))
                close = obj.rfind("}")
                obj = obj[:close] + ", tags: [" + ", ".join(f'"{t}"' for t in tags) + "] " + obj[close:]
                added += 1
        out.append(obj)
        cursor = obj_end
    out.append(block[cursor:])
    source = source[:j_start] + "".join(out) + source[j_end:]
    print(f"new J games: tagged {added} games")

    source = patch_filters(source)
    MAIN.write_text(source, encoding="utf-8")
    print("filters patched")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Fill in missing cover art for every game and append the new J games last."""
import hashlib
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "JS" / "main.js"
COVERS = ROOT / "Games" / "_covers"
COVERS.mkdir(parents=True, exist_ok=True)

NEW_GAMES = [
    ("jumbo-mario", "Jumbo Mario", "https://whatchamacallitexe.github.io/pack-y/jumbo-mario/", "../Games/jumbo-mario/cover.svg", "A 40th-anniversary Super Mario fan demo packed with oversized levels and classic platforming."),
    ("jumping-shell", "Jumping Shell", "https://whatchamacallitexe.github.io/pack-y/jumping-shell/", "../Games/jumping-shell/cover.svg", "Hop and drop your shell across a tricky tower of platforms in this bite-sized puzzler."),
    ("jetski-race", "Jetski Race", "https://whatchamacallitexe.github.io/pack-y/jetski-race/", "../Games/jetski-race/cover.svg", "Race a jet ski across sunny island courses and chase the fastest time on the water."),
    ("just-hit-the-button", "Just Hit The Button", "https://whatchamacallitexe.github.io/pack-y/just-hit-the-button/", "../Games/just-hit-the-button/cover.svg", "A fast, silly reflex game where hitting the button is the whole point."),
]
NEW_IDS = {g[0] for g in NEW_GAMES}


def field(text, name):
    m = re.search(r'\b' + re.escape(name) + r':\s*"((?:\\.|[^"\\])*)"', text)
    if not m:
        return ""
    return m.group(1).replace('\\"', '"').replace("\\\\", "\\")


def safe_id(value):
    value = re.sub(r"[^a-zA-Z0-9_-]+", "-", value).strip("-").lower()
    return value or "game"


def array_bounds(source, marker):
    start = source.index(marker) + len(marker) - 1
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
    raise ValueError(f"unclosed array: {marker}")


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


def make_cover(game_id, title):
    digest = hashlib.sha1(game_id.encode("utf-8")).hexdigest()
    hue = int(digest[:4], 16) % 360
    hue2 = (hue + 38) % 360
    letter = html.escape(next((c.upper() for c in title if c.isalnum()), "?"))
    c1 = f"hsl({hue} 52% 24%)"
    c2 = f"hsl({hue2} 58% 12%)"
    accent = f"hsl({(hue + 180) % 360} 75% 62%)"
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 640">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>
  <rect width="480" height="640" fill="url(#g)"/>
  <circle cx="392" cy="90" r="118" fill="{accent}" opacity=".16"/>
  <circle cx="74" cy="540" r="150" fill="{accent}" opacity=".10"/>
  <path d="M0 470L480 330v310H0z" fill="{accent}" opacity=".08"/>
  <text x="240" y="210" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="180" font-weight="900" fill="{accent}" opacity=".86">{letter}</text>
  <text x="240" y="574" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" letter-spacing="6" font-weight="700" fill="#ffffff" opacity=".55">NULL X</text>
</svg>
'''


def fill_images(block, label):
    out = []
    cursor = 0
    added = 0
    for start, end in object_spans(block):
        out.append(block[cursor:start])
        obj = block[start:end]
        if re.search(r'\bimage\s*:', obj):
            out.append(obj)
        else:
            game_id = field(obj, "id")
            if not game_id:
                out.append(obj)
            else:
                title = field(obj, "title") or game_id
                stem = safe_id(game_id)
                (COVERS / f"{stem}.svg").write_text(make_cover(stem, title), encoding="utf-8")
                close = obj.rfind("}")
                obj = obj[:close] + f', image: "../Games/_covers/{stem}.svg" ' + obj[close:]
                added += 1
                out.append(obj)
        cursor = end
    out.append(block[cursor:])
    print(f"{label}: added {added} covers")
    return "".join(out)


def main():
    source = MAIN.read_text(encoding="utf-8")

    # Remove old copies of the four new games from the literal so they can be appended last.
    lit_start, lit_end = array_bounds(source, "let _0xData = [")
    literal = source[lit_start:lit_end]
    literal = "".join(
        line for line in literal.splitlines(True)
        if not any(f'id: "{game_id}"' in line for game_id in NEW_IDS)
    )
    literal = fill_images(literal, "_0xData")
    source = source[:lit_start] + literal + source[lit_end:]

    gl_start, gl_end = array_bounds(source, "const gitlabGames = [")
    source = source[:gl_start] + fill_images(source[gl_start:gl_end], "gitlabGames") + source[gl_end:]

    if "// NEW J GAMES" not in source:
        entries = ",\n".join(
            f'    {{ id: "{i}", title: "{t}", url: "{u}", image: "{img}", desc: "{d}" }}'
            for i, t, u, img, d in NEW_GAMES
        )
        addition = f'''// NEW J GAMES
(function addNewJGames() {{
  const ids = new Set(_0xData.map(g => g.id));
  const games = [
{entries}
  ];
  games.forEach(g => {{ if (!ids.has(g.id)) {{ _0xData.push(g); ids.add(g.id); }} }});
}})();

'''
        anchor = "let favoriteGamesList"
        source = source.replace(anchor, addition + anchor, 1)

    MAIN.write_text(source, encoding="utf-8")

    index = ROOT / "index.html"
    if index.exists():
        text = index.read_text(encoding="utf-8")
        text = text.replace('  <script src="JS/game-filters.js"></script>\n', "")
        index.write_text(text, encoding="utf-8")

    runtime = ROOT / "JS" / "game-filters.js"
    if runtime.exists():
        runtime.unlink()

    print("done")


if __name__ == "__main__":
    main()

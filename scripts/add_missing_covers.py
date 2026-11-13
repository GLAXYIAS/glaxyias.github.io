#!/usr/bin/env python3
"""Add cover art for every game missing an image and wire the new J games into main.js."""
import hashlib
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "JS" / "main.js"
COVERS = ROOT / "Games" / "_covers"
COVERS.mkdir(parents=True, exist_ok=True)

NEW_GAMES = [
    {
        "id": "jumbo-mario",
        "title": "Jumbo Mario",
        "url": "https://whatchamacallitexe.github.io/pack-y/jumbo-mario/",
        "image": "../Games/jumbo-mario/cover.svg",
        "desc": "A 40th-anniversary Super Mario fan demo packed with oversized levels and classic platforming.",
    },
    {
        "id": "jumping-shell",
        "title": "Jumping Shell",
        "url": "https://whatchamacallitexe.github.io/pack-y/jumping-shell/",
        "image": "../Games/jumping-shell/cover.svg",
        "desc": "Hop and drop your shell across a tricky tower of platforms in this bite-sized puzzler.",
    },
    {
        "id": "jetski-race",
        "title": "Jetski Race",
        "url": "https://whatchamacallitexe.github.io/pack-y/jetski-race/",
        "image": "../Games/jetski-race/cover.svg",
        "desc": "Race a jet ski across sunny island courses and chase the fastest time on the water.",
    },
    {
        "id": "just-hit-the-button",
        "title": "Just Hit The Button",
        "url": "https://whatchamacallitexe.github.io/pack-y/just-hit-the-button/",
        "image": "../Games/just-hit-the-button/cover.svg",
        "desc": "A fast, silly reflex game where hitting the button is the whole point.",
    },
]


def field(text, name):
    m = re.search(r'\b' + re.escape(name) + r':\s*"((?:\\.|[^"\\])*)"', text)
    if not m:
        return ""
    value = m.group(1).replace('\\"', '"').replace("\\\\", "\\")
    return value


def safe_id(value):
    value = re.sub(r"[^a-zA-Z0-9_-]+", "-", value).strip("-").lower()
    return value or "game"


def make_cover(game_id, title):
    digest = hashlib.sha1(game_id.encode("utf-8")).hexdigest()
    hue = int(digest[:4], 16) % 360
    hue2 = (hue + 38) % 360
    letter = next((c.upper() for c in title if c.isalnum()), "?")
    letter = html.escape(letter)
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
  <text x="240" y="574" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" letter-spacing="6" font-weight="700" fill="#ffffff" opacity="0.55">NULL X</text>
</svg>
'''


def main():
    source = MAIN.read_text(encoding="utf-8")
    marker = "let _0xData = ["
    block_start = source.index(marker) + len(marker)
    block_end = source.index("\n];", block_start)
    block = source[block_start:block_end]

    missing = 0
    lines = []
    for line in block.splitlines(True):
        if re.match(r'^  \{ id:', line) and "image:" not in line:
            game_id = safe_id(field(line, "id"))
            title = field(line, "title") or game_id
            cover = f"../Games/_covers/{game_id}.svg"
            (COVERS / f"{game_id}.svg").write_text(make_cover(game_id, title), encoding="utf-8")
            close = line.rfind("}")
            line = line[:close] + f', image: "{cover}" ' + line[close:]
            missing += 1
        lines.append(line)
    block = "".join(lines)

    existing_ids = set(re.findall(r'\bid:\s*"([^"]+)"', block))
    additions = []
    for game in NEW_GAMES:
        if game["id"] in existing_ids:
            continue
        fields = ", ".join(f'{k}: "{v}"' for k, v in game.items())
        additions.append(f"  {{ {fields} }},")
    if additions:
        block = block.rstrip() + "\n" + "\n".join(additions) + "\n"

    source = source[:block_start] + block + source[block_end:]
    MAIN.write_text(source, encoding="utf-8")

    index = ROOT / "index.html"
    if index.exists():
        text = index.read_text(encoding="utf-8")
        text = text.replace('  <script src="JS/game-filters.js"></script>\n', "")
        index.write_text(text, encoding="utf-8")

    runtime = ROOT / "JS" / "game-filters.js"
    if runtime.exists():
        runtime.unlink()

    print(f"added covers to {missing} entries; appended {len(additions)} new games")


if __name__ == "__main__":
    main()

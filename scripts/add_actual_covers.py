#!/usr/bin/env python3
"""Replace generated covers with real game art.

Priority:
1. An image already inside the local game folder (real game art/screenshot).
2. The original UGS thumbnail collection (exact title, then a conservative
   title variant), downloaded in the workflow as .ugs-assets/thumbnails.
3. A Steam header for a small curated set of PC ports.
4. A screenshot of the playable page, for anything still without art.

Images are normalised to 640x480 JPEGs in Games/_covers/actual/ and main.js
image fields are pointed at them. Existing generated covers remain untouched.
"""
from __future__ import annotations

import io
import os
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from PIL import Image, ImageOps, ImageStat

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "JS" / "main.js"
OUT = ROOT / "Games" / "_covers" / "actual"
UGS_CANDIDATES = [
    ROOT / ".ugs-assets" / "thumbnails",
    ROOT.parent / ".ugs-assets" / "thumbnails",
    Path("/tmp/ugs-assets/thumbnails"),
]
UGS = next((path for path in UGS_CANDIDATES if path.exists()), UGS_CANDIDATES[0])
USER_AGENT = "Mozilla/5.0 (compatible; GlaxyiasCoverBot/1.0)"
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

# Exact Steam matches for prominent PC ports. Keep this list conservative: a
# wrong app id produces the wrong game's artwork.
STEAM_IDS = {
    "cloverpit": 3314790,
    "deadsignal": 2599300,
    "ultrakill": 1229490,
    "geometry-dash": 322170,
    "stardew-valley": 413150,
    "hollow-knight": 367520,
    "celeste": 504230,
    "brotato": 1942280,
    "feedingablackhole": 3694480,
}

# UGS thumbnails often use an abbreviated title; map only unambiguous cases.
ALIASES = {
    "3pandasinjapan": "3 Pandas Japan.jpg",
    "bloonstowerdefense": "Bloons.jpg",
    "bloonstowerdefense2": "Bloons 2.jpg",
    "bloonstowerdefense4": "Bloons.jpg",
    "bloonstowerdefense5": "Bloons TD 5.jpg",
}


def field(text: str, name: str) -> str:
    m = re.search(r"\b" + re.escape(name) + r':\s*"((?:\\.|[^"\\])*)"', text)
    return m.group(1) if m else ""


def norm(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", text.lower().replace("&", "and"))


def entries(source: str):
    """Yield every game object, including entries inside the GitLab/new-J IIFEs."""
    stack = []
    quote = False
    escape = False
    for i, ch in enumerate(source):
        if quote:
            if escape:
                escape = False
            elif ch == chr(92):
                escape = True
            elif ch == '"':
                quote = False
            continue
        if ch == '"':
            quote = True
        elif ch == "{":
            stack.append(i)
        elif ch == "}" and stack:
            start = stack.pop()
            obj = source[start:i + 1]
            if ("id:" in obj and "title:" in obj and "url:" in obj
                    and obj.count("{") == 1 and obj.count("}") == 1):
                yield start, i + 1, obj



def safe_id(value: str) -> str:
    value = re.sub(r"[^A-Za-z0-9_-]+", "_", value).strip("_")
    return value or "game"


def save_image(raw: bytes, destination: Path) -> bool:
    try:
        im = Image.open(io.BytesIO(raw))
        im = ImageOps.exif_transpose(im).convert("RGB")
        if im.width < 200 or im.height < 120:
            return False
        im = ImageOps.fit(im, (640, 480), method=Image.Resampling.LANCZOS)
        destination.parent.mkdir(parents=True, exist_ok=True)
        im.save(destination, "JPEG", quality=84, optimize=True, progressive=True)
        return True
    except Exception as exc:
        print("  image failed:", exc)
        return False


def local_cover(entry_url: str, game_id: str) -> Path | None:
    if not entry_url.startswith("../Games/"):
        return None
    rel = entry_url[3:]
    page = ROOT / rel
    folder = page.parent
    if not folder.exists():
        return None
    candidates = []
    for path in folder.rglob("*"):
        if path.suffix.lower() not in IMAGE_EXT or "_covers" in path.parts:
            continue
        try:
            with Image.open(path) as im:
                w, h = im.size
            if w < 240 or h < 140:
                continue
            candidates.append((w * h, path.stat().st_size, path))
        except Exception:
            continue
    if not candidates:
        return None
    candidates.sort(reverse=True)
    src = candidates[0][2]
    destination = OUT / f"{safe_id(game_id)}.jpg"
    try:
        raw = src.read_bytes()
        if save_image(raw, destination):
            return destination
    except Exception as exc:
        print("  local image failed:", src, exc)
    return None


def build_thumb_index():
    index = {}
    if not UGS.exists():
        return index
    for path in UGS.iterdir():
        if path.suffix.lower() in IMAGE_EXT:
            index[norm(path.stem)] = path
    return index


def thumb_candidate(title: str, index: dict[str, Path]) -> Path | None:
    n = norm(title)
    if n in index:
        return index[n]
    alias = ALIASES.get(n)
    if alias:
        alias_path = UGS / alias
        if alias_path.exists():
            return alias_path

    # Version / edition suffixes: "Slope 2", "Brotato All Pain No Gain".
    variants = [n]
    stripped = re.sub(
        r"(allpainnogain|apng|remastered|decompile|alt|good|latest|20\d\d|version|edition|demo|html5|game)$",
        "",
        n,
    )
    if stripped != n:
        variants.append(stripped)
    stripped = re.sub(r"\d+$", "", n)
    if stripped != n:
        variants.append(stripped)
    stripped = re.sub(r"(one|two|three|four|five|six|seven|eight|nine|ten)$", "", n)
    if stripped != n:
        variants.append(stripped)
    for variant in variants:
        if variant in index:
            return index[variant]

    # Conservative prefix matching for sequel/edition names, but never match a
    # short generic word such as "game" or "adventure".
    generic = {"game", "adventure", "battles", "snowrid", "sonicr", "action", "arcade"}
    matches = [key for key in index if len(key) >= 8 and key not in generic and n.startswith(key)]
    if matches:
        return index[max(matches, key=len)]
    return None


def download(url: str, timeout: int = 45) -> bytes | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=timeout) as response:
            if response.status != 200:
                return None
            return response.read()
    except Exception as exc:
        print("  download failed:", url, exc)
        return None


def page_url(value: str) -> str:
    if value.startswith("http"):
        return value
    return "https://glaxyias.github.io/" + value.lstrip("./")


def screenshot_cover(url: str, game_id: str) -> Path | None:
    """Use a public screenshot service as the last real-image fallback."""
    if os.environ.get("ADD_SCREENSHOTS") != "1":
        return None
    absolute = page_url(url)
    try:
        req = urllib.request.Request(absolute, headers={"User-Agent": USER_AGENT}, method="HEAD")
        with urllib.request.urlopen(req, timeout=20) as response:
            if response.status != 200:
                return None
    except Exception:
        return None
    api = f"https://image.thum.io/get/width/640/height/480/wait/5/noanimate/{absolute}"
    raw = download(api, timeout=60)
    if not raw:
        return None
    destination = OUT / f"{safe_id(game_id)}.jpg"
    if not save_image(raw, destination):
        return None
    # Reject near-uniform captures, which are almost always loading/error pages.
    try:
        with Image.open(destination) as im:
            stat = ImageStat.Stat(im.convert("L"))
            if stat.stddev[0] < 4:
                destination.unlink(missing_ok=True)
                return None
    except Exception:
        destination.unlink(missing_ok=True)
        return None
    return destination


def main() -> None:
    if not MAIN.exists():
        sys.exit("JS/main.js not found")
    source = MAIN.read_text(encoding="utf-8")
    items = list(entries(source))
    thumb_index = build_thumb_index()
    print(f"game entries: {len(items)}; UGS thumbnails: {len(thumb_index)}")

    chosen: dict[str, Path] = {}
    missing: list[tuple[str, str]] = []
    for _, _, obj in items:
        game_id = field(obj, "id")
        title = field(obj, "title")
        url = field(obj, "url")
        if not game_id or game_id in chosen:
            continue

        found = local_cover(url, game_id)
        if found:
            chosen[game_id] = found
            continue

        thumb = thumb_candidate(title, thumb_index)
        if thumb:
            destination = OUT / f"{safe_id(game_id)}.jpg"
            if save_image(thumb.read_bytes(), destination):
                chosen[game_id] = destination
                continue

        steam_id = STEAM_IDS.get(game_id)
        if steam_id:
            header = f"https://cdn.akamai.steamstatic.com/steam/apps/{steam_id}/header.jpg"
            raw = download(header)
            if raw:
                destination = OUT / f"{safe_id(game_id)}.jpg"
                if save_image(raw, destination):
                    chosen[game_id] = destination
                    continue

        missing.append((game_id, url))

    # Screenshot requests are slow; run a few in parallel so the action finishes
    # comfortably inside its job timeout.
    if missing and os.environ.get("ADD_SCREENSHOTS") == "1":
        print(f"screenshot fallback for {len(missing)} games")
        with ThreadPoolExecutor(max_workers=4) as pool:
            futures = {
                pool.submit(screenshot_cover, url, game_id): game_id
                for game_id, url in missing
            }
            for future in as_completed(futures):
                game_id = futures[future]
                shot = future.result()
                if shot:
                    chosen[game_id] = shot

    # Rewrite image fields only for games that received a real image.
    edits = []
    for start, end, obj in items:
        game_id = field(obj, "id")
        if game_id not in chosen:
            continue
        replacement = f'../Games/_covers/actual/{safe_id(game_id)}.jpg'
        image_pattern = re.compile(r'(\bimage:\s*)"(?:\\.|[^"\\])*"')
        if image_pattern.search(obj):
            new_obj = image_pattern.sub(lambda m: m.group(1) + '"' + replacement + '"', obj, count=1)
        else:
            new_obj = obj[:-1] + f', image: "{replacement}"' + obj[-1:]
        edits.append((start, end, new_obj))

    for start, end, replacement in reversed(edits):
        source = source[:start] + replacement + source[end:]
    MAIN.write_text(source, encoding="utf-8")
    print(f"real images applied: {len(chosen)} / {len(items)}")
    print(f"output directory: {OUT}")


if __name__ == "__main__":
    main()

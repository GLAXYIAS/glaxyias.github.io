#!/usr/bin/env python3
"""Remove the duplicate pack-y cards that lack ids (the real J games are appended separately)."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "JS" / "main.js"
TITLES = {"Jetski Race", "Jumbo Mario", "Jumping Shell", "Just Hit The Button"}


def field(text, name):
    m = re.search(r'\b' + re.escape(name) + r':\s*"((?:\\.|[^"\\])*)"', text)
    return m.group(1) if m else ""


def array_bounds(source):
    start = source.index("let _0xData = [") + len("let _0xData = ") - 1
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
    raise ValueError("unclosed _0xData")


def spans(block):
    out = []
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
                out.append((start, i + 1))
                start = None
    return out


def main():
    source = MAIN.read_text(encoding="utf-8")
    start, end = array_bounds(source)
    block = source[start:end]
    pieces = []
    cursor = 0
    removed = 0
    for obj_start, obj_end in spans(block):
        obj = block[obj_start:obj_end]
        title = field(obj, "title")
        url = field(obj, "url")
        if title in TITLES and "pack-y/" in url and "/index.html" in url and not re.search(r'\bid\s*:', obj):
            pieces.append(block[cursor:obj_start])
            cursor = obj_end
            if block[cursor:cursor + 1] == ",":
                cursor += 1
            removed += 1
        else:
            pieces.append(block[cursor:obj_start])
            pieces.append(obj)
            cursor = obj_end
    pieces.append(block[cursor:])
    source = source[:start] + "".join(pieces) + source[end:]
    MAIN.write_text(source, encoding="utf-8")
    print(f"removed {removed} orphan new-game cards")


if __name__ == "__main__":
    main()

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

for path, pairs in {
    "index.html": [
        ('href="CSS/style.css"', 'href="CSS/style.css?v=20261124-orange"'),
        ('href="CSS/upgrade-pack.css"', 'href="CSS/upgrade-pack.css?v=20261124-orange"'),
        ('href="themes/themes.css"', 'href="themes/themes.css?v=20261124-orange"'),
    ],
    "chat/chat.html": [
        ('href="chat.css"', 'href="chat.css?v=20261124"'),
        ('src="chat.js"', 'src="chat.js?v=20261124-pmread"'),
    ],
}.items():
    p = ROOT / path
    text = p.read_text(encoding="utf-8")
    for old, new in pairs:
        if old not in text:
            raise SystemExit(f"Missing {old!r} in {path}")
        text = text.replace(old, new)
    p.write_text(text, encoding="utf-8")
    print(f"updated {path}")

print("Done.")

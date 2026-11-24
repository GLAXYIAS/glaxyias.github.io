from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

p = ROOT / "JS/upgrade-pack.js"
text = p.read_text(encoding="utf-8")
old = "    purple: { name: 'Null Purple', accent: '#8b00ff', hover: '#a033ff', bg: '#120024', sidebar: '#1a0033', border: '#3b1d70', text: '#e8e0ff', muted: '#b39ddb' },"
new = "    purple: { name: 'Null Orange', accent: '#ff8a00', hover: '#ffab40', bg: '#000000', sidebar: '#080808', border: '#3a2208', text: '#ffb25e', muted: '#c98a55' },"
if old not in text:
    raise SystemExit("upgrade-pack purple palette not found")
p.write_text(text.replace(old, new, 1), encoding="utf-8")
print("updated JS/upgrade-pack.js")

p = ROOT / "index.html"
text = p.read_text(encoding="utf-8")
old = 'JS/upgrade-pack.js?v=4'
new = 'JS/upgrade-pack.js?v=20261124orange'
if old not in text:
    raise SystemExit("upgrade-pack script tag not found")
p.write_text(text.replace(old, new, 1), encoding="utf-8")
print("updated index.html")

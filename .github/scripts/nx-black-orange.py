from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# 1. Upgrade-pack inline palette (it overrides the stylesheet variables).
p = ROOT / "JS/upgrade-pack.js"
text = p.read_text(encoding="utf-8")
old = "    purple: { name: 'Null Orange', accent: '#ff8a00', hover: '#ffab40', bg: '#000000', sidebar: '#080808', border: '#3a2208', text: '#ffb25e', muted: '#c98a55' },"
new = "    purple: { name: 'Null Orange', accent: '#ff8a00', hover: '#ffab40', bg: '#000000', sidebar: '#000000', border: '#ff8a00', text: '#ff9d2e', muted: '#b86a12' },"
if old not in text:
    raise SystemExit("upgrade-pack palette line not found")
p.write_text(text.replace(old, new, 1), encoding="utf-8")
print("updated upgrade-pack palette")

# 2. Default theme variables.
p = ROOT / "themes/themes.css"
text = p.read_text(encoding="utf-8")
old = """  --bg-dashboard: #000000;
  --bg-sidebar: #080808;
  --accent-color: #ff8a00;
  --accent-hover: #ffab40;
  --border-color: rgba(255, 138, 0, 0.22); 
  --text-main: #ffb25e;
  --text-muted: #c98a55;"""
new = """  --bg-dashboard: #000000;
  --bg-sidebar: #000000;
  --accent-color: #ff8a00;
  --accent-hover: #ffab40;
  --border-color: #ff8a00;
  --text-main: #ff9d2e;
  --text-muted: #b86a12;"""
if old not in text:
    raise SystemExit("themes.css default block not found")
p.write_text(text.replace(old, new, 1), encoding="utf-8")
print("updated themes.css default block")

# 3. Base stylesheet fallbacks.
p = ROOT / "CSS/style.css"
text = p.read_text(encoding="utf-8")
old = """  --bg-gradient: linear-gradient(135deg, #000000, #0b0703);
  --container-bg: rgba(10, 10, 10, 0.98);
  --text: #ffd7a8;"""
new = """  --bg-gradient: #000000;
  --container-bg: #000000;
  --text: #ff9d2e;"""
if old not in text:
    raise SystemExit("style.css root header not found")
text = text.replace(old, new, 1)
old = """  --bg-sidebar: #080808;     /* Near Black */
  --border-color: #3a2208;   /* Dark Orange Border */
  --text-main: #ffb25e;      /* Orange Text */
  --text-muted: #c98a55;"""
new = """  --bg-sidebar: #000000;     /* Pitch Black */
  --border-color: #ff8a00;   /* Orange Outline */
  --text-main: #ff9d2e;      /* Orange Text */
  --text-muted: #b86a12;"""
if old not in text:
    raise SystemExit("style.css variable block not found")
p.write_text(text.replace(old, new, 1), encoding="utf-8")
print("updated style.css variables")

# 4. Load the override stylesheet last and bust the changed assets.
p = ROOT / "index.html"
text = p.read_text(encoding="utf-8")
old = '<link rel="stylesheet" href="themes/themes.css?v=20261124-orange">'
new = '<link rel="stylesheet" href="themes/themes.css?v=20261124-black">\n  <link rel="stylesheet" href="CSS/black-orange.css?v=20261124-black">'
if old not in text:
    raise SystemExit("themes.css link not found")
text = text.replace(old, new, 1)
old = 'JS/upgrade-pack.js?v=20261124orange'
new = 'JS/upgrade-pack.js?v=20261124black'
if old not in text:
    raise SystemExit("upgrade-pack script tag not found")
p.write_text(text.replace(old, new, 1), encoding="utf-8")
print("updated index.html links")

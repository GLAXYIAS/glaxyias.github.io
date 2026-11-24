from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

p = ROOT / "CSS/black-orange.css"
text = p.read_text(encoding="utf-8")
addition = """

/* The debug Console button is part of the default theme too. */
:is(html[data-nxup-theme=\"purple\"], html:not([data-nxup-theme])[data-theme=\"default\"]) #console-toggle-btn {
  background: #000 !important;
  background-image: none !important;
  color: #ff9d2e !important;
  border: 1px solid #ff8a00 !important;
  box-shadow: none !important;
  filter: none !important;
}
"""
if "#console-toggle-btn" not in text:
    p.write_text(text.rstrip() + addition, encoding="utf-8")
print("updated Console button styling")

p = ROOT / "index.html"
text = p.read_text(encoding="utf-8")
old = "CSS/black-orange.css?v=20261124-black"
new = "CSS/black-orange.css?v=20261124-black2"
if old not in text:
    raise SystemExit("black-orange stylesheet link not found")
p.write_text(text.replace(old, new, 1), encoding="utf-8")
print("updated black-orange stylesheet version")

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

p = ROOT / "themes/themes.js"
text = p.read_text(encoding="utf-8")

replacements = [
    ("style=\"width:100%;height:calc(100vh - 160px);min-height:520px;border:1px solid rgba(139,0,255,0.35);",
     "style=\"width:100%;height:calc(100vh - 160px);min-height:520px;border:1px solid rgba(255,138,0,0.35);"),
    ("  background: rgba(5, 2, 12, 0.82);", "  background: rgba(0, 0, 0, 0.84);"),
    ("  background: #12091c;\n  border: 1px solid #8b00ff;\n  border-radius: 14px;\n  box-shadow: 0 0 40px rgba(139, 0, 255, 0.35);",
     "  background: #0a0a0a;\n  border: 1px solid #ff8a00;\n  border-radius: 14px;\n  box-shadow: 0 0 40px rgba(255, 138, 0, 0.3);"),
    ("  border-bottom: 1px solid rgba(139, 0, 255, 0.35);", "  border-bottom: 1px solid rgba(255, 138, 0, 0.35);"),
    ("  border: 1px solid rgba(139, 0, 255, 0.25);", "  border: 1px solid rgba(255, 138, 0, 0.25);"),
    ("  color: #b056ff;", "  color: #ffab40;"),
    ("color: #d4cce0;", "color: #e6c4a0;"),
    ("  border: 1px solid rgba(139, 0, 255, 0.45);\n  background: rgba(139, 0, 255, 0.12);\n  color: #fff;",
     "  border: 1px solid rgba(255, 138, 0, 0.45);\n  background: rgba(255, 138, 0, 0.12);\n  color: #ffb25e;"),
    ("  background: rgba(139, 0, 255, 0.26);\n  border-color: #8b00ff;\n  box-shadow: 0 0 14px rgba(139, 0, 255, 0.35);",
     "  background: rgba(255, 138, 0, 0.26);\n  border-color: #ff8a00;\n  box-shadow: 0 0 14px rgba(255, 138, 0, 0.35);"),
    ("#system-news-btn:focus-visible { outline: 2px solid #b056ff; outline-offset: 2px; }",
     "#system-news-btn:focus-visible { outline: 2px solid #ffab40; outline-offset: 2px; }"),
]
for old, new in replacements:
    if old not in text:
        raise SystemExit(f"theme source pattern not found: {old[:70]}")
    text = text.replace(old, new, 1)
p.write_text(text, encoding="utf-8")
print("updated themes/themes.js news styles")

p = ROOT / "index.html"
text = p.read_text(encoding="utf-8")
old = 'src="themes/themes.js"'
new = 'src="themes/themes.js?v=20261124orange"'
if old not in text:
    raise SystemExit("themes.js script tag not found")
p.write_text(text.replace(old, new, 1), encoding="utf-8")
print("updated index.html themes.js cache bust")

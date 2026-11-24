from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def replace(path, pairs, optional=False):
    p = ROOT / path
    text = p.read_text(encoding="utf-8")
    for old, new in pairs:
        if old not in text:
            if optional:
                continue
            raise SystemExit(f"Expected text not found in {path}: {old[:90]!r}")
        text = text.replace(old, new)
    p.write_text(text, encoding="utf-8")
    print(f"updated {path}")


replace("CSS/style.css", [
    ("/* Dynamic Variable Fallbacks / Rich Deep Purple Configuration */",
     "/* Dynamic Variable Fallbacks / Black & Orange Configuration */"),
    ("--accent: #8b00ff;", "--accent: #ff8a00;"),
    ("--accent-hover: #a033ff;", "--accent-hover: #ffab40;"),
    ("--bg-gradient: linear-gradient(135deg, #120024, #1a0033);",
     "--bg-gradient: linear-gradient(135deg, #000000, #0b0703);"),
    ("--container-bg: rgba(26, 0, 51, 0.98);",
     "--container-bg: rgba(10, 10, 10, 0.98);"),
    ("--text: #e0e0e0;", "--text: #ffd7a8;"),
    ("--bg-dashboard: #120024;   /* Deep Midnight Purple */",
     "--bg-dashboard: #000000;   /* Black */"),
    ("--bg-sidebar: #1a0033;     /* Rich Indigo/Violet */",
     "--bg-sidebar: #080808;     /* Near Black */"),
    ("--border-color: #3b1d70;   /* Vibrant Purple Border */",
     "--border-color: #3a2208;   /* Dark Orange Border */"),
    ("--text-main: #e8e0ff;", "--text-main: #ffb25e;      /* Orange Text */"),
    ("--text-muted: #b39ddb;", "--text-muted: #c98a55;"),
])

replace("themes/themes.css", [(
    """/* 1. DEFAULT PURPLE THEME */
:root, [data-theme="default"], body.theme-default {
  --bg-dashboard: #0b0813;
  --bg-sidebar: #110d22;
  --accent-color: #8b00ff;
  --accent-hover: #a033ff;
  --border-color: rgba(139, 0, 255, 0.15); 
  --text-main: #ffffff;
  --text-muted: #888888;
}""",
    """/* 1. DEFAULT BLACK & ORANGE THEME */
:root, [data-theme="default"], body.theme-default {
  --bg-dashboard: #000000;
  --bg-sidebar: #080808;
  --accent-color: #ff8a00;
  --accent-hover: #ffab40;
  --border-color: rgba(255, 138, 0, 0.22); 
  --text-main: #ffb25e;
  --text-muted: #c98a55;
}""",
)])

COMMON = {
    "#8b00ff": "#ff8a00",
    "#a033ff": "#ffab40",
    "#b056ff": "#ffb25e",
    "rgba(139, 0, 255": "rgba(255, 138, 0",
    "rgba(139,0,255": "rgba(255,138,0",
}

replace("index.html", [(old, new) for old, new in {
    **COMMON,
    "#12091c": "#0a0a0a",
    "#1e1131": "#15100a",
    "#928a9f": "#b58a63",
    "#b0a8c0": "#c9a27a",
    "#d4cce0": "#f0c9a4",
    "rgba(12, 6, 20": "rgba(8, 8, 8",
    "rgba(11, 3, 20": "rgba(8, 8, 8",
}.items()])

replace("CSS/style.css", list(COMMON.items()), optional=True)

replace("CSS/upgrade-pack.css", [(old, new) for old, new in {
    **COMMON,
    "#d8b4fe": "#ffcf9a",
    "#e9d5ff": "#ffd9b0",
    "#f2ecff": "#ffe3c4",
    "#a99bc4": "#c88f5a",
    "#12091c": "#0a0a0a",
}.items()], optional=True)

replace("Settings/settings.html", list(COMMON.items()), optional=True)
replace("Settings/settings.html", [(
    '<body style="background: #0b0512; color: white; padding: 40px 20px; font-family: sans-serif;">\n\n  <div class="settings-standalone-container" style="max-width: 800px; margin: 0 auto; background: rgba(18, 9, 28, 0.95); border: 1px solid #ff8a00; padding: 30px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">',
    '<body style="background: #000000; color: #ffb25e; padding: 40px 20px; font-family: sans-serif;">\n\n  <div class="settings-standalone-container" style="max-width: 800px; margin: 0 auto; background: rgba(10, 10, 10, 0.97); border: 1px solid #ff8a00; padding: 30px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">',
), (
    "border: 1px solid rgba(255, 138, 0, 0.4); color: white; padding: 10px 18px;",
    "border: 1px solid rgba(255, 138, 0, 0.4); color: #ffb25e; padding: 10px 18px;",
), (
    '<div class="preview purple-preview"></div>',
    '<div class="preview" style="background: #080808; border-color: #ff8a00;"></div>',
), (
    '<span>Default Purple</span>',
    '<span>Default Orange</span>',
)])

replace("chat/chat.js", [(
    """            if (activePmHandle && !freshConversations[activePmHandle] && pmConversations[activePmHandle]) {
                freshConversations[activePmHandle] = pmConversations[activePmHandle];
            }

            pmConversations = freshConversations;""",
    """            if (activePmHandle && !freshConversations[activePmHandle] && pmConversations[activePmHandle]) {
                freshConversations[activePmHandle] = pmConversations[activePmHandle];
            }

            // If the PM thread is on screen, its new messages are already being
            // read. Clear the badge immediately; markConversationRead below
            // persists that state to the API.
            const pmView = document.getElementById('pms-view');
            const pmThreadVisible = pmView && pmView.style.display !== 'none';
            if (pmThreadVisible && activePmHandle && freshConversations[activePmHandle]) {
                freshConversations[activePmHandle].unread = 0;
            }

            pmConversations = freshConversations;""",
), (
    """            if (activePmHandle && pmConversations[activePmHandle]) {
                renderPmThread(activePmHandle);
            }""",
    """            if (activePmHandle && pmConversations[activePmHandle]) {
                renderPmThread(activePmHandle);
                // The open thread is being read right now. Persist that even when
                // a new message arrives during the 4s polling refresh.
                markConversationRead(activePmHandle);
            }""",
), (
    """    async function markConversationRead(otherHandle) {
        const convo = pmConversations[otherHandle];
        if (!convo || convo.unread === 0) return;
        try {
            const unread = (convo.messages || []).filter(m => !m.is_read && m.sender_username !== myUsernameGlobal && m.sender_handle !== myHandleGlobal);
            await Promise.all(unread.map(async (m) => {
                const id = m.id || m.ID;
                if (!id) return;
                await fetch(`${TURSO_API_BASE}/private-messages`, {
                    method: 'PATCH',
                    headers: TURSO_HEADERS,
                    body: JSON.stringify({ id })
                });
            }));
            convo.unread = 0;
            updatePmUnreadBadge();
        } catch (e) { console.error("Failed marking conversation read:", e); }
    }""",
    """    async function markConversationRead(otherHandle) {
        const convo = pmConversations[otherHandle];
        if (!convo) return;
        try {
            const isUnread = (m) => !(m.is_read === true || m.is_read === 1 || m.is_read === '1');
            const unread = (convo.messages || []).filter(m => {
                if (!isUnread(m)) return false;
                const su = String(m.sender_username || '').toLowerCase().trim();
                const sh = String(m.sender_handle || '').toLowerCase().trim();
                const me = String(myUsernameGlobal || '').toLowerCase().trim();
                const mh = String(myHandleGlobal || '').toLowerCase().trim();
                return !((su && me && su === me) || (sh && mh && sh === mh));
            });
            await Promise.all(unread.map(async (m) => {
                const id = m.id || m.ID;
                if (!id) return;
                const res = await fetch(`${TURSO_API_BASE}/private-messages`, {
                    method: 'PATCH',
                    headers: TURSO_HEADERS,
                    body: JSON.stringify({ id, is_read: 1 })
                });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                m.is_read = 1;
            }));
            convo.unread = 0;
            updatePmUnreadBadge();
            renderPmConversationList();
        } catch (e) { console.error("Failed marking conversation read:", e); }
    }""",
)])

print("Done.")

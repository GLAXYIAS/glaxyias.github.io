document.addEventListener("DOMContentLoaded", () => {
    const THEME_KEY = "nxos_theme";
    const INTERACTIVE_BG_KEY = "nxos_interactive_bg";
    const BG_IMAGE_KEY = "nxos_bg_image";
    const THEME_BG_KEY = "nxos_theme_bg";
    const THEME_ACCENT_KEY = "nxos_theme_accent";
    const ANIM_KEY = "nxos_ui_anim";

    const THEME_CATALOG = {
        crimson:   { label: "Crimson",    bg: "#0d0606", accent: "#ff3b3b" },
        purple:    { label: "NXOS Purple", bg: "#0b0813", accent: "#8b00ff" },
        cyan:      { label: "Cyber Cyan", bg: "#041018", accent: "#00f2ff" },
        emerald:   { label: "Matrix Green", bg: "#04140c", accent: "#00ff88" },
        midnight:  { label: "Midnight",   bg: "#000000", accent: "#888888" },
        ocean:     { label: "Ocean",      bg: "#051425", accent: "#0088ff" },
        amber:     { label: "Amber",      bg: "#1a1005", accent: "#ffb020" },
        rose:      { label: "Rose",       bg: "#1a0a12", accent: "#ff5ca8" },
        vampire:   { label: "Vampire",    bg: "#0d0202", accent: "#ff0000" },
        forest:    { label: "Forest",     bg: "#030c05", accent: "#00cc44" },
        cyberpunk: { label: "Cyberpunk",  bg: "#1c0024", accent: "#fcee0a" },
        toxic:     { label: "Toxic",      bg: "#0f1402", accent: "#a3ff00" },
        solar:     { label: "Solar",      bg: "#140700", accent: "#ff5500" },
        ice:       { label: "Ice",        bg: "#0f191c", accent: "#00f3ff" },
        arcade:    { label: "Arcade",     bg: "#120421", accent: "#ff007f" },
        royal:     { label: "Royal",      bg: "#0f0314", accent: "#ffd700" },
        ghost:     { label: "Ghost",      bg: "#11161a", accent: "#708090" },
        copper:    { label: "Copper",     bg: "#140d0a", accent: "#b87333" },
        moonlight: { label: "Moonlight",  bg: "#080a0f", accent: "#7b92b5" },
        neon:      { label: "Neon",       bg: "#020005", accent: "#00ffef" },
        bubblegum: { label: "Bubblegum",  bg: "#261c21", accent: "#ffb7b2" },
        desert:    { label: "Desert",     bg: "#14120c", accent: "#d4af37" },
        espresso:  { label: "Espresso",   bg: "#0f0b08", accent: "#875c36" },
        eclipse:   { label: "Eclipse",    bg: "#050508", accent: "#800020" },
        cotton:    { label: "Cotton Candy", bg: "#121a24", accent: "#84dcc6" },
        rgb:       { label: "RGB Cycle",  bg: "#030303", accent: "#ff0000" },
        matrix:    { label: "Matrix",     bg: "#000000", accent: "#00ff00" },
        cosmic:    { label: "Cosmic",     bg: "#05010a", accent: "#7f00ff" },
        magma:     { label: "Magma",      bg: "#1a0a00", accent: "#ff3b00" },
        glacial:   { label: "Glacial",    bg: "#0a1116", accent: "#7fe9ff" },
        titanium:  { label: "Titanium",   bg: "#0c0c0e", accent: "#c0c0c0" },
        aurora:    { label: "Aurora",     bg: "#050a12", accent: "#00ffa6" },
        starforge: { label: "Starforge",  bg: "#0a0014", accent: "#ff00c8" },
        lab:       { label: "Laboratory", bg: "#0d0f12", accent: "#c8e6ff" },
        dragon:    { label: "Dragon",     bg: "#0b0f08", accent: "#cc0000" },
        storm:     { label: "Storm",      bg: "#0a0d12", accent: "#7fb2ff" },
        chrome:    { label: "Chrome",     bg: "#0c0c0c", accent: "#d9d9d9" },
        surge:     { label: "Electric Surge", bg: "#02040a", accent: "#00aaff" },
        void:      { label: "Void Ripple", bg: "#050007", accent: "#5500ff" },
        aether:    { label: "Aether",     bg: "#0a0f12", accent: "#66ffe0" },
        inferno:   { label: "Inferno",    bg: "#140600", accent: "#ff3300" },
        cryo:      { label: "Cryo",       bg: "#0b1418", accent: "#00eaff" },
        techno:    { label: "Techno",     bg: "#040d08", accent: "#00ff88" },
        sakura:    { label: "Sakura",     bg: "#1a0f13", accent: "#ff8fb1" },
        abyss:     { label: "Abyss",      bg: "#03060f", accent: "#2f7fff" },
        ember:     { label: "Ember",      bg: "#160a04", accent: "#ff6b35" },
        mint:      { label: "Mint",       bg: "#04120f", accent: "#4fffc4" },
        nebula:    { label: "Nebula",     bg: "#08030f", accent: "#b26bff" },
        vapor:     { label: "Vaporwave",  bg: "#0f0416", accent: "#ff77e1" },
        honey:     { label: "Honey",      bg: "#141004", accent: "#ffc93c" },
        obsidian:  { label: "Obsidian",   bg: "#060608", accent: "#9b8cff" }
    };

    function applyThemeLocal(theme, bg, accent) {
        const cat = THEME_CATALOG[theme];
        if (cat) {
            bg = bg || cat.bg;
            accent = accent || cat.accent;
        }
        document.body.setAttribute("data-theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
        // Keep every theme key in sync so the choice survives navigation
        localStorage.setItem(THEME_KEY, theme);
        localStorage.setItem("selectedTheme", theme);
        localStorage.setItem("nullx-theme", theme);
        if (bg) {
            document.body.style.setProperty("--nx-page-bg", bg);
            document.documentElement.style.setProperty("--nx-page-bg", bg);
            document.body.style.backgroundColor = bg;
            localStorage.setItem(THEME_BG_KEY, bg);
        }
        if (accent) {
            document.body.style.setProperty("--nx-accent", accent);
            document.documentElement.style.setProperty("--nx-accent", accent);
            localStorage.setItem(THEME_ACCENT_KEY, accent);
        }
    }

    // Build / expand theme grid
    const grid = document.getElementById("themeGrid") || document.querySelector(".theme-grid");
    if (grid) {
        const existing = new Set();
        grid.querySelectorAll(".theme-option").forEach(btn => {
            const id = btn.dataset.theme;
            if (id) existing.add(id);
            // ensure data-bg/accent
            if (THEME_CATALOG[id]) {
                btn.dataset.bg = THEME_CATALOG[id].bg;
                btn.dataset.accent = THEME_CATALOG[id].accent;
                const swatch = btn.querySelector(".color-preview");
                if (swatch) swatch.style.background = THEME_CATALOG[id].accent;
            }
        });
        Object.keys(THEME_CATALOG).forEach(id => {
            if (existing.has(id)) return;
            const t = THEME_CATALOG[id];
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "theme-option";
            btn.dataset.theme = id;
            btn.dataset.bg = t.bg;
            btn.dataset.accent = t.accent;
            btn.innerHTML = '<span class="color-preview" style="background:' + t.accent + '"></span><span>' + t.label + '</span>';
            grid.appendChild(btn);
        });
    }

    const themeButtons = document.querySelectorAll(".theme-option");
    const savedTheme = localStorage.getItem(THEME_KEY) || "crimson";

    themeButtons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.theme === savedTheme);
        btn.addEventListener("click", () => {
            themeButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const selectedTheme = btn.dataset.theme;
            const bg = btn.dataset.bg || (THEME_CATALOG[selectedTheme] && THEME_CATALOG[selectedTheme].bg) || "";
            const accent = btn.dataset.accent || (THEME_CATALOG[selectedTheme] && THEME_CATALOG[selectedTheme].accent) || "";
            localStorage.setItem(THEME_KEY, selectedTheme);
            applyThemeLocal(selectedTheme, bg, accent);
        });
    });

    applyThemeLocal(
        savedTheme,
        localStorage.getItem(THEME_BG_KEY),
        localStorage.getItem(THEME_ACCENT_KEY)
    );

    // Interactive mesh toggle
    const interactiveToggle = document.getElementById("interactiveBgToggle");
    if (interactiveToggle) {
        const enabled = localStorage.getItem(INTERACTIVE_BG_KEY);
        interactiveToggle.checked = enabled === null ? true : enabled === "true";
        interactiveToggle.addEventListener("change", () => {
            localStorage.setItem(INTERACTIVE_BG_KEY, interactiveToggle.checked ? "true" : "false");
        });
    } else {
        // Inject background controls if missing from HTML
        const animCard = document.getElementById("animToggle") && document.getElementById("animToggle").closest(".settings-card");
        if (animCard && !document.getElementById("interactiveBgToggle")) {
            const sec = document.createElement("section");
            sec.className = "settings-card";
            sec.innerHTML = '<h3>Background</h3><p class="subtitle">Interactive mesh and custom image.</p>' +
                '<div class="setting-row"><label for="interactiveBgToggle">Interactive mesh background</label>' +
                '<label class="switch"><input type="checkbox" id="interactiveBgToggle" checked><span class="slider"></span></label></div>' +
                '<div class="setting-row" style="margin-top:14px;flex-direction:column;align-items:flex-start;gap:10px;">' +
                '<label>Custom background image</label><div class="upload-row">' +
                '<label class="file-btn" for="bgImageInput">Upload image</label>' +
                '<input type="file" id="bgImageInput" accept="image/*" hidden>' +
                '<button type="button" id="clearBgImageBtn" class="ghost-btn">Clear image</button></div>' +
                '<div id="bgImagePreview" class="bg-preview hidden"></div></div>';
            animCard.parentNode.insertBefore(sec, animCard);
            const t = document.getElementById("interactiveBgToggle");
            if (t) {
                const en = localStorage.getItem(INTERACTIVE_BG_KEY);
                t.checked = en === null ? true : en === "true";
                t.addEventListener("change", () => {
                    localStorage.setItem(INTERACTIVE_BG_KEY, t.checked ? "true" : "false");
                });
            }
        }
    }

    // Background image
    function wireBgImage() {
        const bgInput = document.getElementById("bgImageInput");
        const clearBgBtn = document.getElementById("clearBgImageBtn");
        const preview = document.getElementById("bgImagePreview");
        function showPreview(dataUrl) {
            if (!preview) return;
            if (dataUrl) {
                preview.classList.remove("hidden");
                preview.style.backgroundImage = "url(" + dataUrl + ")";
            } else {
                preview.classList.add("hidden");
                preview.style.backgroundImage = "";
            }
        }
        const existingBg = localStorage.getItem(BG_IMAGE_KEY);
        if (existingBg) showPreview(existingBg);
        if (bgInput) {
            bgInput.addEventListener("change", () => {
                const file = bgInput.files && bgInput.files[0];
                if (!file) return;
                if (!file.type.startsWith("image/")) { alert("Please choose an image file."); return; }
                if (file.size > 2.5 * 1024 * 1024) {
                    alert("Image is too large (max about 2.5 MB).");
                    bgInput.value = "";
                    return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        localStorage.setItem(BG_IMAGE_KEY, reader.result);
                        showPreview(reader.result);
                    } catch (err) {
                        alert("Could not save image (storage full).");
                    }
                };
                reader.readAsDataURL(file);
            });
        }
        if (clearBgBtn) {
            clearBgBtn.addEventListener("click", () => {
                localStorage.removeItem(BG_IMAGE_KEY);
                if (bgInput) bgInput.value = "";
                showPreview(null);
            });
        }
    }
    wireBgImage();

    const cloakSelect = document.getElementById("cloakSelect");
    if (cloakSelect) {
        cloakSelect.value = localStorage.getItem("nxos_cloak") || "none";
        cloakSelect.addEventListener("change", (e) => {
            localStorage.setItem("nxos_cloak", e.target.value);
        });
    }

    const panicKeyInput = document.getElementById("panicKeyInput");
    const panicUrlInput = document.getElementById("panicUrlInput");
    if (panicKeyInput) {
        panicKeyInput.value = localStorage.getItem("nxos_panic_key") || "`";
        panicKeyInput.addEventListener("keydown", (e) => {
            e.preventDefault();
            const key = e.key;
            if (["Escape", "Shift", "Control", "Alt"].includes(key)) {
                panicKeyInput.value = "Invalid Key";
                setTimeout(() => { panicKeyInput.value = localStorage.getItem("nxos_panic_key") || "`"; }, 1000);
                return;
            }
            panicKeyInput.value = key;
            localStorage.setItem("nxos_panic_key", key);
            panicKeyInput.blur();
        });
    }
    if (panicUrlInput) {
        panicUrlInput.value = localStorage.getItem("nxos_panic_url") || "https://classroom.google.com";
        panicUrlInput.addEventListener("change", () => {
            localStorage.setItem("nxos_panic_url", panicUrlInput.value.trim());
        });
    }

    // Animations toggle ALSO disables interactive mesh
    const animToggle = document.getElementById("animToggle");
    const getInteractiveToggle = () => document.getElementById("interactiveBgToggle");
    if (animToggle) {
        const anim = localStorage.getItem(ANIM_KEY);
        animToggle.checked = anim === null ? true : anim === "true";

        function syncAnimState(enabled) {
            localStorage.setItem(ANIM_KEY, enabled ? "true" : "false");
            document.body.classList.toggle("no-ui-anim", !enabled);
            if (!enabled) {
                localStorage.setItem(INTERACTIVE_BG_KEY, "false");
                const it = getInteractiveToggle();
                if (it) it.checked = false;
            }
        }

        animToggle.addEventListener("change", () => syncAnimState(animToggle.checked));
        document.body.classList.toggle("no-ui-anim", !animToggle.checked);
        if (!animToggle.checked) {
            localStorage.setItem(INTERACTIVE_BG_KEY, "false");
            const it = getInteractiveToggle();
            if (it) it.checked = false;
        }
    }

    const clearBtn = document.getElementById("clearDataBtn");
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (!confirm("Wipe ALL local data for this site? This cannot be undone.")) return;
            localStorage.clear();
            sessionStorage.clear();
            alert("Local data cleared. Reloading…");
            location.reload();
        });
    }
});

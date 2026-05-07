import { games, getMostPopular } from './config.js';
import { applyCloak } from '../Cloaks/Cloaks.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Null_X Dashboard Loaded");

    // ====================== 1. PERSISTENCE (Load on Startup) ======================
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) applyTheme(savedTheme);

    const savedCloak = localStorage.getItem('savedCloak');
    if (savedCloak && savedCloak !== "none") {
        try {
            applyCloak(savedCloak);
        } catch (e) {
            console.error("Cloak import failed. Check file path.");
        }
    }

    let savedShortcut = localStorage.getItem('panicKey') || "";
    let savedLink = localStorage.getItem('panicUrl') || "https://google.com";

    // ====================== 2. SELECTORS ======================
    const settingsModal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettings = document.getElementById('closeSettings');
    const cloakSelector = document.getElementById('cloakSelector');
    const panicInput = document.getElementById('panicShortcut');
    const panicLinkInput = document.getElementById('panicLink');
    const savePanicBtn = document.getElementById('savePanic');

    // ====================== 3. THEME LOGIC ======================
    function applyTheme(theme) {
        const root = document.documentElement;
        if (theme === 'midnight') {
            root.style.setProperty('--accent', '#ffffff');
            root.style.setProperty('--container-bg', '#000000');
            root.style.setProperty('--bg-gradient', '#000000');
            document.body.style.background = "#000000";
        } else {
            root.style.setProperty('--accent', '#8b00ff');
            root.style.setProperty('--container-bg', 'rgba(15, 15, 25, 0.95)');
            root.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #0a0a0a, #1a0033)');
            document.body.style.background = "linear-gradient(135deg, #0a0a0a, #1a0033)";
        }
    }

    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            const theme = card.getAttribute('data-theme');
            applyTheme(theme);
            localStorage.setItem('selectedTheme', theme);
        });
    });

    // ====================== 4. TAB CLOAK LOGIC ======================
    if (cloakSelector) {
        if (savedCloak) cloakSelector.value = savedCloak;
        cloakSelector.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === "none") {
                localStorage.removeItem('savedCloak');
                location.reload(); 
            } else {
                applyCloak(val);
            }
        });
    }

    // ====================== 5. PANIC BUTTON LOGIC ======================
    if (panicInput) panicInput.value = savedShortcut;
    if (panicLinkInput) panicLinkInput.value = savedLink;

    if (panicInput) {
        panicInput.addEventListener('keydown', (e) => {
            e.preventDefault();
            panicInput.value = e.key; 
        });
    }

    if (savePanicBtn) {
        savePanicBtn.addEventListener('click', () => {
            localStorage.setItem('panicKey', panicInput.value);
            localStorage.setItem('panicUrl', panicLinkInput.value);
            savedShortcut = panicInput.value;
            savedLink = panicLinkInput.value;
            alert("Settings Saved!");
        });
    }

    window.addEventListener('keydown', (e) => {
        const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
        if (!isTyping && e.key === savedShortcut && savedShortcut !== "") {
            let url = savedLink.startsWith('http') ? savedLink : 'https://' + savedLink;
            window.location.href = url;
        }
    });

    // ====================== 6. MODAL CONTROL ======================
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => settingsModal.style.display = 'flex');
    }
    if (closeSettings) {
        closeSettings.addEventListener('click', () => settingsModal.style.display = 'none');
    }

    // ====================== 7. GAME LAUNCHER ======================
    function launchGame(gameId) {
        window.location.href = `Games/game-player.html?id=${gameId}`;
    }

    const randomBtn = document.getElementById('randomBtn');
    if (randomBtn) {
        randomBtn.addEventListener('click', () => {
            if (games.length === 0) return alert("No games found!");
            const randomGame = games[Math.floor(Math.random() * games.length)];
            launchGame(randomGame.id);
        });
    }

    // ====================== 8. FEATURED & UI ======================
    const popular = getMostPopular();
    if (popular && popular.length > 0) {
        const titleEl = document.getElementById('hero-title');
        const descEl = document.getElementById('hero-desc');
        if (titleEl) titleEl.textContent = popular[0].title;
        if (descEl) descEl.textContent = popular[0].desc;

        const playBtn = document.querySelector('.play-btn'); 
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                launchGame(popular[0].id);
            });
        }
    }

    const signInBtn = document.getElementById('signInBtn');
    if (signInBtn) {
        signInBtn.addEventListener('click', () => {
            window.location.href = "Login/login.html"; 
        });
    }

    const greeting = document.getElementById('greeting');
    if (greeting) {
        greeting.innerHTML = `<h1>Hello, Guest</h1><p>Find something fun to play.</p>`;
    }
});

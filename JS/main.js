import { applyCloak } from '../Cloaks/Cloaks.js';

/**
 * Null_X Database / Game Registry
 */
const _0xData = [
 {
  id: "b_ap",
  title: atob("QnJvdGF0byBBbGwgUGFpbiBObyBHYWlu"),
  url: "Games/brotatoAPNG/brotato.html",
  desc: "The newest version of Brotato with the All Pain No Gain update.",
  popular: true
},
  {
    id: "s_lp",
    title: atob("U2xvcGU="), 
    url: "Games/slope/index.html",
    desc: "A fast-paced 3D platformer. Stay on the track!",
    popular: true
  },
  {
    id: "d_md",
    title: atob("RHJpdmUwYWQ="), 
    url: "Games/drivemad/index.html",
    desc: "Challenging physics-based driving. Don't flip your truck!",
    popular: true
  },
  {
    id: "b_ft",
    title: atob("QnVsbGV0IEZvcmNl"), 
    url: "Games/bulletforce/index.html",
    desc: "Action-packed multiplayer FPS. dominate the battlefield.",
    popular: true
  },
  {
  id: "b_bb",
  title: atob("QmFzZWJhbGwgQnJvcw=="),
  url: "Games/baseballbros/Baseballbros.html",
  desc: "A fun arcade-style baseball game with fast-paced action and competitive gameplay.",
  popular: true
},
  {
  id: "b_kt",
  title: atob("QmFza2V0QnJvcw=="),
  url: "Games/basketbros/basketbros.html",
  desc: "A chaotic multiplayer basketball game packed with crazy dunks and fast-paced matches.",
  popular: true
},
  {
  id: "b_sts",
  title: atob("QmFza2V0YmFsbCBTdGFycw=="),
  url: "Games/basketballstars/Basketballstars.html",
  desc: "A fast-paced 1v1 basketball game featuring flashy moves, quick matches, and competitive street-style gameplay.",
  popular: true
},
  {
  id: "c_cc",
  title: atob("Q29va2llIENsaWNrZXI="),
  url: "Games/cookie clicker/Cookieclicker.html",
  desc: "An addictive incremental game where you click cookies to earn more cookies and unlock upgrades.",
  popular: true
},
  {
  id: "b_rd",
  title: atob("QmFza2V0IFJhbmRvbQ=="),
  url: "Games/basketrandom/Basketrandom.html",
  desc: "A chaotic basketball game with random physics, unpredictable jumps, and funny matches.",
  popular: true
}
];

/**
 * Helper: Filter data for popular/featured games
 */
function getMostPopular() {
    return _0xData.filter(g => g.popular);
}

/**
 * Global Function: Opens encrypted chat in a new tab
 * Cloaks the window title as "Grades" for stealth.
 */
window.openNullChat = function() {
    const user = localStorage.getItem('chatUser');
    if (!user) {
        window.location.href = "Login/login.html";
        return;
    }
    const chatWin = window.open('chat/chat.html', '_blank');
    if (chatWin) {
        chatWin.document.title = "Grades";
    }
};

/**
 * Core Architecture Tab Cloaking Payload Engine
 */
function launchStealthWindow(maskType, targetEnv) {
    const currentUrl = window.location.href;
    
    let title = "Google Docs";
    let escapeRedirect = "https://docs.google.com";

    if (maskType === 'Google Classroom') {
        title = "Classes";
        escapeRedirect = "https://classroom.google.com";
    } else if (maskType === 'Google Drive') {
        title = "My Drive - Google Drive";
        escapeRedirect = "https://drive.google.com";
    } else if (maskType === 'Gmail') {
        title = "Inbox";
        escapeRedirect = "https://mail.google.com";
    } else if (maskType === 'Canvas') {
        title = "Dashboard";
        escapeRedirect = "https://canvas.instructure.com";
    } else if (maskType === 'Canva') {
        title = "Home - Canva";
        escapeRedirect = "https://www.canva.com";
    } else if (maskType === 'Microsoft 365') {
        title = "Microsoft 365";
        escapeRedirect = "https://www.office.com";
    } else if (maskType === 'NoRedInk') {
        title = "NoRedInk";
        escapeRedirect = "https://www.noredink.com";
    } else if (maskType === 'Neptune Navigate') {
        title = "Neptune Navigate";
        escapeRedirect = "https://neptunenavigate.com";
    } else if (maskType === 'Pear Assessment') {
        title = "Pear Assessment";
        escapeRedirect = "https://www.pearassessment.com";
    } else if (maskType === 'Membean') {
        title = "Membean: Dashboard";
        escapeRedirect = "https://membean.com";
    } else if (maskType === 'i-Ready Reading' || maskType === 'i-Ready Math') {
        title = "i-Ready";
        escapeRedirect = "https://login.i-ready.com";
    } else if (maskType === 'DeltaMath') {
        title = "DeltaMath";
        escapeRedirect = "https://www.deltamath.com";
    } else if (maskType === 'ExploreLearning Gizmos') {
        title = "Gizmos Dashboard";
        escapeRedirect = "https://www.explorelearning.com";
    } else if (maskType === 'Progress Learning') {
        title = "Progress Learning";
        escapeRedirect = "https://progresslearning.com";
    } else if (maskType === 'Student Support Time') {
        title = "Student Support Time";
        escapeRedirect = "https://studentsupporttime.com";
    } else if (maskType === 'Kahoot') {
        title = "Enter Game PIN - Kahoot!";
        escapeRedirect = "https://kahoot.it";
    } else if (maskType === 'Nearpod') {
        title = "Nearpod";
        escapeRedirect = "https://nearpod.com";
    }

    let targetTab;

    if (targetEnv === 'blob') {
        const htmlPayload = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <style>
                    body, html { margin:0; padding:0; width:100%; height:100%; overflow:hidden; background:#000; }
                    iframe { width:100%; height:100%; border:none; margin:0; padding:0; }
                </style>
            </head>
            <body>
                <iframe src="${currentUrl}"></iframe>
            </body>
            </html>
        `;
        const blob = new Blob([htmlPayload], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        targetTab = window.open(blobUrl, '_blank');
    } else {
        targetTab = window.open('about:blank', '_blank');
        if (targetTab) {
            targetTab.document.title = title;
            const frame = targetTab.document.createElement('iframe');
            frame.src = currentUrl;
            frame.style = "position:fixed; top:0; left:0; width:100%; height:100%; border:none; margin:0; padding:0; overflow:hidden;";
            targetTab.document.body.appendChild(frame);
        }
    }

    if (!targetTab) {
        alert("Pop-up blocked! Please allow system popup permissions for deployment.");
        return;
    }

    window.location.replace(escapeRedirect);
}

function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'midnight') {
        root.style.setProperty('--accent', '#ffffff');
        root.style.setProperty('--container-bg', '#000000');
        document.body.style.background = "#000000";
    } else {
        root.style.setProperty('--accent', '#8b00ff');
        root.style.setProperty('--container-bg', 'rgba(15, 15, 25, 0.95)');
        document.body.style.background = "linear-gradient(135deg, #0a0a0a, #1a0033)";
    }
}

/**
 * ROOTED DIRECT NAVIGATION SYSTEM (NO IFRAMES TO BYPASS LINEWIZE)
 * This bypasses networks restrictions by directly opening the asset destination
 * natively inside the browser context, stripping out the frame layout entirely.
 */
function launchGame(gameId) {
    const game = _0xData.find(g => g.id === gameId);
    if (game) {
        // Drop the iframe handler completely and execute a direct window replacement location routing
        window.location.href = game.url;
    }
}

function showLibrary() {
    const heroSection = document.getElementById('heroSection');
    const gameGrid = document.getElementById('gameGrid');
    if (heroSection) heroSection.style.display = 'none';
    if (gameGrid) {
        gameGrid.innerHTML = '';
        gameGrid.style.display = 'grid';
        _0xData.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `
                <h3>${game.title}</h3>
                <div class="game-desc-overlay">${game.desc}</div>
            `;
            card.onclick = () => launchGame(game.id);
            gameGrid.appendChild(card);
        });
    }
}

function showHome() {
    const heroSection = document.getElementById('heroSection');
    const gameGrid = document.getElementById('gameGrid');
    if (heroSection) heroSection.style.display = 'flex';
    if (gameGrid) gameGrid.style.display = 'none';
}

/**
 * Main Initialization Logic
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. INTERACTIVE INITIALIZATION: AUTO-LAUNCH SYSTEM CHECK ---
    const autoLaunchEnabled = localStorage.getItem('autoLaunchStealth') === 'true';
    const savedCloakSelection = localStorage.getItem('savedCloak') || 'Google Classroom';
    const savedEnvironmentSetting = localStorage.getItem('autoLaunchEnv') || 'about:blank';

    if (autoLaunchEnabled) {
        localStorage.removeItem('autoLaunchStealth'); 
        setTimeout(() => {
            launchStealthWindow(savedCloakSelection, savedEnvironmentSetting);
        }, 300);
        return;
    }

    // --- 1. Educational Cloak Countdown Engine ---
    const cloakElement = document.getElementById('educational-cloak');
    const cloakTimerText = document.getElementById('cloak-timer');
    const cloakCheckbox = document.getElementById('toggle-study-cloak');
    
    const isCloakDisabled = localStorage.getItem('disableStudyCloak') === 'true';
    
    if (cloakCheckbox) {
        cloakCheckbox.checked = isCloakDisabled;
        cloakCheckbox.addEventListener('change', (e) => {
            localStorage.setItem('disableStudyCloak', e.target.checked ? 'true' : 'false');
        });
    }

    if (isCloakDisabled) {
        if (cloakElement) cloakElement.style.display = 'none';
    } else {
        let clockSecondsLeft = 20;
        if (cloakTimerText) cloakTimerText.textContent = clockSecondsLeft;
        
        const countdownLoop = setInterval(() => {
            clockSecondsLeft--;
            if (cloakTimerText) cloakTimerText.textContent = clockSecondsLeft;
            
            if (clockSecondsLeft <= 0) {
                clearInterval(countdownLoop);
                if (cloakElement) {
                    cloakElement.style.opacity = '0';
                    cloakElement.style.visibility = 'hidden';
                    setTimeout(() => {
                        cloakElement.style.display = 'none';
                    }, 500);
                }
            }
        }, 1000);
    }
    
    // --- 2. Theme & Cloak Persistence ---
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) applyTheme(savedTheme);

    // Setup Theme Click Triggers inside settings
    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            const chosenTheme = card.getAttribute('data-theme');
            localStorage.setItem('selectedTheme', chosenTheme);
            applyTheme(chosenTheme);
        });
    });

    const savedCloak = localStorage.getItem('savedCloak');
    if (savedCloak && savedCloak !== "none") {
        try { 
            applyCloak(savedCloak); 
        } catch (e) { 
            console.error("Cloak Error:", e); 
        }
    }

    // --- 3. Authentication UI Sync ---
    const user = localStorage.getItem('chatUser');
    const welcomeText = document.getElementById('welcome-text');
    const signInBtn = document.getElementById('signInBtn');

    if (user) {
        if (welcomeText) welcomeText.textContent = `Hello, ${user}`;
        if (signInBtn) signInBtn.textContent = "Sign Out";
    }

    if (signInBtn) {
        signInBtn.onclick = () => {
            if (localStorage.getItem('chatUser')) {
                localStorage.removeItem('chatUser');
                location.reload();
            } else {
                window.location.href = "Login/login.html";
            }
        };
    }

    // --- 4. DOM Element Selection ---
    const settingsModal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettings = document.getElementById('closeSettings');
    const cloakSelector = document.getElementById('cloakSelector');
    const navHome = document.getElementById('nav-home');
    const navGames = document.getElementById('nav-games');
    const navComms = document.getElementById('nav-communications');
    const heroSection = document.getElementById('heroSection');
    const gameGrid = document.getElementById('gameGrid');
    
    const stealthOpener = document.getElementById('stealthOpener');
    const autoLaunchCheckbox = document.getElementById('toggle-auto-launch');
    const autoLaunchOptionsDiv = document.getElementById('auto-launch-options');
    const autoLaunchEnvSelect = document.getElementById('auto-launch-environment');
    
    const panicShortcutInput = document.getElementById('panicShortcut');
    const panicLinkInput = document.getElementById('panicLink');
    const savePanicBtn = document.getElementById('savePanic');

    // --- 6. Direct Stealth Action Trigger ---
    if (stealthOpener) {
        stealthOpener.onclick = (e) => {
            e.preventDefault();
            const currentCloak = localStorage.getItem('savedCloak') || 'Google Classroom';
            const currentEnv = localStorage.getItem('autoLaunchEnv') || 'about:blank';
            launchStealthWindow(currentCloak, currentEnv);
        };
    }

    // --- 7. Persistent Configuration Settings State Management ---
    if (autoLaunchCheckbox && autoLaunchOptionsDiv && autoLaunchEnvSelect) {
        autoLaunchCheckbox.checked = localStorage.getItem('autoLaunchEnvActive') === 'true';
        autoLaunchEnvSelect.value = savedEnvironmentSetting;

        if (autoLaunchCheckbox.checked) {
            autoLaunchOptionsDiv.classList.remove('hidden');
        } else {
            autoLaunchOptionsDiv.classList.add('hidden');
        }

        autoLaunchCheckbox.addEventListener('change', (e) => {
            const status = e.target.checked;
            localStorage.setItem('autoLaunchEnvActive', status ? 'true' : 'false');
            
            if (status) {
                localStorage.setItem('autoLaunchStealth', 'true');
                autoLaunchOptionsDiv.classList.remove('hidden');
            } else {
                localStorage.removeItem('autoLaunchStealth');
                autoLaunchOptionsDiv.classList.add('hidden');
            }
        });

        autoLaunchEnvSelect.addEventListener('change', (e) => {
            localStorage.setItem('autoLaunchEnv', e.target.value);
            if (autoLaunchCheckbox.checked) {
                localStorage.setItem('autoLaunchStealth', 'true');
            }
        });
    }

    if (panicShortcutInput) {
        panicShortcutInput.value = localStorage.getItem('panicKey') || "";
        panicShortcutInput.onclick = () => {
            panicShortcutInput.placeholder = "Press any key...";
            const captureKey = (e) => {
                e.preventDefault();
                localStorage.setItem('panicKey', e.key);
                panicShortcutInput.value = e.key;
                window.removeEventListener('keydown', captureKey);
            };
            window.addEventListener('keydown', captureKey);
        };
    }

    if (savePanicBtn) {
        savePanicBtn.onclick = () => {
            let link = panicLinkInput.value || "https://classroom.google.com";
            if (!link.startsWith('http')) {
                link = 'https://' + link;
            }
            localStorage.setItem('panicUrl', link);
            alert("Panic settings saved!");
        };
    }

    // --- 8. Navigation Event Handlers ---
    if (navGames) navGames.onclick = (e) => { e.preventDefault(); showLibrary(); };
    if (navHome) navHome.onclick = (e) => { e.preventDefault(); showHome(); };

    if (navComms) {
        navComms.onclick = (e) => {
            e.preventDefault();
            if (heroSection) heroSection.style.display = 'none';
            if (gameGrid) {
                gameGrid.innerHTML = `
                    <div class="game-card" id="chatCardLauncher" style="cursor:pointer; border: 1px solid #8b00ff; background: #0a0a0a; grid-column: span 1; padding: 20px;">
                        <div class="game-info">
                            <h3>Null Chat</h3>
                            <p>Encrypted Comms (Sign-in Required)</p>
                        </div>
                    </div>
                    <div class="form-wrapper" style="grid-column: 1 / -1; margin-top: 30px;">
                        <h2 class="form-title">Request a Game</h2>
                        <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSdM5VOrjMSdmRv5udVq9PTP4olf6kBQtShX3ZT9-I45Uu0nfQ/viewform?embedded=true" class="google-form-iframe" width="100%" height="700" frameborder="0" style="border-radius: 10px; background: #fff;">
                        Loading…
                        </iframe>
                    </div>
                `;
                gameGrid.style.display = 'grid';
                document.getElementById('chatCardLauncher').onclick = () => openNullChat();
            }
        };
    }

    if (settingsBtn) settingsBtn.onclick = () => settingsModal.style.display = 'flex';
    if (closeSettings) closeSettings.onclick = () => settingsModal.style.display = 'none';

    if (cloakSelector) {
        if (savedCloak) cloakSelector.value = savedCloak;
        cloakSelector.onchange = (e) => {
            const val = e.target.value;
            if (val === "none") {
                localStorage.removeItem('savedCloak');
                location.reload(); 
            } else {
                localStorage.setItem('savedCloak', val);
                applyCloak(val);
            }
        };
    }

    // --- 9. Page Content Initialization ---
    const popular = getMostPopular();
    if (popular.length > 0) {
        const titleEl = document.getElementById('hero-title');
        const descEl = document.getElementById('hero-desc');
        const playBtn = document.getElementById('playFeatured');

        if (titleEl) titleEl.textContent = popular[0].title;
        if (descEl) descEl.textContent = popular[0].desc;
        if (playBtn) playBtn.onclick = () => launchGame(popular[0].id);
    }

    window.addEventListener('keydown', (e) => {
        const panicKey = localStorage.getItem('panicKey');
        if (panicKey && e.key === panicKey) {
            let url = localStorage.getItem('panicUrl') || "https://classroom.google.com";
            if (!url.startsWith('http')) {
                url = 'https://' + url;
            }
            window.location.href = url;
        }
    });
});

/**
 * Null_X Chat System
 * Version: 2.0 (Moderation & Profiles Update)
 * Lines: ~430
 */

// --- DATABASE CONFIGURATION ---
const SUPABASE_URL = 'https://ukwjojxutcjkvabnybtj.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrd2pvanh1dGNqa3ZhYm55YnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNzk5NDAsImV4cCI6MjA5Mzg1NTk0MH0.iLr9OrIZlRBrbcI1XDE0zl7t_wpwVg3ko3DgppxbUh8'; 

// --- GLOBAL VARIABLES ---
const ADMIN_NAME = "glaeesas";
let allUsers = [];
let lastMessageTime = 0; 
let reportingUser = ""; 
let isLockdownActive = false;

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- 1. AUTHENTICATION CHECK ---
    const user = localStorage.getItem('chatUser');
    if (!user) {
        window.location.href = "../Login/login.html";
        return;
    }
    const lowerUser = user.toLowerCase();

    // --- 2. THE LOCKDOWN GUARD (CHECK STATUS ON LOAD) ---
    async function checkUserStatus() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/user_roles?username=eq.${user}&select=*`, {
                headers: { 
                    'apikey': SUPABASE_KEY, 
                    'Authorization': `Bearer ${SUPABASE_KEY}` 
                }
            });
            const data = await response.json();
            const profile = data[0];

            if (!profile) return;

            const overlay = document.getElementById('lockdown-overlay');
            const title = document.getElementById('lockdown-title');
            const msg = document.getElementById('lockdown-msg');
            const timerBox = document.getElementById('lockdown-timer');

            // PERMANENT BAN CHECK
            if (profile.is_banned === true) {
                isLockdownActive = true;
                overlay.style.display = 'flex';
                title.innerText = "YOU ARE PERMANENTLY BANNED";
                title.style.color = "red";
                msg.innerText = `Reason: ${profile.last_action_reason || "Violation of community guidelines."}`;
                return;
            }

            // TEMPORARY BAN CHECK
            if (profile.temp_ban_until) {
                const now = new Date();
                const expiry = new Date(profile.temp_ban_until);

                if (expiry > now) {
                    isLockdownActive = true;
                    overlay.style.display = 'flex';
                    title.innerText = "YOU ARE TEMPORARILY BANNED";
                    title.style.color = "red";
                    msg.innerText = `Reason: ${profile.last_action_reason || "Suspicious behavior."}`;
                    
                    // START THE LIVE TIMER
                    const startTimer = () => {
                        const currentTime = new Date();
                        const timeDiff = expiry - currentTime;

                        if (timeDiff <= 0) {
                            overlay.style.display = 'none';
                            isLockdownActive = false;
                            location.reload(); 
                            return;
                        }

                        const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
                        const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
                        const seconds = Math.floor((timeDiff / 1000) % 60);

                        timerBox.innerText = `Time Remaining: ${hours}h ${minutes}m ${seconds}s`;
                    };
                    
                    setInterval(startTimer, 1000);
                    startTimer();
                    return;
                }
            }

            // WARNING CHECK (ONLY SHOWS ONCE PER SESSION)
            if (profile.warned === true && !sessionStorage.getItem('warn-shown')) {
                alert(`--- OFFICIAL WARNING ---\n\nUser: ${user}\nReason: ${profile.last_action_reason}\n\nContinuing this behavior will result in a ban.`);
                sessionStorage.setItem('warn-shown', 'true');
            }

        } catch (error) {
            console.error("Critical Security Check Error:", error);
        }
    }

    // Run status check immediately
    await checkUserStatus();

    // --- 3. UI INITIALIZATION ---
    document.title = "Grades";
    
    if (lowerUser === ADMIN_NAME) {
        const adminTab = document.getElementById('admin-tab');
        if (adminTab) {
            adminTab.style.display = 'block';
        }
    }

    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) {
        usernameDisplay.textContent = user;
    }
    
    const msgContainer = document.getElementById('chat-messages');

    // --- 4. ADMIN SEARCH DROPDOWN (UPWARD GROWTH) ---
    window.handleAdminSearch = (val, inputId) => {
        let dropdown = document.getElementById(inputId + '-dropdown');
        
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.id = inputId + '-dropdown';
            dropdown.className = "search-dropdown-results";
            
            // Explicit Upward Positioning
            dropdown.style.position = 'absolute';
            dropdown.style.bottom = '100%'; 
            dropdown.style.left = '0';
            dropdown.style.background = '#111';
            dropdown.style.border = '2px solid #8b00ff';
            dropdown.style.width = '100%';
            dropdown.style.zIndex = '99999';
            dropdown.style.maxHeight = '180px';
            dropdown.style.overflowY = 'auto';

            const parent = document.getElementById(inputId).parentNode;
            parent.style.position = 'relative';
            parent.appendChild(dropdown);
        }

        if (!val.includes('@')) {
            dropdown.style.display = 'none';
            return;
        }

        const searchPart = val.split('@')[1].toLowerCase();
        const matches = allUsers.filter(u => u.toLowerCase().includes(searchPart));

        if (matches.length > 0) {
            dropdown.innerHTML = '';
            matches.forEach(match => {
                const item = document.createElement('div');
                item.style.padding = '10px';
                item.style.cursor = 'pointer';
                item.style.color = 'white';
                item.style.borderBottom = '1px solid #222';
                item.innerText = match;
                
                item.addEventListener('mouseenter', () => item.style.background = '#8b00ff');
                item.addEventListener('mouseleave', () => item.style.background = 'transparent');
                item.addEventListener('click', () => {
                    document.getElementById(inputId).value = match;
                    dropdown.style.display = 'none';
                });
                
                dropdown.appendChild(item);
            });
            dropdown.style.display = 'block';
        } else {
            dropdown.style.display = 'none';
        }
    };

    // --- 5. USER DIRECTORY & FETCHING ---
    const fetchAllUsers = async () => {
        try {
            const rolesResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_roles?select=username`, {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            const rolesData = await rolesResponse.json();

            const messagesResponse = await fetch(`${SUPABASE_URL}/rest/v1/messages?select=username`, {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            const messagesData = await messagesResponse.json();

            const combined = [
                ...rolesData.map(u => u.username),
                ...messagesData.map(u => u.username)
            ];

            allUsers = [...new Set(combined)].filter(name => name != null);
            renderUserDirectory();
        } catch (err) {
            console.error("Directory Fetch Error:", err);
        }
    };

    const renderUserDirectory = (filterTerm = "") => {
        const listContainer = document.getElementById('user-list-display');
        if (!listContainer) return;

        const filtered = allUsers.filter(u => 
            u.toLowerCase().includes(filterTerm.toLowerCase())
        );

        listContainer.innerHTML = '';
        filtered.forEach(username => {
            const card = document.createElement('div');
            card.className = 'admin-card';
            card.style.textAlign = 'center';

            card.innerHTML = `
                <div onclick="toggleUserActions('${username}')" style="cursor:pointer;">
                    <div class="avatar" style="margin: 0 auto 10px; width:50px; height:50px; background:#333; border-radius:50%;"></div>
                    <strong>${username}</strong>
                </div>
                <div id="actions-${username}" style="display:none; margin-top:15px; gap:10px; justify-content:center;">
                    <button onclick="openReportModal('${username}')" style="background:#ff4444; color:white; border:none; padding:8px 12px; border-radius:5px; cursor:pointer;">Report</button>
                    <button onclick="alert('DM coming soon')" style="background:#8b00ff; color:white; border:none; padding:8px 12px; border-radius:5px; cursor:pointer;">Message</button>
                </div>
            `;
            listContainer.appendChild(card);
        });
    };

    window.toggleUserActions = (target) => {
        const actionArea = document.getElementById(`actions-${target}`);
        const isCurrentlyOn = actionArea.style.display === 'flex';
        
        allUsers.forEach(u => {
            const area = document.getElementById(`actions-${u}`);
            if (area) area.style.display = 'none';
        });

        if (!isCurrentlyOn) actionArea.style.display = 'flex';
    };

    // --- 6. REPORTING MODAL SYSTEM ---
    window.openReportModal = (target) => {
        reportingUser = target;
        let reportModal = document.getElementById('report-modal');
        
        if (!reportModal) {
            reportModal = document.createElement('div');
            reportModal.id = 'report-modal';
            reportModal.className = 'modal-overlay';
            document.body.appendChild(reportModal);
        }

        reportModal.innerHTML = `
            <div class="modal-box" style="background:#111; padding:30px; border:1px solid #ff4444; border-radius:10px; width:400px; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:1000000;">
                <h2 style="color:#ff4444; margin-bottom:10px;">Report User</h2>
                <p>Reporting: <strong>${target}</strong></p>
                <textarea id="report-reason-text" placeholder="Explain the violation..." style="width:100%; height:100px; background:#000; border:1px solid #333; color:white; padding:10px; margin-top:15px;"></textarea>
                <div style="display:flex; gap:10px; margin-top:20px;">
                    <button onclick="submitReport()" style="flex:1; background:#ff4444; color:white; padding:10px; border:none; border-radius:5px; cursor:pointer;">Submit Report</button>
                    <button onclick="document.getElementById('report-modal').style.display='none'" style="flex:1; background:#333; color:white; padding:10px; border:none; border-radius:5px; cursor:pointer;">Cancel</button>
                </div>
            </div>
        `;
        reportModal.style.display = 'block';
    };

    window.submitReport = async () => {
        const reason = document.getElementById('report-reason-text').value.trim();
        if (!reason) return alert("Please enter a reason.");

        try {
            await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
                method: 'POST',
                headers: { 
                    'apikey': SUPABASE_KEY, 
                    'Authorization': `Bearer ${SUPABASE_KEY}`, 
                    'Content-Type': 'application/json', 
                    'Prefer': 'resolution=merge-duplicates' 
                },
                body: JSON.stringify({ 
                    username: reportingUser, 
                    last_action_reason: `REPORTED BY ${user}: ${reason}`, 
                    last_action_type: 'report' 
                })
            });
            alert("Report successfully filed.");
            document.getElementById('report-modal').style.display = 'none';
        } catch (err) { console.error(err); }
    };

    // --- 7. TAB NAVIGATION ---
    window.switchTab = (target) => {
        const views = ['chat-view', 'rules-view', 'admin-panel-view', 'users-view'];
        views.forEach(v => {
            const el = document.getElementById(v);
            if (el) el.style.display = 'none';
        });

        document.querySelectorAll('.channel').forEach(c => c.classList.remove('active'));

        if (target === 'general' || target === 'dev-logs') {
            document.getElementById('chat-view').style.display = 'flex';
            document.getElementById(target === 'general' ? 'chan-general' : 'chan-dev').classList.add('active');
        } else if (target === 'users') {
            document.getElementById('users-view').style.display = 'block';
            document.getElementById('chan-users').classList.add('active');
            fetchAllUsers();
        } else if (target === 'rules') {
            document.getElementById('rules-view').style.display = 'block';
            document.getElementById('chan-rules').classList.add('active');
        } else if (target === 'admin') {
            document.getElementById('admin-panel-view').style.display = 'block';
            document.getElementById('admin-tab').classList.add('active');
            fetchAllUsers();
        }
    };

    // --- 8. MESSAGE ENGINE ---
    async function fetchMessages() {
        if (isLockdownActive) return; // Stop fetching if banned

        try {
            const mResponse = await fetch(`${SUPABASE_URL}/rest/v1/messages?select=*&order=created_at.asc`, {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            const rResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_roles?select=*`, {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });

            const messages = await mResponse.json();
            const roles = await rResponse.json();

            if (!Array.isArray(messages) || !msgContainer) return;

            msgContainer.innerHTML = '';
            messages.forEach(msg => {
                const isDeleted = msg.content === "Message Was Deleted By Owner";
                const roleData = roles.find(r => r.username === msg.username);
                
                const dateObj = new Date(msg.created_at);
                const fullTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                
                let roleTag = "";
                if (msg.username.toLowerCase() === ADMIN_NAME) {
                    roleTag = `<span class="owner-tag">OWNER</span>`;
                } else if (roleData && roleData.role_tag) {
                    roleTag = `<span style="color:#aaa; font-weight:bold; margin-right:5px;">[${roleData.role_tag.toUpperCase()}]</span> `;
                }

                const msgDiv = document.createElement('div');
                msgDiv.className = `message ${msg.username === user ? 'my-message' : 'other-message'}`;
                
                const delBtn = (lowerUser === ADMIN_NAME && !isDeleted) 
                    ? `<button class="delete-btn" onclick="deleteMsg('${msg.id}')">⋮</button>` 
                    : "";

                msgDiv.innerHTML = `
                    <div class="msg-info">
                        <div style="display:flex; align-items:center;">
                            ${roleTag}<strong>${msg.username}</strong>
                        </div>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span style="font-size:10px; opacity:0.4;">${fullTime}</span>
                            ${delBtn}
                        </div>
                    </div>
                    <div class="${isDeleted ? 'message-deleted' : ''}">${msg.content}</div>
                `;
                msgContainer.appendChild(msgDiv);
            });
            msgContainer.scrollTop = msgContainer.scrollHeight;
        } catch (e) { console.error(e); }
    }

    // --- 9. ANTI-SPAM & SENDING ---
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        chatForm.onsubmit = async (e) => {
            e.preventDefault();
            
            if (isLockdownActive) {
                alert("You cannot send messages while banned.");
                return;
            }

            const now = Date.now();
            const input = document.getElementById('message-input');
            const val = input.value.trim();

            if (now - lastMessageTime < 3000 && lowerUser !== ADMIN_NAME) {
                const wait = Math.ceil((3000 - (now - lastMessageTime)) / 1000);
                alert(`Please wait ${wait}s before messaging again.`);
                return;
            }

            if (!val) return;
            input.value = "";
            lastMessageTime = now;

            try {
                const res = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
                    method: 'POST',
                    headers: { 
                        'apikey': SUPABASE_KEY, 
                        'Authorization': `Bearer ${SUPABASE_KEY}`, 
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({ username: user, content: val })
                });

                if (res.ok) fetchMessages();
            } catch (err) { console.error(err); }
        };
    }

    // --- 10. EXPANDED ADMIN ACTIONS ---
    window.adminExecute = async (action) => {
        let targets = [];
        const cat = document.getElementById('ban-category').value;
        let single, bulk, reason;

        if (action === 'warn') {
            single = document.getElementById('warn-search').value.trim();
            bulk = document.getElementById('bulk-warn').value.trim();
            reason = document.getElementById('warn-reason').value.trim();
        } else {
            single = document.getElementById('ban-search').value.trim();
            reason = document.getElementById('ban-reason').value.trim();
        }

        if (single) targets = [single];
        else if (bulk) targets = bulk.split(',').map(n => n.trim()).filter(n => n);

        if (targets.length === 0) return alert("Select a target.");

        for (const t of targets) {
            let payload = { 
                username: t, 
                last_action_reason: reason || "No reason specified.", 
                last_action_type: action, 
                last_action_category: cat 
            };

            if (action === 'ban') {
                payload.is_banned = true;
                payload.ban_until = '3000-01-01T00:00:00Z';
            } else if (action === 'unban') {
                payload.is_banned = false;
                payload.warned = false;
                payload.temp_ban_until = null;
            } else if (action === 'warn') {
                payload.warned = true;
            }

            await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
                method: 'POST',
                headers: { 
                    'apikey': SUPABASE_KEY, 
                    'Authorization': `Bearer ${SUPABASE_KEY}`, 
                    'Content-Type': 'application/json', 
                    'Prefer': 'resolution=merge-duplicates' 
                },
                body: JSON.stringify(payload)
            });
        }
        alert("Action completed.");
    };

    window.executeTempBan = async () => {
        const target = document.getElementById('temp-ban-search').value.trim();
        const duration = parseInt(document.getElementById('temp-ban-duration').value);
        const reason = document.getElementById('temp-ban-reason').value.trim();

        if (!target) return alert("Select a user for temp ban.");

        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + duration);

        try {
            await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
                method: 'POST',
                headers: { 
                    'apikey': SUPABASE_KEY, 
                    'Authorization': `Bearer ${SUPABASE_KEY}`, 
                    'Content-Type': 'application/json', 
                    'Prefer': 'resolution=merge-duplicates' 
                },
                body: JSON.stringify({ 
                    username: target, 
                    last_action_type: 'temp_ban',
                    last_action_reason: reason || "Temporary suspension.",
                    temp_ban_until: expiry.toISOString()
                })
            });
            alert(`User ${target} banned for ${duration} minutes.`);
        } catch (err) { console.error(err); }
    };

    window.deleteMsg = async (id) => {
        if (!confirm("Remove message?")) return;
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/messages?id=eq.${id}`, {
                method: 'PATCH',
                headers: { 
                    'apikey': SUPABASE_KEY, 
                    'Authorization': `Bearer ${SUPABASE_KEY}`, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ content: "Message Was Deleted By Owner" })
            });
            fetchMessages();
        } catch (e) { console.error(e); }
    };

    // --- 11. EVENT LISTENERS & LOOPS ---
    const dirSearch = document.getElementById('directory-search');
    if (dirSearch) dirSearch.addEventListener('input', (e) => renderUserDirectory(e.target.value));
    
    document.getElementById('warn-search').oninput = (e) => handleAdminSearch(e.target.value, 'warn-search');
    document.getElementById('ban-search').oninput = (e) => handleAdminSearch(e.target.value, 'ban-search');
    document.getElementById('temp-ban-search').oninput = (e) => handleAdminSearch(e.target.value, 'temp-ban-search');

    setInterval(fetchMessages, 3000);
    fetchMessages();
});

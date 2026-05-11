const SUPABASE_URL = 'https://ukwjojxutcjkvabnybtj.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrd2pvanh1dGNqa3ZhYm55YnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNzk5NDAsImV4cCI6MjA5Mzg1NTk0MH0.iLr9OrIZlRBrbcI1XDE0zl7t_wpwVg3ko3DgppxbUh8'; 

const ADMIN_NAME = "glaeesas";
let allUsers = [];
let lastMessageTime = 0; 

document.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('chatUser');
    if (!user) { window.location.href = "../Login/login.html"; return; }

    const lowerUser = user.toLowerCase();

    // Tab Cloak Logic
    document.title = "Grades";
    Object.defineProperty(document, 'title', { value: 'Grades', writable: false });

    // Ensure Admin Tab is visible only to the owner
    if (lowerUser === ADMIN_NAME) {
        const adminTab = document.getElementById('admin-tab');
        if (adminTab) adminTab.style.display = 'block';
    }

    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) usernameDisplay.textContent = user;
    
    const msgContainer = document.getElementById('chat-messages');

    // --- SEARCH DROPDOWN LOGIC ---
    const createDropdown = (inputId) => {
        let dropdown = document.getElementById(inputId + '-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.id = inputId + '-dropdown';
            dropdown.style.cssText = `
                position: absolute;
                top: 100%; 
                left: 0;
                background: #1a1a1a;
                border: 2px solid #8b00ff;
                border-radius: 0 0 8px 8px;
                z-index: 10000;
                width: 100%;
                max-height: 200px;
                overflow-y: auto;
                display: none;
                box-shadow: 0 10px 20px rgba(0,0,0,0.9);
            `;
            const parent = document.getElementById(inputId).parentNode;
            parent.style.position = 'relative';
            parent.appendChild(dropdown);
        }
        return dropdown;
    };

    window.handleAdminSearch = (val, inputId) => {
        const dropdown = createDropdown(inputId);
        if (!val.includes('@')) {
            dropdown.style.display = 'none';
            return;
        }

        const searchPart = val.split('@')[1].toLowerCase();
        const matches = allUsers.filter(u => u.toLowerCase().includes(searchPart));

        if (matches.length > 0) {
            dropdown.innerHTML = matches.map(u => `
                <div style="padding: 12px; cursor: pointer; border-bottom: 1px solid #333; color: white; font-weight: bold;" 
                     onmouseover="this.style.background='#8b00ff'" 
                     onmouseout="this.style.background='transparent'"
                     onclick="selectAdminUser('${u}', '${inputId}')">${u}</div>
            `).join('');
            dropdown.style.display = 'block';
        } else {
            dropdown.style.display = 'none';
        }
    };

    window.selectAdminUser = (name, inputId) => {
        document.getElementById(inputId).value = name;
        document.getElementById(inputId + '-dropdown').style.display = 'none';
    };

    // Deep fetch to ensure NO ONE is missing from the list
    const fetchAllUsers = async () => {
        try {
            const [rolesRes, msgRes] = await Promise.all([
                fetch(`${SUPABASE_URL}/rest/v1/user_roles?select=username`, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }}),
                fetch(`${SUPABASE_URL}/rest/v1/messages?select=username`, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }})
            ]);
            const rolesData = await rolesRes.json();
            const msgData = await msgRes.json();
            
            // Merge all sources of usernames
            const combined = [...rolesData.map(u => u.username), ...msgData.map(u => u.username)];
            allUsers = [...new Set(combined)].filter(n => n); // Remove duplicates and nulls
        } catch (e) { console.error("Admin Search Fetch Error:", e); }
    };

    // --- TAB NAVIGATION ---
    window.switchTab = (tab) => {
        const views = {
            'general': 'chat-view',
            'dev-logs': 'chat-view',
            'rules': 'rules-view',
            'admin': 'admin-panel-view'
        };

        // Hide all views
        ['chat-view', 'rules-view', 'admin-panel-view'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        // Deactivate all sidebar items
        document.querySelectorAll('.channel').forEach(c => c.classList.remove('active'));

        // Show selected view
        const activeView = views[tab];
        if (activeView) {
            const el = document.getElementById(activeView);
            el.style.display = (activeView === 'chat-view') ? 'flex' : 'block';
        }

        // Highlight sidebar
        const chanId = (tab === 'dev-logs') ? 'chan-dev' : `chan-${tab}`;
        const activeChan = document.getElementById(chanId) || document.getElementById('admin-tab');
        if (activeChan) activeChan.classList.add('active');

        // Special logic for entering Admin Mode
        if (tab === 'admin') fetchAllUsers(); 
    };

    // --- MESSAGE RENDERING & TIMESTAMPS ---
    async function fetchMessages() {
        try {
            const [mRes, rRes] = await Promise.all([
                fetch(`${SUPABASE_URL}/rest/v1/messages?select=*&order=created_at.asc`, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }}),
                fetch(`${SUPABASE_URL}/rest/v1/user_roles?select=*`, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }})
            ]);
            const messages = await mRes.json();
            const roles = await rRes.json();

            if (!Array.isArray(messages) || !msgContainer) return;

            msgContainer.innerHTML = '';
            messages.forEach(msg => {
                const isDeleted = msg.content === "Message Was Deleted By Owner";
                const roleData = roles.find(r => r.username === msg.username);
                
                // Format Timestamp
                const dateObj = new Date(msg.created_at);
                const timestamp = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                
                let tag = "";
                if (msg.username.toLowerCase() === ADMIN_NAME) { 
                    tag = `<span class="owner-tag">OWNER</span>`; 
                } else if (roleData && roleData.role_tag) { 
                    tag = `<span style="color:#aaa; font-weight:bold; margin-right:5px;">[${roleData.role_tag.toUpperCase()}]</span> `; 
                }

                const msgDiv = document.createElement('div');
                msgDiv.className = `message ${msg.username === user ? 'my-message' : 'other-message'}`;
                
                const deleteAction = (lowerUser === ADMIN_NAME && !isDeleted) 
                    ? `<button class="delete-btn" onclick="deleteMsg('${msg.id}')">⋮</button>` 
                    : "";

                msgDiv.innerHTML = `
                    <div class="msg-info">
                        <div style="display: flex; align-items: center;">
                            ${tag}<strong>${msg.username}</strong>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 10px; opacity: 0.4;">${timestamp}</span>
                            ${deleteAction}
                        </div>
                    </div>
                    <div class="${isDeleted ? 'message-deleted' : ''}">${msg.content}</div>
                `;
                msgContainer.appendChild(msgDiv);
            });
            msgContainer.scrollTop = msgContainer.scrollHeight;
        } catch (err) { console.error("Fetch Messages Error:", err); }
    }

    // --- ANTI-SPAM & SENDING ---
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        chatForm.onsubmit = async (e) => {
            e.preventDefault();
            const now = Date.now();
            
            // Strict Anti-Spam Check (3 Seconds)
            if (now - lastMessageTime < 3000 && lowerUser !== ADMIN_NAME) {
                const timeLeft = Math.ceil((3000 - (now - lastMessageTime)) / 1000);
                alert(`Anti-Spam active! Wait ${timeLeft} more seconds.`);
                return;
            }

            const input = document.getElementById('message-input');
            const messageText = input.value.trim();
            if (!messageText) return;

            const response = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
                method: 'POST',
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, content: messageText })
            });

            if (response.ok) {
                input.value = "";
                lastMessageTime = Date.now();
                fetchMessages();
            }
        };
    }

    // --- ADMIN SYSTEM COMMANDS ---
    window.adminExecute = async (type) => {
        let targets = [];
        const banCat = document.getElementById('ban-category').value;
        let singleVal, bulkVal, reasonVal;

        if (type === 'warn') {
            singleVal = document.getElementById('warn-search').value;
            bulkVal = document.getElementById('bulk-warn').value;
            reasonVal = document.getElementById('warn-reason').value;
        } else {
            singleVal = document.getElementById('ban-search').value;
            bulkVal = document.getElementById('bulk-ban').value;
            reasonVal = document.getElementById('ban-reason').value;
        }

        if (singleVal) {
            targets = [singleVal];
        } else if (bulkVal) {
            targets = bulkVal.split(',').map(n => n.trim()).filter(n => n !== "");
        }

        if (targets.length === 0) return alert("Please select or type a user first.");

        for (const t of targets) {
            const updatePayload = { 
                username: t, 
                last_action_reason: reasonVal || "No reason provided.", 
                last_action_type: type, 
                last_action_category: banCat 
            };

            if (type === 'ban') {
                updatePayload.is_banned = true;
                updatePayload.ban_until = '3000-01-01T00:00:00Z';
            } else if (type === 'unban') {
                updatePayload.is_banned = false;
                updatePayload.warned = false;
                updatePayload.last_action_type = "unban";
            } else if (type === 'warn') {
                updatePayload.warned = true;
            }

            await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
                method: 'POST',
                headers: { 
                    'apikey': SUPABASE_KEY, 
                    'Authorization': `Bearer ${SUPABASE_KEY}`, 
                    'Content-Type': 'application/json', 
                    'Prefer': 'resolution=merge-duplicates' 
                },
                body: JSON.stringify(updatePayload)
            });
        }
        alert(`Admin Success: ${type.toUpperCase()} applied to ${targets.length} user(s).`);
    };

    window.deleteMsg = async (id) => {
        if (!confirm("Are you sure you want to delete this message?")) return;
        await fetch(`${SUPABASE_URL}/rest/v1/messages?id=eq.${id}`, {
            method: 'PATCH',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: "Message Was Deleted By Owner" })
        });
        fetchMessages();
    };

    // --- INITIALIZATION ---
    async function checkUserPermissions() {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/user_roles?username=eq.${user}&select=*`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const data = await res.json();
        if (data && data[0]) {
            const status = data[0];
            if (status.is_banned || status.warned) {
                const noticeBox = document.getElementById('ban-notice');
                const noticeText = document.getElementById('notice-text');
                if (noticeBox && noticeText) {
                    noticeBox.style.display = 'block';
                    noticeText.innerText = `${status.last_action_type.toUpperCase()}: ${status.last_action_reason}`;
                }
                // If banned from chat, lock input
                if (status.is_banned && (status.last_action_category === 'Chat' || status.last_action_category === 'Both')) {
                    const inp = document.getElementById('message-input');
                    if (inp) {
                        inp.disabled = true;
                        inp.placeholder = "YOUR CHAT ACCESS HAS BEEN REVOKED.";
                    }
                }
            }
        }
    }

    // Background loops
    setInterval(fetchMessages, 3000);
    fetchMessages();
    checkUserPermissions();

    // Setup input listeners for the search bars
    const warnSearchInput = document.getElementById('warn-search');
    const banSearchInput = document.getElementById('ban-search');
    if (warnSearchInput) warnSearchInput.addEventListener('input', (e) => handleAdminSearch(e.target.value, 'warn-search'));
    if (banSearchInput) banSearchInput.addEventListener('input', (e) => handleAdminSearch(e.target.value, 'ban-search'));
});

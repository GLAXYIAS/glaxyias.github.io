const SUPABASE_URL = 'https://ukwjojxutcjkvabnybtj.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrd2pvanh1dGNqa3ZhYm55YnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNzk5NDAsImV4cCI6MjA5Mzg1NTk0MH0.iLr9OrIZlRBrbcI1XDE0zl7t_wpwVg3ko3DgppxbUh8'; 

const ADMIN_NAME = "glaeesas"; // Must be lowercase for comparison

document.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('chatUser');
    if (!user) { window.location.href = "../Login/login.html"; return; }

    const lowerUser = user.toLowerCase();

    // Tab Cloak
    document.title = "Grades";
    Object.defineProperty(document, 'title', { value: 'Grades', writable: false });

    // Admin Panel Visibility (Case Insensitive)
    const adminSection = document.getElementById('admin-section');
    if (lowerUser === ADMIN_NAME && adminSection) {
        adminSection.style.display = 'block';
    }

    const nameDisplay = document.getElementById('username-display');
    if (nameDisplay) nameDisplay.textContent = user;

    const messageContainer = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');

    let lastMessageTime = 0;
    let isLockedOut = false;

    // --- FETCH MESSAGES ---
    async function fetchMessages() {
        try {
            const [msgRes, roleRes] = await Promise.all([
                fetch(`${SUPABASE_URL}/rest/v1/messages?select=*&order=created_at.asc`, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }}),
                fetch(`${SUPABASE_URL}/rest/v1/user_roles?select=*`, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }})
            ]);
            const messages = await msgRes.json();
            const roles = await roleRes.json();

            if (messageContainer && Array.isArray(messages)) {
                messageContainer.innerHTML = '<div class="message system">Welcome to the encrypted comms.</div>';
                
                messages.forEach(msg => {
                    const msgDiv = document.createElement('div');
                    const isMe = msg.username === user;
                    const isDeleted = msg.content === "Message Was Deleted By Owner";
                    
                    const userRole = roles.find(r => r.username === msg.username);
                    let tagHtml = "";
                    if (msg.username.toLowerCase() === ADMIN_NAME) {
                        tagHtml = `<span style="background:gold; color:black; padding:1px 5px; border-radius:3px; font-size:10px; font-weight:bold; margin-right:5px;">OWNER</span>`;
                    } else if (userRole && userRole.role_tag) {
                        tagHtml = `<span style="background:#444; color:white; padding:1px 5px; border-radius:3px; font-size:10px; font-weight:bold; margin-right:5px;">${userRole.role_tag.toUpperCase()}</span>`;
                    }

                    // Delete Menu (Only for Owner and only on non-deleted messages)
                    const adminMenu = (lowerUser === ADMIN_NAME && !isDeleted) 
                        ? `<button class="delete-btn" onclick="deleteMessage('${msg.id}')">⋮</button>` 
                        : "";

                    msgDiv.className = `message ${isMe ? 'my-message' : 'other-message'}`;
                    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    msgDiv.innerHTML = `
                        <div class="msg-info">
                            <div style="display:flex; align-items:center;">
                                <strong>${tagHtml}${msg.username}</strong>
                                ${adminMenu}
                            </div>
                            <span>${time}</span>
                        </div>
                        <div class="msg-text ${isDeleted ? 'message-deleted' : ''}">${msg.content}</div>
                    `;
                    messageContainer.appendChild(msgDiv);
                });
                messageContainer.scrollTop = messageContainer.scrollHeight;
            }
        } catch (e) { console.error(e); }
    }

    // --- SEND MESSAGE ---
    async function sendMessage(text) {
        const roleCheck = await fetch(`${SUPABASE_URL}/rest/v1/user_roles?username=eq.${user}&select=*`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const roleData = await roleCheck.json();
        if (roleData[0] && roleData[0].is_banned) {
            const expiry = new Date(roleData[0].ban_until);
            if (new Date() < expiry) return alert(`Banned until ${expiry.toLocaleString()}`);
        }

        const now = Date.now();
        if (isLockedOut) return;
        if (now - lastMessageTime < 1500) {
            isLockedOut = true;
            messageInput.disabled = true;
            messageInput.placeholder = "Spam Detected! 15s Lockout...";
            setTimeout(() => { isLockedOut = false; messageInput.disabled = false; messageInput.placeholder = "Type a message..."; }, 15000);
            return;
        }
        lastMessageTime = now;

        await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, content: text })
        });
        fetchMessages();
    }

    // --- DELETE LOGIC (NO KEY) ---
    window.deleteMessage = async (messageId) => {
        await fetch(`${SUPABASE_URL}/rest/v1/messages?id=eq.${messageId}`, {
            method: 'PATCH',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: "Message Was Deleted By Owner" })
        });
        fetchMessages();
    };

    // --- ADMIN ACTIONS (NO KEY) ---
    window.adminAction = async (type) => {
        const target = document.getElementById('admin-target-user').value.trim();
        if (!target) return alert("Enter a username.");

        if (type === 'tag') {
            const tag = prompt("Tag name:");
            if (tag) await saveRole(target, { role_tag: tag });
        } else if (type === 'ban') {
            const mins = prompt("Minutes (0=perma):");
            const date = mins > 0 ? new Date(Date.now() + mins * 60000).toISOString() : '3000-01-01T00:00:00Z';
            await saveRole(target, { is_banned: true, ban_until: date });
            alert(`Banned ${target}`);
        } else if (type === 'warn') {
            alert(`Warned ${target}.`);
        }
    };

    async function saveRole(targetUser, data) {
        await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
            body: JSON.stringify({ username: targetUser, ...data })
        });
    }

    chatForm.onsubmit = (e) => { e.preventDefault(); const t = messageInput.value.trim(); if(t){sendMessage(t); messageInput.value="";} };
    setInterval(fetchMessages, 2500);
    fetchMessages();
});

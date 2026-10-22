/* ============================================================================
   chat-actions.js — message actions, @mentions and admin tools for Null-X chat
   ----------------------------------------------------------------------------
   Adds, without touching the rest of the chat engine:
     • per-message menu (⋯ button or right-click):
         own message   → Edit, Recall (tombstone), Delete, Copy
         someone else  → Reply, Mention, Copy
         admins        → Delete any message, Warn user, Ban user
     • reply bar + quoted "replying to @user" header inside messages
     • @name autocomplete that filters users while you type (↑ ↓ Tab Enter Esc)
     • admin-only bar above the chat input with a bad-word-filter bypass
       (uses badword.js' own override key, so the filter really is off)
   The messages API calls carry the id both in the query string and the body,
   because the worker has answered to both shapes elsewhere (user-roles).
   ========================================================================== */
(function () {
    'use strict';

    var API = 'https://apithingy.jlsniperelite4.workers.dev';
    var JSON_HEADERS = { 'Content-Type': 'application/json' };

    var TOMBSTONE = 'Message Was Deleted By Owner';
    var BYPASS_KEY = 'FORGE-MASTER-2026';      // badword.js' documented override key
    var BYPASS_PREF = 'nx_admin_badword_bypass';
    var IMG_MARKER = '[[IMG]]';
    var BUBBLE_RE = /[ \t]*\[\[BUBBLE:([a-z-]+)\]\][ \t]*/g;
    var REPLY_RE = /^\[\[REPLY:([^|\]]+)\|([^\]]*)\]\]\s*/;
    var MENTION_RE = /(^|[\s(])@([A-Za-z0-9_.\-]{2,32})\b/g;

    var usersCache = [];
    var usersCacheAt = 0;
    var usersLoading = null;

    var menuEl = null;
    var popEl = null;
    var barsEl = null;
    var replyBar = null;
    var editBar = null;
    var adminBar = null;
    var bypassBox = null;
    var toastEl = null;

    var editing = null;      // { id, style, prefix, before }
    var replyTarget = null;  // { user, id }
    var mention = { open: false, items: [], index: 0, start: 0, end: 0 };

    /* ---------------------------------------------------------------- utils */

    function $(sel, root) { return (root || document).querySelector(sel); }
    function byId(id) { return document.getElementById(id); }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function escapeAttr(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function safeDecode(value) {
        try { return decodeURIComponent(value); } catch (e) { return value; }
    }

    function myName() {
        var live = window.nxChatCtx && window.nxChatCtx.user;
        if (live) return String(live).trim();
        return String(localStorage.getItem('chatUser') || '').trim();
    }
    function amAdmin() {
        if (window.nxChatCtx) return !!window.nxChatCtx.isAdmin;
        return window.nxChatIsAdmin === true;
    }
    function chatInput() { return byId('message-input'); }
    function chatForm() { return byId('chat-form'); }
    function refreshChat() {
        if (window.nxChatCtx && window.nxChatCtx.forceRefresh) return window.nxChatCtx.forceRefresh();
        if (window.refreshChatMessages) return window.refreshChatMessages();
    }

    /** Styling a message was sent with (kept when editing). */
    function styleOf(raw) {
        var found = String(raw || '').match(/\[\[BUBBLE:([a-z-]+)\]\]/g);
        if (!found || !found.length) return 'default';
        var last = found[found.length - 1];
        return last.slice(last.indexOf(':') + 1, -2).toLowerCase();
    }
    /** Human text of a message: no bubble marker, no reply marker. */
    function plainText(raw, opts) {
        var text = String(raw == null ? '' : raw).replace(BUBBLE_RE, ' ');
        var m = text.match(REPLY_RE);
        var prefix = '';
        if (m) {
            prefix = m[0];
            text = text.slice(m[0].length);
        }
        text = text.replace(/\s+/g, ' ').trim();
        if (opts && opts.keepReply) return { text: text, prefix: prefix };
        return text;
    }

    /* ------------------------------------------------------------- rendering */

    /**
     * Renders a message body: escapes text, turns @mentions into chips and a
     * leading [[REPLY:user|id]] marker into a quoted reply header.
     */
    window.nxRenderMessageBody = function (content) {
        var text = String(content == null ? '' : content);
        var quote = '';
        var m = text.match(REPLY_RE);
        if (m) {
            var target = safeDecode(m[1]);
            quote = '<span class="nx-quote" data-nx-jump="' + escapeAttr(m[2]) + '" ' +
                'title="Jump to the quoted message"> replying to <b>@' + escapeHtml(target) + '</b></span>';
            text = text.slice(m[0].length);
        }
        var html = escapeHtml(text).replace(MENTION_RE, function (all, lead, name) {
            return lead + '<span class="nx-mention" data-nx-user="' + escapeAttr(name) + '">@' + name + '</span>';
        });
        return quote ? quote + '<br>' + html : html;
    };

    /* ---------------------------------------------------------------- styles */

    function injectStyles() {
        if (byId('nx-chat-actions-css')) return;
        var style = document.createElement('style');
        style.id = 'nx-chat-actions-css';
        style.textContent = [
            '.nx-msg-more{background:none;border:none;color:var(--text-muted);font-size:15px;line-height:1;',
            'padding:0 4px;cursor:pointer;opacity:0;transition:opacity .15s ease,color .15s ease;align-self:center;}',
            '.message-wrapper:hover .nx-msg-more,.nx-msg-more:focus-visible{opacity:1;}',
            '.nx-msg-more:hover{color:var(--accent);}',
            '@media (hover:none){.nx-msg-more{opacity:.55;}}',

            '.nx-menu{position:fixed;z-index:9000;min-width:190px;background:var(--bg-panel);',
            'border:1px solid var(--border-soft);border-radius:10px;padding:5px;',
            'box-shadow:0 12px 34px rgba(0,0,0,.55);font-size:13px;}',
            '.nx-menu.hidden{display:none;}',
            '.nx-menu-item{display:flex;align-items:center;gap:9px;width:100%;background:none;border:none;',
            'color:#e9e1dc;text-align:left;padding:8px 10px;border-radius:7px;cursor:pointer;font-size:13px;}',
            '.nx-menu-item:hover{background:var(--accent-soft);color:#fff;}',
            '.nx-menu-item.nx-danger{color:#ff7b72;}',
            '.nx-menu-item.nx-danger:hover{background:rgba(255,68,68,.14);color:#ff9d96;}',
            '.nx-menu-item .nx-ico{width:16px;text-align:center;flex:0 0 16px;opacity:.9;}',
            '.nx-menu-sep{height:1px;background:var(--border-soft);margin:4px 6px;}',
            '.nx-menu-head{font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:var(--text-muted);',
            'padding:5px 10px 3px;}',

            '#nx-chat-bars{display:flex;flex-direction:column;}',
            '.nx-bar{display:flex;align-items:center;gap:10px;padding:8px 16px;font-size:12px;',
            'background:var(--bg-panel);border-top:1px solid var(--border-soft);color:var(--text-muted);}',
            '.nx-bar.hidden{display:none;}',
            '.nx-bar b{color:var(--accent);}',
            '.nx-bar button{background:none;border:1px solid var(--border-soft);color:var(--text-muted);',
            'border-radius:6px;padding:4px 9px;font-size:11px;cursor:pointer;}',
            '.nx-bar button:hover{color:#fff;border-color:var(--accent);}',
            '.nx-bar .nx-spacer{flex:1;}',
            '.nx-bar.nx-edit{color:#ffd479;border-top-color:rgba(255,212,121,.35);}',
            '.nx-bar.nx-edit b{color:#ffd479;}',

            '.nx-admin-bar{display:flex;align-items:center;gap:12px;padding:7px 16px;font-size:11px;',
            'background:rgba(255,68,68,.07);border-top:1px solid rgba(255,68,68,.28);color:var(--text-muted);}',
            '.nx-admin-bar.hidden{display:none;}',
            '.nx-admin-pill{background:#ff4444;color:#fff;font-weight:700;font-size:9px;letter-spacing:1px;',
            'padding:2px 7px;border-radius:4px;}',
            '.nx-admin-bar label{display:flex;align-items:center;gap:6px;cursor:pointer;color:#e9e1dc;}',
            '.nx-admin-bar input[type=checkbox]{accent-color:#ff4444;cursor:pointer;}',
            '.nx-admin-bar .nx-hint{opacity:.65;}',
            '.nx-admin-bar .nx-spacer{flex:1;}',

            '.nx-mention-pop{position:fixed;z-index:9100;width:260px;max-height:232px;overflow-y:auto;',
            'background:var(--bg-panel);border:1px solid var(--border-soft);border-radius:10px;padding:5px;',
            'box-shadow:0 12px 30px rgba(0,0,0,.6);font-size:13px;}',
            '.nx-mention-pop.hidden{display:none;}',
            '.nx-mention-item{display:flex;align-items:center;gap:9px;padding:6px 8px;border-radius:7px;cursor:pointer;}',
            '.nx-mention-item.active{background:var(--accent-soft);}',
            '.nx-mention-item img{width:22px;height:22px;border-radius:50%;object-fit:cover;background:#000;flex:0 0 22px;}',
            '.nx-mention-item .nx-name{flex:1;color:#eee;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
            '.nx-mention-item .nx-tag{font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:var(--accent);}',
            '.nx-mention-empty{padding:8px 10px;color:var(--text-muted);font-size:12px;}',

            '.nx-mention{color:var(--accent);font-weight:600;cursor:pointer;}',
            '.nx-mention:hover{text-decoration:underline;}',
            '.nx-quote{display:inline-block;font-size:11px;color:var(--text-muted);border-left:2px solid var(--accent);',
            'padding:1px 0 1px 7px;margin-bottom:2px;cursor:pointer;opacity:.95;}',
            '.nx-quote b{color:var(--accent);}',
            '.nx-quote:hover{opacity:1;text-decoration:underline;}',
            '.message-wrapper.nx-flash .message-text-bubble{outline:2px solid var(--accent);outline-offset:2px;}',

            '.nx-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:9500;',
            'background:#1b1310;border:1px solid var(--border-soft);color:#eee;font-size:12px;',
            'padding:9px 14px;border-radius:8px;box-shadow:0 10px 26px rgba(0,0,0,.5);opacity:0;',
            'pointer-events:none;transition:opacity .18s ease;}',
            '.nx-toast.show{opacity:1;}'
        ].join('');
        document.head.appendChild(style);
    }

    function toast(message) {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.className = 'nx-toast';
            toastEl.setAttribute('role', 'status');
            document.body.appendChild(toastEl);
        }
        toastEl.textContent = message;
        toastEl.classList.add('show');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
    }

    /* ---------------------------------------------------------------- api ops */

    function patchMessage(id, content) {
        return fetch(API + '/messages?id=' + encodeURIComponent(id), {
            method: 'PATCH',
            headers: JSON_HEADERS,
            body: JSON.stringify({ id: id, content: content })
        });
    }
    function removeMessage(id) {
        return fetch(API + '/messages?id=' + encodeURIComponent(id), {
            method: 'DELETE',
            headers: JSON_HEADERS,
            body: JSON.stringify({ id: id })
        });
    }

    /* -------------------------------------------------------------- msg menu */

    function ensureMenu() {
        if (menuEl) return menuEl;
        menuEl = document.createElement('div');
        menuEl.id = 'nx-msg-menu';
        menuEl.className = 'nx-menu hidden';
        menuEl.setAttribute('role', 'menu');
        document.body.appendChild(menuEl);

        menuEl.addEventListener('click', function (e) {
            var btn = e.target.closest('.nx-menu-item');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            var fn = btn.__nxRun;
            hideMenu();
            if (typeof fn === 'function') fn();
        });
        return menuEl;
    }

    function hideMenu() {
        if (menuEl) menuEl.classList.add('hidden');
    }

    function menuItem(icon, label, danger, run) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nx-menu-item' + (danger ? ' nx-danger' : '');
        btn.setAttribute('role', 'menuitem');
        var ico = document.createElement('span');
        ico.className = 'nx-ico';
        ico.textContent = icon;
        var text = document.createElement('span');
        text.textContent = label;
        btn.appendChild(ico);
        btn.appendChild(text);
        btn.__nxRun = run;
        return btn;
    }

    function menuHead(text) {
        var el = document.createElement('div');
        el.className = 'nx-menu-head';
        el.textContent = text;
        return el;
    }

    function menuSep() {
        var el = document.createElement('div');
        el.className = 'nx-menu-sep';
        return el;
    }

    /**
     * Builds and shows the actions menu for a message wrapper
     * (`.message-wrapper` with data-msg-id / data-msg-user / data-msg-raw).
     */
    function openMenu(wrapper, x, y) {
        if (!wrapper || !wrapper.dataset.msgId) return;
        var menu = ensureMenu();
        var id = wrapper.dataset.msgId;
        var user = wrapper.dataset.msgUser || '';
        var raw = wrapper.dataset.msgRaw || '';
        var mine = !!myName() && user === myName();
        var admin = amAdmin();

        menu.innerHTML = '';
        menu.appendChild(menuHead('@' + user));

        var actions = [];

        if (mine) {
            actions.push(menuItem('', 'Edit message', false, function () { startEdit(wrapper); }));
            actions.push(menuItem('', 'Recall message', false, function () { recallMessage(id, raw); }));
            actions.push(menuItem('', 'Delete for everyone', true, function () {
                window.nxDeleteMessage(id, { isAdminAction: false });
            }));
        } else {
            actions.push(menuItem('', 'Reply', false, function () { startReply(user, id); }));
            actions.push(menuItem('@', 'Mention in my message', false, function () { insertMention(user); }));
        }

        actions.push(menuItem('', 'Copy text', false, function () { copyText(raw); }));

        if (admin && !mine) {
            actions.push(menuSep());
            actions.push(menuHead('Admin'));
            actions.push(menuItem('', 'Delete this message', true, function () {
                window.nxDeleteMessage(id, { isAdminAction: true });
            }));
            actions.push(menuItem('', 'Warn @' + user, false, function () {
                if (window.quickAdminAction) window.quickAdminAction('warn', user);
            }));
            actions.push(menuItem('', 'Ban @' + user, true, function () {
                if (window.quickAdminAction) window.quickAdminAction('ban', user);
            }));
        }

        actions.forEach(function (el) { menu.appendChild(el); });
        menu.classList.remove('hidden');

        // Measure after the items exist, then keep the menu on screen.
        var rect = menu.getBoundingClientRect();
        var px = (x == null ? window.innerWidth / 2 : x);
        var py = (y == null ? window.innerHeight / 2 : y);
        if (px + rect.width > window.innerWidth - 8) px = window.innerWidth - rect.width - 8;
        if (py + rect.height > window.innerHeight - 8) py = window.innerHeight - rect.height - 8;
        if (px < 8) px = 8;
        if (py < 8) py = 8;
        menu.style.left = px + 'px';
        menu.style.top = py + 'px';
        menu.style.minWidth = '190px';
    }

    window.nxMessageMenu = function (event, el) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        var wrapper = el && el.closest ? el.closest('.message-wrapper') : null;
        var x = event && event.clientX ? event.clientX : null;
        var y = event && event.clientY ? event.clientY : null;
        if ((!x || !y) && el && el.getBoundingClientRect) {
            var r = el.getBoundingClientRect();
            x = r.left;
            y = r.bottom + 6;
        }
        openMenu(wrapper, x, y);
    };

    // Right-click anywhere on a message opens the same menu (chat.js used to
    // point this at a menu element that never existed in chat.html).
    window.openMessageMenu = function (event, messageId) {
        var el = event && event.target ? event.target.closest('.message-wrapper') : null;
        if (el) { window.nxMessageMenu(event, el); return; }
        if (messageId) {
            var found = document.querySelector('.message-wrapper[data-msg-id="' + String(messageId).replace(/"/g, '') + '"]');
            if (found) window.nxMessageMenu(event, found);
        }
    };

    document.addEventListener('contextmenu', function (e) {
        var wrapper = e.target.closest && e.target.closest('.message-wrapper');
        if (!wrapper) return;
        e.preventDefault();
        openMenu(wrapper, e.clientX, e.clientY);
    });

    document.addEventListener('click', function (e) {
        if (menuEl && !menuEl.classList.contains('hidden') && !e.target.closest('#nx-msg-menu')) hideMenu();
        if (popEl && mention.open && !e.target.closest('#nx-mention-pop')) closeMentions();
    });

    function copyText(raw) {
        if (String(raw || '').indexOf(IMG_MARKER) === 0) return toast('That message is an image');
        var text = plainText(raw);
        var done = function () { toast('Message copied'); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () { toast('Could not copy'); });
        } else {
            var ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); done(); } catch (e) { toast('Could not copy'); }
            ta.remove();
        }
    }

    /* ---------------------------------------------------------- delete/recall */

    /**
     * Permanently removes a message. Admins may delete anyone's; everyone else
     * only their own (the menu hides the action, the check is repeated here).
     */
    window.nxDeleteMessage = async function (id, options) {
        var opts = options || {};
        var wrapper = document.querySelector('.message-wrapper[data-msg-id="' + String(id).replace(/"/g, '') + '"]');
        var owner = wrapper ? wrapper.dataset.msgUser : '';
        var admin = amAdmin();

        if (!admin && owner && owner !== myName()) {
            return toast('You can only delete your own messages');
        }
        var label = admin && owner && owner !== myName() ? 'Delete @' + owner + "'s message for everyone?" : 'Delete this message for everyone?';
        if (!confirm(label + '\n\nThis cannot be undone.')) return false;

        try {
            var res = await removeMessage(id);
            if (!res.ok) {
                var detail = '';
                try { detail = (await res.text()).slice(0, 120); } catch (e) {}
                toast('Could not delete (HTTP ' + res.status + ')' + (detail ? ': ' + detail : ''));
                return false;
            }
            toast('Message deleted');
            refreshChat();
            return true;
        } catch (err) {
            console.error('Delete failed:', err);
            toast('Network error — message not deleted');
            return false;
        }
    };

    function recallMessage(id, raw) {
        if (!confirm('Recall this message?\n\nEveryone will see “Message removed by owner” instead of the text.')) return;
        var content = TOMBSTONE;
        patchMessage(id, content).then(function (res) {
            if (!res.ok) {
                toast('Could not recall (HTTP ' + res.status + ')');
                return;
            }
            toast('Message recalled');
            refreshChat();
        }).catch(function (err) {
            console.error('Recall failed:', err);
            toast('Network error — message not recalled');
        });
    }

    /* ------------------------------------------------------------ edit flow */

    function startEdit(wrapper) {
        var raw = wrapper.dataset.msgRaw || '';
        if (raw.indexOf(IMG_MARKER) === 0) return toast('Image messages cannot be edited');
        if (String(raw).indexOf(TOMBSTONE) === 0) return toast('This message was already recalled');

        var input = chatInput();
        if (!input) return;
        var parsed = plainText(raw, { keepReply: true });

        editing = {
            id: wrapper.dataset.msgId,
            style: styleOf(raw),
            prefix: parsed.prefix || '',
            before: input.value
        };

        if (replyTarget) cancelReply();
        input.value = parsed.text;
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        showEditBar(true);
        return true;
    }

    function stopEdit(restore) {
        var input = chatInput();
        if (editing && restore !== false && input) {
            input.value = editing.before || '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        editing = null;
        showEditBar(false);
    }

    function submitEdit() {
        var input = chatInput();
        if (!input || !editing) return;
        var text = input.value.trim();
        if (!text) {
            toast('Add some text, or use Delete instead');
            return;
        }
        var id = editing.id;
        var content = (editing.prefix || '') + text + (editing.style !== 'default' ? ' [[BUBBLE:' + editing.style + ']]' : '');

        patchMessage(id, content).then(function (res) {
            if (!res.ok) {
                toast('Could not save edit (HTTP ' + res.status + ')');
                return;
            }
            stopEdit(false);
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            stopReplyBarOnly();
            toast('Message updated');
            refreshChat();
        }).catch(function (err) {
            console.error('Edit failed:', err);
            toast('Network error — edit not saved');
        });
    }

    /* ------------------------------------------------------ reply bar & quote */

    function startReply(user, id) {
        if (editing) stopEdit();
        replyTarget = { user: user, id: id };
        ensureReplyBar();
        replyBar.querySelector('.nx-reply-name').textContent = '@' + user;
        replyBar.classList.remove('hidden');
        var input = chatInput();
        if (input) input.focus();
    }

    function cancelReply() {
        replyTarget = null;
        stopReplyBarOnly();
    }

    function stopReplyBarOnly() {
        replyTarget = null;
        if (replyBar) replyBar.classList.add('hidden');
    }

    function replyMarker() {
        if (!replyTarget) return '';
        // A single-line <input> silently drops \n, so the marker ends with a space.
        return '[[REPLY:' + encodeURIComponent(replyTarget.user) + '|' + String(replyTarget.id || '').replace(/\]/g, '') + ']] ';
    }

    /* ------------------------------------------------------------ mention UI */

    function insertMention(name) {
        var input = chatInput();
        if (!input) return;
        var token = '@' + name + ' ';
        var value = input.value;
        if (value.indexOf('@' + name) !== -1) {
            input.focus();
            toast('Already mentioned');
            return;
        }
        var needsSpace = value && !/\s$/.test(value);
        input.value = value + (needsSpace ? ' ' : '') + token;
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function loadUsers() {
        if (usersLoading) return usersLoading;
        usersLoading = Promise.all([
            fetch(API + '/users', { headers: JSON_HEADERS }).then(function (r) { return r.json(); }).catch(function () { return null; }),
            fetch(API + '/user-roles', { headers: JSON_HEADERS }).then(function (r) { return r.json(); }).catch(function () { return null; })
        ]).then(function (out) {
            var list = unwrap(out[0], 'users');
            var roles = unwrap(out[1], 'roles');
            var byName = {};
            roles.forEach(function (r) { if (r && r.username) byName[r.username] = r; });
            var seen = {};
            var merged = [];
            list.concat(roles.map(function (r) { return { username: r && r.username }; })).forEach(function (entry) {
                var name = entry && entry.username;
                if (!name) return;
                var key = String(name).toLowerCase();
                if (seen[key]) return;
                seen[key] = true;
                var role = byName[name] || {};
                merged.push({
                    username: name,
                    pfp_url: entry.pfp_url || role.pfp_url || '',
                    role_tag: role.role_tag || ''
                });
            });
            merged.sort(function (a, b) { return a.username.localeCompare(b.username); });
            usersCache = merged;
            usersCacheAt = Date.now();
            usersLoading = null;
            return merged;
        }).catch(function () { usersLoading = null; return usersCache; });
        return usersLoading;
    }

    function unwrap(data, key) {
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data[key])) return data[key];
        if (data && Array.isArray(data.messages)) return data.messages;
        if (data && data[key] && typeof data[key] === 'object') return [data[key]];
        if (data && data.username) return [data];
        return [];
    }

    function ensureMentionPopup() {
        if (popEl) return popEl;
        popEl = document.createElement('div');
        popEl.id = 'nx-mention-pop';
        popEl.className = 'nx-mention-pop hidden';
        popEl.setAttribute('role', 'listbox');
        document.body.appendChild(popEl);
        return popEl;
    }

    function closeMentions() {
        mention.open = false;
        mention.items = [];
        if (popEl) popEl.classList.add('hidden');
    }

    function mentionQuery() {
        var input = chatInput();
        if (!input || document.activeElement !== input) return null;
        var caret = input.selectionStart == null ? input.value.length : input.selectionStart;
        var before = input.value.slice(0, caret);
        var match = before.match(/(^|[\s(])@([A-Za-z0-9_.\-]{0,32})$/);
        if (!match) return null;
        return { query: match[2], start: caret - match[2].length - 1, end: caret };
    }

    function renderMentions(state) {
        var pop = ensureMentionPopup();
        var q = state.query.toLowerCase();
        var list = usersCache.filter(function (u) {
            return u.username.toLowerCase().indexOf(q) !== -1;
        });
        list.sort(function (a, b) {
            var A = a.username.toLowerCase().indexOf(q) === 0 ? 0 : 1;
            var B = b.username.toLowerCase().indexOf(q) === 0 ? 0 : 1;
            return A - B || a.username.localeCompare(b.username);
        });
        list = list.slice(0, 7);

        mention.open = true;
        mention.items = list;
        mention.index = 0;
        mention.start = state.start;
        mention.end = state.end;

        pop.innerHTML = '';
        if (!list.length) {
            var empty = document.createElement('div');
            empty.className = 'nx-mention-empty';
            empty.textContent = usersCache.length ? 'No matching users' : 'Loading users…';
            pop.appendChild(empty);
        } else {
            list.forEach(function (u, i) {
                var row = document.createElement('div');
                row.className = 'nx-mention-item' + (i === 0 ? ' active' : '');
                row.setAttribute('role', 'option');
                row.dataset.nxIndex = String(i);
                var img = document.createElement('img');
                img.src = u.pfp_url || 'https://glaxyias.github.io/imgs/newpfp.png';
                img.alt = '';
                var name = document.createElement('span');
                name.className = 'nx-name';
                name.textContent = u.username;
                row.appendChild(img);
                row.appendChild(name);
                if (u.role_tag && u.role_tag.toLowerCase() !== 'user') {
                    var tag = document.createElement('span');
                    tag.className = 'nx-tag';
                    tag.textContent = u.role_tag;
                    row.appendChild(tag);
                }
                row.addEventListener('mousedown', function (ev) {
                    ev.preventDefault();
                    chooseMention(i);
                });
                pop.appendChild(row);
            });
        }

        var rect = chatInput().getBoundingClientRect();
        pop.classList.remove('hidden');
        pop.style.left = Math.max(8, rect.left) + 'px';
        pop.style.width = Math.max(220, Math.min(rect.width, 320)) + 'px';
        var popRect = pop.getBoundingClientRect();
        pop.style.top = Math.max(8, rect.top - popRect.height - 8) + 'px';
    }

    function chooseMention(index) {
        var user = mention.items[index];
        var input = chatInput();
        if (!user || !input) { closeMentions(); return; }
        var value = input.value;
        var next = value.slice(0, mention.start) + '@' + user.username + ' ' + value.slice(mention.end);
        input.value = next;
        var caret = mention.start + user.username.length + 2;
        input.focus();
        input.setSelectionRange(caret, caret);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        closeMentions();
    }

    function moveMention(delta) {
        if (!mention.items.length) return;
        var rows = popEl ? popEl.querySelectorAll('.nx-mention-item') : [];
        if (!rows.length) return;
        rows[mention.index].classList.remove('active');
        mention.index = (mention.index + delta + rows.length) % rows.length;
        rows[mention.index].classList.add('active');
        rows[mention.index].scrollIntoView({ block: 'nearest' });
    }

    /* ------------------------------------------------------------- bars / UI */

    function ensureBars() {
        if (barsEl) return;
        var form = chatForm();
        if (!form || !form.parentNode) return;

        barsEl = document.createElement('div');
        barsEl.id = 'nx-chat-bars';

        adminBar = document.createElement('div');
        adminBar.className = 'nx-admin-bar hidden';
        adminBar.innerHTML =
            '<span class="nx-admin-pill">ADMIN</span>' +
            '<label><input type="checkbox" id="nx-bypass-toggle"> Bypass bad-word filter</label>' +
            '<span class="nx-hint">You can post filtered words while this is on</span>' +
            '<span class="nx-spacer"></span>';
        bypassBox = adminBar.querySelector('#nx-bypass-toggle');
        bypassBox.addEventListener('change', function () {
            var want = bypassBox.checked;
            var state = toggleBypass(want);
            bypassBox.checked = state;
            try { localStorage.setItem(BYPASS_PREF, state ? '1' : '0'); } catch (e) {}
            toast(state ? 'Bad-word filter bypassed (admins only)' : 'Bad-word filter back on');
        });

        replyBar = document.createElement('div');
        replyBar.className = 'nx-bar hidden';
        replyBar.innerHTML =
            '<span>💬 Replying to <b class="nx-reply-name"></b></span>' +
            '<span class="nx-spacer"></span>' +
            '<button type="button" class="nx-reply-cancel">Cancel</button>';
        replyBar.querySelector('.nx-reply-cancel').addEventListener('click', cancelReply);

        editBar = document.createElement('div');
        editBar.className = 'nx-bar nx-edit hidden';
        editBar.innerHTML =
            '<span>✏️ Editing message — press <b>Send</b> to save</span>' +
            '<span class="nx-spacer"></span>' +
            '<button type="button" class="nx-edit-cancel">Cancel</button>';
        editBar.querySelector('.nx-edit-cancel').addEventListener('click', function () { stopEdit(true); });

        barsEl.appendChild(adminBar);
        barsEl.appendChild(editBar);
        barsEl.appendChild(replyBar);
        form.parentNode.insertBefore(barsEl, form);

        syncAdminBar();
    }

    function showEditBar(show) {
        ensureBars();
        if (editBar) editBar.classList.toggle('hidden', !show);
    }
    function ensureReplyBar() {
        ensureBars();
    }

    var bypassActive = false;

    function toggleBypass(want) {
        if (typeof window.__badwordOverride !== 'function') {
            toast('Bad-word filter script not loaded');
            return false;
        }
        // The library toggles its state and returns the new one, so read it back.
        if (bypassActive === want) return bypassActive;
        var result = window.__badwordOverride(BYPASS_KEY);
        var now = String(result).toUpperCase().indexOf('FILTER DISABLED') !== -1;
        if (now !== want) {
            // State disagreed with what we asked for — flip once more to match.
            window.__badwordOverride(BYPASS_KEY);
            now = !now;
        }
        bypassActive = now;
        return now;
    }

    function syncAdminBar() {
        ensureBars();
        if (!adminBar) return;
        var admin = amAdmin();
        adminBar.classList.toggle('hidden', !admin);
        if (!admin) {
            // Never leave the filter off for a non-staff visitor (e.g. an admin
            // signed out on a shared browser).
            if (bypassActive) {
                bypassActive = false;
                if (typeof window.__badwordOverride === 'function') window.__badwordOverride(BYPASS_KEY);
                try { localStorage.setItem(BYPASS_PREF, '0'); } catch (e) {}
            }
            return;
        }
        if (!bypassBox) return;

        if (!bypassBox.dataset.nxTouched) {
            var pref = '0';
            try { pref = localStorage.getItem(BYPASS_PREF) || '0'; } catch (e) {}
            if (pref === '1') {
                // badword.js may not have finished loading yet — retry next tick.
                if (typeof window.__badwordOverride !== 'function') return;
                bypassBox.checked = toggleBypass(true);
            } else {
                bypassBox.checked = bypassActive;
            }
            bypassBox.dataset.nxTouched = '1';
        }
    }

    window.addEventListener('nx:whoami', syncAdminBar);
    setInterval(syncAdminBar, 1200);

    /* -------------------------------------------------------------- wiring up */

    function submitInterceptor(e) {
        if (!e.target || e.target.id !== 'chat-form') return;
        if (e.defaultPrevented) return; // blocked by the profanity filter already

        if (editing) {
            e.preventDefault();
            e.stopPropagation();
            submitEdit();
            return;
        }
        if (replyTarget) {
            var input = chatInput();
            if (input) {
                var text = input.value.trim();
                if (text) {
                    // chat.js reads input.value right after this; the marker rides
                    // along with the text and gets rendered as the quote header.
                    input.value = replyMarker() + text;
                }
            }
            stopReplyBarOnly();
        }
    }

    function bindMentions() {
        var input = chatInput();
        if (!input || input.dataset.nxMentions) return;
        input.dataset.nxMentions = '1';

        input.addEventListener('input', function () {
            var state = mentionQuery();
            if (!state) { closeMentions(); return; }
            if (!usersCache.length || Date.now() - usersCacheAt > 120000) {
                loadUsers().then(function () {
                    var fresh = mentionQuery();
                    if (fresh) renderMentions(fresh);
                });
            }
            renderMentions(state);
        });

        input.addEventListener('keydown', function (e) {
            if (!mention.open) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); moveMention(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); moveMention(-1); }
            else if (e.key === 'Enter' || e.key === 'Tab') {
                if (mention.items.length) {
                    e.preventDefault();
                    e.stopPropagation();
                    chooseMention(mention.index);
                } else {
                    closeMentions();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeMentions();
            }
        });

        input.addEventListener('blur', function () {
            // mousedown on a row runs first, so a click still selects.
            setTimeout(closeMentions, 120);
        });
    }

    function bindGlobals() {
        document.addEventListener('submit', submitInterceptor, true);

        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            if (editing) { stopEdit(true); return; }
            if (replyTarget) { cancelReply(); return; }
            hideMenu();
        });

        // Quoted-message header → scroll to the original, if it is loaded.
        document.addEventListener('click', function (e) {
            var quote = e.target.closest && e.target.closest('.nx-quote');
            if (quote) {
                var id = quote.dataset.nxJump;
                var target = id ? document.querySelector('.message-wrapper[data-msg-id="' + id.replace(/"/g, '') + '"]') : null;
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    target.classList.add('nx-flash');
                    setTimeout(function () { target.classList.remove('nx-flash'); }, 1400);
                } else {
                    toast('That message is not in the current view');
                }
                return;
            }
            var mentionChip = e.target.closest && e.target.closest('.nx-mention');
            if (mentionChip && window.openUserMenu) {
                window.openUserMenu(e, mentionChip.dataset.nxUser);
            }
        });
    }

    var inited = false;
    function init() {
        if (inited) return;
        inited = true;
        injectStyles();
        ensureBars();
        bindMentions();
        bindGlobals();
        if (!usersCache.length) loadUsers();

        // chat.js starts rendering before this file exists, so the very first
        // batch would show raw [[REPLY:…]] markers. Once its engine is up, force
        // one re-render through nxRenderMessageBody.
        var tries = 0;
        (function waitForEngine() {
            if (window.nxChatCtx) { refreshChat(); return; }
            if (tries++ < 40) setTimeout(waitForEngine, 150);
        })();
    }

    // Available immediately so the ⋯ button works even before DOMContentLoaded.
    window.nxActions = {
        openMenu: openMenu,
        startEdit: startEdit,
        startReply: startReply,
        insertMention: insertMention,
        requestUsers: loadUsers,
        getUsers: function () { return usersCache.slice(); },
        bypassActive: function () { return bypassActive; }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

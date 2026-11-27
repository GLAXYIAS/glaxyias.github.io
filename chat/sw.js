/* Null X chat service worker — enables notifications when the tab is closed */
const VAPID_PUBLIC_KEY = 'BIwwvnF9JUMYs-q5qeCj8CHrXqtwBOjcC0WtvWtDMu_XniMQOlFIq-09hZmdnYCvQS7fnjC0dhC-em9UNrd3WWw';
const PUSH_API = 'https://apithingy.jlsniperelite4.workers.dev';

const DEFAULT_PREFS = {
  general: true,
  pms: true,
  mentions: true,
  announcements: true,
  moderation: true
};

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function readPushMeta(key, fallback) {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('nullchat-push', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
      };
      req.onsuccess = () => {
        const db = req.result;
        try {
          const tx = db.transaction('meta', 'readonly');
          const get = tx.objectStore('meta').get(key);
          get.onsuccess = () => {
            db.close();
            resolve(get.result === undefined ? fallback : get.result);
          };
          get.onerror = () => { db.close(); resolve(fallback); };
        } catch (e) { db.close(); resolve(fallback); }
      };
      req.onerror = () => resolve(fallback);
    } catch (e) { resolve(fallback); }
  });
}

function readPushUsername() {
  return readPushMeta('username', '');
}

function readPushPrefs() {
  return readPushMeta('prefs', DEFAULT_PREFS).then((value) => (
    Object.assign({}, DEFAULT_PREFS, value && typeof value === 'object' ? value : {})
  ));
}

function escapeRegExp(value) {
  return String(value == null ? '' : value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isMentioned(text, username) {
  const raw = String(username || '').trim();
  if (!raw) return false;
  const names = [raw, raw.replace(/\s+/g, '_')];
  return names.some((name) => {
    const clean = name.replace(/^@/, '').trim();
    if (!clean) return false;
    return new RegExp('(^|[^\\w])@' + escapeRegExp(clean) + '(?![\\w])', 'i').test(String(text || ''));
  });
}

function classifyPush(data, username) {
  const tag = String(data.tag || '');
  const title = String(data.title || '');
  const body = String(data.body || '');
  const declared = String(data.category || '').toLowerCase();

  if (/^closed-tab-test-|^nullchat-test|^test-/i.test(tag) || /test notification/i.test(body)) return 'test';

  const isAnnouncement = () => (
    /announcement|📢/i.test(title)
    || /^\s*\[ANNOUNCEMENT\]/i.test(body)
  );

  if (declared === 'general') {
    if (isAnnouncement()) return 'announcement';
    if (isMentioned(body, username)) return 'mention';
    return 'general';
  }
  if (declared === 'pm' || declared === 'mention' || declared === 'announcement' || declared === 'moderation') {
    return declared;
  }

  if (/^pm-|^private-/i.test(tag) || /(^|[^a-z])pm([^a-z]|$)|private message|pm from/i.test(title)) return 'pm';
  if (/^mention-/i.test(tag)) return 'mention';
  if (/^announcement-/i.test(tag) || isAnnouncement()) return 'announcement';
  if (/^moderation-|^mod-/i.test(tag) || /\bwarning\b|your account (was )?(banned|unbanned)|temporary ban/i.test(title)) return 'moderation';
  if (username && isMentioned(body, username)) return 'mention';
  return 'general';
}

function shouldShowPush(category, prefs) {
  if (category === 'test') return true;
  if (category === 'pm') return prefs.pms !== false;
  if (category === 'mention') return prefs.mentions !== false || prefs.general !== false;
  if (category === 'announcement') return prefs.announcements !== false;
  if (category === 'moderation') return prefs.moderation !== false;
  return prefs.general !== false;
}

async function hasVisibleChatClient() {
  try {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    return clientList.some((c) => (
      c.url.indexOf('/chat') !== -1
      && c.url.indexOf('push-test.html') === -1
      && c.visibilityState === 'visible'
    ));
  } catch (e) {
    return false;
  }
}

function showPushNotification(data, category) {
  const tag = data.tag || (category === 'pm' ? 'pm' : 'nullchat');
  const title = data.title || (category === 'mention' ? 'You were mentioned' : 'Null X Chat');
  const icon = data.icon || 'https://glaxyias.github.io/imgs/download.jpeg';
  return self.registration.showNotification(title, {
    body: data.body || '',
    icon,
    badge: data.badge || icon,
    tag,
    renotify: true,
    data: { url: data.url || './chat.html', tag, category }
  }).catch((e) => {
    console.warn('showNotification failed', e);
  });
}

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil((async () => {
    try {
      const sub = event.newSubscription || await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      const username = await readPushUsername();
      await fetch(PUSH_API + '/push-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, subscription: sub.toJSON(), created_at: new Date().toISOString() })
      });
    } catch (e) {
      // The page repairs the subscription the next time it is opened.
    }
  })());
});

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let data = { title: 'Null X Chat', body: 'New message', tag: 'nullchat', url: './chat.html' };
    try {
      if (event.data) {
        const parsed = event.data.json();
        if (parsed && typeof parsed === 'object') data = Object.assign(data, parsed);
        else if (typeof parsed === 'string') data.body = parsed;
      }
    } catch (e) {
      try {
        data.body = event.data ? event.data.text() : data.body;
      } catch (e2) {}
    }

    const [username, prefs] = await Promise.all([readPushUsername(), readPushPrefs()]);
    const category = classifyPush(data, username);
    if (!shouldShowPush(category, prefs)) return;
    // If this device already has the chat visible, the page itself handles
    // alerts. This also stops senders from being notified about their own
    // message. Test pushes deliberately bypass this check.
    if (category !== 'test' && await hasVisibleChatClient()) return;
    await showPushNotification(data, category);
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './chat.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const chatClient = clients.find((c) => c.url.indexOf('/chat') !== -1 && c.url.indexOf('push-test.html') === -1);
      if (chatClient && 'focus' in chatClient) {
        chatClient.postMessage({ type: 'notification-click', tag: event.notification.tag });
        return chatClient.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('message', (event) => {
  const msg = event.data || {};
  if (msg.type === 'show-notification') {
    event.waitUntil(
      self.registration.showNotification(msg.title || 'Null X Chat', {
        body: msg.body || '',
        icon: msg.icon || 'https://glaxyias.github.io/imgs/download.jpeg',
        badge: msg.badge || 'https://glaxyias.github.io/imgs/download.jpeg',
        tag: msg.tag || 'nullchat',
        renotify: true,
        data: { url: msg.url || './chat.html', tag: msg.tag || 'nullchat' }
      })
    );
  }
});

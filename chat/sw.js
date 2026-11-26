/* Null X chat service worker — enables notifications when the tab is closed */
const VAPID_PUBLIC_KEY = 'BIwwvnF9JUMYs-q5qeCj8CHrXqtwBOjcC0WtvWtDMu_XniMQOlFIq-09hZmdnYCvQS7fnjC0dhC-em9UNrd3WWw';
const PUSH_API = 'https://apithingy.jlsniperelite4.workers.dev';

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

function readPushUsername() {
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
          const get = tx.objectStore('meta').get('username');
          get.onsuccess = () => { db.close(); resolve(get.result || ''); };
          get.onerror = () => { db.close(); resolve(''); };
        } catch (e) { db.close(); resolve(''); }
      };
      req.onerror = () => resolve('');
    } catch (e) { resolve(''); }
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
  const tag = data.tag || 'nullchat';
  const shown = self.registration.showNotification(data.title || 'Null X Chat', {
    body: data.body || '',
    icon: data.icon || 'https://glaxyias.github.io/imgs/download.jpeg',
    badge: data.badge || 'https://glaxyias.github.io/imgs/download.jpeg',
    tag,
    renotify: true,
    data: { url: data.url || './chat.html', tag }
  });
  event.waitUntil(shown && shown.catch ? shown.catch((e) => {
    console.warn('showNotification failed', e);
  }) : shown);
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

/* Null X chat service worker — enables notifications when the tab is closed */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: 'Null X Chat', body: 'New message', tag: 'nullchat', url: './chat.html' };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = Object.assign(data, parsed);
    }
  } catch (e) {
    try {
      data.body = event.data ? event.data.text() : data.body;
    } catch (e2) {}
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Null X Chat', {
      body: data.body || '',
      icon: data.icon || 'https://null-x-team.github.io/imgs/download.jpeg',
      tag: data.tag || 'nullchat',
      renotify: true,
      data: { url: data.url || './chat.html' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './chat.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if (c.url.indexOf('/chat') !== -1 && 'focus' in c) {
          c.postMessage({ type: 'notification-click', tag: event.notification.tag });
          return c.focus();
        }
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
        icon: msg.icon || 'https://null-x-team.github.io/imgs/download.jpeg',
        tag: msg.tag || 'nullchat',
        renotify: true,
        data: { url: msg.url || './chat.html' }
      })
    );
  }
});

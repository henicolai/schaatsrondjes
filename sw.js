const CACHE = 'schaatsrondjes-v2';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('schaatsrondjes') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

// Knop "Ronde +1" in de melding (ook op de Galaxy Watch)
self.addEventListener('notificationclick', e => {
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (e.action === 'lap') {
      list.forEach(c => c.postMessage({ type: 'lap' }));
      return;
    }
    e.notification.close();
    if (list[0]) return list[0].focus();
    return self.clients.openWindow('./');
  })());
});

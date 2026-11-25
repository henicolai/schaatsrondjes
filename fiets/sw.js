const CACHE = 'fietsteller-v3';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('fietsteller') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (e.request.method !== 'GET') return;
  // kaarttegels, zoeken en routes altijd live ophalen
  if (/tile\.|nominatim|brouter/.test(url)) return;
  if (e.request.mode === 'navigate') {   // pagina: eerst online (nieuwste versie), offline uit cache
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

// Knoppen Pauze / Doorgaan / Stop in de melding (ook op de Galaxy Watch)
self.addEventListener('notificationclick', e => {
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const mine = list.filter(c => c.url.includes('/fiets/'));
    if (e.action) { mine.forEach(c => c.postMessage({ type: 'cmd', cmd: e.action })); return; }
    e.notification.close();
    if (mine[0]) return mine[0].focus();
    return self.clients.openWindow('./');
  })());
});

// 3nD Basketball service worker: network first for the page so updates win, cache as a fallback when offline.
// Bump CACHE_NAME whenever the shell changes.
const CACHE_NAME = 'b3-2026.11.05-1601';
const ASSETS = ['./', 'index.html', 'engine.js', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => null)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // talks, plans and matches always go straight to the server
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const isShell = req.mode === 'navigate' || /\/(index\.html|engine\.js|manifest\.json)$/.test(url.pathname) || url.pathname.includes('/icons/');
  if (!isShell) return;
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => null);
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }))
  );
});

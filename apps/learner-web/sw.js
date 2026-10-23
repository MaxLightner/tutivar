const CACHE = 'tutivar-demo-v1';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './icon.svg', './manifest.webmanifest', './data/manifest.json', './data/lessons/a1-1.json', './data/lessons/a1-2.json', './data/lessons/a1-3.json'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});

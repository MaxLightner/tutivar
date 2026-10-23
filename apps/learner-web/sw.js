const CACHE = 'tutivar-ui-v2-lesson-v2';
const ASSETS = ['./', './index.html', './styles.css', './ui-v2.css', './app.js', './lesson-modules.js', './icon.svg', './manifest.webmanifest', './data/manifest.json', './data/curriculum.a1.json', './data/lessons/a1-1.json', './data/lessons/a1-2.json', './data/lessons/a1-3.json'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  // Always attempt current lesson/curriculum content before the offline fallback.
  if (new URL(event.request.url).pathname.includes('/data/')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});

const CACHE = 'tutivar-ui-v4-network-first';
const ASSETS = ['./', './index.html', './styles.css', './ui-v2.css', './app.js', './lesson-modules.js', './sentence-composer.js', './word-review.js', './practice-engine.js', './icon.svg', './manifest.webmanifest', './data/manifest.json', './data/curriculum.a1.json', './data/lessons/a1-1.json', './data/lessons/a1-2.json', './data/lessons/a1-3.json'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  // Check the network first on every visit, including scripts and styles.
  // Offline fallback is still available for previously cached resources.
  const network = fetch(event.request);
  event.respondWith(network.catch(() => caches.match(event.request)));
  event.waitUntil(network.then((response) => {
    if (!response.ok) return;
    const copy = response.clone();
    return caches.open(CACHE).then((cache) => cache.put(event.request, copy));
  }).catch(() => {}));
});

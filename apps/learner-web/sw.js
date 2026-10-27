const CACHE = 'tutivar-ui-v7-kitchen-verbs';
const ASSETS = ['./', './index.html', './styles.css', './ui-v2.css', './app.js', './lesson-modules.js', './sentence-composer.js', './lesson-flow.js', './sentence-puzzle.js', './visual-learning.js', './progress-migration.js', './learning-contracts.js', './word-review.js', './practice-engine.js', './icon.svg', './manifest.webmanifest', './data/manifest.json', './data/curriculum.a1.json', './data/lessons/a1-1.json', './data/lessons/a1-2.json', './data/lessons/a1-3.json', './data/lessons/a1-4.json', './data/lessons/a1-5.json', './data/lessons/a1-6-v2.json', './data/lessons/a1-11-v1.json', './data/lessons/a1-12-v1.json', './a1-4-locations.svg', './assets/scene-a1-1.svg', './assets/scene-a1-2.svg', './assets/scene-a1-3.svg', './assets/scene-a1-4.svg', './assets/scene-a1-5.svg', './assets/scene-a1-6-v2.svg', './assets/scene-a1-11-kitchen.svg', './assets/scene-a1-12-meals.svg'];
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

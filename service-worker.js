const CACHE_NAME = 'weekly-reports-v1';
const APP_SHELL = [
  './', './index.html', './employee.html', './admin.html', './manager.html',
  './css/variables.css', './css/theme.css', './css/animations.css', './css/login.css', './css/employee.css',
  './js/config.js', './js/storage.js', './js/api.js', './js/auth.js', './js/employee.js',
  './assets/logo.png', './manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html'))));
});

// ==========================================
// sw.js — Service Worker (Phase 1 base)
// Full caching strategy in Phase 6
// ==========================================

const CACHE_NAME = 'portfolio-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/reset.css',
  '/assets/css/variables.css',
  '/assets/css/theme.css',
  '/assets/css/animations.css',
  '/assets/css/components.css',
  '/assets/css/pages/pages.css',
  '/assets/js/app.js',
  '/assets/js/theme.js',
  '/assets/js/utils.js',
  '/assets/js/github-api.js',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first for data, cache first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always network-first for data JSON and GitHub API
  if (url.pathname.startsWith('/data/') || url.hostname === 'api.github.com') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('/index.html'))
  );
});

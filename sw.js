// ==========================================
// sw.js — Service Worker (Phase 6 Final)
// Cache strategy: assets=cache-first, data=network-first
// ==========================================

const CACHE_NAME    = 'portfolio-v2';
const DATA_CACHE    = 'portfolio-data-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/reset.css',
  '/assets/css/variables.css',
  '/assets/css/theme.css',
  '/assets/css/animations.css',
  '/assets/css/components.css',
  '/assets/css/pages/pages.css',
  '/assets/css/pages/home.css',
  '/assets/css/pages/projects.css',
  '/assets/css/pages/repo-viewer.css',
  '/assets/css/pages/other-pages.css',
  '/assets/css/pages/admin.css',
  '/assets/js/app.js',
  '/assets/js/theme.js',
  '/assets/js/utils.js',
  '/assets/js/github-api.js',
  '/assets/js/auth.js',
  '/assets/js/admin.js',
  '/assets/js/repo-viewer.js',
  '/assets/js/pages/home.js',
  '/assets/js/pages/projects.js',
  '/assets/js/pages/blog.js',
  '/assets/js/pages/skills.js',
  '/assets/js/pages/certifications.js',
  '/assets/js/pages/contact.js',
  '/assets/js/pages/profile.js',
  '/pages/home.html',
  '/pages/projects.html',
  '/pages/blog.html',
  '/pages/skills.html',
  '/pages/certifications.html',
  '/pages/contact.html',
  '/pages/profile.html',
  '/pages/admin.html',
  '/pages/repo-viewer.html',
];

// ==========================================
// INSTALL — pre-cache static assets
// ==========================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(() => {}) // Don't fail if one asset is missing
        )
      );
    })
  );
  self.skipWaiting();
});

// ==========================================
// ACTIVATE — clean old caches
// ==========================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== DATA_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ==========================================
// FETCH — routing strategy
// ==========================================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Chrome extensions, analytics etc.
  if (!url.protocol.startsWith('http')) return;

  // === GitHub API — network only (never cache PAT requests) ===
  if (url.hostname === 'api.github.com') {
    event.respondWith(fetch(event.request).catch(() =>
      new Response(JSON.stringify({ error: 'Offline' }), {
        headers: { 'Content-Type': 'application/json' }
      })
    ));
    return;
  }

  // === Data files — network first, fallback to cache ===
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(DATA_CACHE).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // === Google Fonts — stale-while-revalidate ===
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((res) => {
          caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          return res;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // === CDN scripts (hljs, marked) — cache first ===
  if (url.hostname.includes('cdnjs.cloudflare.com') || url.hostname.includes('cdn.jsdelivr.net')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          return res;
        });
      })
    );
    return;
  }

  // === App shell & static assets — cache first ===
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => {
          // Offline fallback — serve index.html for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});

// ==========================================
// MESSAGE — skip waiting (for updates)
// ==========================================
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

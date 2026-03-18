// ==========================================
// app.js — SPA Router (Final — Phase 6)
// ==========================================

import { initTheme, getTheme } from './theme.js';
import { applyRippleToButtons, closeAllBottomSheets, initScrollReveal } from './utils.js';
import { initPWAInstallBanner, initPullToRefresh, initSWUpdateDetection } from './pwa.js';

// === Route Config ===
const ROUTES = {
  home:           { page: 'home',           title: 'Home',           nav: 'home' },
  projects:       { page: 'projects',       title: 'Projects',       nav: 'projects' },
  blog:           { page: 'blog',           title: 'Blog',           nav: 'blog' },
  skills:         { page: 'skills',         title: 'Skills',         nav: 'skills' },
  profile:        { page: 'profile',        title: 'Profile',        nav: 'profile' },
  certifications: { page: 'certifications', title: 'Certifications', nav: 'skills' },
  contact:        { page: 'contact',        title: 'Contact',        nav: 'profile' },
  admin:          { page: 'admin',          title: 'Admin ⚙️',       nav: null },
};

const NAV_ORDER = ['home', 'projects', 'blog', 'skills', 'profile'];

let currentRoute  = '';
let lastDirection = 'forward';

// === Lazy page module loader ===
async function getPageInit(pageName) {
  try {
    switch (pageName) {
      case 'home':           return (await import('./pages/home.js')).init;
      case 'projects':       return (await import('./pages/projects.js')).init;
      case 'blog':           return (await import('./pages/blog.js')).init;
      case 'skills':         return (await import('./pages/skills.js')).init;
      case 'profile':        return (await import('./pages/profile.js')).init;
      case 'certifications': return (await import('./pages/certifications.js')).init;
      case 'contact':        return (await import('./pages/contact.js')).init;
      case 'admin':          return (await import('./admin.js')).init;
      default:               return null;
    }
  } catch {
    return null;
  }
}

// ==========================================
// ROUTER
// ==========================================
async function router() {
  const hash  = window.location.hash.slice(1) || 'home';
  const parts = hash.split('/');
  const routeKey = parts[0];

  closeAllBottomSheets();

  // Repo viewer route
  if (routeKey === 'repo') {
    await loadRepoViewer(parts);
    updateNavActive(null);
    updateTopBarTitle('Repository');
    syncThemeColor();
    return;
  }

  const route = ROUTES[routeKey];
  if (!route) {
    show404();
    updateNavActive(null);
    return;
  }

  // Slide direction
  const prevIdx = NAV_ORDER.indexOf(currentRoute);
  const nextIdx = NAV_ORDER.indexOf(routeKey);
  if (prevIdx !== -1 && nextIdx !== -1) {
    lastDirection = nextIdx >= prevIdx ? 'forward' : 'back';
  } else {
    lastDirection = 'forward';
  }

  currentRoute = routeKey;
  await loadPage(route.page);
  updateNavActive(route.nav);
  updateTopBarTitle(route.title);
  syncThemeColor();
}

// ==========================================
// LOAD PAGE HTML
// ==========================================
async function loadPage(pageName) {
  const appContent = document.getElementById('app-content');
  if (!appContent) return;

  appContent.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`;

  try {
    const res = await fetch(`pages/${pageName}.html`);
    if (!res.ok) throw new Error(`${pageName} not found`);
    const html = await res.text();

    appContent.innerHTML = html;

    // Animate
    const wrapper = appContent.firstElementChild;
    if (wrapper) {
      wrapper.classList.add(lastDirection === 'back' ? 'page-enter-back' : 'page-enter');
    }

    applyRippleToButtons(appContent);
    initScrollReveal(appContent);

    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'instant' });

    const initFn = await getPageInit(pageName);
    if (typeof initFn === 'function') await initFn();

  } catch {
    appContent.innerHTML = `
      <div class="not-found page-enter">
        <div class="not-found-illustration">
          <div class="not-found-circle-1"></div>
          <div class="not-found-circle-2"></div>
        </div>
        <div class="not-found-code">404</div>
        <h2>Page not found</h2>
        <p>This page is under construction or doesn't exist.</p>
        <a href="#home" class="md-btn-filled" style="margin-top:8px;">← Go Home</a>
      </div>
    `;
  }
}

// ==========================================
// REPO VIEWER
// ==========================================
async function loadRepoViewer(parts) {
  const appContent = document.getElementById('app-content');
  appContent.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`;

  try {
    const res = await fetch('pages/repo-viewer.html');
    if (!res.ok) throw new Error('Not found');
    appContent.innerHTML = await res.text();

    const wrapper = appContent.firstElementChild;
    if (wrapper) wrapper.classList.add('page-enter');

    applyRippleToButtons(appContent);
    window.scrollTo({ top: 0, behavior: 'instant' });

    const { init } = await import('./repo-viewer.js');
    init?.({ owner: parts[1], repo: parts[2], path: parts.slice(3).join('/') });
  } catch {
    appContent.innerHTML = `
      <div class="not-found page-enter">
        <div class="not-found-code">404</div>
        <h2>Repo viewer coming soon</h2>
        <a href="#projects" class="md-btn-filled">← Projects</a>
      </div>
    `;
  }
}

// ==========================================
// 404
// ==========================================
function show404() {
  document.getElementById('app-content').innerHTML = `
    <div class="not-found page-enter">
      <div class="not-found-illustration">
        <div class="not-found-circle-1"></div>
        <div class="not-found-circle-2"></div>
      </div>
      <div class="not-found-code">404</div>
      <h2>Page not found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <a href="#home" class="md-btn-filled" style="margin-top:8px;">← Go Home</a>
    </div>
  `;
}

// ==========================================
// NAV HELPERS
// ==========================================
function updateNavActive(activeNav) {
  document.querySelectorAll('.nav-item').forEach(item =>
    item.classList.toggle('active', item.dataset.route === activeNav)
  );
  document.querySelectorAll('.sidebar-nav-item').forEach(item =>
    item.classList.toggle('active', item.dataset.route === activeNav)
  );
}

function updateTopBarTitle(title) {
  const el = document.getElementById('top-bar-title');
  if (el) el.textContent = title || 'Portfolio';
}

// Sync theme-color meta tag with current theme
function syncThemeColor() {
  const meta   = document.getElementById('meta-theme-color');
  const isDark = getTheme() === 'dark';
  if (meta) meta.content = isDark ? '#1e1e24' : '#6750A4';
}

// ==========================================
// SIDEBAR PROFILE LOADER
// ==========================================
async function loadSidebarProfile() {
  try {
    const res     = await fetch('data/profile.json');
    const profile = await res.json();

    const nameEl  = document.getElementById('sidebar-name');
    const bioEl   = document.getElementById('sidebar-bio');
    const avatarEl = document.getElementById('sidebar-avatar');
    const phEl    = document.getElementById('sidebar-avatar-placeholder');

    if (nameEl) nameEl.textContent = profile.name || 'Your Name';
    if (bioEl)  bioEl.textContent  = profile.bio  || '';

    if (profile.avatar && avatarEl) {
      avatarEl.src = profile.avatar;
      avatarEl.style.display = 'block';
      avatarEl.onerror = () => {
        avatarEl.style.display = 'none';
        if (phEl) {
          phEl.style.display = 'flex';
          phEl.textContent = (profile.name || 'U').charAt(0).toUpperCase();
        }
      };
      if (phEl) phEl.style.display = 'none';
    } else if (phEl) {
      phEl.textContent = (profile.name || 'U').charAt(0).toUpperCase();
    }
  } catch { /* silent */ }
}

// ==========================================
// INIT
// ==========================================
async function init() {
  // Theme (must be first to prevent flash)
  initTheme();

  // Overlay
  document.getElementById('overlay')?.addEventListener('click', closeAllBottomSheets);

  // Bottom nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (item.dataset.route) window.location.hash = item.dataset.route;
    });
  });

  // Sidebar nav
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (item.dataset.route) window.location.hash = item.dataset.route;
    });
  });

  applyRippleToButtons();

  // Sidebar profile
  loadSidebarProfile();

  // PWA features
  initPWAInstallBanner();
  initPullToRefresh();
  initSWUpdateDetection();

  // Sync theme color on theme change
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    setTimeout(syncThemeColor, 50);
  });
  document.getElementById('sidebar-theme-toggle')?.addEventListener('click', () => {
    setTimeout(syncThemeColor, 50);
  });

  // Route listener
  window.addEventListener('hashchange', router);
  await router();
}

document.addEventListener('DOMContentLoaded', init);

// ==========================================
// app.js — SPA Router (Main Entry)
// ==========================================

import { initTheme } from './theme.js';
import { applyRippleToButtons, closeAllBottomSheets, initScrollReveal } from './utils.js';

// === Route Config ===
const ROUTES = {
  home:           { page: 'home',           title: 'Home',           nav: 'home' },
  projects:       { page: 'projects',       title: 'Projects',       nav: 'projects' },
  blog:           { page: 'blog',           title: 'Blog',           nav: 'blog' },
  skills:         { page: 'skills',         title: 'Skills',         nav: 'skills' },
  profile:        { page: 'profile',        title: 'Profile',        nav: 'profile' },
  certifications: { page: 'certifications', title: 'Certifications', nav: 'skills' },
  contact:        { page: 'contact',        title: 'Contact',        nav: 'profile' },
  admin:          { page: 'admin',          title: 'Admin',          nav: null },
};

// Nav order (for slide direction)
const NAV_ORDER = ['home', 'projects', 'blog', 'skills', 'profile'];

let currentRoute = '';
let lastDirection = 'forward';

// === Lazy page init loaders ===
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
  const hash = window.location.hash.slice(1) || 'home';
  const parts = hash.split('/');
  const routeKey = parts[0];

  closeAllBottomSheets();

  // Repo viewer route
  if (routeKey === 'repo') {
    await loadRepoViewer(parts);
    updateNavActive(null);
    updateTopBarTitle('Repository');
    return;
  }

  const route = ROUTES[routeKey];
  if (!route) {
    show404();
    updateNavActive(null);
    return;
  }

  // Determine slide direction
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
}

// ==========================================
// LOAD PAGE HTML
// ==========================================
async function loadPage(pageName) {
  const appContent = document.getElementById('app-content');
  if (!appContent) return;

  // Show spinner
  appContent.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`;

  try {
    const res = await fetch(`pages/${pageName}.html`);
    if (!res.ok) throw new Error(`${pageName} not found`);
    const html = await res.text();

    appContent.innerHTML = html;

    // Page transition animation
    const wrapper = appContent.firstElementChild;
    if (wrapper) {
      wrapper.classList.add(lastDirection === 'back' ? 'page-enter-back' : 'page-enter');
    }

    // Ripple + scroll reveal
    applyRippleToButtons(appContent);
    initScrollReveal(appContent);

    // Run page-specific init
    const initFn = await getPageInit(pageName);
    if (typeof initFn === 'function') {
      await initFn();
    }

  } catch (e) {
    appContent.innerHTML = `
      <div class="not-found page-enter">
        <div class="not-found-code">404</div>
        <h2>Page not found</h2>
        <p>This page is under construction.</p>
        <a href="#home" class="md-btn-filled">← Go Home</a>
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
      <div class="not-found-code">404</div>
      <h2>Page not found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <a href="#home" class="md-btn-filled">← Go Home</a>
    </div>
  `;
}

// ==========================================
// NAV HELPERS
// ==========================================
function updateNavActive(activeNav) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.route === activeNav);
  });
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.route === activeNav);
  });
}

function updateTopBarTitle(title) {
  const el = document.getElementById('top-bar-title');
  if (el) el.textContent = title || 'Portfolio';
}

// ==========================================
// SIDEBAR PROFILE
// ==========================================
async function loadSidebarProfile() {
  try {
    const res = await fetch('data/profile.json');
    const profile = await res.json();

    const nameEl   = document.getElementById('sidebar-name');
    const bioEl    = document.getElementById('sidebar-bio');
    const avatarEl = document.getElementById('sidebar-avatar');
    const phEl     = document.getElementById('sidebar-avatar-placeholder');

    if (nameEl) nameEl.textContent = profile.name || 'Your Name';
    if (bioEl)  bioEl.textContent  = profile.bio  || '';

    if (profile.avatar && avatarEl) {
      avatarEl.src = profile.avatar;
      avatarEl.style.display = 'block';
      avatarEl.onerror = () => {
        avatarEl.style.display = 'none';
        if (phEl) phEl.style.display = 'flex';
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
  initTheme();

  // Overlay closes sheets
  document.getElementById('overlay')?.addEventListener('click', closeAllBottomSheets);

  // Bottom nav clicks
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (item.dataset.route) window.location.hash = item.dataset.route;
    });
  });

  // Sidebar nav clicks
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (item.dataset.route) window.location.hash = item.dataset.route;
    });
  });

  applyRippleToButtons();
  loadSidebarProfile();

  window.addEventListener('hashchange', router);
  await router();
}

document.addEventListener('DOMContentLoaded', init);

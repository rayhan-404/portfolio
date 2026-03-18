// ==========================================
// app.js — SPA Router (Main Entry)
// ==========================================

import { initTheme } from './theme.js';
import { applyRippleToButtons, closeAllBottomSheets, showToast } from './utils.js';

// === Route Config ===
const ROUTES = {
  home: { page: 'home', title: 'Home', nav: 'home' },
  projects: { page: 'projects', title: 'Projects', nav: 'projects' },
  blog: { page: 'blog', title: 'Blog', nav: 'blog' },
  skills: { page: 'skills', title: 'Skills', nav: 'skills' },
  profile: { page: 'profile', title: 'Profile', nav: 'profile' },
  certifications: { page: 'certifications', title: 'Certifications', nav: 'skills' },
  contact: { page: 'contact', title: 'Contact', nav: 'profile' },
  admin: { page: 'admin', title: 'Admin', nav: null },
};

let currentRoute = '';
let pageModules = {};
let lastDirection = 'forward';

// === Page module registry ===
// Each page can export an init() function called after HTML injection
const PAGE_INITS = {
  home: () => import('./pages/home.js').then(m => m.init?.()),
  projects: () => import('./pages/projects.js').then(m => m.init?.()),
  blog: () => import('./pages/blog.js').then(m => m.init?.()),
  skills: () => import('./pages/skills.js').then(m => m.init?.()),
  profile: () => import('./pages/profile.js').then(m => m.init?.()),
  certifications: () => import('./pages/certifications.js').then(m => m.init?.()),
  contact: () => import('./pages/contact.js').then(m => m.init?.()),
  admin: () => import('./admin.js').then(m => m.init?.()),
};

// === Router ===
async function router() {
  const hash = window.location.hash.slice(1) || 'home';
  const parts = hash.split('/');
  const routeKey = parts[0];

  // Close any open sheets
  closeAllBottomSheets();

  // === Repo viewer route ===
  if (routeKey === 'repo') {
    await loadRepoViewer(parts);
    updateNavActive(null);
    return;
  }

  // === Known routes ===
  const route = ROUTES[routeKey];
  if (!route) {
    show404();
    updateNavActive(null);
    return;
  }

  // Determine animation direction
  const navOrder = ['home', 'projects', 'blog', 'skills', 'profile'];
  const prevIdx = navOrder.indexOf(currentRoute);
  const nextIdx = navOrder.indexOf(routeKey);
  lastDirection = nextIdx >= prevIdx ? 'forward' : 'back';

  currentRoute = routeKey;
  await loadPage(route.page);
  updateNavActive(route.nav);
  updateTopBarTitle(route.title);

  // Run page init if available
  if (PAGE_INITS[route.page]) {
    try {
      await PAGE_INITS[route.page]();
    } catch (e) {
      // Page init module not yet built — silently ignore
    }
  }
}

// === Load Page HTML ===
async function loadPage(pageName) {
  const appContent = document.getElementById('app-content');
  if (!appContent) return;

  // Show loading state
  appContent.innerHTML = `
    <div class="page-loading">
      <div class="spinner"></div>
    </div>
  `;

  try {
    const res = await fetch(`pages/${pageName}.html`);
    if (!res.ok) throw new Error(`Page not found: ${pageName}`);
    const html = await res.text();

    appContent.innerHTML = html;

    // Apply animation
    const wrapper = appContent.firstElementChild;
    if (wrapper) {
      wrapper.classList.add(lastDirection === 'back' ? 'page-enter-back' : 'page-enter');
    }

    // Apply ripple to new page buttons
    applyRippleToButtons(appContent);

    // Init scroll reveal
    const { initScrollReveal } = await import('./utils.js');
    initScrollReveal(appContent);

  } catch (e) {
    appContent.innerHTML = `
      <div class="not-found">
        <div class="not-found-code">404</div>
        <h2>Page not found</h2>
        <p>This page hasn't been built yet.</p>
        <a href="#home" class="md-btn-filled">← Go Home</a>
      </div>
    `;
  }
}

// === Repo Viewer ===
async function loadRepoViewer(parts) {
  // parts = ['repo', 'owner', 'repoName', ...path]
  const appContent = document.getElementById('app-content');
  appContent.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`;

  try {
    const res = await fetch('pages/repo-viewer.html');
    if (!res.ok) throw new Error('Repo viewer not found');
    appContent.innerHTML = await res.text();

    const wrapper = appContent.firstElementChild;
    if (wrapper) wrapper.classList.add('page-enter');

    applyRippleToButtons(appContent);

    const { init } = await import('./repo-viewer.js');
    init?.({ owner: parts[1], repo: parts[2], path: parts.slice(3).join('/') });
  } catch (e) {
    appContent.innerHTML = `
      <div class="not-found">
        <div class="not-found-code">404</div>
        <h2>Repo viewer not found</h2>
        <a href="#projects" class="md-btn-filled">← Projects</a>
      </div>
    `;
  }
}

// === 404 ===
function show404() {
  const appContent = document.getElementById('app-content');
  appContent.innerHTML = `
    <div class="not-found page-enter">
      <div class="not-found-code">404</div>
      <h2>Page not found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <a href="#home" class="md-btn-filled">← Go Home</a>
    </div>
  `;
}

// === Update Bottom Nav Active ===
function updateNavActive(activeNav) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.route === activeNav);
  });

  // Update sidebar nav items
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.route === activeNav);
  });
}

// === Update Top Bar Title ===
function updateTopBarTitle(title) {
  const titleEl = document.getElementById('top-bar-title');
  if (titleEl) titleEl.textContent = title || 'Portfolio';
}

// === Sidebar Profile Load ===
async function loadSidebarProfile() {
  try {
    const res = await fetch('data/profile.json');
    const profile = await res.json();

    const nameEl = document.getElementById('sidebar-name');
    const bioEl = document.getElementById('sidebar-bio');
    const avatarEl = document.getElementById('sidebar-avatar');
    const avatarPlaceholderEl = document.getElementById('sidebar-avatar-placeholder');

    if (nameEl) nameEl.textContent = profile.name || 'Your Name';
    if (bioEl) bioEl.textContent = profile.bio || '';

    if (profile.avatar && avatarEl) {
      avatarEl.src = profile.avatar;
      avatarEl.style.display = 'block';
      if (avatarPlaceholderEl) avatarPlaceholderEl.style.display = 'none';
    } else if (avatarPlaceholderEl) {
      avatarPlaceholderEl.textContent = (profile.name || 'U').charAt(0).toUpperCase();
    }
  } catch (e) {
    // Silently fail
  }
}

// === Init App ===
async function init() {
  // Apply theme immediately
  initTheme();

  // Setup overlay click to close sheets
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.addEventListener('click', closeAllBottomSheets);

  // Setup bottom nav clicks
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const route = item.dataset.route;
      if (route) window.location.hash = route;
    });
  });

  // Setup sidebar nav clicks
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const route = item.dataset.route;
      if (route) window.location.hash = route;
    });
  });

  // Apply ripple to all initial buttons
  applyRippleToButtons();

  // Load sidebar profile
  loadSidebarProfile();

  // Listen for hash changes
  window.addEventListener('hashchange', router);

  // Initial route
  await router();
}

// Run when DOM ready
document.addEventListener('DOMContentLoaded', init);

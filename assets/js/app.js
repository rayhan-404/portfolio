// ==========================================
// app.js — SPA Router (Phase 7 New Design)
// ==========================================

// ── THEME ──────────────────────────────────
const THEME_KEY = 'portfolio_theme';

function getTheme() {
  return localStorage.getItem(THEME_KEY) ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const hlLight = document.getElementById('hl-light');
  const hlDark  = document.getElementById('hl-dark');
  if (hlLight && hlDark) {
    hlLight.disabled = (t === 'dark');
    hlDark.disabled  = (t !== 'dark');
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = t === 'dark' ? '#0C1410' : '#EEF5EA';
}

function initTheme() {
  const t = getTheme();
  applyTheme(t);
  document.getElementById('theme-btn')?.addEventListener('click', () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

// ── WELCOME OVERLAY ────────────────────────
function initWelcome() {
  const overlay  = document.getElementById('welcome-overlay');
  const isMobile = window.innerWidth <= 768;
  const MAX      = isMobile ? 2000 : 2800;
  let done = false;

  function dismiss() {
    if (done) return; done = true;
    overlay.classList.add('out');
    setTimeout(() => { overlay.style.display = 'none'; }, 650);
  }

  const t = setTimeout(dismiss, MAX);
  overlay.addEventListener('click', () => { clearTimeout(t); dismiss(); });
}

// ── TOAST ──────────────────────────────────
export function showToast(msg, type = 'info', ms = 3000) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className   = `toast-bar show ${type}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), ms);
}

// ── RIPPLE ─────────────────────────────────
export function addRipple(el) {
  el.addEventListener('pointerdown', (e) => {
    const wrap = el.querySelector('.rpl-wrap');
    if (!wrap) return;
    const d = document.createElement('span'); d.className = 'rpl-c';
    const r = wrap.getBoundingClientRect();
    d.style.left = (e.clientX - r.left) + 'px';
    d.style.top  = (e.clientY - r.top)  + 'px';
    wrap.appendChild(d);
    d.addEventListener('animationend', () => d.remove());
  });
}

// ── SCROLL REVEAL ──────────────────────────
export function initReveal(container = document) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
    });
  }, { threshold: .08, rootMargin: '0px 0px -40px 0px' });
  container.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// ── SHEET HELPERS ──────────────────────────
export function openSheet(scrimId) {
  document.getElementById(scrimId)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeSheet(scrimId) {
  document.getElementById(scrimId)?.classList.remove('open');
  document.body.style.overflow = '';
}

export function closeAllSheets() {
  document.querySelectorAll('.sheet-scrim.open').forEach(s => {
    s.classList.remove('open');
  });
  document.body.style.overflow = '';
}

// ── NAVBAR ─────────────────────────────────
function initNavbar() {
  // Scrolled elevation
  window.addEventListener('scroll', () => {
    document.getElementById('main-nav')?.classList.toggle('scrolled', scrollY > 4);
  }, { passive: true });

  // Hamburger
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });
  mobileMenu?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });
  document.addEventListener('click', (e) => {
    if (!hamburger?.contains(e.target) && !mobileMenu?.contains(e.target)) {
      hamburger?.classList.remove('open');
      mobileMenu?.classList.remove('open');
    }
  });

  // Sheet scrim clicks
  document.querySelectorAll('.sheet-scrim').forEach(scrim => {
    scrim.addEventListener('click', (e) => {
      if (e.target === scrim) closeAllSheets();
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllSheets();
  });

  // Switch toggle for new-repo private
  const checkbox = document.getElementById('new-repo-private');
  const track    = document.getElementById('new-repo-track');
  const thumb    = document.getElementById('new-repo-thumb');
  if (checkbox && track && thumb) {
    checkbox.addEventListener('change', () => {
      track.style.background = checkbox.checked ? 'var(--pri)' : 'var(--out-v)';
      thumb.style.transform  = checkbox.checked ? 'translateX(22px)' : '';
    });
  }
}

// ── UPDATE NAV ACTIVE STATE ─────────────────
function setNavActive(route) {
  const r = route || 'home';
  document.querySelectorAll('.nav-links a[data-nav]').forEach(a =>
    a.classList.toggle('active', a.dataset.nav === r)
  );
  document.querySelectorAll('.mobile-menu a[data-nav]').forEach(a =>
    a.classList.toggle('active', a.dataset.nav === r)
  );
  document.querySelectorAll('.bnav-item[data-nav]').forEach(a =>
    a.classList.toggle('active', a.dataset.nav === r)
  );
}

// ── ROUTES ─────────────────────────────────
const ROUTES = {
  home:           { page: 'home',           nav: 'home' },
  projects:       { page: 'projects',       nav: 'projects' },
  blog:           { page: 'blog',           nav: 'blog' },
  skills:         { page: 'skills',         nav: 'skills' },
  certifications: { page: 'certifications', nav: 'skills' },
  contact:        { page: 'contact',        nav: 'contact' },
  profile:        { page: 'profile',        nav: 'profile' },
  admin:          { page: 'admin',          nav: null },
};

let currentRoute = '';

async function getPageInit(page) {
  try {
    switch (page) {
      case 'home':           return (await import('./pages/home.js')).init;
      case 'projects':       return (await import('./pages/projects.js')).init;
      case 'blog':           return (await import('./pages/blog.js')).init;
      case 'skills':         return (await import('./pages/skills.js')).init;
      case 'certifications': return (await import('./pages/certifications.js')).init;
      case 'contact':        return (await import('./pages/contact.js')).init;
      case 'profile':        return (await import('./pages/profile.js')).init;
      case 'admin':          return (await import('./admin.js')).init;
      default: return null;
    }
  } catch { return null; }
}

// ── ROUTER ─────────────────────────────────
async function router() {
  const hash  = window.location.hash.slice(1) || 'home';
  const parts = hash.split('/');
  const key   = parts[0];

  closeAllSheets();
  window.scrollTo({ top: 0, behavior: 'instant' });

  if (key === 'repo') {
    await loadRepoViewer(parts);
    setNavActive('projects');
    return;
  }

  const route = ROUTES[key];
  if (!route) { show404(); setNavActive(null); return; }

  currentRoute = key;
  await loadPage(route.page);
  setNavActive(route.nav);
}

async function loadPage(pageName) {
  const content = document.getElementById('app-content');
  if (!content) return;
  content.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`;

  try {
    const res = await fetch(`pages/${pageName}.html`);
    if (!res.ok) throw new Error('not found');
    content.innerHTML = await res.text();

    const first = content.firstElementChild;
    if (first) first.classList.add('page-enter');

    initReveal(content);

    const initFn = await getPageInit(pageName);
    if (typeof initFn === 'function') await initFn();

  } catch {
    show404();
  }
}

async function loadRepoViewer(parts) {
  const content = document.getElementById('app-content');
  content.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`;
  try {
    const res = await fetch('pages/repo-viewer.html');
    if (!res.ok) throw new Error('not found');
    content.innerHTML = await res.text();
    const first = content.firstElementChild;
    if (first) first.classList.add('page-enter');
    const { init } = await import('./repo-viewer.js');
    init?.({ owner: parts[1], repo: parts[2], path: parts.slice(3).join('/') });
  } catch {
    show404();
  }
}

function show404() {
  document.getElementById('app-content').innerHTML = `
    <div class="not-found page-enter">
      <div class="not-found-code">404</div>
      <h2>Page not found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <a href="#home" class="btn-filled" style="margin-top:8px;">← Go Home</a>
    </div>
  `;
}

// ── SPIDER NET (desktop only) ──────────────
function initSpiderNet() {
  if (window.innerWidth <= 768) return;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const PC = 70, MD = 130, SP = 0.35, DR = 1.6;
  let W, H, pts = [], mx = -9999, my = -9999;
  function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
  function init2() {
    resize();
    pts = Array.from({ length: PC }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * SP * 2 || SP,
      vy: (Math.random() - .5) * SP * 2 || SP,
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    }
    const LC = getComputedStyle(document.documentElement).getPropertyValue('--ba').trim() || '114,219,160';
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < MD) { const a = (1 - d/MD) * .28; ctx.beginPath(); ctx.strokeStyle = `rgba(${LC},${a})`; ctx.lineWidth = .6; ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); }
      }
      const mdx = pts[i].x - mx, mdy = pts[i].y - my;
      const md = Math.sqrt(mdx*mdx + mdy*mdy);
      if (md < MD * 1.5) { const a = (1 - md/(MD*1.5)) * .45; ctx.beginPath(); ctx.strokeStyle = `rgba(${LC},${a})`; ctx.lineWidth = .8; ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(mx, my); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, DR, 0, Math.PI*2); ctx.fillStyle = `rgba(${LC},.45)`; ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  window.addEventListener('mouseleave', () => { mx = -9999; my = -9999; });
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) { canvas.style.display = 'none'; return; }
    canvas.style.display = ''; resize();
  });
  init2(); draw();
}

// ── INIT ───────────────────────────────────
async function init() {
  initTheme();
  initWelcome();
  initNavbar();
  initSpiderNet();

  // Bottom nav clicks
  document.querySelectorAll('.bnav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.bnav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  window.addEventListener('hashchange', router);
  await router();
}

document.addEventListener('DOMContentLoaded', init);

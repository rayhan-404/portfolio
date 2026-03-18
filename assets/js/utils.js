// ==========================================
// utils.js — Shared utility functions
// ==========================================

// === Toast Notification ===
export function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconMap = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.textContent = `${iconMap[type] || ''} ${message}`.trim();

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// === Ripple Effect ===
export function addRipple(el, dark = false) {
  el.addEventListener('pointerdown', (e) => {
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = `ripple-span ${dark ? 'ripple-dark' : ''}`;
    ripple.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
    `;

    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });
}

// === Apply ripple to all buttons ===
export function applyRippleToButtons(container = document) {
  container.querySelectorAll(
    '.md-btn-filled, .md-btn-text, .md-btn-outlined, .nm-btn, .nav-item, .sidebar-nav-item, .fab'
  ).forEach(btn => {
    const isDark = btn.classList.contains('md-btn-filled') || btn.classList.contains('fab');
    addRipple(btn, !isDark);
  });
}

// === Bottom Sheet ===
export function openBottomSheet(id) {
  const sheet = document.getElementById(id);
  const overlay = document.getElementById('overlay');
  if (sheet) sheet.classList.add('open');
  if (overlay) overlay.classList.add('visible');
  document.body.style.overflow = 'hidden';
}

export function closeBottomSheet(id) {
  const sheet = document.getElementById(id);
  const overlay = document.getElementById('overlay');
  if (sheet) sheet.classList.remove('open');
  if (overlay) overlay.classList.remove('visible');
  document.body.style.overflow = '';
}

export function closeAllBottomSheets() {
  document.querySelectorAll('.bottom-sheet').forEach(s => s.classList.remove('open'));
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.classList.remove('visible');
  document.body.style.overflow = '';
}

// === Password Hashing (SHA-256) ===
export async function hashPassword(str) {
  const encoded = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// === LocalStorage Wrappers ===
export function setStorage(key, val) {
  try {
    localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
  } catch (e) {
    console.warn('Storage write failed:', e);
  }
}

export function getStorage(key, defaultVal = null) {
  try {
    const val = localStorage.getItem(key);
    if (val === null) return defaultVal;
    try { return JSON.parse(val); } catch { return val; }
  } catch (e) {
    return defaultVal;
  }
}

export function removeStorage(key) {
  try { localStorage.removeItem(key); } catch (e) {}
}

// === Session Storage ===
export function setSession(key, val) {
  try { sessionStorage.setItem(key, val); } catch (e) {}
}

export function getSession(key) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

export function removeSession(key) {
  try { sessionStorage.removeItem(key); } catch (e) {}
}

// === Relative Time ===
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

// === Format Date ===
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// === Debounce ===
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// === Throttle ===
export function throttle(fn, delay) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      return fn.apply(this, args);
    }
  };
}

// === Scroll Reveal Observer ===
export function initScrollReveal(container = document) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  container.querySelectorAll('.section-hidden').forEach(el => observer.observe(el));
}

// === Skeleton HTML helpers ===
export function skeletonCard(lines = 3) {
  const lineWidths = ['w-80', 'w-60', 'w-40', 'w-100'];
  return `
    <div class="nm-card">
      ${Array.from({ length: lines }, (_, i) =>
        `<div class="skeleton skeleton-text ${lineWidths[i % lineWidths.length]}"></div>`
      ).join('')}
    </div>
  `;
}

// === Fetch with error handling ===
export async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (e) {
    throw e;
  }
}

// === Clamp text ===
export function clamp(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
}

// === Language color map ===
export const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#2b7489',
  Python: '#3572A5',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Go: '#00ADD8',
  Rust: '#dea584',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Swift: '#fa7343',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  Vue: '#41b883',
  default: '#8B8B8B'
};

export function getLangColor(lang) {
  return LANG_COLORS[lang] || LANG_COLORS.default;
}

// === Base64 encode for GitHub API ===
export function encodeBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

// === Escape HTML ===
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

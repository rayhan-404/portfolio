// utils.js — Re-exports from app.js for backward compatibility
export { showToast, addRipple, openSheet as openBottomSheet, closeSheet as closeBottomSheet, closeAllSheets as closeAllBottomSheets, initReveal as initScrollReveal } from './app.js';

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff/86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff/2592000)}mo ago`;
  return `${Math.floor(diff/31536000)}y ago`;
}

export function getLangColor(lang) {
  const map = { JavaScript:'#f1e05a', TypeScript:'#2b7489', Python:'#3572A5', HTML:'#e34c26', CSS:'#563d7c', 'C++':'#f34b7d', C:'#555555', Go:'#00ADD8', Rust:'#dea584', PHP:'#4F5D95', Ruby:'#701516', default:'#7A9880' };
  return map[lang] || map.default;
}

export function encodeBase64(str) { return btoa(unescape(encodeURIComponent(str))); }
export function debounce(fn, d) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), d); }; }
export function safeFetch(url, opts={}) { return fetch(url, opts).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }); }

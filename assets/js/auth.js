// ==========================================
// auth.js — Admin Authentication System
// SHA-256 password hashing, PAT storage
// ==========================================

const PW_KEY      = 'portfolio_pw_hash';
const PAT_KEY     = 'portfolio_pat';
const SESSION_KEY = 'admin_auth';
const REPO_KEY    = 'portfolio_repo';

// ==========================================
// PASSWORD HASHING (Web Crypto API)
// ==========================================
export async function hashPassword(str) {
  const encoded    = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==========================================
// SETUP CHECK
// ==========================================
export function isFirstSetup() {
  return !localStorage.getItem(PW_KEY);
}

// ==========================================
// SETUP ADMIN (first time)
// ==========================================
export async function setupAdmin(password, pat, repoName = 'portfolio') {
  const hash = await hashPassword(password);
  localStorage.setItem(PW_KEY, hash);
  localStorage.setItem(PAT_KEY, pat);
  localStorage.setItem(REPO_KEY, repoName);
}

// ==========================================
// VERIFY PASSWORD
// ==========================================
export async function verifyPassword(password) {
  const stored = localStorage.getItem(PW_KEY);
  if (!stored) return false;
  const hash = await hashPassword(password);
  return hash === stored;
}

// ==========================================
// SESSION MANAGEMENT
// ==========================================
export function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export function setAuthenticated() {
  sessionStorage.setItem(SESSION_KEY, 'true');
}

export function lockAdmin() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ==========================================
// PAT & REPO
// ==========================================
export function getPAT() {
  return localStorage.getItem(PAT_KEY) || '';
}

export function getRepoName() {
  return localStorage.getItem(REPO_KEY) || 'portfolio';
}

// ==========================================
// GET USERNAME (from profile.json, cached)
// ==========================================
let _cachedUsername = null;

export async function getUsername() {
  if (_cachedUsername) return _cachedUsername;
  try {
    const res  = await fetch('data/profile.json');
    const data = await res.json();
    _cachedUsername = data.username?.trim() || '';
    return _cachedUsername;
  } catch {
    return '';
  }
}

export function clearUsernameCache() {
  _cachedUsername = null;
}

// ==========================================
// RESET ADMIN (for re-setup)
// ==========================================
export function resetAdmin() {
  localStorage.removeItem(PW_KEY);
  localStorage.removeItem(PAT_KEY);
  localStorage.removeItem(REPO_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  _cachedUsername = null;
}

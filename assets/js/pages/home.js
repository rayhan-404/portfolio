// ==========================================
// pages/home.js — Home Page Logic (Phase 7)
// ==========================================

import { getUserProfile, getUserRepos } from '../github-api.js';
import { showToast, initReveal } from '../app.js';

// ── LANG COLORS ──
const LANG_COLORS = { JavaScript:'#f1e05a', TypeScript:'#2b7489', Python:'#3572A5', HTML:'#e34c26', CSS:'#563d7c', 'C++':'#f34b7d', C:'#555555', Go:'#00ADD8', Rust:'#dea584', default:'#7A9880' };
function lc(lang) { return LANG_COLORS[lang] || LANG_COLORS.default; }

// ── TYPEWRITER ──
let _tw = null;
function typewriter(roles) {
  const el = document.getElementById('hero-typed');
  if (!el || !roles?.length) return;
  const suffix = '<em>.</em>';
  let ri = 0, ci = 0, del = false, pause = false;
  function tick() {
    if (!document.getElementById('hero-typed')) { clearTimeout(_tw); return; }
    const cur = roles[ri];
    if (pause) { pause = false; del = true; _tw = setTimeout(tick, 2000); return; }
    if (!del) {
      el.innerHTML = cur.slice(0, ++ci) + suffix;
      if (ci === cur.length) { pause = true; _tw = setTimeout(tick, 100); }
      else _tw = setTimeout(tick, 85);
    } else {
      el.innerHTML = cur.slice(0, --ci) + suffix;
      if (ci === 0) { del = false; ri = (ri + 1) % roles.length; _tw = setTimeout(tick, 350); }
      else _tw = setTimeout(tick, 42);
    }
  }
  tick();
}

// ── TRACKING ──
async function loadTracking() {
  try {
    const res = await fetch('data/tracking.json');
    const d = await res.json();
    const topicEl   = document.getElementById('lc-topic');
    const barEl     = document.getElementById('lc-bar');
    const pctEl     = document.getElementById('lc-pct');
    const dateEl    = document.getElementById('lc-date');
    const resourceEl = document.getElementById('lc-resource');
    if (topicEl) topicEl.textContent = d.topic || '—';
    const pct = Math.min(100, d.progress || 0);
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (barEl) setTimeout(() => barEl.style.width = `${pct}%`, 300);
    if (dateEl && d.startDate) {
      const dt = new Date(d.startDate);
      dateEl.textContent = `Started ${dt.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}`;
    }
    if (resourceEl && d.resource) {
      resourceEl.href = d.resource;
      resourceEl.textContent = (d.resourceLabel || 'Resource') + ' →';
      resourceEl.style.display = 'inline';
    }
  } catch {
    const el = document.getElementById('lc-topic');
    if (el) el.textContent = 'Set topic in Admin';
  }
}

// ── GITHUB STATS ──
async function loadStats(username) {
  const row = document.getElementById('stats-row');
  if (!row) return;
  if (!username) {
    row.innerHTML = `<div class="stat-pill"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Set username in Admin</span></div>`;
    return;
  }
  try {
    const p = await getUserProfile(username);
    const ghIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px;"><path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.185 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0022 12.021C22 6.484 17.522 2 12 2z"/></svg>`;
    row.innerHTML = `
      <a href="${p.html_url}" target="_blank" rel="noopener" class="stat-pill" style="text-decoration:none;">
        ${ghIcon}<span>📁 ${p.public_repos} Repos</span>
      </a>
      <div class="stat-pill">${ghIcon}<span>👥 ${p.followers} Followers</span></div>
      <div class="stat-pill">${ghIcon}<span>👤 ${p.following} Following</span></div>
    `;
  } catch {
    row.innerHTML = '';
  }
}

// ── FEATURED REPOS ──
async function loadFeatured(username) {
  const container = document.getElementById('featured-repos');
  if (!container) return;
  if (!username) {
    container.innerHTML = `<div style="color:var(--on-sv);font-size:13px;padding:16px;">Set GitHub username in Admin to show repos.</div>`;
    return;
  }
  try {
    const repos = await getUserRepos(username, null, 8, 'updated');
    const filtered = repos.filter(r => !r.fork).slice(0, 5);
    if (!filtered.length) { container.innerHTML = `<div style="color:var(--on-sv);font-size:13px;padding:16px;">No public repos found.</div>`; return; }
    const now = Date.now();
    function rel(d) {
      const diff = Math.floor((now - new Date(d)) / 1000);
      if (diff < 60) return 'just now';
      if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
      if (diff < 2592000) return `${Math.floor(diff/86400)}d ago`;
      return `${Math.floor(diff/2592000)}mo ago`;
    }
    container.innerHTML = filtered.map(repo => `
      <button class="repo-card-h" onclick="window.location.hash='repo/${username}/${repo.name}'">
        <div class="rpl-wrap"></div>
        <div class="repo-card-name">${repo.name}</div>
        <div class="repo-card-desc">${repo.description || '<span style="opacity:.5;font-style:italic;">No description</span>'}</div>
        <div class="repo-card-meta">
          ${repo.language ? `<span style="display:flex;align-items:center;gap:4px;">
            <span class="lang-dot" style="background:${lc(repo.language)}"></span>
            <span style="font-size:11px;">${repo.language}</span>
          </span>` : '<span></span>'}
          <span>⭐ ${repo.stargazers_count} · Updated ${rel(repo.updated_at)}</span>
        </div>
      </button>
    `).join('');
    container.querySelectorAll('.repo-card-h').forEach(c => {
      c.addEventListener('pointerdown', (e) => {
        const wrap = c.querySelector('.rpl-wrap');
        if (!wrap) return;
        const d = document.createElement('span'); d.className = 'rpl-c';
        const r = wrap.getBoundingClientRect();
        d.style.left = (e.clientX - r.left) + 'px'; d.style.top = (e.clientY - r.top) + 'px';
        wrap.appendChild(d); d.addEventListener('animationend', () => d.remove());
      });
    });
  } catch {
    container.innerHTML = `<div style="color:var(--on-sv);font-size:13px;padding:16px;">Could not load repos.</div>`;
  }
}

// ── SKILLS PREVIEW ──
function renderSkillsPreview(skills) {
  const container = document.getElementById('skills-preview-chips');
  if (!container || !skills?.length) return;
  container.innerHTML = skills.map(s => `
    <button class="chip" onclick="window.location.hash='skills'">${s}</button>
  `).join('');
}

// ── INIT ──
export async function init() {
  if (_tw) { clearTimeout(_tw); _tw = null; }

  loadTracking();
  initReveal(document.getElementById('app-content'));

  try {
    const res     = await fetch('data/profile.json');
    const profile = await res.json();

    // Photo
    const photoEl = document.getElementById('hero-photo');
    if (photoEl && profile.avatar) {
      photoEl.src = profile.avatar;
      photoEl.onerror = () => { photoEl.style.display = 'none'; };
    }

    // Role chip & typewriter
    const chipEl = document.getElementById('hero-chip');
    if (chipEl && profile.university) chipEl.textContent = `🎓 ${profile.university}`;
    if (profile.roles?.length) typewriter(profile.roles);

    // Stats + repos
    const username = profile.username?.trim();
    loadStats(username);
    loadFeatured(username);
    renderSkillsPreview(profile.skills);
  } catch {
    typewriter(['AI Engineer (Aspiring)', 'CSE Student', 'Python Developer']);
    loadStats('');
    loadFeatured('');
  }
}

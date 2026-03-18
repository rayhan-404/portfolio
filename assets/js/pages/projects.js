// ==========================================
// pages/projects.js — Projects Page Logic
// ==========================================

import { getUserRepos } from '../github-api.js';
import { formatRelativeTime, getLangColor, showToast, addRipple, openBottomSheet, closeBottomSheet, initScrollReveal } from '../utils.js';

const PER_PAGE = 12;

let allRepos      = [];
let filteredRepos = [];
let currentPage   = 1;
let username      = '';

// Active filter state
let selectedLang = '';
let selectedSort = 'updated';

// ==========================================
// RENDER HELPERS
// ==========================================
function renderRepoCard(repo, idx) {
  const langColor = getLangColor(repo.language);
  const stagger   = ((idx % 6) + 1);

  return `
    <button
      class="project-card pressable section-hidden stagger-${stagger}"
      onclick="window.location.hash='repo/${username}/${repo.name}'"
      aria-label="Open ${repo.name}">

      <div class="project-card-name">
        <span class="material-symbols-rounded">${repo.private ? 'lock' : 'folder_open'}</span>
        ${repo.name}
        ${repo.private ? '<span class="private-badge">Private</span>' : ''}
      </div>

      <div class="project-card-desc">
        ${repo.description || '<span style="opacity:0.5; font-style:italic;">No description</span>'}
      </div>

      <div class="project-card-footer">
        ${repo.language ? `
          <div class="project-lang">
            <span class="lang-dot" style="background:${langColor}"></span>
            ${repo.language}
          </div>
        ` : '<span></span>'}

        <div class="project-stats">
          <span class="project-stat">
            <span class="material-symbols-rounded">star</span>${repo.stargazers_count}
          </span>
          <span class="project-stat">
            <span class="material-symbols-rounded">call_split</span>${repo.forks_count}
          </span>
        </div>
      </div>

      <div class="project-updated">
        Updated ${formatRelativeTime(repo.updated_at)}
      </div>
    </button>
  `;
}

function renderSkeletons(count = 6) {
  return Array.from({ length: count }, (_, i) => `
    <div class="project-card-skeleton nm-card section-hidden stagger-${(i % 6) + 1}">
      <div class="skeleton skeleton-text w-60" style="height:16px;"></div>
      <div class="skeleton skeleton-text w-100" style="height:12px; margin-top:4px;"></div>
      <div class="skeleton skeleton-text w-80" style="height:12px;"></div>
      <div class="skeleton skeleton-text w-40" style="height:12px; margin-top:8px;"></div>
    </div>
  `).join('');
}

// ==========================================
// FILTER & SORT
// ==========================================
function applyFilters() {
  let result = [...allRepos];

  if (selectedLang) {
    result = result.filter(r => r.language === selectedLang);
  }

  switch (selectedSort) {
    case 'stars':   result.sort((a, b) => b.stargazers_count - a.stargazers_count); break;
    case 'forks':   result.sort((a, b) => b.forks_count - a.forks_count); break;
    case 'name':    result.sort((a, b) => a.name.localeCompare(b.name)); break;
    default:        result.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }

  filteredRepos = result;
  currentPage   = 1;
  renderPage();
  updateFilterIndicator();
}

function renderPage(append = false) {
  const grid   = document.getElementById('repos-grid');
  const lmWrap = document.getElementById('load-more-wrap');
  if (!grid) return;

  const start    = (currentPage - 1) * PER_PAGE;
  const end      = currentPage * PER_PAGE;
  const pageData = filteredRepos.slice(start, end);
  const hasMore  = end < filteredRepos.length;

  if (!filteredRepos.length) {
    grid.innerHTML = `
      <div class="projects-empty" style="grid-column:1/-1;">
        <span class="material-symbols-rounded">search_off</span>
        <h3>No repos found</h3>
        <p>Try changing the filter or sort options.</p>
      </div>
    `;
    if (lmWrap) lmWrap.style.display = 'none';
    return;
  }

  if (append) {
    pageData.forEach((repo, i) => {
      const div = document.createElement('div');
      div.innerHTML = renderRepoCard(repo, start + i);
      const card = div.firstElementChild;
      grid.appendChild(card);
      addRipple(card, true);
    });
  } else {
    grid.innerHTML = pageData.map((repo, i) => renderRepoCard(repo, i)).join('');
    grid.querySelectorAll('.project-card').forEach(c => addRipple(c, true));
  }

  initScrollReveal(grid);
  if (lmWrap) lmWrap.style.display = hasMore ? 'flex' : 'none';
}

function updateFilterIndicator() {
  const indicator   = document.getElementById('filter-indicator');
  const langChip    = document.getElementById('active-lang-chip');
  const langText    = document.getElementById('active-lang-text');
  const langDot     = document.getElementById('active-lang-dot');
  const sortChip    = document.getElementById('active-sort-chip');
  const sortText    = document.getElementById('active-sort-text');
  if (!indicator) return;

  const hasLang = !!selectedLang;
  const hasSort = selectedSort !== 'updated';

  if (langChip) {
    if (hasLang) {
      langChip.style.display = 'inline-flex';
      if (langText) langText.textContent = selectedLang;
      if (langDot) langDot.style.background = getLangColor(selectedLang);
    } else {
      langChip.style.display = 'none';
    }
  }

  if (sortChip) {
    if (hasSort) {
      sortChip.style.display = 'inline-flex';
      const labels = { stars: 'Stars', forks: 'Forks', name: 'Name A-Z' };
      if (sortText) sortText.textContent = labels[selectedSort] || selectedSort;
    } else {
      sortChip.style.display = 'none';
    }
  }

  if (indicator) indicator.style.display = (hasLang || hasSort) ? 'flex' : 'none';
}

// ==========================================
// LANGUAGE CHIPS (in filter sheet)
// ==========================================
function buildLangChips() {
  const langs = [...new Set(allRepos.map(r => r.language).filter(Boolean))].sort();
  const container = document.getElementById('lang-filter-chips');
  if (!container) return;

  container.innerHTML = `
    <button class="md-chip ${!selectedLang ? 'active' : ''}" data-lang="">All</button>
    ${langs.map(lang => `
      <button class="md-chip ${selectedLang === lang ? 'active' : ''}" data-lang="${lang}">
        <span class="lang-dot" style="background:${getLangColor(lang)}; display:inline-block;"></span>
        ${lang}
      </button>
    `).join('')}
  `;

  container.querySelectorAll('.md-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.md-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });
}

// ==========================================
// FETCH REPOS
// ==========================================
async function loadRepos() {
  const grid = document.getElementById('repos-grid');
  if (!grid) return;

  try {
    const res = await fetch('data/profile.json');
    const profile = await res.json();
    username = profile.username?.trim() || '';
  } catch { username = ''; }

  if (!username) {
    document.getElementById('repos-grid').innerHTML = `
      <div class="projects-empty" style="grid-column:1/-1;">
        <span class="material-symbols-rounded">manage_accounts</span>
        <h3>GitHub username not set</h3>
        <p>Go to Admin → Profile and enter your GitHub username.</p>
        <a href="#admin" class="md-btn-filled" style="margin-top:8px;">Open Admin</a>
      </div>
    `;
    return;
  }

  // Fetch all pages (up to 3 pages = 90 repos)
  try {
    const [p1, p2, p3] = await Promise.allSettled([
      getUserRepos(username, null, 30, 'updated', 1),
      getUserRepos(username, null, 30, 'updated', 2),
      getUserRepos(username, null, 30, 'updated', 3),
    ]);

    allRepos = [
      ...(p1.status === 'fulfilled' ? p1.value : []),
      ...(p2.status === 'fulfilled' ? p2.value : []),
      ...(p3.status === 'fulfilled' ? p3.value : []),
    ];

    if (!allRepos.length) throw new Error('No repos');

    buildLangChips();
    applyFilters();

  } catch (e) {
    grid.innerHTML = `
      <div class="projects-empty" style="grid-column:1/-1;">
        <span class="material-symbols-rounded">wifi_off</span>
        <h3>Could not load repos</h3>
        <p>Check your connection or try again later.</p>
        <button class="md-btn-filled" onclick="window.location.reload()" style="margin-top:8px;">Retry</button>
      </div>
    `;
  }
}

// ==========================================
// FILTER SHEET EVENTS
// ==========================================
function initFilterSheet() {
  // Open
  document.getElementById('filter-btn')?.addEventListener('click', () => {
    buildLangChips();
    syncSheetToState();
    openBottomSheet('filter-scrim');
  });

  // Apply
  document.getElementById('filter-apply-btn')?.addEventListener('click', () => {
    const activeLang = document.querySelector('#lang-filter-chips .md-chip.active');
    const activeSort = document.querySelector('#sort-chips .md-chip.active');
    selectedLang = activeLang?.dataset.lang || '';
    selectedSort = activeSort?.dataset.sort || 'updated';
    closeBottomSheet('filter-scrim');
    applyFilters();
  });

  // Reset
  document.getElementById('filter-reset-btn')?.addEventListener('click', () => {
    selectedLang = '';
    selectedSort = 'updated';
    buildLangChips();
    syncSheetToState();
  });

  // Sort chips
  document.getElementById('sort-chips')?.addEventListener('click', e => {
    const chip = e.target.closest('.md-chip');
    if (!chip) return;
    document.querySelectorAll('#sort-chips .md-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  });

  // Active lang chip (remove filter)
  document.getElementById('active-lang-chip')?.addEventListener('click', () => {
    selectedLang = '';
    applyFilters();
  });
}

function syncSheetToState() {
  // Sync lang chips
  document.querySelectorAll('#lang-filter-chips .md-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.lang === selectedLang);
  });
  // Sync sort chips
  document.querySelectorAll('#sort-chips .md-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.sort === selectedSort);
  });
}

// ==========================================
// LOAD MORE
// ==========================================
function initLoadMore() {
  document.getElementById('load-more-btn')?.addEventListener('click', () => {
    currentPage++;
    renderPage(true);
  });
}

// ==========================================
// INIT
// ==========================================
export async function init() {
  initFilterSheet();
  initLoadMore();
  await loadRepos();
}

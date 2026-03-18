// ==========================================
// pages/home.js — Home Page Logic
// ==========================================

import { getUserProfile, getUserRepos } from '../github-api.js';
import { formatRelativeTime, formatDate, getLangColor, showToast, addRipple, initScrollReveal } from '../utils.js';

// ==========================================
// TYPEWRITER
// ==========================================
let typewriterTimer = null;

function startTypewriter(roles) {
  const el = document.getElementById('hero-role');
  if (!el || !roles?.length) return;

  let roleIdx = 0;
  let charIdx = 0;
  let deleting = false;
  let pausing = false;

  function tick() {
    if (!document.getElementById('hero-role')) {
      clearTimeout(typewriterTimer);
      return;
    }

    const current = roles[roleIdx];

    if (pausing) {
      pausing = false;
      deleting = true;
      typewriterTimer = setTimeout(tick, 2000);
      return;
    }

    if (!deleting) {
      el.textContent = current.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx === current.length) {
        pausing = true;
        typewriterTimer = setTimeout(tick, 100);
      } else {
        typewriterTimer = setTimeout(tick, 80);
      }
    } else {
      el.textContent = current.slice(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        roleIdx = (roleIdx + 1) % roles.length;
        typewriterTimer = setTimeout(tick, 400);
      } else {
        typewriterTimer = setTimeout(tick, 40);
      }
    }
  }

  tick();
}

// ==========================================
// SOCIAL ICONS
// ==========================================
const SOCIAL_ICONS = {
  github: {
    label: 'GitHub',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>`
  },
  facebook: {
    label: 'Facebook',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>`
  },
  whatsapp: {
    label: 'WhatsApp',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>`
  },
  linkedin: {
    label: 'LinkedIn',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>`
  },
  twitter: {
    label: 'Twitter / X',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>`
  }
};

function renderSocials(social) {
  const container = document.getElementById('hero-socials');
  if (!container) return;

  const links = [];
  if (social?.github) links.push({ key: 'github', url: social.github });
  if (social?.facebook) links.push({ key: 'facebook', url: social.facebook });
  if (social?.whatsapp) links.push({ key: 'whatsapp', url: social.whatsapp });
  if (social?.linkedin) links.push({ key: 'linkedin', url: social.linkedin });
  if (social?.twitter) links.push({ key: 'twitter', url: social.twitter });

  if (!links.length) {
    container.style.display = 'none';
    return;
  }

  container.innerHTML = links.map(({ key, url }) => {
    const icon = SOCIAL_ICONS[key];
    return `
      <a href="${url}" target="_blank" rel="noopener noreferrer"
         class="social-icon-btn pressable" title="${icon?.label || key}" aria-label="${icon?.label || key}">
        ${icon?.svg || `<span class="material-symbols-rounded">link</span>`}
      </a>
    `;
  }).join('');

  // Apply ripple to social buttons
  container.querySelectorAll('.social-icon-btn').forEach(btn => addRipple(btn, true));
}

// ==========================================
// TRACKING CARD
// ==========================================
async function loadTracking() {
  try {
    const res = await fetch('data/tracking.json');
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();

    const topicEl = document.getElementById('tracking-topic');
    const barEl = document.getElementById('tracking-bar');
    const pctEl = document.getElementById('tracking-pct');
    const dateEl = document.querySelector('#tracking-date span:last-child');
    const resourceEl = document.getElementById('tracking-resource');

    if (topicEl) topicEl.textContent = data.topic || 'Nothing yet';

    if (barEl && pctEl) {
      const pct = Math.min(100, Math.max(0, data.progress || 0));
      pctEl.textContent = `${pct}%`;
      // Animate after a short delay (for scroll reveal)
      setTimeout(() => {
        barEl.style.width = `${pct}%`;
      }, 300);
    }

    if (dateEl && data.startDate) {
      dateEl.textContent = `Started ${formatDate(data.startDate)}`;
    }

    if (resourceEl && data.resource) {
      resourceEl.href = data.resource;
      resourceEl.querySelector('.material-symbols-rounded').nextSibling
        ? null
        : null;
      resourceEl.innerHTML = `
        <span class="material-symbols-rounded" style="font-size:16px;">open_in_new</span>
        ${data.resourceLabel || 'Resource'}
      `;
      resourceEl.style.display = 'inline-flex';
    }
  } catch {
    const topicEl = document.getElementById('tracking-topic');
    if (topicEl) topicEl.textContent = 'Set topic in Admin';
  }
}

// ==========================================
// GITHUB STATS
// ==========================================
async function loadGithubStats(username) {
  const statsRow = document.getElementById('stats-row');
  if (!statsRow) return;

  if (!username) {
    statsRow.innerHTML = `
      <div class="stat-chip" style="grid-column: 1 / -1;">
        <span class="material-symbols-rounded stat-icon">info</span>
        <span class="stat-label">Set GitHub username in Admin to see stats</span>
      </div>
    `;
    return;
  }

  try {
    const profile = await getUserProfile(username);

    const ghLink = document.getElementById('github-profile-link');
    if (ghLink) {
      ghLink.href = profile.html_url;
      ghLink.style.display = 'inline-flex';
    }

    statsRow.innerHTML = `
      <div class="stat-chip section-hidden stagger-1">
        <span class="material-symbols-rounded stat-icon">folder</span>
        <span class="stat-value">${profile.public_repos ?? 0}</span>
        <span class="stat-label">Repos</span>
      </div>
      <div class="stat-chip section-hidden stagger-2">
        <span class="material-symbols-rounded stat-icon">group</span>
        <span class="stat-value">${profile.followers ?? 0}</span>
        <span class="stat-label">Followers</span>
      </div>
      <div class="stat-chip section-hidden stagger-3">
        <span class="material-symbols-rounded stat-icon">person_add</span>
        <span class="stat-value">${profile.following ?? 0}</span>
        <span class="stat-label">Following</span>
      </div>
    `;

    initScrollReveal(statsRow.parentElement);
  } catch (e) {
    statsRow.innerHTML = `
      <div class="stat-chip" style="grid-column: 1 / -1;">
        <span class="material-symbols-rounded stat-icon">error</span>
        <span class="stat-label">Could not load GitHub stats</span>
      </div>
    `;
  }
}

// ==========================================
// FEATURED REPOS
// ==========================================
async function loadFeaturedRepos(username) {
  const container = document.getElementById('featured-repos');
  if (!container) return;

  if (!username) {
    container.innerHTML = `
      <div class="nm-card" style="min-width: 260px; text-align:center; color: var(--md-on-surface-variant);">
        <span class="material-symbols-rounded" style="font-size:32px; display:block; margin-bottom:8px;">code_off</span>
        <p style="font-size:13px;">Set GitHub username in Admin to show repos</p>
      </div>
    `;
    return;
  }

  try {
    const repos = await getUserRepos(username, null, 10, 'updated');
    const filtered = repos.filter(r => !r.fork).slice(0, 4);

    if (!filtered.length) {
      container.innerHTML = `
        <div class="nm-card" style="min-width:260px; text-align:center; color:var(--md-on-surface-variant);">
          <p style="font-size:13px;">No public repos found</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((repo, i) => {
      const langColor = getLangColor(repo.language);
      return `
        <button class="repo-card pressable section-hidden stagger-${i + 1}"
                onclick="window.location.hash='repo/${username}/${repo.name}'"
                aria-label="Open ${repo.name} repository">
          <div class="repo-card-name">${repo.name}</div>
          <div class="repo-card-desc">${repo.description || 'No description'}</div>
          <div class="repo-card-meta">
            ${repo.language ? `
              <div class="repo-lang">
                <span class="lang-dot" style="background:${langColor}"></span>
                ${repo.language}
              </div>
            ` : ''}
            <div class="repo-stats">
              <span class="repo-stat">
                <span class="material-symbols-rounded">star</span>
                ${repo.stargazers_count}
              </span>
              <span class="repo-stat">
                <span class="material-symbols-rounded">call_split</span>
                ${repo.forks_count}
              </span>
            </div>
          </div>
          <div class="repo-updated">Updated ${formatRelativeTime(repo.updated_at)}</div>
        </button>
      `;
    }).join('');

    // Re-init scroll reveal for new cards
    initScrollReveal(container);

    // Add ripple
    container.querySelectorAll('.repo-card').forEach(card => addRipple(card, true));

  } catch (e) {
    container.innerHTML = `
      <div class="nm-card" style="min-width:260px; color:var(--md-on-surface-variant); text-align:center;">
        <span class="material-symbols-rounded" style="font-size:28px; display:block; margin-bottom:8px;">wifi_off</span>
        <p style="font-size:13px;">Could not load repos. Check connection.</p>
      </div>
    `;
  }
}

// ==========================================
// SKILLS PREVIEW
// ==========================================
function renderSkillsPreview(skills) {
  const container = document.getElementById('skills-chips');
  if (!container || !skills?.length) return;

  container.innerHTML = skills.map(skill => `
    <button class="md-chip" onclick="window.location.hash='skills'" style="cursor:pointer;">
      ${skill}
    </button>
  `).join('');
}

// ==========================================
// HERO PROFILE
// ==========================================
function renderHero(profile) {
  const nameEl = document.getElementById('hero-name');
  const bioEl = document.getElementById('hero-bio');
  const avatarEl = document.getElementById('hero-avatar');
  const avatarPlaceholder = document.getElementById('hero-avatar-placeholder');
  const locationEl = document.getElementById('hero-location');
  const locationText = document.getElementById('hero-location-text');

  if (nameEl) nameEl.textContent = profile.name || 'Your Name';
  if (bioEl) bioEl.textContent = profile.bio || '';

  if (profile.avatar) {
    avatarEl.src = profile.avatar;
    avatarEl.style.display = 'block';
    avatarEl.onerror = () => {
      avatarEl.style.display = 'none';
      if (avatarPlaceholder) {
        avatarPlaceholder.style.display = 'flex';
        avatarPlaceholder.textContent = (profile.name || 'U').charAt(0).toUpperCase();
      }
    };
    if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
  } else if (avatarPlaceholder) {
    avatarPlaceholder.textContent = (profile.name || 'U').charAt(0).toUpperCase();
  }

  if (profile.location && locationEl && locationText) {
    locationText.textContent = profile.location;
    locationEl.style.display = 'inline-flex';
  }

  // Roles → typewriter
  if (profile.roles?.length) {
    startTypewriter(profile.roles);
  }

  // Social links
  renderSocials(profile.social);

  // Skills preview
  if (profile.skills?.length) {
    renderSkillsPreview(profile.skills);
  }
}

// ==========================================
// MAIN INIT
// ==========================================
export async function init() {
  // Stop previous typewriter if navigating back to home
  if (typewriterTimer) {
    clearTimeout(typewriterTimer);
    typewriterTimer = null;
  }

  // Init scroll reveal for static sections
  initScrollReveal(document.getElementById('app-content'));

  // Load tracking (no username needed)
  loadTracking();

  // Load profile
  try {
    const res = await fetch('data/profile.json');
    const profile = await res.json();

    renderHero(profile);

    const username = profile.username?.trim();
    loadGithubStats(username);
    loadFeaturedRepos(username);

  } catch (e) {
    // Profile load failed — use defaults
    startTypewriter(['Developer', 'Problem Solver', 'Learner']);
    loadGithubStats('');
    loadFeaturedRepos('');
  }
}

// ==========================================
// admin.js — Admin Panel Logic (All 5 Tabs)
// ==========================================

import {
  isFirstSetup, setupAdmin, verifyPassword,
  isAuthenticated, setAuthenticated, lockAdmin,
  getPAT, getUsername, getRepoName, clearUsernameCache, resetAdmin
} from './auth.js';

import {
  getUserRepos, getRepoContents, createRepo,
  pushFile, getFileSha
} from './github-api.js';

import { showToast, openBottomSheet, closeBottomSheet, addRipple, formatDate } from './utils.js';

// ==========================================
// HELPERS
// ==========================================
function getRoot() { return document.getElementById('admin-root'); }

function showSaving(btnEl, state, msg) {
  if (!btnEl) return;
  if (state === 'loading') {
    btnEl.disabled = true;
    btnEl._origHTML = btnEl.innerHTML;
    btnEl.innerHTML = `<span class="spinner" style="width:18px;height:18px;border-width:2px;border-color:rgba(255,255,255,0.3);border-top-color:white;display:inline-block;"></span> Saving...`;
  } else if (state === 'done') {
    btnEl.disabled = false;
    btnEl.innerHTML = btnEl._origHTML || btnEl.innerHTML;
  }
}

async function confirmDelete(message) {
  return new Promise((resolve) => {
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `
      <div class="confirm-dialog-box">
        <div class="confirm-dialog-title">Confirm Delete</div>
        <div class="confirm-dialog-msg">${message}</div>
        <div class="confirm-dialog-actions">
          <button class="md-btn-text" id="confirm-cancel">Cancel</button>
          <button class="md-btn-danger" id="confirm-ok">Delete</button>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
    dialog.querySelector('#confirm-cancel').onclick = () => { dialog.remove(); resolve(false); };
    dialog.querySelector('#confirm-ok').onclick    = () => { dialog.remove(); resolve(true); };
  });
}

// Push a data JSON file to GitHub
async function pushDataFile(path, data, message) {
  const token    = getPAT();
  const username = await getUsername();
  const repo     = getRepoName();

  if (!token || !username) throw new Error('PAT or username missing. Check Admin → Profile.');

  const content = JSON.stringify(data, null, 2);
  const sha     = await getFileSha(username, repo, path, token);
  await pushFile(username, repo, path, content, message, sha, token);
}

// ==========================================
// SETUP SCREEN
// ==========================================
function renderSetupScreen() {
  const root = getRoot();
  root.innerHTML = `
    <div class="auth-screen">
      <div class="auth-logo"><span class="material-symbols-rounded">admin_panel_settings</span></div>
      <div>
        <div class="auth-title">Admin Setup</div>
        <div class="auth-subtitle">Set a password and add your GitHub PAT to enable admin features.</div>
      </div>

      <div class="auth-card">
        <div class="form-group">
          <label class="form-label">Password *</label>
          <div class="pw-input-wrap">
            <input id="setup-pw" type="password" class="nm-input" placeholder="Choose a strong password" autocomplete="new-password" />
            <button class="pw-toggle-btn" id="toggle-setup-pw" type="button" aria-label="Show/hide password">
              <span class="material-symbols-rounded">visibility</span>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Confirm Password *</label>
          <div class="pw-input-wrap">
            <input id="setup-pw2" type="password" class="nm-input" placeholder="Repeat password" autocomplete="new-password" />
            <button class="pw-toggle-btn" id="toggle-setup-pw2" type="button" aria-label="Show/hide password">
              <span class="material-symbols-rounded">visibility</span>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">GitHub PAT *</label>
          <div class="pw-input-wrap">
            <input id="setup-pat" type="password" class="nm-input" placeholder="github_pat_... or ghp_..." autocomplete="off" />
            <button class="pw-toggle-btn" id="toggle-pat" type="button" aria-label="Show/hide PAT">
              <span class="material-symbols-rounded">visibility</span>
            </button>
          </div>
          <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener"
             class="pat-help">How to get a GitHub PAT →</a>
        </div>

        <div class="form-group">
          <label class="form-label">Portfolio Repo Name</label>
          <input id="setup-repo" type="text" class="nm-input" placeholder="portfolio" value="portfolio" />
        </div>

        <button id="setup-btn" class="md-btn-filled" style="width:100%; padding:14px;">
          <span class="material-symbols-rounded">lock_open</span>
          Set Up Admin
        </button>
      </div>
    </div>
  `;

  // Toggle password visibility
  ['setup-pw','setup-pw2','setup-pat'].forEach(id => {
    const btn = document.getElementById(`toggle-${id === 'setup-pat' ? 'pat' : id === 'setup-pw2' ? 'setup-pw2' : 'setup-pw'}`);
    const inp = document.getElementById(id);
    if (!btn || !inp) return;
    btn.addEventListener('click', () => {
      const showing = inp.type === 'text';
      inp.type = showing ? 'password' : 'text';
      btn.querySelector('.material-symbols-rounded').textContent = showing ? 'visibility' : 'visibility_off';
    });
  });

  document.getElementById('setup-btn')?.addEventListener('click', async () => {
    const pw   = document.getElementById('setup-pw')?.value.trim();
    const pw2  = document.getElementById('setup-pw2')?.value.trim();
    const pat  = document.getElementById('setup-pat')?.value.trim();
    const repo = document.getElementById('setup-repo')?.value.trim() || 'portfolio';

    if (!pw || pw.length < 6) {
      showToast('Password must be at least 6 characters', 'error'); return;
    }
    if (pw !== pw2) {
      showToast('Passwords do not match', 'error');
      document.getElementById('setup-pw2')?.classList.add('input-shake');
      setTimeout(() => document.getElementById('setup-pw2')?.classList.remove('input-shake'), 500);
      return;
    }
    if (!pat || (!pat.startsWith('github_pat_') && !pat.startsWith('ghp_'))) {
      showToast('PAT must start with github_pat_ or ghp_', 'error'); return;
    }

    await setupAdmin(pw, pat, repo);
    setAuthenticated();
    showToast('Admin setup complete! 🎉', 'success');
    renderAdminPanel();
  });
}

// ==========================================
// LOGIN SCREEN
// ==========================================
function renderLoginScreen() {
  const root = getRoot();
  root.innerHTML = `
    <div class="auth-screen">
      <div class="auth-logo"><span class="material-symbols-rounded">lock</span></div>
      <div>
        <div class="auth-title">Admin 🔐</div>
        <div class="auth-subtitle">Enter your password to access the admin panel.</div>
      </div>

      <div class="auth-card">
        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="pw-input-wrap">
            <input id="login-pw" type="password" class="nm-input" placeholder="Your admin password"
                   autocomplete="current-password" autofocus />
            <button class="pw-toggle-btn" id="toggle-login-pw" type="button" aria-label="Show/hide password">
              <span class="material-symbols-rounded">visibility</span>
            </button>
          </div>
        </div>

        <button id="login-btn" class="md-btn-filled" style="width:100%; padding:14px;">
          <span class="material-symbols-rounded">lock_open</span>
          Unlock
        </button>

        <button id="reset-admin-btn" class="md-btn-text" style="font-size:12px; color:var(--md-outline); align-self:center; margin-top:4px;">
          Forgot password? Reset Admin
        </button>
      </div>
    </div>
  `;

  // Toggle
  const toggleBtn = document.getElementById('toggle-login-pw');
  const pwInput   = document.getElementById('login-pw');
  toggleBtn?.addEventListener('click', () => {
    const showing = pwInput.type === 'text';
    pwInput.type = showing ? 'password' : 'text';
    toggleBtn.querySelector('.material-symbols-rounded').textContent = showing ? 'visibility' : 'visibility_off';
  });

  // Enter key
  pwInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('login-btn')?.click();
  });

  // Login
  document.getElementById('login-btn')?.addEventListener('click', async () => {
    const pw = pwInput?.value || '';
    const ok = await verifyPassword(pw);
    if (ok) {
      setAuthenticated();
      renderAdminPanel();
    } else {
      showToast('Wrong password', 'error');
      pwInput?.classList.add('input-shake');
      setTimeout(() => pwInput?.classList.remove('input-shake'), 500);
      pwInput.value = '';
      pwInput.focus();
    }
  });

  // Reset admin (dangerous!)
  document.getElementById('reset-admin-btn')?.addEventListener('click', async () => {
    const confirmed = await confirmDelete('This will DELETE your admin password and PAT. You will need to set up admin again. Continue?');
    if (confirmed) {
      resetAdmin();
      showToast('Admin reset. Please set up again.', 'info');
      renderSetupScreen();
    }
  });
}

// ==========================================
// ADMIN PANEL
// ==========================================
function renderAdminPanel() {
  const root = getRoot();
  root.innerHTML = `
    <div class="admin-panel">

      <!-- Top bar -->
      <div class="admin-topbar">
        <div class="admin-title">Admin <span>Panel</span></div>
        <button id="lock-btn" class="lock-btn">
          <span class="material-symbols-rounded">lock</span>
          Lock
        </button>
      </div>

      <!-- Tab bar -->
      <div class="admin-tab-bar" role="tablist">
        <button class="admin-tab active" data-tab="profile" role="tab">
          <span class="material-symbols-rounded">person</span>Profile
        </button>
        <button class="admin-tab" data-tab="tracking" role="tab">
          <span class="material-symbols-rounded">trending_up</span>Tracking
        </button>
        <button class="admin-tab" data-tab="repos" role="tab">
          <span class="material-symbols-rounded">code</span>Repos
        </button>
        <button class="admin-tab" data-tab="blog" role="tab">
          <span class="material-symbols-rounded">article</span>Blog
        </button>
        <button class="admin-tab" data-tab="certs" role="tab">
          <span class="material-symbols-rounded">workspace_premium</span>Certs
        </button>
      </div>

      <!-- Tab panels -->
      <div id="tab-profile"  class="admin-tab-content active"></div>
      <div id="tab-tracking" class="admin-tab-content"></div>
      <div id="tab-repos"    class="admin-tab-content"></div>
      <div id="tab-blog"     class="admin-tab-content"></div>
      <div id="tab-certs"    class="admin-tab-content"></div>

    </div>
  `;

  // Lock button
  document.getElementById('lock-btn')?.addEventListener('click', () => {
    lockAdmin();
    showToast('Locked 🔒', 'info');
    renderLoginScreen();
  });

  // Tab switching
  let activeTab = 'profile';
  const tabInited = new Set();

  function switchTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.admin-tab-content').forEach(p =>
      p.classList.toggle('active', p.id === `tab-${tab}`));
    activeTab = tab;

    if (!tabInited.has(tab)) {
      tabInited.add(tab);
      switch(tab) {
        case 'profile':  initProfileTab();  break;
        case 'tracking': initTrackingTab(); break;
        case 'repos':    initReposTab();    break;
        case 'blog':     initBlogTab();     break;
        case 'certs':    initCertsTab();    break;
      }
    }
  }

  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Init first tab
  switchTab('profile');
}

// ==========================================
// TAB 1: PROFILE
// ==========================================
async function initProfileTab() {
  const panel = document.getElementById('tab-profile');
  panel.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`;

  let profile = {};
  try {
    const res = await fetch('data/profile.json');
    profile   = await res.json();
  } catch {}

  panel.innerHTML = `
    <div class="admin-section">
      <div class="admin-section-title">
        <span class="material-symbols-rounded">badge</span>Basic Info
      </div>

      <div class="form-group">
        <label class="form-label">GitHub Username *</label>
        <input id="p-username" type="text" class="nm-input" placeholder="your-github-username"
               value="${profile.username || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Display Name</label>
        <input id="p-name" type="text" class="nm-input" value="${profile.name || ''}" placeholder="M Rayhan" />
      </div>
      <div class="form-group">
        <label class="form-label">Bio</label>
        <textarea id="p-bio" class="nm-input" rows="3" placeholder="Short bio...">${profile.bio || ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Avatar URL</label>
        <input id="p-avatar" type="url" class="nm-input" value="${profile.avatar || ''}" placeholder="https://..." />
      </div>
      <div class="form-group">
        <label class="form-label">Location</label>
        <input id="p-location" type="text" class="nm-input" value="${profile.location || ''}" placeholder="Khulna, Bangladesh" />
      </div>
      <div class="form-group">
        <label class="form-label">University</label>
        <input id="p-university" type="text" class="nm-input" value="${profile.university || ''}" placeholder="North Western University" />
      </div>
    </div>

    <div class="admin-section">
      <div class="admin-section-title">
        <span class="material-symbols-rounded">link</span>Social Links
      </div>
      <div class="form-group">
        <label class="form-label">GitHub URL</label>
        <input id="p-github" type="url" class="nm-input" value="${profile.social?.github || ''}" placeholder="https://github.com/username" />
      </div>
      <div class="form-group">
        <label class="form-label">Facebook URL</label>
        <input id="p-facebook" type="url" class="nm-input" value="${profile.social?.facebook || ''}" placeholder="https://facebook.com/..." />
      </div>
      <div class="form-group">
        <label class="form-label">WhatsApp Link</label>
        <input id="p-whatsapp" type="url" class="nm-input" value="${profile.social?.whatsapp || ''}" placeholder="https://wa.me/..." />
      </div>
      <div class="form-group">
        <label class="form-label">LinkedIn URL</label>
        <input id="p-linkedin" type="url" class="nm-input" value="${profile.social?.linkedin || ''}" placeholder="https://linkedin.com/in/..." />
      </div>
      <div class="form-group">
        <label class="form-label">Twitter/X URL</label>
        <input id="p-twitter" type="url" class="nm-input" value="${profile.social?.twitter || ''}" placeholder="https://x.com/..." />
      </div>
    </div>

    <div class="admin-section">
      <div class="admin-section-title">
        <span class="material-symbols-rounded">settings</span>Config
      </div>
      <div class="form-group">
        <label class="form-label">Formspree URL</label>
        <input id="p-formspree" type="url" class="nm-input" value="${profile.formspree || ''}" placeholder="https://formspree.io/f/..." />
      </div>
      <div class="form-group">
        <label class="form-label">Roles (comma-separated)</label>
        <input id="p-roles" type="text" class="nm-input"
               value="${(profile.roles || []).join(', ')}"
               placeholder="AI Engineer (Aspiring), CSE Student" />
      </div>
      <div class="form-group">
        <label class="form-label">Skills (comma-separated)</label>
        <input id="p-skills" type="text" class="nm-input"
               value="${(profile.skills || []).join(', ')}"
               placeholder="Python, JavaScript, HTML" />
      </div>
    </div>

    <div class="admin-save-row">
      <button id="profile-save-btn" class="md-btn-filled">
        <span class="material-symbols-rounded">save</span>Save Profile
      </button>
    </div>
  `;

  document.getElementById('profile-save-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('profile-save-btn');
    showSaving(btn, 'loading');

    const newProfile = {
      username:   document.getElementById('p-username')?.value.trim() || '',
      name:       document.getElementById('p-name')?.value.trim() || '',
      bio:        document.getElementById('p-bio')?.value.trim() || '',
      avatar:     document.getElementById('p-avatar')?.value.trim() || '',
      location:   document.getElementById('p-location')?.value.trim() || '',
      university: document.getElementById('p-university')?.value.trim() || '',
      roles:  (document.getElementById('p-roles')?.value || '').split(',').map(s=>s.trim()).filter(Boolean),
      skills: (document.getElementById('p-skills')?.value || '').split(',').map(s=>s.trim()).filter(Boolean),
      social: {
        github:   document.getElementById('p-github')?.value.trim() || '',
        facebook: document.getElementById('p-facebook')?.value.trim() || '',
        whatsapp: document.getElementById('p-whatsapp')?.value.trim() || '',
        linkedin: document.getElementById('p-linkedin')?.value.trim() || '',
        twitter:  document.getElementById('p-twitter')?.value.trim() || '',
      },
      formspree: document.getElementById('p-formspree')?.value.trim() || '',
    };

    try {
      await pushDataFile('data/profile.json', newProfile, 'Update profile via Admin');
      clearUsernameCache();
      showToast('Profile saved! Vercel deploying... ✅', 'success');
    } catch (e) {
      showToast(`Save failed: ${e.message}`, 'error');
    }
    showSaving(btn, 'done');
  });
}

// ==========================================
// TAB 2: TRACKING
// ==========================================
async function initTrackingTab() {
  const panel = document.getElementById('tab-tracking');
  panel.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`;

  let data = {};
  try {
    const res = await fetch('data/tracking.json');
    data = await res.json();
  } catch {}

  const progress = data.progress ?? 0;

  panel.innerHTML = `
    <div class="admin-section">
      <div class="admin-section-title">
        <span class="material-symbols-rounded">trending_up</span>Currently Learning
      </div>

      <div class="form-group">
        <label class="form-label">Topic Name *</label>
        <input id="t-topic" type="text" class="nm-input" value="${data.topic || ''}"
               placeholder="Machine Learning with Python" />
      </div>

      <div class="form-group">
        <label class="form-label">Progress</label>
        <div class="range-wrap">
          <input id="t-progress" type="range" min="0" max="100" step="1" value="${progress}" />
          <span id="t-progress-val" class="range-value">${progress}%</span>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Start Date</label>
        <input id="t-date" type="date" class="nm-input" value="${data.startDate || ''}" />
      </div>

      <div class="form-group">
        <label class="form-label">Resource URL</label>
        <input id="t-resource" type="url" class="nm-input" value="${data.resource || ''}"
               placeholder="https://coursera.org/..." />
      </div>

      <div class="form-group">
        <label class="form-label">Resource Label</label>
        <input id="t-resource-label" type="text" class="nm-input" value="${data.resourceLabel || ''}"
               placeholder="Coursera ML Course" />
      </div>

      <div class="admin-save-row">
        <button id="tracking-save-btn" class="md-btn-filled">
          <span class="material-symbols-rounded">save</span>Save
        </button>
      </div>
    </div>
  `;

  // Live progress display
  document.getElementById('t-progress')?.addEventListener('input', (e) => {
    document.getElementById('t-progress-val').textContent = `${e.target.value}%`;
  });

  document.getElementById('tracking-save-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('tracking-save-btn');
    showSaving(btn, 'loading');

    const newData = {
      topic:         document.getElementById('t-topic')?.value.trim() || '',
      progress:      Number(document.getElementById('t-progress')?.value) || 0,
      startDate:     document.getElementById('t-date')?.value || '',
      resource:      document.getElementById('t-resource')?.value.trim() || '',
      resourceLabel: document.getElementById('t-resource-label')?.value.trim() || '',
    };

    try {
      await pushDataFile('data/tracking.json', newData, 'Update tracking via Admin');
      showToast('Tracking saved! ✅', 'success');
    } catch (e) {
      showToast(`Save failed: ${e.message}`, 'error');
    }
    showSaving(btn, 'done');
  });
}

// ==========================================
// TAB 3: REPOS
// ==========================================
async function initReposTab() {
  const panel = document.getElementById('tab-repos');
  panel.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`;

  const username = await getUsername();
  if (!username) {
    panel.innerHTML = `
      <div class="admin-section">
        <div class="admin-empty">
          <span class="material-symbols-rounded">person_off</span>
          Set your GitHub username in the Profile tab first.
        </div>
      </div>
    `;
    return;
  }

  renderRepoList(panel, username);
}

async function renderRepoList(panel, username) {
  panel.innerHTML = `
    <div class="admin-section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md);">
        <div class="admin-section-title" style="margin-bottom:0;">
          <span class="material-symbols-rounded">folder</span>${username}'s Repos
        </div>
        <button id="new-repo-btn" class="md-btn-filled" style="padding:8px 16px;font-size:13px;">
          <span class="material-symbols-rounded" style="font-size:16px;">add</span>New Repo
        </button>
      </div>
      <div id="repo-list-container">
        <div class="skeleton skeleton-text w-100" style="height:44px;margin-bottom:8px;border-radius:12px;"></div>
        <div class="skeleton skeleton-text w-100" style="height:44px;margin-bottom:8px;border-radius:12px;"></div>
        <div class="skeleton skeleton-text w-100" style="height:44px;border-radius:12px;"></div>
      </div>
    </div>
  `;

  document.getElementById('new-repo-btn')?.addEventListener('click', () => {
    openBottomSheet('new-repo-sheet');
    initNewRepoSheet(username, panel);
  });

  try {
    const repos = await getUserRepos(username, getPAT(), 30, 'updated');
    const container = document.getElementById('repo-list-container');
    if (!container) return;

    if (!repos.length) {
      container.innerHTML = `<div class="admin-empty"><span class="material-symbols-rounded">folder_open</span>No repos found.</div>`;
      return;
    }

    container.innerHTML = repos.map(repo => `
      <button class="repo-list-item" data-repo="${repo.name}" data-private="${repo.private}">
        <span class="material-symbols-rounded">${repo.private ? 'lock' : 'folder'}</span>
        <span class="repo-list-name">${repo.name}</span>
        <span class="repo-list-meta">⭐ ${repo.stargazers_count}</span>
        <span class="material-symbols-rounded" style="font-size:16px;color:var(--md-outline);">chevron_right</span>
      </button>
    `).join('');

    container.querySelectorAll('.repo-list-item').forEach(btn => {
      addRipple(btn, true);
      btn.addEventListener('click', () => renderRepoEditor(panel, username, btn.dataset.repo));
    });

  } catch (e) {
    document.getElementById('repo-list-container').innerHTML =
      `<div class="admin-empty"><span class="material-symbols-rounded">wifi_off</span>Could not load repos: ${e.message}</div>`;
  }
}

function initNewRepoSheet(username, panel) {
  const createBtn = document.getElementById('create-repo-btn');
  if (!createBtn || createBtn._inited) return;
  createBtn._inited = true;

  createBtn.addEventListener('click', async () => {
    const name    = document.getElementById('new-repo-name')?.value.trim();
    const desc    = document.getElementById('new-repo-desc')?.value.trim();
    const isPriv  = document.getElementById('new-repo-private')?.checked;

    if (!name) { showToast('Repo name is required', 'error'); return; }
    if (!/^[a-zA-Z0-9_.-]+$/.test(name)) { showToast('Invalid repo name', 'error'); return; }

    showSaving(createBtn, 'loading');
    try {
      await createRepo(name, desc, isPriv, getPAT());
      closeBottomSheet('new-repo-sheet');
      showToast(`Repo "${name}" created! ✅`, 'success');
      document.getElementById('new-repo-name').value = '';
      document.getElementById('new-repo-desc').value = '';
      renderRepoList(panel, username);
    } catch (e) {
      showToast(`Failed: ${e.message}`, 'error');
    }
    showSaving(createBtn, 'done');
  });
}

async function renderRepoEditor(panel, username, repoName) {
  panel.innerHTML = `
    <div class="admin-section">
      <div class="repo-editor-nav">
        <button class="icon-btn" id="repo-editor-back" aria-label="Back">
          <span class="material-symbols-rounded">arrow_back</span>
        </button>
        <div class="repo-editor-title">${repoName}</div>
        <button id="push-file-btn-top" class="md-btn-filled" style="padding:8px 16px;font-size:13px;margin-left:auto;">
          <span class="material-symbols-rounded" style="font-size:16px;">upload</span>Push File
        </button>
      </div>

      <div id="repo-editor-files">
        <div class="skeleton skeleton-text w-80" style="height:36px;margin-bottom:8px;border-radius:8px;"></div>
        <div class="skeleton skeleton-text w-60" style="height:36px;margin-bottom:8px;border-radius:8px;"></div>
        <div class="skeleton skeleton-text w-90" style="height:36px;border-radius:8px;"></div>
      </div>
    </div>
  `;

  document.getElementById('repo-editor-back')?.addEventListener('click', () => renderRepoList(panel, username));

  document.getElementById('push-file-btn-top')?.addEventListener('click', () => {
    openBottomSheet('new-file-sheet');
    initPushFileSheet(username, repoName);
  });

  try {
    const contents = await getRepoContents(username, repoName, '', 'main', getPAT());
    const filesEl  = document.getElementById('repo-editor-files');
    if (!filesEl) return;

    const items = Array.isArray(contents) ? contents : [contents];
    filesEl.innerHTML = `
      <div style="background:var(--nm-bg);box-shadow:var(--nm-raised);border-radius:var(--radius-md);overflow:hidden;">
        ${items.map(f => `
          <div class="repo-file-item">
            <span class="material-symbols-rounded">${f.type === 'dir' ? 'folder' : 'insert_drive_file'}</span>
            ${f.name}
            ${f.size ? `<span style="margin-left:auto;font-size:11px;color:var(--md-outline);font-family:var(--font-body);">${(f.size/1024).toFixed(1)} KB</span>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  } catch (e) {
    document.getElementById('repo-editor-files').innerHTML =
      `<div class="admin-empty"><span class="material-symbols-rounded">error</span>${e.message}</div>`;
  }
}

function initPushFileSheet(username, repoName) {
  const btn = document.getElementById('push-file-btn');
  if (!btn || btn._inited) return;
  btn._inited = true;

  btn.addEventListener('click', async () => {
    const path    = document.getElementById('new-file-path')?.value.trim();
    const content = document.getElementById('new-file-content')?.value;
    const msg     = document.getElementById('new-file-commit')?.value.trim() || 'Add file via Admin';

    if (!path)    { showToast('File path is required', 'error'); return; }
    if (!content) { showToast('File content is empty', 'error'); return; }

    showSaving(btn, 'loading');
    try {
      const sha = await getFileSha(username, repoName, path, getPAT());
      await pushFile(username, repoName, path, content, msg, sha, getPAT());
      closeBottomSheet('new-file-sheet');
      showToast(`Pushed "${path}" ✅`, 'success');
      document.getElementById('new-file-path').value    = '';
      document.getElementById('new-file-content').value = '';
    } catch (e) {
      showToast(`Push failed: ${e.message}`, 'error');
    }
    showSaving(btn, 'done');
  });
}

// ==========================================
// TAB 4: BLOG
// ==========================================
async function initBlogTab() {
  const panel = document.getElementById('tab-blog');
  await renderBlogList(panel);
}

async function renderBlogList(panel) {
  panel.innerHTML = `
    <div class="admin-section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md);">
        <div class="admin-section-title" style="margin-bottom:0;">
          <span class="material-symbols-rounded">article</span>Blog Posts
        </div>
        <button id="new-post-btn" class="md-btn-filled" style="padding:8px 16px;font-size:13px;">
          <span class="material-symbols-rounded" style="font-size:16px;">add</span>New Post
        </button>
      </div>
      <div id="blog-list-container">
        <div class="skeleton skeleton-text w-100" style="height:60px;border-radius:12px;"></div>
      </div>
    </div>
  `;

  document.getElementById('new-post-btn')?.addEventListener('click', () => {
    openNewPostSheet(null, panel);
  });

  let posts = [];
  try {
    const res = await fetch('data/blog-posts.json');
    posts = await res.json();
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch {}

  const container = document.getElementById('blog-list-container');
  if (!container) return;

  if (!posts.length) {
    container.innerHTML = `<div class="admin-empty"><span class="material-symbols-rounded">article</span>No posts yet. Create your first post!</div>`;
    return;
  }

  container.innerHTML = posts.map(post => `
    <div class="admin-list-item" data-id="${post.id}">
      <div class="admin-list-item-info">
        <div class="admin-list-item-title">${post.title}</div>
        <div class="admin-list-item-meta">${formatDate(post.date)} · ${post.readingTime || ''} · ${(post.tags||[]).join(', ')}</div>
      </div>
      <div class="admin-list-item-actions">
        <button class="admin-icon-btn-sm edit-post-btn" data-id="${post.id}" title="Edit">
          <span class="material-symbols-rounded">edit</span>
        </button>
        <button class="admin-icon-btn-sm delete delete-post-btn" data-id="${post.id}" title="Delete">
          <span class="material-symbols-rounded">delete</span>
        </button>
      </div>
    </div>
  `).join('');

  // Edit
  container.querySelectorAll('.edit-post-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const post = posts.find(p => p.id === btn.dataset.id);
      if (post) openNewPostSheet(post, panel);
    });
  });

  // Delete
  container.querySelectorAll('.delete-post-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const post = posts.find(p => p.id === btn.dataset.id);
      const confirmed = await confirmDelete(`Delete "${post?.title}"? This cannot be undone.`);
      if (!confirmed) return;

      try {
        const updated = posts.filter(p => p.id !== btn.dataset.id);
        await pushDataFile('data/blog-posts.json', updated, `Delete post: ${post?.title}`);
        showToast('Post deleted ✅', 'success');
        renderBlogList(panel);
      } catch (e) {
        showToast(`Failed: ${e.message}`, 'error');
      }
    });
  });
}

function openNewPostSheet(existingPost, panel) {
  // Populate form
  document.getElementById('blog-sheet-title').textContent = existingPost ? 'Edit Post' : 'New Post';
  document.getElementById('blog-edit-id').value        = existingPost?.id || '';
  document.getElementById('blog-title').value          = existingPost?.title || '';
  document.getElementById('blog-tags').value           = (existingPost?.tags || []).join(', ');
  document.getElementById('blog-reading-time').value   = existingPost?.readingTime || '';
  document.getElementById('blog-excerpt').value        = existingPost?.excerpt || '';
  document.getElementById('blog-content').value        = existingPost?.content || '';

  openBottomSheet('blog-sheet');

  const publishBtn = document.getElementById('blog-publish-btn');
  publishBtn._handler && publishBtn.removeEventListener('click', publishBtn._handler);

  publishBtn._handler = async () => {
    const title   = document.getElementById('blog-title')?.value.trim();
    const content = document.getElementById('blog-content')?.value.trim();
    if (!title || !content) { showToast('Title and content are required', 'error'); return; }

    showSaving(publishBtn, 'loading');
    try {
      const res   = await fetch('data/blog-posts.json');
      let posts   = await res.json();

      const editId = document.getElementById('blog-edit-id')?.value;
      const newPost = {
        id:          editId || String(Date.now()),
        title,
        date:        editId ? (posts.find(p=>p.id===editId)?.date || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
        tags:        (document.getElementById('blog-tags')?.value || '').split(',').map(s=>s.trim()).filter(Boolean),
        excerpt:     document.getElementById('blog-excerpt')?.value.trim() || content.slice(0, 120) + '...',
        content,
        readingTime: document.getElementById('blog-reading-time')?.value.trim() || `${Math.ceil(content.split(' ').length / 200)} min`,
      };

      if (editId) {
        posts = posts.map(p => p.id === editId ? newPost : p);
      } else {
        posts.unshift(newPost);
      }

      await pushDataFile('data/blog-posts.json', posts, `${editId ? 'Update' : 'Add'} post: ${title}`);
      closeBottomSheet('blog-sheet');
      showToast(`Post ${editId ? 'updated' : 'published'} ✅`, 'success');
      renderBlogList(panel);
    } catch (e) {
      showToast(`Failed: ${e.message}`, 'error');
    }
    showSaving(publishBtn, 'done');
  };
  publishBtn.addEventListener('click', publishBtn._handler);
}

// ==========================================
// TAB 5: CERTIFICATIONS
// ==========================================
async function initCertsTab() {
  const panel = document.getElementById('tab-certs');
  await renderCertList(panel);
}

async function renderCertList(panel) {
  panel.innerHTML = `
    <div class="admin-section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md);">
        <div class="admin-section-title" style="margin-bottom:0;">
          <span class="material-symbols-rounded">workspace_premium</span>Certifications
        </div>
        <button id="new-cert-btn" class="md-btn-filled" style="padding:8px 16px;font-size:13px;">
          <span class="material-symbols-rounded" style="font-size:16px;">add</span>Add
        </button>
      </div>
      <div id="cert-list-container">
        <div class="skeleton skeleton-text w-100" style="height:60px;border-radius:12px;"></div>
      </div>
    </div>
  `;

  document.getElementById('new-cert-btn')?.addEventListener('click', () => openCertSheet(null, panel));

  let certs = [];
  try {
    const res = await fetch('data/certifications.json');
    certs = await res.json();
    certs.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch {}

  const container = document.getElementById('cert-list-container');
  if (!container) return;

  if (!certs.length) {
    container.innerHTML = `<div class="admin-empty"><span class="material-symbols-rounded">workspace_premium</span>No certs yet. Add your first!</div>`;
    return;
  }

  container.innerHTML = certs.map(cert => `
    <div class="admin-list-item" style="border-left:3px solid ${cert.color || 'var(--md-primary)'};border-radius:var(--radius-md);">
      <div class="admin-list-item-info">
        <div class="admin-list-item-title">${cert.name}</div>
        <div class="admin-list-item-meta">${cert.issuer} · ${formatDate(cert.date)}</div>
      </div>
      <div class="admin-list-item-actions">
        <button class="admin-icon-btn-sm edit-cert-btn" data-id="${cert.id}" title="Edit">
          <span class="material-symbols-rounded">edit</span>
        </button>
        <button class="admin-icon-btn-sm delete delete-cert-btn" data-id="${cert.id}" title="Delete">
          <span class="material-symbols-rounded">delete</span>
        </button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.edit-cert-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cert = certs.find(c => c.id === btn.dataset.id);
      if (cert) openCertSheet(cert, panel);
    });
  });

  container.querySelectorAll('.delete-cert-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const cert = certs.find(c => c.id === btn.dataset.id);
      const confirmed = await confirmDelete(`Delete "${cert?.name}"?`);
      if (!confirmed) return;
      try {
        const updated = certs.filter(c => c.id !== btn.dataset.id);
        await pushDataFile('data/certifications.json', updated, `Delete cert: ${cert?.name}`);
        showToast('Cert deleted ✅', 'success');
        renderCertList(panel);
      } catch (e) {
        showToast(`Failed: ${e.message}`, 'error');
      }
    });
  });
}

function openCertSheet(existingCert, panel) {
  document.getElementById('cert-sheet-title').textContent = existingCert ? 'Edit Certification' : 'Add Certification';
  document.getElementById('cert-edit-id').value    = existingCert?.id || '';
  document.getElementById('cert-name').value       = existingCert?.name || '';
  document.getElementById('cert-issuer').value     = existingCert?.issuer || '';
  document.getElementById('cert-date').value       = existingCert?.date || '';
  document.getElementById('cert-color').value      = existingCert?.color || '#6750A4';
  document.getElementById('cert-verify-url').value = existingCert?.verifyUrl || '';

  openBottomSheet('cert-sheet');

  const saveBtn = document.getElementById('cert-save-btn');
  saveBtn._handler && saveBtn.removeEventListener('click', saveBtn._handler);

  saveBtn._handler = async () => {
    const name   = document.getElementById('cert-name')?.value.trim();
    const issuer = document.getElementById('cert-issuer')?.value.trim();
    if (!name || !issuer) { showToast('Name and issuer are required', 'error'); return; }

    showSaving(saveBtn, 'loading');
    try {
      const res   = await fetch('data/certifications.json');
      let certs   = await res.json();
      const editId = document.getElementById('cert-edit-id')?.value;

      const newCert = {
        id:        editId || String(Date.now()),
        name,
        issuer,
        date:      document.getElementById('cert-date')?.value || '',
        color:     document.getElementById('cert-color')?.value || '#6750A4',
        verifyUrl: document.getElementById('cert-verify-url')?.value.trim() || '',
      };

      if (editId) {
        certs = certs.map(c => c.id === editId ? newCert : c);
      } else {
        certs.unshift(newCert);
      }

      await pushDataFile('data/certifications.json', certs, `${editId ? 'Update' : 'Add'} cert: ${name}`);
      closeBottomSheet('cert-sheet');
      showToast(`Cert ${editId ? 'updated' : 'added'} ✅`, 'success');
      renderCertList(panel);
    } catch (e) {
      showToast(`Failed: ${e.message}`, 'error');
    }
    showSaving(saveBtn, 'done');
  };
  saveBtn.addEventListener('click', saveBtn._handler);
}

// ==========================================
// MAIN INIT (called by app.js router)
// ==========================================
export async function init() {
  if (isFirstSetup()) {
    renderSetupScreen();
  } else if (!isAuthenticated()) {
    renderLoginScreen();
  } else {
    renderAdminPanel();
  }
}

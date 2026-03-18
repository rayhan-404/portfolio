// ==========================================
// repo-viewer.js — In-App Repository Viewer
// ==========================================

import { getRepoContents, getReadme, getRepoBranches } from './github-api.js';
import { showToast, addRipple } from './utils.js';

// === File extension → highlight.js language map ===
const EXT_TO_HLJS = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  jsx: 'javascript',
  py: 'python',
  html: 'html', htm: 'html',
  css: 'css', scss: 'scss', sass: 'sass', less: 'less',
  json: 'json', jsonc: 'json',
  md: 'markdown', mdx: 'markdown',
  sh: 'bash', bash: 'bash', zsh: 'bash',
  c: 'c', h: 'c',
  cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp',
  java: 'java',
  kt: 'kotlin',
  go: 'go',
  rs: 'rust',
  php: 'php',
  rb: 'ruby',
  swift: 'swift',
  yaml: 'yaml', yml: 'yaml',
  toml: 'toml',
  xml: 'xml', svg: 'xml',
  sql: 'sql',
  dockerfile: 'dockerfile',
  gitignore: 'bash',
  env: 'bash',
  txt: 'plaintext',
};

// === File extension → Material Symbol icon map ===
const EXT_TO_ICON = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'javascript', tsx: 'javascript', jsx: 'javascript',
  py: 'code',
  html: 'html', htm: 'html',
  css: 'palette', scss: 'palette', sass: 'palette',
  json: 'data_object', jsonc: 'data_object',
  md: 'description', mdx: 'description',
  txt: 'text_snippet',
  sh: 'terminal', bash: 'terminal',
  c: 'code', h: 'code', cpp: 'code', cc: 'code',
  java: 'code', kt: 'code', go: 'code', rs: 'code',
  php: 'code', rb: 'code', swift: 'code',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', svg: 'image', webp: 'image', ico: 'image',
  pdf: 'picture_as_pdf',
  zip: 'folder_zip', tar: 'folder_zip', gz: 'folder_zip',
  mp3: 'audio_file', wav: 'audio_file',
  mp4: 'video_file', webm: 'video_file',
  default: 'insert_drive_file',
};

const IMAGE_EXTS = new Set(['png','jpg','jpeg','gif','svg','webp','ico','bmp']);
const TEXT_EXTS  = new Set(Object.keys(EXT_TO_HLJS));

function getExt(filename) {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

function getFileIcon(filename, isDir = false) {
  if (isDir) return 'folder';
  const ext = getExt(filename);
  return EXT_TO_ICON[ext] || EXT_TO_ICON.default;
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ==========================================
// STATE
// ==========================================
let state = {
  owner: '',
  repo: '',
  branch: 'main',
  branches: [],
  pathStack: [],   // array of { name, path }
  currentPath: '',
  inFileView: false,
};

// ==========================================
// BREADCRUMB
// ==========================================
function renderBreadcrumb() {
  const bar = document.getElementById('rv-breadcrumb');
  if (!bar) return;

  const crumbs = [
    { name: state.owner, path: null, action: () => window.location.hash = `projects` },
    { name: state.repo,  path: '',   action: () => navigateTo('') },
    ...state.pathStack,
  ];

  bar.innerHTML = crumbs.map((crumb, i) => {
    const isLast = i === crumbs.length - 1;
    return `
      ${i > 0 ? '<span class="breadcrumb-sep">/</span>' : ''}
      <button class="breadcrumb-item ${isLast ? 'active' : ''}"
              data-idx="${i}" aria-current="${isLast ? 'page' : 'false'}">
        ${crumb.name}
      </button>
    `;
  }).join('');

  // Click handlers
  bar.querySelectorAll('.breadcrumb-item:not(.active)').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      if (i === 0) {
        window.history.back();
      } else if (i === 1) {
        navigateTo('');
      } else {
        // Navigate to that depth
        const target = state.pathStack[i - 2];
        if (target) navigateTo(target.path);
      }
    });
  });
}

// ==========================================
// NAVIGATE TO PATH
// ==========================================
async function navigateTo(path) {
  state.currentPath = path;
  state.inFileView  = false;

  // Rebuild pathStack
  if (!path) {
    state.pathStack = [];
  } else {
    const parts = path.split('/');
    state.pathStack = parts.map((part, i) => ({
      name: part,
      path: parts.slice(0, i + 1).join('/'),
    }));
  }

  renderBreadcrumb();
  await loadTree(path);

  // Show README at root
  if (!path) {
    loadReadme();
  } else {
    const readmeEl = document.getElementById('rv-readme');
    if (readmeEl) readmeEl.style.display = 'none';
  }
}

// ==========================================
// FILE TREE
// ==========================================
async function loadTree(path = '') {
  const content = document.getElementById('rv-content');
  if (!content) return;

  content.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`;

  try {
    const items = await getRepoContents(state.owner, state.repo, path, state.branch);

    if (!Array.isArray(items)) {
      // It's a file, not a directory — open it
      await openFile(items);
      return;
    }

    // Sort: dirs first, then files alphabetically
    const sorted = items.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'dir' ? -1 : 1;
    });

    content.innerHTML = `
      <div class="file-tree">
        ${sorted.map(item => `
          <button
            class="file-tree-item"
            data-path="${item.path}"
            data-type="${item.type}"
            data-name="${item.name}"
            data-download="${item.download_url || ''}"
            data-encoding="${item.encoding || ''}"
            data-size="${item.size || 0}"
            aria-label="${item.type === 'dir' ? 'Open folder' : 'Open file'} ${item.name}">
            <span class="material-symbols-rounded file-icon ${item.type === 'dir' ? 'folder-icon' : ''}">
              ${getFileIcon(item.name, item.type === 'dir')}
            </span>
            <span class="file-name ${item.type === 'dir' ? 'folder' : ''}">${item.name}</span>
            ${item.type === 'file' && item.size
              ? `<span class="file-size">${formatBytes(item.size)}</span>`
              : ''}
            <span class="material-symbols-rounded chevron">chevron_right</span>
          </button>
        `).join('')}
      </div>
    `;

    // Click handlers
    content.querySelectorAll('.file-tree-item').forEach(btn => {
      addRipple(btn, true);
      btn.addEventListener('click', () => {
        const itemPath = btn.dataset.path;
        const itemType = btn.dataset.type;
        if (itemType === 'dir') {
          navigateTo(itemPath);
        } else {
          openFileByPath(itemPath, btn.dataset.name, btn.dataset.download, Number(btn.dataset.size));
        }
      });
    });

  } catch (e) {
    content.innerHTML = `
      <div class="nm-card" style="text-align:center; padding: 32px; color:var(--md-on-surface-variant);">
        <span class="material-symbols-rounded" style="font-size:48px; display:block; margin-bottom:12px; opacity:0.4;">folder_off</span>
        <p>Could not load files.<br><small>${e.message}</small></p>
      </div>
    `;
  }
}

// ==========================================
// OPEN FILE BY PATH
// ==========================================
async function openFileByPath(path, name, downloadUrl, size) {
  const ext = getExt(name);
  const content = document.getElementById('rv-content');
  if (!content) return;

  // Add to breadcrumb
  const pathParts = path.split('/');
  state.pathStack = pathParts.map((part, i) => ({
    name: part,
    path: pathParts.slice(0, i + 1).join('/'),
  }));
  state.inFileView = true;
  renderBreadcrumb();

  // Hide README in file view
  const readmeEl = document.getElementById('rv-readme');
  if (readmeEl) readmeEl.style.display = 'none';

  // Image preview
  if (IMAGE_EXTS.has(ext)) {
    content.innerHTML = `
      <div class="file-view">
        <div class="file-view-header">
          <span class="file-view-name">${name}</span>
          <div class="file-view-actions">
            ${downloadUrl ? `<a href="${downloadUrl}" target="_blank" class="md-btn-text" style="font-size:13px;">
              <span class="material-symbols-rounded" style="font-size:16px;">open_in_new</span>Raw
            </a>` : ''}
          </div>
        </div>
        <div class="image-preview">
          <img src="${downloadUrl}" alt="${name}" loading="lazy" />
        </div>
      </div>
    `;
    return;
  }

  // Large files / binary
  if (size > 500000 || (!TEXT_EXTS.has(ext) && ext !== '')) {
    content.innerHTML = `
      <div class="file-view">
        <div class="file-view-header">
          <span class="file-view-name">${name}</span>
          ${downloadUrl ? `<a href="${downloadUrl}" target="_blank" class="md-btn-outlined" style="font-size:13px;">
            <span class="material-symbols-rounded" style="font-size:16px;">download</span>Download
          </a>` : ''}
        </div>
        <div class="binary-notice">
          <span class="material-symbols-rounded">file_present</span>
          <p>Binary file — cannot display.<br><small>${formatBytes(size)}</small></p>
        </div>
      </div>
    `;
    return;
  }

  // Show loading
  content.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`;

  // Fetch file content
  try {
    const fileData = await getRepoContents(state.owner, state.repo, path, state.branch);
    await openFile(fileData);
  } catch (e) {
    content.innerHTML = `
      <div class="binary-notice">
        <span class="material-symbols-rounded">error</span>
        <p>Could not load file: ${e.message}</p>
      </div>
    `;
  }
}

// ==========================================
// OPEN FILE (from API response)
// ==========================================
async function openFile(fileData) {
  const content = document.getElementById('rv-content');
  if (!content) return;

  const name        = fileData.name;
  const ext         = getExt(name);
  const downloadUrl = fileData.download_url;
  const size        = fileData.size || 0;

  // Update breadcrumb
  if (!state.inFileView) {
    const pathParts = fileData.path.split('/');
    state.pathStack = pathParts.map((part, i) => ({
      name: part,
      path: pathParts.slice(0, i + 1).join('/'),
    }));
    state.inFileView = true;
    renderBreadcrumb();
  }

  // Image
  if (IMAGE_EXTS.has(ext)) {
    content.innerHTML = `
      <div class="file-view">
        <div class="file-view-header">
          <span class="file-view-name">${name}</span>
          ${downloadUrl ? `<a href="${downloadUrl}" target="_blank" class="md-btn-text">
            <span class="material-symbols-rounded" style="font-size:16px;">open_in_new</span>Raw
          </a>` : ''}
        </div>
        <div class="image-preview">
          <img src="${downloadUrl}" alt="${name}" loading="lazy" />
        </div>
      </div>
    `;
    return;
  }

  // Binary
  if (fileData.encoding === 'base64' && !TEXT_EXTS.has(ext) && ext !== '') {
    content.innerHTML = `
      <div class="file-view">
        <div class="file-view-header">
          <span class="file-view-name">${name}</span>
          ${downloadUrl ? `<a href="${downloadUrl}" target="_blank" class="md-btn-outlined">
            <span class="material-symbols-rounded" style="font-size:16px;">download</span>Download
          </a>` : ''}
        </div>
        <div class="binary-notice">
          <span class="material-symbols-rounded">file_present</span>
          <p>Binary file — cannot display.</p>
        </div>
      </div>
    `;
    return;
  }

  // Decode text
  let text = '';
  try {
    if (fileData.encoding === 'base64') {
      text = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ''))));
    } else {
      text = fileData.content || '';
    }
  } catch {
    text = fileData.content || '';
  }

  // Highlight
  const hljsLang = EXT_TO_HLJS[ext] || 'plaintext';
  let highlighted = '';
  try {
    highlighted = typeof hljs !== 'undefined'
      ? hljs.highlight(text, { language: hljsLang, ignoreIllegals: true }).value
      : escapeHtml(text);
  } catch {
    highlighted = escapeHtml(text);
  }

  // Line numbers
  const lines      = text.split('\n');
  const lineNums   = lines.map((_, i) => i + 1).join('\n');
  const lineCount  = lines.length;

  content.innerHTML = `
    <div class="file-view">
      <div class="file-view-header">
        <span class="file-view-name">
          <span class="material-symbols-rounded" style="font-size:16px; vertical-align:middle; margin-right:4px;">
            ${getFileIcon(name)}
          </span>
          ${name}
        </span>
        <div class="file-view-actions">
          <button id="copy-btn" class="md-btn-text" style="font-size:13px;">
            <span class="material-symbols-rounded" style="font-size:16px;">content_copy</span>
            Copy
          </button>
          ${downloadUrl ? `<a href="${downloadUrl}" target="_blank" rel="noopener" class="md-btn-text" style="font-size:13px;">
            <span class="material-symbols-rounded" style="font-size:16px;">open_in_new</span>
            Raw
          </a>` : ''}
        </div>
      </div>

      <div class="code-wrapper">
        <div class="code-line-numbers">
          <pre class="line-nums">${lineNums}</pre>
          <pre class="code-content"><code class="hljs language-${hljsLang}">${highlighted}</code></pre>
        </div>
      </div>

      <div style="font-size:11px; color:var(--md-outline); text-align:right; margin-top:4px;">
        ${lineCount} lines · ${formatBytes(size)} · ${hljsLang}
      </div>
    </div>
  `;

  // Copy button
  document.getElementById('copy-btn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied! 📋', 'success');
    } catch {
      showToast('Copy failed', 'error');
    }
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ==========================================
// README
// ==========================================
async function loadReadme() {
  const readmeSection = document.getElementById('rv-readme');
  const readmeBody    = document.getElementById('rv-readme-body');
  if (!readmeSection || !readmeBody) return;

  try {
    // First check if README exists
    const contents = await getRepoContents(state.owner, state.repo, '', state.branch);
    const hasReadme = Array.isArray(contents) &&
      contents.some(f => f.name.toLowerCase().startsWith('readme'));

    if (!hasReadme) return;

    readmeSection.style.display = 'block';

    const html = await getReadme(state.owner, state.repo);
    readmeBody.innerHTML = html;

    // Fix relative image URLs
    readmeBody.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http')) {
        img.src = `https://raw.githubusercontent.com/${state.owner}/${state.repo}/${state.branch}/${src}`;
      }
    });

    // Open links in new tab
    readmeBody.querySelectorAll('a').forEach(a => {
      a.target = '_blank';
      a.rel    = 'noopener noreferrer';
    });

  } catch {
    // README failed to load — silently hide
    if (readmeSection) readmeSection.style.display = 'none';
  }
}

// ==========================================
// BRANCH SWITCHER
// ==========================================
async function loadBranches() {
  try {
    const branches = await getRepoBranches(state.owner, state.repo);
    state.branches  = branches.map(b => b.name);

    // Try to detect default branch
    const main = state.branches.find(b => b === 'main' || b === 'master');
    if (main) state.branch = main;

    const nameEl = document.getElementById('rv-branch-name');
    if (nameEl) nameEl.textContent = state.branch;

    renderBranchDropdown();
  } catch {
    state.branches = [state.branch];
  }
}

function renderBranchDropdown() {
  const dropdown = document.getElementById('rv-branch-dropdown');
  if (!dropdown) return;

  dropdown.innerHTML = state.branches.map(b => `
    <button class="branch-option ${b === state.branch ? 'active' : ''}" data-branch="${b}">
      <span class="material-symbols-rounded">${b === state.branch ? 'check' : 'account_tree'}</span>
      ${b}
    </button>
  `).join('');

  dropdown.querySelectorAll('.branch-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const newBranch = btn.dataset.branch;
      if (newBranch === state.branch) {
        dropdown.classList.remove('open');
        return;
      }
      state.branch = newBranch;
      const nameEl = document.getElementById('rv-branch-name');
      if (nameEl) nameEl.textContent = newBranch;
      renderBranchDropdown();
      dropdown.classList.remove('open');
      navigateTo(''); // Reset to root on branch switch
    });
  });
}

// ==========================================
// BACK BUTTON
// ==========================================
function initBackBtn() {
  document.getElementById('rv-back-btn')?.addEventListener('click', () => {
    if (state.inFileView) {
      // Go back to parent folder
      const parentPath = state.pathStack.slice(0, -1).map(p => p.name).join('/');
      // Check if we were in a subfolder or at root
      if (state.pathStack.length <= 1) {
        navigateTo('');
      } else {
        const parentObj = state.pathStack[state.pathStack.length - 2];
        navigateTo(parentObj.path);
      }
    } else if (state.pathStack.length > 0) {
      // Go up one directory
      if (state.pathStack.length === 1) {
        navigateTo('');
      } else {
        const parentObj = state.pathStack[state.pathStack.length - 2];
        navigateTo(parentObj.path);
      }
    } else {
      // At root — go back to projects
      window.history.back();
    }
  });
}

// ==========================================
// BRANCH DROPDOWN TOGGLE
// ==========================================
function initBranchDropdown() {
  const btn      = document.getElementById('rv-branch-btn');
  const dropdown = document.getElementById('rv-branch-dropdown');

  btn?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown?.classList.toggle('open');
  });

  document.addEventListener('click', () => dropdown?.classList.remove('open'));
}

// ==========================================
// MAIN INIT (called by app.js router)
// ==========================================
export async function init({ owner, repo, path } = {}) {
  if (!owner || !repo) {
    document.getElementById('rv-content').innerHTML = `
      <div class="nm-card" style="text-align:center; padding:32px; color:var(--md-on-surface-variant);">
        <p>Invalid repo URL.</p>
        <a href="#projects" class="md-btn-filled" style="margin-top:12px;">← Projects</a>
      </div>
    `;
    return;
  }

  state.owner       = owner;
  state.repo        = repo;
  state.branch      = 'main';
  state.pathStack   = [];
  state.currentPath = '';
  state.inFileView  = false;

  // Set title
  const titleEl = document.getElementById('rv-repo-title');
  if (titleEl) titleEl.textContent = `${owner}/${repo}`;

  // Update top bar title
  const topTitle = document.getElementById('top-bar-title');
  if (topTitle) topTitle.textContent = repo;

  initBackBtn();
  initBranchDropdown();

  // Load branches first (to determine default)
  await loadBranches();

  // Navigate to path or root
  await navigateTo(path || '');
}

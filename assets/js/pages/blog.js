// ==========================================
// pages/blog.js — Blog Page Logic
// ==========================================

import { formatDate, showToast, addRipple, initScrollReveal } from '../utils.js';

let allPosts     = [];
let activeTag    = '';

// ==========================================
// RENDER TAG FILTER
// ==========================================
function renderTagFilter(posts) {
  const row = document.getElementById('tag-filter-row');
  if (!row) return;

  const allTags = [...new Set(posts.flatMap(p => p.tags || []))].sort();

  row.innerHTML = `
    <button class="md-chip ${!activeTag ? 'active' : ''}" data-tag="">All</button>
    ${allTags.map(tag => `
      <button class="md-chip ${activeTag === tag ? 'active' : ''}" data-tag="${tag}">
        ${tag}
      </button>
    `).join('')}
  `;

  row.querySelectorAll('.md-chip').forEach(chip => {
    addRipple(chip, false);
    chip.addEventListener('click', () => {
      activeTag = chip.dataset.tag;
      row.querySelectorAll('.md-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderPostList();
    });
  });
}

// ==========================================
// RENDER POST LIST
// ==========================================
function renderPostList() {
  const list = document.getElementById('posts-list');
  if (!list) return;

  const filtered = activeTag
    ? allPosts.filter(p => p.tags?.includes(activeTag))
    : allPosts;

  if (!filtered.length) {
    list.innerHTML = `
      <div class="blog-empty">
        <span class="material-symbols-rounded">article</span>
        <h3>${activeTag ? `No posts tagged "${activeTag}"` : 'No posts yet'}</h3>
        <p>${activeTag ? 'Try a different tag.' : 'Check back later or add posts via Admin.'}</p>
      </div>
    `;
    return;
  }

  list.innerHTML = filtered.map((post, i) => `
    <button class="post-card pressable section-hidden stagger-${(i % 6) + 1}"
            data-post-id="${post.id}" aria-label="Read ${post.title}">
      <div class="post-title">${post.title}</div>
      <div class="post-meta">
        <span class="post-meta-item">
          <span class="material-symbols-rounded">calendar_today</span>
          ${formatDate(post.date)}
        </span>
        <span class="post-meta-item">
          <span class="material-symbols-rounded">schedule</span>
          ${post.readingTime || '3 min'}
        </span>
      </div>
      ${post.tags?.length ? `
        <div class="post-tags">
          ${post.tags.map(t => `<span class="post-tag">${t}</span>`).join('')}
        </div>
      ` : ''}
      <div class="post-excerpt">${post.excerpt || ''}</div>
      <div class="post-read-more">
        Read more
        <span class="material-symbols-rounded">arrow_forward</span>
      </div>
    </button>
  `).join('');

  // Click handlers
  list.querySelectorAll('.post-card').forEach(card => {
    addRipple(card, true);
    card.addEventListener('click', () => {
      const post = allPosts.find(p => p.id === card.dataset.postId);
      if (post) openPost(post);
    });
    // Tag chip clicks inside card (stop propagation)
    card.querySelectorAll('.post-tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.stopPropagation();
        activeTag = tag.textContent.trim();
        renderTagFilter(allPosts);
        renderPostList();
      });
    });
  });

  initScrollReveal(list);
}

// ==========================================
// OPEN POST (full view)
// ==========================================
function openPost(post) {
  const appContent = document.getElementById('app-content');
  if (!appContent) return;

  // Render markdown
  let contentHtml = '';
  try {
    contentHtml = typeof marked !== 'undefined'
      ? marked.parse(post.content || '')
      : `<p>${post.content}</p>`;
  } catch {
    contentHtml = `<p>${post.content}</p>`;
  }

  appContent.innerHTML = `
    <div class="post-view">

      <button class="post-view-back" id="post-back-btn">
        <span class="material-symbols-rounded">arrow_back</span>
        Back to Blog
      </button>

      <h1 class="post-view-title">${post.title}</h1>

      <div class="post-view-meta">
        <span class="post-meta-item">
          <span class="material-symbols-rounded" style="font-size:14px;">calendar_today</span>
          ${formatDate(post.date)}
        </span>
        <span class="post-meta-item">
          <span class="material-symbols-rounded" style="font-size:14px;">schedule</span>
          ${post.readingTime || '3 min read'}
        </span>
      </div>

      ${post.tags?.length ? `
        <div class="post-tags">
          ${post.tags.map(t => `<span class="post-tag">${t}</span>`).join('')}
        </div>
      ` : ''}

      <div class="post-content">
        ${contentHtml}
      </div>

    </div>
  `;

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Back button
  document.getElementById('post-back-btn')?.addEventListener('click', () => {
    init(); // Re-init blog page
  });
}

// ==========================================
// INIT
// ==========================================
export async function init() {
  const list = document.getElementById('posts-list');
  const tagRow = document.getElementById('tag-filter-row');

  // Reset state
  activeTag = '';

  try {
    const res = await fetch('data/blog-posts.json');
    if (!res.ok) throw new Error('Failed');
    allPosts = await res.json();

    // Sort newest first
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    renderTagFilter(allPosts);
    renderPostList();

  } catch (e) {
    if (list) list.innerHTML = `
      <div class="blog-empty">
        <span class="material-symbols-rounded">wifi_off</span>
        <h3>Could not load posts</h3>
        <p>Check your connection and try again.</p>
      </div>
    `;
  }
}

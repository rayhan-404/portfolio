// ==========================================
// github-api.js — GitHub REST API Wrapper
// ==========================================

const BASE = 'https://api.github.com';

const getHeaders = (token = null) => {
  const headers = { 'Accept': 'application/vnd.github+json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

// === Generic fetch with error handling ===
async function ghFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 404) throw new Error('Not found (404)');
  if (res.status === 403) throw new Error('Rate limit exceeded or forbidden');
  if (res.status === 401) throw new Error('Unauthorized — check your PAT');
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res;
}

// ==========================================
// PUBLIC APIs (no auth needed)
// ==========================================

/**
 * Get user profile + stats
 * Returns: { login, name, bio, avatar_url, public_repos, followers, following, html_url }
 */
export async function getUserProfile(username, token = null) {
  const res = await ghFetch(`${BASE}/users/${username}`, {
    headers: getHeaders(token)
  });
  return res.json();
}

/**
 * Get user's repos
 */
export async function getUserRepos(username, token = null, perPage = 30, sort = 'updated', page = 1) {
  const url = `${BASE}/users/${username}/repos?sort=${sort}&per_page=${perPage}&page=${page}&direction=desc`;
  const res = await ghFetch(url, { headers: getHeaders(token) });
  return res.json();
}

/**
 * Get repo contents (file tree or file content)
 */
export async function getRepoContents(owner, repo, path = '', branch = 'main', token = null) {
  const url = `${BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  const res = await ghFetch(url, { headers: getHeaders(token) });
  return res.json();
}

/**
 * Get repo README rendered as HTML
 */
export async function getReadme(owner, repo, token = null) {
  const res = await ghFetch(`${BASE}/repos/${owner}/${repo}/readme`, {
    headers: {
      ...getHeaders(token),
      'Accept': 'application/vnd.github.html'
    }
  });
  return res.text();
}

/**
 * Get repo branches
 */
export async function getRepoBranches(owner, repo, token = null) {
  const res = await ghFetch(`${BASE}/repos/${owner}/${repo}/branches`, {
    headers: getHeaders(token)
  });
  return res.json();
}

// ==========================================
// AUTHENTICATED APIs (PAT required)
// ==========================================

/**
 * Create a new repository
 */
export async function createRepo(name, description, isPrivate, token) {
  const res = await ghFetch(`${BASE}/user/repos`, {
    method: 'POST',
    headers: { ...getHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, private: isPrivate, auto_init: true })
  });
  return res.json();
}

/**
 * Push / update a file in a repo
 * content: plain string (will be base64 encoded)
 * sha: required when updating existing file (get from getRepoContents)
 */
export async function pushFile(owner, repo, path, content, commitMessage, sha = null, token) {
  const body = {
    message: commitMessage,
    content: btoa(unescape(encodeURIComponent(content)))
  };
  if (sha) body.sha = sha;

  const res = await ghFetch(`${BASE}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { ...getHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

/**
 * Get current SHA of a file (needed before updating it)
 */
export async function getFileSha(owner, repo, path, token) {
  try {
    const res = await ghFetch(`${BASE}/repos/${owner}/${repo}/contents/${path}`, {
      headers: getHeaders(token)
    });
    const data = await res.json();
    return data.sha || null;
  } catch {
    return null; // File doesn't exist yet
  }
}

/**
 * Delete a repository
 */
export async function deleteRepo(owner, repo, token) {
  const res = await fetch(`${BASE}/repos/${owner}/${repo}`, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  if (res.status !== 204) throw new Error('Delete failed');
  return true;
}

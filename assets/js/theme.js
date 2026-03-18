// ==========================================
// theme.js — Dark / Light Theme Toggle
// ==========================================

const THEME_KEY = 'portfolio_theme';

export function getTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) return saved;
  // Respect system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  updateToggleIcon(theme);

  // Highlight.js stylesheet swap
  const hlLight = document.getElementById('hl-light');
  const hlDark = document.getElementById('hl-dark');
  if (hlLight && hlDark) {
    if (theme === 'dark') {
      hlLight.disabled = true;
      hlDark.disabled = false;
    } else {
      hlLight.disabled = false;
      hlDark.disabled = true;
    }
  }
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

function updateToggleIcon(theme) {
  const icon = document.getElementById('theme-icon');
  const sidebarIcon = document.getElementById('sidebar-theme-icon');
  const iconName = theme === 'dark' ? 'light_mode' : 'dark_mode';
  const label = theme === 'dark' ? 'Light Mode' : 'Dark Mode';

  if (icon) {
    icon.textContent = iconName;
    icon.classList.add('theme-icon-rotate');
    setTimeout(() => icon.classList.remove('theme-icon-rotate'), 400);
  }
  if (sidebarIcon) {
    sidebarIcon.textContent = iconName;
  }

  const sidebarLabel = document.getElementById('sidebar-theme-label');
  if (sidebarLabel) sidebarLabel.textContent = label;
}

export function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  saveTheme(next);
  return next;
}

export function initTheme() {
  const theme = getTheme();
  applyTheme(theme);

  // Theme toggle button (top bar)
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', toggleTheme);

  // Sidebar theme toggle
  const sidebarBtn = document.getElementById('sidebar-theme-toggle');
  if (sidebarBtn) sidebarBtn.addEventListener('click', toggleTheme);

  // System theme change listener
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}

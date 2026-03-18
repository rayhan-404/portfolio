// ==========================================
// pages/skills.js — Skills Page Logic
// ==========================================

import { initScrollReveal } from '../utils.js';

// === Hardcoded skills data (as per masterplan) ===
const SKILLS_DATA = [
  {
    category: 'Frontend',
    icon: '🎨',
    skills: [
      { name: 'HTML',         emoji: '🌐', level: 5 },
      { name: 'CSS',          emoji: '🎨', level: 5 },
      { name: 'JavaScript',   emoji: '⚡', level: 4 },
      { name: 'Responsive Design', emoji: '📱', level: 4 },
      { name: 'TailwindCSS',  emoji: '💨', level: 3 },
    ]
  },
  {
    category: 'Languages',
    icon: '💻',
    skills: [
      { name: 'Python',       emoji: '🐍', level: 4 },
      { name: 'C++',          emoji: '⚙️', level: 3 },
      { name: 'C',            emoji: '🔧', level: 3 },
      { name: 'JavaScript',   emoji: '⚡', level: 4 },
    ]
  },
  {
    category: 'AI / ML',
    icon: '🤖',
    skills: [
      { name: 'Machine Learning', emoji: '🧠', level: 2 },
      { name: 'NumPy',            emoji: '🔢', level: 2 },
      { name: 'Pandas',           emoji: '🐼', level: 2 },
      { name: 'Data Analysis',    emoji: '📊', level: 2 },
    ]
  },
  {
    category: 'Tools & DevOps',
    icon: '🛠️',
    skills: [
      { name: 'Git',          emoji: '🌿', level: 4 },
      { name: 'GitHub',       emoji: '🐙', level: 4 },
      { name: 'VS Code',      emoji: '📝', level: 5 },
      { name: 'Linux/CLI',    emoji: '🐧', level: 3 },
      { name: 'Vercel',       emoji: '▲', level: 3 },
    ]
  },
];

// ==========================================
// RENDER DOTS
// ==========================================
function renderDots(level, max = 5) {
  return Array.from({ length: max }, (_, i) => `
    <span class="skill-dot ${i < level ? 'filled' : 'empty'}"></span>
  `).join('');
}

// ==========================================
// RENDER CATEGORIES
// ==========================================
function renderCategories(profileSkills) {
  const container = document.getElementById('skills-categories');
  if (!container) return;

  container.innerHTML = SKILLS_DATA.map((cat, ci) => `
    <div class="skill-category section-hidden stagger-${(ci % 4) + 1}">
      <div class="skill-category-header">
        <span class="skill-category-icon">${cat.icon}</span>
        <h2 class="skill-category-title">${cat.category}</h2>
      </div>
      ${cat.skills.map(skill => `
        <div class="skill-row">
          <div class="skill-info">
            <span class="skill-emoji">${skill.emoji}</span>
            <span class="skill-name">${skill.name}</span>
          </div>
          <div class="skill-dots" title="${skill.level}/5">
            ${renderDots(skill.level)}
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');

  initScrollReveal(container);
}

// ==========================================
// RENDER SUMMARY CHIPS (from profile.json)
// ==========================================
function renderSummary(skills) {
  const container = document.getElementById('skills-summary');
  if (!container || !skills?.length) return;

  container.innerHTML = skills.map(skill => `
    <span class="md-chip active" style="cursor:default; font-size:13px;">${skill}</span>
  `).join('');
}

// ==========================================
// INIT
// ==========================================
export async function init() {
  // Load profile skills for summary chips
  let profileSkills = [];
  try {
    const res = await fetch('data/profile.json');
    const profile = await res.json();
    profileSkills = profile.skills || [];
  } catch { /* silently use empty */ }

  renderSummary(profileSkills);
  renderCategories(profileSkills);
  initScrollReveal(document.getElementById('app-content'));
}

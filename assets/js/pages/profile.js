// ==========================================
// pages/profile.js — Profile Page Logic
// ==========================================

import { addRipple, initScrollReveal } from '../utils.js';

export async function init() {
  try {
    const res     = await fetch('data/profile.json');
    const profile = await res.json();

    // Name
    const nameEl = document.getElementById('profile-name');
    if (nameEl) nameEl.textContent = profile.name || 'Your Name';

    // Bio
    const bioEl = document.getElementById('profile-bio');
    if (bioEl) bioEl.textContent = profile.bio || '';

    // Avatar
    const avatarEl  = document.getElementById('profile-avatar');
    const phEl      = document.getElementById('profile-avatar-placeholder');
    if (profile.avatar && avatarEl) {
      avatarEl.src = profile.avatar;
      avatarEl.style.display = 'block';
      avatarEl.onerror = () => {
        avatarEl.style.display = 'none';
        if (phEl) { phEl.style.display = 'flex'; phEl.textContent = (profile.name||'U').charAt(0).toUpperCase(); }
      };
      if (phEl) phEl.style.display = 'none';
    } else if (phEl) {
      phEl.textContent = (profile.name || 'U').charAt(0).toUpperCase();
    }

    // Location
    const locEl = document.getElementById('profile-location');
    const locTxt = document.getElementById('profile-location-text');
    if (profile.location && locEl && locTxt) {
      locTxt.textContent = profile.location;
      locEl.style.display = 'flex';
    }

    // University
    const uniEl  = document.getElementById('profile-university');
    const uniTxt = document.getElementById('profile-university-text');
    if (profile.university && uniEl && uniTxt) {
      uniTxt.textContent = profile.university;
      uniEl.style.display = 'flex';
    }

    // Roles
    const rolesWrap = document.getElementById('profile-roles-wrap');
    const rolesEl   = document.getElementById('profile-roles');
    if (profile.roles?.length && rolesWrap && rolesEl) {
      rolesEl.innerHTML = profile.roles.map(r =>
        `<span class="md-chip active" style="cursor:default;">${r}</span>`
      ).join('');
      rolesWrap.style.display = 'block';
    }

    // Skills
    const skillsWrap = document.getElementById('profile-skills-wrap');
    const skillsEl   = document.getElementById('profile-skills');
    if (profile.skills?.length && skillsWrap && skillsEl) {
      skillsEl.innerHTML = profile.skills.map(s =>
        `<span class="md-chip" style="cursor:default;">${s}</span>`
      ).join('');
      skillsWrap.style.display = 'block';
    }

  } catch { /* silently fail — defaults already in HTML */ }

  // Ripple on quick links
  document.querySelectorAll('.social-link-card').forEach(c => addRipple(c, true));
  initScrollReveal(document.getElementById('app-content'));
}

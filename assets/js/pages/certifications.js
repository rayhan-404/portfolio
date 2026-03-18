// ==========================================
// pages/certifications.js — Certifications
// ==========================================

import { formatDate, addRipple, initScrollReveal } from '../utils.js';

// ==========================================
// CERT EMOJI MAP
// ==========================================
function getCertEmoji(issuer = '') {
  const i = issuer.toLowerCase();
  if (i.includes('coursera'))     return '🎓';
  if (i.includes('udemy'))        return '📚';
  if (i.includes('google'))       return '🔵';
  if (i.includes('microsoft'))    return '🟦';
  if (i.includes('freecodecamp')) return '🔥';
  if (i.includes('aws'))          return '☁️';
  if (i.includes('meta'))         return '🌐';
  if (i.includes('ibm'))          return '💙';
  if (i.includes('linkedin'))     return '💼';
  return '🏆';
}

// ==========================================
// RENDER
// ==========================================
function renderCerts(certs) {
  const grid = document.getElementById('certs-grid');
  if (!grid) return;

  if (!certs.length) {
    grid.innerHTML = `
      <div class="certs-empty">
        <span class="material-symbols-rounded">workspace_premium</span>
        <h3>No certifications yet</h3>
        <p>Add certifications via Admin → Certifications.</p>
        <a href="#admin" class="md-btn-filled" style="margin-top:8px;">Open Admin</a>
      </div>
    `;
    return;
  }

  grid.innerHTML = certs.map((cert, i) => `
    <div class="cert-card section-hidden stagger-${(i % 4) + 1}"
         style="--cert-color: ${cert.color || 'var(--md-primary)'};">
      <div class="cert-card-inner">
        <div class="cert-badge">${getCertEmoji(cert.issuer)}</div>
        <div class="cert-name">${cert.name}</div>
        <div class="cert-issuer">
          <span class="material-symbols-rounded">business</span>
          ${cert.issuer}
        </div>
        <div class="cert-date">
          <span class="material-symbols-rounded">calendar_today</span>
          ${formatDate(cert.date)}
        </div>
        ${cert.verifyUrl ? `
          <a href="${cert.verifyUrl}" target="_blank" rel="noopener noreferrer" class="cert-verify">
            <span class="material-symbols-rounded">verified</span>
            Verify →
          </a>
        ` : ''}
      </div>
    </div>
  `).join('');

  initScrollReveal(grid);
}

// ==========================================
// INIT
// ==========================================
export async function init() {
  try {
    const res = await fetch('data/certifications.json');
    if (!res.ok) throw new Error('Failed');
    const certs = await res.json();
    // Sort newest first
    certs.sort((a, b) => new Date(b.date) - new Date(a.date));
    renderCerts(certs);
  } catch {
    document.getElementById('certs-grid').innerHTML = `
      <div class="certs-empty">
        <span class="material-symbols-rounded">wifi_off</span>
        <h3>Could not load certifications</h3>
        <p>Check your connection and try again.</p>
      </div>
    `;
  }
}

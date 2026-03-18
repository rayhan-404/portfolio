// ==========================================
// pwa.js — PWA Features
// Install banner, pull-to-refresh, SW updates
// ==========================================

const PWA_DISMISSED_KEY = 'pwa_dismissed';

// ==========================================
// PWA INSTALL BANNER
// ==========================================
let deferredInstallPrompt = null;

export function initPWAInstallBanner() {
  // Already dismissed
  if (localStorage.getItem(PWA_DISMISSED_KEY)) return;

  // Listen for beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    showInstallBanner();
  });

  // Hide banner if already installed
  window.addEventListener('appinstalled', () => {
    hideInstallBanner();
  });
}

function showInstallBanner() {
  // Create banner if not exists
  if (document.getElementById('pwa-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-banner';
  banner.innerHTML = `
    <div class="pwa-text">
      <span class="material-symbols-rounded">install_mobile</span>
      Add to home screen for the best experience
    </div>
    <button id="pwa-install-btn">Install</button>
    <button id="pwa-dismiss-btn" aria-label="Dismiss">
      <span class="material-symbols-rounded">close</span>
    </button>
  `;

  document.body.appendChild(banner);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => banner.classList.add('show'));
  });

  document.body.classList.add('pwa-banner-visible');

  // Install button
  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      hideInstallBanner();
    }
    deferredInstallPrompt = null;
  });

  // Dismiss button
  document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
    localStorage.setItem(PWA_DISMISSED_KEY, 'true');
    hideInstallBanner();
  });
}

function hideInstallBanner() {
  const banner = document.getElementById('pwa-banner');
  if (!banner) return;
  banner.classList.remove('show');
  document.body.classList.remove('pwa-banner-visible');
  setTimeout(() => banner.remove(), 500);
}

// ==========================================
// PULL-TO-REFRESH
// ==========================================
export function initPullToRefresh() {
  // Only on mobile
  if (window.innerWidth >= 768) return;

  // Create PTR indicator
  const ptr = document.createElement('div');
  ptr.id = 'pull-to-refresh';
  ptr.innerHTML = `<span class="material-symbols-rounded">refresh</span>`;
  document.body.appendChild(ptr);

  let startY       = 0;
  let pulling      = false;
  let pullDistance = 0;
  const threshold  = 80;

  document.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
      startY  = e.touches[0].clientY;
      pulling = true;
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!pulling) return;
    pullDistance = e.touches[0].clientY - startY;
    if (pullDistance > 0 && window.scrollY === 0) {
      ptr.classList.add('visible');
      // Rotate icon based on pull distance
      const rotation = Math.min(pullDistance / threshold * 180, 180);
      ptr.querySelector('.material-symbols-rounded').style.transform = `rotate(${rotation}deg)`;
    }
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (!pulling) return;
    pulling = false;

    if (pullDistance >= threshold) {
      ptr.classList.add('releasing');
      // Trigger page reload
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ptr-refresh'));
        ptr.classList.remove('visible', 'releasing');
        ptr.querySelector('.material-symbols-rounded').style.transform = '';
      }, 600);
    } else {
      ptr.classList.remove('visible');
      ptr.querySelector('.material-symbols-rounded').style.transform = '';
    }

    pullDistance = 0;
  }, { passive: true });

  // Listen for refresh event — re-trigger current route
  window.addEventListener('ptr-refresh', () => {
    const hash = window.location.hash || '#home';
    window.location.hash = '';
    setTimeout(() => window.location.hash = hash, 50);
  });
}

// ==========================================
// SERVICE WORKER UPDATE DETECTION
// ==========================================
export function initSWUpdateDetection() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // New SW has taken control — show update toast
    showUpdateToast();
  });
}

function showUpdateToast() {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: calc(var(--bottom-nav-height, 72px) + 16px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--md-inverse-surface);
    color: var(--md-inverse-on-surface);
    padding: 12px 20px;
    border-radius: 100px;
    font-size: 14px;
    font-weight: 500;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    white-space: nowrap;
  `;
  toast.innerHTML = `
    <span>Site updated!</span>
    <button onclick="location.reload()" style="
      background: var(--md-primary);
      color: white;
      border: none;
      border-radius: 100px;
      padding: 4px 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    ">Reload</button>
  `;
  document.body.appendChild(toast);

  // Auto dismiss after 8s
  setTimeout(() => toast.remove(), 8000);
}

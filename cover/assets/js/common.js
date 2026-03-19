/* ══════════════════════════════════════════
   common.js — Shared utilities
   Cover Page Generator by M Rayhan
═══════════════════════════════════════════ */

/**
 * Initialise a custom <select> dropdown widget.
 * @param {string} id - The root element's id (e.g. "typeSelect")
 */
function initCustomSelect(id) {
  const root = document.getElementById(id);
  if (!root) return;

  const trigger = root.querySelector('.select-trigger');
  const panel   = root.querySelector('.options');
  const hidden  = root.querySelector("input[type='hidden']");
  const label   = root.querySelector('.selected');

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.options.open').forEach(p => { if (p !== panel) p.classList.remove('open'); });
    document.querySelectorAll('.select-trigger.open').forEach(t => { if (t !== trigger) t.classList.remove('open'); });
    panel.classList.toggle('open');
    trigger.classList.toggle('open');
  });

  root.querySelectorAll('.option').forEach(opt => {
    opt.addEventListener('click', () => {
      root.querySelectorAll('.option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      hidden.value = opt.dataset.value;
      label.innerText = opt.innerText;
      panel.classList.remove('open');
      trigger.classList.remove('open');
      if (typeof updatePreview === 'function') updatePreview();
    });
  });

  document.addEventListener('click', () => {
    panel.classList.remove('open');
    trigger.classList.remove('open');
  });

  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger.click(); }
  });
}

/**
 * Auto-select text when an input is focused (better UX for editing).
 */
function setupAutoSelect() {
  document.querySelectorAll('.input-group input[type="text"], .input-group textarea').forEach(input => {
    input.addEventListener('focus', function () { this.select(); });
  });
}

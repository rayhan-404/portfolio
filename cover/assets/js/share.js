/* ══════════════════════════════════════════
   share.js — Share link system
   Uses LZ-String compression for short URLs.
   Cover Page Generator by M Rayhan
═══════════════════════════════════════════ */

/**
 * Encode current form fields into a compressed URL and show the share link.
 * Reads share field IDs from window.DESIGN.shareFields.
 */
function generateShareLink() {
  try {
    const shareFields = window.DESIGN && window.DESIGN.shareFields ? window.DESIGN.shareFields : [];
    const data = {};
    shareFields.forEach(function (id) {
      const el = document.getElementById(id);
      if (el) data[id] = el.value;
    });

    const encoded = LZString.compressToEncodedURIComponent(JSON.stringify(data));
    const url = location.origin + '/cover/index.html?s=' + encoded;


    const outputEl = document.getElementById('shareLinkOutput');
    const rowEl    = document.getElementById('shareLinkRow');
    const copyBtn  = document.getElementById('btnCopy');

    outputEl.value = url;
    rowEl.classList.add('visible');
    copyBtn.textContent = 'Copy';
    copyBtn.classList.remove('copied');
    rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) { /* fail silently */ }
}

/**
 * Copy the generated share link to clipboard.
 */
function copyShareLink() {
  const outputEl = document.getElementById('shareLinkOutput');
  const copyBtn  = document.getElementById('btnCopy');
  if (!outputEl || !outputEl.value) return;

  const confirm = function () {
    copyBtn.textContent = '✓ Copied!';
    copyBtn.classList.add('copied');
    setTimeout(function () {
      copyBtn.textContent = 'Copy';
      copyBtn.classList.remove('copied');
    }, 2200);
  };

  try {
    navigator.clipboard.writeText(outputEl.value).then(confirm).catch(function () {
      outputEl.select(); document.execCommand('copy'); confirm();
    });
  } catch (e) {
    outputEl.select(); document.execCommand('copy'); confirm();
  }
}

/**
 * On page load: read ?s= param, decompress, and pre-fill form fields.
 * Also supports legacy ?d= Base64 links.
 */
function loadFromShareLink() {
  try {
    const params = new URLSearchParams(window.location.search);
    let data = null;

    const compressed = params.get('s');
    if (compressed) {
      const json = LZString.decompressFromEncodedURIComponent(compressed);
      if (json) data = JSON.parse(json);
    }

    if (!data) {
      const encoded = params.get('d');
      if (encoded) data = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    }

    if (typeof data !== 'object' || data === null) return;

    Object.keys(data).forEach(function (id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = data[id];

      // Sync custom-select widget UI
      const parentSelect = el.closest('.custom-select');
      if (parentSelect) {
        const value   = data[id];
        const labelEl = parentSelect.querySelector('.selected');
        parentSelect.querySelectorAll('.option').forEach(function (opt) {
          opt.classList.remove('active');
          if (opt.dataset.value === value) {
            opt.classList.add('active');
            if (labelEl) labelEl.innerText = opt.innerText;
          }
        });
      }
    });

    // Sync native dept-align <select>
    const deptAlignEl = document.getElementById('in-dept-align');
    if (deptAlignEl && data['in-dept-align']) deptAlignEl.value = data['in-dept-align'];

    if (typeof updatePreview === 'function') updatePreview();
  } catch (e) { /* corrupted URL — fail silently */ }
}

// Auto-load on DOM ready
document.addEventListener('DOMContentLoaded', loadFromShareLink);

/* ══════════════════════════════════════════
   preview.js — Preview modal & zoom logic
   Cover Page Generator by M Rayhan
═══════════════════════════════════════════ */

/** Open the preview modal and fit the cover to screen. */
function showPreview() {
  updatePreview();
  document.getElementById('previewModal').style.display = 'block';
  fitPreviewToScreen();
}

/** Close the preview modal. */
function closePreview() {
  document.getElementById('previewModal').style.display = 'none';
}

/** Scale the A4 sheet to fit the available screen space. */
function fitPreviewToScreen() {
  const scene   = document.getElementById('previewScene');
  const wrapper = document.getElementById('previewWrapper');

  setTimeout(() => {
    const W = scene.clientWidth;
    const H = scene.clientHeight;
    let scale = Math.min(W / 794, H / 1123);
    if (scale > 1) scale = 1;
    wrapper.style.transform = `scale(${scale})`;
    wrapper.style.width  = '794px';
    wrapper.style.height = '1123px';
  }, 50);
}

// Re-fit on window resize
window.addEventListener('resize', () => {
  if (document.getElementById('previewModal').style.display === 'block') {
    fitPreviewToScreen();
  }
});

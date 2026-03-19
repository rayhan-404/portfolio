/* ══════════════════════════════════════════
   download.js — Universal PDF download
   Uses html2pdf.js library.
   Cover Page Generator by M Rayhan
═══════════════════════════════════════════ */

/**
 * Download the cover page as a PDF.
 * Reads filename from window.DESIGN.pdfFilename (fallback: 'Cover-Page.pdf').
 */
function downloadPDF() {
  const element  = document.getElementById('cover-page');
  const filename = (window.DESIGN && window.DESIGN.pdfFilename)
    ? window.DESIGN.pdfFilename
    : 'Cover-Page (rayhan.iam.bd).pdf';

  const btn = document.querySelector('.btn-download');
  if (btn) { btn.textContent = 'Generating…'; btn.disabled = true; }

  const opt = {
    margin: 0,
    filename: filename,
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0 },
    jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' },
    onclone: function (clonedDoc) {
      const el = clonedDoc.getElementById('cover-page');
      if (el) {
        el.style.transform = 'none';
        el.style.width  = '794px';
        el.style.height = '1123px';
        el.style.margin = '0';
      }
    }
  };

  html2pdf().set(opt).from(element).save().then(function () {
    if (btn) { btn.textContent = 'Download PDF'; btn.disabled = false; }
  }).catch(function () {
    if (btn) { btn.textContent = 'Download PDF'; btn.disabled = false; }
  });
}

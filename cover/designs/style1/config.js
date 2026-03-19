/* ══════════════════════════════════════════
   designs/nwu/config.js
   North Western University Cover Design
   Cover Page Generator by M Rayhan
═══════════════════════════════════════════ */

window.DESIGN = {

  /* ── Identity ─────────────────────────── */
  id:        'style1',
  name:      'North Western University',
  shortName: 'NWU Cover',
  formTitle: 'NWU ',
  pdfFilename: 'NWU-Cover-Page (rayhan.iam.bd).pdf',

  /* ── Fields for share link ────────────── */
  shareFields: [
    'in-type', 'in-border', 'in-dept', 'in-dept-align',
    'in-title', 'in-code', 'in-sname', 'in-sid',
    'in-term', 'in-tname', 'in-tdesig', 'in-date'
  ],

  /* ── Form field definitions ───────────── */
  /*  type: 'custom-select' | 'text-with-align' | 'text' | 'textarea'  */
  fields: [
    {
      type: 'custom-select',
      id: 'typeSelect', hiddenId: 'in-type',
      label: 'কভার টাইপ',
      defaultLabel: 'অ্যাসাইনমেন্ট কভার',
      defaultValue: 'Assignment',
      options: [
        { value: 'Assignment', label: 'অ্যাসাইনমেন্ট কভার' },
        { value: 'Lab Report', label: 'ল্যাব রিপোর্ট কভার' }
      ]
    },
    {
      type: 'custom-select',
      id: 'borderSelect', hiddenId: 'in-border',
      label: 'বর্ডার স্টাইল',
      defaultLabel: 'সিম্পল বক্স',
      defaultValue: 'simple',
      options: [
        { value: 'simple',     label: 'সিম্পল বক্স' },
        { value: 'double',     label: 'ডাবল লাইন' },
        { value: 'thick-blue', label: 'মোটা কমলা' },
        { value: 'dotted',     label: 'ডট' },
        { value: 'none',       label: 'বর্ডার ছাড়া' }
      ]
    },
    {
      type: 'text-with-align',
      id: 'in-dept', alignId: 'in-dept-align',
      label: 'ডিপার্টমেন্ট',
      defaultValue: 'Department of Computer Science and Engineering',
      defaultAlign: 'center'
    },
    { type: 'text',     id: 'in-title',  label: 'কোর্স টাইটেল',       defaultValue: 'Computer Fundamentals' },
    { type: 'text',     id: 'in-code',   label: 'কোর্স কোড',            defaultValue: 'CSE-1101' },
    { type: 'text',     id: 'in-sname',  label: 'স্টুডেন্ট নেম',        defaultValue: 'M Rayhan' },
    { type: 'text',     id: 'in-sid',    label: 'স্টুডেন্ট আইডি',       defaultValue: '20242025010' },
    { type: 'text',     id: 'in-term',   label: 'সেমিস্টার & সেকশন',    defaultValue: 'Fall-24, Sec-A' },
    { type: 'text',     id: 'in-tname',  label: 'স্যারের নাম',          defaultValue: 'Md. Asaduzzaman' },
    {
      type: 'textarea', id: 'in-tdesig', label: 'স্যারের ডেজিগনেশন',
      hint: '(Shift+Enter = নতুন লাইন)',
      defaultValue: 'Assistant Professor',
      rows: 3
    },
    { type: 'text',     id: 'in-date',   label: 'সাবমিশন ডেট',          defaultValue: '20/12/2024' }
  ],

  /* ── Design-specific preview extras ───── */
  updateCoverExtras: function () {
    // Apply border class — সব cover-page এ (desktop + mobile preview)
    const border = document.getElementById('in-border').value;
    document.querySelectorAll('#cover-page').forEach(function(sheet) {
      sheet.classList.remove('border-simple', 'border-double', 'border-thick-blue', 'border-dotted', 'border-none');
      sheet.classList.add('border-' + border);
    });

    // Dept text alignment
    const align = (document.getElementById('in-dept-align') || {}).value || 'center';
    document.querySelectorAll('.dept-line').forEach(function(deptLine) {
      deptLine.style.textAlign = align;
    });
  },

  /* ── A4 Cover HTML template ────────────── */
  renderCover: function () {
    return `
      <div id="cover-page" class="a4-sheet border-simple">

        <div class="header-section">
          <img src="designs/style1/title.png" alt="North Western University" class="header-logo"
               onerror="this.style.opacity=0">
        </div>

        <div class="dept-line">
          <span id="out-dept">Department of Computer Science and Engineering</span>
        </div>

        <div class="logo-container">
          <img src="designs/nwu/logo.png" id="main-logo" alt="NWU"
               onerror="this.style.opacity=0">
        </div>

        <div class="work-type-container">
          <span id="out-type" class="work-type-text">Assignment</span>
        </div>

        <div class="course-info">
          <div class="info-row">
            <span class="info-label">Course Title:</span>
            <span id="out-title" class="info-val">Computer Fundamentals</span>
          </div>
          <div class="info-row">
            <span class="info-label">Course Code:</span>
            <span id="out-code" class="info-val">CSE-1101</span>
          </div>
        </div>

        <div class="submission-area">
          <div class="sub-col">
            <span class="sub-head">Submitted By</span>
            <div class="sub-content">
              <span id="out-sname" class="name-bold">M Rayhan</span>
              <div>Student ID: <span id="out-sid">20242025010</span></div>
              <div id="out-term">Fall-24, Sec-A</div>
            </div>
          </div>
          <div class="sub-col">
            <span class="sub-head">Submitted To</span>
            <div class="sub-content">
              <span id="out-tname" class="name-bold">Md. Asaduzzaman</span>
              <div id="out-tdesig">Assistant Professor</div>
            </div>
          </div>
        </div>

        <div class="date-section">
          Date of Submission: <span id="out-date">20/12/2024</span>
        </div>

      </div>
    `;
  }

};

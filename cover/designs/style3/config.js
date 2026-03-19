/* ══════════════════════════════════════════
   designs/style3/config.js
   North Western University Cover Design
   Cover Page Generator by M Rayhan
═══════════════════════════════════════════ */

window.DESIGN = {

  /* ── Identity ─────────────────────────── */
  id:        'style3',
  name:      'North Western University',
  shortName: 'NWU Cover',
  formTitle: 'NWU Cover Page Generator',
  pdfFilename: 'NWU-Cover-Page (rayhan.iam.bd).pdf',

  /* ── Fields for share link ────────────── */
  shareFields: [
    'in-type', 'in-border', 'in-dept', 'in-dept-align',
    'in-title', 'in-code', 'in-sname', 'in-sid',
    'in-term', 'in-tname', 'in-tdesig', 'in-date'
  ],

  /* ── Form field definitions ───────────── */
  fields: [
    {
      type: 'custom-select',
      id: 'typeSelect', hiddenId: 'in-type',
      label: 'কভার টাইপ',
      defaultLabel: 'অ্যাসাইনমেন্ট',
      defaultValue: 'Assignment',
      options: [
        { value: 'Assignment',  label: 'অ্যাসাইনমেন্ট' },
        { value: 'Lab Report',  label: 'ল্যাব রিপোর্ট' }
      ]
    },
    {
      type: 'custom-select',
      id: 'borderSelect', hiddenId: 'in-border',
      label: 'বর্ডার স্টাইল',
      defaultLabel: 'কমলা বর্ডার',
      defaultValue: 'default',
      options: [
        { value: 'default',     label: 'কমলা বর্ডার' },
        { value: 'simple',      label: 'কালো বর্ডার' },
        { value: 'double',      label: 'ডাবল লাইন' },
        { value: 'thick-blue',  label: 'মোটা নীল' },
        { value: 'thick-green', label: 'মোটা সবুজ' },
        { value: 'dotted',      label: 'ডট বর্ডার' },
        { value: 'dashed',      label: 'ড্যাশ বর্ডার' },
        { value: 'bold-black',  label: 'বোল্ড কালো' },
        { value: 'thin-red',    label: 'পাতলা লাল' },
        { value: 'none',        label: 'বর্ডার ছাড়া' }
      ]
    },
    {
      type: 'text-with-align',
      id: 'in-dept', alignId: 'in-dept-align',
      label: 'ডিপার্টমেন্ট',
      defaultValue: 'Department Of Computer Science And Engineering (CSE)',
      defaultAlign: 'center'
    },
    { type: 'text',     id: 'in-title',  label: 'কোর্স টাইটেল',       defaultValue: 'Course Title' },
    { type: 'text',     id: 'in-code',   label: 'কোর্স কোড',            defaultValue: 'CSE-0000' },
    { type: 'text',     id: 'in-sname',  label: 'স্টুডেন্ট নেম',        defaultValue: 'M Rayhan' },
    { type: 'text',     id: 'in-sid',    label: 'স্টুডেন্ট আইডি',       defaultValue: '202420250100' },
    { type: 'text',     id: 'in-term',   label: 'সেমিস্টার & সেকশন',    defaultValue: 'Fall-24, A' },
    { type: 'text',     id: 'in-tname',  label: 'টিচারের নাম',          defaultValue: 'Teacher Name' },
    {
      type: 'textarea', id: 'in-tdesig', label: 'টিচারের ডেজিগনেশন',
      hint: '(Shift+Enter = নতুন লাইন)',
      defaultValue: 'Designation',
      rows: 2
    },
    { type: 'text',     id: 'in-date',   label: 'সাবমিশন ডেট',          defaultValue: 'DD/MM/YYYY' }
  ],

  /* ── Design-specific preview extras ───── */
  updateCoverExtras: function () {
    // Apply border class — সব cover-page এ (desktop + mobile preview)
    const border = document.getElementById('in-border').value;
    document.querySelectorAll('#cover-page').forEach(function(sheet) {
      sheet.classList.remove('border-default', 'border-simple', 'border-double', 'border-thick-blue', 'border-thick-green', 'border-dotted', 'border-dashed', 'border-bold-black', 'border-thin-red', 'border-none');
      sheet.classList.add('border-' + border);
    });

    // Department alignment
    const deptAlign = document.getElementById('in-dept-align').value;
    document.querySelectorAll('#out-dept').forEach(function(deptEl) {
      deptEl.style.textAlign = deptAlign;
    });
  },

  /* ── A4 Cover HTML template ────────────── */

  renderCover: function () {
    return `
      <div id="cover-page" class="border-default">

        <!-- spacer: top padding → logo (pushes logo down) -->
        <div style="flex:1.8; position:relative; z-index:1;"></div>

        <!-- 1. Logo -->
        <div class="nwu-logo-wrap">
          <img src="designs/style3/logo.jpg" alt="NWU"
               crossorigin="anonymous"
               onerror="this.style.display='none';this.nextElementSibling.style.display='inline-flex';">
          <div class="nwu-logo-placeholder" style="display:none;">NWU<br>Logo</div>
        </div>

        <!-- spacer: logo → uni name (medium) -->
        <div style="flex:1.2; position:relative; z-index:1;"></div>

        <!-- 2. University name + dept -->
        <div class="nwu-uni-block">
          <span class="nwu-uni-title">North Western University, Khulna</span>
          <span class="nwu-uni-dept" id="out-dept">Department Of Computer Science And Engineering (CSE)</span>
        </div>

        <!-- spacer: uni → type box (medium) -->
        <div style="flex:1; position:relative; z-index:1;"></div>

        <!-- 3. Cover type -->
        <div class="nwu-type-wrap">
          <div class="nwu-type-box">
            <span class="nwu-type-text" id="out-type">Assignment</span>
          </div>
        </div>

        <!-- spacer: type → course table (medium) -->
        <div style="flex:1; position:relative; z-index:1;"></div>

        <!-- 4. Course details -->
        <table class="nwu-course-table">
          <tbody>
            <tr>
              <td class="nwu-cd-label" rowspan="2">Course Details</td>
              <td class="nwu-cd-row">
                <strong>Course Title</strong>: <em id="out-title">Course Title</em>
              </td>
            </tr>
            <tr>
              <td class="nwu-cd-row">
                <strong>Course code</strong>: <em id="out-code">CSE-0000</em>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- spacer: course → sub table (largest gap) -->
        <div style="flex:2.2; position:relative; z-index:1;"></div>

        <!-- 5. Submitted To / By -->
        <table class="nwu-sub-table">
          <thead>
            <tr>
              <th>Submitted To</th>
              <th>Submitted By</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span class="nwu-to-name" id="out-tname">Your Teacher Name</span>
                <span class="nwu-to-desig" id="out-tdesig">Designation</span>
              </td>
              <td>
                <div class="nwu-by-row">
                  <span class="nwu-by-key">Student Name</span>
                  <span class="nwu-by-colon">:</span>
                  <span class="nwu-by-val" id="out-sname">Your Name</span>
                </div>
                <div class="nwu-by-row">
                  <span class="nwu-by-key">Student Id</span>
                  <span class="nwu-by-colon">:</span>
                  <span class="nwu-by-val" id="out-sid">Your ID</span>
                </div>
                <div class="nwu-by-row">
                  <span class="nwu-by-key">Semester & Sec</span>
                  <span class="nwu-by-colon">:</span>
                  <span class="nwu-by-val" id="out-term">Fall-24, A</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- spacer: sub table → date (balanced) -->
        <div style="flex:1.2; position:relative; z-index:1;"></div>

        <!-- 6. Date -->
        <div class="nwu-date-row">
          <span class="nwu-date-label">Date of submission</span>
          <span>&nbsp; :</span>
          <span id="out-date">DD/MM/YYYY</span>
        </div>

        <!-- spacer: date → bottom border -->
        <div style="flex:1; position:relative; z-index:1;"></div>

      </div>
    `;
  }
};
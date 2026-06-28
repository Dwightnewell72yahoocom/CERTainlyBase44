import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Brand colours
const OLIVE = rgb(0.42, 0.44, 0.25);
const GOLD = rgb(0.91, 0.63, 0.13);
const CREAM = rgb(0.97, 0.96, 0.93);
const BLACK = rgb(0, 0, 0);
const GRAY = rgb(0.4, 0.4, 0.4);
const LIGHT_GRAY = rgb(0.88, 0.88, 0.88);
const WHITE = rgb(1, 1, 1);

// ── Layout helpers ────────────────────────────────────────────────────────────
class PageWriter {
  constructor(page, fonts, pageHeight) {
    this.page = page;
    this.fonts = fonts;
    this.pageHeight = pageHeight;
    this.y = pageHeight - 40;
    this.margin = 36;
    this.width = page.getWidth() - 72;
  }

  get x() { return this.margin; }

  drawText(text, { size = 10, font, color = BLACK, x, indent = 0 } = {}) {
    const f = font || this.fonts.regular;
    this.page.drawText(String(text ?? ''), {
      x: (x ?? this.x) + indent,
      y: this.y,
      size,
      font: f,
      color,
    });
    this.y -= (size + 4);
  }

  drawBox(height, color = CREAM) {
    this.page.drawRectangle({
      x: this.x,
      y: this.y - height + 14,
      width: this.width,
      height,
      color,
      borderColor: LIGHT_GRAY,
      borderWidth: 0.5,
    });
  }

  sectionHeader(title) {
    this.space(6);
    this.page.drawRectangle({ x: this.x, y: this.y - 6, width: this.width, height: 22, color: OLIVE });
    this.page.drawText(title, { x: this.x + 8, y: this.y, size: 10, font: this.fonts.bold, color: WHITE });
    this.y -= 22;
    this.space(4);
  }

  fieldRow(label, value, secondLabel, secondValue) {
    const labelW = 130;
    const colW = this.width / 2 - 4;

    // First column
    this.page.drawText(label + ':', { x: this.x, y: this.y, size: 8, font: this.fonts.bold, color: GRAY });
    this.page.drawRectangle({ x: this.x + labelW, y: this.y - 4, width: colW - labelW, height: 14, color: WHITE, borderColor: LIGHT_GRAY, borderWidth: 0.5 });
    if (value) {
      this.page.drawText(String(value), { x: this.x + labelW + 3, y: this.y, size: 9, font: this.fonts.regular, color: BLACK });
    }

    // Second column
    if (secondLabel !== undefined) {
      const x2 = this.x + colW + 8;
      this.page.drawText(secondLabel + ':', { x: x2, y: this.y, size: 8, font: this.fonts.bold, color: GRAY });
      this.page.drawRectangle({ x: x2 + labelW, y: this.y - 4, width: colW - labelW, height: 14, color: WHITE, borderColor: LIGHT_GRAY, borderWidth: 0.5 });
      if (secondValue) {
        this.page.drawText(String(secondValue), { x: x2 + labelW + 3, y: this.y, size: 9, font: this.fonts.regular, color: BLACK });
      }
    }

    this.y -= 18;
  }

  fullFieldRow(label, value) {
    this.page.drawText(label + ':', { x: this.x, y: this.y, size: 8, font: this.fonts.bold, color: GRAY });
    const fieldX = this.x + 160;
    this.page.drawRectangle({ x: fieldX, y: this.y - 4, width: this.width - 160, height: 14, color: WHITE, borderColor: LIGHT_GRAY, borderWidth: 0.5 });
    if (value) {
      this.page.drawText(String(value).slice(0, 80), { x: fieldX + 3, y: this.y, size: 9, font: this.fonts.regular, color: BLACK });
    }
    this.y -= 18;
  }

  noteRow(text) {
    this.page.drawText('→ ' + text, { x: this.x + 4, y: this.y, size: 7.5, font: this.fonts.italic, color: GRAY });
    this.y -= 12;
  }

  space(n = 8) { this.y -= n; }

  divider() {
    this.space(4);
    this.page.drawLine({ start: { x: this.x, y: this.y }, end: { x: this.x + this.width, y: this.y }, thickness: 0.5, color: LIGHT_GRAY });
    this.space(6);
  }

  tableHeader(cols) {
    let x = this.x;
    cols.forEach(({ label, width }) => {
      this.page.drawRectangle({ x, y: this.y - 4, width, height: 16, color: OLIVE });
      this.page.drawText(label, { x: x + 3, y: this.y, size: 7.5, font: this.fonts.bold, color: WHITE });
      x += width;
    });
    this.y -= 16;
  }

  tableRow(cols, values, shade = false) {
    let x = this.x;
    const h = 14;
    cols.forEach(({ width }, i) => {
      this.page.drawRectangle({ x, y: this.y - 4, width, height: h, color: shade ? CREAM : WHITE, borderColor: LIGHT_GRAY, borderWidth: 0.3 });
      const val = String(values[i] ?? '');
      if (val) {
        this.page.drawText(val.slice(0, Math.floor(width / 5.5)), { x: x + 3, y: this.y, size: 8, font: this.fonts.regular, color: BLACK });
      }
      x += width;
    });
    this.y -= h;
  }

  pageNumber(n) {
    this.page.drawText(`Page ${n}`, { x: this.x + this.width - 30, y: 18, size: 8, font: this.fonts.regular, color: GRAY });
  }

  checkRow(label, checked) {
    const box = checked ? '☑' : '☐';
    this.page.drawText(box + '  ' + label, { x: this.x + 8, y: this.y, size: 9, font: this.fonts.regular, color: BLACK });
    this.y -= 14;
  }
}

// ── Main generator ────────────────────────────────────────────────────────────
export async function generateRenewalDataPack(cert, experienceLogs) {
  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fonts = { bold: boldFont, regular: regularFont, italic: italicFont };

  const PAGE_H = 792;
  const PAGE_W = 612;

  const addPage = () => {
    const p = pdfDoc.addPage([PAGE_W, PAGE_H]);
    return new PageWriter(p, fonts, PAGE_H);
  };

  const today = new Date();
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-CA') : '';
  const fullName = cert.technician_name || '';
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts.slice(0, -1).join(' ');
  const lastName = nameParts.slice(-1)[0] || '';
  const METHOD_LIST = ['UT-PA', 'MT', 'UT', 'PT', 'RT', 'ET', 'VT', 'XF', 'CEDO'];
  const certNameUpper = (cert.certification_name || '').toUpperCase();
  const method = METHOD_LIST.find(m => certNameUpper.includes(m)) || '';
  const levelMatch = cert.certification_name?.match(/level\s*(\d)/i);
  const level = levelMatch ? levelMatch[1] : '';

  // ── COVER PAGE ─────────────────────────────────────────────────────────────
  const cover = addPage();
  cover.page.drawRectangle({ x: 0, y: PAGE_H - 120, width: PAGE_W, height: 120, color: OLIVE });
  cover.page.drawText('NRCAN NDT CERTIFICATION', { x: 36, y: PAGE_H - 55, size: 20, font: boldFont, color: GOLD });
  cover.page.drawText('RENEWAL DATA PACK', { x: 36, y: PAGE_H - 80, size: 16, font: boldFont, color: WHITE });
  cover.page.drawText('Use this document to fill your official NRCan forms — all your data in one place', { x: 36, y: PAGE_H - 100, size: 9, font: regularFont, color: rgb(0.85, 0.85, 0.75) });

  cover.y = PAGE_H - 150;
  cover.page.drawRectangle({ x: 36, y: cover.y - 80, width: PAGE_W - 72, height: 90, color: CREAM, borderColor: GOLD, borderWidth: 1.5 });
  cover.page.drawText(fullName || 'Technician', { x: 52, y: cover.y - 10, size: 18, font: boldFont, color: OLIVE });
  cover.page.drawText(`Reg# ${cert.nrcan_id || '—'}`, { x: 52, y: cover.y - 32, size: 11, font: regularFont, color: GRAY });
  cover.page.drawText(`${cert.certification_name || '—'}`, { x: 52, y: cover.y - 50, size: 11, font: boldFont, color: BLACK });
  cover.page.drawText(`Expires: ${fmtDate(cert.expiry_date)}`, { x: 52, y: cover.y - 68, size: 10, font: regularFont, color: rgb(0.7, 0.1, 0.1) });

  cover.y -= 100;
  cover.space(20);

  cover.page.drawText('HOW TO USE THIS DOCUMENT', { x: 36, y: cover.y, size: 11, font: boldFont, color: OLIVE });
  cover.y -= 20;

  const steps = [
    { n: '1', t: 'Form 8.2.1-075 — Renewal Application', d: 'Use Section 1 of this pack for all applicant, employer, and method fields.' },
    { n: '2', t: 'Form 8.2.1-073 — SCS Points Application', d: 'Use Section 2 for your structured credit system points table and activity logs.' },
    { n: '3', t: 'Form 8.2.1-002 — Code of Conduct', d: 'Sign field only — your name and date are in Section 3.' },
    { n: '4', t: 'Submit to NRCan NDTCB', d: 'Email signed forms to: ndtrecertification-endrecertification@nrcan-rncan.gc.ca' },
  ];

  steps.forEach(s => {
    cover.page.drawRectangle({ x: 36, y: cover.y - 34, width: PAGE_W - 72, height: 44, color: WHITE, borderColor: LIGHT_GRAY, borderWidth: 0.5 });
    cover.page.drawRectangle({ x: 36, y: cover.y - 34, width: 24, height: 44, color: OLIVE });
    cover.page.drawText(s.n, { x: 43, y: cover.y - 16, size: 14, font: boldFont, color: WHITE });
    cover.page.drawText(s.t, { x: 66, y: cover.y - 8, size: 9, font: boldFont, color: BLACK });
    cover.page.drawText(s.d, { x: 66, y: cover.y - 22, size: 8, font: regularFont, color: GRAY });
    cover.y -= 52;
  });

  cover.page.drawText(`Generated: ${today.toLocaleDateString('en-CA')}  |  NRCan NDT Certification Tracker`, { x: 36, y: 28, size: 7.5, font: italicFont, color: GRAY });

  // ── PAGE 1: FORM 075 — SECTION 1 ───────────────────────────────────────────
  const p1 = addPage();
  p1.page.drawRectangle({ x: 0, y: PAGE_H - 32, width: PAGE_W, height: 32, color: OLIVE });
  p1.page.drawText('SECTION 1 — Form 8.2.1-075: Renewal Application', { x: 36, y: PAGE_H - 20, size: 11, font: boldFont, color: GOLD });
  p1.y = PAGE_H - 50;

  p1.sectionHeader('PART A — APPLICANT INFORMATION');
  p1.fieldRow('Surname', lastName, 'Given Names', firstName);
  p1.fieldRow('Registration #', cert.nrcan_id, 'Email', cert.technician_email);
  p1.noteRow('Telephone (Home) and (Cell) — enter manually');
  p1.noteRow('Former Surname — enter manually if applicable');
  p1.space(4);
  p1.noteRow('Address of Residence, City, Province, Postal Code — enter manually');
  p1.noteRow('Mailing Address — enter manually if different from above');

  p1.sectionHeader('PART B — EMPLOYER INFORMATION');
  p1.fieldRow('Present Employer', cert.employer_name, 'Employer Email', cert.employer_email);
  p1.fieldRow('Employer Contact', cert.supervisor_name, 'Supervisor Email', cert.supervisor_email);
  p1.noteRow("Contact's Title, Employer Address, City, Province, Postal Code, Telephone — enter manually");

  p1.sectionHeader('PART C — NDT METHOD & LEVEL');
  p1.fieldRow('Method', method || '(see cert name)', 'Level', level || '(see cert name)');
  p1.fieldRow('Full Cert Name', cert.certification_name, 'Governing Body', cert.governing_body);

  p1.space(6);
  p1.page.drawText('Check the appropriate method checkbox on the form:', { x: p1.x, y: p1.y, size: 8, font: boldFont, color: GRAY });
  p1.y -= 14;
  ['MT', 'UT', 'PT', 'RT', 'ET', 'VT', 'UT-PA', 'XF', 'CEDO'].forEach(m => {
    p1.checkRow(m, m === method);
  });

  p1.sectionHeader('PART D — WORK EXPERIENCE HISTORY (Field Work Logs)');
  const fwLogs = experienceLogs.filter(l => l.log_type === 'field_work');
  if (fwLogs.length === 0) {
    p1.noteRow('No field work logs found — enter employment history manually on form.');
  } else {
    const cols = [
      { label: 'Employer / Company', width: 180 },
      { label: 'Position / Role', width: 130 },
      { label: 'From', width: 70 },
      { label: 'To', width: 70 },
      { label: 'Hours', width: 57 },
    ];
    p1.tableHeader(cols);
    fwLogs.slice(0, 8).forEach((l, i) => {
      p1.tableRow(cols, [
        l.employer || l.organisation || '',
        l.role || '',
        fmtDate(l.start_date),
        fmtDate(l.end_date),
        l.hours || '',
      ], i % 2 === 1);
    });
  }

  p1.sectionHeader('PART E — PAYMENT & ATTESTATION');
  p1.noteRow('Payment: Complete credit card section on form — "To be paid by: Applicant"');
  p1.fieldRow('Cardholder Name', fullName, 'Email', cert.technician_email);
  p1.noteRow('Signature Date: ' + today.toLocaleDateString('en-CA') + '  (sign the physical form)');

  p1.sectionHeader('SUPERVISOR / EMPLOYER ATTESTATION FIELDS');
  p1.fieldRow("Employer's Name", cert.supervisor_name, 'Email', cert.supervisor_email);
  p1.fieldRow('Employer Company', cert.employer_name, 'Employer Email', cert.employer_email);
  p1.noteRow("Supervisor/Employer registration #, job title, address, telephone — obtain from your employer");
  p1.noteRow("All 3 signatories (Employer, Supervisor, Sponsor) sign the physical form");
  p1.pageNumber(1);

  // ── PAGE 2: FORM 073 — SCS POINTS ──────────────────────────────────────────
  const p2 = addPage();
  p2.page.drawRectangle({ x: 0, y: PAGE_H - 32, width: PAGE_W, height: 32, color: OLIVE });
  p2.page.drawText('SECTION 2 — Form 8.2.1-073: Structured Credit System (SCS) Application', { x: 36, y: PAGE_H - 20, size: 11, font: boldFont, color: GOLD });
  p2.y = PAGE_H - 50;

  p2.sectionHeader('APPLICANT DETAILS');
  p2.fieldRow('Surname', lastName, 'Given Names', firstName);
  p2.fieldRow('Registration #', cert.nrcan_id, 'Method & Level', cert.certification_name);

  // Calculate SCS points by year
  const expiry = new Date(cert.expiry_date || new Date());
  const activityMap = {
    field_work: 1,
    training_received: 3,
    training_delivered: 4,
    research: 5,
    seminars: 6,
    professional: 7,
    mentoring: 9,
  };

  const yearData = {};
  for (let y = 1; y <= 5; y++) {
    yearData[y] = {};
    const yearEnd = new Date(expiry.getFullYear() - (y - 1), expiry.getMonth(), expiry.getDate());
    const yearStart = new Date(expiry.getFullYear() - y, expiry.getMonth(), expiry.getDate());
    for (let act = 1; act <= 11; act++) {
      const pts = experienceLogs
        .filter(l => activityMap[l.log_type] === act)
        .filter(l => { const d = new Date(l.start_date || l.created_date); return d >= yearStart && d < yearEnd; })
        .reduce((s, l) => s + (l.points || 0), 0);
      yearData[y][act] = pts || 0;
    }
  }

  const activityLabels = [
    'Activity 1 — Field Work (NDT)',
    'Activity 2 — Related Field Work',
    'Activity 3 — Training Received',
    'Activity 4 — Training Delivered',
    'Activity 5 — Research/Writing',
    'Activity 6 — Seminars/Conferences',
    'Activity 7 — Professional Membership',
    'Activity 8 — Study for Exam',
    'Activity 9 — Mentoring',
    'Activity 10 — Interpretation',
    'Activity 11 — Other',
  ];

  p2.sectionHeader('SCS POINTS TABLE — Transfer these values to Form 8.2.1-073');

  const scsColW = [220, 52, 52, 52, 52, 52, 57];
  const scsLabels = ['Activity', 'Yr 1', 'Yr 2', 'Yr 3', 'Yr 4', 'Yr 5', 'Total'];
  p2.tableHeader(scsLabels.map((l, i) => ({ label: l, width: scsColW[i] })));

  let totalPoints = 0;
  activityLabels.forEach((label, actIdx) => {
    const act = actIdx + 1;
    const rowPts = [];
    let rowTotal = 0;
    for (let y = 1; y <= 5; y++) {
      const pts = yearData[y][act] || 0;
      rowPts.push(pts > 0 ? String(pts) : '');
      rowTotal += pts;
    }
    totalPoints += rowTotal;
    p2.tableRow(
      scsLabels.map((l, i) => ({ label: l, width: scsColW[i] })),
      [label, ...rowPts, rowTotal > 0 ? String(rowTotal) : ''],
      actIdx % 2 === 1
    );
  });

  p2.space(6);
  p2.page.drawRectangle({ x: p2.x, y: p2.y - 10, width: p2.width, height: 20, color: totalPoints >= 100 ? rgb(0.85, 0.97, 0.85) : rgb(0.97, 0.9, 0.85) });
  p2.page.drawText(`TOTAL SCS POINTS: ${totalPoints}  (Target: 100 pts minimum, 50 from Part A)`, { x: p2.x + 8, y: p2.y, size: 10, font: boldFont, color: totalPoints >= 100 ? rgb(0.1, 0.5, 0.1) : rgb(0.6, 0.1, 0.1) });
  p2.y -= 20;

  p2.sectionHeader('ACTIVITY LOG DETAILS — Supporting Evidence');

  const logTypeLabels = {
    field_work: 'Field Work',
    training_received: 'Training Received',
    training_delivered: 'Training Delivered',
    research: 'Research/Writing',
    seminars: 'Seminars/Conferences',
    professional: 'Professional Membership',
    mentoring: 'Mentoring',
  };

  experienceLogs.slice(0, 15).forEach((l, i) => {
    if (p2.y < 80) return;
    const label = logTypeLabels[l.log_type] || l.log_type;
    p2.page.drawText(`${label}: ${l.title || l.event_name || '(no title)'}`, { x: p2.x, y: p2.y, size: 8, font: boldFont, color: OLIVE });
    p2.y -= 12;
    const details = [
      l.employer ? `Employer: ${l.employer}` : '',
      l.provider ? `Provider: ${l.provider}` : '',
      l.hours ? `Hours: ${l.hours}` : '',
      l.start_date ? `Date: ${fmtDate(l.start_date)}` : '',
      l.points ? `Points: ${l.points}` : '',
    ].filter(Boolean).join('   |   ');
    p2.page.drawText(details, { x: p2.x + 8, y: p2.y, size: 7.5, font: regularFont, color: GRAY });
    p2.y -= 14;
  });

  p2.pageNumber(2);

  // ── PAGE 3: FORM 002 — CODE OF CONDUCT + CHECKLIST ─────────────────────────
  const p3 = addPage();
  p3.page.drawRectangle({ x: 0, y: PAGE_H - 32, width: PAGE_W, height: 32, color: OLIVE });
  p3.page.drawText('SECTION 3 — Form 8.2.1-002: Code of Conduct  |  Submission Checklist', { x: 36, y: PAGE_H - 20, size: 11, font: boldFont, color: GOLD });
  p3.y = PAGE_H - 50;

  p3.sectionHeader('CODE OF CONDUCT — Signature Block (Form 8.2.1-002)');
  p3.page.drawText('Print these values into the Code of Conduct form signature section:', { x: p3.x, y: p3.y, size: 8, font: italicFont, color: GRAY });
  p3.y -= 14;
  p3.fullFieldRow('Full Name', fullName);
  p3.fullFieldRow('Day', String(today.getDate()));
  p3.fullFieldRow('Month', String(today.getMonth() + 1));
  p3.fullFieldRow('Year', String(today.getFullYear()));
  p3.noteRow('Sign the physical/digital form — this document does not replace the signature');

  p3.sectionHeader('SUBMISSION CHECKLIST — Form 8.2.1-075 Page 6');
  p3.space(4);
  const checklist = [
    'Application Form 8.2.1-075 — completed and signed',
    'Renewal fee payment — credit card section completed',
    'SCS Application 8.2.1-073 — completed and signed',
    'Code of Conduct 8.2.1-002 — signed',
    'Employer / Supervisor / Sponsor attestation signatures',
    'Supporting evidence documents attached (training certificates, etc.)',
  ];
  checklist.forEach(item => {
    p3.page.drawRectangle({ x: p3.x + 4, y: p3.y - 4, width: 12, height: 12, color: WHITE, borderColor: GRAY, borderWidth: 1 });
    p3.page.drawText(item, { x: p3.x + 22, y: p3.y, size: 9, font: regularFont, color: BLACK });
    p3.y -= 18;
  });

  p3.sectionHeader('EMAIL SUBMISSION DETAILS');
  p3.fullFieldRow('To', 'ndtrecertification-endrecertification@nrcan-rncan.gc.ca');
  p3.fullFieldRow('Subject', `Renewal Application — ${fullName} — Reg# ${cert.nrcan_id || ''} — ${method} Level ${level}`);
  p3.space(8);
  p3.page.drawText('Attach all 3 signed PDF forms to your email before sending.', { x: p3.x, y: p3.y, size: 9, font: boldFont, color: OLIVE });
  p3.y -= 16;

  p3.sectionHeader('CERTIFICATION SUMMARY');
  p3.fieldRow('Technician', fullName, 'Reg#', cert.nrcan_id);
  p3.fieldRow('Certification', cert.certification_name, 'Employer', cert.employer_name);
  p3.fieldRow('Issue Date', fmtDate(cert.issue_date), 'Expiry Date', fmtDate(cert.expiry_date));
  p3.fieldRow('Governing Body', cert.governing_body, 'SCS Applicable', cert.scs_applicable ? 'Yes' : 'No');
  p3.fieldRow('Supervisor', cert.supervisor_name, 'Supervisor Email', cert.supervisor_email);

  p3.space(16);
  p3.page.drawRectangle({ x: p3.x, y: p3.y - 40, width: p3.width, height: 50, color: CREAM, borderColor: GOLD, borderWidth: 1 });
  p3.page.drawText('This Data Pack was generated by the NRCan NDT Certification Tracker app.', { x: p3.x + 8, y: p3.y - 8, size: 8, font: italicFont, color: GRAY });
  p3.page.drawText('It is a reference tool to help complete the official NRCan forms — not a replacement for them.', { x: p3.x + 8, y: p3.y - 22, size: 8, font: italicFont, color: GRAY });
  p3.page.drawText(`Generated: ${today.toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, { x: p3.x + 8, y: p3.y - 36, size: 8, font: regularFont, color: GRAY });
  p3.pageNumber(3);

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
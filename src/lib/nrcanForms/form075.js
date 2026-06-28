/**
 * NRCan Form 8.2.1-075 — Renewal Application Form for NDT Certification
 * Pixel-perfect reconstruction matching official template
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const C = {
  black: rgb(0, 0, 0),
  white: rgb(1, 1, 1),
  govBlue: rgb(0.0, 0.27, 0.53),
  headerBg: rgb(0.145, 0.195, 0.37),
  protectedRed: rgb(0.8, 0, 0),
  lightGray: rgb(0.88, 0.88, 0.88),
  midGray: rgb(0.5, 0.5, 0.5),
  tableHeader: rgb(0.22, 0.31, 0.55),
  rowAlt: rgb(0.93, 0.95, 0.97),
  fieldBg: rgb(0.96, 0.97, 0.99),
};

function pt(mm) { return mm * 2.8346; }

function drawBox(page, x, y, w, h, { fill, border, borderWidth = 0.5 } = {}) {
  if (fill) page.drawRectangle({ x, y, width: w, height: h, color: fill });
  if (borderWidth > 0) page.drawRectangle({ x, y, width: w, height: h, borderColor: border || C.black, borderWidth, color: rgb(0,0,0,0) });
}

function drawText(page, text, x, y, { font, size = 9, color = C.black, maxWidth } = {}) {
  if (!text && text !== 0) return;
  page.drawText(String(text), { x, y, size, font, color, maxWidth });
}

function drawLine(page, x1, y1, x2, y2, { color = C.black, thickness = 0.5 } = {}) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
}

// Draw checkbox with X
function drawCheckbox(page, x, y, checked, size = 9) {
  const boxSize = size + 2;
  drawBox(page, x, y - boxSize, boxSize, boxSize, { border: C.black, borderWidth: 0.75 });
  if (checked) {
    const xMark = size * 0.7;
    drawLine(page, x + 2, y - 2, x + xMark, y - boxSize + 2, { color: C.black, thickness: 0.5 });
    drawLine(page, x + xMark, y - 2, x + 2, y - boxSize + 2, { color: C.black, thickness: 0.5 });
  }
}

export async function generateForm075(cert, experienceLogs = [], user = {}) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const pageW = 612, pageH = 792;
  const M = 36;

  // ─── PAGE 1 ───────────────────────────────────────────────────────────────
  const p1 = pdfDoc.addPage([pageW, pageH]);
  let y = pageH;

  // Canada wordmark bar
  drawBox(p1, 0, pageH - 32, pageW, 32, { fill: rgb(0.98, 0.98, 0.98), borderWidth: 0 });
  drawLine(p1, 0, pageH - 32, pageW, pageH - 32, { color: C.lightGray, thickness: 0.5 });
  drawText(p1, 'Canada', M, pageH - 21, { font: boldFont, size: 14, color: C.govBlue });
  drawText(p1, 'Natural Resources Canada', pageW - M - 170, pageH - 21, { font: boldFont, size: 9.5, color: C.govBlue });

  // Header block
  drawBox(p1, 0, pageH - 108, pageW, 76, { fill: C.headerBg, borderWidth: 0 });
  drawBox(p1, M, pageH - 92, 90, 16, { fill: C.white, border: C.protectedRed, borderWidth: 1 });
  drawText(p1, 'PROTECTED', M + 12, pageH - 82, { font: boldFont, size: 8, color: C.protectedRed });
  drawText(p1, '(when complete)', M + 52, pageH - 82, { font: italicFont, size: 7, color: C.midGray });
  
  drawText(p1, 'RENEWAL APPLICATION FORM FOR NON-DESTRUCTIVE TESTING CERTIFICATION', M, pageH - 62, { font: boldFont, size: 11, color: C.white });
  drawText(p1, 'for certifications due for renewal April 15, 2026 and later', M, pageH - 76, { font: italicFont, size: 9, color: rgb(0.85, 0.85, 0.85) });
  drawText(p1, '8.2.1-075', pageW - M - 65, pageH - 62, { font: boldFont, size: 11, color: rgb(1, 0.85, 0.2) });

  y = pageH - 120;

  // Intro text
  const intro = 'These documents must be completed in their entirety to be processed by the Natural Resources Canada (NRCan) National Non-Destructive Testing Certification Body (NDTCB). This application form is for candidates applying for NDT certification renewal according to CAN/CGSB-48.9712-2022 whose certifications expire April 15, 2026 and later.';
  drawText(p1, intro, M, y, { font: italicFont, size: 7.5, color: C.midGray, maxWidth: pageW - M * 2 });
  y -= 30;

  // SECTION 1
  drawBox(p1, M, y - 2, pageW - M * 2, 15, { fill: C.tableHeader, borderWidth: 0 });
  drawText(p1, 'SECTION 1 — PERSONAL INFORMATION', M + 5, y + 2.5, { font: boldFont, size: 9.5, color: C.white });
  y -= 20;

  const nameParts = (cert.technician_name || '').trim().split(' ');
  const firstName = nameParts.slice(0, -1).join(' ');
  const lastName = nameParts.slice(-1)[0] || '';
  const halfW = (pageW - M * 2 - 10) / 2;

  // Language + Reg number
  drawText(p1, 'Preferred Language:', M, y, { font: boldFont, size: 8.5 });
  drawCheckbox(p1, M + 100, y, true, 9);
  drawText(p1, 'English', M + 112, y, { font, size: 8.5 });
  drawCheckbox(p1, M + 155, y, false, 9);
  drawText(p1, 'Français', M + 167, y, { font, size: 8.5 });
  
  drawText(p1, 'NRCan NDTCB Registration #:', pageW - M - 200, y, { font: boldFont, size: 8.5 });
  drawBox(p1, pageW - M - 100, y - 10, 100, 15, { border: C.black, borderWidth: 0.75 });
  drawText(p1, cert.nrcan_id || '', pageW - M - 95, y - 6, { font: boldFont, size: 9 });
  y -= 22;

  // Surname / Given Names
  drawText(p1, 'Surname (Last Name):', M, y, { font: boldFont, size: 8.5 });
  drawText(p1, lastName, M + 110, y, { font, size: 9, maxWidth: halfW - 110 });
  drawLine(p1, M + 110, y - 2, M + halfW, y - 2, { color: C.lightGray });
  
  drawText(p1, 'Given Names:', M + halfW + 10, y, { font: boldFont, size: 8.5 });
  drawText(p1, firstName, M + halfW + 75, y, { font, size: 9, maxWidth: halfW - 75 });
  drawLine(p1, M + halfW + 75, y - 2, pageW - M, y - 2, { color: C.lightGray });
  y -= 20;

  // DOB
  drawText(p1, 'Date of Birth (YYYY/MM/DD):', M, y, { font: boldFont, size: 8.5 });
  drawBox(p1, M + 140, y - 10, 35, 14, { border: C.black, borderWidth: 0.75 });
  drawBox(p1, M + 180, y - 10, 25, 14, { border: C.black, borderWidth: 0.75 });
  drawBox(p1, M + 210, y - 10, 30, 14, { border: C.black, borderWidth: 0.75 });
  drawText(p1, 'YYYY', M + 143, y - 7, { font, size: 7, color: C.midGray });
  drawText(p1, 'MM', M + 183, y - 7, { font, size: 7, color: C.midGray });
  drawText(p1, 'DD', M + 213, y - 7, { font, size: 7, color: C.midGray });
  y -= 22;

  // Address
  drawText(p1, 'Address of Residence:', M, y, { font: boldFont, size: 8.5 });
  drawLine(p1, M + 110, y - 2, pageW - M, y - 2, { color: C.lightGray });
  y -= 18;

  // City / Province / Postal
  drawText(p1, 'City:', M, y, { font: boldFont, size: 8.5 });
  drawLine(p1, M + 35, y - 2, M + 150, y - 2, { color: C.lightGray });
  drawText(p1, 'Province/Territory:', M + 160, y, { font: boldFont, size: 8.5 });
  drawLine(p1, M + 260, y - 2, M + 380, y - 2, { color: C.lightGray });
  drawText(p1, 'Postal Code:', M + 390, y, { font: boldFont, size: 8.5 });
  drawLine(p1, M + 455, y - 2, pageW - M, y - 2, { color: C.lightGray });
  y -= 22;

  // Email / Phone
  drawText(p1, 'Primary Email Address:', M, y, { font: boldFont, size: 8.5 });
  drawText(p1, cert.technician_email || '', M + 120, y, { font, size: 9, maxWidth: 200 });
  drawLine(p1, M + 120, y - 2, M + 320, y - 2, { color: C.lightGray });
  
  drawText(p1, 'Telephone:', M + 340, y, { font: boldFont, size: 8.5 });
  drawLine(p1, M + 395, y - 2, pageW - M, y - 2, { color: C.lightGray });
  y -= 26;

  // SECTION 2
  drawBox(p1, M, y - 2, pageW - M * 2, 15, { fill: C.tableHeader, borderWidth: 0 });
  drawText(p1, 'SECTION 2 — PRESENT EMPLOYER', M + 5, y + 2.5, { font: boldFont, size: 9.5, color: C.white });
  y -= 20;

  drawText(p1, 'Present Employer:', M, y, { font: boldFont, size: 8.5 });
  drawText(p1, cert.employer_name || '', M + 95, y, { font, size: 9, maxWidth: halfW - 95 });
  drawLine(p1, M + 95, y - 2, M + halfW, y - 2, { color: C.lightGray });
  
  drawText(p1, 'Contact Name:', M + halfW + 10, y, { font: boldFont, size: 8.5 });
  drawText(p1, cert.supervisor_name || '', M + halfW + 80, y, { font, size: 9, maxWidth: halfW - 80 });
  drawLine(p1, M + halfW + 80, y - 2, pageW - M, y - 2, { color: C.lightGray });
  y -= 18;

  drawText(p1, 'Employer Email:', M, y, { font: boldFont, size: 8.5 });
  drawText(p1, cert.employer_email || '', M + 95, y, { font, size: 9, maxWidth: halfW - 95 });
  drawLine(p1, M + 95, y - 2, M + halfW, y - 2, { color: C.lightGray });
  
  drawText(p1, 'Employer Telephone:', M + halfW + 10, y, { font: boldFont, size: 8.5 });
  drawLine(p1, M + halfW + 115, y - 2, pageW - M, y - 2, { color: C.lightGray });
  y -= 26;

  // SECTION 3
  drawBox(p1, M, y - 2, pageW - M * 2, 15, { fill: C.tableHeader, borderWidth: 0 });
  drawText(p1, 'SECTION 3 — CERTIFICATIONS BEING RENEWED', M + 5, y + 2.5, { font: boldFont, size: 9.5, color: C.white });
  y -= 18;

  drawText(p1, 'I am applying to renew the following method/sector-specific NDT certifications:', M, y, { font: italicFont, size: 8 });
  y -= 16;

  // Method grid
  const methods = [
    { code: 'RT', label: 'Radiographic testing' },
    { code: 'UT', label: 'Ultrasonic testing' },
    { code: 'UT-PA', label: 'UT Phased array' },
    { code: 'MT', label: 'Magnetic testing' },
    { code: 'PT', label: 'Penetrant testing' },
    { code: 'ET', label: 'Eddy current testing' },
    { code: 'VT', label: 'Visual testing' },
  ];
  const certUpper = (cert.certification_name || '').toUpperCase();
  const colW = (pageW - M * 2) / 4;

  methods.forEach((m, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const cx = M + col * colW;
    const cy = y - row * 18;
    const checked = certUpper.includes(m.code);
    drawCheckbox(p1, cx, cy, checked, 9);
    drawText(p1, m.code, cx + 12, cy, { font: checked ? boldFont : font, size: 9 });
    drawText(p1, m.label, cx + 40, cy - 1, { font, size: 7.5, color: C.midGray });
  });
  y -= 42;

  // Payment
  drawText(p1, 'To be paid by:', M, y, { font: boldFont, size: 8.5 });
  drawCheckbox(p1, M + 75, y, true, 9);
  drawText(p1, 'Applicant', M + 87, y, { font, size: 8.5 });
  drawCheckbox(p1, M + 155, y, false, 9);
  drawText(p1, 'Company or third party', M + 167, y, { font, size: 8.5 });
  y -= 24;

  // SECTION 4
  drawBox(p1, M, y - 2, pageW - M * 2, 15, { fill: C.tableHeader, borderWidth: 0 });
  drawText(p1, 'SECTION 4 — RECORD OF EXPERIENCE (Past 5 Years)', M + 5, y + 2.5, { font: boldFont, size: 9.5, color: C.white });
  y -= 18;

  const fieldWork = experienceLogs.filter(l => l.log_type === 'field_work').slice(0, 2);
  
  ['Position 1', 'Position 2'].forEach((pos, i) => {
    const log = fieldWork[i];
    drawText(p1, pos, M, y, { font: boldFont, size: 8.5, color: C.govBlue });
    y -= 14;
    
    drawText(p1, 'Company:', M, y, { font: boldFont, size: 8.5 });
    drawText(p1, log?.employer || cert.employer_name || '', M + 50, y, { font, size: 8.5, maxWidth: 180 });
    drawLine(p1, M + 50, y - 2, M + 230, y - 2, { color: C.lightGray });
    
    drawText(p1, 'Period:', M + 250, y, { font: boldFont, size: 8.5 });
    const fromD = log?.start_date || '________';
    const toD = log?.end_date || '________';
    drawText(p1, `From: ${fromD}  To: ${toD}`, M + 290, y, { font, size: 8.5 });
    y -= 16;
  });

  // Work history grid
  drawText(p1, 'General work history in NDT during the past five (5) years:', M, y, { font: italicFont, size: 7.5 });
  y -= 14;

  const industries = ['Aviation/Aerospace', 'Nuclear', 'Petro-chemical', 'Manufacturing', 'Mining', 'Pulp and paper'];
  const applications = ['Welds', 'Forgings', 'Castings', 'Pipe/tubes', 'Fittings/valves', 'Pressure vessels'];
  const materials = ['Steel', 'Stainless steel', 'Copper', 'Aluminum', 'Magnesium', 'Concrete'];
  const colWGrid = (pageW - M * 2) / 3;

  [
    { header: 'Industry', items: industries },
    { header: 'Applications', items: applications },
    { header: 'Materials', items: materials },
  ].forEach((col, ci) => {
    drawBox(p1, M + ci * colWGrid, y - 2, colWGrid, 13, { fill: C.rowAlt, borderWidth: 0 });
    drawText(p1, col.header, M + ci * colWGrid + 4, y, { font: boldFont, size: 8 });
    col.items.forEach((item, ri) => {
      const ry = y - 14 - ri * 13;
      drawCheckbox(p1, M + ci * colWGrid + 2, ry, false, 8);
      drawText(p1, item, M + ci * colWGrid + 13, ry, { font, size: 7 });
    });
  });
  y -= 14 + Math.max(industries.length, applications.length, materials.length) * 12 + 8;

  // Footer
  drawLine(p1, M, y, pageW - M, y, { color: C.lightGray });
  y -= 10;
  drawText(p1, 'DOCUMENT MUST BE COMPLETED IN ITS ENTIRETY FOR PROCESSING', M, y, { font: boldFont, size: 8, color: C.protectedRed });
  drawText(p1, 'Page 1 of 3', pageW - M - 50, y, { font, size: 8, color: C.midGray });

  // ─── PAGE 2: Attestations ─────────────────────────────────────────────────
  const p2 = pdfDoc.addPage([pageW, pageH]);
  y = pageH - 50;

  drawBox(p2, 0, pageH - 40, pageW, 40, { fill: C.headerBg, borderWidth: 0 });
  drawText(p2, '8.2.1-075 — Renewal Application Form (continued)', M, pageH - 23, { font: boldFont, size: 9.5, color: C.white });
  drawText(p2, 'PROTECTED (when complete)', M, pageH - 35, { font: italicFont, size: 7.5, color: rgb(1, 0.85, 0.2) });
  y = pageH - 54;

  drawBox(p2, M, y - 2, pageW - M * 2, 15, { fill: C.tableHeader, borderWidth: 0 });
  drawText(p2, 'SECTION 5 — ATTESTATIONS', M + 5, y + 2.5, { font: boldFont, size: 9.5, color: C.white });
  y -= 20;

  drawText(p2, 'Please Note: All attestation sections must be completed. Applicants cannot sign for themselves.', M, y, { font: italicFont, size: 7.5, color: C.protectedRed, maxWidth: pageW - M * 2 });
  y -= 22;

  const attestations = [
    { label: 'A) Employer Attestation', role: 'Employer', name: cert.employer_name, email: cert.employer_email },
    { label: 'B) Supervisor Attestation', role: 'Supervisor', name: cert.supervisor_name, email: cert.supervisor_email },
    { label: 'C) Qualified Personnel (Referee) Attestation', role: 'Referee', name: '', email: '' },
    { label: 'D) Applicant Declaration', role: 'Applicant', name: cert.technician_name, email: cert.technician_email },
  ];

  attestations.forEach((att) => {
    drawBox(p2, M, y - 2, pageW - M * 2, 14, { fill: C.rowAlt, borderWidth: 0 });
    drawText(p2, att.label, M + 5, y + 2, { font: boldFont, size: 9, color: C.govBlue });
    y -= 18;

    const attText = att.role === 'Applicant'
      ? 'I hereby certify that to the best of my knowledge the information given on this form is true, complete and correct.'
      : 'I, the undersigned, certify that the information in this application pertaining to the applicant\'s NDT activities is true, accurate and complete to the best of my knowledge.';
    drawText(p2, attText, M, y, { font: italicFont, size: 7.5, maxWidth: pageW - M * 2 });
    y -= 16;

    drawText(p2, 'Full Name:', M, y, { font: boldFont, size: 8.5 });
    drawText(p2, att.name || '', M + 55, y, { font, size: 8.5, maxWidth: 150 });
    drawLine(p2, M + 55, y - 2, M + 205, y - 2, { color: C.lightGray });
    
    drawText(p2, 'Title/Role:', M + 220, y, { font: boldFont, size: 8.5 });
    drawText(p2, att.role, M + 275, y, { font, size: 8.5 });
    drawLine(p2, M + 275, y - 2, M + 400, y - 2, { color: C.lightGray });
    y -= 18;

    drawText(p2, 'Email:', M, y, { font: boldFont, size: 8.5 });
    drawText(p2, att.email || '', M + 35, y, { font, size: 8.5, maxWidth: 200 });
    drawLine(p2, M + 35, y - 2, M + 235, y - 2, { color: C.lightGray });
    
    drawText(p2, 'Date (YYYY/MM/DD):', M + 250, y, { font: boldFont, size: 8.5 });
    drawBox(p2, M + 340, y - 10, 35, 14, { border: C.black, borderWidth: 0.75 });
    drawBox(p2, M + 380, y - 10, 25, 14, { border: C.black, borderWidth: 0.75 });
    drawBox(p2, M + 410, y - 10, 30, 14, { border: C.black, borderWidth: 0.75 });
    y -= 20;

    drawText(p2, 'Signature:', M, y, { font: boldFont, size: 8.5 });
    drawBox(p2, M, y - 32, pageW - M * 2, 38, { border: C.lightGray, borderWidth: 0.75 });
    if (att.role === 'Applicant') {
      drawText(p2, '[ Sign here after printing ]', M + 10, y - 18, { font: italicFont, size: 8, color: C.midGray });
    }
    y -= 44;
    drawLine(p2, M, y, pageW - M, y, { color: C.lightGray, thickness: 0.3 });
    y -= 12;
  });

  drawLine(p2, M, 28, pageW - M, 28, { color: C.lightGray });
  drawText(p2, 'DOCUMENT MUST BE COMPLETED IN ITS ENTIRETY FOR PROCESSING', M, 18, { font: boldFont, size: 8, color: C.protectedRed });
  drawText(p2, 'Page 2 of 3', pageW - M - 50, 18, { font, size: 8, color: C.midGray });

  // ─── PAGE 3: Checklist & Payment ──────────────────────────────────────────
  const p3 = pdfDoc.addPage([pageW, pageH]);
  y = pageH - 50;

  drawBox(p3, 0, pageH - 40, pageW, 40, { fill: C.headerBg, borderWidth: 0 });
  drawText(p3, '8.2.1-075 — Renewal Application Form (continued)', M, pageH - 23, { font: boldFont, size: 9.5, color: C.white });
  drawText(p3, 'PROTECTED (when complete)', M, pageH - 35, { font: italicFont, size: 7.5, color: rgb(1, 0.85, 0.2) });
  y = pageH - 54;

  drawBox(p3, M, y - 2, pageW - M * 2, 15, { fill: C.tableHeader, borderWidth: 0 });
  drawText(p3, 'SECTION 6 — SUBMISSION CHECKLIST', M + 5, y + 2.5, { font: boldFont, size: 9.5, color: C.white });
  y -= 20;

  const checklist = [
    '[X] 8.2.1-075 Renewal Application Form — fully completed and signed',
    '[X] 8.2.1-073 Structured Credit System Application Form — one per method',
    '[X] 8.2.1-002 NRCan NDTCB Code of Conduct — signed',
    '[ ] Vision Test Report Form 8.2.1-003 — if applicable',
    '[ ] 2 Passport-style photos — if required',
    '[X] Renewal fee payment — Receiver General for Canada',
  ];
  checklist.forEach(item => {
    drawText(p3, item, M, y, { font, size: 9, maxWidth: pageW - M * 2 });
    y -= 15;
  });
  y -= 10;

  drawBox(p3, M, y - 2, pageW - M * 2, 15, { fill: C.tableHeader, borderWidth: 0 });
  drawText(p3, 'SECTION 7 — PAYMENT INFORMATION', M + 5, y + 2.5, { font: boldFont, size: 9.5, color: C.white });
  y -= 20;

  const paymentLines = [
    'Company cheques/money orders payable to "Receiver General for Canada".',
    'Personal cheques NOT accepted. Government Acquisition Cards NOT accepted.',
    'Payment from Other Government Departments: inter-departmental FIS transactions.',
    'DO NOT submit credit card information by email. Fees non-refundable.',
    'Applications after expiry date must include LATE FEE.',
  ];
  paymentLines.forEach(line => {
    drawText(p3, line, M, y, { font, size: 8.5, maxWidth: pageW - M * 2 });
    y -= 14;
  });
  y -= 12;
  drawText(p3, 'For fee questions: 1-866-858-0473 or ndt-end@nrcan-rncan.gc.ca', M, y, { font: boldFont, size: 8.5 });
  y -= 14;
  drawText(p3, 'Submit to: ndtcb-ocend@nrcan-rncan.gc.ca', M, y, { font: boldFont, size: 8.5 });
  y -= 24;

  drawBox(p3, M, y - 16, pageW - M * 2, 18, { fill: rgb(0.96, 0.96, 0.96), borderWidth: 0 });
  drawText(p3, `Generated for: ${cert.technician_name} | ${cert.certification_name} | Expiry: ${cert.expiry_date}`, M + 5, y - 9, { font: italicFont, size: 7.5, color: C.midGray });
  y -= 26;

  drawLine(p3, M, 28, pageW - M, 28, { color: C.lightGray });
  drawText(p3, 'DOCUMENT MUST BE COMPLETED IN ITS ENTIRETY FOR PROCESSING', M, 18, { font: boldFont, size: 8, color: C.protectedRed });
  drawText(p3, 'Page 3 of 3', pageW - M - 50, 18, { font, size: 8, color: C.midGray });

  return await pdfDoc.save();
}
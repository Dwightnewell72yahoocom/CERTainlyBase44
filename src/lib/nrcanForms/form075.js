/**
 * NRCan Form 8.2.1-075 — Renewal Application Form for NDT Certification
 * Pixel-perfect reconstruction in pdf-lib
 */
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

const C = {
  black: rgb(0, 0, 0),
  white: rgb(1, 1, 1),
  govBlue: rgb(0.0, 0.27, 0.53),       // Canada wordmark blue
  headerBg: rgb(0.18, 0.25, 0.47),      // NRCan dark navy header
  lightGray: rgb(0.85, 0.85, 0.85),
  midGray: rgb(0.5, 0.5, 0.5),
  tableHeader: rgb(0.22, 0.31, 0.55),
  rowAlt: rgb(0.94, 0.94, 0.96),
  red: rgb(0.6, 0, 0),
};

function pt(mm) { return mm * 2.8346; }

// Draw a box with optional fill and border
function drawBox(page, x, y, w, h, { fill, border = C.black, borderWidth = 0.5 } = {}) {
  if (fill) page.drawRectangle({ x, y, width: w, height: h, color: fill });
  if (borderWidth > 0) page.drawRectangle({ x, y, width: w, height: h, borderColor: border, borderWidth, color: rgb(0,0,0,0) });
}

// Draw text clipped within a box
function drawText(page, text, x, y, { font, size = 9, color = C.black, maxWidth } = {}) {
  if (!text) return;
  page.drawText(String(text), { x, y, size, font, color, maxWidth });
}

function drawLine(page, x1, y1, x2, y2, { color = C.black, thickness = 0.5 } = {}) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
}

// Draw a labeled field row: "Label: [value]"
function drawField(page, label, value, x, y, w, { font, boldFont, size = 9, lineH = 14 } = {}) {
  drawText(page, label, x, y, { font: boldFont, size, color: C.black });
  const labelW = label.length * size * 0.52;
  drawText(page, value || '', x + labelW + 4, y, { font, size, color: C.black, maxWidth: w - labelW - 4 });
  drawLine(page, x + labelW + 4, y - 2, x + w, y - 2, { color: C.lightGray });
}

export async function generateForm075(cert, experienceLogs = [], user = {}) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // ─── PAGE 1: Cover / Applicant Info ───────────────────────────────────────
  const p1 = pdfDoc.addPage([612, 792]); // Letter
  const { width, height } = p1.getSize();
  const M = 36; // margin

  // Canada wordmark bar (top)
  drawBox(p1, 0, height - 28, width, 28, { fill: rgb(0.98, 0.98, 0.98), borderWidth: 0 });
  drawLine(p1, 0, height - 28, width, height - 28, { color: C.lightGray });
  drawText(p1, 'Canada', M, height - 20, { font: boldFont, size: 13, color: C.govBlue });
  drawText(p1, 'Natural Resources Canada', width - M - 160, height - 20, { font: boldFont, size: 9, color: C.govBlue });

  // Header block
  drawBox(p1, 0, height - 100, width, 72, { fill: C.headerBg, borderWidth: 0 });
  drawText(p1, 'PROTECTED (when complete)', M, height - 42, { font: boldFont, size: 8, color: rgb(1, 0.8, 0) });
  drawText(p1, 'RENEWAL APPLICATION FORM FOR NON-DESTRUCTIVE TESTING CERTIFICATION', M, height - 58, { font: boldFont, size: 10.5, color: C.white });
  drawText(p1, 'for certifications due for renewal April 15, 2026 and later', M, height - 72, { font: italicFont, size: 8.5, color: rgb(0.85, 0.85, 0.85) });
  drawText(p1, '8.2.1-075', width - M - 60, height - 58, { font: boldFont, size: 10, color: rgb(1, 0.8, 0) });

  let y = height - 112;

  // Instruction paragraph
  const instrText = 'These documents must be completed in their entirety to be processed by the Natural Resources Canada (NRCan) National Non-Destructive Testing Certification Body (NDTCB). This application form is for candidates applying for NDT certification renewal according to CAN/CGSB-48.9712-2022 whose certifications expire April 15, 2026 and later.';
  drawText(p1, instrText, M, y, { font: italicFont, size: 7.5, color: C.midGray, maxWidth: width - M * 2 });
  y -= 28;

  // Section divider
  drawLine(p1, M, y, width - M, y, { color: C.lightGray });
  y -= 14;

  // ── SECTION 1: Personal Information ─────────────────────────────────────
  drawBox(p1, M, y - 2, width - M * 2, 14, { fill: C.tableHeader, borderWidth: 0 });
  drawText(p1, 'SECTION 1 — PERSONAL INFORMATION', M + 4, y + 2, { font: boldFont, size: 9, color: C.white });
  y -= 18;

  const nameParts = (cert.technician_name || '').trim().split(' ');
  const firstName = nameParts.slice(0, -1).join(' ');
  const lastName = nameParts.slice(-1)[0] || '';
  const halfW = (width - M * 2 - 8) / 2;

  // Row: Preferred Language + Registration
  drawText(p1, 'Preferred Language:', M, y, { font: boldFont, size: 8 });
  drawText(p1, '☒ English  ☐ Français', M + 90, y, { font, size: 8 });
  drawText(p1, 'NRCan NDTCB Registration #:', width - M - 180, y, { font: boldFont, size: 8 });
  drawBox(p1, width - M - 90, y - 10, 90, 14, { borderWidth: 0.5, border: C.lightGray });
  drawText(p1, cert.nrcan_id || '', width - M - 86, y - 6, { font, size: 9 });
  y -= 20;

  // Surname / Given Names
  drawField(p1, 'Surname (Last Name):', lastName, M, y, halfW, { font, boldFont });
  drawField(p1, 'Given Names:', firstName, M + halfW + 8, y, halfW, { font, boldFont });
  y -= 18;

  // DOB
  drawField(p1, 'Date of Birth (YYYY/MM/DD):', user.dob || '_____ / __ / __', M, y, halfW, { font, boldFont });
  y -= 18;

  // Address
  drawField(p1, 'Address of Residence:', cert.technician_address || '', M, y, width - M * 2, { font, boldFont });
  y -= 18;
  drawField(p1, 'City:', cert.technician_city || '', M, y, halfW * 0.6, { font, boldFont });
  drawField(p1, 'Province/Territory:', cert.technician_province || '', M + halfW * 0.6 + 8, y, halfW * 0.55, { font, boldFont });
  drawField(p1, 'Postal Code:', cert.technician_postal || '', M + halfW * 1.2 + 16, y, halfW * 0.4, { font, boldFont });
  y -= 18;

  // Email / Phone
  drawField(p1, 'Primary Email Address:', cert.technician_email || '', M, y, halfW + 20, { font, boldFont });
  drawField(p1, 'Telephone:', user.phone || '', M + halfW + 28, y, halfW - 20, { font, boldFont });
  y -= 22;

  // ── SECTION 2: Present Employer ──────────────────────────────────────────
  drawBox(p1, M, y - 2, width - M * 2, 14, { fill: C.tableHeader, borderWidth: 0 });
  drawText(p1, 'SECTION 2 — PRESENT EMPLOYER', M + 4, y + 2, { font: boldFont, size: 9, color: C.white });
  y -= 18;

  drawField(p1, 'Present Employer:', cert.employer_name || '', M, y, width - M * 2, { font, boldFont });
  y -= 18;
  drawField(p1, 'Contact Name:', cert.supervisor_name || '', M, y, halfW, { font, boldFont });
  drawField(p1, 'Job Title:', '', M + halfW + 8, y, halfW, { font, boldFont });
  y -= 18;
  drawField(p1, 'Employer Email:', cert.employer_email || '', M, y, halfW + 20, { font, boldFont });
  drawField(p1, 'Employer Telephone:', '', M + halfW + 28, y, halfW - 20, { font, boldFont });
  y -= 22;

  // ── SECTION 3: Certifications Being Renewed ──────────────────────────────
  drawBox(p1, M, y - 2, width - M * 2, 14, { fill: C.tableHeader, borderWidth: 0 });
  drawText(p1, 'SECTION 3 — CERTIFICATIONS BEING RENEWED', M + 4, y + 2, { font: boldFont, size: 9, color: C.white });
  y -= 18;

  drawText(p1, 'I am applying to renew the following method/sector-specific NDT certifications:', M, y, { font: italicFont, size: 8 });
  y -= 14;

  // Method checkboxes grid
  const methods = ['RT', 'UT', 'UT-PA', 'MT', 'PT', 'ET', 'VT', 'XF', 'CEDO'];
  const certUpper = (cert.certification_name || '').toUpperCase();
  const colW = (width - M * 2) / 5;

  methods.forEach((m, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const cx = M + col * colW;
    const cy = y - row * 16;
    const checked = certUpper.includes(m.replace('-', '')) || certUpper.includes(m);
    drawText(p1, checked ? '☒' : '☐', cx, cy, { font, size: 10 });
    drawText(p1, m, cx + 14, cy, { font: checked ? boldFont : font, size: 9 });
  });
  y -= 38;

  drawText(p1, 'To be paid by:', M, y, { font: boldFont, size: 8 });
  const paidByApplicant = true;
  drawText(p1, paidByApplicant ? '☒ Applicant' : '☐ Applicant', M + 74, y, { font, size: 8 });
  drawText(p1, '☐ Company or third party', M + 140, y, { font, size: 8 });
  y -= 22;

  // ── SECTION 4: Record of Experience ─────────────────────────────────────
  drawBox(p1, M, y - 2, width - M * 2, 14, { fill: C.tableHeader, borderWidth: 0 });
  drawText(p1, 'SECTION 4 — RECORD OF EXPERIENCE (Past 5 Years)', M + 4, y + 2, { font: boldFont, size: 9, color: C.white });
  y -= 18;

  // Work positions - extract from experience logs
  const fieldWork = experienceLogs.filter(l => l.log_type === 'field_work').slice(0, 2);

  ['Position 1', 'Position 2'].forEach((pos, i) => {
    const log = fieldWork[i];
    drawText(p1, pos, M, y, { font: boldFont, size: 8, color: C.govBlue });
    y -= 12;
    drawText(p1, 'Company:', M, y, { font: boldFont, size: 8 });
    const company = log?.employer || log?.organisation || cert.employer_name || '';
    drawText(p1, company, M + 50, y, { font, size: 8, maxWidth: halfW - 50 });
    drawLine(p1, M + 50, y - 2, M + halfW, y - 2, { color: C.lightGray });
    drawText(p1, 'Period:', M + halfW + 8, y, { font: boldFont, size: 8 });
    const fromDate = log?.start_date || '';
    const toDate = log?.end_date || '';
    drawText(p1, `From: ${fromDate}  To: ${toDate}`, M + halfW + 42, y, { font, size: 8 });
    y -= 12;
    drawText(p1, 'Location:', M, y, { font: boldFont, size: 8 });
    drawLine(p1, M + 48, y - 2, M + halfW, y - 2, { color: C.lightGray });
    drawText(p1, 'Position held:', M + halfW + 8, y, { font: boldFont, size: 8 });
    drawLine(p1, M + halfW + 72, y - 2, width - M, y - 2, { color: C.lightGray });
    y -= 16;
  });

  // General work history grid (industries / applications / materials)
  drawText(p1, 'General work history in NDT during the past five (5) years (measured in percentage of work time):', M, y, { font: italicFont, size: 7.5 });
  y -= 12;

  const industries = ['Aviation/Aerospace', 'Nuclear', 'Petro-chemical', 'Manufacturing', 'Mining', 'Pulp and paper', 'Ship yard', 'Structural', 'Training/certification', 'Research'];
  const applications = ['Welds', 'Forgings', 'Castings', 'Pipe/tubes', 'Fittings/valves', 'Pressure vessels', 'Nozzles/nodes', 'Storage tanks', 'Lift equipment', 'Structures'];
  const materials = ['Steel', 'Stainless steel', 'Copper', 'Aluminum', 'Magnesium', 'Concrete', 'Ceramic', 'Plastic', 'Composites'];

  const gridCols = ['Industry', 'Applications', 'Materials'];
  const colWGrid = (width - M * 2) / 3;
  gridCols.forEach((header, ci) => {
    drawBox(p1, M + ci * colWGrid, y - 2, colWGrid, 12, { fill: C.rowAlt, borderWidth: 0 });
    drawText(p1, header, M + ci * colWGrid + 4, y, { font: boldFont, size: 7.5 });
  });
  y -= 14;

  const maxRows = Math.max(industries.length, applications.length, materials.length);
  for (let r = 0; r < Math.min(maxRows, 6); r++) {
    if (r % 2 === 0) drawBox(p1, M, y - 2, width - M * 2, 11, { fill: rgb(0.97, 0.97, 0.97), borderWidth: 0 });
    drawText(p1, `☐ ${industries[r] || ''}`, M + 2, y, { font, size: 7 });
    drawText(p1, `☐ ${applications[r] || ''}`, M + colWGrid + 2, y, { font, size: 7 });
    drawText(p1, `☐ ${materials[r] || ''}`, M + colWGrid * 2 + 2, y, { font, size: 7 });
    y -= 11;
  }
  y -= 6;

  // Footer note
  drawLine(p1, M, y, width - M, y, { color: C.lightGray });
  y -= 10;
  drawText(p1, 'DOCUMENT MUST BE COMPLETED IN ITS ENTIRETY FOR PROCESSING', M, y, { font: boldFont, size: 7.5, color: C.red });
  drawText(p1, 'Page 1 of 3', width - M - 50, y, { font, size: 7.5, color: C.midGray });

  // ─── PAGE 2: Attestations ─────────────────────────────────────────────────
  const p2 = pdfDoc.addPage([612, 792]);
  y = height - 50;

  // Header repeat
  drawBox(p2, 0, height - 38, width, 38, { fill: C.headerBg, borderWidth: 0 });
  drawText(p2, '8.2.1-075 — Renewal Application Form (continued)', M, height - 22, { font: boldFont, size: 9, color: C.white });
  drawText(p2, 'PROTECTED (when complete)', M, height - 34, { font: italicFont, size: 7.5, color: rgb(1, 0.8, 0) });
  y = height - 52;

  drawBox(p2, M, y - 2, width - M * 2, 14, { fill: C.tableHeader, borderWidth: 0 });
  drawText(p2, 'SECTION 5 — ATTESTATIONS', M + 4, y + 2, { font: boldFont, size: 9, color: C.white });
  y -= 18;

  drawText(p2, 'Please Note: All attestation sections must be completed. Applicants cannot sign for themselves.', M, y, { font: italicFont, size: 7.5, color: C.red, maxWidth: width - M * 2 });
  y -= 20;

  const attestationRoles = [
    { label: 'A) Employer Attestation', name: cert.employer_name || '', email: cert.employer_email || '', role: 'Employer' },
    { label: 'B) Supervisor Attestation', name: cert.supervisor_name || '', email: cert.supervisor_email || '', role: 'Supervisor' },
    { label: 'C) Qualified Personnel (Referee) Attestation', name: '', email: '', role: 'Referee' },
    { label: 'D) Applicant Declaration', name: cert.technician_name || '', email: cert.technician_email || '', role: 'Applicant' },
  ];

  attestationRoles.forEach((att) => {
    drawBox(p2, M, y - 2, width - M * 2, 13, { fill: C.rowAlt, borderWidth: 0 });
    drawText(p2, att.label, M + 4, y + 1, { font: boldFont, size: 8.5, color: C.govBlue });
    y -= 16;

    const attText = att.role === 'Applicant'
      ? 'I hereby certify that to the best of my knowledge the information given on this form is true, complete and correct.'
      : `I, the undersigned, certify that the information in this application pertaining to the applicant's NDT activities is true, accurate and complete to the best of my knowledge.`;
    drawText(p2, attText, M, y, { font: italicFont, size: 7.5, maxWidth: width - M * 2 });
    y -= 14;

    drawField(p2, 'Full Name:', att.name, M, y, halfW, { font, boldFont, size: 8 });
    drawField(p2, 'Title/Role:', att.role, M + halfW + 8, y, halfW, { font, boldFont, size: 8 });
    y -= 16;
    drawField(p2, 'Email:', att.email, M, y, halfW, { font, boldFont, size: 8 });
    drawField(p2, 'Date (YYYY/MM/DD):', '', M + halfW + 8, y, halfW, { font, boldFont, size: 8 });
    y -= 16;

    // Signature box
    drawText(p2, 'Signature:', M, y, { font: boldFont, size: 8 });
    drawBox(p2, M + 56, y - 26, width - M * 2 - 56, 32, { border: C.lightGray, borderWidth: 0.75 });
    if (att.role === 'Applicant') {
      drawText(p2, '[ Digital or wet signature required ]', M + 70, y - 12, { font: italicFont, size: 8, color: C.midGray });
    }
    y -= 36;
    drawLine(p2, M, y, width - M, y, { color: C.lightGray, thickness: 0.25 });
    y -= 10;
  });

  // Footer p2
  drawLine(p2, M, 28, width - M, 28, { color: C.lightGray });
  drawText(p2, 'DOCUMENT MUST BE COMPLETED IN ITS ENTIRETY FOR PROCESSING', M, 18, { font: boldFont, size: 7.5, color: C.red });
  drawText(p2, 'Page 2 of 3', width - M - 50, 18, { font, size: 7.5, color: C.midGray });

  // ─── PAGE 3: Submission Checklist & Payment ───────────────────────────────
  const p3 = pdfDoc.addPage([612, 792]);
  y = height - 50;

  drawBox(p3, 0, height - 38, width, 38, { fill: C.headerBg, borderWidth: 0 });
  drawText(p3, '8.2.1-075 — Renewal Application Form (continued)', M, height - 22, { font: boldFont, size: 9, color: C.white });
  drawText(p3, 'PROTECTED (when complete)', M, height - 34, { font: italicFont, size: 7.5, color: rgb(1, 0.8, 0) });
  y = height - 52;

  drawBox(p3, M, y - 2, width - M * 2, 14, { fill: C.tableHeader, borderWidth: 0 });
  drawText(p3, 'SECTION 6 — SUBMISSION CHECKLIST', M + 4, y + 2, { font: boldFont, size: 9, color: C.white });
  y -= 18;

  const checklist = [
    '☒ 8.2.1-075 Renewal Application Form (this document) — fully completed and signed',
    '☒ 8.2.1-073 Structured Credit System Application Form for Renewal — one per method',
    '☒ 8.2.1-002 NRCan NDTCB Code of Conduct — signed',
    '☐ Vision Test Report Form (8.2.1-003) — required if applicable',
    '☐ 2 Passport-style photos — required approximately every 10 years',
    '☒ Renewal fee payment — payable to Receiver General for Canada',
  ];

  checklist.forEach((item) => {
    drawText(p3, item, M, y, { font, size: 9, maxWidth: width - M * 2 });
    y -= 14;
  });
  y -= 10;

  drawBox(p3, M, y - 2, width - M * 2, 14, { fill: C.tableHeader, borderWidth: 0 });
  drawText(p3, 'SECTION 7 — PAYMENT INFORMATION', M + 4, y + 2, { font: boldFont, size: 9, color: C.white });
  y -= 18;

  const paymentText = [
    'Company cheques and/or money orders are payable to the "Receiver General for Canada".',
    'Personal cheques are NOT accepted. Government of Canada Acquisition Cards are NOT accepted.',
    'Payment from Other Government Departments should be made by inter-departmental FIS transactions.',
    'DO NOT submit credit card information by email. Fees are non-refundable and non-transferable.',
    'Applications received after certification expiry date must include a LATE FEE.',
    '',
    'For fee questions: 1-866-858-0473 or ndt-end@nrcan-rncan.gc.ca',
    'Submit to: ndtcb-ocend@nrcan-rncan.gc.ca',
  ];

  paymentText.forEach((line) => {
    if (line) {
      drawText(p3, line, M, y, { font: line.startsWith('For') || line.startsWith('Submit') ? boldFont : font, size: 8.5, maxWidth: width - M * 2 });
    }
    y -= 13;
  });
  y -= 10;

  // Canada flag watermark / identifier
  drawBox(p3, M, y - 14, width - M * 2, 16, { fill: rgb(0.96, 0.96, 0.96), borderWidth: 0 });
  drawText(p3, `Generated for: ${cert.technician_name} | Cert: ${cert.certification_name} | Expiry: ${cert.expiry_date}`, M + 4, y - 7, { font: italicFont, size: 7.5, color: C.midGray });
  y -= 22;

  // Footer p3
  drawLine(p3, M, 28, width - M, 28, { color: C.lightGray });
  drawText(p3, 'DOCUMENT MUST BE COMPLETED IN ITS ENTIRETY FOR PROCESSING', M, 18, { font: boldFont, size: 7.5, color: C.red });
  drawText(p3, 'Page 3 of 3', width - M - 50, 18, { font, size: 7.5, color: C.midGray });

  return await pdfDoc.save();
}
/**
 * NRCan Form 8.2.1-073 — Structured Credit System Application Form for Renewal
 * Pixel-perfect reconstruction in pdf-lib
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { calculatePoints } from '@/lib/points';

const C = {
  black: rgb(0, 0, 0),
  white: rgb(1, 1, 1),
  govBlue: rgb(0.0, 0.27, 0.53),
  headerBg: rgb(0.18, 0.25, 0.47),
  lightGray: rgb(0.85, 0.85, 0.85),
  midGray: rgb(0.5, 0.5, 0.5),
  tableHeader: rgb(0.22, 0.31, 0.55),
  rowAlt: rgb(0.94, 0.94, 0.96),
  partA: rgb(0.13, 0.40, 0.13),    // green for Part A
  partB: rgb(0.30, 0.20, 0.50),    // purple for Part B
  red: rgb(0.6, 0, 0),
  gold: rgb(0.91, 0.63, 0.13),
};

function drawBox(page, x, y, w, h, { fill, border = C.black, borderWidth = 0.5 } = {}) {
  if (fill) page.drawRectangle({ x, y, width: w, height: h, color: fill });
  if (borderWidth > 0) page.drawRectangle({ x, y, width: w, height: h, borderColor: border, borderWidth, color: rgb(0,0,0,0) });
}

function drawText(page, text, x, y, { font, size = 9, color = C.black, maxWidth } = {}) {
  if (!text && text !== 0) return;
  page.drawText(String(text), { x, y, size, font, color, maxWidth });
}

function drawLine(page, x1, y1, x2, y2, { color = C.black, thickness = 0.5 } = {}) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
}

// Determine level from cert name
function getLevel(certName = '') {
  const m = certName.match(/level\s*(\d)/i);
  return m ? parseInt(m[1]) : 2;
}

// Map our log_type to NRCan activity numbers
const ACTIVITY_MAP = {
  field_work: 1,
  training_received: 2, // theoretical = 2, practical = 3
  training_delivered: 4,
  research: 5,
  seminars: 6,         // participating = 6, presenting = 7
  professional: 8,
  mentoring: 9,
};

// Level-specific tables from CAN/CGSB-48.9712-2022
const TABLES = {
  1: { // Level 1 Table A
    partA: [
      { num: 1, label: 'Performance of NDT Activities', rate: '2/day', maxYear: 25, max5yr: 95 },
      { num: 2, label: 'Completion of theoretical training in the method', rate: '1/day', maxYear: 5, max5yr: 15 },
      { num: 3, label: 'Completion of practical training in the method', rate: '2/day', maxYear: 10, max5yr: 25 },
      { num: 4, label: 'Delivery of practical or theoretical training in NDT', rate: 'N/A', maxYear: 'N/A', max5yr: 'N/A' },
      { num: 5, label: 'Participation in research activities in NDT field', rate: '1/week', maxYear: 15, max5yr: 60 },
    ],
    partB: [
      { num: 6, label: 'Participation to a technical seminar/paper', rate: '1/day', maxYear: 2, max5yr: 10 },
      { num: 7, label: 'Presenting a technical seminar/paper', rate: '1/presentation', maxYear: 3, max5yr: 15 },
      { num: 8, label: 'Current individual membership in NDT or NDT related society', rate: '1/membership', maxYear: 2, max5yr: 5 },
      { num: 9, label: 'Technical oversight and mentoring of NDT personnel/trainee', rate: 'N/A', maxYear: 'N/A', max5yr: 'N/A' },
      { num: 10, label: 'Participation or convenorship in standardization/technical committees', rate: 'N/A', maxYear: 'N/A', max5yr: 'N/A' },
      { num: 11, label: 'Performing a technical NDT role within a certification body', rate: 'N/A', maxYear: 'N/A', max5yr: 'N/A' },
    ],
    minPartA: 75,
  },
  2: { // Level 2 Table B
    partA: [
      { num: 1, label: 'Performance of NDT Activities', rate: '2/day', maxYear: 25, max5yr: 95 },
      { num: 2, label: 'Completion of theoretical training in the method', rate: '1/day', maxYear: 5, max5yr: 15 },
      { num: 3, label: 'Completion of practical training in the method', rate: '2/day', maxYear: 10, max5yr: 25 },
      { num: 4, label: 'Delivery of practical or theoretical training in NDT in the method', rate: '1/day', maxYear: 15, max5yr: 75 },
      { num: 5, label: 'Participation in research activities in NDT field', rate: '1/week', maxYear: 15, max5yr: 60 },
    ],
    partB: [
      { num: 6, label: 'Participation to a technical seminar/paper', rate: '1/day', maxYear: 2, max5yr: 10 },
      { num: 7, label: 'Presenting a technical seminar/paper', rate: '1/presentation', maxYear: 3, max5yr: 15 },
      { num: 8, label: 'Current individual membership in NDT or NDT related society', rate: '1/membership', maxYear: 2, max5yr: 5 },
      { num: 9, label: 'Technical oversight and mentoring of NDT personnel/trainee', rate: '2/mentee', maxYear: 10, max5yr: 30 },
      { num: 10, label: 'Participation or convenorship in standardization/technical committees', rate: '1/committee', maxYear: 3, max5yr: 15 },
      { num: 11, label: 'Performing a technical NDT role within a certification body', rate: '2/activity', maxYear: 10, max5yr: 30 },
    ],
    minPartA: 50,
  },
  3: { // Level 3 Table C
    partA: [
      { num: 1, label: 'Performance of NDT Activities', rate: '2/day', maxYear: 25, max5yr: 95 },
      { num: 2, label: 'Completion of theoretical training in the method', rate: '1/day', maxYear: 5, max5yr: 15 },
      { num: 3, label: 'Completion of practical training in the method', rate: '2/day', maxYear: 10, max5yr: 25 },
      { num: 4, label: 'Delivery of practical or theoretical training in NDT in the method', rate: '1/day', maxYear: 15, max5yr: 75 },
      { num: 5, label: 'Participation in research activities in NDT field', rate: '1/week', maxYear: 15, max5yr: 60 },
    ],
    partB: [
      { num: 6, label: 'Participation to a technical seminar/paper', rate: '1/day', maxYear: 2, max5yr: 10 },
      { num: 7, label: 'Presenting a technical seminar/paper', rate: '1/presentation', maxYear: 3, max5yr: 15 },
      { num: 8, label: 'Current individual membership in NDT or NDT related society', rate: '1/membership', maxYear: 2, max5yr: 5 },
      { num: 9, label: 'Technical oversight and mentoring of NDT personnel/trainee', rate: '2/mentee', maxYear: 10, max5yr: 40 },
      { num: 10, label: 'Participation or convenorship in standardization/technical committees', rate: '1/committee', maxYear: 4, max5yr: 20 },
      { num: 11, label: 'Performing a technical NDT role within a certification body', rate: '2/activity', maxYear: 10, max5yr: 40 },
    ],
    minPartA: 50,
  },
};

// Sum points per NRCan activity number from our logs
function computePointsByActivity(logs) {
  const points = {};
  logs.forEach(log => {
    const actNum = ACTIVITY_MAP[log.log_type] || 0;
    if (!actNum) return;
    if (!points[actNum]) points[actNum] = 0;
    points[actNum] += (log.points || 0);
  });
  return points;
}

export async function generateForm073(cert, experienceLogs = []) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const level = getLevel(cert.certification_name);
  const table = TABLES[level] || TABLES[2];
  const pointsByActivity = computePointsByActivity(experienceLogs);

  const M = 36;
  const pageW = 612;
  const pageH = 792;

  // ─── PAGE 1: Header + Reference Tables ────────────────────────────────────
  const p1 = pdfDoc.addPage([pageW, pageH]);
  let y = pageH;

  // Canada top bar
  drawBox(p1, 0, pageH - 28, pageW, 28, { fill: rgb(0.98, 0.98, 0.98), borderWidth: 0 });
  drawLine(p1, 0, pageH - 28, pageW, pageH - 28, { color: C.lightGray });
  drawText(p1, 'Canada', M, pageH - 20, { font: boldFont, size: 13, color: C.govBlue });
  drawText(p1, 'Natural Resources Canada', pageW - M - 160, pageH - 20, { font: boldFont, size: 9, color: C.govBlue });

  // Header
  drawBox(p1, 0, pageH - 100, pageW, 72, { fill: C.headerBg, borderWidth: 0 });
  drawText(p1, 'PROTECTED (when complete)', M, pageH - 42, { font: boldFont, size: 8, color: C.gold });
  drawText(p1, 'STRUCTURED CREDIT SYSTEM APPLICATION FORM', M, pageH - 57, { font: boldFont, size: 11, color: C.white });
  drawText(p1, 'For Non-Destructive Testing Certification Renewal', M, pageH - 70, { font: italicFont, size: 9, color: rgb(0.85, 0.85, 0.85) });
  drawText(p1, '8.2.1-073', pageW - M - 60, pageH - 57, { font: boldFont, size: 10, color: C.gold });

  y = pageH - 112;

  const intro = `This document is required for renewal candidates applying for the structured credit system for all levels in lieu of completing a practical renewal examination. One SCS Application Form must be submitted for each method, level and sector for which renewal is being sought.`;
  drawText(p1, intro, M, y, { font: italicFont, size: 7.5, color: C.midGray, maxWidth: pageW - M * 2 });
  y -= 26;

  // ── Applicant Info ─────────────────────────────────────────────────────
  drawBox(p1, M, y - 2, pageW - M * 2, 14, { fill: C.tableHeader, borderWidth: 0 });
  drawText(p1, 'APPLICANT INFORMATION', M + 4, y + 2, { font: boldFont, size: 9, color: C.white });
  y -= 16;

  const nameParts = (cert.technician_name || '').trim().split(' ');
  const firstName = nameParts.slice(0, -1).join(' ');
  const lastName = nameParts.slice(-1)[0] || '';
  const halfW = (pageW - M * 2 - 8) / 2;

  const infoRows = [
    [['Surname (Last Name):', lastName], ['Given Names:', firstName]],
    [['NRCan NDTCB Registration #:', cert.nrcan_id || ''], ['Date of Birth (YYYY/MM/DD):', '']],
    [['Email:', cert.technician_email || ''], ['Telephone:', '']],
    [['NDT Method:', (cert.certification_name || '').match(/(MT|UT|PT|RT|ET|VT|UT-PA|XF|CEDO)/i)?.[0] || ''], ['Level:', `Level ${level}`]],
  ];

  infoRows.forEach(([left, right]) => {
    drawText(p1, left[0], M, y, { font: boldFont, size: 8 });
    drawText(p1, left[1], M + left[0].length * 4.4 + 2, y, { font, size: 8, maxWidth: halfW - left[0].length * 4.4 });
    drawLine(p1, M + left[0].length * 4.4 + 2, y - 2, M + halfW, y - 2, { color: C.lightGray });
    drawText(p1, right[0], M + halfW + 8, y, { font: boldFont, size: 8 });
    drawText(p1, right[1], M + halfW + 8 + right[0].length * 4.4 + 2, y, { font, size: 8 });
    drawLine(p1, M + halfW + 8 + right[0].length * 4.4 + 2, y - 2, pageW - M, y - 2, { color: C.lightGray });
    y -= 16;
  });
  y -= 6;

  // ── Points Table ───────────────────────────────────────────────────────
  const tableLabel = level === 1 ? 'A' : level === 3 ? 'C' : 'B';
  drawBox(p1, M, y - 2, pageW - M * 2, 14, { fill: C.tableHeader, borderWidth: 0 });
  drawText(p1, `TABLE ${tableLabel} — SCS ACTIVITIES AND POINTS (Level ${level}) — CAN/CGSB-48.9712-2022`, M + 4, y + 2, { font: boldFont, size: 8.5, color: C.white });
  y -= 16;

  // Requirement note
  const minNote = `Minimum ${table.minPartA} of the 100 points must come from Part A activities.`;
  drawText(p1, minNote, M, y, { font: boldFont, size: 8, color: C.red });
  y -= 14;

  // Table header row
  const colDefs = [
    { label: '#', w: 18 },
    { label: 'Activity Description', w: 240 },
    { label: 'Rate', w: 70 },
    { label: 'Max/Year', w: 50 },
    { label: 'Max 5yr', w: 50 },
    { label: 'Your Points', w: 62 },
  ];
  let cx = M;
  drawBox(p1, M, y - 2, pageW - M * 2, 14, { fill: C.tableHeader, borderWidth: 0 });
  colDefs.forEach(col => {
    drawText(p1, col.label, cx + 2, y + 1, { font: boldFont, size: 7.5, color: C.white });
    cx += col.w;
  });
  y -= 16;

  let totalPartA = 0, totalPartB = 0;

  // Part A rows
  drawBox(p1, M, y - 2, pageW - M * 2, 13, { fill: C.partA, borderWidth: 0 });
  drawText(p1, `Part A  (minimum ${table.minPartA} of 100 points required)`, M + 4, y + 1, { font: boldFont, size: 8, color: C.white });
  y -= 15;

  table.partA.forEach((act, i) => {
    const pts = pointsByActivity[act.num] || 0;
    const cappedPts = act.max5yr === 'N/A' ? 0 : Math.min(pts, act.max5yr);
    totalPartA += cappedPts;
    if (i % 2 === 0) drawBox(p1, M, y - 2, pageW - M * 2, 13, { fill: rgb(0.95, 0.98, 0.95), borderWidth: 0 });
    cx = M;
    const vals = [`${act.num}`, act.label, String(act.rate), String(act.maxYear), String(act.max5yr), act.max5yr === 'N/A' ? 'N/A' : `${cappedPts}`];
    colDefs.forEach((col, ci) => {
      const color = ci === 5 && cappedPts > 0 ? C.partA : C.black;
      const f = ci === 5 && cappedPts > 0 ? boldFont : (ci === 0 ? boldFont : font);
      drawText(p1, vals[ci], cx + 2, y + 1, { font: f, size: 7.5, color, maxWidth: col.w - 4 });
      cx += col.w;
    });
    y -= 13;
  });

  // Part B rows
  drawBox(p1, M, y - 2, pageW - M * 2, 13, { fill: C.partB, borderWidth: 0 });
  drawText(p1, 'Part B', M + 4, y + 1, { font: boldFont, size: 8, color: C.white });
  y -= 15;

  table.partB.forEach((act, i) => {
    const pts = pointsByActivity[act.num] || 0;
    const cappedPts = act.max5yr === 'N/A' ? 0 : Math.min(pts, act.max5yr);
    totalPartB += cappedPts;
    if (i % 2 === 0) drawBox(p1, M, y - 2, pageW - M * 2, 13, { fill: rgb(0.97, 0.95, 0.99), borderWidth: 0 });
    cx = M;
    const vals = [`${act.num}`, act.label, String(act.rate), String(act.maxYear), String(act.max5yr), act.max5yr === 'N/A' ? 'N/A' : `${cappedPts}`];
    colDefs.forEach((col, ci) => {
      const color = ci === 5 && cappedPts > 0 ? C.partB : C.black;
      const f = ci === 5 && cappedPts > 0 ? boldFont : (ci === 0 ? boldFont : font);
      drawText(p1, vals[ci], cx + 2, y + 1, { font: f, size: 7.5, color, maxWidth: col.w - 4 });
      cx += col.w;
    });
    y -= 13;
  });

  // Totals row
  const grandTotal = totalPartA + totalPartB;
  const pass = grandTotal >= 100 && totalPartA >= table.minPartA;

  drawBox(p1, M, y - 2, pageW - M * 2, 16, { fill: pass ? rgb(0.13, 0.40, 0.13) : C.red, borderWidth: 0 });
  drawText(p1, `TOTAL: ${grandTotal}/100 points  |  Part A: ${totalPartA}/${table.minPartA} minimum  |  Status: ${pass ? 'MEETS REQUIREMENTS' : 'DOES NOT MEET REQUIREMENTS'}`,
    M + 4, y + 2, { font: boldFont, size: 8.5, color: C.white });
  y -= 22;

  // Footer p1
  drawLine(p1, M, 28, pageW - M, 28, { color: C.lightGray });
  drawText(p1, 'DOCUMENT MUST BE COMPLETED IN ITS ENTIRETY FOR PROCESSING', M, 18, { font: boldFont, size: 7.5, color: C.red });
  drawText(p1, 'Page 1 of 2', pageW - M - 50, 18, { font, size: 7.5, color: C.midGray });

  // ─── PAGE 2: Supporting Evidence + Attestation ───────────────────────────
  const p2 = pdfDoc.addPage([pageW, pageH]);
  y = pageH - 50;

  drawBox(p2, 0, pageH - 38, pageW, 38, { fill: C.headerBg, borderWidth: 0 });
  drawText(p2, '8.2.1-073 — SCS Application Form (continued) — Supporting Evidence', M, pageH - 22, { font: boldFont, size: 9, color: C.white });
  drawText(p2, 'PROTECTED (when complete)', M, pageH - 34, { font: italicFont, size: 7.5, color: C.gold });
  y = pageH - 52;

  drawBox(p2, M, y - 2, pageW - M * 2, 14, { fill: C.tableHeader, borderWidth: 0 });
  drawText(p2, 'SECTION — SUPPORTING EVIDENCE LOG', M + 4, y + 2, { font: boldFont, size: 9, color: C.white });
  y -= 16;

  drawText(p2, 'List each activity/event below with supporting documentary evidence. Group by activity number (1-11).', M, y, { font: italicFont, size: 8, maxWidth: pageW - M * 2 });
  y -= 16;

  // Evidence table header
  const evCols = [
    { label: 'Act#', w: 30 },
    { label: 'Description / Title', w: 170 },
    { label: 'Date(s)', w: 70 },
    { label: 'Duration/Days', w: 70 },
    { label: 'Organisation', w: 110 },
    { label: 'Points', w: 40 },
  ];
  cx = M;
  drawBox(p2, M, y - 2, pageW - M * 2, 13, { fill: C.tableHeader, borderWidth: 0 });
  evCols.forEach(col => {
    drawText(p2, col.label, cx + 2, y + 1, { font: boldFont, size: 7.5, color: C.white });
    cx += col.w;
  });
  y -= 15;

  // Populate from experience logs
  const sortedLogs = [...experienceLogs].sort((a, b) => {
    const na = ACTIVITY_MAP[a.log_type] || 99;
    const nb = ACTIVITY_MAP[b.log_type] || 99;
    return na - nb;
  });

  sortedLogs.forEach((log, i) => {
    if (y < 80) return; // don't overflow
    const actNum = ACTIVITY_MAP[log.log_type] || '?';
    const title = log.title || log.event_name || log.log_type || '';
    const dates = log.start_date ? `${log.start_date}${log.end_date ? ` to ${log.end_date}` : ''}` : '';
    const duration = log.hours ? `${log.hours}h` : (log.students_count ? `${log.students_count} students` : '');
    const org = log.organisation || log.employer || log.provider || log.organiser || '';
    const pts = log.points || 0;

    if (i % 2 === 0) drawBox(p2, M, y - 2, pageW - M * 2, 13, { fill: rgb(0.96, 0.96, 0.98), borderWidth: 0 });
    cx = M;
    const vals = [String(actNum), title, dates, duration, org, pts > 0 ? String(pts) : ''];
    evCols.forEach((col, ci) => {
      const color = ci === 5 && pts > 0 ? C.partA : C.black;
      drawText(p2, vals[ci], cx + 2, y + 1, { font: ci === 5 ? boldFont : font, size: 7, color, maxWidth: col.w - 4 });
      cx += col.w;
    });
    y -= 13;
  });

  // Empty rows if needed
  const emptyRows = Math.max(0, 8 - sortedLogs.length);
  for (let r = 0; r < emptyRows && y > 180; r++) {
    if (r % 2 === 0) drawBox(p2, M, y - 2, pageW - M * 2, 13, { fill: rgb(0.97, 0.97, 0.97), borderWidth: 0 });
    cx = M;
    evCols.forEach(col => {
      drawLine(p2, cx + 2, y - 2, cx + col.w - 2, y - 2, { color: C.lightGray, thickness: 0.25 });
      cx += col.w;
    });
    y -= 13;
  }
  y -= 10;

  // Attestation
  drawBox(p2, M, y - 2, pageW - M * 2, 14, { fill: C.tableHeader, borderWidth: 0 });
  drawText(p2, 'ATTESTATION — Signatures Required', M + 4, y + 2, { font: boldFont, size: 9, color: C.white });
  y -= 16;

  drawText(p2, 'You and your employer or supervisor must attest to the validity of the information provided in this application.', M, y, { font: italicFont, size: 8, maxWidth: pageW - M * 2 });
  y -= 18;

  const atts = [
    { label: 'Applicant', name: cert.technician_name, email: cert.technician_email },
    { label: 'Employer / Supervisor', name: cert.supervisor_name || cert.employer_name, email: cert.supervisor_email || cert.employer_email },
  ];

  atts.forEach(att => {
    drawText(p2, att.label + ' Signature', M, y, { font: boldFont, size: 8.5, color: C.govBlue });
    y -= 12;
    drawText(p2, 'Full Name:', M, y, { font: boldFont, size: 8 });
    drawText(p2, att.name || '', M + 52, y, { font, size: 8 });
    drawLine(p2, M + 52, y - 2, M + 200, y - 2, { color: C.lightGray });
    drawText(p2, 'Date (YYYY/MM/DD):', M + 220, y, { font: boldFont, size: 8 });
    drawLine(p2, M + 338, y - 2, pageW - M, y - 2, { color: C.lightGray });
    y -= 14;
    drawText(p2, 'Signature:', M, y, { font: boldFont, size: 8 });
    drawBox(p2, M + 56, y - 24, pageW - M * 2 - 56, 30, { border: C.lightGray, borderWidth: 0.75 });
    drawText(p2, '[ Digital or wet signature required ]', M + 70, y - 12, { font: italicFont, size: 8, color: C.midGray });
    y -= 36;
    drawLine(p2, M, y, pageW - M, y, { color: C.lightGray, thickness: 0.25 });
    y -= 10;
  });

  // Footer p2
  drawLine(p2, M, 28, pageW - M, 28, { color: C.lightGray });
  drawText(p2, 'DOCUMENT MUST BE COMPLETED IN ITS ENTIRETY FOR PROCESSING', M, 18, { font: boldFont, size: 7.5, color: C.red });
  drawText(p2, 'Page 2 of 2', pageW - M - 50, 18, { font, size: 7.5, color: C.midGray });

  return await pdfDoc.save();
}
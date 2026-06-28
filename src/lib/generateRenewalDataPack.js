import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const C = {
  black: rgb(0, 0, 0),
  white: rgb(1, 1, 1),
  govBlue: rgb(0.0, 0.27, 0.53),
  olive: rgb(0.42, 0.44, 0.25),
  gold: rgb(0.91, 0.63, 0.13),
  lightGray: rgb(0.92, 0.92, 0.92),
};

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

export async function generateRenewalDataPack(cert, experienceLogs = [], user = {}) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageW = 612, pageH = 792;
  const M = 36;

  // ─── PAGE 1: Renewal Summary ─────────────────────────────────────────────
  const p1 = pdfDoc.addPage([pageW, pageH]);
  let y = pageH - 40;

  // Header
  drawBox(p1, 0, pageH - 50, pageW, 50, { fill: C.govBlue, borderWidth: 0 });
  drawText(p1, 'NRCan NDT Certification Renewal', M, pageH - 35, { font: boldFont, size: 14, color: C.white });
  drawText(p1, 'Application Summary & Supporting Documents', M, pageH - 50, { font: boldFont, size: 10, color: C.gold });

  y = pageH - 70;

  // Applicant Info
  drawText(p1, 'APPLICANT INFORMATION', M, y, { font: boldFont, size: 11, color: C.govBlue });
  y -= 18;

  const info = [
    ['Full Name:', cert.technician_name],
    ['Registration #:', cert.nrcan_id || 'N/A'],
    ['Certification:', cert.certification_name],
    ['Email:', cert.technician_email || ''],
    ['Issue Date:', cert.issue_date || ''],
    ['Expiry Date:', cert.expiry_date || ''],
    ['Employer:', cert.employer_name || ''],
    ['Supervisor:', cert.supervisor_name || ''],
  ];

  info.forEach(([label, value]) => {
    drawText(p1, label, M, y, { font: boldFont, size: 9 });
    drawText(p1, value || '—', M + 100, y, { font, size: 9, maxWidth: 400 });
    y -= 14;
  });

  y -= 10;

  // Experience Summary
  drawText(p1, 'EXPERIENCE LOG SUMMARY (Past 5 Years)', M, y, { font: boldFont, size: 11, color: C.govBlue });
  y -= 18;

  const grouped = {};
  experienceLogs.forEach(log => {
    const key = log.log_type || 'other';
    if (!grouped[key]) grouped[key] = { count: 0, hours: 0, points: 0 };
    grouped[key].count += 1;
    grouped[key].hours += (log.hours || 0);
    grouped[key].points += (log.points || 0);
  });

  drawText(p1, `Total Entries: ${experienceLogs.length}`, M, y, { font: boldFont, size: 9 });
  y -= 14;

  Object.entries(grouped).forEach(([type, data]) => {
    const label = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    drawText(p1, `${label}:`, M, y, { font: boldFont, size: 8.5 });
    drawText(p1, `${data.count} entries | ${data.hours}h | ${data.points} pts`, M + 120, y, { font, size: 8.5 });
    y -= 13;
  });

  y -= 10;

  // SCS Points Breakdown
  drawText(p1, 'SCS POINTS BREAKDOWN', M, y, { font: boldFont, size: 11, color: C.govBlue });
  y -= 18;

  const partA = experienceLogs.filter(l => ['field_work', 'training_received', 'training_delivered', 'research'].includes(l.log_type));
  const partB = experienceLogs.filter(l => ['seminars', 'professional', 'mentoring'].includes(l.log_type));

  const partAPoints = partA.reduce((sum, l) => sum + (l.points || 0), 0);
  const partBPoints = partB.reduce((sum, l) => sum + (l.points || 0), 0);
  const totalPoints = partAPoints + partBPoints;

  drawText(p1, `Part A (Core Activities): ${partAPoints} points`, M, y, { font: boldFont, size: 9, color: C.olive });
  y -= 14;
  drawText(p1, `Part B (Other Activities): ${partBPoints} points`, M, y, { font: boldFont, size: 9, color: C.govBlue });
  y -= 14;
  drawText(p1, `TOTAL: ${totalPoints}/100 points`, M, y, { font: boldFont, size: 10, color: totalPoints >= 100 && partAPoints >= 50 ? rgb(0.23, 0.43, 0.07) : C.black });
  y -= 14;

  if (totalPoints < 100 || partAPoints < 50) {
    drawText(p1, '⚠ Additional points required for renewal eligibility', M, y, { font: boldFont, size: 8.5, color: rgb(0.6, 0, 0) });
    y -= 14;
  }

  y -= 10;

  // Checklist
  drawText(p1, 'SUBMISSION CHECKLIST', M, y, { font: boldFont, size: 11, color: C.govBlue });
  y -= 18;

  const checklist = [
    '[ ] Form 8.2.1-075: Renewal Application (download from NRCan)',
    '[ ] Form 8.2.1-073: SCS Application (download from NRCan)',
    '[ ] Form 8.2.1-002: Code of Conduct (download from NRCan)',
    '[ ] Vision Test Report (if applicable)',
    '[ ] Payment receipt',
    '[ ] This summary document (attached)',
  ];

  checklist.forEach(item => {
    drawText(p1, item, M, y, { font, size: 8.5, maxWidth: pageW - M * 2 });
    y -= 13;
  });

  y -= 20;

  // Footer
  drawLine(p1, M, 40, pageW - M, 40, { color: C.lightGray });
  drawText(p1, `Generated: ${new Date().toLocaleDateString()} | NRCan NDTCB Renewal Support`, M, 30, { font: boldFont, size: 7.5, color: C.govBlue });
  drawText(p1, 'Page 1 of 2', pageW - M - 50, 30, { font, size: 7.5, color: C.black });

  // ─── PAGE 2: Detailed Experience Log ─────────────────────────────────────
  const p2 = pdfDoc.addPage([pageW, pageH]);
  y = pageH - 40;

  drawBox(p2, 0, pageH - 50, pageW, 50, { fill: C.govBlue, borderWidth: 0 });
  drawText(p2, 'Detailed Experience Log', M, pageH - 35, { font: boldFont, size: 14, color: C.white });
  drawText(p2, 'Supporting documentation for NRCan renewal application', M, pageH - 50, { font: boldFont, size: 10, color: C.gold });

  y = pageH - 70;

  // Table header
  const cols = [
    { label: 'Date', w: 80 },
    { label: 'Activity', w: 180 },
    { label: 'Organisation', w: 120 },
    { label: 'Hours', w: 50 },
    { label: 'Points', w: 50 },
  ];

  drawBox(p2, M, y - 2, pageW - M * 2, 14, { fill: C.govBlue, borderWidth: 0 });
  let cx = M;
  cols.forEach(col => {
    drawText(p2, col.label, cx + 2, y + 1, { font: boldFont, size: 7.5, color: C.white });
    cx += col.w;
  });
  y -= 16;

  // Experience entries
  const sortedLogs = [...experienceLogs].sort((a, b) => {
    const dateA = a.start_date || a.end_date || '';
    const dateB = b.start_date || b.end_date || '';
    return dateB.localeCompare(dateA);
  });

  sortedLogs.forEach((log, i) => {
    if (y < 80) return;
    const date = log.start_date || log.end_date || 'N/A';
    const activity = log.title || log.event_name || log.log_type || 'N/A';
    const org = log.organisation || log.employer || log.provider || 'N/A';
    const hours = log.hours ? `${log.hours}h` : '-';
    const points = log.points || 0;

    if (i % 2 === 0) drawBox(p2, M, y - 2, pageW - M * 2, 13, { fill: rgb(0.97, 0.97, 0.97), borderWidth: 0 });

    cx = M;
    const vals = [date, activity, org, hours, String(points)];
    cols.forEach((col, ci) => {
      drawText(p2, vals[ci], cx + 2, y + 1, { font: ci === 4 && points > 0 ? boldFont : font, size: 7, color: ci === 4 && points > 0 ? C.olive : C.black, maxWidth: col.w - 4 });
      cx += col.w;
    });
    y -= 13;
  });

  // Footer p2
  drawLine(p2, M, 40, pageW - M, 40, { color: C.lightGray });
  drawText(p2, `Generated: ${new Date().toLocaleDateString()} | NRCan NDTCB Renewal Support`, M, 30, { font: boldFont, size: 7.5, color: C.govBlue });
  drawText(p2, 'Page 2 of 2', pageW - M - 50, 30, { font, size: 7.5, color: C.black });

  return await pdfDoc.save();
}
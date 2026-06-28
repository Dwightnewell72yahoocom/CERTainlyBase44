/**
 * NRCan Form 8.2.1-002 — Code of Conduct
 * Pixel-perfect reconstruction in pdf-lib
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const C = {
  black: rgb(0, 0, 0),
  white: rgb(1, 1, 1),
  govBlue: rgb(0.0, 0.27, 0.53),
  headerBg: rgb(0.18, 0.25, 0.47),
  lightGray: rgb(0.85, 0.85, 0.85),
  midGray: rgb(0.5, 0.5, 0.5),
  red: rgb(0.6, 0, 0),
};

function drawBox(page, x, y, w, h, { fill, border = C.black, borderWidth = 0.5 } = {}) {
  if (fill) page.drawRectangle({ x, y, width: w, height: h, color: fill });
  if (borderWidth > 0) page.drawRectangle({ x, y, width: w, height: h, borderColor: border, borderWidth, color: rgb(0,0,0,0) });
}

function drawText(page, text, x, y, { font, size = 9, color = C.black, maxWidth, lineHeight = 13 } = {}) {
  if (!text) return;
  page.drawText(String(text), { x, y, size, font, color, maxWidth });
}

function drawLine(page, x1, y1, x2, y2, { color = C.black, thickness = 0.5 } = {}) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
}

// Draw checkbox
function drawCheckbox(page, x, y, checked, size = 9) {
  const boxSize = size + 2;
  drawBox(page, x, y - boxSize, boxSize, boxSize, { border: C.black, borderWidth: 0.75 });
  if (checked) {
    const xMark = size * 0.7;
    drawLine(page, x + 2, y - 2, x + xMark, y - boxSize + 2, { color: C.black, thickness: 0.5 });
    drawLine(page, x + xMark, y - 2, x + 2, y - boxSize + 2, { color: C.black, thickness: 0.5 });
  }
}

// Wrap and draw multi-line text, returns new y position
function drawWrapped(page, text, x, y, maxW, { font, size = 8.5, color = C.black, lineH = 12 } = {}) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  const avgCharW = size * 0.52;
  const charsPerLine = Math.floor(maxW / avgCharW);

  words.forEach((word, i) => {
    const test = line ? `${line} ${word}` : word;
    if (test.length > charsPerLine && line) {
      page.drawText(line, { x, y: curY, size, font, color, maxWidth: maxW });
      curY -= lineH;
      line = word;
    } else {
      line = test;
    }
    if (i === words.length - 1 && line) {
      page.drawText(line, { x, y: curY, size, font, color, maxWidth: maxW });
      curY -= lineH;
    }
  });
  return curY;
}

export async function generateForm002(cert) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const pageW = 612;
  const pageH = 792;
  const M = 36;
  const p = pdfDoc.addPage([pageW, pageH]);
  let y = pageH;

  // Canada top bar
  drawBox(p, 0, pageH - 28, pageW, 28, { fill: rgb(0.98, 0.98, 0.98), borderWidth: 0 });
  drawLine(p, 0, pageH - 28, pageW, pageH - 28, { color: C.lightGray });
  drawText(p, 'Canada', M, pageH - 20, { font: boldFont, size: 13, color: C.govBlue });
  drawText(p, 'Natural Resources Canada', pageW - M - 160, pageH - 20, { font: boldFont, size: 9, color: C.govBlue });

  // Header
  drawBox(p, 0, pageH - 100, pageW, 72, { fill: C.headerBg, borderWidth: 0 });
  drawText(p, 'NATURAL RESOURCES CANADA', M, pageH - 44, { font: boldFont, size: 11, color: C.white });
  drawText(p, 'NATIONAL NON-DESTRUCTIVE TESTING CERTIFICATION BODY', M, pageH - 58, { font: boldFont, size: 10, color: rgb(0.85, 0.85, 0.85) });
  drawText(p, 'CODE OF CONDUCT', M, pageH - 72, { font: boldFont, size: 13, color: rgb(1, 0.85, 0.2) });
  drawText(p, '8.2.1-002', pageW - M - 60, pageH - 58, { font: boldFont, size: 10, color: rgb(1, 0.8, 0) });

  y = pageH - 114;

  // Preamble
  const preamble = 'Individuals certified or in the process of being certified must recognize that personal integrity and professional competence are the fundamental principles on which their non-destructive testing activities are founded. Accordingly, it is a condition of certification that certificate holders and candidates shall comply with this code of conduct:';
  y = drawWrapped(p, preamble, M, y, pageW - M * 2, { font: italicFont, size: 8.5, lineH: 12 });
  y -= 10;

  // Code of Conduct clauses — verbatim from official form
  const clauses = [
    { num: '1.', text: 'Comply with the relevant provisions of the applicable certification scheme and permit the publishing of personal certification status and associated information for the public verification of certification status; candidates shall also inform the Natural Resources Canada (NRCan) National Non-Destructive Testing Certification Body (NDTCB), without delay, of any matters that can affect their capability to continue to fulfil certification requirements;' },
    { num: '2.', text: 'At all times, be aware of and comply with the provisions and requirements of codes, regulations and standards under which they are working and immediately report to the NRCan NDTCB any perceived violation(s) of applicable codes, regulations or standards;' },
    { num: '3.', text: 'Immediately report to the NRCan NDTCB any perceived violation(s) of this code of conduct or any attempt to pressure or force an individual certified to violate this code of conduct;' },
    { num: '4.', text: 'Only sign documents for which they have personal professional knowledge and/or direct supervisory control;' },
    { num: '5.', text: 'Not attempt to cheat on certification examinations, attempt to bribe, threaten, or harass NRCan NDTCB staff or representatives, falsify documents, falsely claim, misrepresent or permit misrepresentation or misuse of their own or their associate\'s academic or professional qualifications, knowledge, training, experience, work responsibilities or certifications;' },
    { num: '6.', text: 'Discontinue all claims to certification upon expiry, suspension or withdrawal of certification, and upon request return to the NRCan NDTCB any certificates and/or wallet cards issued by the NRCan NDTCB;' },
    { num: '7.', text: 'Inform their employer in the event that their certification is suspended, cancelled or withdrawn;' },
    { num: '8.', text: 'Only sign documents for which they have personal professional knowledge and/or direct supervisory control;' },
    { num: '9.', text: 'Undertake only those non-destructive testing assignments for which they are competent by virtue of their training, experience, qualification and certification;' },
    { num: '10.', text: 'When required, engage or advise the engagement of such specialists as are required to enable testing activities to be properly completed;' },
    { num: '11.', text: 'Indicate to the employer or client any adverse consequences which may result from an overruling of their technical judgment by a non-technical authority;' },
    { num: '12.', text: 'Perform their professional duties with proper regard for the physical environment and the safety, health and well-being of the public;' },
    { num: '13.', text: 'In consideration of the well-being of the public and the provisions of this code of conduct, respect the confidentiality of any information given to them in confidence by an employer, colleague or member of the public;' },
    { num: '14.', text: 'Conduct themselves in a responsible manner and utilize fair and equitable business practices in dealing with colleagues, clients and associates; avoid conflicts of interest with the employer or client, however if this is unavoidable, immediately disclose the circumstances to the employer or client;' },
    { num: '15.', text: 'Maintain their proficiency by updating their technical knowledge as required to properly practice non-destructive testing in the certified methods, levels and sectors;' },
  ];

  clauses.forEach(clause => {
    if (y < 160) return;
    drawText(p, clause.num, M, y, { font: boldFont, size: 8 });
    y = drawWrapped(p, clause.text, M + 20, y, pageW - M * 2 - 20, { font, size: 8, lineH: 11 });
    y -= 4;
  });

  // Penalty note
  y -= 6;
  drawBox(p, M, y - 24, pageW - M * 2, 30, { fill: rgb(0.97, 0.95, 0.95), border: C.red, borderWidth: 0.5 });
  y -= 6;
  const penaltyText = 'Failure to comply with the above requirements will be dealt with according to NDTCB procedure "8.5-007 – NRCan NDTCB Procedure for Code of Conduct Violations" and associated NDTCB - Government of Canada policies, and may necessitate one or more of the following disciplinary measures: termination of the certification process, suspension or withdrawal of certification, publication of the violation, notification of employer(s), union(s) and appropriate regulatory authorities and, if appropriate, additional legal actions.';
  y = drawWrapped(p, penaltyText, M + 4, y, pageW - M * 2 - 8, { font: italicFont, size: 7.5, color: C.red, lineH: 11 });
  y -= 16;

  // NOTE box
  drawBox(p, M, y - 22, pageW - M * 2, 26, { fill: rgb(0.95, 0.95, 0.99), border: rgb(0.6, 0.6, 0.8), borderWidth: 0.5 });
  y -= 6;
  drawText(p, 'NOTE:', M + 4, y, { font: boldFont, size: 8, color: C.govBlue });
  y = drawWrapped(p, 'To protect certified individuals, employers, regulators, and the public the NRCan NDTCB maintains a publicly available listing of all currently certified personnel on its website.', M + 38, y, pageW - M * 2 - 42, { font, size: 7.5, lineH: 11 });
  y -= 20;

  // ── SIGNATURE BLOCK ─────────────────────────────────────────────────────
  drawLine(p, M, y, pageW - M, y, { color: C.lightGray });
  y -= 14;

  drawText(p, 'APPLICANT SIGNATURE', M, y, { font: boldFont, size: 9, color: C.govBlue });
  y -= 14;

  const halfW = (pageW - M * 2 - 12) / 2;

  // Print full name
  drawText(p, 'Print Full Name:', M, y, { font: boldFont, size: 8 });
  drawText(p, cert.technician_name || '', M + 72, y, { font, size: 9 });
  drawLine(p, M + 72, y - 2, M + halfW + 4, y - 2, { color: C.lightGray });

  // Date
  drawText(p, 'Date (YYYY/MM/DD):', M + halfW + 12, y, { font: boldFont, size: 8 });
  drawLine(p, M + halfW + 96, y - 2, pageW - M, y - 2, { color: C.lightGray });
  y -= 18;

  // Signature area
  drawText(p, 'Signature:', M, y, { font: boldFont, size: 8 });
  drawBox(p, M + 56, y - 30, pageW - M * 2 - 56, 36, { border: C.lightGray, borderWidth: 0.75 });
  drawText(p, '[ Digital or wet signature required ]', M + 70, y - 14, { font: italicFont, size: 8.5, color: C.midGray });
  y -= 40;

  // Footer
  drawLine(p, M, 40, pageW - M, 40, { color: C.lightGray });
  drawText(p, '8.2.1-002 — NRCan NDTCB Code of Conduct', M, 30, { font: boldFont, size: 7.5, color: C.midGray });
  drawText(p, `Prepared for: ${cert.technician_name || ''} | Reg#: ${cert.nrcan_id || ''}`, M, 20, { font, size: 7, color: C.midGray });

  return await pdfDoc.save();
}
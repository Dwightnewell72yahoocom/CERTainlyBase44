/**
 * NRCan Forms — Main Export
 * Generates the complete 3-form renewal package as a merged PDF
 * Forms: 8.2.1-075, 8.2.1-073, 8.2.1-002
 */
import { PDFDocument } from 'pdf-lib';
import { generateForm075 } from './form075';
import { generateForm073 } from './form073';
import { generateForm002 } from './form002';

export async function generateRenewalPackage(cert, experienceLogs = [], user = {}) {
  // Generate all three forms in parallel
  const [bytes075, bytes073, bytes002] = await Promise.all([
    generateForm075(cert, experienceLogs, user),
    generateForm073(cert, experienceLogs),
    generateForm002(cert),
  ]);

  // Merge into one PDF
  const mergedPdf = await PDFDocument.create();

  const copy = async (bytes) => {
    const src = await PDFDocument.load(bytes);
    const pages = await mergedPdf.copyPages(src, src.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  };

  await copy(bytes075);
  await copy(bytes073);
  await copy(bytes002);

  return await mergedPdf.save();
}

export { generateForm075, generateForm073, generateForm002 };
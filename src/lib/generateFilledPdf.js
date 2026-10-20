import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { base44 } from '@/api/base44Client';

// pdfjs-dist — handles encrypted/compressed PDFs that pdf-lib can't parse
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const RENDER_SCALE = 2; // 2x for high-quality rasterized background

/**
 * Generates a filled PDF entirely in the browser:
 * 1. pdfjs-dist loads the encrypted NRCan PDF and renders each page to a PNG
 * 2. pdf-lib creates a new PDF using those PNGs as page backgrounds
 * 3. Text from `data` is drawn on top at the coordinates defined in PdfFieldMap records
 *
 * @param {string} formId - e.g. "8.2.1-075"
 * @param {string} templateUrl - URL to the blank PDF template
 * @param {Object} data - { technician_name, nrcan_id, ... }
 * @returns {Promise<Blob>} filled PDF as a Blob
 */
export async function generateFilledPdf(formId, templateUrl, data) {
  // 1. Fetch field maps for this form
  const { items: maps } = await base44.entities.PdfFieldMap.filter(
    { form_id: formId },
    { limit: 500 }
  );

  if (!maps || maps.length === 0) {
    throw new Error(`No field mappings found for form ${formId}. Use the PDF Field Mapper first.`);
  }

  // 2. Fetch the PDF template (via proxy to avoid CORS)
  const proxyRes = await base44.functions.invoke('proxyPdf', { body: { url: templateUrl } });
  const pdfBytes = Uint8Array.from(atob(proxyRes.base64), (c) => c.charCodeAt(0));

  // 3. Load with pdfjs-dist (handles encryption + compressed object streams)
  const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
  const numPages = pdfjsDoc.numPages;

  // 4. Render each page to a PNG
  const pageImages = [];
  const pageSizes = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await pdfjsDoc.getPage(i);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
    pageImages.push(pngBytes);
    // Store original PDF point dimensions (viewport at scale 1)
    const vp1 = page.getViewport({ scale: 1 });
    pageSizes.push({ width: vp1.width, height: vp1.height });
    page.cleanup();
  }
  pdfjsDoc.destroy();

  // 5. Create new PDF with pdf-lib, using rendered images as page backgrounds
  const newPdf = await PDFDocument.create();
  const helvetica = await newPdf.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await newPdf.embedFont(StandardFonts.HelveticaBold);

  const embeddedPages = [];
  for (const pngBytes of pageImages) {
    const img = await newPdf.embedPng(pngBytes);
    embeddedPages.push(img);
  }

  for (let i = 0; i < numPages; i++) {
    const { width, height } = pageSizes[i];
    const page = newPdf.addPage([width, height]);
    page.drawImage(embeddedPages[i], { x: 0, y: 0, width, height });
  }

  // 6. Draw text overlays at mapped coordinates
  const pages = newPdf.getPages();
  let filledCount = 0;
  for (const map of maps) {
    const value = data[map.field_key];
    if (value === undefined || value === null || value === '') continue;

    const pageIdx = (map.page_number || 1) - 1;
    const page = pages[pageIdx];
    if (!page) continue;

    const font = map.font_size > 11 ? helveticaBold : helvetica;
    const text = String(value);
    const fontSize = map.font_size || 10;
    const textColor = rgb(0, 0, 0);

    const textWidth = font.widthOfTextAtSize(text, fontSize);
    let drawX = map.x;
    if (map.align === 'center') {
      drawX = map.x - textWidth / 2;
    } else if (map.align === 'right') {
      drawX = map.x - textWidth;
    }

    // PdfFieldMap stores y as "from bottom" (pdf-lib coordinate space)
    page.drawText(text, {
      x: drawX,
      y: map.y,
      size: fontSize,
      font,
      color: textColor,
    });
    filledCount++;
  }

  // 7. Save and return as Blob
  const filledBytes = await newPdf.save();
  return new Blob([filledBytes], { type: 'application/pdf' });
}
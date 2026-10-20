import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { PDFDocument, StandardFonts, rgb } from 'npm:@cantoo/pdf-lib@1.17.1';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { form_id, template_url, data } = await req.json();

    // Fetch the blank template PDF
    const templateRes = await fetch(template_url, { signal: AbortSignal.timeout(15000) });
    if (!templateRes.ok) return Response.json({ error: `Template fetch failed: ${templateRes.status}` }, { status: 500 });
    const templateBytes = new Uint8Array(await templateRes.arrayBuffer());

    // Load with pdf-lib (ignoreEncryption handles password-protected PDFs)
    // Note: NRCan PDFs with compressed object streams may not parse here —
    // the client-side generateFilledPdf.js (pdfjs-dist) handles those cases.
    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
    } catch (parseError) {
      return Response.json({
        error: 'Could not parse this PDF template server-side. NRCan forms with compressed object streams require the client-side renderer (generateFilledPdf.js).',
        detail: parseError.message
      }, { status: 422 });
    }

    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    // Load field maps for this form
    const maps = await base44.asServiceRole.entities.PdfFieldMap.filter({ form_id });

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

      page.drawText(text, {
        x: drawX,
        y: map.y,
        size: fontSize,
        font,
        color: textColor,
      });
      filledCount++;
    }

    const filledBytes = await pdfDoc.save();

    return new Response(filledBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${form_id}-filled.pdf"`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack?.slice(0, 500) }, { status: 500 });
  }
}
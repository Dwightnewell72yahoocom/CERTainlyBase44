import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { form_id, template_url, data, include_maps } = await req.json();

    // Fetch the blank template PDF
    const templateRes = await fetch(template_url);
    if (!templateRes.ok) return Response.json({ error: `Template fetch failed: ${templateRes.status}` }, { status: 500 });
    const templateBytes = await templateRes.arrayBuffer();

    const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
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

    const responseBlob = new Response(filledBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${form_id}-filled.pdf"`,
      },
    });

    return responseBlob;
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack?.slice(0, 500) }, { status: 500 });
  }
});
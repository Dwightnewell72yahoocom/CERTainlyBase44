import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { PDFDocument } from 'npm:pdf-lib@1.17.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await req.json();
    const res = await fetch(url);
    if (!res.ok) return Response.json({ error: `Fetch failed: ${res.status}` }, { status: 500 });

    const bytes = await res.arrayBuffer();

    // Check raw bytes for XFA and AcroForm markers
    const text = new TextDecoder('latin1').decode(bytes.slice(0, 50000));
    const hasXFA = text.includes('XFA') || text.includes('/XFA');
    const hasAcroForm = text.includes('/AcroForm');
    const hasFields = text.includes('/Fields');
    const isEncrypted = text.includes('/Encrypt');

    // Try pdf-lib anyway
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = pdf.getForm();
    const fields = form.getFields();

    // Also scan raw text for field name patterns
    const fieldNameMatches = [...text.matchAll(/\/T\s*\(([^)]+)\)/g)].map(m => m[1]).slice(0, 50);

    return Response.json({
      hasXFA,
      hasAcroForm,
      hasFields,
      isEncrypted,
      pdfLibFieldCount: fields.length,
      rawFieldNamesFound: fieldNameMatches,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack?.slice(0, 500) }, { status: 500 });
  }
});
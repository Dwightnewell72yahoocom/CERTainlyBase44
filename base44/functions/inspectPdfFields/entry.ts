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

    // Scan FULL document text (not just first 50KB)
    const text = new TextDecoder('latin1').decode(bytes);

    const hasXFA = text.includes('/XFA');
    const hasAcroForm = text.includes('/AcroForm');
    const isEncrypted = text.includes('/Encrypt');

    // Extract field names — handles BOTH inline (...) and hex <...> formats
    const fieldNames = new Set();

    // Pattern 1: /T (Name)  — parenthesized
    for (const m of text.matchAll(/\/T\s*\(([^)]*)\)/g)) {
      if (m[1]) fieldNames.add(m[1]);
    }

    // Pattern 2: /T <HEXSTRING>  — hex encoded
    for (const m of text.matchAll(/\/T\s*<([0-9A-Fa-f]+)>/g)) {
      try {
        let hex = m[1];
        if (hex.length % 2 !== 0) hex = '0' + hex;
        const decoded = new TextDecoder('utf-16be').decode(
          new Uint8Array(hex.match(/.{1,2}/g).map(b => parseInt(b, 16)))
        );
        if (decoded) fieldNames.add(decoded);
      } catch (_) {}
    }

    // Pattern 3: /T /Name  — name object
    for (const m of text.matchAll(/\/T\s*\/([A-Za-z0-9_]+)/g)) {
      fieldNames.add(m[1]);
    }

    // Try pdf-lib with ignoreEncryption
    let pdfLibFieldCount = 0;
    let pdfLibFields = [];
    try {
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const form = pdf.getForm();
      const fields = form.getFields();
      pdfLibFieldCount = fields.length;
      pdfLibFields = fields.map(f => f.getName()).slice(0, 100);
    } catch (e) {
      pdfLibFields = [`ERROR: ${e.message}`];
    }

    return Response.json({
      hasXFA,
      hasAcroForm,
      isEncrypted,
      pdfLibFieldCount,
      rawFieldNamesFound: [...fieldNames].slice(0, 200),
      pdfLibFields,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack?.slice(0, 500) }, { status: 500 });
  }
});
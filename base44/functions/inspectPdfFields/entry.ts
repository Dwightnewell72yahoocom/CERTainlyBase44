import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Use pdf-lib with ignoreEncryption, but also try a raw stream parser
// for compressed cross-reference PDFs (PDF 1.5+ objstm format)
import { PDFDocument, PDFName, PDFDict, PDFStream, PDFArray, PDFString, PDFHexString } from 'npm:pdf-lib@1.17.1';

function decodeString(val) {
  if (!val) return null;
  if (val instanceof PDFString) return val.decodeText();
  if (val instanceof PDFHexString) return val.decodeText();
  return null;
}

// Walk every indirect object looking for /T (field name) entries
function extractFieldsFromDoc(pdfDoc) {
  const fields = [];
  const context = pdfDoc.context;
  
  try {
    // Try via getForm() first
    const form = pdfDoc.getForm();
    const formFields = form.getFields();
    if (formFields.length > 0) {
      return formFields.map(f => f.getName());
    }
  } catch (_) {}

  // Manual walk of all indirect objects
  try {
    const indirectObjects = context.enumerateIndirectObjects();
    for (const [ref, pdfObject] of indirectObjects) {
      try {
        if (pdfObject instanceof PDFDict) {
          const t = pdfObject.get(PDFName.of('T'));
          if (t) {
            const name = decodeString(t);
            if (name) fields.push(name);
          }
        }
      } catch (_) {}
    }
  } catch (_) {}

  return fields;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await req.json();
    const res = await fetch(url);
    if (!res.ok) return Response.json({ error: `Fetch failed: ${res.status}` }, { status: 500 });

    const bytes = await res.arrayBuffer();
    const text = new TextDecoder('latin1').decode(bytes);

    const hasXFA = text.includes('/XFA');
    const hasAcroForm = text.includes('/AcroForm');
    const isEncrypted = text.includes('/Encrypt');

    // Raw regex scan for field names (works on uncompressed streams)
    const rawFields = new Set();
    for (const m of text.matchAll(/\/T\s*\(([^)]*)\)/g)) {
      if (m[1]) rawFields.add(m[1]);
    }
    for (const m of text.matchAll(/\/T\s*<([0-9A-Fa-f]+)>/g)) {
      try {
        let hex = m[1];
        if (hex.length % 2 !== 0) hex = '0' + hex;
        const bytes2 = new Uint8Array(hex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
        const decoded = new TextDecoder('utf-16be').decode(bytes2);
        if (decoded && decoded.trim()) rawFields.add(decoded.trim());
      } catch (_) {}
    }

    // Try pdf-lib with full object walking
    let pdfLibFields = [];
    let pdfLibError = null;
    try {
      const pdfDoc = await PDFDocument.load(bytes, { 
        ignoreEncryption: true,
        updateMetadata: false,
        throwOnInvalidObject: false,
      });
      pdfLibFields = extractFieldsFromDoc(pdfDoc);
    } catch (e) {
      pdfLibError = e.message;
    }

    // Check if this is a compressed object stream PDF (PDF 1.5+)
    const hasObjStm = text.includes('/ObjStm');
    const hasXRefStm = text.includes('/XRefStm') || text.includes('xref\r\n\r\n') || !text.includes('\nxref\n');

    return Response.json({
      hasXFA,
      hasAcroForm,
      isEncrypted,
      hasCompressedObjects: hasObjStm || hasXRefStm,
      rawFieldCount: rawFields.size,
      rawFields: [...rawFields].slice(0, 200),
      pdfLibFieldCount: pdfLibFields.length,
      pdfLibFields: pdfLibFields.slice(0, 200),
      pdfLibError,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack?.slice(0, 500) }, { status: 500 });
  }
});
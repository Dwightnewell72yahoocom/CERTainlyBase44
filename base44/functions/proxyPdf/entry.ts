import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await req.json();
    if (!url) return Response.json({ error: 'URL required' }, { status: 400 });

    const res = await fetch(url);
    if (!res.ok) return Response.json({ error: `Fetch failed: ${res.status}` }, { status: 500 });

    const bytes = new Uint8Array(await res.arrayBuffer());

    // Convert to base64 in chunks (btoa spread fails on large arrays)
    let binary = '';
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const base64 = btoa(binary);

    return Response.json({ base64, size: bytes.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
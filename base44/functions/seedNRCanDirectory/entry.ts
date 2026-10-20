import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const NRCAN_DIRECTORY_PAGE = 'https://natural-resources.canada.ca/science-data/non-destructive-testing/directory-certified-personnel-currently-certified-natural-resources-canada';
const NRCAN_BASE = 'https://natural-resources.canada.ca';

/**
 * Fetches the NRCan directory page HTML, extracts the current JSON data source URL,
 * fetches the JSON, and returns the raw certification records.
 */
async function fetchNRCanRecords() {
  // 1. Fetch the directory page to find the current JSON URL (changes when NRCan updates)
  const pageRes = await fetch(NRCAN_DIRECTORY_PAGE, { signal: AbortSignal.timeout(15000) });
  if (!pageRes.ok) throw new Error(`NRCan directory page fetch failed: ${pageRes.status}`);
  const html = await pageRes.text();

  // Extract JSON URL from DataTables sAjaxSource config
  const match = html.match(/"sAjaxSource":\s*"([^"]+)"/);
  if (!match) throw new Error('Could not find NRCan data source URL in directory page');
  const jsonPath = match[1];
  const jsonUrl = jsonPath.startsWith('http') ? jsonPath : `${NRCAN_BASE}${jsonPath}`;

  // 2. Fetch the JSON data
  const jsonRes = await fetch(jsonUrl, { signal: AbortSignal.timeout(30000) });
  if (!jsonRes.ok) throw new Error(`NRCan JSON fetch failed: ${jsonRes.status}`);
  const jsonData = await jsonRes.json();

  if (!jsonData.data || !Array.isArray(jsonData.data)) {
    throw new Error('NRCan JSON data is malformed — expected { data: [...] }');
  }

  return jsonData.data;
}

/**
 * Groups raw NRCan certification records (one per method) into technician profiles.
 * Each technician has a methods array with their certifications.
 */
function groupByTechnician(records) {
  const map = {};
  for (const r of records) {
    const lastName = (r['Last Name'] || '').trim();
    const firstName = (r['First Name'] || '').trim();
    if (!lastName && !firstName) continue;

    const fullName = `${lastName}, ${firstName}`;
    if (!map[fullName]) {
      map[fullName] = {
        full_name: fullName,
        city: (r['City'] || '').trim(),
        province: (r['Province'] || '').trim(),
        methods: [],
      };
    }
    map[fullName].methods.push({
      method: (r['Method'] || '').trim(),
      level: (r['Level'] || '').trim(),
      sector: (r['Sector'] || '').trim(),
      expiry_date: (r['Renewal Due Date'] || '').trim(),
    });
  }
  return Object.values(map);
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Admin-only maintenance function
    let user = null;
    try {
      user = await base44.auth.me();
    } catch { /* service-role invocation (from workflow) */ }

    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({})) || {};
    const force = !!body.force;

    // Check existing count
    const existingCount = await base44.asServiceRole.entities.NRCanTechnician.count();

    if (existingCount > 0 && !force) {
      return Response.json({
        success: true,
        message: 'Directory already seeded. Pass { force: true } to refresh.',
        existingCount,
      });
    }

    // If force refresh, delete all existing records first
    if (existingCount > 0 && force) {
      await base44.asServiceRole.entities.NRCanTechnician.deleteMany({});
    }

    // Fetch and process NRCan data
    const records = await fetchNRCanRecords();
    const technicians = groupByTechnician(records);

    // Bulk create in batches of 100 with 500ms delay to avoid rate limits
    const BATCH_SIZE = 100;
    let created = 0;
    for (let i = 0; i < technicians.length; i += BATCH_SIZE) {
      const batch = technicians.slice(i, i + BATCH_SIZE);
      await base44.asServiceRole.entities.NRCanTechnician.bulkCreate(batch);
      created += batch.length;
      // Throttle to avoid rate limiting
      if (i + BATCH_SIZE < technicians.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return Response.json({
      success: true,
      rawRecords: records.length,
      techniciansCreated: created,
      refreshed: force,
    });
  } catch (error) {
    return Response.json(
      { error: error.message, stack: error.stack?.slice(0, 500) },
      { status: 500 }
    );
  }
}
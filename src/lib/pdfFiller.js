import { PDFDocument } from 'pdf-lib';

// Official NRCan PDF URLs (publicly hosted)
const FORM_URLS = {
  f075: 'https://www.nrcan.gc.ca/sites/nrcan/files/mineralsmetals/files/pdf/8.2.1-075_Renewal_Application_E.pdf',
  f073: 'https://www.nrcan.gc.ca/sites/nrcan/files/mineralsmetals/files/pdf/8.2.1-073_SCS_Application_E.pdf',
  f002: 'https://www.nrcan.gc.ca/sites/nrcan/files/mineralsmetals/files/pdf/8.2.1-002_Code_of_Conduct_E.pdf',
};

const setField = (form, name, value) => {
  try {
    form.getTextField(name).setText(String(value ?? ''));
  } catch (e) {
    console.warn('PDF field not found:', name);
  }
};

const setCheck = (form, name, checked) => {
  try {
    if (checked) form.getCheckBox(name).check();
    else form.getCheckBox(name).uncheck();
  } catch (e) {}
};

async function fetchPdf(url) {
  // Try direct fetch; if CORS blocked, fall back to a blank PDF
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch failed');
    return await res.arrayBuffer();
  } catch (e) {
    console.warn('Could not fetch PDF from NRCan — creating blank document:', url);
    const doc = await PDFDocument.create();
    doc.addPage();
    return (await doc.save()).buffer;
  }
}

function groupLogsByYear(logs, expiryDateStr) {
  const expiry = new Date(expiryDateStr || new Date());
  const result = { year1: {}, year2: {}, year3: {}, year4: {}, year5: {}, total: {} };
  for (let act = 1; act <= 11; act++) {
    let total = 0;
    for (let y = 1; y <= 5; y++) {
      const end = new Date(expiry.getFullYear() - (y - 1), expiry.getMonth(), expiry.getDate());
      const start = new Date(expiry.getFullYear() - y, expiry.getMonth(), expiry.getDate());
      const pts = logs
        .filter(l => l.log_type_number === act)
        .filter(l => { const d = new Date(l.start_date || l.created_date); return d >= start && d < end; })
        .reduce((sum, l) => sum + (l.points || 0), 0);
      result[`year${y}`][`activity${act}`] = pts || '';
      total += pts;
    }
    result.total[`activity${act}`] = total || '';
  }
  return result;
}

export async function fillRenewalPackage(cert, experienceLogs, signatoryData = {}) {
  const today = new Date();
  const dd = String(today.getDate());
  const mm = String(today.getMonth() + 1);
  const yyyy = String(today.getFullYear());

  // Parse name
  const fullName = cert.technician_name || '';
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts.slice(0, -1).join(' ');
  const lastName = nameParts.slice(-1)[0] || '';

  // Derive method/level from certification_name e.g. "MT Level 2"
  const certNameUpper = (cert.certification_name || '').toUpperCase();
  const METHOD_LIST = ['UT-PA', 'MT', 'UT', 'PT', 'RT', 'ET', 'VT', 'XF', 'CEDO'];
  const method = METHOD_LIST.find(m => certNameUpper.includes(m)) || '';
  const levelMatch = cert.certification_name?.match(/level\s*(\d)/i);
  const level = levelMatch ? levelMatch[1] : '';

  const scsPoints = groupLogsByYear(experienceLogs, cert.expiry_date);

  // ── FORM 8.2.1-075 ──────────────────────────────────────────────
  const bytes075 = await fetchPdf(FORM_URLS.f075);
  const doc075 = await PDFDocument.load(bytes075, { ignoreEncryption: true });
  const f075 = doc075.getForm();

  // Applicant
  setField(f075, 'Applicant Surname', lastName);
  setField(f075, 'Applicant Given Names', firstName);
  setField(f075, 'Registration # 2', cert.nrcan_id || '');
  setField(f075, 'Applicant Email Address', cert.technician_email || '');
  setField(f075, 'Applicant Telephone Home', '');
  setField(f075, 'Applicant Telephone Cell', '');
  setField(f075, 'Former Surname', '');
  setField(f075, 'Address of Residence', '');
  setField(f075, 'Applicant City of Residence', '');
  setField(f075, 'Applicant Province  of Residence', '');
  setField(f075, 'Applicant Postal Code of Residence', '');
  setField(f075, 'Mailing Address', '');
  setField(f075, 'Mailing City', '');
  setField(f075, 'Mailing Province', '');
  setField(f075, 'Mailing Postal Code', '');

  // Employer
  setField(f075, 'Present Employer', cert.employer_name || '');
  setField(f075, 'Employer Contact Name', cert.supervisor_name || '');
  setField(f075, 'Contact\'s Title', '');
  setField(f075, 'Employer address', '');
  setField(f075, 'Employer address city', '');
  setField(f075, 'Employer address province', '');
  setField(f075, 'Employer address postal code', '');
  setField(f075, 'Employer Telephone', '');
  setField(f075, 'Employer email address', cert.employer_email || '');

  // Method checkboxes
  setCheck(f075, 'MT EMC renewal', method === 'MT');
  setCheck(f075, 'UT EMC renewal', method === 'UT');
  setCheck(f075, 'PT EMC renewal', method === 'PT');
  setCheck(f075, 'RT EMC renewal', method === 'RT');
  setCheck(f075, 'ET EMC renewal', method === 'ET');
  setCheck(f075, 'UT-PA EMC renewal', method === 'UT-PA');
  setCheck(f075, 'VT EMC renewal', method === 'VT');
  setCheck(f075, 'RT A/S renewal', false);

  // Payment
  setField(f075, 'To be paid by', 'Applicant');
  setField(f075, 'Cardholder\'s name 2', fullName);
  setField(f075, 'Cardholder\'s email 2', cert.technician_email || '');

  // Experience rows from logs
  const empLogs = experienceLogs.filter(l => l.log_type === 'field_work').slice(0, 2);
  [0, 1].forEach(i => {
    const n = i + 1;
    const log = empLogs[i] || {};
    const fromDate = log.start_date ? new Date(log.start_date) : null;
    const toDate = log.end_date ? new Date(log.end_date) : null;
    setField(f075, `Company ${n}`, log.employer || '');
    setField(f075, `Company location ${n}`, '');
    setField(f075, `Period of employment ${n} start date year`, fromDate ? String(fromDate.getFullYear()) : '');
    setField(f075, `Period of employment ${n} start date month`, fromDate ? String(fromDate.getMonth() + 1) : '');
    setField(f075, `Period of employment ${n} end date year`, toDate ? String(toDate.getFullYear()) : '');
    setField(f075, `Period of employment ${n} end date month`, toDate ? String(toDate.getMonth() + 1) : '');
    setField(f075, `Position held ${n}`, log.role || '');
  });

  // Applicant signature date
  setField(f075, 'Applicant signature date day', dd);
  setField(f075, 'Applicant signature date month', mm);
  setField(f075, 'Applicant signature date year', yyyy);

  // Work history percentages — leave blank for applicant to fill
  ['MT','UT','PT','RT','ET','VT'].forEach(m => setField(f075, `Percentage of time spend in ${m}`, ''));
  setField(f075, '% doing inspections', '');
  setField(f075, '% planning/reporting', '');
  setField(f075, '% supervision of staff/meetings', '');
  setField(f075, '% training and/or conferences (attending or facilitating)', '');
  setField(f075, '% writing procedures/\rdocuments', '');

  // NDT method checkboxes page 2
  if (method === 'MT') {
    ['Yoke','Coil wrap','Prods','Wet bench','Reports MT','Procedures MT'].forEach(n => setCheck(f075, n, true));
  }
  if (method === 'UT') {
    ['Flaw detector','Angle beam','Straight beam','Reports UT','Procedures UT'].forEach(n => setCheck(f075, n, true));
  }
  if (method === 'PT') {
    ['Aerosol PT','Solvent removable','Reports PT','Procedures PT'].forEach(n => setCheck(f075, n, true));
  }

  // Attestations (signatory)
  const sig = signatoryData;
  setField(f075, 'Employer registration # 2', sig.nrcanReg || '');
  setField(f075, "Employer's name 2", sig.fullName || '');
  setField(f075, "Employer's job title 2", sig.jobTitle || '');
  setField(f075, 'Current employer - employer 2', sig.employer || '');
  setField(f075, 'Employer address 2', sig.address || '');
  setField(f075, 'Employer telephone 2', sig.phone || '');
  setField(f075, 'Employer email 2', sig.email || '');
  setField(f075, 'Employer signature date day 2', '');
  setField(f075, 'Employer signature date month 2', '');
  setField(f075, 'Employer signature date year 2', '');

  setField(f075, 'Supervisor registration # 2', sig.nrcanReg || '');
  setField(f075, 'Supervisor name 2', sig.fullName || '');
  setField(f075, 'Supervisor job title 2', sig.jobTitle || '');
  setField(f075, 'Current employer - supervisor 2', sig.employer || '');
  setField(f075, 'Supervisor address 2', sig.address || '');
  setField(f075, 'Supervisor telephone 2', sig.phone || '');
  setField(f075, 'Supervisor email 2', sig.email || '');

  setField(f075, 'Sponsor registration # 2', sig.nrcanReg || '');
  setField(f075, 'Sponsor name 2', sig.fullName || '');
  setField(f075, 'Sponsor job title 2', sig.jobTitle || '');
  setField(f075, 'current employer - sponsor 2', sig.employer || '');
  setField(f075, 'SPonsor telephone 2', sig.phone || '');
  setField(f075, 'Sponsor email 2', sig.email || '');

  // Applicant attestation page 4
  setField(f075, 'Applicant name signature 2', fullName);
  setField(f075, 'Applicant signature Day 2', dd);
  setField(f075, 'Applicant signature Month 2', mm);
  setField(f075, 'Applicant signature Year 2', yyyy);
  setField(f075, 'Proxy contact name 2', sig.fullName || '');
  setField(f075, 'Proxy Contact telephone 2', sig.phone || '');
  setField(f075, 'Proxy Contact email 2', sig.email || '');

  // Checklist page 6
  setField(f075, "Applicant's name checklist 1", fullName);
  setField(f075, 'Checklist date day 1', dd);
  setField(f075, 'Checklist date month 1', mm);
  setField(f075, 'Checklist date year 1', yyyy);
  setCheck(f075, 'Application Form yes 1', true);
  setCheck(f075, 'Fees yes 1', true);
  setCheck(f075, 'Record of experience yes 1', true);
  setCheck(f075, 'Attestations yes 1', true);
  setCheck(f075, 'Code of Conduct yes 1', true);
  setCheck(f075, 'Structured credit system application yes 2', true);

  const filled075 = await doc075.save();

  // ── FORM 8.2.1-073 ──────────────────────────────────────────────
  const bytes073 = await fetchPdf(FORM_URLS.f073);
  const doc073 = await PDFDocument.load(bytes073, { ignoreEncryption: true });
  const f073 = doc073.getForm();

  setField(f073, 'Applicant Surname 2', lastName);
  setField(f073, 'Applicant Given Names 2', firstName);
  setField(f073, 'Registration # 2', cert.nrcan_id || '');
  setField(f073, 'Method and level', method && level ? `${method} Level ${level}` : cert.certification_name || '');
  setField(f073, 'Employer Telephone 2', '');
  setField(f073, 'Employer email address 2', cert.technician_email || '');

  // SCS points table
  for (let act = 1; act <= 11; act++) {
    for (let y = 1; y <= 5; y++) {
      setField(f073, `Year ${y} Activity ${act}`, String(scsPoints[`year${y}`][`activity${act}`] ?? ''));
    }
    setField(f073, `Total activity ${act}`, String(scsPoints.total[`activity${act}`] ?? ''));
  }

  // Supporting evidence — field work
  const fwLogs = experienceLogs.filter(l => l.log_type === 'field_work');
  setField(f073, 'Activity 1 - supporting evidence', fwLogs.map(l => `${l.title || ''} (${l.employer || ''}, ${l.hours || 0}h)`).join('\n'));

  // Training received
  const trLogs = experienceLogs.filter(l => l.log_type === 'training_received').slice(0, 5);
  trLogs.forEach((l, i) => {
    const n = i + 1;
    const yr = l.start_date ? new Date(l.start_date).getFullYear() : '';
    setField(f073, `Theoretical Training Year ${n}`, String(yr));
    setField(f073, `Number of training hours ${n}`, String(l.hours || ''));
    setField(f073, `Training institution ${n}`, l.provider || l.organisation || '');
  });

  // Training delivered
  const tdLogs = experienceLogs.filter(l => l.log_type === 'training_delivered').slice(0, 5);
  tdLogs.forEach((l, i) => {
    const n = i + 1;
    const yr = l.start_date ? new Date(l.start_date).getFullYear() : '';
    setField(f073, `Delivery of training year ${n}`, String(yr));
    setField(f073, `Delivery of training type ${n}`, l.training_type === 'theoretical' ? 'Theoretical' : l.training_type === 'practical' ? 'Practical' : 'Both');
    setField(f073, `delivery of training hours ${n}`, String(l.hours || ''));
  });

  // Research
  const resLogs = experienceLogs.filter(l => l.log_type === 'research');
  setField(f073, 'Activity 5 - supporting evidence', resLogs.map(l => l.title || '').join('\n'));

  // Seminars
  const semLogs = experienceLogs.filter(l => l.log_type === 'seminars');
  setField(f073, 'Activity 6 - supporting evidence 2', semLogs.map(l => l.event_name || l.title || '').join('\n'));

  // Mentoring
  const menLogs = experienceLogs.filter(l => l.log_type === 'mentoring');
  setField(f073, 'Activity 9 - supporting evidence 2', menLogs.map(l => `${l.mentee_names || ''} (${l.hours || 0}h)`).join('\n'));

  // Attestation
  setField(f073, 'Applicant name signature 2', fullName);
  setField(f073, 'Registration # 3', cert.nrcan_id || '');
  setField(f073, 'Applicant signature date day 2', dd);
  setField(f073, 'Applicant signature date month 2', mm);
  setField(f073, 'Applicant signature date year 2', yyyy);
  setField(f073, 'Applicant name signature 3', sig.fullName || '');
  setField(f073, 'Registration # 4', sig.nrcanReg || '');
  setField(f073, 'Method and level 2', method && level ? `${method} Level ${level}` : cert.certification_name || '');

  const filled073 = await doc073.save();

  // ── FORM 8.2.1-002 ──────────────────────────────────────────────
  const bytes002 = await fetchPdf(FORM_URLS.f002);
  const doc002 = await PDFDocument.load(bytes002, { ignoreEncryption: true });
  const f002 = doc002.getForm();

  setField(f002, 'Name', fullName);
  setField(f002, 'Day', dd);
  setField(f002, 'Month', mm);
  setField(f002, 'Year', yyyy);

  const filled002 = await doc002.save();

  return { filled075, filled073, filled002, fullName, method, level, nrcanId: cert.nrcan_id || '' };
}
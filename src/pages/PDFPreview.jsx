import React, { useEffect, useState } from 'react';
import { generateRenewalPackage } from '@/lib/nrcanForms/index';
import { Loader2, AlertCircle, Download } from 'lucide-react';

// Sample cert data for preview
const SAMPLE_CERT = {
  technician_name: 'Dwight Conrad Newell',
  technician_email: 'dwight.newell@example.com',
  nrcan_id: 'MT-2-0042',
  certification_name: 'MT — Magnetic Testing Level 2',
  employer_name: 'CanNDT Services Inc.',
  employer_email: 'hr@canndt.ca',
  supervisor_name: 'James R. Tremblay',
  supervisor_email: 'j.tremblay@canndt.ca',
  issue_date: '2021-04-15',
  expiry_date: '2026-04-15',
  category: 'ndt_mt',
  governing_body: 'NRCan',
  scs_applicable: true,
};

const SAMPLE_LOGS = [
  { log_type: 'field_work', title: 'Weld inspection — Coastal Pipeline', employer: 'CanNDT Services Inc.', start_date: '2022-01-10', end_date: '2022-06-30', hours: 480, points: 22 },
  { log_type: 'field_work', title: 'Structural NDT — Bridge Maintenance', employer: 'CanNDT Services Inc.', start_date: '2023-03-01', end_date: '2024-02-28', hours: 960, points: 40 },
  { log_type: 'training_received', title: 'MT Advanced Techniques', provider: 'CSNDT', training_type: 'both', start_date: '2022-09-12', end_date: '2022-09-14', hours: 24, points: 3 },
  { log_type: 'training_delivered', title: 'MT Level 1 Practical Training', organisation: 'CanNDT Services Inc.', start_date: '2023-11-01', end_date: '2023-11-05', hours: 40, students_count: 6, points: 5 },
  { log_type: 'seminars', title: 'CSNDT Annual Conference', organiser: 'CSNDT', start_date: '2024-05-20', end_date: '2024-05-22', hours: 16, points: 2 },
  { log_type: 'professional', title: 'CSNDT Individual Membership', organisation: 'CSNDT', start_date: '2022-01-01', end_date: '2026-12-31', points: 5 },
  { log_type: 'mentoring', title: 'Mentoring — 3 Level 1 trainees', mentee_names: 'A. Singh, B. Lavoie, C. Okafor', start_date: '2023-01-01', end_date: '2025-12-31', students_count: 3, points: 6 },
];

export default function PDFPreview() {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    async function generate() {
      try {
        const bytes = await generateRenewalPackage(SAMPLE_CERT, SAMPLE_LOGS);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setStatus('done');
      } catch (e) {
        console.error(e);
        setError(e.message || 'Generation failed');
        setStatus('error');
      }
    }
    generate();
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, []);

  return (
    <div style={{ background: '#f7f4ee', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#6b7040', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <p style={{ color: '#E8A020', fontWeight: 900, fontSize: 15, margin: 0 }}>NRCan PDF Preview</p>
          <p style={{ color: 'rgba(245,237,214,0.7)', fontSize: 12, margin: 0 }}>Sample renewal package — Forms 8.2.1-075, 073 & 002</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: status !== 'done' ? 'center' : 'flex-start' }}>
        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Loader2 style={{ width: 32, height: 32, color: '#6b7040', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#6b7040', fontWeight: 700 }}>Generating NRCan forms…</p>
            <p style={{ color: '#999', fontSize: 13 }}>Building Forms 8.2.1-075, 073 & 002</p>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <AlertCircle style={{ width: 32, height: 32, color: '#A32D2D', margin: '0 auto 12px' }} />
            <p style={{ color: '#A32D2D', fontWeight: 700 }}>Generation failed</p>
            <p style={{ color: '#999', fontSize: 13 }}>{error}</p>
          </div>
        )}

        {status === 'done' && pdfUrl && (
          <div style={{ width: '100%', maxWidth: 860, padding: '20px 16px', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ color: '#6b7040', fontWeight: 700, fontSize: 14 }}>Sample: Dwight Conrad Newell — MT Level 2 Renewal</p>
              <a
                href={pdfUrl}
                download="NRCan_Renewal_Package_Sample.pdf"
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#E8A020', color: '#fff', fontWeight: 900, fontSize: 13, padding: '8px 16px', borderRadius: 10, textDecoration: 'none' }}
              >
                <Download style={{ width: 14, height: 14 }} />
                Download PDF
              </a>
            </div>
            <iframe
              src={pdfUrl + '#toolbar=0&navpanes=0&scrollbar=0'}
              style={{ width: '100%', height: 'calc(100vh - 120px)', border: 'none', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
              title="NRCan Renewal Package Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}
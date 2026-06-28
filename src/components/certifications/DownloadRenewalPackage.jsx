import React, { useState } from 'react';
import JSZip from 'jszip';
import { Download, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { fillRenewalPackage } from '@/lib/pdfFiller';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const NRCAN_EMAIL = 'ndtrecertification-endrecertification@nrcan-rncan.gc.ca';

export default function DownloadRenewalPackage({ cert }) {
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);

  const { data: experienceLogs = [] } = useQuery({
    queryKey: ['experienceLogs', cert?.technician_name],
    queryFn: () => base44.entities.ExperienceLog.filter({ technician_name: cert.technician_name }),
    enabled: !!cert?.technician_name,
  });

  const handleDownload = async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const filled = await fillRenewalPackage(cert, experienceLogs, {
        fullName: cert.supervisor_name || '',
        email: cert.supervisor_email || '',
        employer: cert.employer_name || '',
        nrcanReg: '',
        jobTitle: '',
        address: '',
        phone: '',
      });

      const zip = new JSZip();
      zip.file('8.2.1-075_Renewal_Application.pdf', filled.filled075);
      zip.file('8.2.1-073_SCS_Application.pdf', filled.filled073);
      zip.file('8.2.1-002_Code_of_Conduct.pdf', filled.filled002);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NRCan_Renewal_Package_${(cert.technician_name || 'Applicant').replace(/\s+/g, '_')}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setResult(filled);
      setStatus('done');
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message || 'Download failed');
      setStatus('error');
    }
  };

  const handleEmail = () => {
    if (!result) return;
    const { fullName, method, level, nrcanId } = result;
    const subject = encodeURIComponent(`Renewal Application — ${fullName} — Reg# ${nrcanId} — ${method} Level ${level}`);
    const body = encodeURIComponent(
      `Dear NRCan NDTCB,\n\nPlease find attached my renewal package for ${method} Level ${level}.\n\nApplicant: ${fullName}\nReg# ${nrcanId}\n\nDocuments attached:\n• 8.2.1-075 Renewal Application\n• 8.2.1-073 SCS Application\n• 8.2.1-002 Code of Conduct\n\nRegards,\n${fullName}`
    );
    window.open(`mailto:${NRCAN_EMAIL}?subject=${subject}&body=${body}`);
  };

  if (!cert) return null;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#d1ccc0' }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ backgroundColor: '#6b7040' }}>
        <p className="font-black text-sm" style={{ color: '#E8A020' }}>Download Renewal Package</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(245,237,214,0.7)' }}>3 pre-filled NRCan forms as a ZIP</p>
      </div>

      <div className="bg-white p-4 space-y-3">
        {status === 'idle' && (
          <button
            onClick={handleDownload}
            className="w-full h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
            style={{ backgroundColor: '#E8A020', color: '#fff' }}
          >
            <Download className="w-4 h-4" />
            Download Pre-filled Forms (.zip)
          </button>
        )}

        {status === 'loading' && (
          <div className="w-full h-12 rounded-xl flex items-center justify-center gap-2 bg-gray-50">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            <span className="text-sm text-gray-500 font-semibold">Filling forms…</span>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-semibold">{errorMsg}</span>
            </div>
            <button
              onClick={() => setStatus('idle')}
              className="w-full h-10 rounded-xl text-sm font-bold border"
              style={{ borderColor: '#6b7040', color: '#6b7040' }}
            >
              Try Again
            </button>
          </div>
        )}

        {status === 'done' && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-xl p-3" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#16a34a' }} />
              <div className="text-xs" style={{ color: '#166534' }}>
                <p className="font-black mb-1">3 forms downloaded — next steps:</p>
                <ol className="space-y-1 list-decimal list-inside">
                  <li>Open each PDF in <strong>Adobe Acrobat Reader</strong> (free)</li>
                  <li>Click the signature field and apply your <strong>PDF digital ID</strong></li>
                  <li>Have your supervisor sign as <strong>Employer, Supervisor &amp; Referee</strong></li>
                  <li>Email all 3 signed PDFs to NRCan using the button below</li>
                </ol>
              </div>
            </div>

            <button
              onClick={handleEmail}
              className="w-full h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
              style={{ backgroundColor: '#6b7040', color: '#E8A020' }}
            >
              <Mail className="w-4 h-4" />
              Open Email to NRCan
            </button>

            <button
              onClick={() => setStatus('idle')}
              className="w-full text-xs text-center font-semibold underline"
              style={{ color: '#6b7040' }}
            >
              Download again
            </button>
          </div>
        )}

        {/* Forms included */}
        <div className="pt-1 border-t border-gray-100 space-y-1">
          {[
            '8.2.1-075 — Renewal Application',
            '8.2.1-073 — SCS Points Application',
            '8.2.1-002 — Code of Conduct',
          ].map(f => (
            <div key={f} className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
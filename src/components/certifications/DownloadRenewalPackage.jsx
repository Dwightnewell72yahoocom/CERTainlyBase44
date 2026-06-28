import React, { useState } from 'react';
import { Download, Mail, CheckCircle, AlertCircle, Loader2, Copy, Check, ExternalLink } from 'lucide-react';
import { generateRenewalDataPack } from '@/lib/generateRenewalDataPack';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const NRCAN_EMAIL = 'ndtrecertification-endrecertification@nrcan-rncan.gc.ca';
const NRCAN_FORMS_URL = 'https://natural-resources.canada.ca/science-and-data/science-and-research/laboratories-and-test-facilities/non-destructive-testing/certification/forms-ndt/5800';

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0" style={{ borderColor: '#e8e4dc' }}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" style={{ color: '#6b7040' }}>{label}</p>
        <p className="text-sm font-medium truncate" style={{ color: '#1a1a1a' }}>{value}</p>
      </div>
      <button
        onClick={handleCopy}
        className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all"
        style={{ backgroundColor: copied ? '#3B6D11' : '#f0ede5', color: copied ? '#fff' : '#6b7040' }}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export default function DownloadRenewalPackage({ cert }) {
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showCopyFields, setShowCopyFields] = useState(false);

  const { data: experienceLogs = [] } = useQuery({
    queryKey: ['experienceLogs', cert?.technician_name],
    queryFn: () => base44.entities.ExperienceLog.filter({ technician_name: cert.technician_name }),
    enabled: !!cert?.technician_name,
  });

  const handleDownload = async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const pdfBytes = await generateRenewalDataPack(cert, experienceLogs);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NRCan_Renewal_DataPack_${(cert.technician_name || 'Applicant').replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('done');
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message || 'Generation failed');
      setStatus('error');
    }
  };

  const handleEmail = () => {
    const nameParts = (cert.technician_name || '').trim().split(' ');
    const METHOD_LIST = ['UT-PA', 'MT', 'UT', 'PT', 'RT', 'ET', 'VT', 'XF', 'CEDO'];
    const certNameUpper = (cert.certification_name || '').toUpperCase();
    const method = METHOD_LIST.find(m => certNameUpper.includes(m)) || '';
    const levelMatch = cert.certification_name?.match(/level\s*(\d)/i);
    const level = levelMatch ? levelMatch[1] : '';
    const subject = encodeURIComponent(`Renewal Application — ${cert.technician_name} — Reg# ${cert.nrcan_id || ''} — ${method} Level ${level}`);
    const body = encodeURIComponent(
      `Dear NRCan NDTCB,\n\nPlease find attached my renewal package for ${method} Level ${level}.\n\nApplicant: ${cert.technician_name}\nReg# ${cert.nrcan_id || ''}\n\nDocuments attached:\n• 8.2.1-075 Renewal Application (signed)\n• 8.2.1-073 SCS Points Application (signed)\n• 8.2.1-002 Code of Conduct (signed)\n\nRegards,\n${cert.technician_name}`
    );
    window.open(`mailto:${NRCAN_EMAIL}?subject=${subject}&body=${body}`);
  };

  if (!cert) return null;

  const nameParts = (cert.technician_name || '').trim().split(' ');
  const firstName = nameParts.slice(0, -1).join(' ');
  const lastName = nameParts.slice(-1)[0] || '';

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#d1ccc0' }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ backgroundColor: '#6b7040' }}>
        <p className="font-black text-sm" style={{ color: '#E8A020' }}>Renewal Package</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(245,237,214,0.7)' }}>Download your pre-filled data pack + open official NRCan forms</p>
      </div>

      <div className="bg-white p-4 space-y-3">

        {/* Step 1: Download data pack */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#d1ccc0' }}>
          <div className="px-3 py-2 flex items-center gap-2" style={{ backgroundColor: '#f7f4ee' }}>
            <span className="w-5 h-5 rounded-full text-xs font-black flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: '#6b7040' }}>1</span>
            <p className="text-xs font-black" style={{ color: '#6b7040' }}>Download your pre-filled Data Pack (PDF)</p>
          </div>
          <div className="p-3 space-y-2">
            <p className="text-xs" style={{ color: '#666' }}>
              Contains all your data organized section-by-section to match each NRCan form — just copy values across.
            </p>

            {status === 'idle' || status === 'done' ? (
              <button
                onClick={handleDownload}
                className="w-full h-11 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
                style={{ backgroundColor: '#E8A020', color: '#fff' }}
              >
                <Download className="w-4 h-4" />
                {status === 'done' ? 'Download Again' : 'Download Data Pack (.pdf)'}
              </button>
            ) : status === 'loading' ? (
              <div className="w-full h-11 rounded-xl flex items-center justify-center gap-2 bg-gray-50">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500 font-semibold">Building your data pack…</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">{errorMsg}</span>
                </div>
                <button onClick={() => setStatus('idle')} className="w-full h-10 rounded-xl text-sm font-bold border" style={{ borderColor: '#6b7040', color: '#6b7040' }}>
                  Try Again
                </button>
              </div>
            )}

            {status === 'done' && (
              <div className="flex items-start gap-2 rounded-xl p-3" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#16a34a' }} />
                <p className="text-xs font-semibold" style={{ color: '#166534' }}>Data pack downloaded — open it alongside the NRCan forms below</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick copy fields */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#d1ccc0' }}>
          <button
            onClick={() => setShowCopyFields(v => !v)}
            className="w-full px-3 py-2 flex items-center justify-between"
            style={{ backgroundColor: '#f7f4ee' }}
          >
            <div className="flex items-center gap-2">
              <Copy className="w-4 h-4" style={{ color: '#6b7040' }} />
              <p className="text-xs font-black" style={{ color: '#6b7040' }}>Quick-Copy Key Fields</p>
            </div>
            <span className="text-xs" style={{ color: '#999' }}>{showCopyFields ? 'Hide' : 'Tap to expand'}</span>
          </button>
          {showCopyFields && (
            <div className="px-3 pb-3 pt-1 space-y-0">
              <CopyField label="Surname" value={lastName} />
              <CopyField label="Given Names" value={firstName} />
              <CopyField label="Full Name" value={cert.technician_name} />
              <CopyField label="Registration #" value={cert.nrcan_id} />
              <CopyField label="Email" value={cert.technician_email} />
              <CopyField label="Certification Name" value={cert.certification_name} />
              <CopyField label="Present Employer" value={cert.employer_name} />
              <CopyField label="Employer Email" value={cert.employer_email} />
              <CopyField label="Supervisor Name" value={cert.supervisor_name} />
              <CopyField label="Supervisor Email" value={cert.supervisor_email} />
              <CopyField label="Expiry Date" value={cert.expiry_date} />
              <CopyField label="Issue Date" value={cert.issue_date} />
              <CopyField label="NRCan Email" value={NRCAN_EMAIL} />
            </div>
          )}
        </div>

        {/* Step 2: Open official forms */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#d1ccc0' }}>
          <div className="px-3 py-2 flex items-center gap-2" style={{ backgroundColor: '#f7f4ee' }}>
            <span className="w-5 h-5 rounded-full text-xs font-black flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: '#6b7040' }}>2</span>
            <p className="text-xs font-black" style={{ color: '#6b7040' }}>Open official NRCan forms</p>
          </div>
          <div className="p-3 space-y-2">
            <p className="text-xs" style={{ color: '#666' }}>
              Download the official fillable PDFs from NRCan. Use your Data Pack to fill them quickly.
            </p>
            <a
              href={NRCAN_FORMS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 border"
              style={{ borderColor: '#6b7040', color: '#6b7040', backgroundColor: 'white' }}
            >
              <ExternalLink className="w-4 h-4" />
              Open NRCan Forms Page
            </a>
            <div className="grid grid-cols-1 gap-1 pt-1">
              {[
                { code: '8.2.1-075', name: 'Renewal Application' },
                { code: '8.2.1-073', name: 'SCS Points Application' },
                { code: '8.2.1-002', name: 'Code of Conduct' },
              ].map(f => (
                <div key={f.code} className="flex items-center gap-2 text-xs" style={{ color: '#888' }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#6b7040' }} />
                  <span className="font-semibold" style={{ color: '#6b7040' }}>{f.code}</span>
                  <span>{f.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 3: Email NRCan */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#d1ccc0' }}>
          <div className="px-3 py-2 flex items-center gap-2" style={{ backgroundColor: '#f7f4ee' }}>
            <span className="w-5 h-5 rounded-full text-xs font-black flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: '#6b7040' }}>3</span>
            <p className="text-xs font-black" style={{ color: '#6b7040' }}>Email signed forms to NRCan</p>
          </div>
          <div className="p-3 space-y-2">
            <p className="text-xs" style={{ color: '#666' }}>
              Once all 3 forms are signed (by you + employer), send them to NRCan.
            </p>
            <button
              onClick={handleEmail}
              className="w-full h-11 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
              style={{ backgroundColor: '#6b7040', color: '#E8A020' }}
            >
              <Mail className="w-4 h-4" />
              Open Pre-filled Email to NRCan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
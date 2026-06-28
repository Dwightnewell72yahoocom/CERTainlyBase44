import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, RefreshCw, AlertTriangle, User, Hash, Building2, Calendar, ClipboardList, BarChart2, CheckSquare, FileText, Search } from "lucide-react";
import DownloadRenewalPackage from "@/components/certifications/DownloadRenewalPackage";
import BottomNav from "@/components/layout/BottomNav";
import { differenceInDays, isPast, parseISO, format } from "date-fns";

const NRCAN_RENEWAL_URL = "https://natural-resources.canada.ca/science-data/science-research/renewing-your-ndt-certification";

const RENEWAL_TOOLS = [
  { label: 'Form 8.2.1-075 — Renewal Application', sub: 'Auto-populated from your cert record', path: '/renewal-application', Icon: ClipboardList },
  { label: 'Form 8.2.1-073 — SCS Points', sub: 'Auto-populated from your logged entries', path: '/scs-form', Icon: BarChart2 },
  { label: 'Renewal Checklist', sub: 'Step-by-step NRCan submission guide', path: '/renewal-checklist', Icon: CheckSquare },
  { label: 'Attestation Letter', sub: 'Generate NRCan-compliant supervisor letter', path: '/attestation-letter', Icon: FileText },
  { label: 'Verify Technician', sub: 'Look up NRCan certified personnel', path: '/nrcan-directory', Icon: Search },
];

export default function RenewalPortal() {
  const [selectedCertId, setSelectedCertId] = useState('');

  const { data: certs = [] } = useQuery({
    queryKey: ['certifications'],
    queryFn: () => base44.entities.Certification.list('-expiry_date'),
  });

  const renewalCerts = certs.filter(c => {
    if (!c.expiry_date) return false;
    const days = differenceInDays(parseISO(c.expiry_date), new Date());
    return days <= 180;
  });

  const selected = certs.find(c => c.id === selectedCertId);

  const getDaysStatus = (expiryDate) => {
    if (!expiryDate) return { expired: false, days: null };
    const expiry = parseISO(expiryDate);
    const expired = isPast(expiry);
    const days = differenceInDays(expiry, new Date());
    return { expired, days };
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f4ee', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-3 sticky top-0 z-10 shadow-md" style={{ backgroundColor: '#6b7040' }}>
        <h1 className="text-xl font-black" style={{ color: '#f5eed8' }}>NRCan Renewal Portal</h1>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(232,160,32,0.8)' }}>One-tap access to certification renewal</p>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Urgent renewals alert */}
        {renewalCerts.length > 0 && (
          <div className="rounded-2xl border p-4" style={{ backgroundColor: '#fff7ed', borderColor: '#fed7aa' }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4" style={{ color: '#BA7517' }} />
              <span className="font-black text-sm" style={{ color: '#7c2d12' }}>
                {renewalCerts.length} certification{renewalCerts.length !== 1 ? 's' : ''} require renewal
              </span>
            </div>
            <div className="space-y-2">
              {renewalCerts.map(cert => {
                const { expired, days } = getDaysStatus(cert.expiry_date);
                return (
                  <div key={cert.id} className="bg-white rounded-xl p-3 flex items-center justify-between border" style={{ borderColor: '#fed7aa' }}>
                    <div>
                      <div className="font-bold text-sm text-gray-900">{cert.technician_name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{cert.certification_name}</div>
                    </div>
                    <span className="text-sm font-black px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: expired ? '#fef2f2' : '#fff7ed',
                        color: expired ? '#A32D2D' : '#BA7517'
                      }}>
                      {expired ? 'OVERDUE' : `${days}d left`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Select + open portal */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(107,112,64,0.1)' }}>
              <RefreshCw className="w-4 h-4" style={{ color: '#6b7040' }} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-sm">Select Certification to Renew</h3>
              <p className="text-xs text-gray-400 mt-0.5">Opens official NRCan portal</p>
            </div>
          </div>

          <Select value={selectedCertId} onValueChange={setSelectedCertId}>
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder="Choose a certification..." />
            </SelectTrigger>
            <SelectContent>
              {certs.map(cert => (
                <SelectItem key={cert.id} value={cert.id}>
                  {cert.technician_name} — {cert.certification_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Pre-filled data preview */}
          {selected && (
            <div className="rounded-xl p-4 space-y-2.5 border" style={{ backgroundColor: '#f7f4ee', borderColor: '#e5ded0' }}>
              <div className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: '#6b7040' }}>Pre-filled Data</div>
              {[
                { Icon: User, label: 'Technician', value: selected.technician_name },
                { Icon: Hash, label: 'NRCan ID', value: selected.nrcan_id || '—' },
                { Icon: RefreshCw, label: 'Certification', value: selected.certification_name },
                { Icon: Building2, label: 'Employer', value: selected.employer_name || '—' },
                { Icon: Calendar, label: 'Expires', value: selected.expiry_date ? format(parseISO(selected.expiry_date), 'MMM d, yyyy') : '—' },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span className="text-xs text-gray-500 w-24">{label}</span>
                  <span className="text-sm font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          )}

          <button
            className="w-full h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
            style={{ backgroundColor: '#6b7040', color: '#E8A020' }}
            onClick={() => window.open(NRCAN_RENEWAL_URL, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
            Open NRCan Renewal Portal
          </button>
        </div>

        {/* PDF auto-fill download */}
        {selected && <DownloadRenewalPackage cert={selected} />}

        {/* Direct link */}
        <button
          onClick={() => window.open('https://natural-resources.canada.ca/science-data/non-destructive-testing/non-destructive-testing-certification', '_blank')}
          className="w-full text-center text-sm py-1 font-semibold underline"
          style={{ color: '#6b7040' }}
        >
          Go directly to NRCan portal →
        </button>

        {/* Renewal tools */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1" style={{ backgroundColor: '#d1ccc0' }} />
            <span className="text-xs font-black uppercase tracking-wider px-2" style={{ color: '#6b7040' }}>Renewal Tools</span>
            <div className="h-px flex-1" style={{ backgroundColor: '#d1ccc0' }} />
          </div>
          {RENEWAL_TOOLS.map(({ label, sub, path, Icon }) => (
            <a key={path} href={path}
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 active:scale-95 transition-transform shadow-sm">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(107,112,64,0.08)' }}>
                <Icon className="w-5 h-5" style={{ color: '#6b7040' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-gray-900 text-sm leading-snug">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </a>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
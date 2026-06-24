import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, RefreshCw, AlertTriangle, User, Hash, Building2 } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import { differenceInDays, isPast, parseISO, format } from "date-fns";

const NRCAN_RENEWAL_URL = "https://natural-resources.canada.ca/science-data/science-research/renewing-your-ndt-certification";

export default function RenewalPortal() {
  const [selectedCertId, setSelectedCertId] = useState('');

  const { data: certs = [] } = useQuery({
    queryKey: ['certifications'],
    queryFn: () => base44.entities.Certification.list('-expiry_date'),
  });

  const renewalCerts = certs.filter(c => {
    const days = differenceInDays(parseISO(c.expiry_date), new Date());
    return days <= 180;
  });

  const selected = certs.find(c => c.id === selectedCertId);

  const buildRenewalUrl = (cert) => {
    return NRCAN_RENEWAL_URL;
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f4ee' }}>
      <div className="px-4 pt-10 pb-4 sticky top-0 z-10" style={{ backgroundColor: '#5a5f38' }}>
        <h1 className="text-xl font-bold" style={{ color: '#F5EDD6' }}>NRCan Renewal Portal</h1>
        <p className="text-sm" style={{ color: 'rgba(232,160,32,0.8)' }}>One-tap access to certification renewal</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Info card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-xl p-2.5 flex-shrink-0"><RefreshCw className="w-5 h-5 text-blue-600" /></div>
            <div>
              <h3 className="font-semibold text-gray-900">NRCan Certification Renewal</h3>
              <p className="text-sm text-gray-600 mt-1">
                Select a certification below to pre-fill your renewal application on the official NRCan portal.
              </p>
            </div>
          </div>
        </div>

        {/* Urgent renewals */}
        {renewalCerts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-amber-800 text-sm">{renewalCerts.length} certification{renewalCerts.length !== 1 ? 's' : ''} need renewal</span>
            </div>
            <div className="space-y-2">
              {renewalCerts.map(cert => {
                const days = differenceInDays(parseISO(cert.expiry_date), new Date());
                const expired = isPast(parseISO(cert.expiry_date));
                return (
                  <div key={cert.id} className="bg-white rounded-lg p-3 flex items-center justify-between border border-amber-100">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{cert.technician_name}</div>
                      <div className="text-xs text-gray-500">{cert.certification_name}</div>
                    </div>
                    <div className={`text-sm font-bold ${expired ? 'text-red-600' : days <= 90 ? 'text-red-500' : 'text-amber-600'}`}>
                      {expired ? 'EXPIRED' : `${days}d left`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Select certification */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Select Certification to Renew</h3>
          <Select value={selectedCertId} onValueChange={setSelectedCertId}>
            <SelectTrigger className="h-12">
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
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pre-filled Data</div>
              {[
                { icon: User, label: 'Technician', value: selected.technician_name },
                { icon: Hash, label: 'NRCan ID', value: selected.nrcan_id || '—' },
                { icon: RefreshCw, label: 'Certification', value: selected.certification_name },
                { icon: Building2, label: 'Employer', value: selected.employer_name || '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500 w-24">{label}</span>
                  <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-500 w-24">Expires</span>
                <span className="text-sm font-medium text-gray-900">{format(parseISO(selected.expiry_date), 'MMM d, yyyy')}</span>
              </div>
            </div>
          )}

          <Button
            className="w-full h-12 text-base font-bold"
          style={{ backgroundColor: '#5a5f38', color: '#E8A020' }}
            onClick={() => window.open(buildRenewalUrl(selected), '_blank')}
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Open NRCan Renewal Portal
          </Button>
          {selected && (
            <p className="text-xs text-gray-400 text-center">Opens official NRCan portal with data pre-filled in the URL</p>
          )}
        </div>

        {/* Direct link */}
        <button
          onClick={() => window.open('https://natural-resources.canada.ca/science-data/non-destructive-testing/non-destructive-testing-certification', '_blank')}
          className="w-full text-center text-sm py-2 underline font-medium"
          style={{ color: '#5a5f38' }}
        >
          Go directly to NRCan portal →
        </button>

        {/* Quick links to renewal tools */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Renewal Tools</h3>
          {[
            { label: 'Renewal Checklist', sub: 'Step-by-step NRCan submission guide', path: '/renewal-checklist', emoji: '✅' },
            { label: 'Attestation Letter', sub: 'Generate NRCan-compliant supervisor letter', path: '/attestation-letter', emoji: '📄' },
            { label: 'Verify Technician', sub: 'Look up NRCan certified personnel', path: '/nrcan-directory', emoji: '🔍' },
          ].map(item => (
            <a key={item.path} href={item.path}
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-4 active:scale-98 transition-transform">
              <span className="text-2xl">{item.emoji}</span>
              <div>
                <div className="font-bold text-gray-900 text-sm">{item.label}</div>
                <div className="text-xs text-gray-400">{item.sub}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
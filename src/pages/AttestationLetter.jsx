import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { differenceInDays, parseISO, format } from "date-fns";
import { FileText, Copy, Send, ChevronDown, CheckCircle } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import { toast } from "sonner";

const LETTER_TEMPLATE = (tech, cert, supervisor, activities) => `
NRCan NDTCB Attestation Letter
CAN/CGSB-48.9712-2022

Date: ${format(new Date(), 'MMMM d, yyyy')}

To: NRCan Non-Destructive Testing Certification Body (NDTCB)

I, ${supervisor.name || '[Supervisor Name]'}, holding NRCan/CGSB Registration No. ${supervisor.reg || '[Reg#]'}, employed at ${supervisor.employer || '[Employer]'}, hereby attest to the following:

I confirm that ${tech || '[Technician Name]'} has performed satisfactory NDT work in the ${cert || '[Method]'} method during the past 5 years without significant interruption.

Specifically, I attest to the following activities:
${activities || '• Field inspection work performed on industrial equipment\n• Activities were conducted under appropriate supervision and in compliance with applicable standards'}

To the best of my knowledge, the information provided in this renewal application package is accurate and complete.

Supervisor/Employer Signature: _______________________

Printed Name: ${supervisor.name || '[Supervisor Name]'}

NRCan/CGSB Reg#: ${supervisor.reg || '[Reg#]'}

Employer: ${supervisor.employer || '[Employer]'}

Email: ${supervisor.email || '[Email]'}

Date: _______________

This letter is submitted in support of ${tech || '[Technician Name]'}'s ${cert || '[Method]'} certification renewal application to NRCan NDTCB.
`.trim();

export default function AttestationLetter() {
  const [techName, setTechName] = useState('');
  const [selectedCertId, setSelectedCertId] = useState('');
  const [supervisor, setSupervisor] = useState({ name: '', reg: '', employer: '', email: '' });
  const [activities, setActivities] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: certs = [] } = useQuery({
    queryKey: ['certifications'],
    queryFn: () => base44.entities.Certification.list('-expiry_date'),
  });

  const selectedCert = certs.find(c => c.id === selectedCertId);
  const letter = LETTER_TEMPLATE(
    selectedCert?.technician_name || techName,
    selectedCert?.certification_name || '',
    supervisor,
    activities
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    toast.success('Letter copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`NRCan Attestation Letter – ${selectedCert?.technician_name || techName}`);
    const body = encodeURIComponent(letter);
    window.open(`mailto:${supervisor.email || ''}?subject=${subject}&body=${body}`);
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f4ee' }}>
      <div className="px-4 pt-10 pb-4 sticky top-0 z-10" style={{ backgroundColor: '#5a5f38' }}>
        <h1 className="text-xl font-black" style={{ color: '#F5EDD6' }}>Attestation Letter</h1>
        <p className="text-sm" style={{ color: 'rgba(232,160,32,0.8)' }}>NRCan-compliant supervisor attestation</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Info */}
        <div className="rounded-2xl p-4 border-l-4" style={{ backgroundColor: 'rgba(90,95,56,0.08)', borderLeftColor: '#E8A020' }}>
          <p className="text-sm font-medium" style={{ color: '#5a5f38' }}>
            No documentation for some activities? A supervisor attestation letter is officially accepted by NRCan NDTCB. Your supervisor signs — CERTainly generates the letter.
          </p>
        </div>

        {/* Select Certification */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <h3 className="font-bold text-gray-900">Certification to Attest</h3>
          <select
            value={selectedCertId}
            onChange={e => setSelectedCertId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-white outline-none"
          >
            <option value="">— Select a certification —</option>
            {certs.map(c => (
              <option key={c.id} value={c.id}>{c.technician_name} — {c.certification_name}</option>
            ))}
          </select>
          {!selectedCertId && (
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none"
              placeholder="Or type technician name manually..."
              value={techName}
              onChange={e => setTechName(e.target.value)}
            />
          )}
        </div>

        {/* Supervisor Details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <h3 className="font-bold text-gray-900">Supervisor / Signatory</h3>
          {[
            { key: 'name', label: 'Full Name', placeholder: 'Andrew Crawford' },
            { key: 'reg', label: 'NRCan Reg#', placeholder: '6337' },
            { key: 'employer', label: 'Employer', placeholder: 'Buffalo Inspection Services' },
            { key: 'email', label: 'Email', placeholder: 'a.crawford@company.com' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{f.label}</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm mt-1 outline-none focus:border-amber-400"
                placeholder={f.placeholder}
                value={supervisor[f.key]}
                onChange={e => setSupervisor(s => ({ ...s, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        {/* Activities */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
          <h3 className="font-bold text-gray-900">Activities to Attest</h3>
          <p className="text-xs text-gray-400">List the specific work activities the supervisor is confirming</p>
          <textarea
            className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-amber-400 min-h-[100px]"
            placeholder="• Ultrasonic thickness testing on pressure vessels&#10;• Weld inspection on pipeline joints&#10;• TOFD scanning on storage tanks"
            value={activities}
            onChange={e => setActivities(e.target.value)}
          />
        </div>

        {/* Letter Preview */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Letter Preview</h3>
            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(90,95,56,0.1)', color: '#5a5f38' }}>
              NRCan compliant
            </span>
          </div>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl p-3 font-mono border border-gray-100 max-h-64 overflow-y-auto">
            {letter}
          </pre>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm"
            style={{ backgroundColor: copied ? '#22c55e' : '#5a5f38', color: copied ? 'white' : '#E8A020' }}
          >
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Letter'}
          </button>
          <button
            onClick={handleEmail}
            disabled={!supervisor.name}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm disabled:opacity-40"
            style={{ backgroundColor: '#E8A020', color: '#5a5f38' }}
          >
            <Send className="w-4 h-4" />
            Email to Supervisor
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
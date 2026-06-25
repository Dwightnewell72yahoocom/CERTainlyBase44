import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { computeTotals, TAB_CONFIG } from "@/lib/points";
import { format, parseISO } from "date-fns";
import { Download, Printer, ChevronDown, ChevronUp, FileText, CheckCircle } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import { toast } from "sonner";

// Maps log_type to NRCan SCS tab letter/name exactly as it appears on form 8.2.1-073
const TAB_LABELS = {
  field_work:         { tab: 'A1', title: 'Field Work / NDT Activities' },
  training_received:  { tab: 'A2', title: 'Training Received' },
  training_delivered: { tab: 'A3', title: 'Training Delivered' },
  research:           { tab: 'A4', title: 'Research / Engineering' },
  seminars:           { tab: 'B1', title: 'Seminars / Conferences' },
  professional:       { tab: 'B2', title: 'Professional Society Activity' },
  mentoring:          { tab: 'B3', title: 'Mentoring / Supervision' },
};

function formatDate(d) {
  if (!d) return '—';
  try { return format(parseISO(d), 'yyyy/MM/dd'); } catch { return d; }
}

function entryDetail(log) {
  const parts = [];
  if (log.employer) parts.push(log.employer);
  if (log.organisation) parts.push(log.organisation);
  if (log.provider) parts.push(log.provider);
  if (log.ndt_method) parts.push(log.ndt_method);
  if (log.sector) parts.push(log.sector);
  if (log.event_name) parts.push(log.event_name);
  if (log.organiser) parts.push(log.organiser);
  if (log.role) parts.push(log.role.charAt(0).toUpperCase() + log.role.slice(1));
  if (log.training_type) parts.push(log.training_type);
  if (log.mentee_names) parts.push(`Mentees: ${log.mentee_names}`);
  if (log.membership_id) parts.push(`ID: ${log.membership_id}`);
  if (log.supervisor) parts.push(`Supervisor: ${log.supervisor}`);
  if (log.hours) parts.push(`${log.hours} hrs`);
  return parts.join(' · ') || log.description || '—';
}

export default function SCSFormPreview() {
  const [techName, setTechName] = useState('');
  const [regNum, setRegNum] = useState('');
  const [method, setMethod] = useState('');
  const [employer, setEmployer] = useState('');
  const [expanded, setExpanded] = useState({});

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['experience_logs'],
    queryFn: () => base44.entities.ExperienceLog.list('-start_date'),
  });

  const totals = computeTotals(logs);
  const byType = {};
  Object.keys(TAB_LABELS).forEach(t => { byType[t] = logs.filter(l => l.log_type === t); });

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    toast('Generating PDF…');
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
      const W = 216, M = 14;
      let y = 18;

      // Header
      doc.setFillColor(90, 95, 56);
      doc.rect(0, 0, W, 22, 'F');
      doc.setTextColor(232, 160, 32);
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text('NRCan NDTCB — SCS Application (Form 8.2.1-073)', M, 14);
      y = 30;

      // Applicant info
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50);
      doc.text(`Applicant: ${techName || logs[0]?.technician_name || ''}`, M, y);
      doc.text(`NRCan/CGSB Reg#: ${regNum}`, 120, y); y += 6;
      doc.text(`NDT Method & Level: ${method}`, M, y);
      doc.text(`Employer: ${employer}`, 120, y); y += 6;
      doc.text(`Date: ${format(new Date(), 'yyyy/MM/dd')}`, M, y); y += 8;

      // Points summary
      doc.setFillColor(245, 237, 214);
      doc.rect(M, y, W - M * 2, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL SCS POINTS: ${totals.total} / 100`, M + 3, y + 6.5);
      doc.text(`Part A (min 50): ${totals.coreTabs}`, 100, y + 6.5);
      y += 15;

      // Each tab
      Object.entries(TAB_LABELS).forEach(([type, meta]) => {
        const entries = byType[type];
        const pts = totals.byType[type] || 0;
        const cfg = TAB_CONFIG[type];

        doc.setFillColor(90, 95, 56);
        doc.rect(M, y, W - M * 2, 7, 'F');
        doc.setTextColor(245, 237, 214); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text(`Tab ${meta.tab} — ${meta.title}`, M + 2, y + 4.8);
        doc.text(`${pts} / ${cfg.maxPoints} pts  (${cfg.pointsRule})`, W - M - 2, y + 4.8, { align: 'right' });
        doc.setTextColor(50, 50, 50); y += 9;

        if (entries.length === 0) {
          doc.setFont('helvetica', 'italic'); doc.setFontSize(8);
          doc.text('No entries logged.', M + 2, y + 4); y += 8;
        } else {
          // Column headers
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
          doc.text('Activity / Title', M + 1, y + 3.5);
          doc.text('Details', 80, y + 3.5);
          doc.text('Period', 148, y + 3.5);
          doc.text('Pts', W - M - 2, y + 3.5, { align: 'right' });
          doc.setDrawColor(200, 200, 200); doc.line(M, y + 5.5, W - M, y + 5.5);
          y += 7;

          entries.forEach((log, i) => {
            if (y > 255) { doc.addPage(); y = 18; }
            const bg = i % 2 === 0;
            if (bg) { doc.setFillColor(250, 249, 246); doc.rect(M, y - 1, W - M * 2, 6.5, 'F'); }
            doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(30, 30, 30);

            const title = doc.splitTextToSize(log.title || '—', 52);
            const detail = doc.splitTextToSize(entryDetail(log), 64);
            const period = `${formatDate(log.start_date)} – ${formatDate(log.end_date)}`;

            doc.text(title[0], M + 1, y + 3.5);
            doc.text(detail[0], 80, y + 3.5);
            doc.text(period, 148, y + 3.5);
            doc.setFont('helvetica', 'bold');
            doc.text(`${log.points || 0}`, W - M - 2, y + 3.5, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            y += 6.5;
          });
        }
        y += 4;
      });

      // Signature block
      if (y > 230) { doc.addPage(); y = 18; }
      y += 4;
      doc.setDrawColor(150, 150, 150);
      doc.line(M, y + 10, 90, y + 10);
      doc.line(100, y + 10, W - M, y + 10);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.text('Applicant Signature', M, y + 14);
      doc.text('Date', 100, y + 14);

      // Footer
      doc.setFontSize(7); doc.setTextColor(130, 130, 130);
      doc.text('Generated by CERTainly · A Sound Solutions DataCAT product · NRCan CAN/CGSB-48.9712-2022', M, 272);

      doc.save(`SCS-Form-8.2.1-073-${techName || 'Technician'}-${format(new Date(), 'yyyyMMdd')}.pdf`);
      toast.success('PDF downloaded');
    } catch (e) {
      toast.error('PDF generation failed');
      console.error(e);
    }
  };

  const displayName = techName || logs[0]?.technician_name || '';

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f4ee' }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-4 sticky top-0 z-10" style={{ backgroundColor: '#5a5f38' }}>
        <h1 className="text-xl font-black" style={{ color: '#F5EDD6' }}>SCS Form 8.2.1-073</h1>
        <p className="text-sm" style={{ color: 'rgba(232,160,32,0.8)' }}>Auto-populated from your logged entries</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Applicant info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <h3 className="font-bold text-gray-900">Applicant Details</h3>
          <p className="text-xs text-gray-400">These appear on the signed form — match exactly your NRCan record.</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Full Name', key: 'name', state: techName, set: setTechName, placeholder: displayName || 'Dwight Newell' },
              { label: 'NRCan / CGSB Reg#', key: 'reg', state: regNum, set: setRegNum, placeholder: '13415' },
              { label: 'NDT Method & Level', key: 'method', state: method, set: setMethod, placeholder: 'MT-2, EMC' },
              { label: 'Employer', key: 'employer', state: employer, set: setEmployer, placeholder: 'Buffalo Inspection Services' },
            ].map(({ label, state, set, placeholder }) => (
              <div key={label}>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mt-1 outline-none focus:border-amber-400"
                  placeholder={placeholder}
                  value={state}
                  onChange={e => set(e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Points summary banner */}
        <div className="rounded-2xl p-4 flex items-center justify-between" style={{ backgroundColor: '#5a5f38' }}>
          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: 'rgba(245,237,214,0.6)' }}>TOTAL SCS POINTS</div>
            <div className="text-4xl font-black" style={{ color: totals.total >= 100 ? '#4ade80' : '#E8A020' }}>
              {totals.total}<span className="text-lg font-normal" style={{ color: 'rgba(245,237,214,0.5)' }}>/100</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold mb-1" style={{ color: 'rgba(245,237,214,0.6)' }}>PART A (min 50)</div>
            <div className="text-2xl font-black" style={{ color: totals.coreTabs >= 50 ? '#4ade80' : '#f87171' }}>
              {totals.coreTabs}
            </div>
          </div>
        </div>

        {/* Form preview — each tab */}
        <div className="space-y-3">
          {Object.entries(TAB_LABELS).map(([type, meta]) => {
            const entries = byType[type];
            const pts = totals.byType[type] || 0;
            const cfg = TAB_CONFIG[type];
            const isOpen = expanded[type];
            const isPartA = ['field_work','training_received','training_delivered','research'].includes(type);

            return (
              <div key={type} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <button
                  className="w-full flex items-center gap-3 p-4 text-left"
                  onClick={() => setExpanded(s => ({ ...s, [type]: !s[type] }))}
                >
                  <div className="flex-shrink-0 rounded-lg px-2 py-1 text-xs font-black"
                    style={{ backgroundColor: isPartA ? 'rgba(90,95,56,0.1)' : 'rgba(232,160,32,0.1)',
                             color: isPartA ? '#5a5f38' : '#b87d10' }}>
                    {meta.tab}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 text-sm">{meta.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{entries.length} entries · {cfg.pointsRule}</div>
                  </div>
                  <div className="text-right flex-shrink-0 mr-2">
                    <div className="font-black text-lg" style={{ color: pts >= cfg.maxPoints ? '#16a34a' : '#E8A020' }}>{pts}</div>
                    <div className="text-xs text-gray-400">/{cfg.maxPoints}</div>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100">
                    {entries.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-gray-400 italic">No entries logged for this category yet.</p>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {/* Column headers */}
                        <div className="grid grid-cols-12 px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
                          <span className="col-span-4">Activity</span>
                          <span className="col-span-5">Details</span>
                          <span className="col-span-2">Period</span>
                          <span className="col-span-1 text-right">Pts</span>
                        </div>
                        {entries.map((log, i) => (
                          <div key={log.id} className="grid grid-cols-12 px-4 py-3 text-xs gap-1 items-start"
                            style={{ backgroundColor: i % 2 === 0 ? 'white' : '#fafaf8' }}>
                            <div className="col-span-4 font-medium text-gray-900 leading-tight">{log.title || '—'}</div>
                            <div className="col-span-5 text-gray-500 leading-tight">{entryDetail(log)}</div>
                            <div className="col-span-2 text-gray-400 leading-tight">
                              {formatDate(log.start_date)}<br />{formatDate(log.end_date)}
                            </div>
                            <div className="col-span-1 text-right font-black" style={{ color: '#5a5f38' }}>{log.points || 0}</div>
                          </div>
                        ))}
                        {/* Tab total row */}
                        <div className="grid grid-cols-12 px-4 py-2 text-xs font-bold" style={{ backgroundColor: 'rgba(90,95,56,0.05)' }}>
                          <span className="col-span-11 text-right" style={{ color: '#5a5f38' }}>Tab {meta.tab} Total</span>
                          <span className="col-span-1 text-right" style={{ color: pts >= cfg.maxPoints ? '#16a34a' : '#E8A020' }}>{pts}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Signature block preview */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <h3 className="font-bold text-gray-900">Signature Block</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-400 mb-1">Applicant Signature</div>
              <div className="border-b border-gray-300 h-8" />
              <div className="text-xs text-gray-500 mt-1">{displayName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Date</div>
              <div className="border-b border-gray-300 h-8" />
              <div className="text-xs text-gray-500 mt-1">{format(new Date(), 'yyyy/MM/dd')}</div>
            </div>
          </div>
          {totals.total >= 100 ? (
            <div className="flex items-center gap-2 mt-2 text-green-700 bg-green-50 rounded-xl p-3">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">100+ points — ready to submit</span>
            </div>
          ) : (
            <div className="text-sm text-amber-700 bg-amber-50 rounded-xl p-3">
              ⚠ {100 - totals.total} more points needed before submission
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 pb-4">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm border-2"
            style={{ borderColor: '#5a5f38', color: '#5a5f38', backgroundColor: 'white' }}
          >
            <Printer className="w-4 h-4" />
            Print Form
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm"
            style={{ backgroundColor: '#E8A020', color: '#5a5f38' }}
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
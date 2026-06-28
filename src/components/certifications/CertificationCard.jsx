import React, { useState, useEffect } from 'react';
import { FileText, User, Hash, Calendar, Trash2, ExternalLink, Share2, ShieldCheck, Zap, RefreshCw, AlertTriangle, Download, Loader2, CheckCircle } from "lucide-react";
import { format, parseISO, differenceInDays, isPast, differenceInSeconds } from "date-fns";
import DocumentShareDialog from "./DocumentShareDialog";
import { useNavigate } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { generateRenewalDataPack } from '@/lib/generateRenewalDataPack';

const DISCIPLINE_LABELS = {
  ndt_mt: 'MT', ndt_ut: 'UT', ndt_pt: 'PT', ndt_rt: 'RT',
  ndt_et: 'ET', ndt_vt: 'VT', ndt_ut_pa: 'UT-PA', ndt_xf: 'XF', ndt_cedo: 'CEDO', other: 'Other'
};

function getStatus(expiryDate) {
  if (!expiryDate) return { type: 'unknown', days: null };
  const expiry = parseISO(expiryDate);
  const days = differenceInDays(expiry, new Date());
  if (isPast(expiry) || days <= 0) return { type: 'overdue', days: Math.abs(days) };
  if (days <= 60) return { type: 'urgent', days };
  return { type: 'active', days };
}

const STATUS_THEME = {
  overdue:  { border: '#A32D2D', bg: '#fff5f5', tint: 'rgba(163,45,45,0.06)', label: 'OVERDUE',   labelBg: '#A32D2D', labelText: 'white', dayColor: '#A32D2D', btnBg: '#A32D2D', btnText: 'white', btnLabel: 'Renew now — late fee applies' },
  urgent:   { border: '#BA7517', bg: '#fffdf5', tint: 'rgba(186,117,23,0.06)', label: 'DUE SOON',  labelBg: '#BA7517', labelText: 'white', dayColor: '#BA7517', btnBg: '#BA7517', btnText: 'white', btnLabel: 'Start renewal package' },
  expiring: { border: '#E8A020', bg: '#fffdf5', tint: 'rgba(232,160,32,0.06)', label: 'EXPIRING',  labelBg: '#E8A020', labelText: '#5a5f38', dayColor: '#BA7517', btnBg: '#6b7040', btnText: '#E8A020', btnLabel: 'Start renewal package' },
  active:   { border: '#3B6D11', bg: '#f6fbf2', tint: 'rgba(59,109,17,0.04)', label: 'ACTIVE',    labelBg: '#3B6D11', labelText: 'white', dayColor: '#3B6D11', btnBg: '#6b7040', btnText: '#E8A020', btnLabel: 'Renewal Form' },
  unknown:  { border: '#9ca3af', bg: '#f9fafb', tint: 'transparent',          label: 'UNKNOWN',  labelBg: '#9ca3af', labelText: 'white', dayColor: '#9ca3af', btnBg: '#6b7040', btnText: '#E8A020', btnLabel: 'Renewal Form' },
};

function LiveCountdown({ expiryDate }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!expiryDate) return null;
  const expiry = parseISO(expiryDate);
  const totalSecs = differenceInSeconds(expiry, new Date());
  if (totalSecs <= 0) return <span style={{ color: '#A32D2D', fontWeight: 800 }}>OVERDUE</span>;
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return <span>{d}d {h}h {m}m {s}s</span>;
}

function ProgressRing({ pct, color, size = 64 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = circ - (circ * Math.min(pct, 100)) / 100;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={fill}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle"
        style={{ fill: color, fontSize: 13, fontWeight: 800, transform: `rotate(90deg) translateY(-${size}px)` }}>
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

export default function CertificationCard({ certification, scsPoints = 0, onDelete }) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState('idle'); // idle | loading | done | error
  const navigate = useNavigate();

  const { type, days } = getStatus(certification.expiry_date);

  const { data: experienceLogs = [] } = useQuery({
    queryKey: ['experienceLogs', certification.technician_name],
    queryFn: () => base44.entities.ExperienceLog.filter({ technician_name: certification.technician_name }),
    enabled: !!certification.technician_name,
  });

  const handleDownloadSummary = async () => {
    setDownloadStatus('loading');
    try {
      const pdfBytes = await generateRenewalDataPack(certification, experienceLogs);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NRCan_Renewal_Summary_${(certification.technician_name || 'Applicant').replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloadStatus('done');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    } catch (e) {
      console.error(e);
      setDownloadStatus('error');
    }
  };
  const theme = STATUS_THEME[type];
  const discipline = DISCIPLINE_LABELS[certification.category] || certification.category || '';
  const scsTarget = 100;
  const scsPct = Math.min((scsPoints / scsTarget) * 100, 100);
  const ptsToTarget = Math.max(scsTarget - scsPoints, 0);

  const handleShareDocument = (url, index) => {
    setSelectedDocument({ url, name: `${certification.certification_name} - Document ${index + 1}` });
    setShareDialogOpen(true);
  };

  return (
    <>
      <DocumentShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        documentUrl={selectedDocument?.url}
        documentName={selectedDocument?.name}
      />
      <div className="rounded-2xl overflow-hidden shadow-sm"
        style={{ backgroundColor: theme.bg, borderLeft: `4px solid ${theme.border}`, border: `1px solid ${theme.border}33`, borderLeftWidth: 4 }}>
        <div className="p-4">
          {/* Top row: discipline badge + status badge + delete */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              {discipline && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide"
                  style={{ backgroundColor: '#6b7040', color: '#E8A020' }}>{discipline}</span>
              )}
              {certification.governing_body && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border"
                  style={{
                    borderColor: certification.governing_body === 'CNSC' ? '#7c3aed' : '#2563eb',
                    color: certification.governing_body === 'CNSC' ? '#7c3aed' : '#2563eb',
                    backgroundColor: certification.governing_body === 'CNSC' ? '#f5f3ff' : '#eff6ff'
                  }}>
                  <ShieldCheck className="w-3 h-3" />{certification.governing_body}
                </span>
              )}
              {certification.scs_applicable && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                  <Zap className="w-3 h-3" />SCS
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-black"
                style={{ backgroundColor: theme.labelBg, color: theme.labelText }}>
                {theme.label}
              </span>
              <button onClick={() => onDelete(certification)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cert name */}
          <h3 className="text-base font-black text-gray-900 leading-tight mb-0.5">
            {certification.certification_name}
          </h3>
          {certification.employer_name && (
            <p className="text-xs text-gray-500 mb-3">{certification.employer_name}</p>
          )}

          {/* Main content: countdown + ring */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#9ca3af' }}>
                {type === 'overdue' ? 'Overdue by' : 'Time remaining'}
              </div>
              <div className="text-2xl font-black tabular-nums leading-none" style={{ color: theme.dayColor, fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
                {certification.expiry_date
                  ? <LiveCountdown expiryDate={certification.expiry_date} />
                  : '—'}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Expires {certification.expiry_date ? format(parseISO(certification.expiry_date), 'MMM d, yyyy') : '—'}
              </div>
            </div>
            {certification.scs_applicable && (
              <div className="flex flex-col items-center gap-1">
                <ProgressRing pct={scsPct} color={theme.border} size={68} />
                <span className="text-xs text-gray-400">SCS pts</span>
              </div>
            )}
          </div>

          {/* 3 stat pills */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Pts logged', val: scsPoints },
              { label: 'Pts to go', val: ptsToTarget },
              { label: 'Days left', val: type === 'overdue' ? 0 : (days ?? '—') },
            ].map(({ label, val }) => (
              <div key={label} className="rounded-xl py-2 px-1 text-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                <div className="text-base font-black" style={{ color: theme.dayColor }}>{val}</div>
                <div className="text-xs text-gray-400 leading-none mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Technician meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
            {certification.technician_name && (
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{certification.technician_name}</span>
            )}
            {certification.certification_number && (
              <span className="flex items-center gap-1"><Hash className="w-3 h-3" />#{certification.certification_number}</span>
            )}
            {certification.issue_date && (
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Issued {format(parseISO(certification.issue_date), 'MMM yyyy')}</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate(type === 'overdue' || type === 'urgent' ? `/renewal-checklist?cert=${certification.id}` : `/renewal-application?cert=${certification.id}`)}
              className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
              style={{ backgroundColor: theme.btnBg, color: theme.btnText }}>
              {(type === 'overdue' || type === 'urgent') && <AlertTriangle className="w-4 h-4" />}
              {type !== 'overdue' && type !== 'urgent' && <RefreshCw className="w-4 h-4" />}
              {theme.btnLabel}
            </button>
            <button
              onClick={handleDownloadSummary}
              disabled={downloadStatus === 'loading'}
              className="px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1 transition-transform active:scale-95 border-2"
              style={{ 
                borderColor: downloadStatus === 'done' ? '#3B6D11' : '#E8A020', 
                color: downloadStatus === 'done' ? '#3B6D11' : '#E8A020', 
                backgroundColor: downloadStatus === 'done' ? '#f0fdf4' : 'white' 
              }}>
              {downloadStatus === 'loading' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : downloadStatus === 'done' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {downloadStatus === 'done' ? 'Done' : 'Summary'}
            </button>
          </div>

          {/* Documents */}
          {certification.document_urls?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
              {certification.document_urls.map((url, idx) => (
                <div key={idx} className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 px-2 py-1">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-600">
                    <FileText className="w-3 h-3" />Doc {idx + 1}<ExternalLink className="w-3 h-3" />
                  </a>
                  <button onClick={() => handleShareDocument(url, idx)} className="ml-1">
                    <Share2 className="w-3 h-3 text-gray-400 hover:text-gray-700" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileText, Calendar, User, Hash, Trash2, ExternalLink, Share2, RefreshCw, ShieldCheck, Zap } from "lucide-react";
import { format, parseISO, differenceInDays, isPast } from "date-fns";
import DocumentShareDialog from "./DocumentShareDialog";
import { useNavigate } from 'react-router-dom';

const DISCIPLINE_LABELS = {
  ndt_mt: 'MT', ndt_ut: 'UT', ndt_pt: 'PT', ndt_rt: 'RT',
  ndt_et: 'ET', ndt_vt: 'VT', ndt_ut_pa: 'UT-PA', ndt_xf: 'XF', ndt_cedo: 'CEDO', other: 'Other'
};

function getStatusStyle(expiryDate) {
  const expiry = parseISO(expiryDate);
  const days = differenceInDays(expiry, new Date());
  if (isPast(expiry) || days <= 0) return { border: '#ef4444', bg: '#fef2f2', label: 'EXPIRED', labelColor: '#dc2626', days: 0, urgent: true };
  if (days <= 90) return { border: '#ef4444', bg: '#fef9f9', label: `${days} days left`, labelColor: '#dc2626', days, urgent: true };
  if (days <= 180) return { border: '#E8A020', bg: '#fffbf0', label: `${days} days left`, labelColor: '#b45309', days, urgent: false };
  return { border: '#22c55e', bg: '#f0fdf4', label: `${days} days left`, labelColor: '#16a34a', days, urgent: false };
}

export default function CertificationCard({ certification, onDelete }) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const navigate = useNavigate();
  const status = getStatusStyle(certification.expiry_date);

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
      <div
        className="rounded-2xl border-l-4 shadow-sm overflow-hidden"
        style={{ backgroundColor: status.bg, borderLeftColor: status.border, borderWidth: '1px', borderStyle: 'solid', borderLeftWidth: '4px' }}
      >
        <div className="p-4">
          {/* Top row: name + delete */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900 leading-tight flex-1">
              {certification.certification_name}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(certification)}
              className="text-gray-300 hover:text-red-500 flex-shrink-0 h-8 w-8"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Badges row: discipline · governing body · SCS */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {certification.category && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: '#5a5f38', color: '#E8A020' }}>
                {DISCIPLINE_LABELS[certification.category] || certification.category}
              </span>
            )}
            {certification.governing_body && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border"
                style={{ borderColor: certification.governing_body === 'CNSC' ? '#7c3aed' : '#2563eb', color: certification.governing_body === 'CNSC' ? '#7c3aed' : '#2563eb', backgroundColor: certification.governing_body === 'CNSC' ? '#f5f3ff' : '#eff6ff' }}>
                <ShieldCheck className="w-3 h-3" />
                {certification.governing_body}
              </span>
            )}
            {certification.scs_applicable && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                <Zap className="w-3 h-3" />
                SCS
              </span>
            )}
          </div>

          {/* Employer */}
          {certification.employer_name && (
            <p className="text-sm text-gray-500 mb-3">{certification.employer_name}</p>
          )}

          {/* Countdown — large */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-black leading-none" style={{ color: status.labelColor }}>
                {certification.expiry_date && isPast(parseISO(certification.expiry_date)) ? 'EXPIRED' : `${status.days}`}
              </div>
              {!isPast(parseISO(certification.expiry_date)) && (
                <div className="text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">days remaining</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Expires</div>
              <div className="text-sm font-semibold text-gray-700">
                {format(parseISO(certification.expiry_date), 'MMM d, yyyy')}
              </div>
            </div>
          </div>

          {/* Technician + cert number */}
          <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-600">
            {certification.technician_name && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" />
                {certification.technician_name}
              </span>
            )}
            {certification.certification_number && (
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-gray-400" />
                {certification.certification_number}
              </span>
            )}
            {certification.issue_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                Issued {format(parseISO(certification.issue_date), 'MMM yyyy')}
              </span>
            )}
          </div>

          {/* Start Renewal button */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/renewal-application?cert=${certification.id}`)}
              className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-transform"
              style={{ backgroundColor: '#5a5f38', color: '#E8A020' }}
            >
              <RefreshCw className="w-4 h-4" />
              Renewal Form
            </button>
            <button
              onClick={() => navigate(`/scs-form`)}
              className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1 active:scale-98 transition-transform border-2"
              style={{ borderColor: '#5a5f38', color: '#5a5f38', backgroundColor: 'white' }}
            >
              <FileText className="w-4 h-4" />
              SCS Form
            </button>
          </div>

          {/* Documents */}
          {certification.document_urls && certification.document_urls.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
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
            </div>
          )}
        </div>
      </div>
    </>
  );
}
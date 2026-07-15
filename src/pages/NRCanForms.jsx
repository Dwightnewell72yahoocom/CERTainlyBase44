import React from 'react';
import { Download, ExternalLink, FileText, CheckSquare, ClipboardList, ArrowLeft, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import BottomNav from '@/components/layout/BottomNav';

const NRCAN_FORMS = [
  {
    code: '8.2.1-075',
    title: 'Renewal Application Form',
    desc: 'Main renewal application for NDT certification',
    url: 'https://natural-resources.canada.ca/sites/admin/files/documents/2025-03/8.2.1-075%20-%20Renewal%20Application%20Form%20for%20Non-Destructive%20Testing%20Certification_0.pdf',
    Icon: ClipboardList
  },
  {
    code: '8.2.1-073',
    title: 'SCS Points Application Form',
    desc: 'Structured Credit System for professional development',
    url: 'https://natural-resources.canada.ca/sites/admin/files/documents/2025-03/8.2.1-073%20-%20Structured%20Credit%20System%20Application%20Form%20for%20Renewal_0.pdf',
    Icon: CheckSquare
  },
  {
    code: '8.2.1-002',
    title: 'Code of Conduct',
    desc: 'Ethical standards and professional conduct agreement',
    url: 'https://natural-resources.canada.ca/sites/admin/files/documents/2025-03/8.2.1-002%20-%20Code%20of%20Conduct_0.pdf',
    Icon: FileText
  }
];

export default function NRCanForms() {
  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f4ee' }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-3 sticky top-0 z-10 shadow-md" style={{ backgroundColor: '#6b7040' }}>
        <div className="flex items-center gap-2 mb-2">
          <Link to="/renewal-portal" className="flex items-center gap-1 text-xs font-bold" style={{ color: '#E8A020' }}>
            <ArrowLeft className="w-3 h-3" />
            Back
          </Link>
        </div>
        <h1 className="text-xl font-black" style={{ color: '#f5eed8' }}>NRCan Forms</h1>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(232,160,32,0.8)' }}>Official forms for renewal submission</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Instructions */}
        <div className="bg-white rounded-2xl border p-4" style={{ borderColor: '#d1ccc0' }}>
          <p className="text-sm font-semibold" style={{ color: '#6b7040' }}>Download & Fill Out All 3 Forms</p>
          <p className="text-xs mt-1" style={{ color: '#666' }}>
            These are the official NRCan forms. Download them, fill them out, then email with your renewal summary to NRCan NDTCB.
          </p>
        </div>

        {/* Forms List */}
        <div className="space-y-3">
          {NRCAN_FORMS.map(({ code, title, desc, url, Icon }) => (
            <div key={code} className="bg-white rounded-2xl border p-4 space-y-3" style={{ borderColor: '#d1ccc0' }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(107,112,64,0.08)' }}>
                  <Icon className="w-5 h-5" style={{ color: '#6b7040' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase" style={{ color: '#E8A020' }}>{code}</p>
                  <p className="font-black text-sm mt-0.5" style={{ color: '#1a1a1a' }}>{title}</p>
                  <p className="text-xs mt-1" style={{ color: '#666' }}>{desc}</p>
                </div>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
                style={{ backgroundColor: '#6b7040', color: '#E8A020' }}
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
            </div>
          ))}
        </div>

        {/* Submit Instructions */}
        <div className="bg-white rounded-2xl border p-4 space-y-3" style={{ borderColor: '#d1ccc0' }}>
          <p className="text-sm font-black" style={{ color: '#6b7040' }}>Next Steps:</p>
          <ol className="space-y-2">
            {[
              'Download all 3 PDF forms above',
              'Fill them out completely',
              'Download your Renewal Summary from the Renewal Portal',
              'Email all 4 documents to NRCan NDTCB'
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="w-5 h-5 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#6b7040', color: '#fff' }}>{i + 1}</span>
                <span style={{ color: '#555' }}>{step}</span>
              </li>
            ))}
          </ol>
          <a
            href="mailto:ndtrecertification-endrecertification@nrcan-rncan.gc.ca"
            className="w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 mt-2"
            style={{ backgroundColor: '#f0ede5', color: '#6b7040', border: '2px solid #6b7040' }}
          >
            Email NRCan NDTCB
          </a>
        </div>
        {/* Admin: PDF Field Mapper link */}
        <Link to="/pdf-form-mapper"
          className="bg-white rounded-2xl border p-4 flex items-center gap-3 active:scale-95 transition-transform"
          style={{ borderColor: '#E8A020' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(232,160,32,0.15)' }}>
            <MapPin className="w-5 h-5" style={{ color: '#E8A020' }} />
          </div>
          <div>
            <p className="text-sm font-black" style={{ color: '#6b7040' }}>PDF Field Mapper</p>
            <p className="text-xs" style={{ color: '#999' }}>Map data fields onto PDF templates for auto-fill</p>
          </div>
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
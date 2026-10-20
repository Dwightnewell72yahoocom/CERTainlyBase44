import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, Download } from 'lucide-react';
import BottomNav from '@/components/layout/BottomNav';
import { generateFilledPdf } from '@/lib/generateFilledPdf';

const FORM = {
  code: '8.2.1-075',
  title: 'Renewal Application Form',
  url: 'https://natural-resources.canada.ca/sites/admin/files/documents/2025-03/8.2.1-075%20-%20Renewal%20Application%20Form%20for%20Non-Destructive%20Testing%20Certification_0.pdf',
};

const SAMPLE_DATA = {
  technician_name: 'John A. Smith',
  technician_email: 'john.doe@example.com',
  nrcan_id: 'NR-1234567',
  certification_name: 'NDT - Ultrasonic Testing',
  province: 'Alberta',
  postal_code: 'T6X 0X9',
};

export default function PdfPreview() {
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const blobRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const blob = await generateFilledPdf(FORM.code, FORM.url, SAMPLE_DATA);
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        blobRef.current = url;
        setBlobUrl(url);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to generate PDF');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f4ee' }}>
      <div className="px-4 pt-10 pb-3 sticky top-0 z-10 shadow-md" style={{ backgroundColor: '#6b7040' }}>
        <h1 className="text-xl font-black" style={{ color: '#f5eed8' }}>Filled Form Preview</h1>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(232,160,32,0.8)' }}>
          {FORM.code} — {FORM.title}
        </p>
      </div>

      <div className="px-4 pt-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: '#6b7040' }} />
            <p className="text-sm font-semibold" style={{ color: '#6b7040' }}>Generating filled PDF…</p>
            <p className="text-xs text-gray-500 mt-1">Rendering NRCan form and overlaying sample data</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 rounded-2xl border border-red-200 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">Error generating PDF</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {blobUrl && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">This is the real NRCan form with sample data overlaid:</p>
              <a
                href={blobUrl}
                download={`CERTainly_${FORM.code}_sample.pdf`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ backgroundColor: '#6b7040', color: '#E8A020' }}
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            </div>
            <iframe
              src={blobUrl}
              title="Filled PDF Preview"
              className="w-full rounded-2xl border border-gray-300 bg-white"
              style={{ height: '75vh' }}
            />
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
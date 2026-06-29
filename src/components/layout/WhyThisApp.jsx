import React from 'react';
import { X, Calendar, FileText, BarChart } from 'lucide-react';

const FEATURES = [
  {
    icon: Calendar,
    title: "Track expiries",
    points: [
      "Never miss a renewal deadline",
      "Automated reminders at 180, 90, 60, 30, and 7 days",
      "See exactly how many days remain",
      "Color-coded urgency (overdue, urgent, active)"
    ],
    color: '#6b7040',
  },
  {
    icon: FileText,
    title: "Log experience",
    points: [
      "Record field work, training, seminars",
      "Track SCS points automatically",
      "Export logs for renewal applications",
      "Organized by NRCan categories"
    ],
    color: '#3B6D11',
  },
  {
    icon: BarChart,
    title: "Generate reports",
    points: [
      "Download certification summaries as PDF",
      "Pre-filled renewal application data",
      "Share documents with employers/supervisors",
      "Export experience logs for audits"
    ],
    color: '#E8A020',
  },
];

export default function WhyThisApp({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
        style={{ backgroundColor: '#f7f4ee' }}
      >
        {/* Header */}
        <div className="sticky top-0 px-6 py-4 flex items-center justify-between border-b" style={{ backgroundColor: '#f7f4ee', borderColor: '#d1ccc0' }}>
          <div>
            <h2 className="text-lg font-black" style={{ color: '#6b7040' }}>What CERTainly Does</h2>
            <p className="text-xs" style={{ color: '#999' }}>Built for Canadian NDT technicians</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" style={{ color: '#6b7040' }} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {FEATURES.map(({ icon: Icon, title, points, color }) => (
            <div key={title} className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                style={{ backgroundColor: color }}
              >
                <Icon className="w-6 h-6" style={{ color: '#f7f4ee' }} />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-sm mb-2" style={{ color: '#6b7040' }}>{title}</h3>
                <ul className="space-y-1">
                  {points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#555' }}>
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          {/* Who is this for */}
          <div className="mt-6 pt-6 border-t" style={{ borderColor: '#d1ccc0' }}>
            <h3 className="font-black text-sm mb-3 text-center" style={{ color: '#6b7040' }}>
              Who is this for?
            </h3>
            <div className="space-y-2">
              <p className="text-xs text-center" style={{ color: '#666' }}>
                NDT technicians certified by NRCan, CNSC, CGSB, or CWB.
              </p>
              <p className="text-xs text-center" style={{ color: '#666' }}>
                Free to use. Built to simplify certification management.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t" style={{ borderColor: '#d1ccc0', backgroundColor: '#faf9f7' }}>
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl font-black text-sm active:scale-95 transition-transform shadow-lg"
            style={{ backgroundColor: '#6b7040', color: '#E8A020' }}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
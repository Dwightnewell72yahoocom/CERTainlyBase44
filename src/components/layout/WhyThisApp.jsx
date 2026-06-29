import React from 'react';
import { X, Shield, Check, Zap, DollarSign } from 'lucide-react';

const REASONS = [
  {
    icon: Shield,
    title: "Paper can't chain your signature.",
    points: [
      "CGSB, NRCan, CWB only care about volume",
      "When an audit comes — how do YOU prove the work is yours?",
      "Paper forms get lost. PDFs get edited.",
      "This app cryptographically chains your signature to every inspection, timestamp, and job",
      "Ironclad. Defensible. Yours."
    ],
    color: '#6b7040',
  },
  {
    icon: Zap,
    title: "Everything else is secondary.",
    points: [
      "Expiry tracking? Calendar reminders work.",
      "SCS logs? Spreadsheets handle that.",
      "Record exports? Nice to have.",
      "Only this app gives you signature chaining.",
      "That's the only reason this app exists."
    ],
    color: '#3B6D11',
  },
  {
    icon: DollarSign,
    title: "Free for technicians. Forever.",
    points: [
      "No subscriptions. No hidden fees.",
      "You're not the customer — you're the partner.",
      "Use it daily to build your chain of proof.",
      "We monetize by showing governing bodies what certified technicians do.",
      "Your data proves your value. That's the deal."
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
            <h2 className="text-lg font-black" style={{ color: '#6b7040' }}>Why CERTainly?</h2>
            <p className="text-xs" style={{ color: '#999' }}>One reason. Everything else is noise.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" style={{ color: '#6b7040' }} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {REASONS.map(({ icon: Icon, title, points, color }) => (
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
                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: color }} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          {/* Contact CTA */}
          <div className="mt-6 pt-6 border-t" style={{ borderColor: '#d1ccc0' }}>
            <h3 className="font-black text-sm mb-3 text-center" style={{ color: '#6b7040' }}>
              Who is this for?
            </h3>
            <div className="space-y-2">
              <p className="text-xs text-center" style={{ color: '#666' }}>
                If you're an NDT technician certified by NRCan, CNSC, CGSB, or CWB, this app is for you.
              </p>
              <p className="text-xs text-center" style={{ color: '#666' }}>
                Free forever. No subscriptions. One purpose: prove your work is yours.
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
            Got It — Show Me the App
          </button>
        </div>
      </div>
    </div>
  );
}
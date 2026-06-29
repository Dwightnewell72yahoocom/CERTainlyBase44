import React, { useState } from 'react';
import { X, Clock, FileText, Shield, CheckCircle, AlertTriangle, Mail, Phone } from 'lucide-react';

const REASONS = [
  {
    icon: AlertTriangle,
    title: "NRCan doesn't remind you to renew.",
    body: "Your certification expires and you get no warnings. This app alerts you at 180, 90, 60, 30, and 7 days out — plus when you're overdue. No more 'I didn't know.'",
    color: '#A32D2D',
  },
  {
    icon: FileText,
    title: "Renewal paperwork takes 4+ hours.",
    body: "Forms, SCS math, supervisor letters. We auto-fill NRCan forms from your logged work. Download a complete renewal package in one tap — what used to take a weekend takes 5 minutes.",
    color: '#6b7040',
  },
  {
    icon: Shield,
    title: "Your employer won't do this for you.",
    body: "Employers track their paperwork, not yours. When your cert lapses, you're out of work — not them. This app puts control in your hands, not theirs.",
    color: '#BA7517',
  },
  {
    icon: CheckCircle,
    title: "Prove your status in 10 seconds.",
    body: "Site supervisor asks for proof. Open the app. Show your certification card with live expiry countdown and SCS points. No digging through emails. Get to work.",
    color: '#3B6D11',
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
            <p className="text-xs" style={{ color: '#999' }}>Because certification is your responsibility</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" style={{ color: '#6b7040' }} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {REASONS.map(({ icon: Icon, title, body, color }) => (
            <div key={title} className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                style={{ backgroundColor: color }}
              >
                <Icon className="w-6 h-6" style={{ color: '#f7f4ee' }} />
              </div>
              <div>
                <h3 className="font-black text-sm mb-1" style={{ color: '#6b7040' }}>{title}</h3>
                <p className="text-sm" style={{ color: '#555', lineHeight: 1.5 }}>{body}</p>
              </div>
            </div>
          ))}

          {/* Contact CTA */}
          <div className="mt-6 pt-6 border-t" style={{ borderColor: '#d1ccc0' }}>
            <h3 className="font-black text-sm mb-3 text-center" style={{ color: '#6b7040' }}>
              Still wondering if this is for you?
            </h3>
            <div className="space-y-2">
              <p className="text-xs text-center" style={{ color: '#666' }}>
                If you're an NDT technician certified by NRCan or CNSC, this app is for you.
              </p>
              <p className="text-xs text-center" style={{ color: '#666' }}>
                If you're not sure, skip the intro and explore — no commitment required.
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
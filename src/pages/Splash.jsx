import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight } from 'lucide-react';

export default function Splash() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const slides = [
    {
      icon: Shield,
      title: "Paper can't chain your signature.",
      subtitle: "This app can.",
      body: "CGSB, NRCan, CWB — they only care about volume. But when an audit comes, how do YOU prove the work is yours? Paper forms get lost. PDFs get edited. This app cryptographically chains your signature to every inspection, every timestamp, every job. Ironclad. Defensible. Yours.",
      color: '#6b7040',
    },
    {
      icon: Shield,
      title: "Your signature. Your proof. Period.",
      subtitle: "The only value proposition that matters.",
      body: "Everything else — expiry tracking, SCS logs, record exports — you can do with spreadsheets and calendar reminders. But only this app gives you signature chaining. Only this app proves YOUR work is YOURS. That's why it exists.",
      color: '#3B6D11',
    },
    {
      icon: Shield,
      title: "Free for technicians. Forever.",
      subtitle: "You're not the customer. You're the partner.",
      body: "No subscriptions. No hidden fees. Use it daily to build your chain of proof. We monetize by showing governing bodies what certified technicians actually do — volume, methods, sectors. Your data proves your value. That's the deal.",
      color: '#E8A020',
    },
  ];

  const CurrentIcon = slides[step].icon;

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: '#f7f4ee' }}>
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-8">
        {slides.map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-all"
            style={{ backgroundColor: i === step ? '#6b7040' : '#d1ccc0' }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
          style={{ backgroundColor: slides[step].color }}
        >
          <CurrentIcon className="w-10 h-10" style={{ color: '#f7f4ee' }} />
        </div>

        <h1 className="text-2xl font-black mb-2" style={{ color: '#6b7040' }}>
          {slides[step].title}
        </h1>
        <p className="text-sm font-semibold mb-4" style={{ color: '#BA7517' }}>
          {slides[step].subtitle}
        </p>
        <p className="text-base" style={{ color: '#555', lineHeight: 1.6 }}>
          {slides[step].body}
        </p>
      </div>

      {/* Bottom: Navigation */}
      <div className="px-6 pb-12 space-y-3">
        {step < slides.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
            style={{ backgroundColor: '#6b7040', color: '#E8A020' }}
          >
            {step === slides.length - 2 ? "Let's Go" : "Next"}
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 rounded-2xl font-black text-sm active:scale-95 transition-transform shadow-lg"
            style={{ backgroundColor: '#E8A020', color: '#6b7040' }}
          >
            Open My Dashboard
          </button>
        )}

        {step < slides.length - 1 && (
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 text-sm font-semibold"
            style={{ color: '#999' }}
          >
            Skip intro
          </button>
        )}

        <p className="text-xs text-center" style={{ color: '#ccc' }}>
          A Sound Solutions product
        </p>
      </div>
    </div>
  );
}
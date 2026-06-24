import React, { useState } from 'react';
import { CheckCircle, Circle, ExternalLink, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";

const CHECKLIST = [
  {
    step: 1,
    title: 'Confirm Eligibility',
    description: 'Your certification must be renewed within the 5-year period. If expired, a late fee applies. Renewal window closes 1 year after expiry.',
    items: [
      'Certification not expired more than 1 year',
      'You have worked in the NDT method during the period',
      'Reg# and personal details are current with NRCan',
    ]
  },
  {
    step: 2,
    title: 'Log SCS Points (100 pts minimum)',
    description: 'You need 100 Systematic Continuing Supplementary (SCS) points. Minimum 50 must come from Part A (Tabs 1–4).',
    items: [
      'Tab 1 – Field Work: 1 pt per 40 hrs (max 40 pts)',
      'Tab 2 – Training Received: 1 pt per hour (max 20 pts)',
      'Tab 3 – Training Delivered: 2 pts per hour (max 20 pts)',
      'Tab 4 – Research: 5 pts per project (max 20 pts)',
      'Tab 5 – Seminars: 1 pt attended / 3 pts presented',
      'Tab 6 – Professional: 2 pts per membership/year',
      'Tab 7 – Mentoring: 1 pt per 10 hrs',
    ],
    link: { label: 'Log SCS Points', path: '/experience-log' }
  },
  {
    step: 3,
    title: 'Complete Form 8.2.1-075 (Renewal Application)',
    description: 'The main NRCan renewal application form. Must include all employment history in the NDT method.',
    items: [
      'Full name and NRCan/CGSB reg number',
      'NDT method and level being renewed',
      'All employers over the 5-year period',
      'Applicant signature and date',
    ],
    link: { label: 'Go to NRCan Renewal Portal', url: 'https://natural-resources.canada.ca/science-data/science-research/renewing-your-ndt-certification' }
  },
  {
    step: 4,
    title: 'Complete Form 8.2.1-073 (SCS Application)',
    description: 'Attach your full SCS points log. One form per NDT method being renewed.',
    items: [
      'Fill in points for each of the 7 tabs',
      'Minimum 50 Part A points confirmed',
      'Total 100 points confirmed',
      'Applicant signature',
    ]
  },
  {
    step: 5,
    title: 'Sign Code of Conduct (8.2.1-002)',
    description: 'Required with every renewal. Confirms you will comply with NRCan NDTCB certification requirements.',
    items: [
      'Read and understand all clauses',
      'Applicant signature and date',
    ]
  },
  {
    step: 6,
    title: 'Collect Employer / Supervisor Signatures',
    description: 'Your renewal package requires signatures from your employer, supervisor, and a referee confirming your experience.',
    items: [
      'Employer signature on Record of Experience',
      'Supervisor signature confirming NDT activities',
      'Referee signature (can be same person if qualified)',
      'All signatories must hold valid NRCan certification',
    ],
    link: { label: 'Generate Attestation Letter', path: '/attestation-letter' }
  },
  {
    step: 7,
    title: 'Vision Test Certificate',
    description: 'Required at renewal if your existing vision test is more than 5 years old.',
    items: [
      'Near vision: Jaeger No. 2 at 30 cm or equivalent',
      'Colour vision: Ishihara or equivalent test',
      'Signed by qualified optometrist or physician',
    ]
  },
  {
    step: 8,
    title: 'Submit Package to NRCan',
    description: 'Email the complete signed package to NRCan NDTCB. Payment is made after application is approved.',
    items: [
      'Compile all signed forms into one PDF',
      'Email to: ndtrecertification-endrecertification@nrcan-rncan.gc.ca',
      'Wait for NRCan invoice (standard ~$85–$100)',
      'Pay via NRCan secure link to Receiver General for Canada',
    ],
    link: { label: 'Open NRCan Renewal Page', url: 'https://natural-resources.canada.ca/science-data/science-research/renewing-your-ndt-certification' }
  }
];

export default function RenewalChecklist() {
  const [checked, setChecked] = useState({});
  const [expanded, setExpanded] = useState({ 0: true });

  const toggle = (id) => setChecked(s => ({ ...s, [id]: !s[id] }));
  const toggleExpand = (i) => setExpanded(s => ({ ...s, [i]: !s[i] }));

  const allItems = CHECKLIST.flatMap((s, si) => s.items.map((_, ii) => `${si}-${ii}`));
  const completedCount = allItems.filter(k => checked[k]).length;
  const pct = Math.round((completedCount / allItems.length) * 100);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f4ee' }}>
      <div className="px-4 pt-10 pb-4 sticky top-0 z-10" style={{ backgroundColor: '#5a5f38' }}>
        <h1 className="text-xl font-black" style={{ color: '#F5EDD6' }}>Renewal Checklist</h1>
        <p className="text-sm" style={{ color: 'rgba(232,160,32,0.8)' }}>Step-by-step NRCan submission guide</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Progress */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: '#5a5f38' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold" style={{ color: '#E8A020' }}>Overall Progress</span>
            <span className="text-2xl font-black" style={{ color: pct === 100 ? '#4ade80' : '#E8A020' }}>{pct}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#4ade80' : '#E8A020' }} />
          </div>
          <p className="text-xs mt-2" style={{ color: 'rgba(245,237,214,0.6)' }}>
            {completedCount} of {allItems.length} items completed
          </p>
        </div>

        {/* Steps */}
        {CHECKLIST.map((section, si) => {
          const sectionItems = section.items.map((_, ii) => `${si}-${ii}`);
          const sectionDone = sectionItems.filter(k => checked[k]).length;
          const allDone = sectionDone === sectionItems.length;
          const isExpanded = expanded[si];

          return (
            <div key={si} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <button
                onClick={() => toggleExpand(si)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm"
                  style={{ backgroundColor: allDone ? '#dcfce7' : 'rgba(90,95,56,0.1)', color: allDone ? '#16a34a' : '#5a5f38' }}>
                  {allDone ? '✓' : section.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-sm">{section.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{sectionDone}/{sectionItems.length} items</div>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                  <p className="text-sm text-gray-600">{section.description}</p>
                  <div className="space-y-2">
                    {section.items.map((item, ii) => {
                      const key = `${si}-${ii}`;
                      return (
                        <button
                          key={ii}
                          onClick={() => toggle(key)}
                          className="w-full flex items-start gap-3 text-left"
                        >
                          {checked[key]
                            ? <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} />
                            : <Circle className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-300" />
                          }
                          <span className={`text-sm ${checked[key] ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item}</span>
                        </button>
                      );
                    })}
                  </div>
                  {section.link && (
                    section.link.path ? (
                      <a href={section.link.path}
                        className="flex items-center gap-2 text-sm font-bold mt-2"
                        style={{ color: '#E8A020' }}>
                        <ExternalLink className="w-3.5 h-3.5" />
                        {section.link.label}
                      </a>
                    ) : (
                      <a href={section.link.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-bold mt-2"
                        style={{ color: '#E8A020' }}>
                        <ExternalLink className="w-3.5 h-3.5" />
                        {section.link.label}
                      </a>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* NRCan contact */}
        <div className="rounded-2xl p-4 border-l-4" style={{ backgroundColor: 'rgba(90,95,56,0.06)', borderLeftColor: '#5a5f38' }}>
          <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">NRCan NDTCB Contact</div>
          <div className="text-sm text-gray-700">ndtrecertification-endrecertification@nrcan-rncan.gc.ca</div>
          <div className="text-sm text-gray-700">1-866-858-0473</div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
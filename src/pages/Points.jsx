import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { computeTotals, TAB_CONFIG, TOTAL_TARGET, CORE_TABS_TARGET } from "@/lib/points";
import PointsSummary from "@/components/experience/PointsSummary";
import BottomNav from "@/components/layout/BottomNav";
import { FileText, ShieldAlert } from "lucide-react";

export default function Points() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['experience_logs'],
    queryFn: () => base44.entities.ExperienceLog.list('-created_date'),
  });

  const { data: certifications = [] } = useQuery({
    queryKey: ['certifications'],
    queryFn: () => base44.entities.Certification.list(),
  });

  // Determine if user has any NRCan (SCS-applicable) certifications
  const hasNRCanCerts = certifications.some(c => c.governing_body === 'NRCan' || c.scs_applicable === true || !c.governing_body);
  const onlyCEDO = certifications.length > 0 && !hasNRCanCerts;

  const totals = computeTotals(logs);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f4ee' }}>
      <div className="px-4 pt-10 pb-4 sticky top-0 z-10" style={{ backgroundColor: '#5a5f38' }}>
        <h1 className="text-xl font-black" style={{ color: '#F5EDD6' }}>
          <span style={{ color: '#E8A020' }}>SCS</span> Points Calculator
        </h1>
        <p className="text-sm" style={{ color: 'rgba(232,160,32,0.8)' }}>NRCan CAN/CGSB-48.9712-2022</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-transparent" style={{ borderColor: '#5a5f38', borderTopColor: 'transparent' }} />
          </div>
        ) : onlyCEDO ? (
          <div className="bg-white rounded-2xl border-l-4 border-amber-500 p-5 mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span className="font-black text-gray-900">CNSC Certification Detected</span>
            </div>
            <p className="text-sm text-gray-700">
              Your certification is governed by the <strong>Canadian Nuclear Safety Commission (CNSC)</strong>, not NRCan.
            </p>
            <p className="text-sm text-gray-600">
              CEDO (Certified Exposure Device Operator) certifications are renewed under CNSC requirements — the NRCan SCS point system does not apply.
            </p>
            <a href="https://nuclearsafety.gc.ca" target="_blank" rel="noopener noreferrer"
              className="inline-block text-sm font-semibold underline mt-1" style={{ color: '#5a5f38' }}>
              Visit CNSC Website →
            </a>
          </div>
        ) : (
          <>
            <PointsSummary totals={totals} />

            {/* Generate SCS Form CTA */}
            <a href="/scs-form"
              className="flex items-center justify-between p-4 rounded-2xl border-2 font-bold text-sm"
              style={{ backgroundColor: '#5a5f38', borderColor: '#5a5f38', color: '#E8A020' }}>
              <div>
                <div className="font-black">Generate SCS Form 8.2.1-073</div>
                <div className="text-xs font-normal mt-0.5" style={{ color: 'rgba(245,237,214,0.6)' }}>Auto-populated from your logged entries</div>
              </div>
              <FileText className="w-5 h-5 flex-shrink-0" />
            </a>

            {/* Per-tab detail cards */}
            <div className="space-y-3">
              {Object.entries(TAB_CONFIG).map(([key, cfg], i) => {
                const pts = totals.byType[key] || 0;
                const pct = Math.min(100, Math.round((pts / cfg.maxPoints) * 100));
                const met = pts >= cfg.maxPoints;
                return (
                  <div key={key} className="bg-white rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full mr-2"
                          style={{ backgroundColor: 'rgba(90,95,56,0.1)', color: '#5a5f38' }}>
                          Tab {i + 1}
                        </span>
                        <span className="font-bold text-gray-900">{cfg.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black" style={{ color: met ? '#16a34a' : '#E8A020' }}>{pts}</span>
                        <span className="text-xs text-gray-400">/{cfg.maxPoints}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{cfg.description} · <span className="font-medium" style={{ color: '#5a5f38' }}>{cfg.pointsRule}</span></p>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#f0ede6' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: met ? '#22c55e' : '#E8A020' }} />
                    </div>
                    {!met && (
                      <p className="text-xs mt-1.5" style={{ color: 'rgba(90,95,56,0.6)' }}>
                        {cfg.maxPoints - pts} more points available in this category
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
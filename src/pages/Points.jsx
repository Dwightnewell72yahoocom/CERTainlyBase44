import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { computeTotals, TAB_CONFIG, TOTAL_TARGET, PART_A_TARGET } from "@/lib/points";
import BottomNav from "@/components/layout/BottomNav";
import { FileText, ShieldAlert, CheckCircle2, CircleDashed, Briefcase, BookOpen, Monitor, FlaskConical, Mic2, Award, Users } from "lucide-react";

const TAB_ICONS = {
  field_work: Briefcase,
  training_received: BookOpen,
  training_delivered: Monitor,
  research: FlaskConical,
  seminars: Mic2,
  professional: Award,
  mentoring: Users,
};

const PART_A_KEYS = ['field_work', 'training_received', 'training_delivered', 'research'];
const PART_B_KEYS = ['seminars', 'professional', 'mentoring'];

export default function Points() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['experience_logs'],
    queryFn: () => base44.entities.ExperienceLog.list('-created_date'),
  });

  const { data: certifications = [] } = useQuery({
    queryKey: ['certifications'],
    queryFn: () => base44.entities.Certification.list(),
  });

  const hasNRCanCerts = certifications.some(c => c.governing_body === 'NRCan' || c.scs_applicable === true || !c.governing_body);
  const onlyCEDO = certifications.length > 0 && !hasNRCanCerts;
  const totals = computeTotals(logs);

  const partATotal = PART_A_KEYS.reduce((s, k) => s + (totals.byType[k] || 0), 0);
  const partBTotal = PART_B_KEYS.reduce((s, k) => s + (totals.byType[k] || 0), 0);
  const grandTotal = totals.total;
  const partAMet = partATotal >= PART_A_TARGET;
  const totalMet = grandTotal >= TOTAL_TARGET;

  const CategoryCard = ({ tabKey, index }) => {
    const cfg = TAB_CONFIG[tabKey];
    const Icon = TAB_ICONS[tabKey];
    const pts = totals.byType[tabKey] || 0;
    const pct = Math.min(100, Math.round((pts / cfg.maxPoints) * 100));
    const met = pts >= cfg.maxPoints;
    return (
      <div className="bg-white rounded-2xl border p-4 shadow-sm" style={{ borderColor: '#e5e7eb' }}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: met ? '#f0fdf4' : 'rgba(107,112,64,0.08)' }}>
              <Icon className="w-4 h-4" style={{ color: met ? '#16a34a' : '#6b7040' }} />
            </div>
            <div>
              <div className="font-black text-gray-900 text-sm leading-tight">{cfg.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{cfg.partA ? 'Part A — Core' : 'Part B — Other'}</div>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            <div className="text-2xl font-black leading-none" style={{ color: met ? '#16a34a' : '#E8A020' }}>{pts}</div>
            <div className="text-xs text-gray-400">/ {cfg.maxPoints}</div>
          </div>
        </div>

        <div className="h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: '#f0ede6' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: met ? '#22c55e' : '#E8A020' }} />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">{cfg.pointsRule}</p>
          {met
            ? <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#16a34a' }}><CheckCircle2 className="w-3 h-3" />Max reached</span>
            : <span className="text-xs font-semibold" style={{ color: 'rgba(107,112,64,0.6)' }}>+{cfg.maxPoints - pts} available</span>
          }
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f4ee', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-3 sticky top-0 z-10 shadow-md" style={{ backgroundColor: '#6b7040' }}>
        <h1 className="text-xl font-black" style={{ color: '#f5eed8' }}>
          <span style={{ color: '#E8A020' }}>SCS</span> Points Calculator
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(232,160,32,0.8)' }}>NRCan CAN/CGSB-48.9712-2022</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-transparent" style={{ borderColor: '#6b7040', borderTopColor: 'transparent' }} />
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
              CEDO certifications are renewed under CNSC requirements — the NRCan SCS point system does not apply.
            </p>
            <a href="https://nuclearsafety.gc.ca" target="_blank" rel="noopener noreferrer"
              className="inline-block text-sm font-semibold underline mt-1" style={{ color: '#6b7040' }}>
              Visit CNSC Website →
            </a>
          </div>
        ) : (
          <>
            {/* Summary scorecard */}
            <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: '#6b7040' }}>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Part A (Core)', value: partATotal, target: PART_A_TARGET, met: partAMet },
                  { label: 'Part B (Other)', value: partBTotal, target: TOTAL_TARGET - PART_A_TARGET, met: partBTotal >= (TOTAL_TARGET - PART_A_TARGET) },
                  { label: 'Grand Total', value: grandTotal, target: TOTAL_TARGET, met: totalMet },
                ].map(({ label, value, target, met }) => (
                  <div key={label} className="rounded-xl p-3 text-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <div className="text-2xl font-black" style={{ color: met ? '#4ade80' : '#E8A020' }}>{value}</div>
                    <div className="text-xs mt-0.5 leading-tight" style={{ color: 'rgba(245,238,216,0.6)' }}>{label}</div>
                    <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((value / target) * 100))}%`, backgroundColor: met ? '#4ade80' : '#E8A020' }} />
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'rgba(245,238,216,0.4)' }}>/ {target} min</div>
                  </div>
                ))}
              </div>

              {/* Requirement badges */}
              <div className="flex gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: partAMet ? 'rgba(74,222,128,0.15)' : 'rgba(232,160,32,0.12)', color: partAMet ? '#4ade80' : '#E8A020' }}>
                  {partAMet ? <CheckCircle2 className="w-3.5 h-3.5" /> : <CircleDashed className="w-3.5 h-3.5" />}
                  Part A min {PART_A_TARGET}pts {partAMet ? '✓' : `(need ${PART_A_TARGET - partATotal} more)`}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: totalMet ? 'rgba(74,222,128,0.15)' : 'rgba(232,160,32,0.12)', color: totalMet ? '#4ade80' : '#E8A020' }}>
                  {totalMet ? <CheckCircle2 className="w-3.5 h-3.5" /> : <CircleDashed className="w-3.5 h-3.5" />}
                  Total {TOTAL_TARGET}pts {totalMet ? '✓' : `(need ${TOTAL_TARGET - grandTotal} more)`}
                </div>
              </div>
            </div>

            {/* Generate SCS Form CTA */}
            <a href="/scs-form"
              className="flex items-center justify-between p-4 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
              style={{ backgroundColor: '#6b7040', color: '#E8A020' }}>
              <div>
                <div className="font-black">Generate SCS Form 8.2.1-073</div>
                <div className="text-xs font-normal mt-0.5" style={{ color: 'rgba(245,237,214,0.6)' }}>Auto-populated from your logged entries</div>
              </div>
              <FileText className="w-5 h-5 flex-shrink-0" />
            </a>

            {/* Part A section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1" style={{ backgroundColor: '#d1ccc0' }} />
                <span className="text-xs font-black uppercase tracking-wider px-2" style={{ color: '#6b7040' }}>Part A — Core Activities</span>
                <div className="h-px flex-1" style={{ backgroundColor: '#d1ccc0' }} />
              </div>
              <div className="space-y-3">
                {PART_A_KEYS.map((key, i) => <CategoryCard key={key} tabKey={key} index={i + 1} />)}
              </div>
            </div>

            {/* Part B section */}
            <div>
              <div className="flex items-center gap-2 mb-3 mt-2">
                <div className="h-px flex-1" style={{ backgroundColor: '#d1ccc0' }} />
                <span className="text-xs font-black uppercase tracking-wider px-2" style={{ color: '#6b7040' }}>Part B — Other Activities</span>
                <div className="h-px flex-1" style={{ backgroundColor: '#d1ccc0' }} />
              </div>
              <div className="space-y-3">
                {PART_B_KEYS.map((key, i) => <CategoryCard key={key} tabKey={key} index={PART_A_KEYS.length + i + 1} />)}
              </div>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
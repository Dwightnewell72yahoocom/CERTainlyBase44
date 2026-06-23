import React from 'react';
import { TOTAL_TARGET, CORE_TABS_TARGET, TAB_CONFIG } from '@/lib/points';

export default function PointsSummary({ totals }) {
  const { total, coreTabs, byType } = totals;
  const totalPct = Math.min(100, Math.round((total / TOTAL_TARGET) * 100));
  const corePct = Math.min(100, Math.round((coreTabs / CORE_TABS_TARGET) * 100));
  const totalMet = total >= TOTAL_TARGET;
  const coreMet = coreTabs >= CORE_TABS_TARGET;

  return (
    <div className="rounded-2xl p-4 space-y-4" style={{ backgroundColor: '#5a5f38' }}>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base" style={{ color: '#E8A020' }}>SCS Points</h3>
        <span className="text-xs font-semibold px-2 py-1 rounded-full"
          style={{ backgroundColor: totalMet ? '#22c55e22' : 'rgba(232,160,32,0.15)', color: totalMet ? '#4ade80' : '#E8A020' }}>
          {totalMet ? '✓ Requirements Met' : `${TOTAL_TARGET - total} pts to go`}
        </span>
      </div>

      {/* Main totals */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Part A (Core)', value: coreTabs, target: CORE_TABS_TARGET, met: coreMet },
          { label: 'Part B (Other)', value: Math.max(0, total - coreTabs), target: TOTAL_TARGET - CORE_TABS_TARGET, met: (total - coreTabs) >= (TOTAL_TARGET - CORE_TABS_TARGET) },
          { label: 'Total', value: total, target: TOTAL_TARGET, met: totalMet },
        ].map(({ label, value, target, met }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <div className="text-xl font-black" style={{ color: met ? '#4ade80' : '#E8A020' }}>
              {value}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(245,237,214,0.6)' }}>{label}</div>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((value / target) * 100))}%`, backgroundColor: met ? '#4ade80' : '#E8A020' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Per-tab breakdown */}
      <div className="grid grid-cols-7 gap-1">
        {Object.entries(TAB_CONFIG).map(([key, cfg], i) => {
          const pts = byType[key] || 0;
          const pct = Math.min(100, Math.round((pts / cfg.maxPoints) * 100));
          const met = pts >= cfg.maxPoints;
          return (
            <div key={key} className="text-center">
              <div className="text-xs font-bold" style={{ color: met ? '#4ade80' : '#E8A020' }}>{pts}</div>
              <div className="text-xs" style={{ color: 'rgba(245,237,214,0.4)' }}>{i + 1}</div>
              <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: met ? '#4ade80' : '#E8A020' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Gap analysis */}
      {!totalMet && (
        <div className="rounded-xl p-3 space-y-1.5" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <div className="text-xs font-semibold mb-2" style={{ color: 'rgba(245,237,214,0.7)' }}>Gap Analysis</div>
          {Object.entries(TAB_CONFIG).map(([key, cfg]) => {
            const pts = byType[key] || 0;
            const remaining = cfg.maxPoints - pts;
            if (remaining <= 0) return null;
            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'rgba(245,237,214,0.6)' }}>{cfg.label}</span>
                <span className="text-xs font-semibold" style={{ color: '#E8A020' }}>+{remaining} available</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
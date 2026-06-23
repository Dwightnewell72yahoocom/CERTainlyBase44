import React from 'react';
import { TOTAL_TARGET, CORE_TABS_TARGET, TAB_CONFIG } from '@/lib/points';

export default function PointsSummary({ totals }) {
  const { total, coreTabs, byType } = totals;
  const totalPct = Math.min(100, Math.round((total / TOTAL_TARGET) * 100));
  const corePct = Math.min(100, Math.round((coreTabs / CORE_TABS_TARGET) * 100));

  return (
    <div className="bg-white rounded-2xl shadow p-4 space-y-4">
      <h3 className="font-semibold text-gray-800 text-base">Points Summary</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl p-3 ${total >= TOTAL_TARGET ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="text-2xl font-bold text-gray-900">{total}<span className="text-sm font-normal text-gray-500">/{TOTAL_TARGET}</span></div>
          <div className="text-xs text-gray-600 mt-0.5">Total Points</div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${total >= TOTAL_TARGET ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${totalPct}%` }} />
          </div>
        </div>
        <div className={`rounded-xl p-3 ${coreTabs >= CORE_TABS_TARGET ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
          <div className="text-2xl font-bold text-gray-900">{coreTabs}<span className="text-sm font-normal text-gray-500">/{CORE_TABS_TARGET}</span></div>
          <div className="text-xs text-gray-600 mt-0.5">Core (Tabs 1–4)</div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${coreTabs >= CORE_TABS_TARGET ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${corePct}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {Object.entries(TAB_CONFIG).map(([key, cfg], i) => {
          const pts = byType[key] || 0;
          const pct = Math.min(100, Math.round((pts / cfg.maxPoints) * 100));
          return (
            <div key={key} className="text-center">
              <div className="text-sm font-bold text-gray-900">{pts}</div>
              <div className="text-xs text-gray-500 leading-tight">{i + 1}</div>
              <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
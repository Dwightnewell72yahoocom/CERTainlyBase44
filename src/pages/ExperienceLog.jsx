import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { TAB_CONFIG, computeTotals } from "@/lib/points";
import PointsSummary from "@/components/experience/PointsSummary";
import AddLogEntrySheet from "@/components/experience/AddLogEntrySheet";
import LogEntryCard from "@/components/experience/LogEntryCard";
import BottomNav from "@/components/layout/BottomNav";

const TABS = Object.entries(TAB_CONFIG).map(([key, cfg], i) => ({ key, ...cfg, num: i + 1 }));

export default function ExperienceLog() {
  const [activeTab, setActiveTab] = useState('field_work');
  const [techName, setTechName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const qc = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['experience_logs'],
    queryFn: () => base44.entities.ExperienceLog.list('-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ExperienceLog.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['experience_logs'] }); toast.success('Entry removed'); },
  });

  const activeLogs = logs.filter(l => l.log_type === activeTab);
  const totals = computeTotals(logs);
  const activeConfig = TAB_CONFIG[activeTab];

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f4ee' }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-4 sticky top-0 z-10" style={{ backgroundColor: '#5a5f38' }}>
        <h1 className="text-xl font-bold" style={{ color: '#F5EDD6' }}>Experience & Training Log</h1>
        <p className="text-sm" style={{ color: 'rgba(232,160,32,0.8)' }}>NRCan CAN/CGSB-48.9712-2022</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Points Summary */}
        <PointsSummary totals={totals} />

        {/* Technician Name Input (if not set) */}
        {!techName && (
          <div className="rounded-xl p-3 border" style={{ backgroundColor: 'rgba(90,95,56,0.08)', borderColor: 'rgba(232,160,32,0.3)' }}>
            <p className="text-sm font-medium mb-2" style={{ color: '#5a5f38' }}>Enter your name to log entries</p>
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                style={{ borderColor: 'rgba(90,95,56,0.3)' }}
                placeholder="Your name..."
                onKeyDown={e => e.key === 'Enter' && setTechName(e.target.value)}
                onBlur={e => e.target.value && setTechName(e.target.value)}
              />
              <Button size="sm" className="font-bold" style={{ backgroundColor: '#E8A020', color: '#5a5f38' }}
                onClick={(e) => setTechName(e.currentTarget.previousElementSibling.value)}>Set</Button>
            </div>
          </div>
        )}

        {/* Tab Selector — horizontal scroll */}
        <div className="overflow-x-auto -mx-4 px-4 bg-white shadow-sm border-b border-gray-100">
          <div className="flex min-w-max">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex flex-col items-center px-4 py-2.5 whitespace-nowrap transition-all relative"
                style={{
                  color: activeTab === tab.key ? '#E8A020' : '#5a5f38',
                  fontWeight: activeTab === tab.key ? 700 : 500,
                  fontSize: '0.875rem',
                }}
              >
                <span>{tab.num}. {tab.label}</span>
                <span className="text-xs mt-0.5" style={{ color: activeTab === tab.key ? '#E8A020' : 'rgba(90,95,56,0.5)' }}>
                  {totals.byType[tab.key] || 0}pts
                </span>
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ backgroundColor: '#E8A020' }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Active Tab Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">{activeConfig.label}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{activeConfig.description}</p>
              <p className="text-xs mt-0.5 font-medium" style={{ color: '#5a5f38' }}>{activeConfig.pointsRule}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black" style={{ color: '#E8A020' }}>{totals.byType[activeTab] || 0}</div>
              <div className="text-xs text-gray-400">/ {activeConfig.maxPoints} max</div>
            </div>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={() => setShowAdd(true)}
          disabled={!techName}
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 active:scale-98 transition-transform"
          style={{ backgroundColor: '#5a5f38', color: '#E8A020' }}
        >
          <Plus className="w-5 h-5" />
          Add {activeConfig.label} Entry
        </button>

        {/* Entries List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-transparent" style={{ borderColor: '#5a5f38', borderTopColor: 'transparent' }} />
          </div>
        ) : activeLogs.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'rgba(90,95,56,0.4)' }}>
            <p className="text-sm">No entries yet for {activeConfig.label}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeLogs.map(log => (
              <LogEntryCard key={log.id} entry={log} onDelete={(id) => deleteMutation.mutate(id)} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
      <AddLogEntrySheet
        open={showAdd}
        onOpenChange={setShowAdd}
        logType={activeTab}
        technicianName={techName}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['experience_logs'] })}
      />
    </div>
  );
}
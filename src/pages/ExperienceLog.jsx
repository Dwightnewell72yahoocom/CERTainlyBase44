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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 pt-10 pb-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold">Experience & Training Log</h1>
        <p className="text-blue-200 text-sm">NRCan CAN/CGSB-48.9712-2022</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Points Summary */}
        <PointsSummary totals={totals} />

        {/* Technician Name Input (if not set) */}
        {!techName && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-sm text-amber-800 mb-2 font-medium">Enter your name to log entries</p>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-amber-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Your name..."
                onKeyDown={e => e.key === 'Enter' && setTechName(e.target.value)}
                onBlur={e => e.target.value && setTechName(e.target.value)}
              />
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={(e) => setTechName(e.currentTarget.previousElementSibling.value)}>Set</Button>
            </div>
          </div>
        )}

        {/* Tab Selector — horizontal scroll */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 pb-1 min-w-max">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                <span className="opacity-60">{tab.num}.</span> {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-blue-500 text-blue-100' : 'bg-gray-100 text-gray-500'}`}>
                  {totals.byType[tab.key] || 0}pts
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Tab Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">{activeConfig.label}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{activeConfig.description} · {activeConfig.pointsRule}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{totals.byType[activeTab] || 0}</div>
              <div className="text-xs text-gray-400">/ {activeConfig.maxPoints} pts max</div>
            </div>
          </div>
        </div>

        {/* Add Button */}
        <Button
          onClick={() => setShowAdd(true)}
          disabled={!techName}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add {activeConfig.label} Entry
        </Button>

        {/* Entries List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : activeLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
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
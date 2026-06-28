import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Briefcase, BookOpen, Monitor, FlaskConical, Mic2, Award, Users } from "lucide-react";
import { toast } from "sonner";
import { TAB_CONFIG, computeTotals, TOTAL_TARGET, PART_A_TARGET } from "@/lib/points";
import AddLogEntrySheet from "@/components/experience/AddLogEntrySheet";
import LogEntryCard from "@/components/experience/LogEntryCard";
import BottomNav from "@/components/layout/BottomNav";

const TAB_ICONS = {
  field_work: Briefcase,
  training_received: BookOpen,
  training_delivered: Monitor,
  research: FlaskConical,
  seminars: Mic2,
  professional: Award,
  mentoring: Users,
};

const TAB_SHORT = {
  field_work: 'Field Work',
  training_received: 'Training Rec.',
  training_delivered: 'Delivering',
  research: 'Research',
  seminars: 'Seminars',
  professional: 'Professional',
  mentoring: 'Mentoring',
};

const TABS = Object.entries(TAB_CONFIG).map(([key, cfg]) => ({ key, ...cfg }));

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
  const partATotal = totals.partA || 0;
  const partBTotal = Math.max(0, totals.total - partATotal);
  const partAPct = Math.min(100, Math.round((partATotal / PART_A_TARGET) * 100));
  const totalPct = Math.min(100, Math.round((totals.total / TOTAL_TARGET) * 100));

  const previewPoints = 0; // shown in add sheet

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f4ee', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-3 sticky top-0 z-20 shadow-md" style={{ backgroundColor: '#6b7040' }}>
        <h1 className="text-xl font-black" style={{ color: '#f5eed8' }}>Experience & Training Log</h1>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(232,160,32,0.8)' }}>NRCan CAN/CGSB-48.9712-2022</p>
      </div>

      {/* Points bar — Part A / Part B / Total */}
      <div className="px-4 pt-4 pb-2">
        <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: '#6b7040' }}>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Part A (Core)', value: partATotal, target: PART_A_TARGET, pct: partAPct },
              { label: 'Part B (Other)', value: partBTotal, target: TOTAL_TARGET - PART_A_TARGET, pct: Math.min(100, Math.round((partBTotal / (TOTAL_TARGET - PART_A_TARGET)) * 100)) },
              { label: 'Total SCS', value: totals.total, target: TOTAL_TARGET, pct: totalPct },
            ].map(({ label, value, target, pct }) => {
              const met = value >= target;
              return (
                <div key={label} className="rounded-xl p-2.5" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <div className="text-xl font-black" style={{ color: met ? '#4ade80' : '#E8A020' }}>{value}</div>
                  <div className="text-xs mt-0.5 leading-tight" style={{ color: 'rgba(245,238,216,0.6)' }}>{label}</div>
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: met ? '#4ade80' : '#E8A020' }} />
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(245,238,216,0.4)' }}>/ {target} min</div>
                </div>
              );
            })}
          </div>
          {/* Part A min note */}
          <div className="text-center text-xs" style={{ color: 'rgba(245,238,216,0.5)' }}>
            Part A minimum: <span style={{ color: partATotal >= PART_A_TARGET ? '#4ade80' : '#E8A020', fontWeight: 700 }}>{partATotal}/{PART_A_TARGET} pts</span>
            &nbsp;·&nbsp;Total target: <span style={{ color: totals.total >= TOTAL_TARGET ? '#4ade80' : '#E8A020', fontWeight: 700 }}>{totals.total}/{TOTAL_TARGET} pts</span>
          </div>
        </div>
      </div>

      {/* Technician name prompt */}
      {!techName && (
        <div className="px-4 pb-2">
          <div className="rounded-xl p-3 border" style={{ backgroundColor: 'rgba(107,112,64,0.08)', borderColor: 'rgba(232,160,32,0.3)' }}>
            <p className="text-sm font-medium mb-2" style={{ color: '#6b7040' }}>Enter your name to log entries</p>
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'rgba(107,112,64,0.3)' }}
                placeholder="Your name..."
                onKeyDown={e => e.key === 'Enter' && setTechName(e.target.value)}
                onBlur={e => e.target.value && setTechName(e.target.value)}
              />
              <button className="px-4 py-2 rounded-lg font-bold text-sm" style={{ backgroundColor: '#E8A020', color: '#6b7040' }}
                onClick={e => setTechName(e.currentTarget.previousElementSibling.value)}>Set</button>
            </div>
          </div>
        </div>
      )}

      {/* 7-tab strip — horizontally scrollable */}
      <div className="sticky top-[72px] z-10 bg-white border-b border-gray-100 shadow-sm overflow-x-auto">
        <div className="flex min-w-max">
          {TABS.map(tab => {
            const Icon = TAB_ICONS[tab.key];
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex flex-col items-center px-4 py-2.5 whitespace-nowrap relative transition-colors"
                style={{ color: active ? '#6b7040' : '#9ca3af', minWidth: 72 }}>
                <Icon className="w-4 h-4 mb-0.5" style={{ color: active ? '#6b7040' : '#9ca3af' }} />
                <span className="text-xs font-semibold">{TAB_SHORT[tab.key]}</span>
                <span className="text-xs mt-0.5" style={{ color: active ? '#E8A020' : 'rgba(156,163,175,0.7)', fontWeight: active ? 700 : 500 }}>
                  {totals.byType[tab.key] || 0}pts
                </span>
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ backgroundColor: '#E8A020' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Active tab info card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="font-black text-gray-900">{activeConfig.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{activeConfig.description}</div>
            <div className="text-xs mt-1 font-semibold" style={{ color: '#6b7040' }}>{activeConfig.pointsRule}</div>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <div className="text-3xl font-black" style={{ color: '#E8A020' }}>{totals.byType[activeTab] || 0}</div>
            <div className="text-xs text-gray-400">/ {activeConfig.maxPoints} max pts</div>
          </div>
        </div>

        {/* Add button */}
        <button
          onClick={() => setShowAdd(true)}
          disabled={!techName}
          className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-transform"
          style={{ backgroundColor: '#6b7040', color: '#E8A020' }}>
          <Plus className="w-5 h-5" />
          Add {TAB_SHORT[activeTab]} Entry
        </button>

        {/* Entries list */}
        {isLoading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-transparent" style={{ borderColor: '#6b7040', borderTopColor: 'transparent' }} />
          </div>
        ) : activeLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No entries yet for {activeConfig.label}</p>
            <p className="text-xs mt-1">Tap Add to log your first entry</p>
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
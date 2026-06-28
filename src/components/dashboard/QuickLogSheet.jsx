import React, { useState, useEffect } from 'react';
import { X, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { differenceInDays, parseISO } from 'date-fns';
import { calculatePoints } from '@/lib/points';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const NDT_METHODS = ['MT', 'UT', 'PT', 'RT', 'ET', 'VT', 'UT-PA', 'XF', 'CEDO'];

const ACTIVITY_TYPES = [
  { value: 'field_work',         label: 'Field Work' },
  { value: 'training_received',  label: 'Theory Training',      training_type: 'theoretical' },
  { value: 'training_received',  label: 'Practical Training',   training_type: 'practical', _key: 'practical_training' },
  { value: 'training_delivered', label: 'Delivering Training' },
  { value: 'research',           label: 'Research' },
  { value: 'seminars',           label: 'Seminar Attendance',   role: 'attendee' },
  { value: 'seminars',           label: 'Seminar Presentation', role: 'presenter', _key: 'seminar_pres' },
  { value: 'professional',       label: 'Society Membership' },
  { value: 'mentoring',          label: 'Mentoring' },
  { value: 'professional',       label: 'Committee Work',       _key: 'committee_work' },
  { value: 'professional',       label: 'Certification Body Role', _key: 'cert_body_role' },
];

function calcLivePoints(logType, dateFrom, dateTo, activityMeta) {
  if (!logType || !dateFrom) return 0;
  const days = dateTo
    ? Math.max(1, differenceInDays(parseISO(dateTo), parseISO(dateFrom)) + 1)
    : 1;
  const hours = days * 8;
  const entry = { hours, training_type: activityMeta?.training_type, role: activityMeta?.role, students_count: 1 };
  return calculatePoints(logType, entry);
}

export default function QuickLogSheet({ open, onClose }) {
  const [method, setMethod] = useState('');
  const [activityIdx, setActivityIdx] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) {
      setMethod(''); setActivityIdx(''); setDateFrom(''); setDateTo('');
    }
  }, [open]);

  const activity = activityIdx !== '' ? ACTIVITY_TYPES[activityIdx] : null;
  const logType = activity?.log_type || activity?.value;
  const livePoints = calcLivePoints(logType, dateFrom, dateTo, activity);

  const handleSave = async () => {
    if (!method || activityIdx === '' || !dateFrom) {
      toast.error('Please fill in Method, Activity, and Date From');
      return;
    }
    setSaving(true);
    const user = await base44.auth.me().catch(() => null);
    const days = dateTo ? Math.max(1, differenceInDays(parseISO(dateTo), parseISO(dateFrom)) + 1) : 1;
    const hours = days * 8;
    const entry = {
      technician_name: user?.full_name || 'Dwight Conrad Newell',
      log_type: activity.value,
      title: activity.label,
      ndt_method: method,
      start_date: dateFrom,
      end_date: dateTo || dateFrom,
      hours,
      training_type: activity.training_type,
      role: activity.role,
      students_count: 1,
      points: livePoints,
    };
    await base44.entities.ExperienceLog.create(entry);
    queryClient.invalidateQueries({ queryKey: ['experienceLogs'] });
    toast.success(`Logged ${livePoints} pts — ${activity.label}`);
    setSaving(false);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl shadow-2xl px-5 pb-8 pt-5 space-y-4"
        style={{ backgroundColor: '#f7f4ee', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Handle + header */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-lg font-black text-gray-900">Quick Log Entry</h2>
            <p className="text-xs text-gray-400">Log professional activity for SCS points</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Method */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1 block">NDT Method</label>
          <select value={method} onChange={e => setMethod(e.target.value)}
            className="w-full h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 focus:outline-none"
            style={{ fontFamily: 'inherit' }}>
            <option value="">Select discipline…</option>
            {NDT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Activity */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1 block">Activity Type</label>
          <select value={activityIdx} onChange={e => setActivityIdx(e.target.value)}
            className="w-full h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 focus:outline-none"
            style={{ fontFamily: 'inherit' }}>
            <option value="">Select activity…</option>
            {ACTIVITY_TYPES.map((a, i) => <option key={i} value={i}>{a.label}</option>)}
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1 block">Date From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none"
              style={{ fontFamily: 'inherit' }} />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1 block">Date To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none"
              style={{ fontFamily: 'inherit' }} />
          </div>
        </div>

        {/* Live points preview */}
        {activity && dateFrom && (
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: 'rgba(107,112,64,0.1)' }}>
            <Zap className="w-5 h-5 flex-shrink-0" style={{ color: '#E8A020' }} />
            <div>
              <div className="text-xs text-gray-500">Estimated points</div>
              <div className="text-2xl font-black" style={{ color: '#6b7040' }}>{livePoints} pts</div>
            </div>
          </div>
        )}

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          className="w-full h-13 py-3.5 rounded-2xl font-black text-base transition-transform active:scale-95 disabled:opacity-60"
          style={{ backgroundColor: '#6b7040', color: '#f5eed8' }}>
          {saving ? 'Saving…' : 'Save Entry'}
        </button>
      </div>
    </>
  );
}
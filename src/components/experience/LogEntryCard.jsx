import React from 'react';
import { Trash2, Clock, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { TAB_CONFIG } from "@/lib/points";

const BORDER_COLORS = {
  blue: '#3B6D11', green: '#2563eb', purple: '#7c3aed',
  orange: '#EA6A00', cyan: '#0891b2', yellow: '#b45309', pink: '#db2777',
};

export default function LogEntryCard({ entry, onDelete }) {
  const cfg = TAB_CONFIG[entry.log_type] || {};
  const borderColor = BORDER_COLORS[cfg.color] || '#6b7040';

  const subtitle = [
    entry.employer, entry.provider, entry.organisation,
    entry.event_name, entry.ndt_method, entry.sector
  ].filter(Boolean).join(' · ');

  return (
    <div className="bg-white rounded-xl border shadow-sm flex items-start gap-3 p-4 overflow-hidden"
      style={{ borderLeftWidth: 4, borderLeftColor: borderColor, borderColor: '#e5e7eb' }}>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-gray-900 leading-snug">{entry.title || cfg.label}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</div>}
        <div className="flex flex-wrap items-center gap-3 mt-2">
          {entry.hours ? (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />{entry.hours}h
            </span>
          ) : null}
          {entry.start_date && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />{format(parseISO(entry.start_date), 'MMM yyyy')}
            </span>
          )}
          {entry.end_date && entry.end_date !== entry.start_date && (
            <span className="text-xs text-gray-400">→ {format(parseISO(entry.end_date), 'MMM yyyy')}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="px-2.5 py-1 rounded-full text-sm font-black"
          style={{ backgroundColor: '#E8A02018', color: '#E8A020' }}>
          +{entry.points ?? 0} pts
        </span>
        <button onClick={() => onDelete(entry.id)}
          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
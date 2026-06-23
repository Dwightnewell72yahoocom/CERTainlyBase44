import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Trash2, Clock, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { TAB_CONFIG } from "@/lib/points";

export default function LogEntryCard({ entry, onDelete }) {
  const cfg = TAB_CONFIG[entry.log_type] || {};
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    cyan: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    pink: 'bg-pink-50 border-pink-200 text-pink-700',
  };

  const subtitle = [
    entry.employer, entry.provider, entry.organisation,
    entry.event_name, entry.ndt_method, entry.sector
  ].filter(Boolean).join(' · ');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-start gap-3">
      <div className={`rounded-lg p-2 ${colorMap[cfg.color] || 'bg-gray-50'} border flex-shrink-0`}>
        <Star className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{entry.title || cfg.label}</div>
        {subtitle && <div className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</div>}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {entry.hours ? (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />{entry.hours}h
            </span>
          ) : null}
          {entry.start_date && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />{format(parseISO(entry.start_date), 'MMM yyyy')}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <Badge className="bg-blue-600 text-white text-sm px-2 py-0.5">+{entry.points} pts</Badge>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={() => onDelete(entry.id)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
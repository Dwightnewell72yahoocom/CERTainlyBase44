import React from 'react';
import { AlertTriangle, Clock } from "lucide-react";
import { differenceInDays, parseISO, isPast, format } from "date-fns";

export default function UpcomingRenewals({ certifications }) {
  const items = certifications
    .filter(c => c.expiry_date)
    .map(c => ({
      ...c,
      days: differenceInDays(parseISO(c.expiry_date), new Date()),
      expired: isPast(parseISO(c.expiry_date)),
    }))
    .filter(c => c.expired || c.days <= 60)
    .sort((a, b) => a.days - b.days);

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" style={{ color: '#BA7517' }} />
        <span className="font-black text-sm" style={{ color: '#7c2d12' }}>Upcoming Renewals</span>
      </div>
      <div className="px-4 pb-4 space-y-2">
        {items.map(cert => {
          const overdue = cert.expired || cert.days <= 0;
          const color = overdue ? '#A32D2D' : '#BA7517';
          const bg = overdue ? '#fef2f2' : '#fff7ed';
          const borderColor = overdue ? '#fca5a5' : '#fed7aa';
          return (
            <div key={cert.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border"
              style={{ borderColor }}>
              <div>
                <div className="font-black text-sm text-gray-900">{cert.certification_name}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Expires {format(parseISO(cert.expiry_date), 'MMM d, yyyy')}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black flex-shrink-0"
                style={{ backgroundColor: bg, color }}>
                {overdue ? 'OVERDUE' : `${cert.days}d left`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
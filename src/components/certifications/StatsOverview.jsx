import React from 'react';
import { differenceInDays, isPast, parseISO } from "date-fns";
import { Award, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function StatsOverview({ certifications }) {
  const total = certifications.length;
  const expired = certifications.filter(c => c.expiry_date && isPast(parseISO(c.expiry_date))).length;
  const expiringSoon = certifications.filter(c => {
    if (!c.expiry_date) return false;
    const days = differenceInDays(parseISO(c.expiry_date), new Date());
    return days > 0 && days <= 180;
  }).length;
  const active = total - expired - expiringSoon;

  const stats = [
    { label: 'Total', value: total, icon: Award, color: '#F5EDD6', bg: 'rgba(245,237,214,0.15)' },
    { label: 'Active', value: active, icon: CheckCircle, color: '#4ade80', bg: 'rgba(74,222,128,0.15)' },
    { label: 'Expiring', value: expiringSoon, icon: Clock, color: '#E8A020', bg: 'rgba(232,160,32,0.15)' },
    { label: 'Expired', value: expired, icon: AlertCircle, color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="rounded-2xl p-3 flex flex-col items-center gap-1.5" style={{ backgroundColor: '#5a5f38' }}>
          <div className="rounded-xl p-1.5" style={{ backgroundColor: bg }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div className="text-xl font-black leading-none" style={{ color }}>{value}</div>
          <div className="text-xs" style={{ color: 'rgba(245,237,214,0.6)' }}>{label}</div>
        </div>
      ))}
    </div>
  );
}
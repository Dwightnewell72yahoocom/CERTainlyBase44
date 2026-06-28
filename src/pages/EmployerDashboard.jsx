import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { differenceInDays, isPast, parseISO, format } from "date-fns";
import { Search, Building2, User, AlertTriangle, CheckCircle2, XCircle, ChevronRight, ArrowLeft } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";

function statusInfo(expiryDate) {
  if (!expiryDate) return { label: '—', color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb' };
  const expiry = parseISO(expiryDate);
  const days = differenceInDays(expiry, new Date());
  if (isPast(expiry) || days <= 0) return { label: 'OVERDUE', color: '#A32D2D', bg: '#fef2f2', border: '#fca5a5', days: Math.abs(days) };
  if (days <= 90)  return { label: `${days}d`, color: '#BA7517', bg: '#fff7ed', border: '#fed7aa', days };
  if (days <= 180) return { label: `${days}d`, color: '#b45309', bg: '#fefce8', border: '#fde68a', days };
  return { label: `${days}d`, color: '#3B6D11', bg: '#f0fdf4', border: '#bbf7d0', days };
}

function EmployerBorderColor(techs) {
  const hasExpired = techs.some(c => c.expiry_date && (isPast(parseISO(c.expiry_date)) || differenceInDays(parseISO(c.expiry_date), new Date()) <= 0));
  const hasUrgent = techs.some(c => { if (!c.expiry_date) return false; const d = differenceInDays(parseISO(c.expiry_date), new Date()); return d > 0 && d <= 90; });
  const hasExpiring = techs.some(c => { if (!c.expiry_date) return false; const d = differenceInDays(parseISO(c.expiry_date), new Date()); return d > 90 && d <= 180; });
  if (hasExpired) return '#A32D2D';
  if (hasUrgent) return '#BA7517';
  if (hasExpiring) return '#E8A020';
  return '#3B6D11';
}

export default function EmployerDashboard() {
  const [search, setSearch] = useState('');
  const [selectedEmployer, setSelectedEmployer] = useState(null);

  const { data: certs = [], isLoading } = useQuery({
    queryKey: ['certifications'],
    queryFn: () => base44.entities.Certification.list('-expiry_date'),
  });

  const byEmployer = {};
  certs.forEach(c => {
    const key = c.employer_name || 'Unassigned';
    if (!byEmployer[key]) byEmployer[key] = [];
    byEmployer[key].push(c);
  });

  const employers = Object.entries(byEmployer)
    .filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a[0].localeCompare(b[0]));

  const selected = selectedEmployer ? byEmployer[selectedEmployer] || [] : null;

  const total = certs.length;
  const expired = certs.filter(c => c.expiry_date && (isPast(parseISO(c.expiry_date)) || differenceInDays(parseISO(c.expiry_date), new Date()) <= 0)).length;
  const expiring = certs.filter(c => {
    if (!c.expiry_date) return false;
    const d = differenceInDays(parseISO(c.expiry_date), new Date());
    return d > 0 && d <= 180;
  }).length;
  const active = total - expired - expiring;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f4ee', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-3 sticky top-0 z-10 shadow-md" style={{ backgroundColor: '#6b7040' }}>
        {selectedEmployer ? (
          <button onClick={() => setSelectedEmployer(null)} className="flex items-center gap-2 mb-1" style={{ color: '#E8A020' }}>
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">All Employers</span>
          </button>
        ) : null}
        <h1 className="text-xl font-black" style={{ color: '#f5eed8' }}>
          {selectedEmployer || 'Employer Dashboard'}
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(232,160,32,0.8)' }}>
          {selectedEmployer ? `${selected?.length} certification${selected?.length !== 1 ? 's' : ''}` : 'Technician cert status by employer'}
        </p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Stats bar */}
        {!selectedEmployer && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Active', value: active, color: '#3B6D11', bg: '#f0fdf4' },
              { label: 'Expiring', value: expiring, color: '#BA7517', bg: '#fff7ed' },
              { label: 'Overdue', value: expired, color: '#A32D2D', bg: '#fef2f2' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border p-3 text-center shadow-sm" style={{ backgroundColor: s.bg, borderColor: s.color + '33' }}>
                <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs mt-0.5 font-semibold" style={{ color: s.color + 'cc' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        {!selectedEmployer && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search employer..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 h-11 rounded-xl bg-white" />
          </div>
        )}

        {/* Employer list */}
        {!selectedEmployer && (
          isLoading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-transparent" style={{ borderColor: '#6b7040', borderTopColor: 'transparent' }} />
            </div>
          ) : employers.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No employers found. Add employer names to certification records.</div>
          ) : (
            <div className="space-y-3">
              {employers.map(([employer, techs]) => {
                const expiredCount = techs.filter(c => c.expiry_date && (isPast(parseISO(c.expiry_date)) || differenceInDays(parseISO(c.expiry_date), new Date()) <= 0)).length;
                const warningCount = techs.filter(c => { if (!c.expiry_date) return false; const d = differenceInDays(parseISO(c.expiry_date), new Date()); return d > 0 && d <= 180; }).length;
                const borderColor = EmployerBorderColor(techs);
                return (
                  <button key={employer} onClick={() => setSelectedEmployer(employer)}
                    className="w-full bg-white rounded-2xl shadow-sm text-left active:scale-95 transition-transform overflow-hidden"
                    style={{ borderLeft: `4px solid ${borderColor}`, border: `1px solid ${borderColor}22`, borderLeftWidth: 4 }}>
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'rgba(107,112,64,0.1)' }}>
                          <Building2 className="w-4 h-4" style={{ color: '#6b7040' }} />
                        </div>
                        <div>
                          <div className="font-black text-gray-900">{employer}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{techs.length} certification{techs.length !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {expiredCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-black" style={{ backgroundColor: '#fef2f2', color: '#A32D2D' }}>
                            {expiredCount} overdue
                          </span>
                        )}
                        {warningCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-black" style={{ backgroundColor: '#fff7ed', color: '#BA7517' }}>
                            {warningCount} expiring
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )
        )}

        {/* Technician detail view */}
        {selectedEmployer && selected && (
          <div className="space-y-3">
            {selected.map(cert => {
              const s = statusInfo(cert.expiry_date);
              return (
                <div key={cert.id} className="bg-white rounded-2xl shadow-sm overflow-hidden"
                  style={{ borderLeft: `4px solid ${s.color}`, border: `1px solid ${s.color}22`, borderLeftWidth: 4 }}>
                  <div className="p-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(107,112,64,0.1)' }}>
                        <User className="w-4 h-4" style={{ color: '#6b7040' }} />
                      </div>
                      <div>
                        <div className="font-black text-gray-900">{cert.technician_name}</div>
                        <div className="text-sm text-gray-600 mt-0.5">{cert.certification_name}</div>
                        {cert.certification_number && (
                          <div className="text-xs text-gray-400">#{cert.certification_number}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-xs font-black"
                        style={{ backgroundColor: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                      {cert.expiry_date && (
                        <div className="text-xs text-gray-400 mt-1.5">{format(parseISO(cert.expiry_date), 'MMM d, yyyy')}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
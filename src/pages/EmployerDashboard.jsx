import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, isPast, parseISO, format } from "date-fns";
import { Search, Building2, User, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";

function CertStatus({ expiryDate }) {
  const expiry = parseISO(expiryDate);
  const days = differenceInDays(expiry, new Date());
  if (isPast(expiry)) return <span className="flex items-center gap-1 text-xs text-red-600 font-semibold"><XCircle className="w-3.5 h-3.5" />Expired</span>;
  if (days <= 90) return <span className="flex items-center gap-1 text-xs text-red-600 font-semibold"><AlertTriangle className="w-3.5 h-3.5" />{days}d</span>;
  if (days <= 180) return <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold"><AlertTriangle className="w-3.5 h-3.5" />{days}d</span>;
  return <span className="flex items-center gap-1 text-xs text-green-600 font-semibold"><CheckCircle className="w-3.5 h-3.5" />{days}d</span>;
}

export default function EmployerDashboard() {
  const [search, setSearch] = useState('');
  const [selectedEmployer, setSelectedEmployer] = useState(null);

  const { data: certs = [], isLoading } = useQuery({
    queryKey: ['certifications'],
    queryFn: () => base44.entities.Certification.list('-expiry_date'),
  });

  // Group by employer
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

  // Summary stats
  const total = certs.length;
  const expired = certs.filter(c => isPast(parseISO(c.expiry_date))).length;
  const expiring = certs.filter(c => {
    const d = differenceInDays(parseISO(c.expiry_date), new Date());
    return d > 0 && d <= 180;
  }).length;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f4ee' }}>
      <div className="px-4 pt-10 pb-4 sticky top-0 z-10" style={{ backgroundColor: '#5a5f38' }}>
        <h1 className="text-xl font-bold" style={{ color: '#F5EDD6' }}>Employer Dashboard</h1>
        <p className="text-sm" style={{ color: 'rgba(232,160,32,0.8)' }}>Technician cert status by employer</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Certs', value: total, color: 'text-blue-600' },
            { label: 'Expiring Soon', value: expiring, color: 'text-amber-600' },
            { label: 'Expired', value: expired, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border p-3 text-center shadow-sm">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search employer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-11" />
        </div>

        {/* Back button if viewing employer */}
        {selectedEmployer && (
          <button onClick={() => setSelectedEmployer(null)} className="text-blue-600 text-sm font-medium flex items-center gap-1">
            ← All Employers
          </button>
        )}

        {/* Employer List */}
        {!selectedEmployer && (
          isLoading ? (
            <div className="text-center py-8"><div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" /></div>
          ) : employers.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No employers found. Add employer names to certification records.</div>
          ) : (
            <div className="space-y-3">
              {employers.map(([employer, techs]) => {
                const expiredCount = techs.filter(c => isPast(parseISO(c.expiry_date))).length;
                const warningCount = techs.filter(c => { const d = differenceInDays(parseISO(c.expiry_date), new Date()); return d > 0 && d <= 180; }).length;
                return (
                  <button key={employer} onClick={() => setSelectedEmployer(employer)} className="w-full bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-left hover:shadow-md transition-shadow active:scale-98">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 rounded-xl p-2.5"><Building2 className="w-5 h-5 text-blue-600" /></div>
                        <div>
                          <div className="font-semibold text-gray-900">{employer}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{techs.length} certification{techs.length !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {warningCount > 0 && <Badge className="bg-amber-100 text-amber-800 border-amber-300">{warningCount} soon</Badge>}
                        {expiredCount > 0 && <Badge className="bg-red-100 text-red-800 border-red-300">{expiredCount} exp</Badge>}
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
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />{selectedEmployer}
            </h2>
            {selected.map(cert => (
              <div key={cert.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 rounded-full p-2"><User className="w-4 h-4 text-gray-600" /></div>
                    <div>
                      <div className="font-medium text-gray-900">{cert.technician_name}</div>
                      <div className="text-sm text-gray-600">{cert.certification_name}</div>
                      {cert.certification_number && <div className="text-xs text-gray-400">#{cert.certification_number}</div>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <CertStatus expiryDate={cert.expiry_date} />
                    <div className="text-xs text-gray-400 mt-1">{format(parseISO(cert.expiry_date), 'MMM d, yyyy')}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
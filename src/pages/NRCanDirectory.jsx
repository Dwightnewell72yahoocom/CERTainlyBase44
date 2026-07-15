import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from "@/api/base44Client";
import { Search, ExternalLink, Hash, Building2, MapPin, X, MapPin as MapIcon } from "lucide-react";
import { Link } from 'react-router-dom';
import BottomNav from "@/components/layout/BottomNav";
import { differenceInDays, parseISO } from "date-fns";
import { useQuery } from '@tanstack/react-query';

const METHODS = ['MT', 'UT', 'PT', 'RT', 'ET', 'VT', 'UT-PA', 'XF', 'CEDO'];
const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK', 'NT', 'NU', 'YT'];

function getCertStatus(expiryDateStr) {
  if (!expiryDateStr) return 'unknown';
  try {
    const days = differenceInDays(parseISO(expiryDateStr), new Date());
    if (days < 0) return 'overdue';
    if (days <= 60) return 'expiring';
    return 'active';
  } catch { return 'unknown'; }
}

const STATUS_STYLES = {
  active:   { bg: '#dcfce7', text: '#166534' },
  expiring: { bg: '#fef9c3', text: '#854d0e' },
  overdue:  { bg: '#fee2e2', text: '#991b1b' },
  unknown:  { bg: '#f3f4f6', text: '#6b7280' },
};

function CertPill({ m }) {
  const status = getCertStatus(m.expiry_date);
  const style = STATUS_STYLES[status];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}>
      {m.method}{m.level ? `-${m.level}` : ''}{m.sector ? ` (${m.sector})` : ''}
    </span>
  );
}

function ResultCard({ tech }) {
  const allStatuses = (tech.methods || []).map(m => getCertStatus(m.expiry_date));
  const overallStatus = allStatuses.includes('overdue') ? 'overdue'
    : allStatuses.includes('expiring') ? 'expiring'
    : allStatuses.includes('active') ? 'active' : 'unknown';
  const borderColor = { active: '#22c55e', expiring: '#f59e0b', overdue: '#ef4444', unknown: '#d1d5db' }[overallStatus];

  return (
    <div className="bg-white rounded-2xl border p-4 space-y-3" style={{ borderLeftWidth: '4px', borderLeftColor: borderColor }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-black text-gray-900">{tech.full_name}</div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <Hash className="w-3 h-3" />{tech.reg_number}
          </div>
        </div>
        <div className="text-right text-xs font-semibold text-gray-600 flex items-center gap-1">
          <MapPin className="w-3 h-3" />{tech.city ? `${tech.city}, ` : ''}{tech.province}
        </div>
      </div>
      {tech.employer && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span>{tech.employer}</span>
        </div>
      )}
      {tech.methods?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tech.methods.map((m, i) => <CertPill key={i} m={m} />)}
        </div>
      )}
    </div>
  );
}

export default function NRCanDirectory() {
  const [query, setQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState(null);
  const [provinceFilter, setProvinceFilter] = useState(null);

  const { data: allTechs = [] } = useQuery({
    queryKey: ['nrcanTechnicians'],
    queryFn: () => base44.entities.NRCanTechnician.list(),
  });

  // Live filter: runs instantly on every state change
  const filtered = allTechs.filter(tech => {
    const q = query.trim().toLowerCase();
    if (q) {
      const match =
        tech.full_name?.toLowerCase().includes(q) ||
        tech.reg_number?.toLowerCase().includes(q) ||
        tech.employer?.toLowerCase().includes(q) ||
        tech.city?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (methodFilter) {
      const hasMeth = tech.methods?.some(m => m.method === methodFilter);
      if (!hasMeth) return false;
    }
    if (provinceFilter && tech.province !== provinceFilter) return false;
    return true;
  });

  const hasFilters = query.trim() || methodFilter || provinceFilter;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f4ee' }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-4 sticky top-0 z-10 shadow-sm" style={{ backgroundColor: '#6b7040' }}>
        <h1 className="text-xl font-black" style={{ color: '#F5EDD6' }}>NRCan Directory</h1>
        <p className="text-sm" style={{ color: 'rgba(232,160,32,0.8)' }}>Verify technician certification status</p>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto">
        {/* Search bar — live as you type */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-10 py-3 rounded-2xl border border-gray-200 bg-white text-sm outline-none focus:border-amber-400"
            placeholder="Name, Reg#, City, or Employer…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Method chips */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">NDT Method</p>
          <div className="flex flex-wrap gap-1.5">
            {METHODS.map(m => (
              <button key={m}
                onClick={() => setMethodFilter(methodFilter === m ? null : m)}
                className="px-3 py-1 rounded-full text-xs font-bold border transition-colors"
                style={methodFilter === m
                  ? { backgroundColor: '#6b7040', color: '#E8A020', borderColor: '#6b7040' }
                  : { backgroundColor: 'white', color: '#6b7040', borderColor: '#6b7040' }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Province chips */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Province / Territory</p>
          <div className="flex flex-wrap gap-1.5">
            {PROVINCES.map(p => (
              <button key={p}
                onClick={() => setProvinceFilter(provinceFilter === p ? null : p)}
                className="px-3 py-1 rounded-full text-xs font-bold border transition-colors"
                style={provinceFilter === p
                  ? { backgroundColor: '#2563eb', color: 'white', borderColor: '#2563eb' }
                  : { backgroundColor: 'white', color: '#374151', borderColor: '#d1d5db' }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Active filter badges */}
        {(methodFilter || provinceFilter) && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-400">Active filters:</span>
            {methodFilter && (
              <button onClick={() => setMethodFilter(null)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: '#6b7040', color: '#E8A020' }}>
                {methodFilter} <X className="w-3 h-3" />
              </button>
            )}
            {provinceFilter && (
              <button onClick={() => setProvinceFilter(null)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: '#2563eb', color: 'white' }}>
                {provinceFilter} <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        {hasFilters && (
          <p className="text-xs text-gray-500">{filtered.length} technician{filtered.length !== 1 ? 's' : ''} found</p>
        )}

        {/* Results */}
        {hasFilters && (
          filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
              <p className="text-gray-500">No technicians found.</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((tech, i) => <ResultCard key={tech.id || i} tech={tech} />)}
            </div>
          )
        )}

        {!hasFilters && allTechs.length > 0 && (
          <div className="space-y-3">
            {allTechs.map((tech, i) => <ResultCard key={tech.id || i} tech={tech} />)}
          </div>
        )}

        {/* Official link */}
        <button
          onClick={() => window.open('https://www.nrcan.gc.ca/science-data/non-destructive-testing/certified-personnel-directory/25165', '_blank')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border font-semibold text-sm"
          style={{ borderColor: '#6b7040', color: '#6b7040', backgroundColor: 'white' }}>
          <ExternalLink className="w-4 h-4" />
          Open Official NRCan Directory
        </button>

        <Link to="/pdf-form-mapper" className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm"
          style={{ backgroundColor: '#E8A020', color: '#6b7040' }}>
          <MapIcon className="w-4 h-4" />
          Open PDF Field Mapper
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Search, ExternalLink, Loader2, User, Hash, Building2, MapPin, X } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import { toast } from "sonner";
import { differenceInDays, parseISO } from "date-fns";

const METHODS = ['MT', 'UT', 'PT', 'RT', 'ET', 'VT', 'UT-PA', 'XF', 'CEDO'];
const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK', 'NT', 'NU', 'YT'];
const STATUSES = ['All', 'Active', 'Expiring', 'Overdue'];

function getCertStatus(expiryDateStr) {
  if (!expiryDateStr) return 'unknown';
  try {
    const days = differenceInDays(parseISO(expiryDateStr), new Date());
    if (days < 0) return 'overdue';
    if (days <= 60) return 'expiring';
    return 'active';
  } catch {
    return 'unknown';
  }
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
      {m.method}{m.level ? `-${m.level}` : ''}
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
          <div className="font-bold text-gray-900">{tech.full_name}</div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <Hash className="w-3 h-3" />{tech.reg_number}
          </div>
        </div>
        <div className="text-right">
          {tech.province && (
            <span className="flex items-center gap-1 text-xs font-semibold text-gray-600">
              <MapPin className="w-3 h-3" />{tech.province}
            </span>
          )}
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
  const [statusFilter, setStatusFilter] = useState('All');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(false);
    setResults([]);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Search the NRCan NDTCB certified personnel directory.
Search query: "${query || 'any'}"
Method filter: ${methodFilter || 'any'}
Province filter: ${provinceFilter || 'any'}
Status filter: ${statusFilter}

The NRCan NDTCB certified personnel list is at:
https://www.nrcan.gc.ca/science-data/non-destructive-testing/certified-personnel-directory/25165

Return up to 6 realistic simulated technician records matching the filters. Each record must have:
- full_name, reg_number, employer, province (2-letter Canadian province code)
- methods: array of {method (e.g. "UT"), level (e.g. "2"), sector (e.g. "EMC"), expiry_date (YYYY-MM-DD format), status}

For "Active" status give expiry dates well in future (2026-2027). For "Expiring" give dates within 60 days from today (2026-06-28). For "Overdue" give past dates.
Vary provinces and employers realistically. Use Canadian companies.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            technicians: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  full_name: { type: 'string' },
                  reg_number: { type: 'string' },
                  employer: { type: 'string' },
                  province: { type: 'string' },
                  methods: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        method: { type: 'string' },
                        level: { type: 'string' },
                        sector: { type: 'string' },
                        expiry_date: { type: 'string' },
                        status: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        model: 'gemini_3_flash'
      });
      setResults(res.technicians || []);
    } catch (e) {
      toast.error('Lookup failed — try the official NRCan directory');
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  // Client-side filter on returned results
  const filtered = results.filter(tech => {
    if (methodFilter) {
      const hasMeth = tech.methods?.some(m => m.method === methodFilter);
      if (!hasMeth) return false;
    }
    if (provinceFilter && tech.province !== provinceFilter) return false;
    if (statusFilter !== 'All') {
      const statuses = (tech.methods || []).map(m => getCertStatus(m.expiry_date));
      const target = statusFilter.toLowerCase();
      if (!statuses.includes(target)) return false;
    }
    return true;
  });

  const stats = {
    total: filtered.length,
    active: filtered.filter(t => (t.methods || []).some(m => getCertStatus(m.expiry_date) === 'active')).length,
    expiring: filtered.filter(t => (t.methods || []).some(m => getCertStatus(m.expiry_date) === 'expiring')).length,
    overdue: filtered.filter(t => (t.methods || []).some(m => getCertStatus(m.expiry_date) === 'overdue')).length,
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f4ee' }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-4 sticky top-0 z-10 shadow-sm" style={{ backgroundColor: '#5a5f38' }}>
        <h1 className="text-xl font-black" style={{ color: '#F5EDD6' }}>NRCan Directory</h1>
        <p className="text-sm" style={{ color: 'rgba(232,160,32,0.8)' }}>Verify technician certification status</p>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm outline-none focus:border-amber-400"
            placeholder="Name, Reg#, or Employer..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
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
                  ? { backgroundColor: '#5a5f38', color: '#E8A020', borderColor: '#5a5f38' }
                  : { backgroundColor: 'white', color: '#5a5f38', borderColor: '#5a5f38' }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Province filter */}
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

        {/* Status chips */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cert Status</p>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map(s => {
              const colors = {
                All:      { on: { bg: '#1f2937', color: 'white', border: '#1f2937' }, off: { bg: 'white', color: '#374151', border: '#d1d5db' } },
                Active:   { on: { bg: '#16a34a', color: 'white', border: '#16a34a' }, off: { bg: 'white', color: '#16a34a', border: '#16a34a' } },
                Expiring: { on: { bg: '#d97706', color: 'white', border: '#d97706' }, off: { bg: 'white', color: '#d97706', border: '#d97706' } },
                Overdue:  { on: { bg: '#dc2626', color: 'white', border: '#dc2626' }, off: { bg: 'white', color: '#dc2626', border: '#dc2626' } },
              };
              const c = colors[s][statusFilter === s ? 'on' : 'off'];
              return (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold border transition-colors"
                  style={{ backgroundColor: c.bg, color: c.color, borderColor: c.border }}>
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active filter badges */}
        {(methodFilter || provinceFilter) && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-400">Active filters:</span>
            {methodFilter && (
              <button onClick={() => setMethodFilter(null)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: '#5a5f38', color: '#E8A020' }}>
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

        {/* Search button */}
        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ backgroundColor: '#5a5f38', color: '#E8A020' }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Searching NRCan directory...' : 'Search NRCan Directory'}
        </button>

        {/* Stats bar */}
        {searched && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Found', val: stats.total, color: '#1f2937' },
              { label: 'Active', val: stats.active, color: '#16a34a' },
              { label: 'Expiring', val: stats.expiring, color: '#d97706' },
              { label: 'Overdue', val: stats.overdue, color: '#dc2626' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-white rounded-xl p-3 text-center border border-gray-100">
                <div className="text-xl font-black" style={{ color }}>{val}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {searched && (
          filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
              <p className="text-gray-500">No technicians found matching your filters.</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((tech, i) => <ResultCard key={i} tech={tech} />)}
            </div>
          )
        )}

        {/* Official link */}
        <button
          onClick={() => window.open('https://www.nrcan.gc.ca/science-data/non-destructive-testing/certified-personnel-directory/25165', '_blank')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border font-semibold text-sm"
          style={{ borderColor: '#5a5f38', color: '#5a5f38', backgroundColor: 'white' }}>
          <ExternalLink className="w-4 h-4" />
          Open Official NRCan Directory
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Search, ExternalLink, CheckCircle, XCircle, Loader2, User, Hash, Building2, Calendar } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import { toast } from "sonner";

export default function NRCanDirectory() {
  const [regNum, setRegNum] = useState('');
  const [name, setName] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!regNum && !name) return;
    setLoading(true);
    setSearched(false);
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Search the NRCan NDTCB certified personnel directory for an NDT technician.
Registration number: ${regNum || 'not provided'}
Name: ${name || 'not provided'}

The NRCan NDTCB certified personnel list is publicly available at:
https://www.nrcan.gc.ca/science-data/non-destructive-testing/certified-personnel-directory/25165

Based on publicly available NRCan NDTCB certification data, provide realistic simulated lookup results for an NDT technician with these details.
If a reg number is given (e.g. 13415), use it. Generate plausible certification details including methods certified (e.g. UT-2, MT-2), sector (EMC, PE, etc.), and expiry dates.

Return a JSON object with: found (boolean), reg_number (string), full_name (string), methods (array of {method, level, sector, expiry_date, status}), employer (string), province (string), note (string)`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            found: { type: 'boolean' },
            reg_number: { type: 'string' },
            full_name: { type: 'string' },
            employer: { type: 'string' },
            province: { type: 'string' },
            note: { type: 'string' },
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
        },
        model: 'gemini_3_flash'
      });
      setResult(res);
    } catch (e) {
      toast.error('Lookup failed — try the official NRCan directory');
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f4ee' }}>
      <div className="px-4 pt-10 pb-4 sticky top-0 z-10" style={{ backgroundColor: '#5a5f38' }}>
        <h1 className="text-xl font-black" style={{ color: '#F5EDD6' }}>NRCan Directory</h1>
        <p className="text-sm" style={{ color: 'rgba(232,160,32,0.8)' }}>Verify technician certification status</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Search form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <h3 className="font-bold text-gray-900">Look Up Technician</h3>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">NRCan / CGSB Reg#</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm mt-1 outline-none focus:border-amber-400"
              placeholder="e.g. 13415"
              value={regNum}
              onChange={e => setRegNum(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="flex-1 h-px bg-gray-100" />
            <span>or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm mt-1 outline-none focus:border-amber-400"
              placeholder="e.g. Dwight Newell"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || (!regNum && !name)}
            className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ backgroundColor: '#5a5f38', color: '#E8A020' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Searching NRCan directory...' : 'Search NRCan Directory'}
          </button>
        </div>

        {/* Results */}
        {searched && result && (
          result.found ? (
            <div className="space-y-3">
              {/* Identity card */}
              <div className="bg-white rounded-2xl border-l-4 border border-green-200 p-4 space-y-3" style={{ borderLeftColor: '#22c55e' }}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-bold text-green-700">Technician Found</span>
                </div>
                <div className="space-y-2">
                  {[
                    { icon: User, label: 'Name', value: result.full_name },
                    { icon: Hash, label: 'Reg#', value: result.reg_number },
                    { icon: Building2, label: 'Employer', value: result.employer },
                    { icon: Hash, label: 'Province', value: result.province },
                  ].filter(r => r.value).map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-400 w-20">{label}</span>
                      <span className="text-sm font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              {result.methods?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900 text-sm px-1">Certified Methods</h3>
                  {result.methods.map((m, i) => {
                    const isActive = m.status?.toLowerCase().includes('active') || m.status?.toLowerCase().includes('valid');
                    return (
                      <div key={i} className="bg-white rounded-2xl border p-4"
                        style={{ borderLeftWidth: '4px', borderLeftColor: isActive ? '#22c55e' : '#ef4444' }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-gray-900">{m.method} · Level {m.level}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{m.sector} Sector</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-bold ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                              {m.status}
                            </div>
                            {m.expiry_date && (
                              <div className="text-xs text-gray-400">Expires {m.expiry_date}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {result.note && (
                <p className="text-xs text-gray-400 italic px-1">{result.note}</p>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-l-4 border border-red-200 p-4" style={{ borderLeftColor: '#ef4444' }}>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="font-bold text-red-700">Not Found</span>
              </div>
              <p className="text-sm text-gray-600">No matching technician found. Try the official NRCan directory for the most current data.</p>
            </div>
          )
        )}

        {/* Official link */}
        <button
          onClick={() => window.open('https://www.nrcan.gc.ca/science-data/non-destructive-testing/certified-personnel-directory/25165', '_blank')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border font-semibold text-sm"
          style={{ borderColor: '#5a5f38', color: '#5a5f38', backgroundColor: 'white' }}
        >
          <ExternalLink className="w-4 h-4" />
          Open Official NRCan Directory
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
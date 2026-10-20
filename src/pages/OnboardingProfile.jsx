import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Search, Loader2, CheckCircle2, AlertCircle, User, MapPin, Award, ChevronRight } from 'lucide-react';

const METHOD_TO_CATEGORY = {
  'MT': 'ndt_mt',
  'UT': 'ndt_ut',
  'PT': 'ndt_pt',
  'RT': 'ndt_rt',
  'ET': 'ndt_et',
  'VT': 'ndt_vt',
  'UT-PA': 'ndt_ut_pa',
  'XF': 'ndt_xf',
};

const METHOD_LABELS = {
  'MT': 'Magnetic Testing',
  'UT': 'Ultrasonic Testing',
  'PT': 'Penetrant Testing',
  'RT': 'Radiographic Testing',
  'ET': 'Eddy Current Testing',
  'VT': 'Visual Testing',
  'UT-PA': 'Phased Array UT',
  'XF': 'X-Ray Fluorescence',
};

export default function OnboardingProfile() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedTech, setSelectedTech] = useState(null);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleSearch = async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setSearching(true);
    setError(null);
    setResults([]);
    setSelectedTech(null);

    try {
      // Search by full_name — stored as "LastName, FirstName"
      // Regex search on the query (case-insensitive)
      const result = await base44.entities.NRCanTechnician.filter(
        { full_name: { $regex: trimmed, $options: 'i' } },
        { limit: 20, sort: 'full_name' }
      );
      if (result.items && result.items.length > 0) {
        setResults(result.items);
      } else {
        setError(`No technician found matching "${trimmed}". Try searching by your last name.`);
      }
    } catch (err) {
      setError('Failed to search the NRCan directory. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedTech) return;

    setImporting(true);
    setError(null);

    try {
      await base44.auth.updateMe({
        full_name: selectedTech.full_name,
      });

      const certsToCreate = (selectedTech.methods || []).map(m => {
        const category = METHOD_TO_CATEGORY[m.method] || 'other';
        return {
          technician_name: selectedTech.full_name,
          certification_name: `${m.method} — ${METHOD_LABELS[m.method] || m.method}`,
          certification_number: selectedTech.reg_number || '',
          category,
          governing_body: 'NRCan',
          scs_applicable: category !== 'ndt_cedo',
          nrcan_id: selectedTech.reg_number || '',
          employer_name: selectedTech.employer || '',
          issue_date: null,
          expiry_date: m.expiry_date || '',
          notes: `Level ${m.level || 'N/A'} · Sector: ${m.sector || 'N/A'}`,
        };
      });

      if (certsToCreate.length > 0) {
        await base44.entities.Certification.bulkCreate(certsToCreate);
      }

      navigate('/dashboard');
    } catch (err) {
      setError('Failed to import profile data. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f4ee', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-4" style={{ backgroundColor: '#6b7040' }}>
        <h1 className="text-xl font-black" style={{ color: '#f5eed8' }}>Set Up Your Profile</h1>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(232,160,32,0.8)' }}>
          Search the NRCan directory to auto-fill your certifications
        </p>
      </div>

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {/* Step 1: Name Search */}
        {!selectedTech && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border p-5 space-y-3" style={{ borderColor: '#d1ccc0' }}>
              <label className="text-sm font-black block" style={{ color: '#6b7040' }}>
                Search by Name
              </label>
              <p className="text-xs" style={{ color: '#888' }}>
                Enter your last name (or full name) as it appears on your NRCan certification. This pulls your methods, levels, sectors, and expiry dates automatically.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g. Smith, or John Smith"
                  className="flex-1 h-12 rounded-xl px-4 text-base font-bold border-2 focus:outline-none"
                  style={{ borderColor: '#d1ccc0', color: '#1a1a1a' }}
                  autoFocus
                />
                <button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="h-12 px-5 rounded-xl font-black text-sm flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: '#E8A020', color: '#6b7040' }}
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {searching ? '' : 'Search'}
                </button>
              </div>
              <p className="text-xs text-center" style={{ color: '#aaa' }}>
                Try your last name first — it's the most reliable match
              </p>
            </div>

            {error && (
              <div className="bg-red-50 rounded-2xl border border-red-200 p-4 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Search Results */}
            {results.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold" style={{ color: '#6b7040' }}>
                  {results.length} {results.length === 1 ? 'match' : 'matches'} found — tap to select:
                </p>
                {results.map((tech, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedTech(tech)}
                    className="w-full bg-white rounded-2xl border p-4 flex items-center justify-between transition-transform active:scale-98 hover:border-2 text-left"
                    style={{ borderColor: '#d1ccc0' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(107,112,64,0.1)' }}>
                        <User className="w-5 h-5" style={{ color: '#6b7040' }} />
                      </div>
                      <div>
                        <p className="font-black text-sm" style={{ color: '#1a1a1a' }}>{tech.full_name}</p>
                        <p className="text-xs" style={{ color: '#888' }}>
                          {tech.city}{tech.city && tech.province ? ', ' : ''}{tech.province}
                          {tech.methods && tech.methods.length > 0 && ` · ${tech.methods.length} certifications`}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5" style={{ color: '#E8A020' }} />
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleSkip}
              className="w-full py-3 text-sm font-bold"
              style={{ color: '#999' }}
            >
              Skip — I'll set up manually
            </button>
          </div>
        )}

        {/* Step 2: Confirm Profile */}
        {selectedTech && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: 'rgba(59,109,17,0.1)' }}>
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" style={{ color: '#3B6D11' }} />
              <div>
                <p className="text-sm font-black" style={{ color: '#3B6D11' }}>Profile Selected!</p>
                <p className="text-xs" style={{ color: '#555' }}>Review your details below and confirm to import.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: '#d1ccc0' }}>
              <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: '#e8e4da' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(107,112,64,0.1)' }}>
                  <User className="w-6 h-6" style={{ color: '#6b7040' }} />
                </div>
                <div>
                  <p className="font-black text-lg" style={{ color: '#1a1a1a' }}>{selectedTech.full_name}</p>
                  {selectedTech.reg_number && (
                    <p className="text-xs font-bold" style={{ color: '#E8A020' }}>Reg# {selectedTech.reg_number}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {selectedTech.employer && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: '#888' }} />
                    <span className="text-sm" style={{ color: '#333' }}>{selectedTech.employer}</span>
                  </div>
                )}
                {selectedTech.city && selectedTech.province && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" style={{ color: '#888' }} />
                    <span className="text-sm" style={{ color: '#333' }}>{selectedTech.city}, {selectedTech.province}</span>
                  </div>
                )}
              </div>

              {selectedTech.methods && selectedTech.methods.length > 0 && (
                <div className="pt-3 border-t" style={{ borderColor: '#e8e4da' }}>
                  <p className="text-xs font-black uppercase mb-2 flex items-center gap-1" style={{ color: '#6b7040' }}>
                    <Award className="w-3.5 h-3.5" />
                    Certifications ({selectedTech.methods.length})
                  </p>
                  <div className="space-y-2">
                    {selectedTech.methods.map((m, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div>
                          <span className="text-sm font-bold" style={{ color: '#1a1a1a' }}>{m.method}</span>
                          {m.level && <span className="text-xs ml-2" style={{ color: '#666' }}>Level {m.level}</span>}
                          {m.sector && <span className="text-xs ml-2" style={{ color: '#999' }}>· {m.sector}</span>}
                        </div>
                        {m.expiry_date && (
                          <span className="text-xs font-bold" style={{ color: '#BA7517' }}>
                            Exp: {m.expiry_date}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleConfirm}
              disabled={importing}
              className="w-full h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: '#6b7040', color: '#E8A020' }}
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {importing ? 'Importing...' : 'Confirm & Import My Data'}
            </button>

            <button
              onClick={() => { setSelectedTech(null); setResults([]); }}
              className="w-full py-3 text-sm font-bold"
              style={{ color: '#999' }}
            >
              Not me — search again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
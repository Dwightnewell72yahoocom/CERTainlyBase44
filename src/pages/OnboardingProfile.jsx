import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Search, Loader2, CheckCircle2, AlertCircle, ArrowRight, User, Building2, MapPin, Award } from 'lucide-react';

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
  const [regNumber, setRegNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [technician, setTechnician] = useState(null);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleSearch = async () => {
    const trimmed = regNumber.trim();
    if (!trimmed) return;

    setSearching(true);
    setError(null);
    setTechnician(null);

    try {
      const result = await base44.entities.NRCanTechnician.filter(
        { reg_number: trimmed },
        { limit: 1 }
      );
      if (result.items && result.items.length > 0) {
        setTechnician(result.items[0]);
      } else {
        setError(`No technician found with registration number ${trimmed}. Check the number and try again.`);
      }
    } catch (err) {
      setError('Failed to look up registration number. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = async () => {
    if (!technician) return;

    setImporting(true);
    setError(null);

    try {
      // Store nrcan_id on user profile
      await base44.auth.updateMe({
        nrcan_id: technician.reg_number,
        full_name: technician.full_name,
      });

      // Create Certification records for each method
      const certsToCreate = (technician.methods || []).map(m => {
        const category = METHOD_TO_CATEGORY[m.method] || 'other';
        return {
          technician_name: technician.full_name,
          certification_name: `${m.method} — ${METHOD_LABELS[m.method] || m.method}`,
          certification_number: technician.reg_number,
          category,
          governing_body: 'NRCan',
          scs_applicable: category !== 'ndt_cedo',
          nrcan_id: technician.reg_number,
          employer_name: technician.employer || '',
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
          Enter your NRCan registration number to auto-fill everything
        </p>
      </div>

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {/* Step 1: Reg# Entry */}
        {!technician && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border p-5 space-y-3" style={{ borderColor: '#d1ccc0' }}>
              <label className="text-sm font-black block" style={{ color: '#6b7040' }}>
                NRCan Registration Number
              </label>
              <p className="text-xs" style={{ color: '#888' }}>
                Found on your NRCan certificate or card. This pulls your name, employer, province, methods, and expiry dates automatically.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g. 13415"
                  className="flex-1 h-12 rounded-xl px-4 text-base font-bold border-2 focus:outline-none"
                  style={{ borderColor: '#d1ccc0', color: '#1a1a1a' }}
                  autoFocus
                />
                <button
                  onClick={handleSearch}
                  disabled={searching || !regNumber.trim()}
                  className="h-12 px-5 rounded-xl font-black text-sm flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: '#E8A020', color: '#6b7040' }}
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {searching ? '' : 'Look Up'}
                </button>
              </div>
              <p className="text-xs text-center" style={{ color: '#aaa' }}>
                Tip: Try your 5-digit NRCan ID number
              </p>
            </div>

            {error && (
              <div className="bg-red-50 rounded-2xl border border-red-200 p-4 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
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
        {technician && (
          <div className="space-y-4">
            {/* Found banner */}
            <div className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: 'rgba(59,109,17,0.1)' }}>
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" style={{ color: '#3B6D11' }} />
              <div>
                <p className="text-sm font-black" style={{ color: '#3B6D11' }}>Profile Found!</p>
                <p className="text-xs" style={{ color: '#555' }}>Review your details below and confirm to import.</p>
              </div>
            </div>

            {/* Profile card */}
            <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: '#d1ccc0' }}>
              <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: '#e8e4da' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(107,112,64,0.1)' }}>
                  <User className="w-6 h-6" style={{ color: '#6b7040' }} />
                </div>
                <div>
                  <p className="font-black text-lg" style={{ color: '#1a1a1a' }}>{technician.full_name}</p>
                  <p className="text-xs font-bold" style={{ color: '#E8A020' }}>Reg# {technician.reg_number}</p>
                </div>
              </div>

              <div className="space-y-2">
                {technician.employer && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" style={{ color: '#888' }} />
                    <span className="text-sm" style={{ color: '#333' }}>{technician.employer}</span>
                  </div>
                )}
                {technician.city && technician.province && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" style={{ color: '#888' }} />
                    <span className="text-sm" style={{ color: '#333' }}>{technician.city}, {technician.province}</span>
                  </div>
                )}
              </div>

              {/* Methods */}
              {technician.methods && technician.methods.length > 0 && (
                <div className="pt-3 border-t" style={{ borderColor: '#e8e4da' }}>
                  <p className="text-xs font-black uppercase mb-2 flex items-center gap-1" style={{ color: '#6b7040' }}>
                    <Award className="w-3.5 h-3.5" />
                    Certifications ({technician.methods.length})
                  </p>
                  <div className="space-y-2">
                    {technician.methods.map((m, i) => (
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

            {/* Actions */}
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
              onClick={() => { setTechnician(null); setRegNumber(''); }}
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
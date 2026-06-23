import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-advance after 3 seconds
    const t = setTimeout(() => navigate('/dashboard'), 3000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-between py-16 px-8"
      style={{ backgroundColor: '#5a5f38' }}>
      
      {/* Top: Logo placeholder */}
      <div className="flex flex-col items-center gap-3 pt-8">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: '#E8A020' }}>
          <span className="text-3xl font-black" style={{ color: '#5a5f38' }}>SS</span>
        </div>
        <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#E8A020' }}>
          Sound Solutions DataCAT
        </span>
      </div>

      {/* Center: Brand */}
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-6xl font-black leading-none tracking-tight">
          <span style={{ color: '#E8A020' }}>CERT</span><span style={{ color: '#F5EDD6' }}>ainly</span>
        </h1>
        <div className="flex items-center gap-2">
          {['COORDINATION', 'ACQUISITION', 'TRACKING'].map((word, i) => (
            <React.Fragment key={word}>
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(245,237,214,0.7)' }}>
                {word}
              </span>
              {i < 2 && <span style={{ color: '#E8A020' }} className="text-xs">·</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Bottom: CTA */}
      <div className="flex flex-col items-center gap-4 w-full">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full max-w-xs py-4 rounded-2xl text-lg font-bold shadow-lg active:scale-95 transition-transform"
          style={{ backgroundColor: '#E8A020', color: '#5a5f38' }}
        >
          Get Started
        </button>
        <span className="text-xs" style={{ color: 'rgba(245,237,214,0.5)' }}>
          A Sound Solutions product
        </span>
      </div>
    </div>
  );
}
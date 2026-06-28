import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PenLine, BarChart2, ScrollText, Search } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/experience-log', label: 'Log', icon: PenLine },
  { path: '/points', label: 'Points', icon: BarChart2 },
  { path: '/renewal-portal', label: 'Renew', icon: ScrollText },
  { path: '/nrcan-directory', label: 'Verify', icon: Search },
];

export default function BottomNav() {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t shadow-xl" style={{ backgroundColor: '#5a5f38', borderColor: 'rgba(232,160,32,0.3)' }}>
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path || (path === '/dashboard' && location.pathname === '/');
          return (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center justify-center flex-1 py-3 min-h-[60px] gap-1 transition-colors relative"
            >
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full" style={{ backgroundColor: '#E8A020' }} />
              )}
              <Icon
                className="w-5 h-5"
                style={{ color: active ? '#E8A020' : 'rgba(245,237,214,0.5)', strokeWidth: active ? 2.5 : 2 }}
              />
              <span className="text-xs font-medium" style={{ color: active ? '#E8A020' : 'rgba(245,237,214,0.5)' }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
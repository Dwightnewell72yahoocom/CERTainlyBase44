import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Award, BookOpen, Building2, RefreshCw } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Certs', icon: Award },
  { path: '/experience-log', label: 'Experience', icon: BookOpen },
  { path: '/employer-dashboard', label: 'Employer', icon: Building2 },
  { path: '/renewal-portal', label: 'Renew', icon: RefreshCw },
];

export default function BottomNav() {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg safe-area-bottom">
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center flex-1 py-3 min-h-[60px] gap-1 transition-colors ${
                active ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
              }`}
            >
              <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className={`text-xs font-medium ${active ? 'text-blue-600' : 'text-gray-500'}`}>{label}</span>
              {active && <div className="absolute bottom-0 w-8 h-0.5 bg-blue-600 rounded-t" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  return (
    <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div
          onClick={() => navigate('/')}
          className="text-2xl font-bold cursor-pointer hover:opacity-80 transition"
        >
          📚 Lager
        </div>

        {!location.pathname.startsWith('/admin/login') && (
          <nav className="flex gap-4">
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded transition"
              >
                ⚙️ Adminpanel
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

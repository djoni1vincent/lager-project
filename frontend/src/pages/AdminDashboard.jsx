import React, { useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminUsers from './AdminUsers';
import AdminItems from './AdminItems';
import AdminItemDetail from './AdminItemDetail';
import AdminFlags from './AdminFlags';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Routes>
        <Route path="/" element={<AdminOverview />} />
        <Route path="/users" element={<AdminUsers />} />
        <Route path="/items" element={<AdminItems />} />
        <Route path="/items/:id" element={<AdminItemDetail />} />
        <Route path="/flags" element={<AdminFlags />} />
      </Routes>
    </div>
  );
}

function AdminOverview() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">⚙️ Admin Dashboard</h1>
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard
          title="Users"
          icon="👥"
          onClick={() => navigate('/admin/users')}
          description="Manage users"
        />
        <AdminCard
          title="Items"
          icon="📦"
          onClick={() => navigate('/admin/items')}
          description="Manage items"
        />
        <AdminCard
          title="Flags"
          icon="🚩"
          onClick={() => navigate('/admin/flags')}
          description="View issues"
        />
        <AdminCard
          title="Settings"
          icon="⚙️"
          onClick={() => alert('Settings coming soon')}
          description="System settings"
        />
      </div>
    </div>
  );
}

function AdminCard({ title, icon, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center hover:border-slate-600 hover:bg-slate-700 transition"
    >
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </button>
  );
}

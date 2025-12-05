import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    class_year: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch(`/admin/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser(e) {
    e.preventDefault();
    try {
      const res = await fetch(`/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const newUser = await res.json();
        setUsers([...users, newUser]);
        setFormData({ name: '', barcode: '', class_year: '', role: 'user' });
        setShowAddForm(false);
        alert('Feil: ' + err.error);
      }
    } catch (err) {
      alert('Feil ved tillegg av bruker');
    }
  }

  async function handleDeleteUser(userId) {
    if (!confirm('Slette denne brukeren?')) return;

    try {
      const res = await fetch(`/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
        alert('Bruker slettet');
      } else {
        const err = await res.json();
        alert('Feil: ' + err.error);
      }
    } catch (err) {
      alert('Feil ved sletting av bruker');
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">👥 Brukeradministrasjon</h1>
        <div className="space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition"
          >
            {showAddForm ? 'Avbryt' : '➕ Legg til bruker'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
          >
            ← Tilbake
          </motion.button>
        </div>
      </div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8"
        >
          <form onSubmit={handleAddUser} className="space-y-4">
            <input
              type="text"
              placeholder="Navn"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Strekkode"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Klasseår (valgfritt)"
              value={formData.class_year}
              onChange={(e) => setFormData({ ...formData, class_year: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="user">Bruker</option>
              <option value="admin">Admin</option>
              <option value="staff">Ansatt</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.02 }}
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded font-semibold transition"
            >
              ✓ Legg til bruker
            </motion.button>
          </form>
        </motion.div>
      )}

      {loading ? (
        <p className="text-slate-400">Laster inn brukere...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(user => (
            <motion.div
              key={user.id}
              whileHover={{ y: -2 }}
              className="bg-slate-800 border border-slate-700 rounded-lg p-4"
            >
              <h3 className="font-semibold text-lg mb-2">{user.name}</h3>
              <p className="text-sm text-slate-400 mb-1">Strekkode: {user.barcode || 'Ikke tilgjengelig'}</p>
              <p className="text-sm text-slate-400 mb-1">Rolle: {user.role}</p>
              {user.class_year && <p className="text-sm text-slate-400 mb-3">Klasse: {user.class_year}</p>}
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => handleDeleteUser(user.id)}
                className="w-full py-2 text-sm bg-red-600 hover:bg-red-500 rounded transition"
              >
                🗑️ Slett
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

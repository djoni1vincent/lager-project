import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const API_BASE = 'http://127.0.0.1:5000';

export default function AdminFlags() {
  const navigate = useNavigate();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlags();
    const interval = setInterval(fetchFlags, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchFlags() {
    try {
      const res = await fetch(`${API_BASE}/flags`, {
        headers: { 'X-Auth-Token': localStorage.getItem('auth_token') || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setFlags(data);
      }
    } catch (err) {
      console.error('Error fetching flags:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolveFlag(flagId) {
    try {
      const res = await fetch(`${API_BASE}/flags/${flagId}/resolve`, {
        method: 'PUT',
        headers: { 'X-Auth-Token': localStorage.getItem('auth_token') || '' }
      });
      if (res.ok) {
        setFlags(flags.filter(f => f.id !== flagId));
        alert('Flag resolved');
      }
    } catch (err) {
      alert('Error resolving flag');
    }
  }

  const unresolvedFlags = flags.filter(f => !f.resolved);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">🚩 System Flags</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate('/admin')}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
        >
          ← Back
        </motion.button>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading flags...</p>
      ) : unresolvedFlags.length === 0 ? (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-6 text-center">
          <p className="text-emerald-300 font-semibold">✓ No flags! System is running smoothly.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {unresolvedFlags.map(flag => (
            <motion.div
              key={flag.id}
              whileHover={{ y: -2 }}
              className="bg-slate-800 border border-slate-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    {flag.flag_type === 'defect' && '🔧'}
                    {flag.flag_type === 'missing_barcode' && '🏷️'}
                    {flag.flag_type === 'overdue' && '⏰'}
                    {!['defect', 'missing_barcode', 'overdue'].includes(flag.flag_type) && '⚠️'}
                    {' '}{flag.flag_type}
                  </h3>
                  {flag.message && (
                    <p className="text-slate-300 mb-2">{flag.message}</p>
                  )}
                  <p className="text-sm text-slate-500">
                    Item: {flag.item_id || 'N/A'} | User: {flag.user_id || 'N/A'} | {new Date(flag.created_at).toLocaleString()}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleResolveFlag(flag.id)}
                  className="ml-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded transition whitespace-nowrap"
                >
                  ✓ Resolve
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

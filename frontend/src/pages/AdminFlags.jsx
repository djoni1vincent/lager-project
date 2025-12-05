import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AdminFlags() {
  const navigate = useNavigate();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFlags();
    const interval = setInterval(fetchFlags, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchFlags() {
    try {
      setError('');
      const res = await fetch(`/admin/flags`);
      if (res.ok) {
        const data = await res.json();
        setFlags(data);
      } else {
        const txt = await res.text();
        setError(txt || 'Kunne ikke laste flagg');
      }
    } catch (err) {
      console.error('Error fetching flags:', err);
      setError('Feil ved henting av flagg');
    } finally {
      setLoading(false);
    }
  }

  async function handleResolveFlag(flagId) {
    try {
      const notes = window.prompt('Beskriv hva som ble gjort (valgfritt):', '');
      const res = await fetch(`/admin/flags/${flagId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notes ? { resolution_notes: notes } : {})
      });
      if (res.ok) {
        setFlags(flags.filter(f => f.id !== flagId));
        alert('Flagg løst');
      }
    } catch (err) {
      alert('Feil ved løsning av flagg');
    }
  }

  const unresolvedFlags = flags.filter(f => !f.resolved);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">🚩 Systemflagg</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate('/admin')}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
        >
          ← Tilbake
        </motion.button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-400">{error}</p>
      )}

      {loading ? (
        <p className="text-slate-400">Laster inn flagg...</p>
      ) : unresolvedFlags.length === 0 ? (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-6 text-center">
          <p className="text-emerald-300 font-semibold">✓ Ingen flagg! Systemet kjører knirkefritt.</p>
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
                    {' '}
                    {flag.flag_type === 'defect' ? 'Defekt' :
                     flag.flag_type === 'missing_barcode' ? 'Manglende strekkode' :
                     flag.flag_type === 'overdue' ? 'Forfalt' :
                     'Ukjent'}
                  </h3>
                  {flag.message && (
                    <p className="text-slate-300 mb-2">{flag.message}</p>
                  )}
                  {flag.resolution_notes && (
                    <p className="text-xs text-emerald-300 mb-1">
                      Løsning: {flag.resolution_notes}
                    </p>
                  )}
                  <p className="text-sm text-slate-500">
                    Gjenstand: {flag.item_id || 'Ikke tilgjengelig'} | Bruker: {flag.user_id || 'Ikke tilgjengelig'} | {new Date(flag.created_at).toLocaleString()}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleResolveFlag(flag.id)}
                  className="ml-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded transition whitespace-nowrap"
                >
                  ✓ Løs
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

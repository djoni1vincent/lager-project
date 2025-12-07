import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AdminFlags() {
  const navigate = useNavigate();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [status, setStatus] = useState('under_vurdering');
  const [resolutionNotes, setResolutionNotes] = useState('');

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

  function openStatusModal(flag) {
    setSelectedFlag(flag);
    setStatus(flag.status || 'under_vurdering');
    setResolutionNotes(flag.resolution_notes || '');
    setShowStatusModal(true);
  }

  async function saveFlagStatus() {
    if (!selectedFlag) return;

    try {
      const res = await fetch(`/admin/flags/${selectedFlag.id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          status: status,
          resolution_notes: resolutionNotes.trim() || undefined
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Kunne ikke oppdatere flagg');
      }

      await fetchFlags();
      setShowStatusModal(false);
      setSelectedFlag(null);
      alert('Flagg oppdatert!');
    } catch (err) {
      alert(err.message || 'Feil ved oppdatering av flagg');
      console.error('Update flag error:', err);
    }
  }

  const unresolvedFlags = flags.filter(f => {
    const flagStatus = f.status || (f.resolved ? 'ferdig' : 'under_vurdering');
    return flagStatus === 'under_vurdering';
  });

  const resolvedFlags = flags.filter(f => {
    const flagStatus = f.status || (f.resolved ? 'ferdig' : 'under_vurdering');
    return flagStatus === 'ferdig';
  });

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
      ) : (
        <div className="space-y-6">
          {/* Unresolved flags - shown first */}
          {unresolvedFlags.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-yellow-400">🔔 Under vurdering ({unresolvedFlags.length})</h2>
              <div className="space-y-4">
                {unresolvedFlags.map(flag => (
                  <motion.div
                    key={flag.id}
                    whileHover={{ y: -2 }}
                    className="bg-slate-800 border border-yellow-600 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {flag.flag_type === 'return_message' && '📬'}
                          {flag.flag_type === 'defect' && '🔧'}
                          {flag.flag_type === 'missing_barcode' && '🏷️'}
                          {flag.flag_type === 'overdue' && '⏰'}
                          {!['return_message', 'defect', 'missing_barcode', 'overdue'].includes(flag.flag_type) && '⚠️'}
                          <h3 className="font-semibold text-lg">
                            {flag.flag_type === 'return_message' ? 'Melding ved retur' :
                             flag.flag_type === 'defect' ? 'Defekt' :
                             flag.flag_type === 'missing_barcode' ? 'Manglende strekkode' :
                             flag.flag_type === 'overdue' ? 'Forfalt' :
                             'Ukjent'}
                          </h3>
                          <span className="px-2 py-1 bg-yellow-900/40 text-yellow-300 text-xs rounded">Under vurdering</span>
                        </div>
                        {flag.message && (
                          <div className="bg-slate-700/50 rounded p-3 mb-2">
                            <p className="text-slate-200 whitespace-pre-wrap">{flag.message}</p>
                          </div>
                        )}
                        <div className="text-sm text-slate-400 space-y-1">
                          {flag.item_name && (
                            <div>Gjenstand: <span className="text-slate-300">{flag.item_name}</span> {flag.item_barcode && <span className="text-slate-500">({flag.item_barcode})</span>}</div>
                          )}
                          {flag.user_name && (
                            <div>Bruker: <span className="text-slate-300">{flag.user_name}</span> {flag.class_year && <span className="text-slate-500">({flag.class_year})</span>}</div>
                          )}
                          <div>Opprettet: {new Date(flag.created_at).toLocaleString('no-NO')}</div>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => openStatusModal(flag)}
                        className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition whitespace-nowrap"
                      >
                        Håndter
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Resolved flags */}
          {resolvedFlags.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-emerald-400">✓ Ferdig behandlet ({resolvedFlags.length})</h2>
              <div className="space-y-4">
                {resolvedFlags.map(flag => (
                  <motion.div
                    key={flag.id}
                    className="bg-slate-800 border border-emerald-700 rounded-lg p-4 opacity-75"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {flag.flag_type === 'return_message' && '📬'}
                          {flag.flag_type === 'defect' && '🔧'}
                          {flag.flag_type === 'missing_barcode' && '🏷️'}
                          {flag.flag_type === 'overdue' && '⏰'}
                          {!['return_message', 'defect', 'missing_barcode', 'overdue'].includes(flag.flag_type) && '⚠️'}
                          <h3 className="font-semibold text-lg">
                            {flag.flag_type === 'return_message' ? 'Melding ved retur' :
                             flag.flag_type === 'defect' ? 'Defekt' :
                             flag.flag_type === 'missing_barcode' ? 'Manglende strekkode' :
                             flag.flag_type === 'overdue' ? 'Forfalt' :
                             'Ukjent'}
                          </h3>
                          <span className="px-2 py-1 bg-emerald-900/40 text-emerald-300 text-xs rounded">Ferdig</span>
                        </div>
                        {flag.message && (
                          <div className="bg-slate-700/30 rounded p-3 mb-2">
                            <p className="text-slate-300 whitespace-pre-wrap">{flag.message}</p>
                          </div>
                        )}
                        {flag.resolution_notes && (
                          <div className="bg-emerald-900/20 border border-emerald-800 rounded p-3 mb-2">
                            <p className="text-emerald-200 text-sm whitespace-pre-wrap">
                              <strong>Kommentar:</strong> {flag.resolution_notes}
                            </p>
                          </div>
                        )}
                        <div className="text-sm text-slate-500 space-y-1">
                          {flag.item_name && (
                            <div>Gjenstand: {flag.item_name}</div>
                          )}
                          {flag.user_name && (
                            <div>Bruker: {flag.user_name}</div>
                          )}
                          <div>Behandlet: {flag.resolved_at ? new Date(flag.resolved_at).toLocaleString('no-NO') : 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {unresolvedFlags.length === 0 && resolvedFlags.length === 0 && (
            <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-6 text-center">
              <p className="text-emerald-300 font-semibold">✓ Ingen flagg! Systemet kjører knirkefritt.</p>
            </div>
          )}
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && selectedFlag && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold mb-4">Håndter flagg</h3>

            <div className="mb-4">
              <div className="bg-slate-700/50 rounded p-3 mb-3">
                <p className="text-slate-200 whitespace-pre-wrap">{selectedFlag.message}</p>
              </div>
              {selectedFlag.item_name && (
                <p className="text-sm text-slate-400 mb-1">Gjenstand: {selectedFlag.item_name}</p>
              )}
              {selectedFlag.user_name && (
                <p className="text-sm text-slate-400 mb-1">Bruker: {selectedFlag.user_name}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="under_vurdering">Under vurdering</option>
                <option value="ferdig">Ferdig</option>
                <option value="avvist">Avvist</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-2">Kommentar (valgfritt)</label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                placeholder="Skriv en kommentar om hva som ble gjort..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedFlag(null);
                  setStatus('under_vurdering');
                  setResolutionNotes('');
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded transition"
              >
                Avbryt
              </button>
              <button
                onClick={saveFlagStatus}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded transition"
              >
                Lagre
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const AdminLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [report, setReport] = useState('');

  useEffect(() => {
    fetchLoans();
  }, []);

  async function fetchLoans() {
    try {
      const res = await fetch('/admin/loans', {
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Kunne ikke hente lån');
      }

      const data = await res.json();
      setLoans(data);
    } catch (err) {
      setError(err.message || 'Feil ved henting av lån');
    } finally {
      setLoading(false);
    }
  }

  async function handleReturn(loanId) {
    if (!window.confirm('Er du sikker på at du vil returnere dette lånet?')) {
      return;
    }

    try {
      const loan = loans.find(l => l.id === loanId);
      const res = await fetch(`/loans/${loanId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: loan?.user_id })
      });

      let errorMessage = 'Kunne ikke returnere lån';

      if (!res.ok) {
        try {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            errorMessage = data.error || errorMessage;
          } else {
            const text = await res.text();
            errorMessage = text || errorMessage;
          }
        } catch (parseErr) {
          errorMessage = `Feil ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      await fetchLoans(); // Refresh to get updated list
      alert('Lån returnert!');
    } catch (err) {
      alert(err.message || 'Feil ved retur');
      console.error('Return error:', err);
    }
  }

  function openDeliveryModal(loan) {
    setSelectedLoan(loan);
    setDeliveryStatus(loan.delivery_status || '');
    setDeliveryNotes(loan.delivery_notes || '');
    setShowDeliveryModal(true);
  }

  function openReportModal(loan) {
    setSelectedLoan(loan);
    setReport(loan.report || '');
    setShowReportModal(true);
  }

  async function saveDelivery() {
    if (!selectedLoan) return;

    try {
      const res = await fetch(`/admin/loans/${selectedLoan.id}/delivery`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          delivery_status: deliveryStatus,
          delivery_notes: deliveryNotes
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Kunne ikke oppdatere levering');
      }

      await fetchLoans();
      setShowDeliveryModal(false);
      alert('Levering oppdatert!');
    } catch (err) {
      alert(err.message || 'Feil ved oppdatering');
    }
  }

  async function saveReport() {
    if (!selectedLoan) return;

    try {
      const res = await fetch(`/admin/loans/${selectedLoan.id}/report`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ report })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Kunne ikke oppdatere rapport');
      }

      await fetchLoans();
      setShowReportModal(false);
      alert('Rapport oppdatert!');
    } catch (err) {
      alert(err.message || 'Feil ved oppdatering');
    }
  }

  if (loading) {
    return <p className="text-slate-300">Laster lån...</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Aktive lån</h2>

      {loans.length === 0 ? (
        <p className="text-slate-400">Ingen aktive lån.</p>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Gjenstand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Bruker</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Forfallsdato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Levering</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Handlinger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loans.map((loan) => {
                const dueDate = new Date(loan.due_date);
                const today = new Date();
                const isOverdue = dueDate < today;

                return (
                  <tr key={loan.id} className={isOverdue ? 'bg-red-900/20' : ''}>
                    <td className="px-6 py-4 text-sm font-medium text-white">{loan.item_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {loan.user_name}
                      {loan.class_year && <span className="text-slate-400 ml-2">({loan.class_year})</span>}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isOverdue ? 'text-red-400 font-semibold' : 'text-slate-300'}`}>
                      {dueDate.toLocaleDateString('no-NO')}
                      {isOverdue && <span className="ml-2 text-xs bg-red-900/40 px-2 py-1 rounded">FORFALT</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {loan.delivery_status || <span className="text-slate-500">Ikke satt</span>}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => openDeliveryModal(loan)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Levering
                      </button>
                      <button
                        onClick={() => openReportModal(loan)}
                        className="text-yellow-400 hover:text-yellow-300"
                      >
                        Rapport
                      </button>
                      <button
                        onClick={() => handleReturn(loan.id)}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        Returner
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && selectedLoan && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">Oppdater levering</h3>
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-2">Leveringsstatus</label>
              <select
                value={deliveryStatus}
                onChange={(e) => setDeliveryStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              >
                <option value="">Velg status...</option>
                <option value="Ikke levert">Ikke levert</option>
                <option value="Under levering">Under levering</option>
                <option value="Levert">Levert</option>
                <option value="Kansellert">Kansellert</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-2">Leveringsnotater</label>
              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                placeholder="Notater om leveringen..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded"
              >
                Avbryt
              </button>
              <button
                onClick={saveDelivery}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded"
              >
                Lagre
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && selectedLoan && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">Skriv rapport</h3>
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-2">Rapport</label>
              <textarea
                value={report}
                onChange={(e) => setReport(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                placeholder="Skriv en rapport om dette lånet..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded"
              >
                Avbryt
              </button>
              <button
                onClick={saveReport}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded"
              >
                Lagre
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminLoans;

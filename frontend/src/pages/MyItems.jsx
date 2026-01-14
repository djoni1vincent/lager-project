import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MyItems = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, isUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isUser) {
      navigate('/user/login');
      return;
    }
    fetchLoans();
  }, [isUser, user]);

  async function fetchLoans() {
    try {
      const res = await fetch('/users/me/loans', {
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

  const [returnMessage, setReturnMessage] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  function openReturnModal(loanId) {
    setSelectedLoanId(loanId);
    setReturnMessage('');
    setShowReturnModal(true);
  }

  async function handleReturn(loanId) {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/loans/${loanId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          return_message: returnMessage.trim() || undefined
        })
      });

      let errorMessage = 'Kunne ikke returnere gjenstand';
      let responseData = null;

      // Try to parse response as JSON
      try {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          responseData = await res.json();
        } else {
          const text = await res.text();
          console.error('Non-JSON response:', text);
          errorMessage = text || `Server returnerte ikke JSON (${res.status})`;
        }
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr);
        errorMessage = `Kunne ikke lese svar fra server: ${parseErr.message}`;
      }

      if (!res.ok) {
        errorMessage = responseData?.error || responseData?.message || errorMessage;
        if (responseData?.debug) {
          console.error('Debug info:', responseData.debug);
          if (!responseData.debug.has_session) {
            errorMessage = 'Du er ikke innlogget. Vennligst logg inn på nytt.';
          }
        }
        throw new Error(errorMessage);
      }

      // Remove returned loan from list
      setLoans(loans.filter(loan => loan.id !== loanId));
      setShowReturnModal(false);
      setReturnMessage('');
      setSelectedLoanId(null);
      alert('Gjenstand returnert!' + (returnMessage.trim() ? ' Meldingen din er sendt til administrator.' : ''));
      await fetchLoans(); // Refresh to get updated list
    } catch (err) {
      setError(err.message || 'Feil ved retur');
      console.error('Return error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading && loans.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-slate-300">Laster...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Mine utlånte gjenstander</h1>
        <p className="text-slate-300">Her kan du se og returnere gjenstander du har lånt</p>
      </motion.div>

      {error && (
        <div className="mb-4 text-red-400 bg-red-900/40 border border-red-700 rounded px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {loans.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center"
        >
          <p className="text-slate-400 text-lg">Du har ingen utlånte gjenstander for øyeblikket.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {loans.map(loan => {
            const dueDate = new Date(loan.due_date);
            const today = new Date();
            const isOverdue = dueDate < today;
            const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

            return (
              <motion.div
                key={loan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-slate-800 border rounded-lg p-6 ${
                  isOverdue ? 'border-red-600' : daysUntilDue <= 3 ? 'border-yellow-600' : 'border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{loan.item_name}</h3>
                    <div className="space-y-1 text-sm text-slate-300">
                      {loan.item_barcode && (
                        <div>Strekkode: {loan.item_barcode}</div>
                      )}
                      {loan.category && (
                        <div>Kategori: {loan.category}</div>
                      )}
                      {loan.location && (
                        <div>Plassering: {loan.location}</div>
                      )}
                      <div>Lånt: {new Date(loan.loan_date).toLocaleDateString('no-NO')}</div>
                      <div className={isOverdue ? 'text-red-400 font-semibold' : daysUntilDue <= 3 ? 'text-yellow-400' : ''}>
                        Forfallsdato: {dueDate.toLocaleDateString('no-NO')}
                        {isOverdue && (
                          <span className="ml-2 px-2 py-1 bg-red-900/40 rounded text-xs">FORFALT</span>
                        )}
                        {!isOverdue && daysUntilDue <= 3 && (
                          <span className="ml-2 px-2 py-1 bg-yellow-900/40 rounded text-xs">
                            {daysUntilDue === 0 ? 'I dag' : `${daysUntilDue} dager igjen`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => openReturnModal(loan.id)}
                    disabled={loading}
                    className="ml-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded text-white font-semibold transition"
                  >
                    Returner
                  </button>
                </div>
              </motion.div>
            );
          }          )}
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">Returner gjenstand</h3>
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-2">
                Melding til administrator (valgfritt):
              </label>
              <textarea
                value={returnMessage}
                onChange={(e) => setReturnMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                placeholder="Hvis gjenstanden har problemer eller du vil si noe, skriv det her..."
              />
              <p className="text-xs text-slate-400 mt-1">
                Meldingen blir sendt til administrator for gjennomgang.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnMessage('');
                  setSelectedLoanId(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded transition"
              >
                Avbryt
              </button>
              <button
                onClick={() => handleReturn(selectedLoanId)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded transition"
              >
                {loading ? 'Returnerer...' : 'Returner'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MyItems;

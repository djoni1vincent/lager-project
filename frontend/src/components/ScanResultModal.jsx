import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function ScanResultModal({ result, onClose, onAction }) {
  const [step, setStep] = useState('view'); // 'view', 'selectItem', 'loanAction', 'confirm'
  const [selectedItem, setSelectedItem] = useState(null);
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleTakeLoan() {
    if (!selectedItem || !dueDate) {
      setError('Please select item and due date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_barcode: result.user.barcode,
          item_id: selectedItem.id,
          due_date: dueDate
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create loan');
      }

      alert(`✓ Loan created! Item due on ${dueDate}`);
      onAction?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReturnLoan(loanId) {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/loans/${loanId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_barcode: result.user.barcode })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to return loan');
      }

      alert('✓ Item returned!');
      onAction?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto"
      >
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {result.type === 'user' ? '👤 ' : '📦 '}
            {result.type === 'user' ? result.user.name : result.item.name}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Item scanned */}
          {result.type === 'item' && (
            <div>
              <div className="mb-4">
                <p className="text-slate-400 mb-2">Barcode: {result.item.barcode || 'N/A'}</p>
                {result.item.description && <p className="text-slate-300 mb-2">{result.item.description}</p>}
                <p className="text-sm text-slate-500">Location: {result.item.location || 'N/A'}</p>
              </div>

              {result.loaned ? (
                <div className="bg-sky-900/30 border border-sky-700 rounded p-4 mb-4">
                  <p className="font-semibold text-sky-300 mb-2">Currently loaned to: {result.loaned_to.name}</p>
                  <p className="text-sm text-slate-300 mb-4">Due date: {result.loan.due_date}</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleReturnLoan(result.loan.id)}
                    disabled={loading}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 rounded font-semibold transition"
                  >
                    {loading ? '⏳ Processing...' : '✓ Return Item'}
                  </motion.button>
                </div>
              ) : (
                <div className="bg-emerald-900/30 border border-emerald-700 rounded p-4 mb-4">
                  <p className="font-semibold text-emerald-300 mb-4">Item is available!</p>
                  <p className="text-slate-400 mb-4">Scan user barcode to borrow this item</p>
                </div>
              )}
            </div>
          )}

          {/* User scanned */}
          {result.type === 'user' && (
            <div>
              <div className="mb-4">
                <p className="text-slate-400 mb-2">Barcode: {result.user.barcode}</p>
                {result.user.class_year && <p className="text-slate-400">Class: {result.user.class_year}</p>}
              </div>

              {/* Active loans */}
              {result.active_loans.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-sky-400 mb-3">Active Loans ({result.active_loans.length})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {result.active_loans.map(loan => (
                      <div key={loan.id} className="bg-slate-700/50 rounded p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{loan.item_name}</p>
                          <p className="text-sm text-slate-400">Due: {loan.due_date}</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={() => handleReturnLoan(loan.id)}
                          disabled={loading}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 rounded text-sm transition"
                        >
                          {loading ? '...' : 'Return'}
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Take new loan */}
              <div className="border-t border-slate-700 pt-6">
                <h3 className="font-semibold text-emerald-400 mb-4">Borrow New Item</h3>
                {step === 'view' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setStep('selectItem')}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded font-semibold transition"
                  >
                    📦 Select Item to Borrow
                  </motion.button>
                )}

                {step === 'selectItem' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Search item name or barcode..."
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-slate-400 text-sm">Or scan item barcode directly</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Unknown barcode */}
          {result.type === 'unknown' && (
            <div className="bg-red-900/30 border border-red-700 rounded p-4">
              <p className="text-red-300 font-semibold mb-2">❌ Barcode not found</p>
              <p className="text-sm text-slate-400">"{result.barcode}" is not registered in the system.</p>
              <p className="text-sm text-slate-500 mt-2">Contact admin to add this item or user.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded p-3 text-red-200">
              {error}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

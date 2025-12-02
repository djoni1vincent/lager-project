import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import ScanResultModal from './ScanResultModal';

export default function ScanBox({ onScanned }) {
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  async function handleScan(e) {
    e.preventDefault();
    if (!barcode.trim()) {
      setError('Please enter a barcode');
      return;
    }

    setScanning(true);
    setError('');

    try {
      const res = await fetch(`/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: barcode.trim() })
      });

      if (!res.ok) throw new Error('Scan failed');
      const data = await res.json();
      setScanResult(data);
      setBarcode('');
      onScanned?.(data);
    } catch (err) {
      setError(err.message);
      setBarcode('');
    } finally {
      setScanning(false);
      inputRef.current?.focus();
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800 border-2 border-slate-700 rounded-lg p-8 max-w-2xl mx-auto"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">📱 Scan Barcode</h2>
          <p className="text-slate-400">Scan item or user barcode</p>
        </div>

        <form onSubmit={handleScan} className="space-y-4">
          <motion.div
            whileFocus={{ scale: 1.02 }}
            className="relative"
          >
            <input
              ref={inputRef}
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Enter or scan barcode..."
              disabled={scanning}
              autoFocus
              className="w-full px-4 py-4 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
            />
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-900/50 border border-red-700 text-red-200 rounded px-4 py-2"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={scanning}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-semibold transition"
          >
            {scanning ? '🔍 Scanning...' : '✓ Scan'}
          </motion.button>
        </form>

        <div className="mt-6 text-center text-slate-400 text-sm">
          <p>Focus on this box and scan any barcode</p>
        </div>
      </motion.div>

      {scanResult && (
        <ScanResultModal
          result={scanResult}
          onClose={() => setScanResult(null)}
          onAction={() => {
            setScanResult(null);
            onScanned?.();
          }}
        />
      )}
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ScanBox from '../components/ScanBox';
import ItemCard from '../components/ItemCard';

const API_BASE = 'http://127.0.0.1:5000';

export default function HomePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [activeLoansCount, setActiveLoansCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const itemsRes = await fetch(`${API_BASE}/items`);

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData);
        const loanedCount = itemsData.filter(i => i.loaned_to).length;
        setActiveLoansCount(loanedCount);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }

  const availableItems = items.filter(i => !i.loaned_to);
  const loanedItems = items.filter(i => i.loaned_to);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header section */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <h1 className="text-4xl font-bold mb-2">📚 Lager System</h1>
        <p className="text-slate-300">Scan a barcode to borrow or return items</p>
      </motion.div>

      {/* Top stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="text-3xl font-bold text-emerald-400">{items.length}</div>
          <div className="text-slate-300">Total Items</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="text-3xl font-bold text-sky-400">{activeLoansCount}</div>
          <div className="text-slate-300">Active Loans</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="text-3xl font-bold text-emerald-500">{availableItems.length}</div>
          <div className="text-slate-300">Available Now</div>
        </div>
      </motion.div>

      {/* Main scan section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <ScanBox onScanned={() => fetchData()} />
      </motion.div>

      {/* Admin login button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-12"
      >
        <button
          onClick={() => navigate('/admin/login')}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition mr-4"
        >
          🔐 Admin Login
        </button>
        <button
          onClick={() => alert("Not implemented yet")}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
        >
          🗂️ Navigate by Category
        </button>
      </motion.div>

      {/* Items sections */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {/* Available items */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-emerald-400">✓ Available Items</h2>
          {availableItems.length === 0 ? (
            <p className="text-slate-400">No items available right now.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableItems.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Loaned items */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-sky-400">🔄 Currently Loaned</h2>
          {loanedItems.length === 0 ? (
            <p className="text-slate-400">No loaned items.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loanedItems.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

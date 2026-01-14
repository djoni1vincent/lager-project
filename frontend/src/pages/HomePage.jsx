import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ScanBox from '../components/ScanBox';
import ItemCard from '../components/ItemCard';

export default function HomePage() {
  const navigate = useNavigate();
  const { isUser, user } = useAuth();
  const [items, setItems] = useState([]);
  const [activeLoansCount, setActiveLoansCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all | available | loaned
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const itemsRes = await fetch(`/items`);

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

  const categories = Array.from(
    new Set(items.map(i => i.category).filter(Boolean))
  ).sort();

  const filtered = items.filter((i) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      (i.name && i.name.toLowerCase().includes(searchLower)) ||
      (i.barcode && i.barcode.toLowerCase().includes(searchLower));

    const matchesCategory =
      categoryFilter === 'all' || i.category === categoryFilter;

    const loaned = Boolean(i.loaned_to);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'available' && !loaned) ||
      (statusFilter === 'loaned' && loaned);

    return matchesSearch && matchesCategory && matchesStatus;
  });


  const availableItems = filtered.filter(i => !i.loaned_to);
  const loanedItems = filtered.filter(i => i.loaned_to);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-400 bg-clip-text text-transparent">
          📚 Lagersystem
        </h1>
        <p className="text-slate-300 text-lg">Skann en strekkode for å låne eller returnere gjenstander</p>
      </motion.div>

      {/* Top stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <motion.div
          whileHover={{ scale: 1.05, y: -4 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500/30 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              {items.length}
            </div>
            <div className="text-3xl">📦</div>
          </div>
          <div className="text-slate-400 font-medium">Totalt antall gjenstander</div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05, y: -4 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-sky-500/10 hover:border-sky-500/30 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-sky-300 bg-clip-text text-transparent">
              {activeLoansCount}
            </div>
            <div className="text-3xl">🔄</div>
          </div>
          <div className="text-slate-400 font-medium">Aktive lån</div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05, y: -4 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/30 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
              {availableItems.length}
            </div>
            <div className="text-3xl">✓</div>
          </div>
          <div className="text-slate-400 font-medium">Tilgjengelig nå</div>
        </motion.div>
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

      {/* Login buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap justify-center gap-4 mb-12"
      >
        {!isUser && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/user/login')}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl transition-all text-white font-semibold shadow-lg shadow-emerald-500/20"
          >
            👤 Logg inn
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/admin/login')}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-xl transition-all text-white font-semibold shadow-lg shadow-purple-500/20"
        >
          🔐 Admin Pålogging
        </motion.button>
      </motion.div>

      {/* Filters & search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-8 flex flex-col md:flex-row md:items-end gap-4"
      >
        <div className="flex-1">
          <label className="block text-sm text-slate-300 mb-1">Søk</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Navn eller strekkode..."
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Alle</option>
            <option value="available">Tilgjengelig</option>
            <option value="loaned">Utlånt</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Kategori</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Alle</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Items sections */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {/* Available items */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"></div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              ✓ Tilgjengelige gjenstander
            </h2>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-sm font-semibold rounded-full border border-emerald-500/30">
              {availableItems.length}
            </span>
          </div>
          {availableItems.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
              <p className="text-slate-400">Ingen gjenstander tilgjengelig akkurat nå.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={() => navigate(`/items/${item.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Loaned items */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"></div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
              🔄 For tiden utlånt
            </h2>
            <span className="px-3 py-1 bg-orange-500/20 text-orange-300 text-sm font-semibold rounded-full border border-orange-500/30">
              {loanedItems.length}
            </span>
          </div>
          {loanedItems.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
              <p className="text-slate-400">Ingen utlånte gjenstander.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loanedItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={() => navigate(`/items/${item.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

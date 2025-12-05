import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ScanBox from '../components/ScanBox';
import ItemCard from '../components/ItemCard';

export default function HomePage() {
  const navigate = useNavigate();
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
    const matchesSearch =
      !search ||
      (i.name && i.name.toLowerCase().includes(search.toLowerCase())) ||
      (i.barcode && i.barcode.toLowerCase().includes(search.toLowerCase()));

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
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <h1 className="text-4xl font-bold mb-2">📚 Lagersystem</h1>
        <p className="text-slate-300">Skann en strekkode for å låne eller returnere gjenstander</p>
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
          <div className="text-slate-300">Totalt antall gjenstander</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="text-3xl font-bold text-sky-400">{activeLoansCount}</div>
          <div className="text-slate-300">Aktive lån</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="text-3xl font-bold text-emerald-500">{availableItems.length}</div>
          <div className="text-slate-300">Tilgjengelig nå</div>
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
          🔐 Admin Pålogging
        </button>
        <button
          onClick={() => navigate('/scan')}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
        >
          🗂️ Naviger etter kategori
        </button>
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
          <h2 className="text-2xl font-bold mb-6 text-emerald-400">✓ Tilgjengelige gjenstander</h2>
          {availableItems.length === 0 ? (
            <p className="text-slate-400">Ingen gjenstander tilgjengelig akkurat nå.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <h2 className="text-2xl font-bold mb-6 text-sky-400">🔄 For tiden utlånt</h2>
          {loanedItems.length === 0 ? (
            <p className="text-slate-400">Ingen utlånte gjenstander.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

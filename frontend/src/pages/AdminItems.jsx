import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AdminItems() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: '',
    location: '',
    description: '',
    quantity: 1
  });

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    try {
      const res = await fetch(`/admin/items`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  }

  const categories = Array.from(
    new Set(items.map(i => i.category).filter(Boolean))
  ).sort();

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !search ||
      (item.name && item.name.toLowerCase().includes(search.toLowerCase())) ||
      (item.barcode && item.barcode.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  async function handleAddItem(e) {
    e.preventDefault();
    try {
      const res = await fetch(`/admin/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const newItem = await res.json();
        setItems([...items, newItem]);
        setFormData({ name: '', barcode: '', category: '', location: '', description: '', quantity: 1 });
        setShowAddForm(false);
        alert('Item added!');
      } else {
        const err = await res.json();
        alert('Error: ' + err.error);
      }
    } catch (err) {
      alert('Error adding item');
    }
  }

  async function handleDeleteItem(itemId) {
    if (!confirm('Delete this item?')) return;

    try {
      const res = await fetch(`/admin/items/${itemId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setItems(items.filter(i => i.id !== itemId));
        alert('Item deleted');
      } else {
        const err = await res.json();
        alert('Error: ' + err.error);
      }
    } catch (err) {
      alert('Error deleting item');
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">📦 Item Management</h1>
        <div className="space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition"
          >
            {showAddForm ? 'Cancel' : '➕ Add Item'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
          >
            ← Back
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm text-slate-300 mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or barcode..."
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8"
        >
          <form onSubmit={handleAddItem} className="space-y-4">
            <input
              type="text"
              placeholder="Item Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Barcode"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              rows={2}
            />
            <input
              type="number"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded font-semibold transition"
            >
              ✓ Add Item
            </motion.button>
          </form>
        </motion.div>
      )}

      {loading ? (
        <p className="text-slate-400">Loading items...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <motion.div
              key={item.id}
              whileHover={{ y: -2 }}
              className="bg-slate-800 border border-slate-700 rounded-lg p-4"
            >
              <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
              <p className="text-sm text-slate-400 mb-1">Barcode: {item.barcode || 'N/A'}</p>
              <p className="text-sm text-slate-400 mb-1">Category: {item.category || 'N/A'}</p>
              <p className="text-sm text-slate-400 mb-1">Location: {item.location || 'N/A'}</p>
              <p className="text-sm text-emerald-400 font-semibold mb-3">Qty: {item.quantity}</p>
              <div className="flex gap-2 mt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => navigate(`/admin/items/${item.id}`)}
                  className="flex-1 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded transition"
                >
                  ✏️ Details
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleDeleteItem(item.id)}
                  className="flex-1 py-2 text-sm bg-red-600 hover:bg-red-500 rounded transition"
                >
                  🗑️ Delete
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

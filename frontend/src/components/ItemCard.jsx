import React from 'react';
import { motion } from 'framer-motion';

export default function ItemCard({ item }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition"
    >
      <h3 className="font-semibold text-white mb-2 truncate">{item.name}</h3>
      {item.description && (
        <p className="text-sm text-slate-400 mb-3 truncate">{item.description}</p>
      )}
      <div className="flex justify-between items-center text-sm text-slate-300">
        <span>📦 Qty: {item.quantity}</span>
        {item.loaned_to && (
          <span className="text-orange-400">🔄 {item.loaned_to}</span>
        )}
      </div>
      {item.category && (
        <div className="mt-3 text-xs text-slate-500">
          Category: {item.category}
        </div>
      )}
    </motion.div>
  );
}

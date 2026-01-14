import React from 'react';
import { motion } from 'framer-motion';

export default function ItemCard({ item, onClick }) {
  const isAvailable = !item.loaned_to && item.quantity > 0;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative bg-gradient-to-br from-slate-800 to-slate-900 border rounded-xl p-5 transition-all shadow-lg ${
        isAvailable
          ? 'border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-emerald-500/20'
          : 'border-slate-700/50 hover:border-slate-600'
      } ${
        onClick ? 'cursor-pointer' : ''
      } overflow-hidden`}
    >
      {/* Decorative gradient overlay */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${
        isAvailable ? 'bg-emerald-500' : 'bg-slate-600'
      }`} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-lg text-white truncate flex-1 pr-2">{item.name}</h3>
          {isAvailable && (
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-500/30 whitespace-nowrap">
              Tilgjengelig
            </span>
          )}
          {item.loaned_to && (
            <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs font-semibold rounded-full border border-orange-500/30 whitespace-nowrap">
              Utlånt
            </span>
          )}
        </div>

        {item.description && (
          <p className="text-sm text-slate-400 mb-4 line-clamp-2">{item.description}</p>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 text-sm">📦</span>
            <span className="text-sm font-semibold text-slate-200">
              {item.quantity} {item.quantity === 1 ? 'stk' : 'stk'}
            </span>
          </div>
          {item.loaned_to && (
            <div className="flex items-center gap-2">
              <span className="text-orange-400 text-xs">🔄</span>
              <span className="text-xs text-orange-300 truncate max-w-[120px]">{item.loaned_to}</span>
            </div>
          )}
        </div>

        {item.category && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              {item.category}
            </span>
          </div>
        )}

        {item.barcode && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-slate-500">📊</span>
            <code className="text-xs font-mono bg-slate-900/50 px-2 py-1 rounded border border-slate-700 text-slate-400">
              {item.barcode}
            </code>
          </div>
        )}
      </div>
    </motion.div>
  );
}

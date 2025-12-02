import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-slate-400 mb-8">Page not found</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition"
        >
          ← Back to Home
        </motion.button>
      </motion.div>
    </div>
  );
}

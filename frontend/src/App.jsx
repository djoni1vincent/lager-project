import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ItemDetail from './pages/ItemDetail';
import ScanPage from './pages/ScanPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

function AppContent() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      <Header />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/items/:id" element={<ItemDetail />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

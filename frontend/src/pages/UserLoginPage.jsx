import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const UserLoginPage = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [classYear, setClassYear] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { userLogin } = useAuth();
  const navigate = useNavigate();

  // Common class years
  const classYears = ['VG1', 'VG2', 'VG3'];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError('');
    setUsers([]);
    setSelectedUser(null);
    setLoading(true);

    try {
      const res = await fetch('/users/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() })
      });

      if (!res.ok) {
        throw new Error('Søk mislyktes');
      }

      const foundUsers = await res.json();

      if (foundUsers.length === 0) {
        // No users found - new user registration
        setIsNewUser(true);
        setSelectedUser(null);
      } else if (foundUsers.length === 1) {
        // Single match - show password form
        setSelectedUser(foundUsers[0]);
        setIsNewUser(false);
      } else {
        // Multiple matches - show selection
        setUsers(foundUsers);
        setIsNewUser(false);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Feil ved søk etter bruker');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (userName, userId = null, userPassword = null, userClassYear = null) => {
    setLoading(true);
    setError('');

    try {
      await userLogin(userName, userId, userPassword || password, userClassYear || classYear);
      navigate('/');
    } catch (err) {
      const errorMsg = err.message || err;
      setError(errorMsg.includes('passord') ? 'Feil passord' : errorMsg.includes('påkre') ? errorMsg : 'Feil ved innlogging: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setUsers([]);
    setIsNewUser(false);
    setPassword('');
  };

  const handleBackToSearch = () => {
    setSelectedUser(null);
    setIsNewUser(false);
    setPassword('');
    setClassYear('');
    setError('');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Brukerinnlogging</h1>
        <p className="text-slate-300">Logg inn eller opprett ny bruker</p>
      </motion.div>

      {!selectedUser && !isNewUser && (
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSearch}
          className="bg-slate-800 border border-slate-700 rounded-lg p-6"
        >
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm text-slate-300 mb-2">
              Ditt navn
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Skriv inn navn..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded text-white font-semibold transition"
          >
            {loading ? 'Søker...' : 'Søk'}
          </button>
        </motion.form>
      )}

      {(selectedUser || isNewUser) && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 border border-slate-700 rounded-lg p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (isNewUser) {
              handleLogin(name.trim(), null, password, classYear);
            } else {
              handleLogin(selectedUser.name, selectedUser.id, password, null);
            }
          }}
        >
          {selectedUser && (
            <div className="mb-4 pb-4 border-b border-slate-700">
              <div className="font-medium text-lg">{selectedUser.name}</div>
              {selectedUser.class_year && (
                <div className="text-sm text-slate-400">Klasse: {selectedUser.class_year}</div>
              )}
            </div>
          )}

          {isNewUser && (
            <>
              <div className="mb-4">
                <label className="block text-sm text-slate-300 mb-2">
                  Navn: {name}
                </label>
              </div>
              <div className="mb-4">
                <label htmlFor="classYear" className="block text-sm text-slate-300 mb-2">
                  Velg klasse *
                </label>
                <select
                  id="classYear"
                  value={classYear}
                  onChange={(e) => setClassYear(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Velg klasse...</option>
                  {classYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm text-slate-300 mb-2">
              {isNewUser ? 'Velg passord *' : 'Passord *'}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isNewUser ? "Velg et passord..." : "Skriv inn passord..."}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              required
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBackToSearch}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white font-semibold transition"
            >
              Tilbake
            </button>
            <button
              type="submit"
              disabled={loading || !password.trim() || (isNewUser && !classYear)}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded text-white font-semibold transition"
            >
              {loading ? 'Logger inn...' : isNewUser ? 'Opprett konto' : 'Logg inn'}
            </button>
          </div>
        </motion.form>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-red-400 bg-red-900/40 border border-red-700 rounded px-4 py-2 text-sm"
        >
          {error}
        </motion.div>
      )}

      {users.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-slate-800 border border-slate-700 rounded-lg p-6"
        >
          <h4 className="text-lg font-semibold mb-4">Velg din konto:</h4>
          <div className="space-y-2">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className="w-full text-left px-4 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded transition cursor-pointer"
              >
                <div className="font-medium">{user.name}</div>
                {user.class_year && (
                  <div className="text-sm text-slate-400">Klasse: {user.class_year}</div>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UserLoginPage;

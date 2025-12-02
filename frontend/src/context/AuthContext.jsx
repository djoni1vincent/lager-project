import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch(`/auth/me`);
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(data.is_admin || false);
        setUser(data.user || null);
      } else {
        setIsAdmin(false);
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setIsAdmin(false);
      setUser(null);
    } finally {
      setLoaded(true);
    }
  }

  async function login(username, password) {
    const res = await fetch(`/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }

    const data = await res.json();
    setUser(data.user);
    setIsAdmin(data.user.role === 'admin' || data.user.role === 'staff');
    return true;
  }

  async function logout() {
    try {
      await fetch(`/auth/logout`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setIsAdmin(false);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ isAdmin, user, loaded, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

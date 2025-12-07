import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch(`/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(data.is_admin || false);
        setIsUser(data.is_user || false);
        setUser(data.user || null);
      } else {
        setIsAdmin(false);
        setIsUser(false);
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setIsAdmin(false);
      setIsUser(false);
      setUser(null);
    } finally {
      setLoaded(true);
    }
  }

  async function login(username, password) {
    const res = await fetch(`/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }

    const data = await res.json();
    setUser(data.user);
    setIsAdmin(data.user.role === 'admin' || data.user.role === 'staff');
    setIsUser(false);
    return true;
  }

  async function userLogin(name, userId = null, password = null, classYear = null) {
    const res = await fetch(`/auth/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, user_id: userId, password, class_year: classYear })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Innlogging mislyktes');
    }

    const data = await res.json();
    setUser(data.user);
    setIsUser(true);
    setIsAdmin(false);
    return true;
  }

  async function logout() {
    try {
      if (isAdmin) {
        await fetch(`/auth/logout`, {
          method: 'POST',
          credentials: 'include'
        });
      } else if (isUser) {
        await fetch(`/auth/user/logout`, {
          method: 'POST',
          credentials: 'include'
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
    setIsAdmin(false);
    setIsUser(false);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ isAdmin, isUser, user, loaded, login, userLogin, logout, checkAuth }}>
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

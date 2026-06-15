import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading', 'authenticated', 'unauthenticated'

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      const data = await res.json();
      setUser(data.user);
      setStatus(data.status);
    } catch (error) {
      console.error('Failed to fetch session', error);
      setUser(null);
      setStatus('unauthenticated');
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "https://newsbrief-backend-j0xu.onrender.com";

  const loginGoogle = () => {
    // Redirect to backend OAuth route
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  const loginLocal = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        setStatus('authenticated');
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: 'Connection error' };
    }
  };

  const registerLocal = async (name, email, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        setStatus('authenticated');
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: 'Connection error' };
    }
  };

  const signOut = async (options = {}) => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      setStatus('unauthenticated');
      if (options.callbackUrl) {
        window.location.href = options.callbackUrl;
      } else {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const update = async (newUserData) => {
    // Refetch the session to sync state or merge local state
    if (newUserData) {
      setUser((prev) => ({ ...prev, ...newUserData }));
    } else {
      await fetchSession();
    }
  };

  return (
    <AuthContext.Provider value={{ user, status, loginGoogle, loginLocal, registerLocal, signOut, update, fetchSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

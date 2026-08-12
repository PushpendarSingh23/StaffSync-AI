import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { apiFetch, TOKEN_KEY } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // true while the initial /auth/me check is in-flight
  const [loading, setLoading] = useState(true);

  // ── logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  // ── Restore session from stored token on mount ──────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiFetch('/auth/me');
        setUser(res.user);
      } catch {
        // Invalid / expired token stored — clear it
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  // ── Listen for token-expired events fired by apiFetch ──────────────────────
  useEffect(() => {
    const handler = () => {
      logout();
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, [logout]);

  // ── login ───────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(TOKEN_KEY, res.token);
    setUser(res.user);
    return res.user;
  };

  // ── register ─────────────────────────────────────────────────────────────────
  const register = async (fullName, email, password, role = 'employee') => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, role }),
    });
    localStorage.setItem(TOKEN_KEY, res.token);
    setUser(res.user);
    return res.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

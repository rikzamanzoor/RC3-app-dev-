import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tokenStorage } from '../services/tokenStorage';
import { api, setOnUnauthorizedCallback } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'signedOut' | 'signedIn'
  const [user, setUser] = useState(null); // { id, username, member_id, name }
  const [sessionError, setSessionError] = useState(null);

  // Restore session on app launch
  const restoreSession = useCallback(async () => {
    setStatus('loading');
    setSessionError(null);
    try {
      const token = await tokenStorage.getToken();
      if (!token) {
        setStatus('signedOut');
        setUser(null);
        return;
      }
      const me = await api.getMe();
      setUser(me);
      setStatus('signedIn');
    } catch (e) {
      await tokenStorage.clearToken();
      setUser(null);
      setStatus('signedOut');
    }
  }, []);

  useEffect(() => {
    restoreSession();

    // Register 401 interceptor callback
    setOnUnauthorizedCallback((msg) => {
      setUser(null);
      setStatus('signedOut');
      setSessionError(msg);
    });
  }, [restoreSession]);

  const login = async (username, password) => {
    setSessionError(null);
    const res = await api.login(username, password);
    if (res && res.token) {
      await tokenStorage.setToken(res.token);
      setUser(res.user);
      setStatus('signedIn');
      return res.user;
    }
    throw { code: 'INVALID_CREDENTIALS', message: 'Login failed. Please check credentials.' };
  };

  const logout = async () => {
    await tokenStorage.clearToken();
    setUser(null);
    setStatus('signedOut');
    setSessionError(null);
  };

  const clearSessionError = () => {
    setSessionError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        sessionError,
        clearSessionError,
        login,
        logout,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}


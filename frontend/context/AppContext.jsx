import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user, status } = useAuth();
  const [members, setMembers] = useState([]);
  const [activeMemberId, setActiveMemberId] = useState('M01');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Default active member to logged-in user when user signs in
  useEffect(() => {
    if (user && user.member_id) {
      setActiveMemberId(user.member_id);
    }
  }, [user]);

  const fetchMembers = useCallback(async () => {
    if (status !== 'signedIn') return;
    setLoadingMembers(true);
    try {
      const data = await api.getMembers();
      setMembers(data);
    } catch (e) {
      // fallback if members fetch fails
    } finally {
      setLoadingMembers(false);
    }
  }, [status]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers, refreshKey]);

  const bumpRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <AppContext.Provider
      value={{
        members,
        activeMemberId,
        setActiveMemberId,
        refreshKey,
        bumpRefresh,
        loadingMembers,
        fetchMembers,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}


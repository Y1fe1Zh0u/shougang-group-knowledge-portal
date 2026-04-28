import { useCallback, useEffect, useState } from 'react';

import { logoutPortal, type PortalUser } from '../api/auth';

export type { PortalUser };

const STORAGE_KEY = 'sg_portal_user';

function readStoredUser(): PortalUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PortalUser;
  } catch {
    return null;
  }
}

export function loadPortalUser(): PortalUser | null {
  return readStoredUser();
}

export function savePortalUser(user: PortalUser) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearPortalUser() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function useAuth() {
  const [user, setUser] = useState<PortalUser | null>(() => readStoredUser());

  useEffect(() => {
    function syncFromStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      setUser(readStoredUser());
    }
    window.addEventListener('storage', syncFromStorage);
    return () => window.removeEventListener('storage', syncFromStorage);
  }, []);

  const login = useCallback((next: PortalUser) => {
    savePortalUser(next);
    setUser(next);
  }, []);

  const logout = useCallback(() => {
    void logoutPortal().catch(() => undefined);
    clearPortalUser();
    setUser(null);
  }, []);

  return { user, login, logout };
}

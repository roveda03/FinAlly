import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authService } from '@/services';
import type { LoginCredentials, User } from '@/types';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (credentials: { name: string; email: string; password: string }) => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    authService
      .restoreSession()
      .then((authenticatedUser) => {
        if (active) setUser(authenticatedUser);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const authenticatedUser = await authService.login(credentials);
      setUser(authenticatedUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (credentials: { name: string; email: string; password: string }) => {
    setIsLoading(true);
    try {
      const authenticatedUser = await authService.register(credentials);
      setUser(authenticatedUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch {
      return;
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, register, login, logout }),
    [user, isLoading, register, login, logout]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

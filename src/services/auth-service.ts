import type { LoginCredentials, User } from '@/types';

import {
    apiRequest,
    clearAuthTokens,
    getSavedAuthTokens,
    saveAuthTokens,
    type AuthTokens,
} from './api-client';

interface AuthResponse extends AuthTokens {
  user: User;
}

export const authService = {
  async register(credentials: { name: string; email: string; password: string }): Promise<User> {
    const response = await apiRequest<AuthResponse>(
      '/auth/register/',
      { method: 'POST', body: JSON.stringify(credentials) },
      { authenticated: false }
    );
    await saveAuthTokens({ access: response.access, refresh: response.refresh });
    return response.user;
  },

  async login({ email, password }: LoginCredentials): Promise<User> {
    const response = await apiRequest<AuthResponse>(
      '/auth/token/',
      { method: 'POST', body: JSON.stringify({ email, password }) },
      { authenticated: false }
    );
    await saveAuthTokens({ access: response.access, refresh: response.refresh });
    return response.user;
  },

  async restoreSession(): Promise<User | null> {
    if (!(await getSavedAuthTokens())) return null;
    try {
      return await apiRequest<User>('/auth/me/');
    } catch (error) {
      if (error instanceof Error && 'status' in error && error.status === 401) {
        await clearAuthTokens();
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    const tokens = await getSavedAuthTokens();
    try {
      if (tokens) {
        await apiRequest<void>('/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh: tokens.refresh }),
        });
      }
    } finally {
      await clearAuthTokens();
    }
  },
};

import { Platform } from 'react-native';

const TOKEN_STORAGE_KEY = 'finally.auth.tokens';
const DEFAULT_API_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:8000/api'
  : 'http://localhost:8000/api';
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/$/, '');

export interface AuthTokens {
  access: string;
  refresh: string;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

let tokenCache: AuthTokens | null = null;
let tokensLoaded = false;

async function loadTokens(): Promise<AuthTokens | null> {
  if (tokensLoaded) return tokenCache;
  tokensLoaded = true;
  if (Platform.OS === 'web') return tokenCache;

  const SecureStore = await import('expo-secure-store');
  const stored = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
  if (stored) {
    try {
      tokenCache = JSON.parse(stored) as AuthTokens;
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
    }
  }
  return tokenCache;
}

export async function saveAuthTokens(tokens: AuthTokens): Promise<void> {
  tokenCache = tokens;
  tokensLoaded = true;
  if (Platform.OS !== 'web') {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  }
}

export async function clearAuthTokens(): Promise<void> {
  tokenCache = null;
  tokensLoaded = true;
  if (Platform.OS !== 'web') {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
  }
}

function getErrorMessage(payload: unknown): string {
  if (typeof payload === 'string') return payload;
  if (payload && typeof payload === 'object') {
    const data = payload as Record<string, unknown>;
    if (typeof data.detail === 'string') return data.detail;
    for (const value of Object.values(data)) {
      if (typeof value === 'string') return value;
      if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    }
  }
  return 'Não foi possível concluir a solicitação.';
}

async function refreshAccessToken(tokens: AuthTokens): Promise<AuthTokens | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });
    if (!response.ok) {
      await clearAuthTokens();
      return null;
    }
    const refreshed = await response.json() as Partial<AuthTokens>;
    const nextTokens = { access: refreshed.access!, refresh: refreshed.refresh ?? tokens.refresh };
    await saveAuthTokens(nextTokens);
    return nextTokens;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { authenticated?: boolean; retryUnauthorized?: boolean } = {}
): Promise<T> {
  const authenticated = options.authenticated !== false;
  let tokens = authenticated ? await loadTokens() : null;
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (tokens?.access) headers.set('Authorization', `Bearer ${tokens.access}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('Não foi possível conectar à API. Verifique a URL e a conexão.', 0);
  }

  if (
    response.status === 401 && authenticated && tokens?.refresh &&
    options.retryUnauthorized !== false && !path.includes('/auth/token/')
  ) {
    const refreshed = await refreshAccessToken(tokens);
    if (refreshed) {
      tokens = refreshed;
      headers.set('Authorization', `Bearer ${tokens.access}`);
      try {
        response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
      } catch {
        throw new ApiError('Não foi possível conectar à API. Verifique a URL e a conexão.', 0);
      }
    }
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(getErrorMessage(payload), response.status);
  return payload as T;
}

export async function getSavedAuthTokens(): Promise<AuthTokens | null> {
  return loadTokens();
}
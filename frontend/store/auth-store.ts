import { create } from 'zustand';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: 'ADMIN' | 'USER';
  isEmailVerified: boolean;
  provider: 'LOCAL' | 'GOOGLE' | 'GITHUB';
  twoFactorEnabled: boolean;
  createdAt: string;
}

type AuthStatus = 'booting' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: AuthStatus;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: AuthUser) => void;
  setStatus: (status: AuthStatus) => void;
  clear: () => void;
}

/**
 * Deliberately NOT persisted to localStorage/sessionStorage. The access
 * token lives only in memory; the refresh token lives only in an httpOnly
 * cookie the browser controls. On a hard refresh, `useAuthBootstrap` silently
 * calls /auth/refresh to re-hydrate this store. This keeps the access token
 * out of reach of XSS-injected JS reading storage.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: 'booting',
  setAuth: (user, accessToken) => set({ user, accessToken, status: 'authenticated' }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  setStatus: (status) => set({ status }),
  clear: () => set({ user: null, accessToken: null, status: 'unauthenticated' }),
}));

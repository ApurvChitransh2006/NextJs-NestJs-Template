'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api, API_URL, unwrap } from '@/lib/axios';
import { useAuthStore, type AuthUser } from '@/store/auth-store';
import { toast } from '@/store/toast-store';
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '@/lib/validators';

export function apiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof AxiosError) {
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg[0];
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

// ---------------- Register ----------------
export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) => unwrap<{ message: string }>(api.post('/auth/register', input)),
    onError: (error) => toast({ title: 'Registration failed', description: apiErrorMessage(error), variant: 'error' }),
  });
}

// ---------------- Login ----------------
type LoginResult =
  | { twoFactorRequired: true; challengeToken: string }
  | { twoFactorRequired: false; user: AuthUser; accessToken: string };

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (input: LoginInput) => unwrap<LoginResult>(api.post('/auth/login', input)),
    onSuccess: (data) => {
      if (!data.twoFactorRequired) {
        setAuth(data.user, data.accessToken);
        toast({ title: `Welcome back, ${data.user.name.split(' ')[0]}`, variant: 'success' });
      }
      // When twoFactorRequired is true, the caller (login page) switches to
      // the code-entry step itself — nothing to store in auth-store yet.
    },
    onError: (error) => toast({ title: 'Login failed', description: apiErrorMessage(error), variant: 'error' }),
  });
}

/** Step 2 of a 2FA login: exchange the challenge token + TOTP/backup code for real tokens. */
export function useVerifyTwoFactorLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (input: { challengeToken: string; code: string }) =>
      unwrap<{ user: AuthUser; accessToken: string }>(api.post('/auth/2fa/verify-login', input)),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      toast({ title: `Welcome back, ${data.user.name.split(' ')[0]}`, variant: 'success' });
    },
    onError: (error) =>
      toast({ title: 'Verification failed', description: apiErrorMessage(error), variant: 'error' }),
  });
}

// ---------------- Logout ----------------
export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      clear();
      queryClient.clear();
    },
  });
}

export function useLogoutAll() {
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post('/auth/logout-all'),
    onSuccess: () => toast({ title: 'Signed out of every device', variant: 'success' }),
    onSettled: () => {
      clear();
      queryClient.clear();
    },
  });
}

// ---------------- Verify email ----------------
export function useVerifyEmail(token: string | null) {
  return useQuery({
    queryKey: ['verify-email', token],
    queryFn: () => unwrap<{ message: string }>(api.get(`/auth/verify-email?token=${token}`)),
    enabled: !!token,
    retry: false,
  });
}

// ---------------- Forgot / reset password ----------------
export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) =>
      unwrap<{ message: string }>(api.post('/auth/forgot-password', input)),
    onError: (error) => toast({ title: 'Request failed', description: apiErrorMessage(error), variant: 'error' }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: { token: string; newPassword: string }) =>
      unwrap<{ message: string }>(api.post('/auth/reset-password', input)),
    onError: (error) => toast({ title: 'Reset failed', description: apiErrorMessage(error), variant: 'error' }),
  });
}

// ---------------- Current user ----------------
export function useCurrentUser() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: ['me'],
    queryFn: () => unwrap<AuthUser>(api.get('/users/me')),
    initialData: user ?? undefined,
    enabled: status === 'authenticated',
    staleTime: 30_000,
  });
}

// ---------------- Update profile ----------------
export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => {
      const payload = input.avatar ? input : { name: input.name };
      return unwrap<AuthUser>(api.patch('/users/profile', payload));
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(['me'], user);
      toast({ title: 'Profile updated', variant: 'success' });
    },
    onError: (error) => toast({ title: 'Update failed', description: apiErrorMessage(error), variant: 'error' }),
  });
}

// ---------------- Change password ----------------
export function useChangePassword() {
  const clear = useAuthStore((s) => s.clear);

  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      unwrap<{ message: string }>(
        api.patch('/users/password', {
          currentPassword: input.currentPassword,
          newPassword: input.newPassword,
        }),
      ),
    onSuccess: () => {
      toast({ title: 'Password changed', description: 'Please log in again.', variant: 'success' });
      clear();
    },
    onError: (error) => toast({ title: 'Change failed', description: apiErrorMessage(error), variant: 'error' }),
  });
}

// ---------------- Sessions ----------------
export interface Session {
  id: string;
  deviceName: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => unwrap<Session[]>(api.get('/auth/sessions')),
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => api.delete(`/auth/sessions/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({ title: 'Session revoked', variant: 'success' });
    },
    onError: (error) => toast({ title: 'Could not revoke session', description: apiErrorMessage(error), variant: 'error' }),
  });
}

// ---------------- Linked accounts (multi-provider login) ----------------
export type LinkedProvider = 'GOOGLE' | 'GITHUB';

export interface LinkedAccount {
  id: string;
  provider: LinkedProvider;
  email: string | null;
  avatar: string | null;
  createdAt: string;
}

export interface LinkedAccountsResponse {
  hasPassword: boolean;
  accounts: LinkedAccount[];
}

export function useLinkedAccounts() {
  return useQuery({
    queryKey: ['linked-accounts'],
    queryFn: () => unwrap<LinkedAccountsResponse>(api.get('/users/linked-accounts')),
  });
}

/**
 * Kicks off the "connect account" OAuth flow: fetches a short-lived signed
 * state token proving who's asking, then hard-navigates the browser to the
 * backend's OAuth entrypoint (must be a full navigation, not a fetch, since
 * the provider's consent screen has to load).
 */
export function useConnectProvider() {
  return useMutation({
    mutationFn: async (provider: 'google' | 'github') => {
      const { state } = await unwrap<{ state: string }>(
        api.get(`/auth/link-token/${provider}`),
      );
      window.location.href = `${API_URL}/auth/${provider}?state=${encodeURIComponent(state)}`;
    },
    onError: (error) =>
      toast({ title: 'Could not start connection', description: apiErrorMessage(error), variant: 'error' }),
  });
}

export function useDisconnectAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (linkedAccountId: string) => api.delete(`/users/linked-accounts/${linkedAccountId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linked-accounts'] });
      toast({ title: 'Account disconnected', variant: 'success' });
    },
    onError: (error) =>
      toast({ title: 'Could not disconnect', description: apiErrorMessage(error), variant: 'error' }),
  });
}

// ---------------- Two-factor authentication (TOTP) ----------------


/** Kicks off setup: fetches a fresh secret + provisioning QR code. */
export function useRequestTwoFactorSetup() {
  return useMutation({
    mutationFn: () => unwrap<{ secret: string; qrCodeDataUrl: string }>(api.get('/auth/2fa/setup')),
    onError: (error) =>
      toast({ title: 'Could not start setup', description: apiErrorMessage(error), variant: 'error' }),
  });
}

/** Confirms the code from the authenticator app and activates 2FA. */
export function useEnableTwoFactor() {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) =>
      unwrap<{ message: string; backupCodes: string[] }>(api.post('/auth/2fa/enable', { code })),
    onSuccess: () => {
      if (user) setUser({ ...user, twoFactorEnabled: true });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast({ title: 'Two-factor authentication enabled', variant: 'success' });
    },
    onError: (error) =>
      toast({ title: 'Invalid code', description: apiErrorMessage(error), variant: 'error' }),
  });
}

// --------------- Disable Two Factor's ----------------------------------

export function useDisableTwoFactor() {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => unwrap<{ message: string }>(api.post('/auth/2fa/disable', { code })),
    onSuccess: () => {
      if (user) setUser({ ...user, twoFactorEnabled: false });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast({ title: 'Two-factor authentication disabled', variant: 'success' });
    },
    onError: (error) =>
      toast({ title: 'Invalid code', description: apiErrorMessage(error), variant: 'error' }),
  });
}

// ---------------- Login activity (security audit trail) ----------------
export interface LoginActivityEntry {
  id: string;
  success: boolean;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export function useLoginActivity() {
  return useQuery({
    queryKey: ['login-activity'],
    queryFn: () => unwrap<LoginActivityEntry[]>(api.get('/auth/login-activity')),
  });
}

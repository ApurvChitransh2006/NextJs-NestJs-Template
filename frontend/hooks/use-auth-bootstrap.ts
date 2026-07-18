'use client';

import { useEffect, useRef } from 'react';
import { api, unwrap } from '@/lib/axios';
import { useAuthStore, type AuthUser } from '@/store/auth-store';

/**
 * Runs once on app mount. The access token only ever lives in memory, so a
 * hard refresh loses it — this silently exchanges the httpOnly refresh
 * cookie for a new access token and hydrates the user, or marks the visitor
 * as unauthenticated if there's no valid session.
 */
export function useAuthBootstrap() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setStatus = useAuthStore((s) => s.setStatus);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const refreshRes = await api.post('/auth/refresh');
        const accessToken = refreshRes.data?.data?.accessToken as string;
        useAuthStore.getState().setAccessToken(accessToken);

        const user = await unwrap<AuthUser>(api.get('/users/me'));
        setAuth(user, accessToken);
      } catch {
        setStatus('unauthenticated');
      }
    })();
  }, [setAuth, setStatus]);
}

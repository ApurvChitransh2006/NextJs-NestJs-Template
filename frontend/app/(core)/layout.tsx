'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';
import { useAuthStore } from '@/store/auth-store';

/**
 * Shared shell for every authenticated route (both the main app/dashboard
 * section and the settings section). It only handles auth gating, the
 * background decoration, and the email verification banner — it does NOT
 * render a navbar. Each route group below ((main-app) and (settings))
 * renders its own navbar via its own layout.tsx, since they need different
 * navigation.
 */
export default function CoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((state) => state.user);

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen overflow-hidden bg-background">

        {/* Background */}

        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">

          <div className="absolute inset-0 bg-vault-weave opacity-[0.035]" />

          <div className="absolute -left-48 top-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[140px]" />

          <div className="absolute right-0 top-48 h-[450px] w-[450px] rounded-full bg-emerald-500/10 blur-[140px]" />

          <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-amber-600/5 blur-[140px]" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,transparent,rgba(0,0,0,0.08))]" />

        </div>

        {/* Verification Banner */}

        {user && !user.isEmailVerified && (
          <div className="border-b border-border/40">
            <EmailVerificationBanner />
          </div>
        )}

        {/* Content */}

        {children}

      </div>
    </ProtectedRoute>
  );
}
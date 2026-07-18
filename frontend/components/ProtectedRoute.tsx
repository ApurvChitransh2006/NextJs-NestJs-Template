'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';

import { useAuthStore } from '@/store/auth-store';

import { Card } from '@/components/ui/card';

export function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'booting') {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">

        {/* Background */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">

          <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[140px]" />

          <div className="absolute right-0 top-40 h-[450px] w-[450px] rounded-full bg-emerald-500/10 blur-[140px]" />

          <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-amber-600/5 blur-[140px]" />

        </div>

        <Card className="relative w-full max-w-md rounded-3xl border-border/40 bg-background/70 p-10 text-center backdrop-blur-2xl shadow-2xl">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/20 bg-primary/10 shadow-lg shadow-primary/10">

            <ShieldCheck className="h-8 w-8 text-primary" />

          </div>

          <h1 className="font-heading mt-8 text-3xl font-bold tracking-tight">
            Restoring your session
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Please wait while we securely restore your
            authentication session.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">

            <Loader2 className="h-5 w-5 animate-spin text-primary" />

            <span className="text-sm text-muted-foreground">
              Loading...
            </span>

          </div>

        </Card>

      </main>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return children;
}
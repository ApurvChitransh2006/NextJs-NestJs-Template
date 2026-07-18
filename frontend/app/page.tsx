'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { VaultDial } from '@/components/VaultDial';

export default function RootPage() {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated')   router.replace('/dashboard');
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background">
      {/* Ambient radial glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[30rem] w-[30rem] animate-pulse rounded-full bg-primary/5 blur-[100px] duration-3000" />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        <VaultDial className="h-20 w-20 text-primary opacity-80 drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]" />

        <div className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)] [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)] [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
        </div>

        <p className="text-[12px] uppercase tracking-[0.2em] text-muted-foreground">
          Restoring session…
        </p>
      </div>
    </div>
  );
}

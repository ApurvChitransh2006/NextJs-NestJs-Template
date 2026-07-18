import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { VaultDial } from '@/components/VaultDial';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">

      {/* Background */}

      <div className="absolute inset-0 overflow-hidden">

        <div className="absolute inset-0 bg-vault-weave opacity-[0.05]" />

        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />

        <div className="absolute -left-32 bottom-0 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[140px]" />

        <div className="absolute -right-32 top-20 h-[420px] w-[420px] rounded-full bg-amber-600/10 blur-[140px]" />

        <VaultDial className="pointer-events-none absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 opacity-[0.05] text-primary" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,transparent,rgba(0,0,0,0.15))]" />

      </div>

      <div className="relative w-full max-w-[440px]">

        {/* Badge */}

        <div className="mb-6 flex justify-center">

          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">

            <ShieldCheck className="h-3.5 w-3.5 text-primary" />

            Secure Authentication

          </span>

        </div>

        {/* Logo */}

        <div className="mb-10 text-center">

          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/20 bg-primary/10 shadow-lg shadow-primary/10">

            <svg
              viewBox="0 0 24 24"
              className="h-9 w-9 text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              <circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none" />
            </svg>

          </div>

          <h1 className="font-heading text-4xl font-bold tracking-tight">
            Vaultline
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Secure authentication built for modern applications.
          </p>

        </div>

        {/* Auth Card */}

        {children}

        {/* Footer */}

        <div className="mt-8 text-center text-xs text-muted-foreground">

          By continuing you agree to our{' '}

          <Link
            href="/terms"
            className="text-primary hover:underline"
          >
            Terms
          </Link>

          {' '}and{' '}

          <Link
            href="/privacy"
            className="text-primary hover:underline"
          >
            Privacy Policy
          </Link>

        </div>

      </div>

    </main>
  );
}
import { MailWarning, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function EmailVerificationBanner() {
  return (
    <div className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent backdrop-blur-xl">

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">

        <div className="flex items-center gap-4">

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">

            <MailWarning className="h-5 w-5 text-amber-500" />

          </div>

          <div>

            <p className="font-medium text-foreground">
              Verify your email address
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Your account isn&apos;t fully verified yet. Check your inbox
              and click the verification link to unlock all features.
            </p>

          </div>

        </div>

        <Link
          href="/verify-email"
          className="hidden items-center gap-2 rounded-xl border border-border/60 bg-background/70 px-4 py-2 text-sm font-medium transition-all hover:border-primary/30 hover:bg-background md:flex"
        >
          Verify Now
          <ArrowRight className="h-4 w-4" />
        </Link>

      </div>

    </div>
  );
}
'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Loader2,
  CheckCircle2,
  ShieldAlert,
  MailCheck,
} from 'lucide-react';

import { useVerifyEmail, apiErrorMessage } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { isLoading, isError, isSuccess, error } =
    useVerifyEmail(token);

  let icon = <Loader2 className="h-10 w-10 animate-spin text-primary" />;
  let title = 'Verifying your email';
  let description =
    'Please wait while we securely verify your account.';
  let button = (
    <Button  className="mt-8 h-11 rounded-xl px-6">
      <Link href="/login">Back to Login</Link>
    </Button>
  );

  let glow = 'bg-primary/10';
  let ring = 'border-primary/20';

  if (!token) {
    icon = <MailCheck className="h-10 w-10 text-destructive" />;
    title = 'Verification Link Missing';
    description =
      'Open the verification email again and use the link provided.';
    glow = 'bg-destructive/10';
    ring = 'border-destructive/20';

    button = (
      <Button  className="mt-8 h-11 rounded-xl px-6">
        <Link href="/login">Back to Login</Link>
      </Button>
    );
  }

  if (isSuccess) {
    icon = <CheckCircle2 className="h-10 w-10 text-emerald-500" />;
    title = 'Email Verified';
    description =
      'Your account is now active. You can sign in and start using the application.';
    glow = 'bg-emerald-500/10';
    ring = 'border-emerald-500/20';

    button = (
      <Button  className="mt-8 h-11 rounded-xl px-6">
        <Link href="/login">Continue to Login</Link>
      </Button>
    );
  }

  if (isError) {
    icon = <ShieldAlert className="h-10 w-10 text-destructive" />;
    title = 'Verification Failed';
    description = apiErrorMessage(
      error,
      'This verification link has expired or is invalid.'
    );
    glow = 'bg-destructive/10';
    ring = 'border-destructive/20';

    button = (
      <Button  className="mt-8 h-11 rounded-xl px-6">
        <Link href="/login">Back to Login</Link>
      </Button>
    );
  }

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-border/40 bg-background/70 backdrop-blur-2xl shadow-2xl">

      {/* Background */}

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      </div>

      <div className="relative flex flex-col items-center px-8 py-14 text-center">

        <div
          className={`mb-7 flex h-24 w-24 items-center justify-center rounded-full border ${ring} ${glow}`}
        >
          {icon}
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          Account Verification
        </p>

        <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight">
          {title}
        </h1>

        <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
          {description}
        </p>

        {!isLoading && button}
      </div>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
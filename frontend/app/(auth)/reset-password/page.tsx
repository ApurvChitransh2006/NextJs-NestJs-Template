'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  ShieldAlert,
  CheckCircle2,
  KeyRound,
  Lock,
  Loader2,
} from 'lucide-react';

import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@/lib/validators';

import { useResetPassword } from '@/hooks/use-auth';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/PasswordInput';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token');

  const resetPassword = useResetPassword();

  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('newPassword') || '';

  const onSubmit = (data: ResetPasswordInput) => {
    if (!token) return;

    resetPassword.mutate(
      {
        token,
        newPassword: data.newPassword,
      },
      {
        onSuccess: () => setDone(true),
      }
    );
  };

  /* Missing Token */

  if (!token) {
    return (
      <Card className="relative overflow-hidden rounded-3xl border-border/40 bg-background/70 backdrop-blur-2xl shadow-2xl">

        <div className="absolute inset-0">
          <div className="absolute -left-28 -top-28 h-72 w-72 rounded-full bg-destructive/10 blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center px-8 py-14 text-center">

          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>

          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Reset Link Expired
          </h1>

          <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
            The password reset link is invalid or has expired.
            Request a new one below.
          </p>

          <Link
            href="/forgot-password"
            className="mt-8 rounded-xl border px-5 py-2.5 text-sm font-medium transition hover:bg-accent"
          >
            Request New Link
          </Link>

        </div>
      </Card>
    );
  }

  /* Success */

  if (done) {
    return (
      <Card className="relative overflow-hidden rounded-3xl border-border/40 bg-background/70 backdrop-blur-2xl shadow-2xl">

        <div className="absolute inset-0">
          <div className="absolute -left-28 -top-28 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center px-8 py-14 text-center">

          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>

          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Password Updated
          </h1>

          <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
            Your password has been updated successfully.
            You can now sign in using your new password.
          </p>

          <Button
            onClick={() => router.push('/login')}
            className="mt-8 h-11 rounded-xl px-6"
          >
            Continue to Login
          </Button>

        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden rounded-3xl border-border/40 bg-background/70 backdrop-blur-2xl shadow-2xl">

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      </div>

      <div className="relative p-8">

        <div className="mb-8 text-center">

          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/20 bg-primary/10 shadow-lg shadow-primary/10">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            Secure Account
          </p>

          <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight">
            Reset Password
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Choose a strong password to protect your account.
          </p>

        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
                    <div className="space-y-2">
            <Label htmlFor="newPassword">
              New Password
            </Label>

            <div className="relative">

              <Lock className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                placeholder="••••••••"
                className="h-12 rounded-xl pl-11"
                {...register('newPassword')}
              />

            </div>

            <PasswordStrengthMeter password={password} />

            {errors.newPassword && (
              <p className="text-xs text-destructive">
                {errors.newPassword.message}
              </p>
            )}

            <div className="rounded-xl border border-border/50 bg-muted/30 p-4">

              <p className="mb-3 text-xs font-medium text-muted-foreground">
                Password Requirements
              </p>

              <div className="space-y-2">

                {[
                  {
                    ok: password.length >= 8,
                    label: 'Minimum 8 characters',
                  },
                  {
                    ok:
                      /[A-Z]/.test(password) &&
                      /[a-z]/.test(password),
                    label: 'Upper & lowercase letters',
                  },
                  {
                    ok: /\d/.test(password),
                    label: 'At least one number',
                  },
                ].map((rule) => (
                  <div
                    key={rule.label}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2
                      className={`h-4 w-4 transition-colors ${
                        rule.ok
                          ? 'text-emerald-500'
                          : 'text-muted-foreground/40'
                      }`}
                    />

                    <span
                      className={`text-sm ${
                        rule.ok
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {rule.label}
                    </span>
                  </div>
                ))}

              </div>

            </div>

          </div>

          <Button
            type="submit"
            disabled={resetPassword.isPending}
            className="h-12 w-full rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/30"
          >
            {resetPassword.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Password...
              </>
            ) : (
              <>
                <KeyRound className="mr-2 h-4 w-4" />
                Reset Password
              </>
            )}
          </Button>

        </form>

      </div>

    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
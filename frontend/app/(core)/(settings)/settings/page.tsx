'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Lock,
  KeyRound,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Link2,
  Unlink,
} from 'lucide-react';

import {
  changePasswordSchema,
  type ChangePasswordInput,
} from '@/lib/validators';

import {
  useChangePassword,
  useLinkedAccounts,
  useConnectProvider,
  useDisconnectAccount,
  type LinkedProvider,
} from '@/hooks/use-auth';

import { TwoFactorSettings } from '@/components/TwoFactorSettings';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/PasswordInput';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';

export default function SettingsPage() {
  const router = useRouter();

  const changePassword = useChangePassword();
  const { data: linkedData, isLoading: linkedLoading } = useLinkedAccounts();
  const connectProvider = useConnectProvider();
  const disconnectAccount = useDisconnectAccount();

  const PROVIDERS: { id: LinkedProvider; slug: 'google' | 'github'; label: string }[] = [
    { id: 'GOOGLE', slug: 'google', label: 'Google' },
    { id: 'GITHUB', slug: 'github', label: 'GitHub' },
  ];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: {
      errors,
    },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPassword = watch('newPassword') || '';

  const onSubmit = (data: ChangePasswordInput) => {
    changePassword.mutate(data, {
      onSuccess: () => {
        reset();

        setTimeout(() => {
          router.push('/login');
        }, 1000);
      },
    });
  };

  return (
    <div className="relative space-y-8">

      {/* Background */}

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">

        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />

        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />

      </div>

      {/* Hero */}

      <section>

        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Security
        </p>

        <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight">
          Password & Security
        </h1>

        <p className="mt-3 max-w-2xl text-muted-foreground">
          Keep your account secure by updating your password
          regularly.
        </p>

      </section>

      {/* Connected accounts */}

      <Card className="overflow-hidden rounded-3xl border-border/40 bg-background/70 backdrop-blur-2xl shadow-xl">

        <div className="border-b border-border/40 p-8">

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Connected Accounts</h2>
              <p className="text-sm text-muted-foreground">
                Sign in with email, Google, or GitHub — they all reach the same account.
              </p>
            </div>
          </div>

        </div>

        <div className="space-y-3 p-8">

          {linkedLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading connected accounts...
            </div>
          )}

          {!linkedLoading &&
            PROVIDERS.map(({ id, slug, label }) => {
              const linked = linkedData?.accounts.find((a) => a.provider === id);
              const canDisconnect =
                !!linked &&
                ((linkedData?.accounts.length ?? 0) > 1 || !!linkedData?.hasPassword);

              return (
                <div
                  key={id}
                  className="flex items-center justify-between rounded-2xl border border-border/40 bg-muted/20 p-4"
                >
                  <div className="flex items-center gap-3">
                    {slug === 'google' ? (
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23" />
                        <path fill="#FBBC05" d="M5.84 14.1A6.62 6.62 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.65l3.16-3.16A11 11 0 0 0 2.18 7.07L5.84 9.9c.87-2.59 3.3-4.52 6.16-4.52" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 .5C5.65.5.5 5.65.5 12A11.5 11.5 0 0 0 8.36 22.9c.58.1.79-.25.79-.56v-2.02c-3.2.7-3.88-1.35-3.88-1.35-.52-1.3-1.27-1.65-1.27-1.65-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.72 2.65 1.22 3.3.93.1-.72.4-1.22.72-1.5-2.55-.3-5.23-1.27-5.23-5.64 0-1.24.44-2.26 1.17-3.05-.12-.29-.51-1.45.11-3.02 0 0 .96-.3 3.13 1.17a10.9 10.9 0 0 1 5.7 0c2.17-1.47 3.13-1.17 3.13-1.17.62 1.57.23 2.73.11 3.02.73.79 1.17 1.81 1.17 3.05 0 4.38-2.69 5.34-5.25 5.63.42.36.78 1.04.78 2.1v3.1c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
                      </svg>
                    )}
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">
                        {linked ? linked.email || 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>

                  {linked ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      disabled={!canDisconnect || disconnectAccount.isPending}
                      title={!canDisconnect ? 'Set a password before disconnecting your only sign-in method' : undefined}
                      onClick={() => disconnectAccount.mutate(linked.id)}
                    >
                      <Unlink className="mr-2 h-3.5 w-3.5" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      disabled={connectProvider.isPending}
                      onClick={() => connectProvider.mutate(slug)}
                    >
                      <Link2 className="mr-2 h-3.5 w-3.5" />
                      Connect
                    </Button>
                  )}
                </div>
              );
            })}

        </div>

      </Card>

      {/* Two-factor authentication */}

      <TwoFactorSettings />

      {/* Card */}

      <Card className="overflow-hidden rounded-3xl border-border/40 bg-background/70 backdrop-blur-2xl shadow-xl">

        {/* Header */}

        <div className="border-b border-border/40 p-8 text-center">

          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/20 bg-primary/10 shadow-lg shadow-primary/10">

            <KeyRound className="h-8 w-8 text-primary" />

          </div>

          <h2 className="text-2xl font-semibold">
            Change Password
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Choose a strong password to keep your account protected.
          </p>

        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 p-8"
          noValidate
        >
                    {/* Current Password */}

          <div className="space-y-2">

            <Label htmlFor="currentPassword">
              Current Password
            </Label>

            <div className="relative">

              <Lock className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <PasswordInput
                id="currentPassword"
                autoComplete="current-password"
                placeholder="Enter your current password"
                className="h-12 rounded-xl pl-11"
                {...register('currentPassword')}
              />

            </div>

            {errors.currentPassword && (
              <p className="text-xs text-destructive">
                {errors.currentPassword.message}
              </p>
            )}

          </div>

          {/* New Password */}

          <div className="space-y-2">

            <Label htmlFor="newPassword">
              New Password
            </Label>

            <div className="relative">

              <KeyRound className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                placeholder="Choose a strong password"
                className="h-12 rounded-xl pl-11"
                {...register('newPassword')}
              />

            </div>

            <PasswordStrengthMeter password={newPassword} />

            {errors.newPassword && (
              <p className="text-xs text-destructive">
                {errors.newPassword.message}
              </p>
            )}

            {/* Password Requirements */}

            <Card className="rounded-2xl border-border/40 bg-muted/20 p-4">

              <p className="mb-3 text-xs font-medium text-muted-foreground">
                Password Requirements
              </p>

              <div className="space-y-2">

                {[
                  {
                    ok: newPassword.length >= 8,
                    label: 'Minimum 8 characters',
                  },
                  {
                    ok:
                      /[A-Z]/.test(newPassword) &&
                      /[a-z]/.test(newPassword),
                    label: 'Upper & lowercase letters',
                  },
                  {
                    ok: /\d/.test(newPassword),
                    label: 'At least one number',
                  },
                ].map((rule) => (
                  <div
                    key={rule.label}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2
                      className={`h-4 w-4 ${
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

            </Card>

          </div>

          {/* Confirm Password */}

          <div className="space-y-2">

            <Label htmlFor="confirmPassword">
              Confirm Password
            </Label>

            <div className="relative">

              <ShieldCheck className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                placeholder="Confirm your new password"
                className="h-12 rounded-xl pl-11"
                {...register('confirmPassword')}
              />

            </div>

            {errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}

          </div>
                    {/* Security Notice */}

          <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5 p-5">

            <div className="flex items-start gap-4">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">

                <ShieldCheck className="h-5 w-5 text-amber-500" />

              </div>

              <div>

                <h3 className="font-semibold">
                  Security Notice
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Updating your password will immediately sign
                  you out of every active device. You&apos;ll need
                  to sign in again using your new password.
                </p>

              </div>

            </div>

          </Card>

          {/* Success */}

          {changePassword.isSuccess && (

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">

              <div className="flex items-center gap-3">

                <CheckCircle2 className="h-5 w-5 text-emerald-500" />

                <div>

                  <p className="font-medium text-emerald-500">
                    Password updated successfully
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Redirecting to the login page...
                  </p>

                </div>

              </div>

            </div>

          )}

          {/* Actions */}

          <div className="border-t border-border/40 pt-6">

            <Button
              type="submit"
              disabled={changePassword.isPending}
              className="h-12 w-full rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/30"
            >
              {changePassword.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>

          </div>

        </form>

      </Card>

    </div>
  );
}
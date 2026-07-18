'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckCircle2,
  Loader2,
  Mail,
  MailCheck,
  User,
  UserPlus,
} from 'lucide-react';

import {
  registerSchema,
  type RegisterInput,
} from '@/lib/validators';

import { useRegister } from '@/hooks/use-auth';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/PasswordInput';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';

export default function RegisterPage() {
  const registerMutation = useRegister();

  const [submittedEmail, setSubmittedEmail] =
    useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password') || '';

  const onSubmit = (data: RegisterInput) => {
    registerMutation.mutate(data, {
      onSuccess: () => setSubmittedEmail(data.email),
    });
  };

  if (submittedEmail) {
    return (
      <Card className="relative overflow-hidden rounded-3xl border-border/40 bg-background/70 backdrop-blur-2xl shadow-2xl">

        <div className="absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center px-8 py-14 text-center">

          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 shadow-lg shadow-emerald-500/20">
            <MailCheck className="h-10 w-10 text-emerald-500" />
          </div>

          <h2 className="text-3xl font-semibold tracking-tight">
            Verify your email
          </h2>

          <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
            We&apos;ve sent a verification link to
          </p>

          <p className="mt-2 rounded-lg bg-muted px-4 py-2 font-medium">
            {submittedEmail}
          </p>

          <p className="mt-5 text-sm text-muted-foreground">
            Open your inbox and click the verification link to activate your account.
          </p>

          <Link
            href="/login"
            className="mt-8 rounded-xl border px-5 py-2.5 text-sm font-medium transition hover:bg-accent"
          >
            Back to Login
          </Link>

        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden rounded-3xl border-border/40 bg-background/70 backdrop-blur-2xl shadow-2xl">

      {/* Background */}

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      </div>

      <div className="relative p-8">

        {/* Header */}

        <div className="mb-8 text-center">

          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/20 bg-primary/10 shadow-lg shadow-primary/10">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            Get Started
          </p>

          <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight">
            Create your account
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Join thousands of developers building amazing things.
          </p>

        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >

          {/* Name */}

          <div className="space-y-2">

            <Label htmlFor="name">
              Full Name
            </Label>

            <div className="relative">

              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="name"
                placeholder="Ada Lovelace"
                autoComplete="name"
                className="h-12 rounded-xl pl-11"
                {...register('name')}
              />

            </div>

            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}

          </div>

          {/* Email */}

          <div className="space-y-2">

            <Label htmlFor="email">
              Email
            </Label>

            <div className="relative">

              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-12 rounded-xl pl-11"
                {...register('email')}
              />

            </div>

            {errors.email && (
              <p className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}

          </div>

          {/* Password */}
                    <div className="space-y-2">
            <Label htmlFor="password">Password</Label>

            <PasswordInput
              id="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className="h-12 rounded-xl"
              {...register('password')}
            />

            <PasswordStrengthMeter password={password} />

            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
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
                    className="flex items-center gap-2 text-sm"
                  >
                    <CheckCircle2
                      className={`h-4 w-4 transition-colors ${
                        rule.ok
                          ? 'text-emerald-500'
                          : 'text-muted-foreground/40'
                      }`}
                    />

                    <span
                      className={
                        rule.ok
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }
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
            disabled={registerMutation.isPending}
            className="h-12 w-full rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/30"
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </>
            )}
          </Button>
        </form>

        {/* Divider */}

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />

          <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Already Registered?
          </span>

          <div className="h-px flex-1 bg-border" />
        </div>

        <Link
          href="/login"
          className="flex h-12 w-full items-center justify-center rounded-xl border border-border/60 bg-background/60 text-sm font-medium transition-all hover:border-primary/30 hover:bg-muted/40"
        >
          Sign In Instead
        </Link>
      </div>
    </Card>
  );
}
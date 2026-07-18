'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MailCheck, ArrowLeft, Send } from 'lucide-react';

import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/lib/validators';
import { useForgotPassword } from '@/hooks/use-auth';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    forgotPassword.mutate(data, {
      onSuccess: () => setSent(true),
    });
  };

  if (sent) {
    return (
      <Card className="relative overflow-hidden rounded-[32px] border border-border/40 bg-background/70 backdrop-blur-3xl shadow-[0_35px_90px_-25px_rgba(0,0,0,0.45)]">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-28 -top-28 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -right-28 bottom-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center px-10 py-14 text-center">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 shadow-[0_0_70px_rgba(16,185,129,0.2)]">
            <MailCheck className="h-10 w-10 text-emerald-500" />
          </div>

          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Check your inbox
          </h1>

          <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
            If an account exists with that email address, we&apos;ve sent a secure
            password reset link. Please check your inbox and spam folder.
          </p>

          <Link
            href="/login"
            className="mt-10 inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background/60 px-5 text-sm font-medium transition-all hover:border-primary/40 hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden rounded-[32px] border border-border/40 bg-background/70 backdrop-blur-3xl shadow-[0_35px_90px_-25px_rgba(0,0,0,0.45)] transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-primary/10">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 -top-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-28 bottom-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      </div>

      <div className="relative px-10 py-10">
        {/* Icon */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/20 bg-primary/10 shadow-[0_0_40px_rgba(var(--primary),0.15)]">
          <Mail className="h-8 w-8 text-primary" />
        </div>

        {/* Heading */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            PASSWORD RECOVERY
          </p>

          <h1 className="font-heading mt-4 text-3xl font-semibold tracking-tight">
            Forgot your password?
          </h1>

          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            No worries. Enter your email address and we&apos;ll send you a secure
            password reset link.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-10 space-y-6"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-12 rounded-xl border-border/60 bg-background/60 pl-11 transition-all focus-visible:ring-2 focus-visible:ring-primary/30"
                {...register('email')}
              />
            </div>

            {errors.email && (
              <p className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={forgotPassword.isPending}
            className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-primary font-semibold text-primary-foreground shadow-xl shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-primary/30 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
          >
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-r from-white/10 via-transparent to-white/10" />

            <span className="relative flex items-center gap-2">
              {forgotPassword.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}

              Send Reset Link
            </span>
          </button>
        </form>

        {/* Divider */}
        <div className="my-8 flex items-center">
          <div className="h-px flex-1 bg-border" />
          <span className="px-4 text-xs uppercase tracking-wider text-muted-foreground">
            OR
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Login */}
        <Link
          href="/login"
          className="group flex items-center justify-center gap-2 rounded-xl border border-border bg-background/60 py-3 text-sm font-medium transition-all hover:border-primary/40 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Login
        </Link>
      </div>
    </Card>
  );
}
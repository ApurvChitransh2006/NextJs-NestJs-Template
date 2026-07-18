"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Mail, Loader2, LogIn, ShieldCheck, ArrowLeft } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

import { loginSchema, type LoginInput } from "@/lib/validators";
import { useLogin, useVerifyTwoFactorLogin } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth-store";
import { API_URL } from "@/lib/axios";

import { Card } from "@/components/ui/card";
import { Button,buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const login = useLogin();
  const verifyTwoFactor = useVerifyTwoFactorLogin();
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const onSubmit = (data: LoginInput) => {
    login.mutate(data, {
      onSuccess: (result) => {
        if (result.twoFactorRequired) {
          setChallengeToken(result.challengeToken);
        } else {
          router.push("/dashboard");
        }
      },
    });
  };

  const onSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeToken) return;
    verifyTwoFactor.mutate(
      { challengeToken, code },
      { onSuccess: () => router.push("/dashboard") },
    );
  };

  if (challengeToken) {
    return (
      <Card className="relative overflow-hidden rounded-3xl border-border/40 bg-background/70 backdrop-blur-2xl shadow-2xl">
        <div className="relative p-8">
          <button
            type="button"
            onClick={() => setChallengeToken(null)}
            className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/20 bg-primary/10 shadow-lg shadow-primary/10">
              <ShieldCheck className="h-12 w-12 text-primary" />
            </div>
            <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight">
              Two-factor verification
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Enter the 6-digit code from your authenticator app, or one of your backup codes.
            </p>
          </div>

          <form onSubmit={onSubmitCode} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                inputMode="text"
                autoComplete="one-time-code"
                autoFocus
                placeholder="123456"
                className="h-12 rounded-xl text-center text-lg tracking-[0.3em]"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={verifyTwoFactor.isPending || code.length < 6}
              className="h-12 w-full rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/30"
            >
              {verifyTwoFactor.isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-5 w-5" />
              )}
              Verify and sign in
            </Button>
          </form>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden rounded-3xl border-border/40 bg-background/70 backdrop-blur-2xl shadow-2xl">
      {/* Background Glow */}

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      </div>

      <div className="relative p-8">
        {/* Header */}

        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/20 bg-primary/10 shadow-lg shadow-primary/10">
            <LockKeyhole className="h-12 w-12 text-primary" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            Welcome Back
          </p>

          <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight">
            Sign in to your account
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Continue where you left off.
          </p>
        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          {/* Email */}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-12 rounded-xl pl-11"
                {...register("email")}
              />
            </div>

            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>

              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-12 rounded-xl"
              {...register("password")}
            />

            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Login */}

          <Button
            type="submit"
            disabled={login.isPending}
            className="h-12 w-full rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/30"
          >
            {login.isPending ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-5 w-5" />
            )}
            Log In
          </Button>
        </form>

        {/* Divider */}

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Continue with
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
        {/* Social Login */}

        <div className="space-y-3">
          {/* Social Login */}

          <div className="space-y-3">
            {/* Google */}
            {/* Google */}
            <Link
              href={`${API_URL}/auth/google`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 w-full justify-start rounded-xl border-border/60 bg-background/60 px-4 transition-all hover:border-primary/30 hover:bg-muted/40",
              )}
            >
              <FcGoogle className="mr-4 !size-6 shrink-0" />
              <span>Continue with Google</span>
            </Link>

            {/* GitHub */}
            <Link
              href={`${API_URL}/auth/github`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-3 h-12 w-full justify-start rounded-xl border-border/60 bg-background/60 px-4 transition-all hover:border-primary/30 hover:bg-muted/40",
              )}
            >
              <FaGithub className="mr-4 !size-6 shrink-0" />
              <span>Continue with GitHub</span>
            </Link>
          </div>
        </div>

        {/* Footer */}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary transition-colors hover:text-primary/80"
          >
            Create one
          </Link>
        </p>
      </div>
    </Card>
  );
}

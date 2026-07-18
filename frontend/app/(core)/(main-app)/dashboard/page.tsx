'use client';

import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';

import { useCurrentUser } from '@/hooks/use-auth';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/UserAvatar';

const actions = [
  {
    href: '/profile',
    title: 'Edit Profile',
    description: 'Manage your personal information',
    icon: '👤',
  },
  {
    href: '/sessions',
    title: 'Sessions',
    description: 'Manage signed in devices',
    icon: '🛡️',
  },
  {
    href: '/settings',
    title: 'Password',
    description: 'Update your password',
    icon: '🔑',
  },
];

export default function DashboardPage() {
  const { data: user, isLoading } = useCurrentUser();

  const firstName =
    user?.name?.split(' ')[0] ?? 'User';

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
          Dashboard
        </p>

        {isLoading ? (
          <>
            <Skeleton className="mt-4 h-10 w-64" />
            <Skeleton className="mt-3 h-5 w-96" />
          </>
        ) : (
          <>
            <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight">
              Welcome back, {firstName} 👋
            </h1>

            <p className="mt-3 max-w-2xl text-muted-foreground">
              Here&apos;s a quick overview of your account
              and security settings.
            </p>
          </>
        )}

      </section>

      {/* Profile */}

      <Card className="overflow-hidden rounded-3xl border-border/40 bg-background/70 backdrop-blur-2xl shadow-xl">

        {isLoading ? (
          <div className="flex items-center gap-5 p-7">

            <Skeleton className="h-20 w-20 rounded-full" />

            <div className="flex-1 space-y-3">

              <Skeleton className="h-6 w-48" />

              <Skeleton className="h-4 w-72" />

              <Skeleton className="mt-4 h-8 w-28 rounded-full" />

            </div>

          </div>
        ) : (
          user && (
            <div className="flex flex-col gap-6 p-7 md:flex-row md:items-center">

              <UserAvatar
                name={user.name}
                avatar={user.avatar}
                className="h-20 w-20 ring-4 ring-primary/10"
              />

              <div className="flex-1">

                <h2 className="text-2xl font-semibold">
                  {user.name}
                </h2>

                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {user.email}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                      user.isEmailVerified
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {user.isEmailVerified ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <ShieldX className="h-4 w-4" />
                    )}

                    {user.isEmailVerified
                      ? 'Verified Email'
                      : 'Email Not Verified'}
                  </span>

                </div>

              </div>

            </div>
          )
        )}

      </Card>

      {/* Quick Actions */}

      <section>

        <div className="mb-5">

          <h2 className="text-xl font-semibold">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account and security.
          </p>

        </div>

        <div className="grid gap-5 md:grid-cols-3">
                    {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group"
            >
              <Card className="h-full rounded-3xl border-border/40 bg-background/70 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10">

                <div className="flex items-start justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
                    {action.icon}
                  </div>

                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />

                </div>

                <h3 className="mt-5 text-lg font-semibold">
                  {action.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {action.description}
                </p>

              </Card>
            </Link>
          ))}

        </div>

      </section>

      {/* Account Overview */}

      <section>

        <div className="mb-5">

          <h2 className="text-xl font-semibold">
            Account Overview
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Your account health at a glance.
          </p>

        </div>

        <div className="grid gap-5 md:grid-cols-3">

          <Card className="rounded-3xl border-border/40 bg-background/70 p-6 backdrop-blur-xl">

            <p className="text-sm text-muted-foreground">
              Email Status
            </p>

            <h3 className="mt-3 text-2xl font-semibold">

              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : user?.isEmailVerified ? (
                'Verified'
              ) : (
                'Pending'
              )}

            </h3>

          </Card>

          <Card className="rounded-3xl border-border/40 bg-background/70 p-6 backdrop-blur-xl">

            <p className="text-sm text-muted-foreground">
              Authentication
            </p>

            <h3 className="mt-3 text-2xl font-semibold">
              Password
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Protected account
            </p>

          </Card>

          <Card className="rounded-3xl border-border/40 bg-background/70 p-6 backdrop-blur-xl">

            <p className="text-sm text-muted-foreground">
              Profile
            </p>

            <h3 className="mt-3 text-2xl font-semibold">

              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                firstName
              )}

            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Personal account
            </p>

          </Card>

        </div>

      </section>

      {/* Security Tip */}

      <Card className="rounded-3xl border-primary/20 bg-primary/5 p-6">

        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>

          <div>

            <h3 className="text-lg font-semibold">
              Keep your account secure
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Review your active sessions regularly and update
              your password if you notice anything unusual.
            </p>

          </div>

        </div>

      </Card>

    </div>
  );
}
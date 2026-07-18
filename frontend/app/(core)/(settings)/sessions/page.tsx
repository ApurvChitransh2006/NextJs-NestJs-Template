'use client';

import {
  ShieldCheck,
  ShieldOff,
  Laptop,
  Loader2,
  History,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import {
  useSessions,
  useRevokeSession,
  useLogoutAll,
  useLoginActivity,
} from '@/hooks/use-auth';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { SessionCard } from '@/components/SessionCard';

export default function SessionsPage() {
  const { data: sessions, isLoading } = useSessions();
  const { data: activity, isLoading: activityLoading } = useLoginActivity();

  const revokeSession = useRevokeSession();
  const logoutAll = useLogoutAll();

  return (
    <div className="relative space-y-8">

      {/* Background */}

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">

        <div className="absolute -left-44 top-0 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />

        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />

      </div>

      {/* Hero */}

      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

        <div>

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Security
          </p>

          <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight">
            Active Sessions
          </h1>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            Manage every device currently signed in to your
            account. Revoke any session you no longer recognize.
          </p>

        </div>

        {sessions && sessions.length > 1 && (

          <Button
            variant="destructive"
            disabled={logoutAll.isPending}
            onClick={() => logoutAll.mutate()}
            className="h-11 rounded-xl"
          >
            {logoutAll.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing Out...
              </>
            ) : (
              <>
                <ShieldOff className="mr-2 h-4 w-4" />
                Sign Out All
              </>
            )}
          </Button>

        )}

      </section>

      {/* Stats */}

      {!isLoading && sessions && (

        <Card className="rounded-3xl border-border/40 bg-background/70 p-6 backdrop-blur-xl">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">

              <Laptop className="h-7 w-7 text-primary" />

            </div>

            <div>

              <p className="text-sm text-muted-foreground">
                Active Devices
              </p>

              <h2 className="mt-1 text-3xl font-bold">

                {sessions.length}

              </h2>

            </div>

          </div>

        </Card>

      )}

      {/* Loading */}

      {isLoading && (

        <div className="space-y-5">

          {[1, 2, 3].map((item) => (

            <Card
              key={item}
              className="rounded-3xl border-border/40 bg-background/70 p-6 backdrop-blur-xl"
            >

              <div className="flex items-center gap-5">

                <Skeleton className="h-14 w-14 rounded-2xl" />

                <div className="flex-1 space-y-3">

                  <Skeleton className="h-5 w-56" />

                  <Skeleton className="h-4 w-72" />

                  <Skeleton className="h-4 w-40" />

                </div>

              </div>

            </Card>

          ))}

        </div>

      )}

      {/* Session List */}

      {!isLoading &&
        sessions &&
        sessions.length > 0 && (

        <div className="space-y-5">
                    {sessions.map((session) => (
            <div
              key={session.id}
              className="group transition-all duration-300 hover:-translate-y-1"
            >
              <SessionCard
                session={session}
                onRevoke={() => revokeSession.mutate(session.id)}
                revoking={
                  revokeSession.isPending &&
                  revokeSession.variables === session.id
                }
              />
            </div>
          ))}

        </div>

      )}

      {/* Empty State */}

      {!isLoading &&
        sessions &&
        sessions.length === 0 && (

        <Card className="rounded-3xl border-border/40 bg-background/70 p-10 backdrop-blur-xl">

          <div className="flex flex-col items-center text-center">

            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-primary/20 bg-primary/10">

              <ShieldCheck className="h-10 w-10 text-primary" />

            </div>

            <h2 className="text-2xl font-semibold">
              No Active Sessions
            </h2>

            <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
              You&apos;re currently not signed in on any devices.
              Active sessions will automatically appear here
              whenever you sign in.
            </p>

          </div>

        </Card>

      )}

      {/* Security Tip */}

      {!isLoading && sessions && sessions.length > 0 && (

        <Card className="rounded-3xl border-primary/20 bg-primary/5 p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">

              <ShieldCheck className="h-6 w-6 text-primary" />

            </div>

            <div>

              <h3 className="text-lg font-semibold">
                Security Recommendation
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Regularly review your active sessions and revoke
                any device you no longer use. If you suspect your
                account has been compromised, sign out from all
                devices immediately.
              </p>

            </div>

          </div>

        </Card>

      )}

      {/* Recent Login Activity */}

      <Card className="overflow-hidden rounded-3xl border-border/40 bg-background/70 backdrop-blur-2xl shadow-xl">

        <div className="border-b border-border/40 p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Recent Login Activity</h2>
              <p className="text-sm text-muted-foreground">
                Every sign-in attempt on your account, successful or not.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border/40">
          {activityLoading && (
            <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading activity...
            </div>
          )}

          {!activityLoading && activity && activity.length === 0 && (
            <p className="p-8 text-sm text-muted-foreground">No activity recorded yet.</p>
          )}

          {!activityLoading &&
            activity &&
            activity.slice(0, 15).map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 p-5">
                {entry.success ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {entry.success ? 'Successful sign-in' : describeFailure(entry.reason)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {entry.ipAddress || 'Unknown IP'}
                    {entry.userAgent ? ` · ${entry.userAgent}` : ''}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
        </div>

      </Card>

    </div>
  );
}

function describeFailure(reason: string | null): string {
  switch (reason) {
    case 'bad_password':
      return 'Failed sign-in — wrong password';
    case 'account_locked':
      return 'Blocked — account temporarily locked';
    case '2fa_failed':
      return 'Failed sign-in — invalid 2FA code';
    default:
      return 'Failed sign-in attempt';
  }
}
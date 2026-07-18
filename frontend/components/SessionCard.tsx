'use client';

import {
  Laptop,
  Monitor,
  Smartphone,
  ShieldCheck,
  Loader2,
  Trash2,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import type { Session } from '@/hooks/use-auth';

/**
 * Renders the correct device icon directly, rather than selecting and
 * returning a component reference to render later. Assigning a component to
 * a capitalized local variable during render is unsafe (its identity isn't
 * guaranteed stable), so this is a real, standalone component instead.
 */
function DeviceIcon({
  device,
  className,
}: {
  device: string | null;
  className?: string;
}) {
  const value = (device ?? '').toLowerCase();

  if (
    value.includes('iphone') ||
    value.includes('android') ||
    value.includes('mobile')
  ) {
    return <Smartphone className={className} />;
  }

  if (
    value.includes('mac') ||
    value.includes('windows') ||
    value.includes('linux')
  ) {
    return <Laptop className={className} />;
  }

  return <Monitor className={className} />;
}

function shortDevice(device: string | null) {
  if (!device) return 'Unknown Device';

  if (device.includes('Macintosh'))
    return 'Mac';

  if (device.includes('Windows'))
    return 'Windows';

  if (device.includes('iPhone'))
    return 'iPhone';

  if (device.includes('Android'))
    return 'Android';

  return device.length > 35
    ? `${device.slice(0, 35)}...`
    : device;
}

export function SessionCard({
  session,
  onRevoke,
  revoking,
}: {
  session: Session;
  onRevoke: () => void;
  revoking: boolean;
}) {
  return (
    <Card
      className={`rounded-3xl border-border/40 bg-background/70 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        session.isCurrent
          ? 'border-primary/30 shadow-primary/10'
          : ''
      }`}
    >
      <div className="flex items-start justify-between gap-6">

        <div className="flex gap-5">

          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
              session.isCurrent
                ? 'bg-primary/10'
                : 'bg-muted'
            }`}
          >
            <DeviceIcon
              device={session.deviceName}
              className={`h-7 w-7 ${
                session.isCurrent
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            />
          </div>

          <div>

            <div className="flex flex-wrap items-center gap-3">

              <h3 className="text-lg font-semibold">
                {shortDevice(session.deviceName)}
              </h3>

              {session.isCurrent && (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">

                  <ShieldCheck className="h-3 w-3" />

                  Current Device

                </span>
              )}

            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {session.ipAddress ?? 'Unknown IP'}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Signed in{' '}
              {new Date(
                session.createdAt
              ).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>

          </div>

        </div>

        {!session.isCurrent && (
          <Button
            variant="outline"
            size="sm"
            disabled={revoking}
            onClick={onRevoke}
            className="rounded-xl"
          >
            {revoking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Revoking
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Revoke
              </>
            )}
          </Button>
        )}

      </div>

    </Card>
  );
}
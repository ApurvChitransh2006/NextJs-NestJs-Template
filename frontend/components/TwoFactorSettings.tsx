'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  ShieldOff,
  Loader2,
  Copy,
  Check,
  KeyRound,
} from 'lucide-react';

import {
  useCurrentUser,
  useRequestTwoFactorSetup,
  useEnableTwoFactor,
  useDisableTwoFactor,
} from '@/hooks/use-auth';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 'idle' | 'scan' | 'backup-codes' | 'disable';

export function TwoFactorSettings() {
  const { data: user } = useCurrentUser();
  const requestSetup = useRequestTwoFactorSetup();
  const enableTwoFactor = useEnableTwoFactor();
  const disableTwoFactor = useDisableTwoFactor();

  const [step, setStep] = useState<Step>('idle');
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const isEnabled = !!user?.twoFactorEnabled;

  const startSetup = () => {
    requestSetup.mutate(undefined, {
      onSuccess: (data) => {
        setSetupData(data);
        setStep('scan');
      },
    });
  };

  const confirmSetup = () => {
    enableTwoFactor.mutate(code, {
      onSuccess: (result) => {
        setBackupCodes(result.backupCodes);
        setStep('backup-codes');
        setCode('');
      },
    });
  };

  const finishSetup = () => {
    setStep('idle');
    setSetupData(null);
    setBackupCodes([]);
  };

  const confirmDisable = () => {
    disableTwoFactor.mutate(code, {
      onSuccess: () => {
        setStep('idle');
        setCode('');
      },
    });
  };

  const copyBackupCodes = async () => {
    await navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden rounded-3xl border-border/40 bg-background/70 backdrop-blur-2xl shadow-xl">
      <div className="border-b border-border/40 p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
              <p className="text-sm text-muted-foreground">
                Require a code from an authenticator app in addition to your password.
              </p>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
              isEnabled
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      <div className="p-8">
        {step === 'idle' && !isEnabled && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Two-factor authentication is currently off. Enabling it protects your account even if your
              password is compromised.
            </p>
            <Button
              type="button"
              onClick={startSetup}
              disabled={requestSetup.isPending}
              className="shrink-0 rounded-xl"
            >
              {requestSetup.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              Enable 2FA
            </Button>
          </div>
        )}

        {step === 'idle' && isEnabled && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Two-factor authentication is active. You&apos;ll need your authenticator app or a backup code
              every time you sign in.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('disable')}
              className="shrink-0 rounded-xl"
            >
              <ShieldOff className="mr-2 h-4 w-4" />
              Disable 2FA
            </Button>
          </div>
        )}

        {step === 'scan' && setupData && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/40 bg-muted/20 p-6 sm:flex-row">
              <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-xl bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={setupData.qrCodeDataUrl} alt="Two-factor QR code" className="h-full w-full" />
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Scan this QR code with Google Authenticator, 1Password, Authy, or any TOTP app. Can&apos;t
                  scan? Enter this code manually:
                </p>
                <code className="block rounded-lg bg-muted px-3 py-2 text-xs font-mono tracking-wider">
                  {setupData.secret}
                </code>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="setup-code">Enter the 6-digit code from your app</Label>
              <Input
                id="setup-code"
                placeholder="123456"
                autoComplete="one-time-code"
                className="h-12 max-w-[200px] rounded-xl text-center text-lg tracking-[0.3em]"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={confirmSetup}
                disabled={enableTwoFactor.isPending || code.length < 6}
                className="rounded-xl"
              >
                {enableTwoFactor.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Confirm and enable
              </Button>
              <Button type="button" variant="ghost" onClick={finishSetup} className="rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === 'backup-codes' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                  <KeyRound className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Save your backup codes</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Each code can be used once if you lose access to your authenticator app. Store them
                    somewhere safe — they won&apos;t be shown again.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/40 bg-muted/20 p-4 font-mono text-sm sm:grid-cols-2">
              {backupCodes.map((c) => (
                <span key={c} className="rounded-lg bg-muted px-3 py-2">
                  {c}
                </span>
              ))}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={copyBackupCodes} className="rounded-xl">
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? 'Copied' : 'Copy codes'}
              </Button>
              <Button type="button" onClick={finishSetup} className="rounded-xl">
                Done
              </Button>
            </div>
          </div>
        )}

        {step === 'disable' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter a current code from your authenticator app (or a backup code) to disable two-factor
              authentication.
            </p>
            <Input
              placeholder="123456"
              autoComplete="one-time-code"
              className="h-12 max-w-[200px] rounded-xl text-center text-lg tracking-[0.3em]"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDisable}
                disabled={disableTwoFactor.isPending || code.length < 6}
                className="rounded-xl"
              >
                {disableTwoFactor.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldOff className="mr-2 h-4 w-4" />
                )}
                Confirm disable
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep('idle');
                  setCode('');
                }}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

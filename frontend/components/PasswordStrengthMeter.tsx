'use client';

import { ShieldCheck } from 'lucide-react';

import { scorePassword } from '@/lib/validators';

const labels = [
  'Too Weak',
  'Weak',
  'Fair',
  'Strong',
  'Excellent',
];

const colors = [
  'bg-destructive',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-primary',
  'bg-emerald-500',
];

const badgeColors = [
  'text-destructive bg-destructive/10',
  'text-orange-500 bg-orange-500/10',
  'text-yellow-500 bg-yellow-500/10',
  'text-primary bg-primary/10',
  'text-emerald-500 bg-emerald-500/10',
];

export function PasswordStrengthMeter({
  password,
}: {
  password: string;
}) {
  if (!password) return null;

  const score = scorePassword(password);

  return (
    <div
      className="mt-3 space-y-3"
      aria-live="polite"
    >

      <div className="flex items-center justify-between">

        <span className="text-xs font-medium text-muted-foreground">
          Password Strength
        </span>

        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${badgeColors[score]}`}
        >
          <ShieldCheck className="h-3 w-3" />

          {labels[score]}

        </span>

      </div>

      <div className="flex gap-2">

        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
              index < score + 1
                ? colors[score]
                : 'bg-muted'
            }`}
          />
        ))}

      </div>

    </div>
  );
}
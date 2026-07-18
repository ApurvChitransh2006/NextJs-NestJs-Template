'use client';

import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@/lib/utils';

export const PasswordInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="group relative">

      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={cn(
          'flex h-12 w-full rounded-xl border border-border/40 bg-background/70',
          'px-4 pr-12 text-sm text-foreground',
          'placeholder:text-muted-foreground',
          'backdrop-blur-xl',
          'transition-all duration-300',
          'focus:border-primary/40',
          'focus:ring-4 focus:ring-primary/10',
          'focus:outline-none',
          'disabled:cursor-not-allowed',
          'disabled:opacity-50',
          className
        )}
        {...props}
      />

      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className={cn(
          'absolute right-2 top-1/2',
          '-translate-y-1/2',
          'flex h-8 w-8 items-center justify-center',
          'rounded-lg',
          'text-muted-foreground',
          'transition-all duration-200',
          'hover:bg-muted',
          'hover:text-foreground',
          'focus:outline-none',
          'focus:ring-2',
          'focus:ring-primary/20'
        )}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>

    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';
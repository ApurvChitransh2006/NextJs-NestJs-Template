'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';

import { cn } from '@/lib/utils';

type UserAvatarProps = {
  name: string;
  avatar?: string | null;
  className?: string;
};

export function UserAvatar({
  name,
  avatar,
  className,
}: UserAvatarProps) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('') || '?';

  return (
    <Avatar
      className={cn(
        'h-10 w-10 rounded-full ring-2 ring-primary/10 transition-all duration-300',
        'hover:ring-primary/30',
        className
      )}
    >
      <AvatarImage
        src={avatar ?? undefined}
        alt={name}
      />

      <AvatarFallback
        className={cn(
          'bg-gradient-to-br',
          'from-primary/20',
          'via-primary/10',
          'to-primary/5',
          'font-semibold',
          'text-primary'
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
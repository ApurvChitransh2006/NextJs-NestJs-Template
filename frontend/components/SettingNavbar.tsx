'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  LayoutGrid,
  User,
  ShieldHalf,
  KeyRound,
  ChevronDown,
  LogOut,
  Settings,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { useAuthStore } from '@/store/auth-store';
import { useLogout } from '@/hooks/use-auth';

import { UserAvatar } from '@/components/UserAvatar';

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const links = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutGrid,
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: User,
  },
  {
    href: '/sessions',
    label: 'Sessions',
    icon: ShieldHalf,
  },
  {
    href: '/settings',
    label: 'Security',
    icon: KeyRound,
  },
];

export function SettingNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);

  const logout = useLogout();

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-2xl">

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo */}

        <Link
          href="/dashboard"
          className="flex items-center gap-3 transition-opacity hover:opacity-90"
        >

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-lg shadow-primary/10">

            <KeyRound className="h-5 w-5 text-primary" />

          </div>

          <div>

            <h1 className="font-heading text-lg font-semibold tracking-tight">
              Vaultline
            </h1>

            <p className="-mt-1 text-xs text-muted-foreground">
              Secure Authentication
            </p>

          </div>

        </Link>

        {/* Desktop Navigation */}

        <NavigationMenu className="hidden md:flex">

          <NavigationMenuList className="gap-2">

            {links.map((link) => {
              const active = pathname === link.href;

              return (
                <NavigationMenuItem key={link.href}>

                  <Link
                    href={link.href}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300',
                      active
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >

                    <link.icon className="h-4 w-4" />

                    {link.label}

                  </Link>

                </NavigationMenuItem>
              );
            })}

          </NavigationMenuList>

        </NavigationMenu>

        {/* User */}

        {user && (
          <DropdownMenu>

            <DropdownMenuTrigger >

              <div className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/40 bg-background/60 px-3 py-2 transition-all hover:border-primary/20 hover:bg-muted">

                <UserAvatar
                  name={user.name}
                  avatar={user.avatar}
                  className="h-9 w-9"
                />

                <div className="hidden text-left lg:block">

                  <p className="text-sm font-medium leading-none">
                    {user.name.split(' ')[0]}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {user.email}
                  </p>

                </div>

                <ChevronDown className="h-4 w-4 text-muted-foreground" />

              </div>

            </DropdownMenuTrigger>
                        <DropdownMenuContent
              align="end"
              className="w-64 rounded-2xl border-border/40 p-2 backdrop-blur-xl"
            >

              {/* User Info */}

              <div className="px-3 py-2">

                <p className="font-medium">
                  {user.name}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {user.email}
                </p>

              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem >

                <Link
                  href="/profile"
                  className="flex cursor-pointer items-center gap-3 rounded-xl"
                >
                  <User className="h-4 w-4" />

                  Profile

                </Link>

              </DropdownMenuItem>

              <DropdownMenuItem >

                <Link
                  href="/sessions"
                  className="flex cursor-pointer items-center gap-3 rounded-xl"
                >
                  <ShieldHalf className="h-4 w-4" />

                  Sessions

                </Link>

              </DropdownMenuItem>

              <DropdownMenuItem >

                <Link
                  href="/settings"
                  className="flex cursor-pointer items-center gap-3 rounded-xl"
                >
                  <Settings className="h-4 w-4" />

                  Security

                </Link>

              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer rounded-xl text-destructive focus:text-destructive"
                onClick={() =>
                  logout.mutate(undefined, {
                    onSettled: () => router.replace('/login'),
                  })
                }
              >
                <LogOut className="mr-2 h-4 w-4" />

                Sign Out

              </DropdownMenuItem>

            </DropdownMenuContent>

          </DropdownMenu>
        )}

      </div>

      {/* Mobile Navigation */}

      <div className="border-t border-border/40 md:hidden">

        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3">

          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <link.icon className="h-4 w-4" />

                {link.label}
              </Link>
            );
          })}

        </nav>

      </div>

    </header>
  );
}
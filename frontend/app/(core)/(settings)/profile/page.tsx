'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  User,
  Mail,
  ImageIcon,
  ShieldCheck,
  Loader2,
  Save,
} from 'lucide-react';

import {
  updateProfileSchema,
  type UpdateProfileInput,
} from '@/lib/validators';

import {
  useCurrentUser,
  useUpdateProfile,
} from '@/hooks/use-auth';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';

export default function ProfilePage() {
  const { data: user, isLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: {
      errors,
      isDirty,
    },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        avatar: user.avatar || '',
      });
    }
  }, [user, reset]);

  const watchedName = watch('name');
  const watchedAvatar = watch('avatar');

  const onSubmit = (data: UpdateProfileInput) => {
    updateProfile.mutate(data);
  };

  if (isLoading || !user) {
    return (
      <div className="space-y-8">

        <Skeleton className="h-10 w-60" />

        <Card className="rounded-3xl border-border/40 bg-background/70 p-8 backdrop-blur-xl">

          <div className="flex items-center gap-5">

            <Skeleton className="h-24 w-24 rounded-full" />

            <div className="space-y-3">

              <Skeleton className="h-6 w-48" />

              <Skeleton className="h-4 w-64" />

              <Skeleton className="h-8 w-32 rounded-full" />

            </div>

          </div>

          <div className="mt-10 space-y-6">

            <Skeleton className="h-12 w-full rounded-xl" />

            <Skeleton className="h-12 w-full rounded-xl" />

            <Skeleton className="ml-auto h-12 w-40 rounded-xl" />

          </div>

        </Card>

      </div>
    );
  }

  return (
    <div className="relative space-y-8">

      {/* Background */}

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">

        <div className="absolute -left-44 top-0 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />

        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />

      </div>

      {/* Hero */}

      <section>

        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Account
        </p>

        <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight">
          Profile Settings
        </h1>

        <p className="mt-3 max-w-2xl text-muted-foreground">
          Manage your personal information and customize how
          your profile appears across the application.
        </p>

      </section>

      {/* Profile Card */}

      <Card className="overflow-hidden rounded-3xl border-border/40 bg-background/70 backdrop-blur-2xl shadow-xl">

        {/* Header */}

        <div className="flex flex-col gap-6 border-b border-border/40 p-8 md:flex-row md:items-center">

          <UserAvatar
            name={watchedName || user.name}
            avatar={watchedAvatar || user.avatar}
            className="h-24 w-24 ring-4 ring-primary/10"
          />

          <div className="flex-1">

            <h2 className="text-2xl font-semibold">
              {watchedName || user.name}
            </h2>

            <div className="mt-2 flex items-center gap-2 text-muted-foreground">

              <Mail className="h-4 w-4" />

              <span>{user.email}</span>

            </div>

            <div className="mt-5 flex flex-wrap gap-3">

              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-500">

                <ShieldCheck className="h-4 w-4" />

                Verified Account

              </span>

            </div>

          </div>

        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 p-8"
          noValidate
        >
                    {/* Personal Information */}

          <div>

            <h3 className="text-lg font-semibold">
              Personal Information
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Update your display name and profile picture.
            </p>

          </div>

          {/* Name */}

          <div className="space-y-2">

            <Label htmlFor="name">
              Full Name
            </Label>

            <div className="relative">

              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="name"
                placeholder="John Doe"
                className="h-12 rounded-xl pl-11"
                {...register('name')}
              />

            </div>

            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}

          </div>

          {/* Avatar */}

          <div className="space-y-2">

            <Label htmlFor="avatar">
              Avatar URL
            </Label>

            <div className="relative">

              <ImageIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="avatar"
                placeholder="https://example.com/avatar.png"
                className="h-12 rounded-xl pl-11"
                {...register('avatar')}
              />

            </div>

            {errors.avatar && (
              <p className="text-xs text-destructive">
                {errors.avatar.message}
              </p>
            )}

          </div>

          {/* Live Preview */}

          <Card className="rounded-2xl border-border/40 bg-muted/20 p-5">

            <div className="flex items-center gap-4">

              <UserAvatar
                name={watchedName || user.name}
                avatar={watchedAvatar || user.avatar}
                className="h-16 w-16 ring-2 ring-primary/10"
              />

              <div>

                <h4 className="font-medium">
                  Live Preview
                </h4>

                <p className="mt-1 text-sm text-muted-foreground">
                  Changes are reflected here before saving.
                </p>

              </div>

            </div>

          </Card>

          {/* Account Information */}

          <div className="rounded-2xl border border-border/40 bg-muted/20 p-5">

            <h3 className="text-lg font-semibold">
              Account Information
            </h3>

            <div className="mt-5 grid gap-5 md:grid-cols-2">

              <div>

                <p className="text-sm text-muted-foreground">
                  Email Address
                </p>

                <p className="mt-2 font-medium">
                  {user.email}
                </p>

              </div>

              <div>

                <p className="text-sm text-muted-foreground">
                  Authentication
                </p>

                <p className="mt-2 font-medium capitalize">
                  {user.provider}
                </p>

              </div>

            </div>

          </div>
                    {/* Actions */}

          <div className="flex flex-col-reverse gap-4 border-t border-border/40 pt-6 sm:flex-row sm:items-center sm:justify-between">

            <div className="min-h-[24px]">

              {updateProfile.isSuccess && !isDirty && (
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-500">

                  <ShieldCheck className="h-4 w-4" />

                  Profile updated successfully

                </div>
              )}

              {isDirty && (
                <p className="text-sm text-muted-foreground">
                  You have unsaved changes.
                </p>
              )}

            </div>

            <Button
              type="submit"
              disabled={updateProfile.isPending || !isDirty}
              className="h-12 rounded-xl px-6 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/30"
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>

          </div>

        </form>

      </Card>

    </div>
  );
}
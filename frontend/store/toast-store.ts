import { toast as sonnerToast } from 'sonner';

export type ToastVariant = 'default' | 'success' | 'error';

export interface Toast {
  title: string;
  description?: string;
  variant: ToastVariant;
}

export function toast({ title, description, variant = 'default' }: Toast) {
  const options = description ? { description } : undefined;

  switch (variant) {
    case 'success':
      return sonnerToast.success(title, options);
    case 'error':
      return sonnerToast.error(title, options);
    default:
      return sonnerToast(title, options);
  }
}

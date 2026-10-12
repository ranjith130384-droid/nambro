import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-transparent bg-indigo-600 text-white shadow hover:bg-indigo-700',
    secondary: 'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100',
    destructive: 'border-transparent bg-red-500 text-white shadow hover:bg-red-600',
    outline: 'text-foreground border border-slate-200 dark:border-slate-800',
  };

  return (
    <div
      className={cn('inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2', variants[variant], className)}
      {...props}
    />
  );
}

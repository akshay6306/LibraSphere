import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  status?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant,
  status,
  children,
  ...props
}) => {
  let resolvedVariant = variant || 'default';

  if (status) {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
      case 'ACTIVE':
      case 'RETURNED':
      case 'PAID':
      case 'READY':
        resolvedVariant = 'success';
        break;
      case 'BORROWED':
      case 'PENDING':
        resolvedVariant = 'warning';
        break;
      case 'OVERDUE':
      case 'LOST':
      case 'DAMAGED':
      case 'EXPIRED':
      case 'CANCELLED':
        resolvedVariant = 'danger';
        break;
      case 'RESERVED':
        resolvedVariant = 'info';
        break;
      default:
        resolvedVariant = 'neutral';
    }
  }

  const variants = {
    default: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    danger: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    info: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide uppercase',
        variants[resolvedVariant],
        className
      )}
      {...props}
    >
      {children || status}
    </span>
  );
};

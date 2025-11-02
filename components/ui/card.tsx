import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/ui/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'glass-md shadow-minimal shadow-inner-light border-gradient-subtle rounded-2xl p-6 transition-glass',
        className,
      )}
      {...props}
    />
  );
}

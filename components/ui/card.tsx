import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/ui/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/70 bg-background/80 p-6 shadow-soft backdrop-blur-md',
        className,
      )}
      {...props}
    />
  );
}

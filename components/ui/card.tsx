import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/ui/cn';

type CardSurface = 'glass' | 'frosted' | 'light';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardBorder = 'gradient' | 'soft' | 'none';
type CardElevation = 'flat' | 'raised';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  readonly surface?: CardSurface;
  readonly padding?: CardPadding;
  readonly border?: CardBorder;
  readonly elevation?: CardElevation;
}

const surfaceClasses: Record<CardSurface, string> = {
  glass: 'glass-card glass-md',
  frosted: 'glass-lg',
  light: 'glass-sm',
};

const paddingClasses: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

const borderClasses: Record<CardBorder, string> = {
  gradient: 'border-gradient-subtle',
  soft: 'border border-white/20',
  none: 'border border-transparent',
};

const elevationClasses: Record<CardElevation, string> = {
  flat: 'shadow-none',
  raised: 'shadow-minimal shadow-inner-light',
};

export function Card({
  className,
  surface = 'glass',
  padding = 'lg',
  border = 'gradient',
  elevation = 'raised',
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl transition-glass',
        surfaceClasses[surface],
        borderClasses[border],
        elevationClasses[elevation],
        paddingClasses[padding],
        className,
      )}
      {...props}
    />
  );
}

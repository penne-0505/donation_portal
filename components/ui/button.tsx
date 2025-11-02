import Link from 'next/link';
import * as React from 'react';
import { cn } from '@/lib/ui/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly href?: string;
}

const baseClasses =
  'inline-flex items-center justify-center rounded-lg font-semibold transition-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none glow-accent-subtle';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground/40',
  secondary:
    'bg-muted text-foreground hover:bg-muted/50 border border-border focus-visible:ring-muted-foreground/40',
  ghost: 'bg-transparent text-foreground hover:bg-muted/40',
  outline:
    'border border-border bg-background hover:bg-muted/5 focus-visible:ring-muted-foreground/40',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', href, type = 'button', children, ...props },
  ref,
) {
  const classes = cn(baseClasses, variants[variant], sizes[size], className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button ref={ref} type={type} className={classes} {...props}>
      {children}
    </button>
  );
});

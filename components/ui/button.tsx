import Link from 'next/link';
import * as React from 'react';
import { cn } from '@/lib/ui/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'discord';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly href?: string;
}

const baseClasses =
  'inline-flex items-center justify-center rounded-xl font-semibold transition-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-slate-900 text-white shadow-[0_6px_20px_rgba(17,24,39,0.18)] hover:bg-slate-900/90 focus-visible:ring-slate-900/30',
  secondary:
    'glass-md text-foreground shadow-minimal shadow-inner-light border-gradient-subtle hover-glass focus-visible:ring-foreground/20',
  ghost:
    'glass-sm text-foreground border border-transparent shadow-minimal shadow-inner-light hover-glass focus-visible:ring-muted-foreground/25',
  outline:
    'glass-sm text-foreground border border-white/20 shadow-minimal shadow-inner-light hover-glass focus-visible:ring-muted-foreground/25',
  discord:
    'bg-[#5865f2] text-white shadow-[0_12px_32px_rgba(88,101,242,0.28)] hover:bg-[#4752c4] focus-visible:ring-[#5865f2]/35',
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
    const anchorProps = props as React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <Link href={href} className={classes} {...anchorProps}>
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

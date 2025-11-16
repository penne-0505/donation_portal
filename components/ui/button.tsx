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
  'ui-button inline-flex items-center justify-center rounded-xl border font-semibold transition-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-45 disabled:pointer-events-none';

const variants: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-foreground text-white shadow-soft hover:bg-foreground/90 focus-visible:ring-foreground/15',
  secondary:
    'glass-md border-white/30 text-foreground shadow-minimal shadow-inner-light hover-glass focus-visible:ring-foreground/15',
  ghost:
    'border-transparent bg-transparent text-muted-foreground hover:bg-white/10 focus-visible:ring-foreground/10',
  outline:
    'border-white/25 bg-transparent text-foreground hover:border-white/40 focus-visible:ring-foreground/15',
  discord:
    'border-[#5865f2]/40 bg-[#5865f2]/10 text-[#5865f2] hover:bg-[#5865f2]/15 focus-visible:ring-[#5865f2]/30',
};

const accentMap: Record<ButtonVariant, string> = {
  primary: 'primary',
  secondary: 'surface',
  ghost: 'ghost',
  outline: 'outline',
  discord: 'brand',
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
  const dataAccent = accentMap[variant];
  const classes = cn(baseClasses, variants[variant], sizes[size], className);

  if (href) {
    const anchorProps = props as React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <Link href={href} className={classes} data-accent={dataAccent} {...anchorProps}>
        {children}
      </Link>
    );
  }

  return (
    <button ref={ref} type={type} className={classes} data-accent={dataAccent} {...props}>
      {children}
    </button>
  );
});

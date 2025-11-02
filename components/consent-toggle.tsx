import * as React from 'react';
import { cn } from '@/lib/ui/cn';

export interface ConsentToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  readonly checked: boolean;
  readonly onCheckedChange?: (checked: boolean) => void;
}

export const ConsentToggle = React.forwardRef<HTMLButtonElement, ConsentToggleProps>(
  function ConsentToggle(
    { checked, onCheckedChange, className, disabled, onClick, ...props },
    ref,
  ) {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }
      onCheckedChange?.(!checked);
      onClick?.(event);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        data-active={checked ? 'true' : undefined}
        data-state={checked ? 'on' : 'off'}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-8 w-14 items-center justify-start overflow-hidden rounded-full px-1 transition-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 glow-accent-medium',
          checked ? 'bg-[rgba(88,101,242,0.22)]' : 'bg-white/[0.14]',
          className,
        )}
        onClick={handleClick}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 rounded-full border transition-glass',
            checked
              ? 'border-white/50 bg-gradient-to-b from-white/55 to-white/25'
              : 'border-white/30 bg-white/[0.22]',
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            'relative z-10 inline-flex h-6 w-6 translate-x-0 items-center justify-center rounded-full bg-background text-foreground shadow-minimal transition-glass',
            checked
              ? 'translate-x-6 bg-foreground text-background shadow-inner-light'
              : 'translate-x-0',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'h-2 w-2 rounded-full transition-glass',
              checked ? 'bg-background/90' : 'bg-foreground/70',
            )}
          />
        </span>
      </button>
    );
  },
);

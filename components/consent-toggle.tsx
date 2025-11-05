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
          'group relative inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full transition-all duration-200 ease-macos focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          checked
            ? 'bg-gradient-to-b from-[#5865f2] to-[#4752c4] shadow-[0_1px_3px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.06)]'
            : 'bg-gradient-to-b from-white/[0.20] to-white/[0.12] shadow-[0_1px_2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.25)]',
          className,
        )}
        onClick={handleClick}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 rounded-full border transition-all duration-200 ease-macos',
            checked ? 'border-[#4752c4]/60' : 'border-white/30',
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            'relative z-10 flex h-[27px] w-[27px] items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_0.5px_rgba(0,0,0,0.06)] transition-all duration-200 ease-macos',
            checked ? 'translate-x-[22px]' : 'translate-x-[2px]',
          )}
        />
      </button>
    );
  },
);

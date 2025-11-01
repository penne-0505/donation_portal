import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/ui/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  readonly onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, checked, defaultChecked, disabled, onCheckedChange, onChange, ...props },
  ref,
) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(event.target.checked);
    onChange?.(event);
  };

  return (
    <span className="relative inline-flex h-5 w-5">
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          'peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-border/80 bg-background text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={handleChange}
        {...props}
      />
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-foreground text-background opacity-0 transition peer-checked:opacity-100 peer-disabled:bg-border/70',
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
    </span>
  );
});

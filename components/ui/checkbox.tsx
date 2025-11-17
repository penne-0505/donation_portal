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
    <span className="relative inline-flex h-6 w-6">
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          'peer h-6 w-6 cursor-pointer appearance-none rounded-md border-2 border-border/80 bg-background text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 peer-checked:border-transparent disabled:cursor-not-allowed disabled:opacity-60',
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
        <Check className="h-4 w-4" />
      </span>
    </span>
  );
});

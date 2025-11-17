import * as React from 'react';
import { Checkbox, type CheckboxProps } from '@/components/ui/checkbox';
import { cn } from '@/lib/ui/cn';

export interface ConsentToggleProps extends CheckboxProps {
  readonly containerClassName?: string;
}

export const ConsentToggle = React.forwardRef<HTMLInputElement, ConsentToggleProps>(
  function ConsentToggle(
    { className, containerClassName, disabled, onCheckedChange, onChange, ...props },
    ref,
  ) {
    const handleCheckedChange = (checked: boolean) => {
      if (disabled) return;
      onCheckedChange?.(checked);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      onChange?.(event);
    };

    return (
      <span className={cn('inline-flex shrink-0', containerClassName)}>
        <Checkbox
          ref={ref}
          className={className}
          disabled={disabled}
          onCheckedChange={handleCheckedChange}
          onChange={handleChange}
          {...props}
        />
      </span>
    );
  },
);

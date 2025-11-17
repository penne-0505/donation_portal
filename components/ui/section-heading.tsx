import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/ui/cn';

type HeadingSize = 'sm' | 'md' | 'lg';
type HeadingAlign = 'start' | 'center';
type HeadingTag = 'h1' | 'h2' | 'h3';

export interface SectionHeadingProps extends HTMLAttributes<HTMLDivElement> {
  readonly heading: ReactNode;
  readonly description?: ReactNode;
  readonly size?: HeadingSize;
  readonly align?: HeadingAlign;
  readonly spacing?: 'tight' | 'normal';
  readonly as?: HeadingTag;
  readonly headingId?: string;
  readonly descriptionId?: string;
}

const titleClasses: Record<HeadingSize, string> = {
  sm: 'text-xl font-semibold text-foreground',
  md: 'text-2xl font-semibold text-foreground',
  lg: 'text-3xl font-bold tracking-tight text-foreground',
};

const descriptionClasses: Record<HeadingSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function SectionHeading({
  heading,
  description,
  size = 'md',
  align = 'start',
  spacing = 'normal',
  as = 'h2',
  headingId,
  descriptionId,
  className,
  ...props
}: SectionHeadingProps) {
  const HeadingTag = as;
  return (
    <div
      className={cn(
        spacing === 'tight' ? 'space-y-1' : 'space-y-2',
        align === 'center' && 'text-center',
        className,
      )}
      {...props}
    >
      <HeadingTag id={headingId} className={titleClasses[size]}>
        {heading}
      </HeadingTag>
      {description ? (
        <p id={descriptionId} className={cn(descriptionClasses[size], 'text-muted-foreground')}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

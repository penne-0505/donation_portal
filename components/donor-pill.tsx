interface DonorPillProps {
  readonly name: string;
}

export function DonorPill({ name }: DonorPillProps) {
  return (
    <span className="rounded-full glass-sm border-gradient-subtle px-4 py-2 text-sm font-medium text-foreground transition-glass hover-glass">
      {name}
    </span>
  );
}

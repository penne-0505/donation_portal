interface DonorPillProps {
  readonly name: string;
}

export function DonorPill({ name }: DonorPillProps) {
  return (
    <span className="rounded-full border border-border/60 bg-surface px-4 py-2 text-sm font-medium text-foreground shadow-soft transition">
      {name}
    </span>
  );
}

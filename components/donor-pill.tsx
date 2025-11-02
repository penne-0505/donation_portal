interface DonorPillProps {
  readonly name: string;
}

export function DonorPill({ name }: DonorPillProps) {
  return (
    <span className="rounded-full glass-sm px-4 py-2 text-sm font-medium text-foreground shadow-minimal shadow-inner-light transition">
      {name}
    </span>
  );
}

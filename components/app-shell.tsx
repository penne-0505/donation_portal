import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/ui/cn';

interface AppShellProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="min-h-screen bg-surface text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-foreground transition hover:opacity-80"
          >
            Donation Portal
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
            <Link
              href="/donate"
              className="transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2"
            >
              寄附
            </Link>
            <Link
              href="/donors"
              className="transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2"
            >
              Donors
            </Link>
          </nav>
        </div>
      </header>
      <main className={cn('mx-auto w-full max-w-6xl px-5 py-14', className)}>{children}</main>
    </div>
  );
}

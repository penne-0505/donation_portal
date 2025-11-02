'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/ui/cn';
import { Button } from '@/components/ui/button';

interface AppShellProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  const handleCtaClick = () => {
    // 計測イベント発火
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'hero_cta_click');
    }
  };

  const handleDonorListClick = () => {
    // 計測イベント発火
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'donor_list_click');
    }
  };

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
          <nav className="flex items-center gap-4">
            <Link
              href="/donors"
              onClick={handleDonorListClick}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2"
            >
              支援者一覧
            </Link>
            <Button
              href="/donate"
              onClick={handleCtaClick}
              size="sm"
              className="gap-2"
              aria-label="寄付をはじめる"
            >
              寄付する
            </Button>
          </nav>
        </div>
      </header>
      <main className={cn('mx-auto w-full max-w-6xl px-5 py-14', className)}>{children}</main>
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5">
          <span>© 2025 Donation Portal</span>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="transition hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/30"
            >
              プライバシーポリシー
            </Link>
            <span className="text-border/40">•</span>
            <Link
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/30"
            >
              運営者情報
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

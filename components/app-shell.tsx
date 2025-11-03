'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/ui/cn';
import { ORGANIZATION_NAME } from '@/lib/ui/branding';
import { useHeroContext } from '@/lib/ui/contexts/hero-context';
import { Button } from '@/components/ui/button';

interface AppShellProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  const { heroInView, hasHeroSection } = useHeroContext();

  const isHeroCtaSuppressed = hasHeroSection && heroInView;

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
    <div className="app-shell relative flex min-h-screen flex-col bg-root text-foreground">
      <header className="sticky top-0 z-40 px-4 pt-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl glass-sm border-gradient-subtle px-5 py-3 shadow-minimal shadow-inner-light backdrop-blur transition-glass">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-foreground transition-colors transition-macos hover:opacity-80"
          >
            {ORGANIZATION_NAME}
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/donors"
              onClick={handleDonorListClick}
              className="text-sm font-medium text-muted-foreground transition-colors transition-macos hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 focus-visible:ring-offset-2"
            >
              支援者一覧
            </Link>
            <Button
              href="/donate"
              onClick={handleCtaClick}
              size="md"
              variant={isHeroCtaSuppressed ? 'outline' : 'primary'}
              className={cn(
                'gap-2 transition-all duration-200',
                isHeroCtaSuppressed && 'opacity-80 hover:opacity-100',
              )}
              data-state={isHeroCtaSuppressed ? 'suppressed' : 'active'}
              aria-label="寄付をはじめる"
            >
              <span className="flex items-center gap-2">
                寄付する
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Button>
          </nav>
        </div>
      </header>
      <main
        className={cn('relative z-10 mx-auto w-full flex-1 max-w-6xl px-5 py-6 md:py-8', className)}
      >
        {children}
      </main>
      <footer className="relative z-10 px-4 pb-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl glass-sm border-gradient-subtle px-5 py-4 shadow-minimal shadow-inner-light transition-glass">
          {' '}
          <span>© 2025 {ORGANIZATION_NAME}</span>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="transition-colors transition-macos hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/25 focus-visible:ring-offset-2"
            >
              プライバシーポリシー
            </Link>
            <span className="text-border/40">•</span>
            <Link
              href="/privacy#operator-info"
              className="transition-colors transition-macos hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/25 focus-visible:ring-offset-2"
            >
              運営者情報
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

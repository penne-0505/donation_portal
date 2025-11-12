'use client';

import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/ui/cn';
import { ORGANIZATION_NAME } from '@/lib/ui/branding';
import { useHeroContext } from '@/lib/ui/contexts/hero-context';
import { Button } from '@/components/ui/button';

interface AppShellProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  const { buttonShouldBeDeemphasized } = useHeroContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  return (
    <div className="app-shell relative flex min-h-screen flex-col bg-root text-foreground">
      <header className="sticky top-0 z-40 px-4 pt-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl glass-sm border-gradient-subtle px-5 py-3 shadow-minimal shadow-inner-light backdrop-blur transition-glass relative">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-foreground transition-colors transition-macos hover:opacity-80"
          >
            {ORGANIZATION_NAME}
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
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
              variant={buttonShouldBeDeemphasized ? 'outline' : 'primary'}
              className={cn(
                'gap-2 transition-all duration-200',
                buttonShouldBeDeemphasized && 'opacity-80 hover:opacity-100',
              )}
              data-state={buttonShouldBeDeemphasized ? 'deemphasized' : 'active'}
              aria-label="寄付をはじめる"
            >
              <span className="flex items-center gap-2">
                寄付する
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Button>
          </nav>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-10 w-10 px-0"
            onClick={toggleMobileMenu}
            aria-label="メニューを開閉"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </Button>
          {isMobileMenuOpen && (
            <div
              id="mobile-menu"
              className="absolute left-4 right-4 top-full mt-3 flex flex-col gap-3 rounded-2xl glass-sm border-gradient-subtle bg-root/95 p-4 shadow-minimal shadow-inner-light backdrop-blur md:hidden"
            >
              <Link
                href="/donors"
                onClick={() => {
                  handleDonorListClick();
                  setIsMobileMenuOpen(false);
                }}
                className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors transition-macos hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 focus-visible:ring-offset-2"
              >
                支援者一覧
              </Link>
              <Button
                href="/donate"
                onClick={() => {
                  handleCtaClick();
                  setIsMobileMenuOpen(false);
                }}
                size="md"
                variant={buttonShouldBeDeemphasized ? 'outline' : 'primary'}
                className={cn(
                  'w-full justify-center gap-2 transition-all duration-200',
                  buttonShouldBeDeemphasized && 'opacity-80 hover:opacity-100',
                )}
                data-state={buttonShouldBeDeemphasized ? 'deemphasized' : 'active'}
                aria-label="寄付をはじめる"
              >
                <span className="flex items-center justify-center gap-2">
                  寄付する
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Button>
            </div>
          )}
        </div>
      </header>
      <main
        className={cn('relative z-10 mx-auto w-full flex-1 max-w-6xl px-5 py-6 md:py-8', className)}
      >
        {children}
      </main>
      <footer className="relative z-10 px-4 pb-6 text-center text-[11px] text-muted-foreground md:text-xs">
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

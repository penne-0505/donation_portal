'use client';

import { ArrowRight, Lock, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHeroContext } from '@/lib/ui/contexts/hero-context';

export function HomePage() {
  const { heroRef } = useHeroContext();
  const highlightBadges = [
    { icon: Lock, label: 'Stripeで安全決済' },
    { icon: ShieldCheck, label: 'OAuthで同意管理' },
    { icon: Users, label: '支援者リストを公開' },
  ];
  const ctaGlowContainerClass =
    'inline-flex overflow-hidden rounded-2xl glass-sm border-gradient-subtle transition-glass';
  const ctaPrimaryGlowContainerClass = `${ctaGlowContainerClass} p-[1px]`;

  const handleCTAClick = () => {
    // 計測イベント: 寄付開始
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'donate_start');
    }
  };

  return (
    <div className="page-enter flex min-h-[calc(100vh-13.5rem)] flex-col justify-center md:min-h-[calc(100vh-14.5rem)]">
      {/* ヒーロー */}
      <section
        ref={heroRef}
        className="flex flex-col items-center justify-center px-6 py-4 text-center sm:py-5 lg:py-6"
      >
        <div className="hero-focus mx-auto flex w-full max-w-4xl flex-col items-center">
          <div className="mb-5 space-y-3 sm:mb-6 sm:space-y-4">
            <h1 className="font-hero text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              みんなで創る、みんなの世界
            </h1>
            <p className="font-hero-sub text-balance text-base text-muted-foreground md:text-lg">
              あなたの想いが、みんなの冒険を支えます。
            </p>
          </div>

          {/* CTA ボタン2つ */}
          <div className="mb-6 flex flex-col items-center justify-center gap-3 sm:mb-8 sm:flex-row">
            <div className={ctaPrimaryGlowContainerClass}>
              <Button
                href="/donate"
                onClick={handleCTAClick}
                size="md"
                variant="primary"
                className="donate-cta-animated cta-donate-glow gap-2 px-8 text-white"
                aria-label="寄付をはじめる"
                data-accent="primary"
              >
                <span className="flex items-center gap-2">
                  寄付する
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Button>
            </div>
            <div className={ctaGlowContainerClass}>
              <Button
                href="/donors"
                size="md"
                variant="outline"
                className="px-8"
                aria-label="支援者一覧を表示"
              >
                支援者一覧
              </Button>
            </div>
          </div>

          {/* バッジ3つ */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {highlightBadges.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="rounded-full glass-sm border-gradient-subtle px-4 py-2 text-center text-xs font-medium text-foreground transition-glass hover-glass md:text-sm select-none"
              >
                <span className="flex items-center justify-center gap-2">
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

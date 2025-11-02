'use client';

import { ArrowRight, Lock, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HomePage() {
  const highlightBadges = [
    { icon: Lock, label: 'Stripeで安全決済' },
    { icon: ShieldCheck, label: 'OAuthで同意管理' },
    { icon: Users, label: '支援者リストを公開' },
  ];

  const handleCTAClick = () => {
    // 計測イベント: 寄付開始
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'donate_start');
    }
  };

  return (
    <div className="page-enter space-y-20">
      {/* ヒーロー */}
      <section className="flex min-h-[50vh] flex-col items-center justify-center gap-8 py-16 text-center md:py-24">
        <div className="hero-focus mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-6">
          <div className="space-y-4">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              みんなで創る、みんなの世界
            </h1>
            <p className="text-balance text-base text-muted-foreground md:text-lg">
              あなたの想いが、みんなの冒険を支えます。
            </p>
          </div>

          {/* CTA ボタン2つ */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              href="/donate"
              onClick={handleCTAClick}
              size="lg"
              className="gap-2 px-8"
              aria-label="寄付をはじめる"
            >
              <span className="flex items-center gap-2">
                寄付する
                <ArrowRight className="h-5 w-5" aria-hidden />
              </span>
            </Button>
            <Button
              href="/donors"
              size="lg"
              variant="outline"
              className="px-8"
              aria-label="支援者一覧を表示"
            >
              支援者一覧
            </Button>
          </div>

          {/* バッジ3つ */}
          <div className="flex flex-wrap justify-center gap-3 pt-4 md:pt-6">
            {highlightBadges.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="rounded-full glass-sm border-gradient-subtle px-4 py-2 text-center text-xs font-medium text-foreground shadow-minimal shadow-inner-light transition-glass hover-glass md:text-sm"
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

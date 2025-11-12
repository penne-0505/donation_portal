'use client';

import { useEffect } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfettiCelebration } from '@/components/confetti-celebration';
import { SectionHeading } from '@/components/ui/section-heading';
import { ORGANIZATION_NAME } from '@/lib/ui/branding';

export function ThanksPage() {
  useEffect(() => {
    // 計測イベント: 寄付完了
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'donate_complete');
    }
  }, []);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16 text-center page-enter">
      <ConfettiCelebration />
      <Card
        surface="glass"
        padding="lg"
        className="flex w-full max-w-2xl flex-col gap-8 glass-lg p-10 sm:p-12"
      >
        <div className="flex flex-col items-center gap-6">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-background animate-bounce-in">
            <CheckCircle2 className="h-8 w-8" aria-hidden />
          </span>
          <SectionHeading
            as="h1"
            size="lg"
            align="center"
            headingId="thanks-heading"
            descriptionId="thanks-description"
            heading="ご支援ありがとうございます"
            description={
              <span className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
                Stripe Checkout での寄付が完了しました。ご支援いただいたお気持ちは{' '}
                {ORGANIZATION_NAME}
                の運営費に充てさせていただきます。
              </span>
            }
          />
          <div className="inline-flex flex-col gap-2 rounded-lg glass-sm border-gradient-subtle px-4 py-3 shadow-minimal shadow-inner-light transition-glass">
            <span className="text-sm font-medium text-muted-foreground">あなたの支援が</span>
            <span className="text-lg font-semibold text-foreground">
              コミュニティの未来を支えます
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Stripe レシートの決済完了メールをご確認ください。
          </p>
        </div>

        <div className="rounded-lg glass-sm border border-dashed border-white/25 px-6 py-5 text-sm text-muted-foreground shadow-minimal shadow-inner-light transition-glass">
          この寄付は任意のものであり、対価や特典、税控除の対象にはなりません。領収書は Stripe
          から送信されるメールをご確認ください。
        </div>

        <div className="flex justify-center">
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl glass-sm border-gradient-subtle shadow-minimal shadow-inner-light transition-glass">
            <Button
              href="/donors"
              size="md"
              variant="primary"
              className="w-full gap-2 px-8 sm:text-base"
              aria-label="支援者一覧を見る"
            >
              <span className="flex items-center justify-center gap-2">
                支援者一覧を見る
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

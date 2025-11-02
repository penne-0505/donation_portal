import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfettiCelebration } from '@/components/confetti-celebration';

export function ThanksPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16 text-center page-enter">
      <ConfettiCelebration />
      <Card className="flex w-full max-w-2xl flex-col gap-8 glass-lg p-10 sm:p-12">
        <div className="flex flex-col items-center gap-6">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-background animate-bounce-in">
            <CheckCircle2 className="h-8 w-8" aria-hidden />
          </span>
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3" aria-hidden />
            <span>Donation Complete</span>
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            ご支援ありがとうございます
          </h1>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Stripe Checkout での寄附が完了しました。ご支援いただいたお気持ちは Minecraft
            サーバーの運営費に充てさせていただきます。
          </p>
          <div className="inline-flex flex-col gap-2 rounded-lg glass-sm px-4 py-3 shadow-minimal shadow-inner-light">
            <span className="text-sm font-medium text-muted-foreground">あなたの支援が</span>
            <span className="text-lg font-semibold text-foreground">
              コミュニティの未来を支えます
            </span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">
            <span className="rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background">
              Stripe レシート
            </span>
            <span>決済完了メールをご確認ください</span>
          </div>
        </div>

        <div className="rounded-lg glass-sm border border-dashed border-white/25 px-6 py-5 text-sm text-muted-foreground shadow-minimal shadow-inner-light">
          この寄附は任意のものであり、対価や特典、税控除の対象にはなりません。領収書は Stripe
          から送信されるメールをご確認ください。
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button href="/donate" size="md" className="flex-1 gap-2 sm:text-base">
            <span className="flex items-center gap-2">
              寄附ページへ戻る
              <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </Button>
          <Button
            href="/donors"
            size="md"
            variant="outline"
            className="flex-1 bg-transparent sm:text-base"
          >
            Donors 一覧を見る
          </Button>
        </div>
      </Card>
    </div>
  );
}

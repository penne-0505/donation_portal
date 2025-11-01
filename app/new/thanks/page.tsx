import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfettiCelebration } from '@/components/confetti-celebration';

export default function ThanksPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 py-16 text-center">
      <ConfettiCelebration />
      <Card className="mx-auto flex w-full max-w-2xl flex-col gap-6 bg-surface-strong px-8 py-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">
          ご支援ありがとうございます
        </h1>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
          Stripe Checkout での寄附が完了しました。ご支援いただいたお気持ちは Minecraft
          サーバーの運営費に充てさせていただきます。
        </p>
        <p className="rounded-xl border border-border/60 bg-surface px-4 py-3 text-xs text-muted-foreground">
          この寄附は任意のものであり、対価や特典、税控除の対象にはなりません。決済レシートは Stripe
          から送信されるメールをご確認ください。
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/new/donate" size="md">
            <span className="flex items-center gap-2">
              寄附ページへ戻る
              <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </Button>
          <Button href="/new/donors" size="md" variant="outline">
            Donors 一覧を見る
          </Button>
        </div>
      </Card>
    </div>
  );
}

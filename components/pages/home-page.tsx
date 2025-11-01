import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HomePage() {
  return (
    <section className="flex flex-col gap-16 py-10">
      <div className="flex flex-col items-start gap-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-surface-strong px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
          Cloudflare Pages × React UI
        </span>
        <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Donation Portal
        </h1>
        <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          Discord コミュニティ向け寄附ポータルの UI が React ベースへ完全移行しました。Stripe
          Checkout と Discord OAuth の 連携を維持したまま、アクセシビリティと可読性を高めています。
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/donate" size="lg">
            <span className="flex items-center gap-2">
              寄附を始める
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
          <Button href="/donors" size="lg" variant="outline">
            Donors を見る
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {[
          {
            title: 'OAuth で同意管理',
            description: 'Discord ログインと掲示同意を UI から即座に更新できます。',
          },
          {
            title: 'Stripe Checkout 連携',
            description: '単発・継続寄附を選択し、完了後は自動的にサンクスページへ遷移します。',
          },
          {
            title: 'Donors 公開リスト',
            description: '掲示に同意した表示名のみを安全に取得し、常に最新の一覧を表示します。',
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-border/70 bg-surface/80 p-6 shadow-soft"
          >
            <h2 className="text-lg font-semibold text-foreground">{feature.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

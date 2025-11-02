import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HomePage() {
  return (
    <div className="space-y-20 py-12 page-enter">
      <section className="flex min-h-[55vh] flex-col items-center justify-center gap-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden />
          Discord Community Support
        </div>
        <h1 className="text-balance text-5xl font-bold tracking-tight text-foreground md:text-6xl">
          Donation Portal
        </h1>
        <p className="max-w-3xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
          Discord
          コミュニティの運営を支える寄附ポータル。透明性のある運営と、支援者の皆さまへの感謝を大切にしています。
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/donate" size="lg" className="gap-2 px-8">
            <span className="flex items-center gap-2">
              寄附する
              <ArrowRight className="h-5 w-5" aria-hidden />
            </span>
          </Button>
          <Button href="/donors" size="lg" variant="outline" className="px-8 bg-transparent">
            Donors を見る
          </Button>
        </div>

        <div className="grid w-full max-w-3xl gap-8 pt-10 sm:grid-cols-3">
          {[
            { title: '透明性', description: '寄附の使途を明確に' },
            { title: '任意性', description: '対価のない純粋な支援' },
            { title: '感謝', description: '支援者への敬意' },
          ].map((feature) => (
            <div key={feature.title} className="space-y-1 text-center">
              <p className="text-3xl font-bold text-foreground">{feature.title}</p>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
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
            className="rounded-2xl glass-sm p-6 text-left shadow-minimal shadow-inner-light transition duration-200 hover:bg-white/10 hover:border-white/30"
          >
            <h2 className="text-lg font-semibold text-foreground">{feature.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

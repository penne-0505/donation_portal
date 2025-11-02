import { ORGANIZATION_NAME, REPRESENTATIVE_NAME } from '@/lib/ui/branding';

export default function PrivacyPage() {
  return (
    <div className="space-y-8 py-8 page-enter">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          プライバシーポリシー
        </h1>
        <p className="text-base text-muted-foreground">最終更新：2025年11月2日</p>
      </div>

      <div className="prose prose-invert max-w-3xl space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">1. 序文</h2>
          <p>
            本プライバシーポリシー（以下、「本ポリシー」）は、Donation
            Portal（以下、「本サービス」）における個人情報の取り扱いについて定めるものです。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">2. 取得する情報</h2>
          <p>本サービスは以下の情報を取得します：</p>
          <ul className="list-inside list-disc space-y-1 pl-2">
            <li>Discord OAuth を通じた表示名およびユーザーID</li>
            <li>寄付金額および決済方法（Stripe 経由）</li>
            <li>支援者リスト掲示への同意情報</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">3. 情報の利用</h2>
          <p>取得した情報は以下の目的で利用します：</p>
          <ul className="list-inside list-disc space-y-1 pl-2">
            <li>寄付の受け付けおよび処理</li>
            <li>支援者リストの掲示（同意者のみ）</li>
            <li>本サービスの改善・分析</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">4. 第三者への開示</h2>
          <p>
            本ポリシーで定める場合を除き、個人情報を第三者に開示することはありません。ただし、Stripe
            による決済処理の必要上、Stripe に情報を提供します。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">5. セキュリティ</h2>
          <p>本サービスは、個人情報の安全性を確保するため、SSL/TLS 暗号化通信を採用しています。</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">6. ポリシーの変更</h2>
          <p>本ポリシーは予告なく変更される場合があります。最新版は本ページで常に参照できます。</p>
        </section>

        <section className="space-y-2" id="operator-info">
          <h2 className="text-lg font-semibold text-foreground">7. 運営者情報</h2>
          <dl className="space-y-3">
            <div className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                団体名 / 社名
              </dt>
              <dd className="text-sm text-foreground">{ORGANIZATION_NAME}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                代表者
              </dt>
              <dd className="text-sm text-foreground">{REPRESENTATIVE_NAME}</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">8. お問い合わせ</h2>
          <p>
            本ポリシーに関するご質問やご懸念は、Discord サーバーにて {REPRESENTATIVE_NAME}（
            {ORGANIZATION_NAME}）までお問い合わせください。
          </p>
        </section>
      </div>
    </div>
  );
}

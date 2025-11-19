'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ORGANIZATION_NAME, REPRESENTATIVE_NAME } from '@/lib/ui/branding';

function TermsContent() {
  return (
    <div className="space-y-6 leading-relaxed text-muted-foreground">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">1. 本サービスの目的・性質</h2>
        <p>
          本サービスは、特定のオンラインコミュニティ（Discord
          サーバー等）に対する任意の金銭的支援（寄付）を受け付けることを目的とするものであり、
          利用者に対していかなる経済的・物理的・デジタルな対価や特典を約束するものではありません。
        </p>
        <p>
          本サービスを通じた支払いは、法令上の「寄付」またはこれと同視しうる任意の支援であり、原則として商品の購入やサービスの対価支払いとは異なる性質のものです。
        </p>
        <p>
          本サービスは、寄付金の募集および受付を行うための仕組みを提供するものであり、コミュニティ運営の方針（寄付金の具体的な使途や活動内容等）について保証するものではありません。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">2. 規約への同意および変更</h2>
        <p>
          利用者は、本サービスを利用する前に本規約の内容を確認し、同意したうえで本サービスを利用するものとします。
        </p>
        <p>
          運営者は、必要と判断した場合、事前の予告なく本規約の内容を変更することができます。変更後の本規約は、本サービス上に掲載された時点から効力を生じるものとします。
        </p>
        <p>
          規約変更後に利用者が本サービスを利用した場合、変更後の規約に同意したものとみなされます。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">3. 利用条件</h2>
        <p>利用者は、以下のすべてを満たす場合に限り、本サービスを利用することができます。</p>
        <ul className="list-inside list-disc space-y-1 pl-2">
          <li>本サービスの利用およびクレジットカード等による支払い能力を有していること</li>
          <li>未成年者である場合、親権者その他の法定代理人の同意を得ていること</li>
          <li>反社会的勢力等に該当せず、またこれと関係を有しないこと</li>
        </ul>
        <p>
          利用者は、本サービスを通じて入力・送信する情報が真実かつ正確であり、最新の状態であることを保証します。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">4. 禁止事項</h2>
        <p>利用者は、本サービスの利用にあたり、以下の行為を行ってはなりません。</p>
        <ul className="list-inside list-disc space-y-1 pl-2">
          <li>法令または公序良俗に違反する行為</li>
          <li>本サービスの運営を妨害する行為、またはそのおそれのある行為</li>
          <li>他者になりすまして寄付を行う行為、または虚偽の名義・情報を用いる行為</li>
          <li>不正アクセス、ボット等の不正な手段により本サービスを利用する行為</li>
          <li>マネーロンダリングその他の不正な資金洗浄目的で本サービスを利用する行為</li>
          <li>Stripe、Discord その他関連サービスの利用規約に違反する行為</li>
          <li>その他、運営者が不適切と合理的に判断する行為</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">5. 決済および寄付の性質</h2>
        <p>
          本サービスにおける決済処理は、Stripe, Inc.
          またはその関係会社が提供する決済プラットフォームを通じて行われます。利用者は、Stripe
          の利用規約等にも従うものとします。
        </p>
        <p>
          寄付は、単発寄付または定期寄付のいずれかの形式で行うことができ、具体的な金額・課金頻度は本サービスの画面上に表示されるとおりとします。
        </p>
        <p>
          利用者は、寄付が運営者に対する任意の支援であり、寄付の対価としていかなる特典・役務・ゲーム内アイテム・優先権その他の便益が付与されるものではないことをあらかじめ承諾するものとします。
        </p>
        <p>
          寄付金の具体的な利用目的や配分については、運営者の裁量に委ねられるものとし、利用者は原則としてこれに異議を述べないものとします。
        </p>
        <p>
          税務上の取扱いについて、本サービスおよび運営者は何ら保証せず、利用者は自己の責任と費用負担において税務署・税理士等に確認するものとします。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">6. 返金・キャンセル</h2>
        <p>
          寄付の性質上、決済完了後の寄付金については、法令上求められる場合を除き、原則として返金・キャンセルには応じません。
        </p>
        <p>
          定期寄付の停止は、本サービスまたは Stripe
          のカスタマーポータルにて所定の手続に従うものとし、停止手続きのタイミングにより、直近の課金分については返金されない場合があります。
        </p>
        <p>
          決済エラーや二重課金等が疑われる場合、運営者は合理的な範囲で Stripe
          への調査依頼等に協力しますが、Stripe の判断・対応結果について保証するものではありません。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">7. 支援者リストへの表示</h2>
        <p>
          本サービスは、寄付者本人が明示的に同意した場合に限り、支援者リストに表示名を掲載することができます。
        </p>
        <p>
          表示される情報は Discord OAuth
          を通じて取得した表示名のみとし、寄付金額・寄付回数・ランキング等は表示しません。
        </p>
        <p>
          利用者は、支援者リストへの表示に同意した後であっても、本サービス所定の手続により、表示の停止または削除を求めることができます。
        </p>
        <p>
          表示名に不適切な表現や第三者の権利侵害が含まれる場合、運営者は掲載を拒否または削除することができます。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">8. Discord OAuth およびセッション</h2>
        <p>
          本サービスは、Discord OAuth を利用して利用者の認証を行い、表示名・ユーザー ID
          等を取得します。利用者は Discord の利用規約等を遵守するものとします。
        </p>
        <p>
          本サービスは、HMAC 署名付き Cookie
          等を用いてセッションを管理しますが、技術的制約等によりセッションが予期せず終了する場合があります。
        </p>
        <p>
          これにより利用者に損害が生じた場合でも、運営者は故意または重大な過失がある場合を除き、一切の責任を負いません。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">9. 個人情報の取扱い</h2>
        <p>
          本サービスにおける個人情報の取扱いについては、同ページ内の「プライバシーポリシー」に定めるところによります。
        </p>
        <p>
          また、本サービスは Stripe の Customer metadata 等を利用して表示名・Discord
          ID・掲示同意情報等を保存しますが、その保管・管理については Stripe
          の規約に従うものとします。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">
          10. サービス提供の中断・変更・終了
        </h2>
        <p>
          運営者は、システム保守、天災、外部サービスの障害その他やむを得ない事情がある場合、利用者への事前通知なく本サービスの全部または一部の提供を一時的に中断または停止することができます。
        </p>
        <p>
          また、事業上・技術上の理由等により、本サービスの内容を変更し、または提供を終了することがあります。
        </p>
        <p>
          本条に基づく中断・変更・終了に起因して利用者に生じた損害について、運営者は故意または重大な過失がある場合を除き、一切の責任を負いません。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">11. 知的財産権</h2>
        <p>
          本サービスに関するプログラム、デザイン、ロゴ、テキストその他のコンテンツに関する著作権・商標権等の知的財産権は、運営者または正当な権利を有する第三者に帰属します。
        </p>
        <p>
          利用者は、運営者の事前の許可なく、コンテンツを複製、公衆送信、頒布、改変等してはならず、また第三者に利用させてはなりません。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">12. 免責事項</h2>
        <p>
          運営者は、本サービスが常に正常に動作すること、特定の目的に適合すること、セキュリティ上完全であること等について、いかなる保証も行いません。
        </p>
        <p>
          本サービスの利用または利用不能に起因して利用者に生じた損害について、運営者は故意または重大な過失がある場合を除き、一切の責任を負いません。
        </p>
        <p>
          運営者が利用者に対して損害賠償責任を負う場合であっても、その責任の範囲は、運営者の故意または重大な過失による場合を除き、当該利用者が過去
          3 か月間に本サービスを通じて支払った寄付金の合計額を上限とします。
        </p>
        <p>
          本サービスから遷移可能な外部サイトの内容および利用により利用者に生じた損害について、運営者は一切の責任を負いません。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">13. 利用者の責任</h2>
        <p>
          利用者は、本サービスの利用に関して自己の責任と費用負担により行動し、本サービスの利用に起因して第三者との間で紛争が生じた場合、自己の責任と費用負担によりこれを解決するものとします。
        </p>
        <p>
          利用者が本規約に違反したことにより運営者に損害が生じた場合、利用者は運営者に対し、その一切の損害（合理的な範囲の弁護士費用を含みます。）を賠償するものとします。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">14. 規約の分離可能性</h2>
        <p>
          本規約の一部が無効または執行不能と判断された場合でも、残りの規定は引き続き完全に効力を有するものとします。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">15. 準拠法および合意管轄</h2>
        <p>本規約の解釈および適用には、日本法を準拠法として適用します。</p>
        <p>
          本サービスに起因または関連して運営者と利用者との間に生じた紛争については、運営者の所在地を管轄する地方裁判所または簡易裁判所を第一審の専属的合意管轄裁判所とします。
        </p>
      </section>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="space-y-6 leading-relaxed text-muted-foreground">
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
          <li>Discord OAuth を通じた表示名およびユーザー ID</li>
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
              団体名
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
  );
}

function TermsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tab = searchParams.get('tab') === 'privacy' ? 'privacy' : 'terms';

  const handleTabChange = (nextTab: 'terms' | 'privacy') => {
    if (nextTab === tab) return;

    const params = new URLSearchParams(searchParams.toString());

    if (nextTab === 'privacy') {
      params.set('tab', 'privacy');
    } else {
      params.delete('tab');
    }

    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    router.replace(url);
  };

  return (
    <div className="space-y-8 py-8 page-enter">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          利用規約・プライバシーポリシー
        </h1>
        <p className="text-base text-muted-foreground">最終更新：2025年11月18日</p>
      </div>

      <div className="flex justify-center">
        <div className="tabs-segmented text-base font-medium text-muted-foreground">
          <div
            className="tabs-segmented-highlight"
            style={{ transform: tab === 'terms' ? 'translateX(0%)' : 'translateX(100%)' }}
          />
          <button
            type="button"
            onClick={() => handleTabChange('terms')}
            className="relative z-10 flex-1 cursor-pointer rounded-full px-5 py-2.5 text-center"
            data-state={tab === 'terms' ? 'active' : 'inactive'}
            aria-selected={tab === 'terms'}
          >
            <span
              className={
                tab === 'terms'
                  ? 'inline-flex w-full items-center justify-center whitespace-nowrap text-foreground'
                  : 'inline-flex w-full items-center justify-center whitespace-nowrap text-muted-foreground'
              }
            >
              利用規約
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('privacy')}
            className="relative z-10 flex-1 cursor-pointer rounded-full px-5 py-2.5 text-center"
            data-state={tab === 'privacy' ? 'active' : 'inactive'}
            aria-selected={tab === 'privacy'}
          >
            <span
              className={
                tab === 'privacy'
                  ? 'inline-flex w-full items-center justify-center whitespace-nowrap text-foreground'
                  : 'inline-flex w-full items-center justify-center whitespace-nowrap text-muted-foreground'
              }
            >
              プライバシー
            </span>
          </button>
        </div>
      </div>

      <div className="prose prose-invert mx-auto max-w-3xl space-y-4 text-base leading-relaxed text-muted-foreground">
        {tab === 'terms' ? (
          <>
            <h2 className="text-lg font-semibold text-foreground">Donation Portal 利用規約</h2>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              本サービスを閲覧・利用された場合、本規約に同意いただいたものとみなします。
            </p>
            <TermsContent />
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-foreground">プライバシーポリシー</h2>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              個人情報の具体的な取扱いは本ポリシーに従います。寄付の申し込み前に、必ず内容をご確認ください。
            </p>
            <PrivacyContent />
          </>
        )}
      </div>
    </div>
  );
}

function TermsPageFallback() {
  return (
    <div className="space-y-8 py-8 page-enter">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          利用規約・プライバシーポリシー
        </h1>
        <p className="text-base text-muted-foreground">コンテンツを読み込み中です...</p>
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={<TermsPageFallback />}>
      <TermsPageInner />
    </Suspense>
  );
}

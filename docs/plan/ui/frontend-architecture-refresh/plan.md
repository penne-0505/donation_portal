---
title: Frontend architecture refresh
domain: ui
status: draft
version: 0.1.0
created: 2025-11-12
updated: 2025-11-12
related_issues: []
related_prs: []
references:
  - ../../../standards/documentation_guidelines.md
  - ../../../standards/documentation_operations.md
  - ../../../reference/ui/style-tokens.md
  - ../../reference/ui/react-app-preview.md
  - ../donate-page-layout-refresh/plan.md
  - ../../../intent/ui/home-page-redesign-lp.md
scope:
  - UI土台（Button/Card/Tailwindユーティリティ）の再編と macOS Liquid Glass 指針への追従
  - `/donate`・`/donors`・`/thanks` のページ実装をモジュール化し、状態管理を専用 hooks へ移譲
  - UI hooks (`useSession`, `useCheckout`, `useConsentMutation`, `useDonors`) を束ねる `useDonationFlow` / `useDonorDirectory` の実装
  - 既存 React テスト・ドキュメント（guide/reference/intent）を新構造へ合わせて更新
non_goals:
  - Cloudflare Pages Functions / API スキーマの変更
  - Stripe 価格テーブルや Checkout preset の追加・削除
  - Next.js ルーティング構成 (`app/(main)`) や OAuth フローそのものの再設計
requirements:
  functional:
    - `/donate` は Discord ログイン・同意更新・プラン選択・Checkout 起動の各セクションを明確に分離し、ARIAラベルを保持する
    - `/donors` は支援者リスト表示と同意撤回 UI を独立セクションに分け、セッション状態による動作を保つ
    - `/thanks` は祝砲演出・コピー・Donors 導線を維持しつつ共通 UI トークンを使用する
  non_functional:
    - 各ページコンポーネント本体は 150 行未満、セクションは再利用可能なコンポーネントに切り出す
    - CSS バンドルの増加は gzip 後 +6 KB 以内、JS バンドルのネット増は 0
    - Lighthouse LCP 2.5s 以内（デグレ禁止）、DOM ノード数を 5% 以上増やさない
constraints:
  - `docs/standards/documentation_guidelines.md` と `docs/standards/documentation_operations.md` に従い plan → intent → guide/reference を更新する
  - `git rm` / `rm` は使用しない。旧構造は編集で置き換え、互換 API を維持する
  - Tailwind v4 inline テーマ（`@theme inline`）配下のトークンを拡張し、既存命名を崩さない
api_changes: []
data_models: []
migrations: []
rollout_plan:
  - Phase 1: hooks・UI foundation の再設計 (`useDonationFlow`, `PanelCard`, `SectionHeading`, CSS ユーティリティ拡張)
  - Phase 2: `/donate` `/donors` `/thanks` のセクション分割と JSX 差し替え、HeroContext 連携の回帰確認
  - Phase 3: React Testing Library による回帰テスト更新、docs/guide + docs/reference の刷新
rollback:
  - コンポーネント差分を直前コミットへ revert し、`app/globals.css` の新規ユーティリティをコメントアウト
  - `tests/` 更新前に tag した UI スナップショットへ戻し、Cloudflare Pages プレビューを旧 UI で再発行
security_privacy:
  - OAuth / consent / checkout フローには触れないため、新たなPII流出経路を作らない
performance_budget:
  - 追加CSS ≤ 6 KB (gzip)、追加JS 0
  - React render 回数: `DonatePage` 初回描画 1 回以内（副作用は `useEffect` 2 回以下）
observability:
  - `gtag('event', 'donate_start')`/`hero_cta_click` の発火を `useDonationFlow` へ委譲後も Chrome DevTools で確認
  - Cloudflare Pages preview で `/donate` `/donors` `/thanks` の LCP / CLS を Lighthouse CI ノートに記録
test_plan:
  unit:
    - `tests/donate/ui.test.ts`：新セクションのロール/ARIAを検証し、consent/checkout の副作用を確認
    - `tests/donors/ui.test.ts`：`useDonorDirectory` の consent 撤回ロジックと空状態レンダリングを確認
  integration:
    - `npm run ui:dev` + 手動ブラウズで hero CTA → donate → thanks → donors を縦断
    - Cloudflare Pages preview にて `npm run ui:build` 生成物を smoke test
  manual:
    - Stripe/Discord sandbox を 1 フロー通し、CTA 単一化と同意更新が問題ないことを確認
i18n_a11y:
  - すべてのセクションヘッダに `aria-labelledby` を設定し、TOC からのジャンプに対応
  - Consent toggle / plan cards / donors pills の `aria-live` と focus ring を維持する
acceptance_criteria:
  - ページコンポーネント直下はセクション用の薄いコンポーネントツリーとなり、状態管理は hooks に集約されている
  - CSS ユーティリティ（`glass-*`, `border-gradient-*`, `glow-*`）が段階的に整理され、Button/Card が単一のクラス定義を参照する
  - docs/reference/ui/react-app-preview.md と docs/guide/ui/home-page.md が新構成を説明している
---

## 背景
`components/pages/donate-page.tsx` は 190 行超、`components/pages/donors-page.tsx` も 170 行近い JSX と状態ロジックを抱えており、macOS Liquid Glass 方針を反映した新セクションの追加が困難になっている。UI hooks もページ内で個別に呼び出され、副作用とテストダブルの差し替えコストが高止まりしている。さらに `app/globals.css` ではガラス系ユーティリティが重複しており、Button/Card/ConsentToggle それぞれが似た陰影・ボーダーを再定義している。

## 現状課題
1. **状態管理の分散**: セッション・同意・Checkout の処理がページごとに独自実装され、`tests/donate/ui.test.ts` が多数の hook モック差し替えを要求している。
2. **UI 再利用性の不足**: Discord ログインカードや同意カードなど、似た構造が複数ページで繰り返されている。
3. **スタイル定義の重複**: `.glass-*` や glow クラスが複数の変種を持ち、Button/Card/plan-card それぞれが独自のシャドウ・トランジションを持っている。
4. **ドキュメントの陳腐化**: `docs/reference/ui/react-app-preview.md` は旧 `app/(app-shell)` 構成を前提にしており、導線説明が現行コードと乖離している。

## 提案概要
### 1. UI foundation の共通化
- `components/ui/button.tsx` を variants マップ型 + token ベースのスタイルに整理し、`donate-cta-animated` のようなページ固有クラス依存を解消。
- `components/ui/card.tsx` に `variant`/`padding` props を持たせ、`glass-sm`, `glass-lg` などのユースケースを吸収する `PanelCard` コンポーネントを追加。
- `app/globals.css` の `glass-*`, `glow-*`, `border-gradient-*` を再定義し、macOS Liquid Glass メモリの tier 設計（sm/md/lg + hover + active）と一致させる。

### 2. hooks ベースの状態集約
- `lib/ui/hooks/use-donation-flow.ts`（新規）でセッション取得、同意操作、プラン選択、Checkout 呼び出しを集約し、CTA ラベル・状態メッセージ・ARIA ID を返す。
- `lib/ui/hooks/use-donor-directory.ts`（新規）で Donors 一覧と consent 撤回処理をまとめる。
- `DonatePage`/`DonorsPage` は hooks から受け取ったハンドラとプレゼンテーション props を子セクションへ渡すのみとする。

### 3. ページセクションのモジュール化
- `/donate` 用に `LoginSection`, `ConsentSection`, `PlanGridSection`, `FlowStepsSection` などを `components/donate/` 配下へ追加。
- `/donors` では `DonorListPanel` と `ConsentManagementPanel` を追加し、sticky サイドバーを小さなコンポーネントに分離。
- `/thanks` では CTA ラッパーやコピー群を `ThankYouHighlight` コンポーネントにまとめ、Confetti の副作用を isolated hook に切り出す。

### 4. ドキュメント・テストの刷新
- `docs/reference/ui/react-app-preview.md` と `docs/guide/ui/home-page.md` を新コンポーネント構成へ更新し、`docs/intent/ui/donate-hero-optimization.md` へ参照を追加。
- React Testing Library のシナリオをセクション単位のロール/名前に合わせて更新し、`useDonationFlow`/`useDonorDirectory` のモックも `tests/mocks/ui-hooks.ts` に追加。

## 主要タスク
1. CSS/コンポーネント基盤の整理 (`Button`, `Card`, 新 `PanelCard`, CSS ユーティリティ追加)
2. hooks 実装 (`useDonationFlow`, `useDonorDirectory`) とページセクション化
3. ドキュメント & テストのアップデート、Cloudflare Pages プレビュー検証

## リスクと対応
| リスク | 影響 | 緩和策 |
| --- | --- | --- |
| hooks の切り替えで既存テストが失敗 | CI ブロッカー | 先に `tests/mocks/ui-hooks.ts` を更新し、段階的にテストを書き換える |
| CSS 再編でアクセシビリティが後退 | ARIA/コントラスト低下 | axe DevTools で `/donate` `/donors` を手動検証、`aria-live` を hooks 返却値に含める |
| 新セクション導線が GA 計測を壊す | gtag 欠損 | CTA ハンドラは hooks 内部で gtag をラップし、テストでモックを注入できるようにする |

## 依存関係
- 既存 Stripe / OAuth API エンドポイントに変更はなく、Pages Functions 側の対応は不要。
- Tailwind v4 inline テーマへの追従が前提。`pnpm` などの依存アップデートは本計画に含めない。

## 完了の定義
- `/donate` `/donors` `/thanks` それぞれでセクションコンポーネントが導入され、hooks によって状態ロジックが共通化されている。
- CSS ユーティリティが macOS Liquid Glass の tier 構造と一致し、Button/Card の variants を共有できる。
- docs/plan → intent → reference/guide の更新、および React テストの回帰がパスしている。


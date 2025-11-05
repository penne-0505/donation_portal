---
title: "寄付ページ新UI適用計画"
domain: "donation-portal/ui"
status: "deprecated"
version: "0.1.0"
created: "2025-11-01"
updated: "2025-11-01"
related_issues: []
related_prs: []
references:
  - "_temp/new_ui/app/donate/page.tsx"
  - "components/pages/donate-page.tsx"
  - "app/(app-shell)/donate/page.tsx"
  - "docs/archives/legacy-static/donate/index.html"
scope:
  - "寄付ページ(`/donate`)のUI・レイアウトを新デザインへ置き換える"
  - "モック実装だった認証・同意・Checkout処理を既存の本番ロジックへ接続する"
non_goals:
  - "Stripe価格やプラン構成の改定"
  - "バックエンドAPIの仕様変更や新エンドポイント追加"
requirements:
  - "AppShell配下で新デザインとアニメーションを再現する"
  - "`useSession`・`useConsentMutation`・`useCheckout`など既存フックを維持しつつUIロジックを移植する"
  - "モバイル幅でも崩れないレスポンシブ対応を確保する"
constraints:
  - "Pages Functionsのエッジ実行に適した軽量CSS/JSを保つ"
  - "Lucideアイコンなど既存依存を再利用し、追加依存は要相談"
api_changes:
  - "フロントエンドから呼び出すAPI契約は現状維持。payload・metadata構造を変更しない"
data_models:
  - "Stripe Customer metadataのキーセットは現状維持"
migrations:
  - "なし"
rollout_plan:
  - "1) `_temp/new_ui` から必要なUI要素を抽出し、本リポジトリのコンポーネントに段階的に移植"
  - "2) Storybook/ローカルでUI比較、SSR/CSR両方の挙動確認"
  - "3) Cloudflare Pages のプレビュー環境でE2E確認後、本番へデプロイ"
rollback:
  - "既存 `components/pages/donate-page.tsx` をタグ付けし、Git revert で即時復旧できるようにする"
test_plan:
  - "ユニット: `useCheckout` などの既存テストがパスすること"
  - "UIスナップショット: `/tests/donate/ui.test.ts` の更新とスクリーンショット比較"
  - "E2E: Stripe Checkout SandboxとDiscord OAuthモックを使ったフロー確認"
observability:
  - "Cloudflare PagesのアクセスログとStripeダッシュボードでエラー率を監視"
security_privacy:
  - "ログイン・同意・Checkout処理におけるセッション/CSRFフローを現行実装から逸脱させない"
performance_budget:
  - "バンドル増加は+30KB以内、LCP 2.5s以内を維持"
i18n_a11y:
  - "日本語コピーを保持し、aria属性・キーボード操作対応を再検証"
acceptance_criteria:
  - "スクリーンショットと同等のレイアウトが `/donate` で再現される"
  - "Discordログイン・掲示同意・Stripe Checkoutが全て本番フローで動作する"
  - "既存テストスイートが通過し、追加UIテストがグリーンである"
owners:
  - "penne-0505"
---

# 寄付ページ新UI適用計画

## 背景
Legacy HTML/CSS 版から React + デザインシステムへの段階移行を進める中で、`/donate` は中間段階の UI が本番に残っている。`_temp/new_ui/` には刷新した UI のプレビューが存在するが、認証やStripe連携がモック化されており、本運用へ統合されていない。

## 現状整理
- `/donate` は `components/pages/donate-page.tsx` を描画し、AppShell によるヘッダーとカードレイアウトを提供しているが、ヒーロー領域や細かなスタイルは旧静的ページと乖離している。
- `_temp/new_ui/` 内の `app/donate/page.tsx` はヘッダー、ヒーロー、アニメーションなど新デザインを含むが、`useState` でモックしたログインや `setTimeout` による擬似Checkoutなど実運用にそぐわない実装である。
- 機能面では、既存の `useSession`/`useConsentMutation`/`useCheckout` フックと Stripe/Discord 連携が正しく動作しているため、UIだけを刷新すればよい状態。

## ゴール
1. `_temp/new_ui/` の視覚デザインを `/donate` に完全移植する。
2. 新UIに本番用フックとバリデーションを組み込み、モックなしで運用できる状態にする。
3. 既存のレスポンシブ要件・アクセシビリティ・国際化要件を満たしたまま差し替えを完了する。

## 実装方針
1. **デザイン要素の抽出**: `_temp/new_ui/app/donate/page.tsx` を設計ガイドとして、ヒーローセクション、グラスモーフィズム風カード、ステッキーメニューなどを分解。AppShell内で再利用できるコンポーネントへ切り出す。必要に応じて `components/ui/` へ新規コンポーネントを追加する。
2. **機能ロジックの差し込み**: 現在の `DonatePage` で利用している `useSession` 等のフック呼び出しを温存し、UIのみ差し替える。モックで使っていたステートは全て実際のセッション情報へ置き換える。
3. **共有スタイルの調整**: `_temp` で使用されているクラス名が Tailwind に存在しない場合、`globals.css` や `tailwind.config` の定義を再現または代替表現に置換する。アニメーションやグラス効果は既存の design token で表現する。
4. **型・テストの更新**: 新 UI に伴う prop 変更や受け渡し値を型定義 (`CheckoutPreset` 等) に合わせて整理し、UI テストのスナップショットを更新する。

## 作業分解
1. `_temp/new_ui` から必要なスタイル/コンポーネントを調査し、差分リストを `TODO.md` もしくは Issue に追記。
2. `components/pages/donate-page.tsx` のレイアウトを新デザインへ改修。
3. `DonationImpact` など既存コンポーネントに必要な API を整備し、新UIから呼び出せるようにする。
4. Tailwind クラスやCSSトークンの追加が必要な場合は `app/globals.css` や設定ファイルを更新し、`eslint --fix` と `prettier` を実行。
5. テスト (`tests/donate/ui.test.ts`, `tests/checkout/session.test.ts` 等) を更新し、Stripe/Discord のインテグレーションに影響がないことを確認。
6. Cloudflare Pages プレビューで視覚確認 + 手動E2E を実施後、本番へ反映。

## 実施状況（2025-11-01）
- `_temp/new_ui/app/donate/page.tsx` のヒーロー / グラスカード構成を `components/pages/donate-page.tsx` へ移植し、`useSession`・`useConsentMutation`・`useCheckout` を本番ロジックのまま統合した。
- `_temp/new_ui/app/donors/page.tsx`・`_temp/new_ui/app/thanks/page.tsx`・`_temp/new_ui/app/page.tsx` のレイアウトを踏まえ、`DonorsPage`・`ThanksPage`・`HomePage` の UI を刷新、既存の API フローと整合させた。
- Tailwind ユーティリティとしてガラス調・ホバー演出・アニメーションを `app/globals.css` に追加し、既存デザインシステムと整合させた。
- `tests/mocks/ui-hooks.ts` と `scripts/alias-loader.mjs` で UI フックと Next.js 依存をスタブ化し、Node Test Runner + React Testing Library で新 UI の挙動を検証できるようにした。
- `npm run typecheck` を実行し型検証を完了。UI テストは React 版 (`tests/donate/ui.test.ts`, `tests/donors/ui.test.ts`) へ差し替え済みで、プレビュー確認のみ残タスク。

## リスクと緩和策
- **CSSバンドル肥大化**: `_temp` の追加クラスでバンドルサイズが増える可能性。利用していないクラスは除外し、Tailwind の `content` 設定を更新して未使用スタイルの排除を徹底する。
- **アクセシビリティ低下**: 新UIのアニメーションや色調がコントラスト要件を満たさない可能性。`prefers-reduced-motion` に配慮し、WCAG AA 準拠を維持する。
- **セッション制御の破綻**: UI置き換え時にログイン制御が崩れるリスク。`useSession` 周りのテストを強化し、実装中も `/tests/session` 系を随時実行する。

## 今後の展開
- `/thanks` や `/donors` も同様に `_temp` からの移行を予定しているため、今回追加する共通スタイルやコンポーネントは再利用しやすい形で配置する。
- 移行完了後、`_temp/new_ui` ディレクトリの扱い（削除またはアーカイブ化）を検討し、Docs側にも結果を反映する。

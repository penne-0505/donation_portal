---
title: "Next.js UI 統合計画 2025"
domain: "donation-portal"
status: "draft"
version: "0.1.0"
created: "2025-11-01"
updated: "2025-11-01"
related_issues: []
related_prs: []
references:
  - _temp/new_ui/app/page.tsx
  - _temp/new_ui/app/donate/page.tsx
  - _temp/new_ui/app/donors/page.tsx
  - public/donate/app.js
  - public/donors/app.js
  - functions/api/session.ts
  - functions/api/checkout/session.ts
  - functions/api/donors.ts
  - functions/oauth/start.ts
  - functions/oauth/callback.ts
  - docs/standards/documentation_guidelines.md
  - docs/standards/documentation_operations.md
scope:
  - "Cloudflare Pages 上での Next.js (App Router) UI を段階導入し、既存 API と統合する。"
  - "donate/donors/thanks のエンドユーザー向け画面を React ベース UI に置き換える。"
  - "Discord OAuth・Stripe Checkout の既存ロジックと互換なフロントエンド状態管理を再設計する。"
non_goals:
  - "Stripe や Discord API スキーマの変更。"
  - "顧客データの永続化方式（Stripe SSOT）を変更すること。"
  - "Cloudflare Pages/Workers 以外のホスティング基盤への移行。"
requirements:
  functional:
    - "React UI から既存の /api/session, /api/checkout/session, /api/donors, /api/consent を利用できること。"
    - "Discord OAuth 同意状態と Stripe Checkout 成功後のリダイレクトが従来フローと同等に動作すること。"
    - "旧 UI との段階的併存（/new/* プレフィックス等）を可能にし、段階検証が行えること。"
  non_functional:
    - "Cloudflare Pages + Workers (Edge Runtime) 上で Next.js を安定稼働させる。"
    - "React 版 UI の初回ロードで 200KB gzipped 以下のリソース予算を維持する。"
    - "既存 API のレイテンシやスループットに悪影響を与えない。"
constraints:
  - "Cloudflare Pages でのビルドは wrangler + @cloudflare/next-on-pages を利用する。"
  - "Pages Functions 側の API 署名・cookie 仕様を変更しない。"
  - "SSR/SSG で保存状態を持たず、Stripe を唯一のデータソースとする。"
api_changes:
  new: []
  updates:
    - "必要に応じて Cloudflare Routing で /_routes.json (または functions 配置) を調整し、Next.js と Functions の競合を解消する。"
  deprecated: []
data_models:
  - "追加データモデルなし (Stripe Customer metadata を継続利用)。"
migrations:
  - "Cloudflare Pages プロジェクトに Next.js ビルド出力 (functions/.next) を追加し、従来の public 配信と並行運用する。"
rollout_plan:
  - "Phase 0: PoC — @cloudflare/next-on-pages を利用したビルド/デプロイ検証。"
  - "Phase 1: 基盤整備 — Next.js プロジェクト構造・Tailwind v4 設定・共通レイアウトの整理。"
  - "Phase 2: 機能統合 — 認証/同意/Checkout/donors API 呼び出しの React hooks 実装と既存ロジック移植。"
  - "Phase 3: 段階公開 — /new/donate 等で併存リリースし、フィードバック収集。"
  - "Phase 4: 切替 — 旧静的 UI をリダイレクトし、必要ドキュメント/テストを更新。"
rollback:
  - "フェーズごとに旧静的 UI を保持し、Cloudflare Pages のデプロイ履歴から即時ロールバックできる状態を維持。"
  - "API レベルでの問題が発生した場合は React 版のルーティングを停止し、旧 UI にトラフィックを戻す。"
test_plan:
  - "ユニット: React hooks (session/consent/checkout) のモック検証、状態遷移テスト。"
  - "統合: Cloudflare Pages プレビュー上での Stripe Test モード & Discord OAuth sandbox フロー確認。"
  - "E2E: Playwright もしくは Miniflare + headless で donate→thanks→donors の一連を自動化。"
observability:
  - "Cloudflare Pages Analytics で LCP/FID を比較し、React 移行前後の指標を記録。"
  - "Functions 側のログ (wrangler tail) と Stripe Webhook 成功率を移行期間中モニタリング。"
security_privacy:
  - "HMAC 署名付き Cookie, Stripe Webhook 署名検証を既存実装で継続使用。"
  - "React UI で個人情報を新規保存・送信しない。"
performance_budget:
  - "LCP 2.5s 以下 (デスクトップ Fast 3G 相当)、CLS 0.05 以下を維持。"
  - "React クライアントバンドル 150KB gzipped 以下、追加画像・フォントは Lazy load 徹底。"
i18n_a11y:
  - "全 UI 文言は日本語統一、ARIA 属性/フォーカス管理を継承し、アクセシビリティ回帰を防止。"
  - "スイッチング中もライト/ダークテーマのコントラスト比 WCAG 2.1 AA を満たす。"
acceptance_criteria:
  - "React 版 /donate, /donors, /thanks が既存フローと機能同等で稼働し、QA checklist を満たす。"
  - "Cloudflare Pages プレビューおよび本番で Stripe Test 決済が完了し、Webhook が処理される。"
  - "旧 UI の主要導線が React 版へ切り替え後も 404/500 を発生させない。"
owners:
  - "@donation-portal-core"
---

# Next.js UI 統合計画 2025

## 1. 背景

Donation Portal は Cloudflare Pages 上で静的 HTML + プレーン JavaScript による UI を提供している。Stripe Checkout や Discord OAuth との連携ロジックは機能しているものの、コンポーネント再利用性・アクセシビリティ・運用効率に課題があり、保守性と拡張性の面で制約となっている。 `_temp/new_ui/` 配下に React + Next.js + Tailwind v4 で試作した UI 案が存在し、これを本番導入することで以下を狙う。

- UI レイヤをコンポーネント化し、状態管理とデザイン体系を統一する。
- Cloudflare Pages Functions で提供中の API を活用しつつ、将来的な追加機能に備える。
- 開発・QA プロセスを React/Next.js のエコシステムに合わせて高度化する。

## 2. 現状分析

### 2.1 既存 UI
- `/public/donate` と `/public/donors` は DOM 操作中心であり、状態遷移が imperative で複雑化している。
- `public/styles/base.css` にページ固有スタイルが集中し、テーマやレスポンシブ調整が困難。
- React 等のビルドステップが無いため、共通コンポーネントの再利用が限定的。

### 2.2 新 UI 案
- `_temp/new_ui` は Next.js 16, React 19, Tailwind CSS 4 を採用。shadcn UI を前提とした Radix UI コンポーネントセットが含まれる。
- 認証フロー・Checkout API 呼び出しは未統合であり、モック (`setTimeout`, `alert`) が残る。
- Next.js の App Router 構成（`app/` ディレクトリ）・レイアウト・テーマ切替など、将来拡張性は高い。

## 3. 目標アーキテクチャ

1. **Next.js on Cloudflare**: `@cloudflare/next-on-pages` を用いて App Router を Cloudflare Workers Runtime で動作させる。`wrangler.toml` にビルドコマンドと出力先 (`.vercel/output`) を統合する。
2. **API 統合**: 既存 Functions (`/functions/api/*`, `/functions/oauth/*`) を Next.js から fetch する。エッジ互換を維持し、SSR は利用せず CSR 中心で構築。
3. **状態管理**: React hooks (`useSession`, `useConsent`, `useCheckout`) を実装し、`public/*.js` に存在するロジックを移植。SWR 等のデータフェッチ層を導入して API と同期。
4. **段階的ルーティング**: `/new/donate`, `/new/donors`, `/new/thanks` として React 版を公開。安定後、`/_routes.json` または redirect 設定で既存パスを置き換える。
5. **CSS/Tailwind**: Tailwind v4 のデザイントークンと shadcn コンポーネントを必要分だけ採用。不要な Radix 依存は削減し、`globals.css` にテーマトークンを整理。

## 4. フェーズ別進行

| フェーズ | 目的 | 主なタスク | 完了条件 |
| --- | --- | --- | --- |
| Phase 0 | 技術検証 | Next.js + Cloudflare Pages の PoC、wrangler とのビルド統合 | Cloudflare プレビューへ Next.js ページをデプロイ可能 |
| Phase 1 | 基盤整備 | Tailwind/ESLint/TS 設定、`_temp/new_ui` のディレクトリを正式プロジェクトへ移管 | `npm run dev` で UI 開発環境が再現可能 |
| Phase 2 | ロジック統合 | React hooks 化、Stripe/Discord API 呼び出し実装、モック除去 | `/new/donate` で実際に Checkout フローが完結 |
| Phase 3 | 併存公開 | Cloudflare に `/new/*` を公開し、ユーザーテスト・QA 実施 | 主要ステークホルダーの承認とメトリクス収集完了 |
| Phase 4 | 切替 | 旧 UI のリダイレクト、ドキュメント/テスト更新、監視 | `/donate` 等が React 版へ完全移行し、エラー無し |

## 5. 技術タスク詳細

### 5.1 インフラ/ビルド
- `package.json` へ Next.js/Tailwind 依存を追加し、`scripts/run-*` との整合を取る。
- `wrangler.toml` と `eslint.config.js` を Next.js プロジェクトに合わせて更新。ESLint は `next` プリセットを導入。
- Cloudflare Pages 用に `_routes.json` あるいは `functions/[[path]].ts` を調整し、Next.js がハンドルするルートと API ルートを整理。

### 5.2 フロントエンド実装
- `_temp/new_ui` の `app/` ディレクトリを `src/ui/` などに配置し直し、不要コンポーネントを削除。
- `useSession`, `useConsent`, `useCheckout` hooks を `src/lib` に実装。既存 TS 型 (`types/public/`) を活用し API 応答を型付け。
- Donor リスト表示を `/api/donors` と同期させ、空状態・再読込 UI を Next コンポーネントとして仕上げる。

### 5.3 テーマ・アクセシビリティ
- Tailwind `globals.css` にテーマトークンを実装し、ライト/ダークのコントラスト比を検証。
- ナビゲーション・ボタン・フォームコンポーネントにフォーカスリングと ARIA 属性を付与。既存 JS で設定していた `aria-checked` 等を React 制御へ置き換える。

### 5.4 ドキュメント
- 本計画 (`docs/plan/donation-portal/react-ui-integration-2025/plan.md`) を基に、`docs/reference/ui/` にコンポーネント一覧・props 仕様を追加予定。
- Deploy 手順・ローカル開発手順を `docs/guide/development/` および `docs/operations/` に追記。

## 6. リスクと軽減策

| リスク | 影響 | 軽減策 |
| --- | --- | --- |
| Next.js Edge 互換性不足 | ビルド失敗・ランタイム例外 | Phase 0 で Edge 実行を検証。必要なら React 18/Next 15 へダウングレード案を用意 |
| パッケージ肥大化 | 初回ロード遅延 | shadcn コンポーネントの採用範囲を厳選し、Bundle Analyzer で監視 |
| Tailwind v4 設定不整合 | CSS ビルド失敗 | Tailwind v4 用ポリフィル (`@tailwindcss/postcss`) のバージョン固定、CI で `npm run lint` を追加 |
| API 呼び出し変更による回帰 | 決済・同意フロー停止 | 旧 UI を保持し併存期間を設ける。Stripe/Discord テストモードで回帰テストを自動化 |
| ドキュメント未更新 | 運用チームが切替手順を把握できない | Phase 3 で Guide/Operations ドキュメント更新を必須タスク化 |

## 7. 観測と評価指標

- Cloudflare Pages Analytics で LCP, FID, TTFB を追跡し、移行前後の差分を記録。
- Stripe Webhook の成功率・再送回数を `wrangler tail` ログで確認し、React UI 移行によるエラー増加がないか監視。
- `/api/session` のレスポンスエラー率を Miniflare テストで測定し、React 側の fetch リトライが適切に機能するか確認。

## 8. ステークホルダーとコミュニケーション

- 進捗共有は Discord #donation-portal-dev に週次で実施し、PoC 成果やブロッカーを共有。
- Phase 3 以降はコミュニティ運営チームと UX 確認会を実施。必要に応じてフィードバックを Phase 4 の切替前に反映。
- エスカレーション先は @donation-portal-core。重大な決済影響が発生した場合は即時ロールバックを判断。

## 9. 次のステップ

1. Phase 0 の PoC を開始し、Cloudflare Pages に Next.js サンプルをデプロイして互換性を確認する。
2. `_temp/new_ui` の依存関係を精査し、採用コンポーネント一覧と削除候補を整理する。
3. hooks 設計と API インタフェースの仕様メモを `docs/draft/donation-portal/` に作成し、レビューを受ける。

---

本計画に従い、React/Next.js UI の導入を段階的に進め、既存の決済フローと運用体制を維持したままモダンな UI へ移行する。
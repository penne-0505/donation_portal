---
title: "Donation Portal アーキテクチャ原則"
domain: "donation-portal"
status: "active"
version: "1.0.0"
created: "2025-11-02"
updated: "2025-11-02"
related_issues: []
related_prs: []
references:
  - README.md
  - docs/intent/donation-portal/mvp-architecture-and-phases.md
  - docs/reference/api/checkout.md
  - docs/reference/api/donors.md
  - docs/guide/auth/discord-oauth.md
  - docs/guide/payments/stripe-setup.md
  - functions/api/checkout/session.ts
  - functions/api/webhooks/stripe.ts
  - src/lib/payments/stripeClient.ts
---

# Donation Portal アーキテクチャ原則

## 位置付け
- 本書は Donation Portal プロジェクトで暗黙的に共有されてきた設計思想を明示化し、将来の機能追加や保守判断を支援するための標準ドキュメントである。
- 対象は Cloudflare Pages 上で稼働する Next.js UI、Pages Functions API、および両者を接続する共有ライブラリ全体とする。
- ここに記す方針は Intent / Reference ドキュメントの根拠を集約したものであり、矛盾が生じた場合は Intent を更新し本書を改訂する。

## コア原則
- **サーバレス一貫性**: Cloudflare Pages を UI/API の単一デプロイ先とし、追加の常駐インフラ（自前サーバ、キュー、DB）を持たない。Functions では stateless な実装を徹底し、必要な状態は都度 Stripe/Discord から取得する。
- **Stripe を唯一の永続層とする**: 顧客名・掲示同意・Discord ID は Stripe Customer metadata に保存し、アプリは読み書きの境界レイヤーとして振る舞う。ローカル永続化やキャッシュは導入せず、一時的な派生情報のみをメモリに保持する。
- **同一オリジン・最小権限**: すべての API は同一オリジンからのみ呼び出す設計とし、Cookie は HMAC 署名・Secure/Lax 制約付きで 10 分 TTL を守る。OAuth state も署名付き Cookie で検証し、過剰なスコープを要求しない。
- **明示的な入出力契約**: API レイヤーでは `jsonResponse` / `errorResponse` を用いて JSON の形とヘッダー (`Cache-Control: no-store` 等) を統一する。UI 側は `lib/ui/hooks` 経由でフェッチし、型付きのパーサでバリデーションする。
- **観測可能で説明可能な失敗**: すべての外部呼び出し（Stripe, Discord）は `createLogger` が付与する構造化ログで計測され、ユーザー向けには日本語の再試行案内を返す。Webhook は event.id を短期キャッシュし、重複検知ログを残す。
- **段階的進化を前提としたレイヤリング**: `src/lib` に共通ドメインロジック、`lib/ui` にクライアント専用フックを配置することで、Functions と Next.js 双方から再利用できる境界を保つ。UI は App Router の `(app-shell)` と `new/`（互換リダイレクト）に分割し、段階的な UI 更新を許容する。

## システム構成

### Cloudflare Pages (Next.js UI)
- `app/(app-shell)` に主要ページ (`/`, `/donate`, `/donors`, `/thanks`) を配置し、`components/app-shell.tsx` でヘッダー・レイアウトを統一する。
- クライアントコンポーネントは `lib/ui/hooks` のフェッチ層を介して API と通信し、UI 本体は `components/pages/*` に集約して再利用性を確保する。
- `app/new/*` は旧 URL 互換用のリダイレクトに限定し、段階的にリンクを差し替えつつ 404 を回避する。
- UI スタイルは `app/globals.css` と Tailwind ベースのユーティリティで統一し、アクセシビリティ向上のために focus state・aria 属性を明示的に設定する方針とする。

### Cloudflare Pages Functions (API/バックエンド)
- `functions/api` 配下に用途ごとのエンドポイントを分割し、環境変数インターフェースを TypeScript の `Env` 型で明示する。
- `functions/api/checkout/session.ts` は Discord セッション Cookie を必須とし、Stripe Checkout セッション生成と Customer metadata の同期を担う。
- `functions/api/donors.ts` は `metadata['consent_public']:'true'` 検索を行い、`order` パラメータで並び替えを制御する。キャッシュは HTTP ヘッダーで制御し、Functions 側での永続保持は行わない。
- `functions/api/consent.ts`（および関連処理）はセッション Cookie を検証したうえで Stripe metadata を更新する設計とし、UI の同意トグルと双方向整合を取る。
- `functions/api/webhooks/stripe.ts` は署名検証・短期重複検知・早期 200 応答のみ実装し、長期的な副作用は Stripe Dashboard との運用で補完する。
- OAuth フロー (`functions/oauth/`) では state Cookie 署名と Discord API 呼び出しを分離し、失敗ケースごとに `/donate?error=<code>` へ誘導する。

### 共有ライブラリ
- `src/lib` は Cloudflare Runtime 互換の ES Modules として構成し、`.js` 拡張子を強制することで Wrangler/Next 双方のビルドに対応する。
- `src/lib/core` にはレスポンス共通関数・ロガー・環境変数解決 (`requireEnv`) など Functions から参照されるインフラ層を配置する。
- `src/lib/payments/stripeClient.ts` が Stripe API 呼び出しの境界であり、`buildCustomerMetadata` で項目整合性を保証する。
- `lib/ui` はブラウザ用ユーティリティ群で、Hooks から API 契約を再検証しガードをかける設計とする。
- テスト (`tests/`) は API ごとにユニット/統合テストを配置し、Cookie 署名・Stripe メタデータ整合などアーキテクチャ上の不変条件を検証する。

## ドメイン別データフロー
1. **ログイン～セッション確立**: `/oauth/start` が掲示同意パラメータを state Cookie に署名して Discord にリダイレクト。`/oauth/callback` で Discord ユーザー情報を取得し、`issueSessionCookie` により `sess` Cookie を発行する。
2. **寄付開始**: `DonatePage` が `useSession` でサインイン状態を判定し、`useConsentMutation` で同意変更を反映する。`startCheckout` 要求は `/api/checkout/session` へ JSON POST し、Stripe URL を受け取ってブラウザ遷移を行う。
3. **Webhook 処理**: Stripe からの `payment_intent.succeeded` / `invoice.paid` は Webhook で受信し、重複判定のみ実施。Donors 掲載は Stripe metadata によるため追加処理は行わない。
4. **Donors 掲載**: `/api/donors` がメタデータを検索し、UI の `useDonors` が 60 秒キャッシュを前提に表示する。

## セキュリティと運用ポリシー

### 基本原則
- **フロントエンド入力の不信**: クライアント側の入力値・データは信頼せず、API エンドポイント層で型・フォーマット・範囲を必ず再検証する。
- **権限チェックの必須化**: リソースアクセスや操作の前に、ユーザーの権限を明示的に確認する（セッション検証を含む）。
- **ビジネスロジックのサーバーサイド集中**: 価格計算・割引適用など重要なロジックは必ずサーバーサイド（Functions）で実行し、環境変数から安全に解決した値を用いる。

### 実装ポリシー
- Secrets（Stripe keys, Discord credentials, Cookie keys）は Cloudflare Pages Env Bindings と GitHub Actions Secrets に限定し、ローカル開発は `.env.example` をテンプレートとする。
- Cookie は `Secure` + `HttpOnly` + `SameSite=Lax` を必須とし、期限切れ時は明示的に破棄する (`buildExpiredSessionCookie`)。
- 監査/トラブルシューティングは Cloudflare Logs と Stripe Dashboard を主要ソースとし、ログは JSON 形式でタイムスタンプ・scope・request_id を含める。
- Webhook の idempotency はメモリ Map による 5 分間キャッシュで提供し、長期持続性は必要になったタイミングで Durable Objects 等への移行を検討する。
- API のエラー文言は UI でのトースト表示を前提に日本語で統一し、HTTP ステータスと `error.code` の組合せで機械判定できるようにする。

## 拡張時の判断基準
- 新しいデータ保存が必要な場合は Stripe metadata で表現できるかを最優先で検討し、それが困難な場合のみ Intent を更新した上で外部ストレージ採用を検討する。
- 新 API を追加する際は `functions/api/<domain>.ts` に単一責務で配置し、UI からのアクセスは新規 Hook を通じて行う。
- UI 構造を変更する場合、`(app-shell)` レイアウトを共通化したままクライアントコンポーネントの粒度を保つ。段階的リニューアルは `app/new/*` のようなリダイレクトやフィーチャートグルで進める。
- Webhook の処理を増やす場合は event ごとにロガー scope を分離し、冪等性と早期応答を維持するかを検証する。

## 既知のトレードオフ
- Stripe metadata 依存により、リアルタイムでの Donors 反映は Stripe API レイテンシとキャッシュ設定に制約される（60 秒キャッシュ + Stripe API の整合性）。
- Webhook の冪等性はランタイムメモリに限定されるため、実行コンテキストがリセットされると再実行が発生し得る。重大な副作用が発生する変更を導入する場合は Durable Object 等の採用を再評価する必要がある。
- Cloudflare Pages Functions は Node.js 互換モードに依存しており、一部の Node API が利用できない。依存ライブラリ選定時は `nodejs_compat` でサポートされる範囲か検証する。

## 関連ドキュメント
- Intent: `docs/intent/donation-portal/mvp-architecture-and-phases.md`
- API 詳細: `docs/reference/api/*.md`
- OAuth ガイド: `docs/guide/auth/discord-oauth.md`
- Stripe 運用: `docs/guide/payments/stripe-setup.md`, `docs/guide/payments/stripe-webhook-operations.md`
- テスト戦略: `tests/` ディレクトリ（将来的に `docs/guide/development` 以下へ正式ガイド化予定）

# Donation Portal アーキテクチャ方針

## 目的
- Cloudflare Pages/Workers を基盤とした Donation Portal の設計原則を単一ドキュメントに集約し、開発者間の共通認識を維持する。
- Stripe を SSOT とする運用制約や OAuth/セッション処理のガードレールを明文化し、仕様逸脱による不具合を防止する。
- 新機能や改修を検討する際の影響評価ポイントを提示し、`docs/plan/` や `docs/intent/` との連携を円滑にする。

## 適用範囲と更新責任
- 対象: Cloudflare Pages/Workers 上で動作する寄附受付サイト全体（静的ページ、Pages Functions、共通ライブラリ、Stripe/Discord 連携）。
- この方針は **実装済みの事実** に基づく標準であり、設計変更が決定した場合は `docs/intent/` で合意を取った上で本書を更新する。
- レビュー責任: アーキテクチャ変更を含む PR では本書との差異を確認し、必要に応じて更新差分を同一 PR に含める。

## 型定義ポリシー
- オブジェクトの形状を定義する際は、まず interface を利用する。interface で表現できない型（Union 型など）を定義する必要がある場合に限り、type を選択する。

## システム全体像
- **配信基盤**: Cloudflare Pages。`public/` 配下の静的ページ (`/donate`, `/thanks`, `/donors`) を配信する。
- **サーバーサイド**: Pages Functions (`functions/`) で RESTful API と OAuth フローを提供。Node 互換 API ではなく、Cloudflare Runtime API を前提とする。
- **共有ライブラリ**: `src/lib/` に OAuth、セッション、Cookie、テストユーティリティを集約し、Functions から再利用する。
- **データストア**: Stripe Customer 情報と metadata を唯一の永続層 (SSOT) とし、独自 DB は保持しない。
- **外部サービス**: Stripe Checkout / Webhook、Discord OAuth 2.0。いずれも HTTP 経由で通信し、環境変数で資格情報を注入する。

## コンポーネント方針
- **静的ページ (`public/`)**
  - サーバーレンダリングは行わず、最低限のフォーム + API 呼び出しで構成する。
  - API レスポンスの型定義は `src/lib/` に集約し、フロントと Functions で共有する。
- **Checkout API (`functions/api/checkout/session.ts`)**
  - Discord セッション Cookie を検証し、Stripe Customer を作成/取得 (`ensureCustomer`) した上で Checkout Session を作成する。
  - `APP_BASE_URL` が未設定の場合は 500 を返し、Stripe へのリクエストを防ぐ。
  - 価格 ID は `PRICE_*` 系環境変数で解決し、新料金メニュー追加時は本書と `.env.example` の双方を更新する。
- **Consent API (`functions/api/consent.ts`)**
  - セッション Cookie の検証に失敗したリクエストは 401 とし、内部詳細を返さない。
  - Stripe Customer を Discord ID で検索し、`metadata.consent_public` と `metadata.display_name` を更新する。
  - セッション Cookie を即時再発行し、元の TTL を保持することで Stripe 側更新とフロント状態を同期させる。
- **Donors API (`functions/api/donors.ts`)**
  - `metadata['consent_public']:'true'` で Stripe Customer を検索し、`livemode` のみを表示対象とする。
  - レスポンスは、`order=random` 時はキャッシュ不可 (`cache-control: public, max-age=0`)、それ以外は 60 秒キャッシュとする。
  - 応答本文から SHA-256 の Weak ETag を生成し、帯域削減と条件付き要求をサポートする。
- **Session API (`functions/api/session.ts`)**
  - セッション Cookie の有無と有効性のみを返す軽量エンドポイント。UI の初期同期に利用する。
- **Stripe Webhook (`functions/api/webhooks/stripe.ts`)**
  - `stripe-signature` ヘッダーのタイムスタンプ + ペイロードで HMAC 検証を実施。検証失敗時は 400 を返す。
  - `payment_intent.succeeded` / `invoice.paid` のみ donation としてロギングし、それ以外は黙示的に確認応答する。
  - `processedEvents` マップと `IDEMPOTENCY_WINDOW_MS` (現在 5 分想定) で重複イベントを抑止する。
- **OAuth (`functions/oauth/start.ts`, `functions/oauth/callback.ts`)**
  - `/oauth/start` は Discord 同意画面へ 302 リダイレクトし、HMAC 署名付き state Cookie を Lax 属性で発行する。
  - `/oauth/callback` は state Cookie の検証、Discord API からのユーザー情報取得、セッション Cookie 発行を行い `/donate` に 302 する。
  - Discord API 失敗時は `redirectWithError` で `/donate?error=<code>` に誘導し、詳細はログにのみ残す。
- **ヘルスチェック (`functions/api/health.ts`, `functions/health.ts`)**
  - 外形監視用。Stripe/Discord への疎通チェックは行わず、プラットフォーム稼働確認のみとする。

## データと整合性ポリシー
- Stripe Customer を SSOT とし、以下 metadata を必ず最新化する:
  - `display_name`: Discord から取得した表示名。空文字・ NULL は許容しない。
  - `display_name_source`: 現状 `discord` 固定。
  - `discord_id`: 数値文字列。必須。
  - `consent_public`: `'true' | 'false'` の文字列。Boolean を直接保存しない。
- Stripe Customer は Discord ID をキーに検索する。他ストア (KV、D1 等) は導入しない。
- Donors API で返す名前リストは Stripe metadata を正規化した結果に限り、アプリ側でのキャッシュやローカル保持は禁止する。

## セッションと Cookie の方針
- 署名済み Cookie は `src/lib/auth/cookie.ts` の HMAC 実装を単一口とし、直接 `crypto.subtle` を呼び出す処理を複数箇所に持たない。
- `COOKIE_SIGN_KEY` は 32 byte 以上のランダム値を必須とし、Pages/Workers の環境変数に設定する。未設定時は 500 で早期失敗させる。
- **State Cookie (`state`)**
  - TTL: 600 秒 (`STATE_COOKIE_TTL_SECONDS`)、属性: `HttpOnly; Secure; SameSite=Lax; Path=/`。
  - ペイロード: `nonce`, `consent_public`。nonce は Discord OAuth state と一致する UUID を利用。
- **Session Cookie (`session`)**
  - TTL: 600 秒 (`SESSION_COOKIE_TTL_SECONDS`) をデフォルトとし、OAuth 直後は 10 分間の有効期間となる。
  - ペイロード: `display_name`, `discord_id`, `consent_public`, `exp`。
  - セッションの再発行 (Consent API 等) は既存 TTL を維持し、延命目的での POST を受け付けない。

## Stripe 連携ガイドライン
- Stripe API 呼び出しは `callStripe` ユーティリティを経由し、`STRIPE_SECRET_KEY` をベアラーとして送出する。
- Checkout Session 作成時は `success_url`/`cancel_url` を `APP_BASE_URL` + 固定パスで組み立て、リクエストごとにリファレンスを残す。
- Webhook の運用:
  - `STRIPE_WEBHOOK_SECRET` が未設定の場合は Stripe ダッシュボード上で設定を完了するまで 500 を返す。
  - 署名検証後、イベント内容はログ (info) へ JSON サマリで出力し、機密情報は含めない。

## Discord OAuth ガイドライン
- クライアント資格情報は `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` / `DISCORD_REDIRECT_URI` で管理する。
- `redirect_uri` は Pages Deploy のオリジンに依存するため、プレビューと本番で値が異なる場合は環境ごとに `DISCORD_REDIRECT_URI` を設定する。
- Discord API 失敗時はリトライせず、ユーザーにリダイレクトで再試行を促す。内部ログに HTTP ステータスとエラーコードを残す。

## 環境変数とシークレット

| キー | 用途 | 参照モジュール |
| --- | --- | --- |
| `COOKIE_SIGN_KEY` | state/session Cookie の HMAC 署名キー | `src/lib/auth/cookie.ts`, 各 Functions |
| `STRIPE_SECRET_KEY` | Stripe API 呼び出し用シークレット | `functions/api/checkout/session.ts`, `functions/api/consent.ts`, `functions/api/donors.ts` |
| `STRIPE_WEBHOOK_SECRET` | Webhook 署名検証用シークレット | `functions/api/webhooks/stripe.ts` |
| `PRICE_ONE_TIME_300` / `PRICE_SUB_MONTHLY_300` / `PRICE_SUB_YEARLY_3000` | Checkout 価格 ID | `functions/api/checkout/session.ts` |
| `APP_BASE_URL` | Checkout リダイレクト URL のベース | `functions/api/checkout/session.ts` |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Discord OAuth クライアント証明書 | `functions/oauth/start.ts`, `functions/oauth/callback.ts` |
| `DISCORD_REDIRECT_URI` | Discord OAuth redirect_uri | `functions/oauth/start.ts` |

> **運用メモ:** 新しい価格/機能が追加される場合は `.env.example` と `docs/intent/` の関連文書も更新し、上表へ追記する。

## セキュリティとプライバシ
- すべての Cookie は `Secure` + `HttpOnly` を必須とし、`SameSite` は Lax 以上を維持する。
- Discord 由来の表示名は `sanitizeDisplayName` でサニタイズし、HTML エスケープされた文字列のみを公開する。
- Stripe Webhook/Checkout は常に `livemode` フラグを確認し、テストモードのデータは公開しない。
- 例外メッセージをユーザーに露出させず、内部ログ (console) のみに残す。PII/シークレットはログに含めない。

## キャッシュ・パフォーマンス方針
- Cloudflare CDN に委譲できる応答 (`/api/donors` の整列結果等) は短期キャッシュを有効化し、Pages Functions 側で ETag を提供する。
- Discord や Stripe への外部呼び出しは Cloudflare の TCP タイムアウトに依存するため、リトライやバックオフはアプリ側で実装しない。
- `processedEvents` キャッシュはインメモリのため、同一インスタンス内でのみ有効。長期的な冪等化は Stripe の idempotency key に委譲する。

## ロギングと監視
- 主要イベント (Webhook 受信、OAuth 失敗、Checkout 失敗) は `console.info` / `console.error` で JSON サマリを出力する。
- Cloudflare Pages のログはダッシュボードで確認し、重大アラートが必要になった時点で Workers Analytics Engine 等の導入を intent として検討する。

## テスト・ローカル開発
- 単体テストは Node.js テストランナーで実施し、`tests/` から `src/lib/` のロジックを直接検証する。
- Stripe/Discord をモックする際は、HTTP スタブではなくユーティリティ層 (`createSignedCookie`, `parseSessionFromCookie` など) のテストを優先する。
- ローカル開発での実サービス呼び出しは極力避け、必要な場合は Stripe/Discord のテストクレデンシャルを利用する。

## 変更時のプロセス
- アーキテクチャ方針に影響する変更 (新 API、Cookie 契約変更、Stripe メタデータ構造の更新等) は以下の順序で進める:
  1. `docs/draft/` または `docs/plan/` で検討内容を整理し、合意が取れたら `docs/intent/` を作成する。
  2. 実装 PR で本書を更新し、レビュワーが方針との差異を確認できるようにする。
  3. デプロイ後に差異が残っていないか点検し、必要に応じて `docs/guide/` / `docs/reference/` を更新する。
- 本書の改訂履歴は Git ログで管理し、重要な決定は `docs/intent/` と相互参照する。

---
最終更新: 2025-11-01

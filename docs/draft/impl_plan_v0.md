---
title: 'Donation Portal 実装計画 v0'
domain: 'donation-portal'
status: 'superseded'
version: '0.1.0'
created: '2025-10-29'
updated: '2025-10-29'
related_issues: []
related_prs: []
references:
  - docs/draft/requirements_definition.md
  - docs/draft/interface_definition.md
  - docs/intent/donation-portal/mvp-architecture-and-phases.md
state: 'exploring'
hypothesis:
  - 'Phase 1 アプローチが後続フェーズでも差し支えない'
options: []
open_questions:
  - 'Stripe CLI を CI にどう組み込むか'
next_action_by: 'engineering-lead'
review_due: '2025-11-28'
ttl_days: 30
superseded_by: docs/intent/donation-portal/mvp-architecture-and-phases.md
---

# 本ドキュメントの位置付け

本計画書は `docs/intent/donation-portal/mvp-architecture-and-phases.md` に統合されました。以後は intent ドキュメントを最新情報として参照してください。

# Donation Portal 実装計画 v0

## 1. スコープ確定（再掲・確認用）

* 寄附：単発/定期（カードのみ）。Checkout→`/thanks`。独自メールなし（Stripeレシートのみ）。
* Donors：同意者の**表示名のみ**掲載（額/回数/順位なし、撤回可）。
* SSOT=Stripe。自前DBなし。ドメインは `*.pages.dev`。

---

## 2. リポジトリ/プロジェクト初期化（モノレポ）

* ルート直下に **Pages(静的ページ)** と **Functions(API)** を同居。
* ディレクトリ例

  ```
  /public            # 静的アセット
  /src               # フロント（/donate, /thanks, /donors のhtml/js）
  /functions         # Cloudflare Pages Functions(API)
    /api/checkout/session.ts
    /api/webhooks/stripe.ts
    /api/donors.ts
    /api/consent.ts
    /oauth/start.ts
    /oauth/callback.ts
  /scripts           # 補助スクリプト（ビルド等、任意）
  package.json
  wrangler.toml
  ```
* CI：GitHub Actions（lint/test/build/deploy）。

---

## 3. 外部サービス設定

### 3.1 Stripe

* Products/Prices（Test）：`monthly ¥300` / `yearly ¥3,000` / `one_time ¥300`。
* Checkout success/cancel URL：`/thanks` / `/donate`（`*.pages.dev`）。
* Webhook（Test）：`POST https://<project>.pages.dev/api/webhooks/stripe` 登録（署名取得）。
* レシート送付：Stripe側で有効（独自メールは不使用）。

### 3.2 Discord OAuth

* アプリ登録：リダイレクトURI＝`https://<project>.pages.dev/oauth/callback`
* スコープ：`identify`（表示名/ID取得のみ）。
* クライアントID/シークレット取得。

### 3.3 Cloudflare Pages

* Git連携 → Pagesプロジェクト作成。
* **Env Bindings** 登録：
  `STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET / DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET / COOKIE_SIGN_KEY / APP_BASE_URL / PRICE_*`
* Build設定：静的（必要なら簡易ビルド）、Functionsは `/functions` 自動検出。

---

## 4. 実装タスク（機能別）

### 4.1 フロント

* `/donate`：寄附の趣旨（**対価なし/税控除なし**）、OAuth開始ボタン、寄附ボタン（単発/定期）。
* `/thanks`：感謝文（署名「りん」）。
* `/donors`：`GET /api/donors` の結果を表示名のみ列挙＋撤回リンク。

### 4.2 Functions（API）

* 共通：Env読込、JSONレスポンス、エラーフォーマット統一、同一オリジンCORS。
* `/oauth/start`：`consent_public` 受理→**HMAC署名付きCookie**でstate保存→Discordへ302。
* `/oauth/callback`：state検証→トークン交換→`display_name/discord_id`取得→`sess` Cookieに保存→`/donate`へ302。
* `POST /api/checkout/session`：`sess`必須→Customer作成/紐付け、metadata（`display_name`, `display_name_source=discord`, `discord_id`, `consent_public`）更新→Checkout URL返却。
* `POST /api/webhooks/stripe`：**署名検証**→`payment_intent.succeeded`（単発）/`invoice.paid`（定期）で**受領ログのみ**→**早期200**、`event.id`で**冪等**。
* `GET /api/donors`：Stripeから `consent_public=true` の `display_name` を収集して返却（order/limit対応、`Cache-Control: max-age=60`）。
* `POST /api/consent`：`sess`必須→該当Customerの `consent_public` 更新（撤回/再同意）。

---

## 5. セキュリティ/運用

* Webhook：`Stripe-Signature`検証、処理は非同期化（ログのみなので軽量）。
* Cookie：`Secure/HttpOnly/SameSite=Lax`、TTL=10分。
* レート制限（目安）：`/api/checkout/session` 10rpm、`/api/consent` 5rpm、`/api/donors` 60rpm。
* ログ：署名検証エラー、Stripe API失敗、Webhook ACK統計。

---

## 6. テスト計画（Testモード）

* OAuth：state改ざん→401、同意ON/OFF→`/api/donors`反映。
* Checkout：単発/定期の組合せ妥当性、URL返却。
* Webhook：署名OK/NG、再送（同一`event.id`）で重複処理しない。
* Donors：表示名のみ、順序（既定desc）、撤回で即非表示。
* コピー確認：全画面に**対価なし/税控除なし**。

---

## 7. リリース手順

1. Pagesにデプロイ（Test環境）。
2. Stripe TestでE2E（単発/定期/再送）。
3. Discord OAuth実機確認。
4. Stripe **Liveキー**/Webhook切替・`PRICE_*`（本番ID）設定。
5. 本番デプロイ→実寄附でスモーク（少額）。
6. 監視（エラー/失敗）を軽通知。

---

## 8. 受け入れ基準（DoD）

* 単発/定期の寄附がCheckout経由で完了し、`/thanks` へ遷移する。
* 独自メールは送られず、Stripeレシートのみ送信される。
* Donorsは**同意者の表示名のみ**を表示し、撤回が反映される。
* Webhookは署名検証を通り、重複イベントを無害化し、**P95<5分**で処理完了。
* UI/文言に**対価なし/税控除なし**が明記されている。

---

## 9. リスク/備考（要注視）

* フロントのキャッシュでDonors更新が遅れる → `max-age=60`で緩和。
* OAuthに失敗した状態でCheckout実行 → `sess`必須チェックで防止。
* 仕様外の“特典的”表現が混入 → コピー最終レビューで排除。

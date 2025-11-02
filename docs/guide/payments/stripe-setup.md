---
title: 'Stripe Checkout 設定ガイド'
domain: 'donation-portal'
status: 'draft'
version: '0.1.0'
created: '2025-10-30'
updated: '2025-11-01'
related_issues: []
related_prs: []
references:
  - docs/plan/donation-portal/phase-03-checkout/plan.md
---

# Stripe Checkout 設定ガイド

## 1. 概要

Donation Portal で寄付を受け付けるには Stripe Dashboard 上で Price を準備し、Cloudflare Pages Functions に環境変数を登録します。本ガイドでは Test 環境を前提に、単発/定期寄付を Stripe Checkout で扱うための初期設定手順を解説します。

## 2. 前提条件

- Stripe アカウントが作成済みであること（Test モードでの操作可）
- Cloudflare Pages プロジェクトにアクセスできること
- Donation Portal の `dev` ブランチをローカルで実行できること

## 3. Stripe Dashboard での設定

### 3.1 Product / Price の作成

1. Stripe Dashboard の **Products** から「Add product」を選択します。
2. 以下 3 つの Price を作成します（通貨は JPY）。
   - **単発寄付**: `¥300`、`One time`、Price 名称は `donation_one_time_300`
   - **月額寄付**: `¥300`、`Recurring / Monthly`、Price 名称は `donation_subscription_monthly_300`
   - **年額寄付**: `¥3,000`、`Recurring / Yearly`、Price 名称は `donation_subscription_yearly_3000`
3. それぞれ作成後に表示される Price ID（例: `price_1234abcd`）を控えておきます。

> **Tip:** Product 名や説明文には「任意の寄付であり対価がない」旨を明記すると審査時の確認がスムーズです。

### 3.2 Success / Cancel URL の確認

Stripe Checkout の `success_url` と `cancel_url` は Functions 側で `APP_BASE_URL` から組み立てます。Pages 本番 URL を `https://<project>.pages.dev` とした場合、以下が設定されます。

- `success_url`: `https://<project>.pages.dev/thanks`
- `cancel_url`: `https://<project>.pages.dev/donate`

テスト時は `wrangler dev` のローカル URL（例: `http://localhost:8788`）を `APP_BASE_URL` に設定すれば、そのままローカルで Checkout を確認できます。

## 4. Cloudflare Pages での環境変数登録

Pages Dashboard の **Settings > Functions > Environment variables** から以下を登録します（すべて Secret 扱い）。

| Key                     | Value                                  | 備考                                                                  |
| ----------------------- | -------------------------------------- | --------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`     | Stripe Test Secret Key (`sk_test_...`) | 本番では Live Key に置き換える                                        |
| `PRICE_ONE_TIME_300`    | 単発寄付の Price ID                    | 例: `price_one_time_300`                                              |
| `PRICE_SUB_MONTHLY_300` | 月額寄付の Price ID                    | 例: `price_monthly_300`                                               |
| `PRICE_SUB_YEARLY_3000` | 年額寄付の Price ID                    | 例: `price_yearly_3000`                                               |
| `APP_BASE_URL`          | ページのベース URL                     | テスト: `http://localhost:8788` / 本番: `https://<project>.pages.dev` |

`COOKIE_SIGN_KEY` や Discord OAuth のキーは Phase 2 で設定済みの前提です。未登録の場合は `docs/guide/auth/discord-oauth.md` を参照して先に登録してください。

### 4.1 Stripe Customer metadata の必須フィールド

Stripe Customer は寄付者情報の単一の保存場所 (SSOT) です。Pages Functions では以下の metadata を統一的に更新します。
Dashboard から手動編集する場合も同じキーとフォーマットを維持してください。

| Key                   | 値の例                     | 説明                                                 |
| --------------------- | -------------------------- | ---------------------------------------------------- |
| `display_name`        | `寄付ユーザー`             | Discord 表示名。エスケープ済み文字列。               |
| `display_name_source` | `discord`                  | 表示名の取得元。今後のソース追加に備えた識別子。     |
| `discord_id`          | `1234567890`               | Discord ユーザー ID。Webhook 連携での照合に使用。    |
| `consent_public`      | `true` / `false`           | Donors 掲載同意フラグ。                              |
| `last_checkout_at`    | `2025-11-01T12:34:56.000Z` | 直近で Checkout セッションを開始した時刻 (ISO8601)。 |
| `consent_updated_at`  | `2025-11-01T12:34:56.000Z` | 掲示同意を更新した時刻 (ISO8601)。                   |

`last_checkout_at` と `consent_updated_at` は Cloudflare Logs / Workers Analytics Engine でメトリクス化する際に利用します。
運用で手動更新する場合も UTC の ISO8601 形式を守り、時刻の欠落やフォーマット崩れを避けてください。

## 5. ローカル環境での確認

1. `.dev.vars` に上記のキーを追加し、ローカル用の Test Key と Price ID を設定します。
2. `npm install && npm run dev` で開発サーバーを起動します。
3. Discord OAuth でログインし、`/donate` の寄付ボタンをクリックして Checkout へ遷移します。
4. Stripe の Test カード（例: `4242 4242 4242 4242`）で決済を完了すると `/thanks` に戻り、Stripe Dashboard で Payment / Subscription が作成されます。

## 6. トラブルシューティング

| 症状                                                               | 原因                                                         | 対応                                                                                                                                                      |
| ------------------------------------------------------------------ | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checkout 開始時に 500 エラー                                       | Price ID または Secret Key が未設定                          | Pages の環境変数を確認し再デプロイする                                                                                                                    |
| Stripe ログに `resource_missing` で Price が存在しないと記録される | `STRIPE_SECRET_KEY` と `PRICE_*` がテスト/本番で混在している | Cloudflare Pages の Functions > Environment variables で同じモードの Price ID（Test なら `sk_test`, Live なら `sk_live`）に揃えてセットし、再デプロイする |
| Success ページに戻らない                                           | `APP_BASE_URL` が実環境と不一致                              | Pages / `.dev.vars` の値を見直す                                                                                                                          |
| 決済完了後も metadata が更新されない                               | Discord ログイン前に Checkout を実行している                 | `/donate` のログイン導線から再度実行する                                                                                                                  |

## 7. 次のステップ

- Donors 掲載と同意管理を実装する Phase 4 では、ここで設定した Price / Customer metadata を利用して Stripe から表示名を取得します。
- 本番リリース時には Live Key と本番 Price ID に差し替え、動作確認後に `docs/guide/payments/stripe-setup.md` を更新してください。

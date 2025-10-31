---
title: "Stripe Checkout 設定ガイド"
domain: "donation-portal"
status: "draft"
version: "0.1.0"
created: "2025-10-30"
updated: "2025-11-01"
related_issues: []
related_prs: []
references:
  - docs/plan/donation-portal/phase-03-checkout/plan.md
---

# Stripe Checkout 設定ガイド

## 1. 概要

Donation Portal で寄附を受け付けるには Stripe Dashboard 上で Price を準備し、Cloudflare Pages Functions に環境変数を登録します。本ガイドでは Test 環境を前提に、単発/定期寄附を Stripe Checkout で扱うための初期設定手順を解説します。

## 2. 前提条件

- Stripe アカウントが作成済みであること（Test モードでの操作可）
- Cloudflare Pages プロジェクトにアクセスできること
- Donation Portal の `dev` ブランチをローカルで実行できること

## 3. Stripe Dashboard での設定

### 3.1 Product / Price の作成

1. Stripe Dashboard の **Products** から「Add product」を選択します。
2. 以下 3 つの Price を作成します（通貨は JPY）。
   - **単発寄附**: `¥300`、`One time`、Price 名称は `donation_one_time_300`
   - **月額寄附**: `¥300`、`Recurring / Monthly`、Price 名称は `donation_subscription_monthly_300`
   - **年額寄附**: `¥3,000`、`Recurring / Yearly`、Price 名称は `donation_subscription_yearly_3000`
3. それぞれ作成後に表示される Price ID（例: `price_1234abcd`）を控えておきます。

> **Tip:** Product 名や説明文には「任意の寄附であり対価がない」旨を明記すると審査時の確認がスムーズです。

### 3.2 Success / Cancel URL の確認

Stripe Checkout の `success_url` と `cancel_url` は Functions 側で `APP_BASE_URL` から組み立てます。Pages 本番 URL を `https://<project>.pages.dev` とした場合、以下が設定されます。

- `success_url`: `https://<project>.pages.dev/thanks`
- `cancel_url`: `https://<project>.pages.dev/donate`

テスト時は `wrangler dev` のローカル URL（例: `http://localhost:8788`）を `APP_BASE_URL` に設定すれば、そのままローカルで Checkout を確認できます。

## 4. Cloudflare Pages での環境変数登録

Pages Dashboard の **Settings > Functions > Environment variables** から以下を登録します（すべて Secret 扱い）。

| Key | Value | 備考 |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Stripe Test Secret Key (`sk_test_...`) | 本番では Live Key に置き換える |
| `PRICE_ONE_TIME_300` | 単発寄附の Price ID | 例: `price_one_time_300` |
| `PRICE_SUB_MONTHLY_300` | 月額寄附の Price ID | 例: `price_monthly_300` |
| `PRICE_SUB_YEARLY_3000` | 年額寄附の Price ID | 例: `price_yearly_3000` |
| `APP_BASE_URL` | ページのベース URL | テスト: `http://localhost:8788` / 本番: `https://<project>.pages.dev` |

`COOKIE_SIGN_KEY` や Discord OAuth のキーは Phase 2 で設定済みの前提です。未登録の場合は `docs/guide/auth/discord-oauth.md` を参照して先に登録してください。

## 5. ローカル環境での確認

1. `.dev.vars` に上記のキーを追加し、ローカル用の Test Key と Price ID を設定します。
2. `npm install && npm run dev` で開発サーバーを起動します。
3. Discord OAuth でログインし、`/donate` の寄附ボタンをクリックして Checkout へ遷移します。
4. Stripe の Test カード（例: `4242 4242 4242 4242`）で決済を完了すると `/thanks` に戻り、Stripe Dashboard で Payment / Subscription が作成されます。

## 6. トラブルシューティング

| 症状 | 原因 | 対応 |
| --- | --- | --- |
| Checkout 開始時に 500 エラー | Price ID または Secret Key が未設定 | Pages の環境変数を確認し再デプロイする |
| Stripe ログに `resource_missing` で Price が存在しないと記録される | `STRIPE_SECRET_KEY` と `PRICE_*` がテスト/本番で混在している | Cloudflare Pages の Functions > Environment variables で同じモードの Price ID（Test なら `sk_test`, Live なら `sk_live`）に揃えてセットし、再デプロイする |
| Success ページに戻らない | `APP_BASE_URL` が実環境と不一致 | Pages / `.dev.vars` の値を見直す |
| 決済完了後も metadata が更新されない | Discord ログイン前に Checkout を実行している | `/donate` のログイン導線から再度実行する |

## 7. 次のステップ

- Donors 掲載と同意管理を実装する Phase 4 では、ここで設定した Price / Customer metadata を利用して Stripe から表示名を取得します。
- 本番リリース時には Live Key と本番 Price ID に差し替え、動作確認後に `docs/guide/payments/stripe-setup.md` を更新してください。

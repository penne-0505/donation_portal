---
title: 'Stripe Webhook 運用ガイド'
domain: 'donation-portal'
status: 'active'
version: '0.1.0'
created: '2025-10-30'
updated: '2025-10-30'
related_issues: []
related_prs: []
references:
  - docs/plan/donation-portal/phase-05-webhook/plan.md
  - docs/draft/interface_definition.md
---

# Stripe Webhook 運用ガイド

## 1. 概要

Stripe からの `payment_intent.succeeded` および `invoice.paid` イベントを Cloudflare Pages Functions (`POST /api/webhooks/stripe`) で受信し、寄付を確認します。本ガイドでは Test / Preview 環境を対象に、Webhook の登録、テスト方法、Cloudflare Logs を使った一次監視、障害時の初動対応フローをまとめます。

## 2. 前提条件

- Stripe Dashboard にアクセスでき、Test モードで操作可能であること。
- Cloudflare Pages プロジェクトで Functions がデプロイ済みであること。
- Pages の環境変数に `STRIPE_WEBHOOK_SECRET` が設定済みであること。
- ローカル開発環境では `wrangler dev` を利用し、Stripe CLI からトンネリングできること。

## 3. Webhook 登録手順

1. Stripe Dashboard の **Developers > Webhooks** で「Add endpoint」を選択します。
2. URL に `https://<project>.pages.dev/api/webhooks/stripe` を入力し、`payment_intent.succeeded` と `invoice.paid` を選択します。
3. Test モードで作成後に表示される **Signing secret** (`whsec_...`) を控え、Cloudflare Pages の **Settings > Functions > Environment variables** に `STRIPE_WEBHOOK_SECRET` として登録します。
4. ローカル開発時は Stripe CLI で `stripe listen --forward-to localhost:8788/api/webhooks/stripe` を実行し、表示されたシークレットを `.dev.vars` の `STRIPE_WEBHOOK_SECRET` に設定します。
5. 環境変数を更新した場合は必ず再デプロイし、`wrangler dev` でも再起動して最新のシークレットを読み込みます。

## 4. テスト方法

### 4.1 Stripe CLI を用いたテスト

```bash
# payment_intent.succeeded の送信例
stripe trigger payment_intent.succeeded

# invoice.paid の送信例
stripe trigger invoice.paid
```

- CLI 実行後、ターミナルに表示される `Webhook endpoint` へのレスポンスが `200` であることを確認します。
- `stripe listen` を利用している場合、受信ログに `event id` と `status=200` が表示されれば成功です。
- 同じイベントを `--override` 付きで再送し、冪等的に `200` が返ることを確認します。

### 4.2 Dashboard からの手動再送

1. Stripe Dashboard の **Developers > Events** を開きます。
2. 対象イベント (`payment_intent.succeeded` / `invoice.paid`) を選び、「Retry»」から任意の endpoint に再送します。
3. `Response` が `200` であること、Cloudflare Logs に重複イベントとして記録されていることを確認します。

## 5. Cloudflare Logs での確認

### 5.1 Pages Logs (wrangler)

```bash
# プレビュー環境の webhook 処理ログを 10 分間隔で取得する例
wrangler pages deployments list
wrangler pages deployment tail <deployment-id> --filter request.url="/api/webhooks/stripe"
```

- `deployment tail` はリアルタイムのストリームです。イベント ID (`evt_...`)、種別 (`payment_intent.succeeded` など)、`duplicate` 判定がログに含まれていることを確認します。
- エラー時は `error` レベルのログに署名検証失敗や JSON パース失敗の理由が出力されます。

### 5.2 Cloudflare Dash の Analytics

- Cloudflare Pages の **Analytics > Functions** で `api/webhooks/stripe` を選択し、エラー率やリクエスト数を監視します。
- 5xx が増加している場合は `STRIPE_WEBHOOK_SECRET` の更新漏れや Stripe 側の再送を疑い、Dashboard のイベント履歴を確認してください。

## 6. 障害時の初動対応フロー

1. Stripe Dashboard で対象イベントが `Retrying` 状態かを確認します。
2. Cloudflare Logs で該当時刻のログを確認し、署名検証エラー (`400`) または内部エラー (`500`) のどちらかを切り分けます。
3. 署名エラーの場合
   - `STRIPE_WEBHOOK_SECRET` が最新のものか確認し、必要に応じて再登録します。
   - Pages に再デプロイ後、Stripe CLI で再度トリガーし成功するか検証します。
4. 内部エラーの場合
   - Functions のデプロイ履歴を確認し、直近の変更で Stripe API キーや依存ライブラリが失敗していないか確認します。
   - 解消できない場合は Webhook を一時的に **Disable** し、Stripe 側の再送が溢れないようにします。
5. いずれのケースでも対応ログを記録し、関係者へ Slack などで共有します。

## 7. 運用上のベストプラクティス

- `STRIPE_WEBHOOK_SECRET` は環境ごとに必ず分け、Test / Preview / Production で同じ値を共有しないでください。
- Pages Functions の環境変数変更時は必ず `wrangler pages deploy` を実行し、最新シークレットを含むビルドを配布します。
- 定期的に Stripe Dashboard の「Failed requests」を確認し、24 時間以内に未解決の失敗がない状態を維持します。
- 将来的に Slack 通知などの自動化を導入する際は、本ガイドの手順を基礎に Runbook を更新してください。

## 8. 参考資料

- [`docs/plan/donation-portal/phase-05-webhook/plan.md`](../../plan/donation-portal/phase-05-webhook/plan.md)
- [`docs/draft/interface_definition.md`](../../draft/interface_definition.md)
- Stripe Docs: [https://stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)

---
title: 'Donation Portal 本番環境セットアップ & 移行ガイド'
domain: 'donation-portal'
status: 'active'
version: '1.0.0'
created: '2025-11-02'
updated: '2025-11-02'
related_issues: []
related_prs: []
references:
  - ./phase-06-qa-release.md
  - ../development/setup.md
  - ../payments/stripe-setup.md
  - ../payments/stripe-webhook-operations.md
  - ../auth/discord-oauth.md
---

## 概要

Cloudflare Pages 上で Donation Portal を本番稼働させるための初期セットアップと、Test 環境から Production 環境への移行手順をまとめたガイドです。本書は Phase 6 QA & Release Runbook の実行に先立ち、本番用 Secrets の準備や Stripe/Discord の Live 切替、Cloudflare Pages のプロジェクト構築にフォーカスします。

> **対象読者**: プロジェクトのリリース担当者、SRE/OPS メンバー、Stripe/Discord の Live 権限を持つ運用管理者。

## 適用範囲

- Cloudflare Pages（Production 環境）と Preview（Test）環境の構築・切替
- Stripe Checkout / Webhook の Live モード設定
- Discord OAuth アプリケーションの本番設定
- リリース前後のデータ移行と検証ポイント

QA 手順やローンチ後の運用監視は [Phase 6 QA & Release Runbook](./phase-06-qa-release.md) を参照してください。

## 前提条件

- `dev` ブランチ上で Phase 1〜6 の実装が完了し、Preview 環境での QA が合格していること
- 本番 Secrets を登録するための Cloudflare アカウント権限（Pages 管理者）
- Stripe Dashboard の Live API キーおよび Webhook 管理権限
- Discord Developer Portal 上で本番用アプリケーションを作成済み（または Test アプリを本番へ昇格可能）
- GitHub リポジトリと Cloudflare Pages の連携が許可されていること

## 環境区分と URL

| 環境       | Cloudflare Pages ブランチ    | 代表 URL                             | Stripe モード | Discord アプリ | 備考               |
| ---------- | ---------------------------- | ------------------------------------ | ------------- | -------------- | ------------------ |
| Preview    | `dev` / Pull Request         | `https://<project>-<hash>.pages.dev` | Test          | Test 用アプリ  | QA・結合テスト用   |
| Production | `main`（または指定ブランチ） | `https://<project>.pages.dev`        | Live          | 本番アプリ     | 寄附受付の公開環境 |

> **ブランチ戦略**: Cloudflare Pages の Production ブランチは `main` を推奨しますが、運用ポリシーに応じて `dev` から直接デプロイする場合は Release Runbook と整合するよう注意してください。

## Cloudflare Pages 本番プロジェクトの構築手順

1. Cloudflare ダッシュボードで **Pages → Create a project** を選択し、GitHub リポジトリ（`donation_portal`）を接続します。
2. **Project name** は `donation-portal`（既存と重複しない名称）を指定し、Build Settings を以下の通り構成します。

- Build command: `npm run build`
- Build output directory: `.open-next`
- Functions directory: `.open-next/functions`
- 補足: `npm run build` は Next.js の成果物と既存 Pages Functions を `.open-next/` 配下に集約します。追加のコピー処理は不要です。
- Compatibility date: `2024-10-29`
- Compatibility flags: ビルド済み `_worker.js` に `nodejs_compat` を自動で挿入（追加の UI 設定は不要）

> `npm run build` 実行時に `scripts/run-next-on-pages.cjs` が `_worker.js/index.js` の先頭へ互換性フラグを挿入します。ローカルの `.open-next/` を削除してから再ビルドすると、Pages デプロイでも同じ設定が反映されます。

3. **Production branch** を `main` に設定し、必要に応じて Preview ブランチに `dev` を追加します。
4. セットアップ後、Pages が自動で初回ビルドを実行するため、完了を待ってから Secrets の登録に進みます。

## 本番 Secrets / 環境変数の登録

1. Cloudflare Pages の対象プロジェクトで **Settings → Functions → Environment variables (Secrets)** を開きます。
2. 下表の値を Production / Preview の両方に登録します。Live 専用値は Production のみに登録してください。

| キー                    | 種別   | Production                                   | Preview                                             | 備考                                    |
| ----------------------- | ------ | -------------------------------------------- | --------------------------------------------------- | --------------------------------------- |
| `STRIPE_SECRET_KEY`     | Secret | Live 用 `sk_live_*`                          | Test 用 `sk_test_*`                                 | Live/Test の切替に合わせて更新          |
| `STRIPE_WEBHOOK_SECRET` | Secret | Live 用 Signing secret                       | Test 用 Signing secret                              | Stripe Dashboard の endpoint ごとに取得 |
| `PRICE_ONE_TIME_300`    | Secret | Live Price ID                                | Test Price ID                                       | 金額・通貨を事前に Dashboard で作成     |
| `PRICE_SUB_MONTHLY_300` | Secret | Live Price ID                                | Test Price ID                                       | 月額プラン                              |
| `PRICE_SUB_YEARLY_3000` | Secret | Live Price ID                                | Test Price ID                                       | 年額プラン                              |
| `DISCORD_CLIENT_ID`     | Secret | 本番アプリの Client ID                       | Test アプリの Client ID                             | OAuth 連携用                            |
| `DISCORD_CLIENT_SECRET` | Secret | 本番アプリの Secret                          | Test アプリの Secret                                | 再生成時は即時更新                      |
| `DISCORD_REDIRECT_URI`  | Env    | `https://<project>.pages.dev/oauth/callback` | `https://<project>-<hash>.pages.dev/oauth/callback` | Discord Portal 側と一致させる           |
| `APP_BASE_URL`          | Env    | `https://<project>.pages.dev`                | `https://<project>-<hash>.pages.dev`                | Functions のリダイレクト基準            |
| `COOKIE_SIGN_KEY`       | Secret | 32 文字以上のランダム英数                    | 任意のランダム英数                                  | 切替時は古い Cookie を破棄              |

3. 変更は 2 名以上でペアレビューし、手順書やチケットに記録を残します。
4. Secrets 登録後に **Save** を押し、Preview/Production それぞれで再デプロイを行います。

## Stripe Live 設定

1. Stripe Dashboard の **Products** で本番用 Price（単発・月額・年額）を事前に作成し、上表の ID を取得します。
2. **Developers → API keys** で `sk_live_*` を発行し、Cloudflare Pages の Production Secret に登録します。
3. **Developers → Webhooks** で Production endpoint（例: `https://<project>.pages.dev/api/webhooks/stripe`）を追加し、`payment_intent.succeeded` と `invoice.paid` を選択します。
4. 表示された Signing secret を `STRIPE_WEBHOOK_SECRET`（Production）として登録します。
5. CLI から `stripe login` → `stripe trigger payment_intent.succeeded --livemode` を実行し、`200 OK` のレスポンスと Cloudflare Logs の `env=production` を確認します。

## Discord OAuth 本番設定

1. Discord Developer Portal で本番用アプリケーションを開き、`Redirects` に `https://<project>.pages.dev/oauth/callback` を登録します。
2. `Client ID` / `Client Secret` を取得し、Cloudflare Pages に Secrets として登録します。
3. OAuth Consent の文言・アイコンが公開に問題ないか確認し、`Default Authorization Link` を本番 URL に設定します。
4. 既存の Test アプリから Live へ切り替える場合は、Discord 側での審査や権限設定が必要なため、必要に応じて 1〜2 週間の余裕を確保します。

## 移行・ローンチ手順

1. **リリース候補確定**: `main` ブランチに Phase 6 完成版をマージし、Preview で最終確認を行います。
2. **変更凍結**: リリースウィンドウ中は `main` / `dev` への直接コミットを制限し、緊急修正はホットフィックス手順に従います。
3. **Secrets 切替**: 上記手順で Live 用 Secrets を登録し、`wrangler pages deploy` または GitHub トリガーで Production デプロイを実行します。
4. **QA 実施**: [Phase 6 QA & Release Runbook](./phase-06-qa-release.md#3-qa-チェックリスト) の QA-01〜QA-10 を Production で抜粋実施（Live 決済は少額テストを実施）。
5. **Donors 同意移行**: Test 環境の同意データは Stripe Metadata（Customer）に保存されているため、Live 環境では新規寄附者のみが表示されます。既存テストデータは削除・アーカイブし、本番での初回寄附をもって掲載を開始します。
6. **アナウンス**: 寄附受付開始をコミュニティへ告知し、Stripe レシートと `/thanks` ページの案内を共有します。

## ロールバック手順

1. Cloudflare Pages ダッシュボードで **Deployments → Rollback** を実行し、直前の安定版へ戻します。
2. Stripe Dashboard の Webhook endpoint を一時停止し、不要な Live 決済の再送を防止します。
3. Secrets を Test 用に差し戻し、再発防止策をまとめてから再リリースを計画します。
4. 寄附者への影響がある場合は、Slack / Discord で状況説明と対応見込みを共有します。

## リリース後の初動監視

| 項目                  | 監視方法                                 | 判定基準              | 対応                                    |
| --------------------- | ---------------------------------------- | --------------------- | --------------------------------------- |
| Stripe Webhook 成功率 | Stripe Dashboard > Events                | 失敗率 0%（再送含む） | 失敗発生時は Webhook ガイドの初動対応へ |
| Functions レイテンシ  | Cloudflare Pages > Analytics > Functions | P95 < 200ms           | 閾値超過時はログ確認と再デプロイ検討    |
| エラー監視            | Sentry / Cloudflare Logs                 | 致命エラー 0 件       | エラー検知時は Issue 登録と暫定対応     |
| 寄附件数              | Stripe Dashboard > Payments              | 基準値から急減なし    | 異常時はコミュニティ周知・フォーム確認  |

監視結果はローンチ当日から 1 週間は日次で共有し、その後は週次レポートへ移行します。

## 関連ドキュメント

- [開発環境セットアップガイド](../development/setup.md)
- [Stripe Webhook 運用ガイド](../payments/stripe-webhook-operations.md)
- [Stripe Checkout 設定ガイド](../payments/stripe-setup.md)
- [Discord OAuth フロー運用ガイド](../auth/discord-oauth.md)
- [Phase 6 QA & Release Runbook](./phase-06-qa-release.md)

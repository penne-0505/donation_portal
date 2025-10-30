---
title: 'Donation Portal 本番環境セットアップ & 移行ガイド'
domain: 'donation-portal'
status: 'active'
version: '1.0.0'
created: '2025-11-02'
updated: '2025-11-03'
related_issues: []
related_prs: []
references:
  - ./phase-06-qa-release.md
  - ./cloudflare-pages-troubleshooting.md
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

| 環境 | Cloudflare Pages ブランチ | 代表 URL | Stripe モード | Discord アプリ | 備考 |
| --- | --- | --- | --- | --- | --- |
| Preview | `dev` / Pull Request | `https://<project>-<hash>.pages.dev` | Test | Test 用アプリ | QA・結合テスト用 |
| Production | `main`（または指定ブランチ） | `https://<project>.pages.dev` | Live | 本番アプリ | 寄附受付の公開環境 |

> **ブランチ戦略**: Cloudflare Pages の Production ブランチは `main` を推奨しますが、運用ポリシーに応じて `dev` から直接デプロイする場合は Release Runbook と整合するよう注意してください。

## Cloudflare Pages 本番プロジェクトの構築手順

1. Cloudflare ダッシュボードで **Pages → Create a project** を選択し、GitHub リポジトリ（`donation_portal`）を接続します。
2. **Project name** は `donation-portal`（既存と重複しない名称）を指定し、Build Settings を以下の通り構成します。
   - Build command: `npm run build`
   - Build output directory: `public`
   - Functions directory: `functions`
   - Compatibility date: `2024-10-29`
3. **Production branch** を `main` に設定し、必要に応じて Preview ブランチに `dev` を追加します。
4. セットアップ後、Pages が自動で初回ビルドを実行するため、完了を待ってから Secrets の登録に進みます。

## トラブルシューティング

Cloudflare Pages のデプロイ時に `npm error enoent Could not read package.json` が発生した場合、ルートディレクトリ設定が誤っている可能性があります。設定手順や再デプロイ方法は [Cloudflare Pages トラブルシューティングガイド](./cloudflare-pages-troubleshooting.md) を参照してください。

## Secrets（環境変数）の登録

1. Cloudflare Pages ダッシュボードで **Settings → Functions → Environment variables (Secrets)** を開きます。
2. `.env.example` を参照し、Preview / Production それぞれに必要な値を登録します。
3. Stripe / Discord の Live 切替は本番リリース直前に実施し、Preview 環境が Test モードを維持していることを確認します。
4. 変更後は **Deployments → Retry deployment** で Functions へ値を反映させます。

## Stripe Live モード切替

1. Stripe Dashboard の **Developers → API keys** で `sk_live_*` を取得し、Cloudflare Pages Production Secrets に登録します。
2. Checkout の Price ID (`PRICE_*`) を Live 用に差し替え、Webhook Signing secret (`whsec_*`) も本番用を登録します。
3. デプロイ完了後に `stripe trigger payment_intent.succeeded` を用いた Live Webhook テストは行えないため、テストカードで最小決済を行い、Cloudflare Logs で `200` 応答を確認します。

## Discord OAuth 本番設定

1. Discord Developer Portal で本番アプリケーションの `Client ID` / `Client Secret` を取得し、Pages の Secrets に登録します。
2. **OAuth2 → Redirects** に `https://<project>.pages.dev/oauth/callback` を追加し、`Preview` 用の URL は残したままにします。
3. 認可フローの整合性を保つため、Test 環境の Bot 権限とスコープを流用する場合でも、Live 用に再確認してください。

## リリース前検証

- `/donate` → Checkout → `/thanks` の完了までのフローを Live Secrets で検証
- `/api/donors` が `consent_public=true` の顧客のみを返すことを確認
- Webhook ログに `payment_intent.succeeded` と `invoice.paid` が記録され、エラーが無いことを確認
- Discord OAuth で取得した表示名が Stripe Customer metadata に反映されることを確認

## ロールバック手順

1. Cloudflare Pages ダッシュボードで **Deployments → Rollback** を実行し、直前の安定版デプロイに戻します。
2. 必要に応じて `wrangler pages publish --branch=<stable>` で安定ブランチを再デプロイします。
3. Stripe / Discord Secrets を元の Test 値に戻し、Preview 環境での QA が継続できるようにします。

## 監視と運用

| 項目 | チェック場所 | 基準 | アクション |
| --- | --- | --- | --- |
| Functions エラー率 | Cloudflare Pages > Analytics > Functions | 0% 近辺 | エラー率が上昇した場合はログを確認し、必要に応じてロールバック |
| Checkout 成功率 | Stripe Dashboard > Payments | 失敗率 < 1% | 失敗が増加した場合は Stripe 側のアラートと合わせて原因調査 |
| Discord OAuth エラー | Cloudflare Pages Logs (`oauth/*`) | エラー無し | エラー発生時は Discord アプリ設定と Redirect URI を再確認 |

## 関連資料

- [Phase 6 QA & Release Runbook](./phase-06-qa-release.md)
- [Cloudflare Pages トラブルシューティングガイド](./cloudflare-pages-troubleshooting.md)
- [Stripe Webhook 運用ガイド](../payments/stripe-webhook-operations.md)
- [Discord OAuth 運用ガイド](../auth/discord-oauth.md)


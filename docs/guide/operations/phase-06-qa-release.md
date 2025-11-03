---
title: 'Phase 6 QA & Release Runbook'
domain: 'donation-portal'
status: 'active'
version: '1.0.0'
created: '2025-10-31'
updated: '2025-10-31'
related_issues: []
related_prs: []
references:
  - ../../plan/donation-portal/phase-06-qa/plan.md
  - ../payments/stripe-setup.md
  - ../payments/stripe-webhook-operations.md
  - ../auth/discord-oauth.md
---

# Phase 6 QA & Release Runbook

## 1. 概要

Donation Portal MVP を本番リリースするための最終 QA チェックリストとデプロイ手順をまとめた Runbook です。単発/定期寄付、Donors 掲示、Stripe Webhook、Discord OAuth といった Phase 1〜5 の成果物が統合されていることを前提とします。Live キー投入後の初動監視やロールバック判断も本書に従って実施してください。

## 2. 前提条件

- Phase 1〜5 の成果物が `dev` ブランチにマージ済みで、Preview 環境で検証済みであること。
- Stripe と Discord の Test 設定が `.dev.vars` と Pages Secrets の両方で整備されていること。
- Cloudflare Pages の Production デプロイ権限と Stripe Dashboard の Live 権限を持つ担当者が 2 名以上アサインされていること。
- QA 実施結果を記録するワークスペース（Notion / Jira 等）が準備済みであること。

## 3. QA チェックリスト

| No.   | 項目                           | 手順                                                                              | 期待結果                                                                                    | 記録欄 |
| ----- | ------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------ |
| QA-01 | 単発寄付フロー（Test）         | Discord OAuth → `/donate` で同意オン → Checkout → `4242` カードで支払い           | `/thanks` 表示、Stripe Dashboard に PaymentIntent が作成され `metadata.consent_public=true` |        |
| QA-02 | 定期（月額）寄付フロー（Test） | QA-01 と同様に `/donate` で月額を選択して Checkout                                | Stripe Dashboard に Subscription が作成され、Customer metadata が更新される                 |        |
| QA-03 | 定期（年額）寄付フロー（Test） | `/donate` で年額を選択して Checkout                                               | Subscription が `annual` プランで作成される                                                 |        |
| QA-04 | Donors 掲示反映                | Consent をオンにした状態で Checkout 後 `/donors` にアクセス                       | 表示名が 60 秒以内にリストへ追加される                                                      |        |
| QA-05 | Consent 撤回・再同意           | `/donors` で撤回 → Stripe Dashboard で metadata=false を確認 → `/donate` で再同意 | Donors API のレスポンスが撤回/再同意に追従し、キャッシュ遅延は 60 秒以内                    |        |
| QA-06 | Webhook 冪等性                 | Stripe CLI で `payment_intent.succeeded` を 2 回送信                              | 最初が `200`, 2 回目も `200`、ログに `duplicate=true` が記録される                          |        |
| QA-07 | Webhook 署名検証               | Stripe CLI の `trigger` 後に署名シークレットを不正値で再送                        | `400` が返り、ログに `signature_invalid` が残る                                             |        |
| QA-08 | UI 法務文言確認                | `/donate`, `/thanks`, `/donors` のコピーを確認                                    | 「任意の寄付」「対価なし」「税控除なし」の表現が全ページで表示される                        |        |
| QA-09 | アクセシビリティ簡易チェック   | キーボードのみで `/donate` を操作し、スクリーンリーダーで主要導線を読み上げ       | フォーカスインジケーターが可視、aria-label が設定漏れなし                                   |        |
| QA-10 | Health エンドポイント          | `/api/health` にアクセス                                                          | `200 OK` と `{"status":"ok"}` が返る                                                        |        |

> **実施ログ**: 各 QA 番号ごとに日時・担当・証跡リンク（スクリーンショット/ログ）を Notion / Jira へ記録し、完了後にリンクを上記記録欄へ転記してください。

## 4. Live 切替とデプロイ手順

### 4.1 Secrets レビュー

1. Cloudflare Pages の **Settings → Functions → Environment variables (Secrets)** を開き、以下の値を Live 用に差し替えます。
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `PRICE_ONE_TIME_300`, `PRICE_SUB_MONTHLY_300`, `PRICE_SUB_YEARLY_3000`
   - `APP_BASE_URL`（本番 URL）
   - Discord 関連キー（必要に応じて本番アプリケーション ID / Secret）
2. 変更は 2 名でペアレビューし、作業ログに確認者のサインオフを残します。
3. Secrets 更新後に `wrangler pages deploy` もしくは GitHub main/dev へのマージで Production デプロイを実行します。

### 4.2 Stripe Webhook (Live)

1. Stripe Dashboard の **Developers > Webhooks** で Production endpoint を追加し、`payment_intent.succeeded` / `invoice.paid` を選択します。
2. 表示された Signing secret を `STRIPE_WEBHOOK_SECRET` として登録後、テストとして `stripe trigger payment_intent.succeeded --livemode` を実行（CLI で Live モードに切替）します。
3. レスポンスが `200` であること、Cloudflare Logs に `env=production` のイベントが流れていることを確認します。

### 4.3 スモークテスト

1. 対象チームメンバーが少額（¥100〜¥300）で単発寄付を実施します。
2. Checkout 完了後 `/thanks` に遷移するか、Stripe Dashboard で Live Payment が記録されるか確認します。
3. Donors 掲示に 10 分以内で表示名が追加されること、Webhook ログが `duplicate=false` で 1 回のみ処理されていることをチェックします。

## 5. リリース後 1 週間の監視

| 項目                 | 監視方法                                      | 判定基準                            | 対応フロー                                                                                      |
| -------------------- | --------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| Webhook 成功率       | Stripe Dashboard > Developers > Events        | 失敗率 0%（再送があっても最終成功） | 失敗検知時は `docs/guide/payments/stripe-webhook-operations.md#6-障害時の初動対応フロー` に従う |
| Functions レイテンシ | Cloudflare Pages > Analytics > Functions      | P95 < 200ms                         | 指標悪化時はデプロイ履歴とログを確認し、必要に応じてロールバック                                |
| UI エラー            | Sentry 等のエラートラッキング（導入済み前提） | 致命エラー 0 件                     | 発生時は Issue を作成し、影響度を共有                                                           |
| 寄付件数             | Stripe Dashboard > Payments / Subscriptions   | 日次で急減していないかを確認        | 急減時はコミュニティへアナウンスが行われているか確認                                            |

- 監視結果は初週のみ日次で Slack チャンネルに共有し、1 週間後に週次報告へ切り替えます。
- 重大障害時は Pages の「Rollback」機能で直前の安定バージョンへ戻し、Stripe Webhook を一時停止してください。

## 6. コミュニケーション & ドキュメント更新

- リリース完了後に以下を更新します。
  - `docs/draft/operations/consent-runbook.md` の TODO を反映し、本 Runbook へのリンクを追加。
  - 社内 Wiki / Notion の FAQ セクションへ QA 結果と手順を転載。
  - CHANGELOG（準備中の場合は本 Runbook の要約を記載）。
- ペアレビュアと QA 担当は完了報告を Slack #donation-portal に投稿し、Stripe 支払いリンクと Donors ページのスクリーンショットを添付します。

## 7. ロールバックと緊急対応

1. Stripe Dashboard で対象 endpoint を一時停止し、再送キューの蓄積を防ぎます。
2. Cloudflare Pages の前バージョンに Rollback し、`wrangler pages publish --branch=<stable>` で安定版を再デプロイします。
3. Secrets を Test 用に差し戻し、Live 対応中のタスクは Incident Issue として切り出します。
4. 影響範囲と暫定対応策を 2 時間以内に共有し、再発防止策を次回リリース前にドキュメント化します。

## 8. 参考リンク

- [Phase 6 計画書](../../plan/donation-portal/phase-06-qa/plan.md)
- [Stripe Checkout 設定ガイド](../payments/stripe-setup.md)
- [Stripe Webhook 運用ガイド](../payments/stripe-webhook-operations.md)
- [Discord OAuth フロー運用ガイド](../auth/discord-oauth.md)

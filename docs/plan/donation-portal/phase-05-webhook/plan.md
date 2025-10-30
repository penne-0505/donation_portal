---
title: "Donation Portal Phase 5 — Webhook & Operations 計画"
domain: "donation-portal"
status: "superseded"
version: "0.1.0"
created: "2025-10-29"
updated: "2025-10-29"
related_issues: []
related_prs: []
references:
  - docs/plan/donation-portal/mvp/plan.md
  - docs/draft/interface_definition.md
  - docs/intent/donation-portal/mvp-architecture-and-phases.md
scope:
  - "`POST /api/webhooks/stripe` を実装し、Stripe イベントの検証と冪等化を行う。"
  - "`GET /health` を提供し、監視用の基本エンドポイントを整備する。"
  - "Cloudflare Logs と軽量通知の運用導線を準備する。"
non_goals:
  - "高度な監視ダッシュボードや自動アラートの本番運用。"
  - "Webhook で Stripe 以外のサービスに連携。"
  - "本番 Live キーへの切替（Phase 6 で実施）。"
requirements:
  functional:
    - "Stripe-Signature を検証し、該当イベント（payment_intent.succeeded / invoice.paid）をログに記録する。"
    - "event.id を利用して冪等性を担保し、重複イベントを no-op とする。"
    - "`GET /health` で 200 OK と `ok` を返し、監視用に利用可能とする。"
  non_functional:
    - "Webhook は 200ms 以内の早期応答を目標。"
    - "再送イベントがあってもエラーを出さない。"
    - "Phase 完了までに 4 日程度を想定。"
constraints:
  - "Stripe CLI または Dashboard で Webhook テストを実施。"
  - "Cloudflare Workers 環境の KV/Cache を必要に応じて使用するが、MVP ではメモリ内で冪等性を担保。"
  - "ログは個人情報を含めない。"
api_changes:
  new:
    - name: "POST /api/webhooks/stripe"
      description: "Stripe からのイベントを受信し、署名検証・冪等化後にログを記録する。"
    - name: "GET /health"
      description: "監視用ヘルスチェックを返す。"
  updates: []
  deprecated: []
data_models:
  - "Webhook Response: {received: true}"
  - "冪等性キャッシュ: event.id の Set を短時間保持。"
migrations:
  - "なし。"
rollout_plan:
  - "Stripe Webhook を Test 環境に登録し、署名シークレットを Env Bindings へ設定する。"
  - "Cloudflare Pages プレビューで Webhook が正しく署名検証を通過することを Stripe CLI で確認。"
rollback:
  - "不具合時は Stripe Webhook 設定を一時停止し、旧バージョンへロールバックする。"
  - "冪等性キャッシュ失敗時は Cloudflare KV 導入を検討し再デプロイ。"
test_plan:
  - "Stripe CLI による webhook テスト（成功/署名不正/再送）。"
  - "unit: event.id キャッシュロジック、署名検証ハンドラ。"
  - "health エンドポイントのレスポンス確認。"
observability:
  - "Cloudflare Logs に webhook の結果（event.id, status）を出力。"
  - "失敗イベントに対して Slack (Incoming Webhook) 等へ通知するハンドオフ準備。"
security_privacy:
  - "Webhook 署名シークレットを Env Bindings に保存。"
  - "ログに個人情報・表示名を含めない。"
performance_budget:
  - "Webhook P95 < 200ms、Health P95 < 50ms。"
i18n_a11y:
  - "対象外（API のみ）。"
acceptance_criteria:
  - "Stripe Test イベントで Webhook が 200 応答し、再送時も冪等に処理される。"
  - "署名不正時に 400 エラーを返す。"
  - "Health エンドポイントが監視に利用可能。"
owners:
  - "@donation-portal-core"
superseded_by: docs/intent/donation-portal/mvp-architecture-and-phases.md
---

# 本ドキュメントの位置付け

Webhook と運用に関する最終判断は intent ドキュメント `docs/intent/donation-portal/mvp-architecture-and-phases.md` に統合済みです。本 Plan は参照用に残しています。

# Phase 5 — Webhook & Operations 計画

## 1. 目的

Stripe からの寄附完了イベントを安全に受信し、遅延なく ACK する体制と、監視の初期設定を整える。

## 2. 背景と前提

- Phase 3 で metadata 更新済み、Phase 4 で Donors 掲載が機能している。
- Webhook が成功すれば Stripe Dashboard とサイトの一貫性を監視できる。
- Cloudflare Pages Functions が運用中である。

## 3. タスク詳細

1. **Webhook 実装**
   - Raw body を取得し Stripe の署名検証を実施。
   - イベントタイプごとの処理（ログのみ）とその他イベントの no-op。
   - event.id をメモリキャッシュ（Durable Object なし）で短時間保持し冪等性を確保。

2. **Health エンドポイント**
   - `GET /health` で簡易レスポンスを返す。
   - 今後の監視拡張に備え、バージョンやタイムスタンプを返す拡張余地をコメントに残す。

3. **運用整備**
   - Cloudflare Logs のクエリサンプルを Runbook に追加。
   - Stripe Webhook 失敗通知の手動監視手順と一次対応フローを定義。
   - Slack 通知や PagerDuty 連携は後続の検討項目として backlog に記載。

## 4. 成果物

- `functions/api/webhooks/stripe.ts`
- `functions/health.ts`
- Webhook/Health 運用手順のドキュメントドラフト

## 5. リスクと対応

| リスク | 影響 | 対応策 |
| --- | --- | --- |
| 署名検証失敗 | イベント取り逃し | シークレット設定を二重チェックし、Stripe CLI で再現。 |
| 冪等性漏れ | 重複ログや処理 | event.id キャッシュを実装し、再送テストを行う。 |
| 遅延 ACK | Stripe からの再送増加 | 早期 200 を返し、追加処理は将来のワーカーにオフロード。 |

## 6. スケジュール

- Day 1: Webhook 実装とユニットテスト。
- Day 2: Stripe CLI テストと Cloudflare Logs 設定。
- Day 3-4: Runbook 作成、Health エンドポイント、レビュー対応。

## 7. 完了条件

- Acceptance Criteria を満たし、Phase 6 の QA で Webhook を含む E2E が実施可能。
- Webhook 運用手順が文書化され、緊急対応フローが定義されている。

## 8. 関連タスク

- [Core-Feature-5](../../../../TODO.md#core-feature-5)

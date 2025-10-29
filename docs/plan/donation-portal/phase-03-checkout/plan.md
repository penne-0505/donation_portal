---
title: "Donation Portal Phase 3 — Checkout & Metadata 計画"
domain: "donation-portal"
status: "draft"
version: "0.1.0"
created: "2025-10-29"
updated: "2025-10-29"
related_issues: []
related_prs: []
references:
  - docs/plan/donation-portal/mvp/plan.md
  - docs/draft/interface_definition.md
  - docs/draft/impl_plan_v0.md
scope:
  - "Stripe Checkout を用いた単発/定期寄附フローを実装する。"
  - "`POST /api/checkout/session` で Stripe Customer metadata を SSOT として更新する。"
  - "`/donate` ページに単発/定期寄附ボタンと同意フローの連携を行う。"
non_goals:
  - "Webhook 処理や Donors 掲載、consent 更新 API。"
  - "任意金額や追加決済手段の導入。"
  - "本番 Live キーへの切替作業（Phase 6 で実施）。"
requirements:
  functional:
    - "`POST /api/checkout/session` を実装し、sess Cookie の情報で Stripe Customer metadata を更新する。"
    - "`mode=payment|subscription` と `interval`/`variant` のバリデーションを行う。"
    - "`/donate` から Stripe Checkout を起動し、完了後 `/thanks` へ遷移させる。"
  non_functional:
    - "Stripe API 呼び出しのエラーをハンドリングし、ユーザへ分かりやすいメッセージを返す。"
    - "レスポンスは 1 秒以内を目標。"
    - "1 名稼働で 4 日以内に完了する。"
constraints:
  - "Price ID は環境変数 `PRICE_ONE_TIME_300`, `PRICE_SUB_MONTHLY_300`, `PRICE_SUB_YEARLY_3000` から取得する。"
  - "Customer metadata の更新は idempotent に行い、既存値を上書きする。"
  - "Stripe API には Test キーを使用し、Live 切替は後続フェーズ。"
api_changes:
  new:
    - name: "POST /api/checkout/session"
      description: "Stripe Checkout Session を生成し、Customer metadata に display_name・discord_id・consent_public を保存する。"
  updates: []
  deprecated: []
data_models:
  - "Request: {mode, interval, variant}"
  - "Response: {url}"
  - "Metadata: {display_name, display_name_source=discord, discord_id, consent_public}"
migrations:
  - "なし。Stripe 上での Customer 更新のみ。"
rollout_plan:
  - "Stripe Dashboard で Test 用 Price を作成し、環境変数に設定。"
  - "Pages プレビューで Checkout セッションを実際に起動し、Stripe Test カードで確認。"
rollback:
  - "不具合発生時は Checkout ボタンを一時的に無効化し、旧バージョンにデプロイを戻す。"
  - "誤設定した Price ID は Stripe 上で修正し、環境変数を更新。"
test_plan:
  - "mode/interval/variant 組合せのユニットテスト。"
  - "Stripe API モックを用いた metadata 更新テスト。"
  - "E2E: OAuth → Checkout → Thanks の手動/自動テスト。"
observability:
  - "Checkout 成功/失敗ログと Stripe リクエスト ID を Cloudflare Logs に記録。"
security_privacy:
  - "Stripe Secret Key を Env Bindings で管理し、ログへ露出させない。"
performance_budget:
  - "Checkout API 応答 P95 < 500ms。"
i18n_a11y:
  - "寄附ボタンに aria-label と日本語説明を付与。"
acceptance_criteria:
  - "単発/定期寄附の Checkout セッションが生成され、Stripe Test モードで完了できる。"
  - "Stripe Customer metadata に display_name 等が最新状態で保存される。"
  - "ユーザ向けエラー表示とログ記録が実装されている。"
owners:
  - "@donation-portal-core"
---

# Phase 3 — Checkout & Metadata 計画

## 1. 目的

Discord で取得した表示名と掲示同意を Stripe Checkout に反映し、寄附完了後 `/thanks` までの体験を完成させる。

## 2. 背景と前提

- Phase 2 で sess Cookie が利用可能。
- Stripe の Test 環境と Price ID が準備できる状態。
- Donors 掲載は未実装なので、consent_public の反映は metadata の更新までとする。

## 3. タスク詳細

1. **Checkout API 実装**
   - sess Cookie を検証し、`discord_id` が存在しない場合は 401。
  - Price ID のマッピング（mode/interval/variant → PRICE_*）を実装。
   - Customer 作成または取得 (`customer_creation=always`) と metadata 更新。
   - 成功時に Checkout URL を返却、失敗時はエラーモデルで応答。

2. **フロントエンド統合**
   - `/donate` の単発/定期ボタンから API を呼び出し、受け取った URL に location.href で遷移。
   - ローディング表示とエラートーストを実装。
   - OAuth セッション未完了時は再ログイン導線を表示。

3. **Thanks ページ整備**
   - Stripe success/cancel URL を `/thanks` / `/donate` に設定。
   - `/thanks` に感謝メッセージと寄附受付方針の再周知（対価なし/税控除なし）を掲載。

4. **ドキュメントと Runbook**
   - Stripe Price 作成手順と環境変数設定を `docs/guide/payments/stripe-setup.md`（ドラフト）に記録。
   - Checkout API のパラメータ仕様を `docs/reference/api/checkout.md` に草案として記載。

## 4. 成果物

- `functions/api/checkout/session.ts`
- 更新済み `/src/donate/` UI と `/thanks` ページ。
- Stripe 設定/デプロイ手順のドキュメントドラフト。

## 5. リスクと対応

| リスク | 影響 | 対応策 |
| --- | --- | --- |
| Price ID 設定ミス | 決済不可 | .env.example と Runbook で二重確認。 |
| Stripe API エラー | 決済失敗 | リトライガイドとユーザ向けメッセージ整備。 |
| Metadata 未更新 | Donors 掲載に影響 | API 実装で毎回上書き、ユニットテストで確認。 |

## 6. スケジュール

- Day 1: API 実装とユニットテスト。
- Day 2: フロント統合、Thanks ページ整備。
- Day 3-4: Stripe Test E2E、ドキュメント更新、レビュー対応。

## 7. 完了条件

- Acceptance Criteria を満たし、Phase 4 の Donors 掲載に必要な metadata が整備済み。
- Checkout エラー時のユーザ体験が確立されている。

## 8. 関連タスク

- [Core-Feature-3](../../../../TODO.md#core-feature-3)

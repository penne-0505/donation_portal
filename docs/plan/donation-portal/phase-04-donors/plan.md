---
title: "Donation Portal Phase 4 — Donors & Consent 計画"
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
scope:
  - "`GET /api/donors` と `POST /api/consent` を実装し、Stripe metadata を掲示・更新できるようにする。"
  - "`/donors` ページで同意者の表示名のみを掲示し、撤回導線を提供する。"
  - "Donors キャッシュポリシー（max-age=60）と UI 反映を実装する。"
non_goals:
  - "Webhook ログ監視や Slack 通知。"
  - "Donors ページでのランキングや金額表示。"
  - "多言語 UI 対応。"
requirements:
  functional:
    - "Stripe API から consent_public=true の Customer display_name を収集する。"
    - "`POST /api/consent` で metadata.cons... を更新し、撤回/再同意に対応する。"
    - "`/donors` ページで表示名一覧を描画し、撤回控えめの注意文を掲載する。"
  non_functional:
    - "Donors API は 1 秒以内、キャッシュは max-age=60 で設定。"
    - "撤回後 60 秒以内に UI から非表示となる。"
    - "Phase 完了まで 3 日程度を想定。"
constraints:
  - "Stripe Customer の検索は metadata フィルターを使用し、API 制限に留意。"
  - "撤回 API は sess Cookie に依存する。"
  - "Donors ページはルートで静的/SSR のいずれかに合わせ、既存構成に従う。"
api_changes:
  new:
    - name: "GET /api/donors"
      description: "consent_public=true の表示名を取得し、配列で返す。"
    - name: "POST /api/consent"
      description: "sess Cookie に紐づく Customer metadata.cons... を更新する。"
  updates: []
  deprecated: []
data_models:
  - "donors Response: {donors: string[], count: number}"
  - "consent Request: {consent_public: boolean}"
  - "consent Response: 204 No Content"
migrations:
  - "なし。Stripe metadata の更新のみ。"
rollout_plan:
  - "Stripe Test 環境で consent_public の更新と Donors 表示を確認。"
  - "Pages プレビューで `/donors` UI をレビュー。"
rollback:
  - "Donors API に問題がある場合、暫定的にエンドポイントを非公開化（403）し UI にメッセージを表示。"
  - "consent 更新に失敗した場合は Stripe Dashboard で手動修正し、原因を調査。"
test_plan:
  - "Donors API の limit/order/random パラメータのテスト。"
  - "Consent API の成功/失敗ケース（未ログイン、該当 Customer なし）。"
  - "E2E: OAuth → consent 同意/撤回 → Donors 表示の検証。"
observability:
  - "Donors API ヒット数とレスポンス時間を Cloudflare Logs に記録。"
  - "consent 変更イベントを INFO ログで残すが、個人情報はマスク。"
security_privacy:
  - "Donors API には匿名アクセスのみを許容するが、返却データは表示名のみ。"
  - "consent API は sess Cookie 必須で、CSRF 対策として POST のみ許容。"
performance_budget:
  - "Donors API P95 < 800ms、Consent API P95 < 500ms。"
i18n_a11y:
  - "Donors リストに aria-live を設定し、更新をスクリーンリーダへ通知。"
acceptance_criteria:
  - "Donors ページに同意者の表示名のみが掲示され、撤回操作で 60 秒以内に非表示。"
  - "Consent API のエラーハンドリングが実装され、未ログイン時に再ログイン導線を出す。"
  - "API ドキュメント草案が docs/reference に追加されている。"
owners:
  - "@donation-portal-core"
---

# Phase 4 — Donors & Consent 計画

## 1. 目的

Stripe Customer metadata をサイト上の Donors 掲示に連携し、ユーザが掲示同意を管理できるようにする。

## 2. 背景と前提

- Phase 3 で metadata に display_name / consent_public が保持される状態。
- Donors ページはまだスタブのため、UI 実装は本フェーズで完成させる。
- OAuth sess Cookie が利用可能。

## 3. タスク詳細

1. **Donors API 実装**
   - Stripe API の `search` または `list` + フィルタで consent_public=true を取得。
   - order (`desc|asc|random`) と limit (1..200) に対応。
   - `Cache-Control: public, max-age=60` と ETag を設定。

2. **Consent API 実装**
   - sess Cookie から discord_id を取得し、該当 Customer metadata.cons... を更新。
   - 404（該当なし）、401（未ログイン）、500 をハンドリング。
   - 更新後 204 を返す。再同意も同じエンドポイントで対応。

3. **Donors ページ UI**
   - Donors API から名称を取得し、表示名のみ列挙。
   - 撤回リンクで Consent API を呼び出し、成功時に UI を更新。
   - 掲載ポリシー（同意者のみ／金額非公開）を説明。

4. **ドキュメント整備**
   - Donors API リファレンス草案 (`docs/reference/api/donors.md`) を追加。
   - Consent 操作の Runbook と FAQ をドラフト化。

## 4. 成果物

- `functions/api/donors.ts`, `functions/api/consent.ts`
- 完成した `/donors` ページ UI
- API リファレンスと運用ドキュメントのドラフト

## 5. リスクと対応

| リスク | 影響 | 対応策 |
| --- | --- | --- |
| Stripe API レート制限 | キャッシュミス時に遅延 | キャッシュと limit で負荷軽減。 |
| 減少しない Donors 表示 | ユーザ不信 | 撤回後に即時 UI 更新＋注意文。 |
| Consent API 失敗 | ユーザ操作不可 | エラーログとサポートフロー明記。 |

## 6. スケジュール

- Day 1: Donors API 開発とテスト。
- Day 2: Consent API と UI 統合。
- Day 3: E2E 検証、ドキュメント更新、レビュー対応。

## 7. 完了条件

- Acceptance Criteria を満たし、Donors 掲載フローが Stripe metadata と同期する。
- 次フェーズの Webhook 実装に備え、metadata 更新タイミングが整っている。

## 8. 関連タスク

- [UI/UX-Feature-4](../../../../TODO.md#uiux-feature-4)

---
title: "Donation Portal Phase 6 — QA & Release 計画"
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
  - "MVP の統合テスト、ドキュメント整備、リリース準備を完了する。"
  - "Stripe Live キーへの切替と本番デプロイを実施する。"
  - "初期運用の監視体制と Runbook を確定する。"
non_goals:
  - "追加機能開発や拡張フェーズの実装。"
  - "高度な自動監視やアラートチューニング。"
requirements:
  functional:
    - "単発/定期寄附フロー、Donors 掲載、Webhook、Consent の総合テストを完了する。"
    - "Stripe Live キーと Discord 本番設定を投入し、本番デプロイを実施する。"
    - "Runbook/FAQ/ガイドを更新し、運用フローを明記する。"
  non_functional:
    - "Stripe Webhook 成功率 100%（テスト範囲内）、Pages デプロイ正常。"
    - "UI のコピー（対価なし/税控除なし）が全ページで確認済み。"
    - "1 名稼働で 4 日程度を想定。"
constraints:
  - "Live キー投入はレビュー後に実施し、Secrets 管理の手順に従う。"
  - "本番デプロイ前に最終レビューと承認を得る。"
  - "E2E テストは Stripe Test → Live の順に行う。"
api_changes:
  new: []
  updates: []
  deprecated: []
data_models:
  - "なし（既存モデルの検証のみ）。"
migrations:
  - "なし。"
rollout_plan:
  - "Stripe Test で総合テスト → Discord OAuth 実機テスト。"
  - "Live キー投入、Live Webhook 設定、試験的な少額寄附でスモーク。"
  - "Cloudflare Pages 本番デプロイ → Donors 掲載確認。"
rollback:
  - "重大障害時は Pages を前バージョンへロールバックし、Stripe Webhook を停止。"
  - "Live Key を無効化し、Test モードに戻す。"
test_plan:
  - "E2E: OAuth → Checkout（単発/定期）→ Thanks。"
  - "Webhook 再送、Donors 掲載更新、Consent 撤回のテスト。"
  - "UI 文言校閲、アクセシビリティ確認。"
observability:
  - "Cloudflare Logs と Stripe Dashboard の監視項目を Runbook に記載。"
  - "初期 1 週間は日次でログをレビューし、指標を記録する。"
security_privacy:
  - "Secrets の権限を最小化し、Live キーは管理者のみアクセス可。"
  - "リリース前にログへ個人情報が出力されていないことを確認。"
performance_budget:
  - "Pages Functions P95 < 500ms、Webhook P95 < 200ms をリリース判定基準とする。"
i18n_a11y:
  - "主要導線のスクリーンリーダ確認、aria-label の再確認。"
acceptance_criteria:
  - "受け入れ基準 (MVP Plan) を全て満たす E2E テスト結果が保存されている。"
  - "Live デプロイ完了後、Donors 掲載と寄附フローが正常に機能する。"
  - "運用 Runbook とサポート FAQ が最新化されている。"
owners:
  - "@donation-portal-core"
---

# Phase 6 — QA & Release 計画

## 1. 目的

MVP の機能群を総合テストし、本番環境へ安全にリリースする。リリース後 1 週間の安定運用を目指す。

## 2. 背景と前提

- Phase 1〜5 の機能が実装済みでテスト環境で動作している。
- Stripe/Discord の Test 設定から Live へ切り替える準備が整っている。
- CI/CD パイプラインが安定稼働している。

## 3. タスク詳細

1. **総合テスト**
   - 単発/定期寄附フローを Stripe Test モードで実施し、Webhook ログと Donors 更新を確認。
   - Consent 撤回→再同意の動作確認。UI 文言（対価なし/税控除なし）をチェック。
   - アクセシビリティテスト（キーボード操作、スクリーンリーダ簡易確認）。

2. **Live 切替とスモークテスト**
   - Secrets/Env Bindings を Live キーへ更新し、レビュー承認後にデプロイ。
   - Stripe Dashboard で Live Webhook を登録し、署名シークレットを設定。
   - 少額寄附でスモークテストし、Donors 掲載まで確認。

3. **ドキュメント整備と引き継ぎ**
   - Runbook、FAQ、サポートフロー、障害対応手順を更新。
   - リリースノート（CHANGELOG や docs/intent）に結果を記載。
   - 計画との差分や残課題を backlog に整理。

## 4. 成果物

- テスト結果レポート（Notion/Jira 等）とログアーカイブ。
- 更新された Runbook/FAQ/CHANGELOG。
- 本番デプロイ済みの Cloudflare Pages 環境。

## 5. リスクと対応

| リスク | 影響 | 対応策 |
| --- | --- | --- |
| Live キー設定ミス | 本番寄附失敗 | 2 人レビューとスモークテスト。 |
| Webhook 失敗 | 寄附情報不整合 | 切替直後は Slack/Email 監視を強化。 |
| UI 文言漏れ | コンプライアンス問題 | QA チェックリストに項目追加。 |

## 6. スケジュール

- Day 1: 総合テスト、アクセシビリティ確認。
- Day 2: Live キー投入、スモークテスト。
- Day 3-4: Runbook 更新、レビュー、正式リリース。

## 7. 完了条件

- Acceptance Criteria を満たし、リリース承認が得られる。
- リリース後の監視体制とバックアッププランが共有済み。

## 8. 関連タスク

- [DevOps-Chore-6](../../../../TODO.md#devops-chore-6)

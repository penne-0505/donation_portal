---
title: "Donors 掲示同意 Runbook (Draft)"
domain: "donation-portal"
status: "draft"
version: "0.1.0"
created: "2025-10-30"
updated: "2025-10-30"
related_issues: []
related_prs: []
references:
  - docs/reference/api/consent.md
  - docs/reference/api/donors.md
state: "paused"
hypothesis:
  - "Donors 掲示に関する問い合わせは 3 パターン（撤回依頼、再同意、掲示遅延）に集約できる"
options:
  - "docs/guide/operations/phase-06-qa-release.md に正式版 Runbook を統合する"
open_questions:
  - "Cloudflare Pages プレビューでのキャッシュクリア手順を自動化するか"
  - "本 Runbook を正式版へ昇格するタイミング（Phase 6 Runbook で暫定対応中）"
next_action_by: "support-lead"
review_due: "2025-11-15"
ttl_days: 30
---

# Donors 掲示同意 Runbook (Draft)

> **対象**: サポート担当・当番の運用メンバー
>
> **目的**: Donors 掲示の同意/撤回に関する問い合わせへ迅速に対応するための暫定フローをまとめる。

> **更新状況**: Phase 6 の正式運用手順は [`docs/guide/operations/phase-06-qa-release.md`](../../guide/operations/phase-06-qa-release.md) の「コミュニケーション & ドキュメント更新」で管理されています。本ドラフトは詳細フロー整理のたたき台として保持します。

## 1. 想定シナリオと一次回答

| シナリオ | 典型的な問い合わせ例 | 一次回答テンプレート |
| --- | --- | --- |
| 掲示を撤回したい | 「Donors から名前を消してください」 | 寄附ページ `/donate` から Discord ログイン → 「Donors 掲示を撤回する」ボタンをご案内。実装済みの `/donors` ページでも撤回可能。 |
| 掲示を再開したい | 「寄附後に再掲示したい」 | `/donate` ページでチェックボックスをオン → 保存（寄附フロー不要）で再掲示される旨を案内。 |
| 掲示が反映されない | 「撤回/同意が反映されない」 | 60 秒キャッシュの遅延を説明し、時間を空けても改善しない場合は Stripe Dashboard で metadata を確認する。 |

## 2. オペレーション手順

1. Stripe Dashboard > Customers で対象 Discord ID を検索 (`metadata.discord_id`).
2. `metadata.consent_public` が `true/false` で想定通りか確認。
3. 手動で更新した場合はメンバーへ報告し、問い合わせチケットに反映。
4. Donors API のレスポンス確認は `curl https://<deploy>/api/donors?limit=20&order=desc` を使用。

## 3. エスカレーション条件

- Stripe 側で Customer が存在しない場合（寄附未実施）
- API が `500 internal` を返し続ける場合（Stripe 側障害を疑う）
- Discord OAuth セッションが無効で再ログインできない場合（Phase 2 担当へ）

## 4. ログ確認ポイント

- Cloudflare Pages Functions のログで `[consent]` タグを検索するとエラー詳細が確認できる。
- Stripe Dashboard > Developers > Logs にも API 呼び出し履歴が残る。

## 5. FAQ（ドラフト）

- **Q. 掲示が 1 分以内に反映されないのは不具合？**
  - **A.** 最大 60 秒のキャッシュを挟んでいるため、時間をおいて再読み込みしてください。長時間解消しない場合はサポート宛に Discord ID を添えて連絡を依頼。
- **Q. Discord をログアウトした状態でも撤回できる？**
  - **A.** できません。OAuth セッションが必要なため、`/donate` か `/donors` で再ログイン後に操作してください。

## 6. 今後の TODO

- [ ] 本番運用開始前に Cloudflare Cache のクリア手順を確定。
- [ ] FAQ を Notion/ヘルプセンターへ転載。
- [ ] Stripe metadata を自動監査するジョブの要否を検討。

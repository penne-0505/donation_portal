---
title: "Donation Portal MVP Intent — Architecture and Delivery Phases"
domain: "donation-portal"
status: "active"
version: "1.0.0"
created: "2025-10-30"
updated: "2025-10-30"
related_issues: []
related_prs: []
references:
  - docs/draft/requirements_definition.md
  - docs/draft/interface_definition.md
  - docs/draft/impl_plan_v0.md
  - docs/draft/operations/consent-runbook.md
  - docs/plan/donation-portal/mvp/plan.md
  - docs/plan/donation-portal/phase-01-foundation/plan.md
  - docs/plan/donation-portal/phase-02-oauth/plan.md
  - docs/plan/donation-portal/phase-03-checkout/plan.md
  - docs/plan/donation-portal/phase-04-donors/plan.md
  - docs/plan/donation-portal/phase-05-webhook/plan.md
  - docs/plan/donation-portal/phase-06-qa/plan.md
supersedes:
  - docs/draft/requirements_definition.md
  - docs/draft/interface_definition.md
  - docs/draft/impl_plan_v0.md
  - docs/draft/operations/consent-runbook.md
  - docs/plan/donation-portal/mvp/plan.md
  - docs/plan/donation-portal/phase-01-foundation/plan.md
  - docs/plan/donation-portal/phase-02-oauth/plan.md
  - docs/plan/donation-portal/phase-03-checkout/plan.md
  - docs/plan/donation-portal/phase-04-donors/plan.md
  - docs/plan/donation-portal/phase-05-webhook/plan.md
  - docs/plan/donation-portal/phase-06-qa/plan.md
---

# Donation Portal MVP 実装意図

## 1. 背景

Discord コミュニティ向けの寄附ポータルは、寄附額や回数で特典を提供しないという強いコンプライアンス要件を前提に設計された。要件定義と I/F 仕様のドラフトでは、Cloudflare Pages をホスティング基盤に据え、Stripe Checkout を唯一の決済手段とすることで、初期コストと運用負荷を抑える方向性が確認されている。また、Donors 掲示に関する運用メモでは、Stripe Customer の metadata を単一の信頼ソースとして扱い、掲示同意を Web UI とサポート両面で整合させる必要性が整理されていた。（参照: docs/draft/requirements_definition.md）（参照: docs/draft/interface_definition.md）（参照: docs/draft/operations/consent-runbook.md）

## 2. 意思決定サマリー

1. **アーキテクチャ**: Cloudflare Pages（/donate, /thanks, /donors）と Pages Functions（OAuth、Checkout、Donors、Consent、Webhook、Health）によるサーバレス構成を採用する。ホスティングと CI/CD は GitHub Actions と Pages を組み合わせ、固定費ゼロを維持する。（参照: docs/draft/impl_plan_v0.md）（参照: docs/plan/donation-portal/phase-01-foundation/plan.md）
2. **データソース**: Stripe Customer metadata を SSOT とし、表示名と掲示同意の状態を `display_name`, `display_name_source=discord`, `discord_id`, `consent_public` に集約する。自前データベースは保持しない。（参照: docs/draft/interface_definition.md）（参照: docs/draft/requirements_definition.md）
3. **OAuth とセッション**: Discord OAuth の `identify` スコープで表示名と Discord ID を取得し、HMAC 署名付き Cookie で `state` と `sess` を最大 10 分間保持する。全 API は同一オリジンからのアクセスに限定する。（参照: docs/draft/interface_definition.md）（参照: docs/plan/donation-portal/phase-02-oauth/plan.md）
4. **決済フロー**: Stripe Checkout で単発（¥300）と定期（¥300 / ¥3,000）を提供し、成功時は `/thanks`、キャンセル時は `/donate` へ遷移させる。Webhook では `payment_intent.succeeded` と `invoice.paid` のみを処理し、早期 200 応答と event.id ベースの冪等化を徹底する。（参照: docs/draft/impl_plan_v0.md）（参照: docs/plan/donation-portal/phase-03-checkout/plan.md）（参照: docs/plan/donation-portal/phase-05-webhook/plan.md）
5. **Donors 掲示と運用**: `/api/donors` は `consent_public=true` の表示名のみを 60 秒キャッシュで配信し、`/api/consent` で掲示同意を更新する。サポート対応は Stripe Dashboard で metadata を確認し、異常時は Cloudflare Logs と Stripe Logs を照合する運用で統一する。（参照: docs/draft/operations/consent-runbook.md）（参照: docs/plan/donation-portal/phase-04-donors/plan.md）
6. **品質目標**: Webhook 処理は P50<2 分 / P95<5 分を守り、API 応答は 1 秒以内を目指す。UI には「対価なし」「税控除なし」を明記し、Secrets は Pages Env Bindings と GitHub Actions Secrets に限定して管理する。（参照: docs/draft/requirements_definition.md）（参照: docs/plan/donation-portal/phase-06-qa/plan.md）

## 3. 実装アプローチ

### 3.1 フェーズ別の進め方

| フェーズ | 目的 | 主な成果物 |
| --- | --- | --- |
| Phase 1 — Foundation | モノレポ構成、TypeScript/ESLint/Prettier 設定、CI パイプラインの整備 | `/src` `/functions` `/public` の初期構成、GitHub Actions で lint/test/build/deploy を自動化 | 
| Phase 2 — OAuth & Session | `/oauth/start` `/oauth/callback` と HMAC 署名 Cookie の実装、フロントの同意 UI 組み込み | OAuth 成功で `sess` Cookie を発行し、同意状態をフロントに反映 | 
| Phase 3 — Checkout | `POST /api/checkout/session` の Stripe 連携と価格バリデーション、Checkout 成功後のリダイレクト制御 | Checkout URL 生成と metadata 更新を完成させ、`/donate` から遷移 | 
| Phase 4 — Donors & Consent | `GET /api/donors` と `POST /api/consent` の整備、`/donors` UI と撤回フロー | consent_public 更新が 60 秒以内に反映される掲示体験 | 
| Phase 5 — Webhook & Observability | Stripe Webhook 署名検証と冪等化、Cloudflare Logs・Slack 通知の導線構築 | event.id 単位の重複抑止、早期 200 応答、簡易監視 | 
| Phase 6 — QA & Release | Stripe Test/Live での E2E、Discord OAuth 実機検証、Runbook 確認 | 受け入れ基準達成、Live キー投入、スモーク完了後に本番公開 |

各フェーズの詳細なタスクとリスクは元の plan ドキュメントに準拠するが、Intent としては上記の分割を維持し、前フェーズの acceptance criteria を満たしてから次へ進むことを必須とする。（参照: docs/plan/donation-portal/phase-01-foundation/plan.md）（参照: docs/plan/donation-portal/phase-02-oauth/plan.md）（参照: docs/plan/donation-portal/phase-03-checkout/plan.md）（参照: docs/plan/donation-portal/phase-04-donors/plan.md）（参照: docs/plan/donation-portal/phase-05-webhook/plan.md）（参照: docs/plan/donation-portal/phase-06-qa/plan.md）

### 3.2 セキュリティと運用設計

- **Secrets 管理**: Stripe / Discord / Cookie サイン鍵は Cloudflare Pages の Env Bindings に限定し、ローカルでは `.env.example` のテンプレートを配布する。CI では GitHub Secrets を利用し、ログへ漏洩させない。（参照: docs/plan/donation-portal/phase-01-foundation/plan.md）（参照: docs/plan/donation-portal/phase-05-webhook/plan.md）
- **Cookie ポリシー**: `Secure` / `HttpOnly` / `SameSite=Lax` を強制し、TTL 10 分経過後は再認証を求める。state 改ざんは `invalid_state` エラーで拒否する。（参照: docs/draft/interface_definition.md）（参照: docs/plan/donation-portal/phase-02-oauth/plan.md）
- **Webhook 運用**: Stripe からの再送に備えて event.id を短期キャッシュし、失敗時は Slack へ通知の上、再実行か Webhook 一時停止で対処する。Donors 掲示遅延はキャッシュ仕様として 60 秒以内で解消されることを案内する。（参照: docs/draft/operations/consent-runbook.md）（参照: docs/plan/donation-portal/phase-05-webhook/plan.md）

## 4. 採用しなかった選択肢

- **自前データベースの導入**: Stripe を SSOT とすることで構成を簡素化し、個人情報の保管責任を Stripe に委譲するため採用しない。（参照: docs/draft/requirements_definition.md）
- **Webhook での同期処理**: 初期負荷が低いため非同期ログのみとし、Queue や Durable Object を導入する案は Phase 2 以降の拡張に保留する。（参照: docs/draft/impl_plan_v0.md）（参照: docs/plan/donation-portal/phase-05-webhook/plan.md）
- **特典付き寄附メニュー**: コンプライアンス上のリスクが高く、要件定義で明確に非対象としたため検討から除外した。（参照: docs/draft/requirements_definition.md）

## 5. 影響とフォローアップ

- ドキュメント構造は intent を起点とし、ガイド/リファレンスは本意図を根拠に更新する。旧 draft/plan は参照用に残すが、`status: superseded` として扱い、将来的には `docs/archives/` への移送を実施する。
- Phase 6 で確認した Runbook の TODO（キャッシュクリア手順や Stripe metadata 監査の自動化）は別途 Issue 管理し、intent 更新時に再評価する。（参照: docs/draft/operations/consent-runbook.md）（参照: docs/plan/donation-portal/phase-06-qa/plan.md）

## 6. 承認と更新ポリシー

本意図は MVP リリースを完遂するまで `active` とし、以下の条件で更新または後継 intent を作成する。

1. Stripe 以外の決済手段を導入する場合（アーキテクチャ変更）。
2. Donors 掲示のデータソースを Stripe 以外に拡張する場合。
3. Webhook で同期処理や永続化を導入し、運用要件が変化する場合。

これらの分岐が発生した際は、本ドキュメントを `superseded` に更新し、新しい intent を追加する。

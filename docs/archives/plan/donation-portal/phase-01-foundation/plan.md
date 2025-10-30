---
title: "Donation Portal Phase 1 — Project Foundation 計画"
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
  - docs/draft/impl_plan_v0.md
  - docs/intent/donation-portal/mvp-architecture-and-phases.md
scope:
  - "Cloudflare Pages プロジェクトの基盤構築（ディレクトリ、ビルド、環境設定）を完了する。"
  - "TypeScript/ESLint/Prettier/Wrangler を設定し、Pages Functions/API 実装の土台を作る。"
  - "CI パイプライン（lint/test/build/deploy）の最小構成を整備する。"
non_goals:
  - "Stripe/Discord API との連携実装（後続フェーズで対応）。"
  - "UI 実装の細部最適化やデザイン反映。"
  - "監視・通知ワークフローの構築（Phase 5 以降）。"
requirements:
  functional:
    - "リポジトリに /src, /functions, /public, /scripts の基本構成を作成する。"
    - "Cloudflare Pages Functions のエントリポイントに対応するビルド設定を完了する。"
    - "GitHub Actions で lint/test/build/preview デプロイを実行するワークフローを用意する。"
  non_functional:
    - "ESLint/Prettier 設定を共有化し、CI に組み込む。"
    - "環境変数や Secrets を .env.example やドキュメントで明示し、誤設定を防ぐ。"
constraints:
  - "Cloudflare Pages のビルド仕様に従い、Functions ディレクトリ名を /functions に固定する。"
  - "Node.js バージョンは Pages 推奨バージョン（現行 18.x）を使用する。"
  - "開発者 1 名で 3 日程度の工数内に収まる作業範囲とする。"
api_changes:
  new: []
  updates: []
  deprecated: []
data_models:
  - "Stripe 連携なし。環境変数スキーマ (STRIPE_SECRET_KEY 等) を定義するに留める。"
migrations:
  - "なし。"
rollout_plan:
  - "リポジトリ初期コミットと共に基盤ファイルを追加し、CI が成功することを確認する。"
  - "Cloudflare Pages プロジェクトを作成し、GitHub 連携と main/dev ブランチの自動デプロイ設定を行う。"
rollback:
  - "CI ワークフローが不安定な場合はロールバックし、手動ビルドで代替する。"
  - "Cloudflare Pages プロジェクト設定は旧バージョンに戻すか再作成で対処する。"
test_plan:
  - "ESLint/Prettier のフォーマット検証。"
  - "TypeScript コンパイル（tsc --noEmit）による型検証。"
  - "GitHub Actions 上で各ジョブが成功することを確認。"
observability:
  - "CI 成功/失敗の通知を GitHub の標準通知で受け取り、追加連携は Phase 5 で検討。"
security_privacy:
  - "Secrets は Cloudflare Pages と GitHub Actions Secrets にのみ保存し、コードへ直書きしない。"
performance_budget:
  - "なし（基盤整備のみ）。"
i18n_a11y:
  - "UI 実装は後続フェーズのため対象外。"
acceptance_criteria:
  - "CI パイプラインが main/dev で成功し、lint/test/build が通る。"
  - "Cloudflare Pages にプレビューがデプロイされ、/donate 等のスタブページが表示される。"
  - "開発環境で Pages Functions のローカル実行が可能になる。"
owners:
  - "@donation-portal-core"
superseded_by: docs/intent/donation-portal/mvp-architecture-and-phases.md
---

# 本ドキュメントの位置付け

Phase 1 の意図と判断は `docs/intent/donation-portal/mvp-architecture-and-phases.md` に収録されています。本 Plan は経緯参照用として保管してください。

# Phase 1 — Project Foundation 計画

## 1. 目的

Cloudflare Pages 上で寄附ポータルを開発するための基本的なリポジトリ構成と CI/CD を整備し、後続フェーズで API や UI を安全に実装できる状態を作る。

## 2. 背景と前提

- MVP 全体の計画は `docs/plan/donation-portal/mvp/plan.md` に定義済み。
- 現時点では Stripe/Discord 連携や UI は未実装のため、基盤構築のみを対象とする。
- 開発チームは 1 名のフルスタックエンジニアを想定し、3 日以内に完了する。

## 3. タスク詳細

1. **リポジトリ構成とビルド設定**
   - `package.json`, `tsconfig.json`, `wrangler.toml`, `.eslintrc.cjs`, `.prettierrc` を整備。
   - `/src`, `/functions`, `/public`, `/scripts` に初期ファイルを配置し、各ディレクトリの責務を README に記載。
   - Cloudflare Workers 用型定義 (`@cloudflare/workers-types`) を導入。

2. **CI/CD パイプライン**
   - GitHub Actions で `lint`, `test`, `build`, `pages deploy` ジョブを定義。
   - main/dev PR 時に自動実行されるワークフローを作成し、Pages プレビューを有効にする。
   - Secrets 参照は stub とし、Phase 3 以降で実値を投入する準備を整える。

3. **ローカル開発環境**
   - Wrangler CLI を利用した開発サーバ起動手順を `docs/guide/development/setup.md`（予定）へ記録。
   - `.env.example` を作成し、必要な環境変数一覧を明示。

## 4. 成果物

- 初期構成済みのリポジトリと、CI が成功する GitHub Actions ワークフロー。
- Cloudflare Pages プロジェクト（プレビュー URL を含む）。
- 開発者向けセットアップ手順（ドラフト段階で構わない）。

## 5. リスクと対応

| リスク | 影響 | 対応策 |
| --- | --- | --- |
| Pages プロジェクト設定ミス | デプロイ失敗 | 設定手順をチェックリスト化し、1 日目に検証。 |
| Node バージョン不整合 | Functions 実行時エラー | `.nvmrc` および CI でバージョンを固定。 |
| Secrets 漏洩 | セキュリティリスク | .env をコミットせず、テンプレートとドキュメントのみ提供。 |

## 6. スケジュール

- Day 1: リポジトリ構成、lint/test 設定。
- Day 2: CI パイプライン構築、Cloudflare Pages 連携。
- Day 3: 動作確認、ドキュメント草案作成。

## 7. 完了条件

- Acceptance Criteria を満たし、main/dev ブランチへのマージ準備が整っている。
- 次フェーズで OAuth 実装を開始できる状態であることを確認する。

## 8. 関連タスク

- [DevOps-Chore-1](../../../../TODO.md#devops-chore-1)
